import init, { calculate_binary_logistic } from "./pkg/statify_logistic.js";

self.onmessage = async (event) => {
  // Kita kembalikan ke struktur input lama yang menggunakan ID
  const { dependentId, independentIds, data, variableDetails, config } =
    event.data;

  // Cek action jika ada, atau langsung jalan jika format lama
  if (event.data.action && event.data.action !== "run_binary_logistic") return;

  try {
    await init();

    // =================================================================
    // 1. DATA PREPARATION (LOGIKA LAMA ANDA - KARENA LEBIH ROBUST)
    // =================================================================

    // Helper: Ambil Value by ID (Ini kunci agar data terbaca benar)
    const getValue = (row, varId) => {
      const colIdx = variableDetails[varId]?.columnIndex;
      if (colIdx === undefined) return undefined;
      return row[colIdx];
    };

    // Filter Missing Values (Listwise Deletion)
    const allIds = [dependentId, ...independentIds];
    const cleanData = data.filter((row) => {
      return allIds.every((id) => {
        const val = getValue(row, id);
        return (
          val !== null &&
          val !== undefined &&
          val !== "" &&
          // Cek NaN hanya jika valenya number
          (typeof val === "string" ? true : !Number.isNaN(Number(val)))
        );
      });
    });

    if (cleanData.length === 0) {
      throw new Error(`Tidak ada data valid setelah filter missing values.`);
    }

    // Persiapan Y (Auto Encode 0/1)
    const rawY = cleanData.map((row) => getValue(row, dependentId));
    const { yVector, yMap } = processDependentVariable(rawY);

    // Persiapan X (Handle Categorical / Dummy Coding)
    const { xMatrix, xFeatureNames } = processCovariates(
      cleanData,
      independentIds,
      variableDetails,
      getValue
    );

    // =================================================================
    // 2. CONVERSION TO WASM FORMAT (FLATTENING)
    // =================================================================
    // Rust (nalgebra) butuh array 1 dimensi (flat), bukan array of arrays.

    const rows = xMatrix.length;
    const cols = xMatrix[0].length; // Jumlah kolom setelah dummy coding

    const xFlat = new Float64Array(rows * cols);
    const yFlat = new Float64Array(rows);

    // Flatten X Matrix (Row-Major)
    for (let i = 0; i < rows; i++) {
      yFlat[i] = yVector[i]; // Isi Y sekalian
      for (let j = 0; j < cols; j++) {
        xFlat[i * cols + j] = xMatrix[i][j];
      }
    }

    // =================================================================
    // 3. EXECUTE RUST WASM
    // =================================================================

    // Mapping config React -> Rust Config (Snake Case)
    const rustConfig = {
      max_iterations: config.maxIterations || 20,
      convergence_threshold: 1e-6,
      include_constant: config.includeConstant !== false,
      confidence_level: (config.ciLevel || 95) / 100.0,
      cutoff: config.cutoff || 0.5,
      method: config.method || "Enter", // Kirim metode
      // Parameter Stepwise (jika ada)
      p_entry: config.probEntry || 0.05,
      p_removal: config.probRemoval || 0.1,
    };

    // Panggil Fungsi Rust Baru
    const result = calculate_binary_logistic(
      xFlat, // Data X Flat
      rows,
      cols,
      yFlat, // Data Y Flat
      JSON.stringify(rustConfig)
    );

    // =================================================================
    // 4. POST PROCESSING (LABEL MAPPING)
    // =================================================================

    // Mapping Label Variables in Equation
    const variablesRaw = result.variables_in_equation || [];
    const enrichedVariables = variablesRaw.map((stat, index) => {
      let finalLabel = stat.label;

      // Logika Index Rust:
      // Jika Constant ada: Index 0 = Constant, Index 1 = Var 1
      // Jika Constant tidak ada: Index 0 = Var 1

      // Array xFeatureNames TIDAK punya Constant
      let featureIndex = -1;

      if (stat.label === "Constant") {
        return stat;
      }

      // Parse "Var X" dari Rust untuk dapat index aslinya jika perlu,
      // Tapi biasanya urutan output Rust = urutan input kolom.
      // Mari kita asumsikan urutannya linear.

      if (rustConfig.include_constant) {
        featureIndex = index - 1;
      } else {
        featureIndex = index;
      }

      if (featureIndex >= 0 && featureIndex < xFeatureNames.length) {
        finalLabel = xFeatureNames[featureIndex];
      }

      return { ...stat, label: finalLabel };
    });

    // Mapping Label Block 0 Variables (Not in Equation)
    // Urutan ini murni berdasarkan input kolom X
    const notInEqRaw = result.variables_not_in_equation || [];
    const enrichedNotInEq = notInEqRaw.map((stat, index) => {
      return {
        ...stat,
        label: xFeatureNames[index] || stat.label,
      };
    });

    const finalResult = {
      ...result,
      variables_in_equation: enrichedVariables,
      variables_not_in_equation: enrichedNotInEq,
      model_info: {
        y_encoding: yMap,
        n_samples: rows,
      },
    };

    self.postMessage({ type: "SUCCESS", payload: finalResult });
  } catch (error) {
    console.error("Worker Error:", error);
    self.postMessage({
      type: "ERROR",
      payload: error.message || "Terjadi kesalahan perhitungan.",
    });
  }
};

