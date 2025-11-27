import init, { calculate_binary_logistic } from "./pkg/statify_logistic.js";

self.onmessage = async (event) => {
  const { dependentId, independentIds, data, variableDetails, config } =
    event.data;

  try {
    await init();

    // --- 1. Helper: Ambil Value by ID ---
    const getValue = (row, varId) => {
      const colIdx = variableDetails[varId]?.columnIndex;
      if (colIdx === undefined) return undefined;
      return row[colIdx];
    };

    // --- 2. Filter Missing Values (Listwise) ---
    const allIds = [dependentId, ...independentIds];
    const cleanData = data.filter((row) => {
      return allIds.every((id) => {
        const val = getValue(row, id);
        return (
          val !== null &&
          val !== undefined &&
          val !== "" &&
          !Number.isNaN(Number(val))
        );
      });
    });

    if (cleanData.length === 0) {
      throw new Error(
        `Tidak ada data valid. Total baris mentah: ${data.length}. Cek missing values.`
      );
    }

    // --- 3. Persiapan Variabel Dependen (Y) ---
    const rawY = cleanData.map((row) => getValue(row, dependentId));
    const { yVector, yMap } = processDependentVariable(rawY);

    // --- 4. Persiapan Variabel Independen (X) ---
    const { xMatrix, xFeatureNames } = processCovariates(
      cleanData,
      independentIds,
      variableDetails,
      getValue
    );

    // --- 5. Konfigurasi Rust ---
    const rustConfig = {
      max_iterations: config.maxIterations || 20,
      convergence_threshold: config.tol || 1e-6,
      include_constant: config.includeConstant !== false,
      confidence_level: 0.95,
      cutoff: config.cutoff || 0.5, // Tambahkan cutoff
    };

    // --- 6. Panggil WASM ---
    // Pastikan xMatrix dikirim sebagai Array of Arrays
    const result = calculate_binary_logistic(xMatrix, yVector, rustConfig);

    // --- 7. Post-Processing (Mapping Label) ---

    // A. Mapping untuk "Variables in Equation" (Block 1)
    const variablesRaw = result.variables_in_equation || [];

    const enrichedVariables = variablesRaw.map((stat, index) => {
      let finalLabel = stat.label;

      // Logic Mapping Nama Asli untuk Variabel yang SUDAH masuk model
      if (rustConfig.include_constant) {
        // Index 0 = Constant. Index 1 = Variabel Pertama
        if (index > 0) {
          finalLabel = xFeatureNames[index - 1] || finalLabel;
        }
      } else {
        finalLabel = xFeatureNames[index] || finalLabel;
      }

      return {
        ...stat,
        label: finalLabel,
      };
    });

    // B. (BARU) Mapping untuk "Variables NOT in Equation" (Block 0)
    // Variabel ini adalah prediktor yang belum masuk, urutannya sama persis dengan xFeatureNames
    const notInEqRaw = result.variables_not_in_equation || [];

    const enrichedNotInEq = notInEqRaw.map((stat, index) => {
      return {
        ...stat,
        // Karena ini belum masuk model (dan Constant sudah ada di Block 0 terpisah),
        // maka indexnya langsung mapping 1-on-1 dengan xFeatureNames
        label: xFeatureNames[index] || stat.label,
      };
    });

    // Bentuk hasil akhir
    const finalResult = {
      ...result,
      variables_in_equation: enrichedVariables,
      variables_not_in_equation: enrichedNotInEq, // <--- Tambahkan field ini
      model_info: {
        y_encoding: yMap,
        n_samples: cleanData.length,
      },
    };

    self.postMessage({ type: "SUCCESS", payload: finalResult });
  } catch (error) {
    console.error("Worker Calculation Error:", error);
    self.postMessage({
      type: "ERROR",
      payload: error.message || "Terjadi kesalahan perhitungan.",
    });
  }
};

// --- HELPER FUNCTIONS ---

function processDependentVariable(rawY) {
  const uniqueVals = [...new Set(rawY)].sort();
  if (uniqueVals.length < 2)
    throw new Error(`Variabel dependen harus memiliki minimal 2 nilai unik.`);

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
    // Cek tipe measure. Default ke 'scale' jika tidak ada info.
    const isCategorical =
      detail?.measure === "nominal" || detail?.measure === "ordinal";

    if (isCategorical) {
      const rawValues = data.map((row) => getValueFn(row, id));
      const categories = [...new Set(rawValues)].sort();

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

  // 3. Buat Matrix
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