// --- HELPER FUNCTIONS (DARI KODE LAMA ANDA) ---

function processDependentVariable(rawY) {
  const uniqueVals = [...new Set(rawY)]
    .filter((v) => v !== undefined && v !== null && v !== "")
    .sort();
  if (uniqueVals.length < 2)
    throw new Error(
      `Variabel dependen 'Y' hanya memiliki ${
        uniqueVals.length
      } kategori valid: [${uniqueVals.join(", ")}]. Dibutuhkan minimal 2.`
    );

  // Mapping: 0 = Nilai Pertama, 1 = Nilai Kedua
  const map = {
    [uniqueVals[0]]: 0.0,
    [uniqueVals[1]]: 1.0,
  };

  const yVector = rawY.map((v) => map[v]);
  return { yVector, yMap: map };
}

function processCovariates(data, ids, details, getValueFn) {
  let xFeatureNames = [];

  // 1. Tentukan Schema (Mana Numeric, mana Kategori)
  const schema = ids.map((id) => {
    const detail = details[id];
    // Cek tipe measure.
    const isCategorical =
      detail?.measure === "nominal" || detail?.measure === "ordinal";

    if (isCategorical) {
      const rawValues = data.map((row) => getValueFn(row, id));
      const categories = [...new Set(rawValues)]
        .filter((v) => v !== null && v !== undefined && v !== "")
        .sort();

      // Dummy Coding (Reference = Last)
      const refCategory = categories[categories.length - 1];
      const dummyCategories = categories.filter((c) => c !== refCategory);

      return {
        type: "categorical",
        id: id,
        dummyCols: dummyCategories.map((cat) => ({
          val: cat,
          name: `${detail.name}(${cat})`,
        })),
      };
    } else {
      return { type: "numeric", id: id, name: detail?.name || `Var_${id}` };
    }
  });

  // 2. Generate Header Names
  schema.forEach((col) => {
    if (col.type === "numeric") {
      xFeatureNames.push(col.name);
    } else {
      col.dummyCols.forEach((d) => xFeatureNames.push(d.name));
    }
  });

  // 3. Buat Matrix (Array of Arrays)
  const xMatrix = data.map((row) => {
    let rowData = [];
    schema.forEach((col) => {
      const rawVal = getValueFn(row, col.id);

      if (col.type === "numeric") {
        rowData.push(Number(rawVal));
      } else {
        // Logic One-Hot
        col.dummyCols.forEach((dummy) => {
          rowData.push(rawVal == dummy.val ? 1.0 : 0.0);
        });
      }
    });
    return rowData;
  });

  return { xMatrix, xFeatureNames };
}
