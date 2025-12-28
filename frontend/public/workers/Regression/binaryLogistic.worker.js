import init, { calculate_binary_logistic } from "./pkg/statify_logistic.js";

self.onmessage = async (event) => {
  const { action, data, config, dependentId, independentIds, variableDetails } =
    event.data;

  if (action && action !== "run_binary_logistic") return;

  try {
    await init();

    // =================================================================
    // 0. FIX PARSING CONFIG
    // =================================================================
    let configObj = config;
    if (typeof config === "string") {
      try {
        configObj = JSON.parse(config);
      } catch (e) {
        console.error("Gagal parsing config di worker:", e);
        throw new Error("Konfigurasi tidak valid");
      }
    }

    // =================================================================
    // 1. DATA PREPARATION
    // =================================================================

    const getValue = (row, varId) => {
      const colIdx = variableDetails[varId]?.columnIndex;
      if (colIdx === undefined) return undefined;
      return row[colIdx];
    };

    const allIds = [dependentId, ...independentIds];
    const cleanData = data.filter((row) => {
      return allIds.every((id) => {
        const val = getValue(row, id);
        return (
          val !== null &&
          val !== undefined &&
          val !== "" &&
          (typeof val === "string" ? true : !Number.isNaN(Number(val)))
        );
      });
    });

    if (cleanData.length === 0) {
      throw new Error(`Tidak ada data valid setelah filter missing values.`);
    }

    // Persiapan Y
    const rawY = cleanData.map((row) => getValue(row, dependentId));
    const { yVector, yMap } = processDependentVariable(rawY);

    // Persiapan X
    const { xMatrix, xFeatureNames } = processCovariates(
      cleanData,
      independentIds,
      variableDetails,
      getValue
    );

    // =================================================================
    // 2. CONVERSION TO WASM FORMAT (FLATTENING)
    // =================================================================
    const rows = xMatrix.length;
    const cols = xMatrix[0].length;

    const xFlat = new Float64Array(rows * cols);
    const yFlat = new Float64Array(rows);

    for (let i = 0; i < rows; i++) {
      yFlat[i] = yVector[i];
      for (let j = 0; j < cols; j++) {
        xFlat[i * cols + j] = xMatrix[i][j];
      }
    }

    // =================================================================
    // 3. EXECUTE RUST WASM
    // =================================================================

    // Mapping ulang menggunakan configObj (hasil parsing)
    const rustConfig = {
      // [MODIFIKASI 1]: Set dependent_index ke 'cols' agar tidak tabrakan dengan index X (0..cols-1)
      dependent_index: cols,
      independent_indices: Array.from({ length: cols }, (_, i) => i),

      // Parameter Algoritma
      max_iterations: configObj.maxIterations || 20,
      convergence_threshold: 1e-6,
      include_constant: configObj.includeConstant !== false,
      confidence_level:
        configObj.confidenceLevel > 1
          ? configObj.confidenceLevel / 100.0
          : configObj.confidenceLevel || 0.95,
      cutoff: configObj.cutoff || 0.5,
      method: configObj.method || "Enter",
      p_entry: configObj.probEntry || configObj.pEntry || 0.05,
      p_removal: configObj.probRemoval || configObj.pRemoval || 0.1,
    };

    console.log("Worker Sending Config to WASM:", JSON.stringify(rustConfig));

    const result = await calculate_binary_logistic(
      xFlat,
      rows,
      cols,
      yFlat,
      JSON.stringify(rustConfig)
    );

    // =================================================================
    // [MODIFIKASI 2]: CLEANUP GHOST STEPS
    // Menghapus Step 1 jika isinya sama persis dengan Step 0 (Kasus Forward gagal entry)
    // =================================================================
    if (result.history && result.history.length > 1) {
      const lastIdx = result.history.length - 1;
      const lastStep = result.history[lastIdx];
      const prevStep = result.history[lastIdx - 1];

      // Jika jumlah variabel di step terakhir sama dengan step sebelumnya
      // Artinya tidak ada variabel baru yang masuk/keluar
      if (
        lastStep.variables_in_equation.length ===
        prevStep.variables_in_equation.length
      ) {
        // Hapus step terakhir dari history
        result.history.pop();

        // Kembalikan state utama ke step sebelumnya agar sinkron
        result.variables_in_equation = prevStep.variables_in_equation;
        result.variables_not_in_equation = prevStep.variables_not_in_equation;
        if (result.model_info) {
          result.model_info.step_number = prevStep.step;
        }
      }
    }

    // =================================================================
    // 4. POST PROCESSING
    // =================================================================

    const variablesRaw = result.variables_in_equation || [];
    const enrichedVariables = variablesRaw.map((stat, index) => {
      let finalLabel = stat.label;
      let featureIndex = -1;

      if (stat.label === "Constant") {
        return stat;
      }

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

    const notInEqRaw = result.variables_not_in_equation || [];
    const enrichedNotInEq = notInEqRaw.map((stat) => {
      let originalLabel = stat.label;
      const match = stat.label.match(/Var_(\d+)/);
      if (match) {
        const idx = parseInt(match[1]);
        if (xFeatureNames[idx]) {
          originalLabel = xFeatureNames[idx];
        }
      }
      return {
        ...stat,
        label: originalLabel,
      };
    });

    const finalResult = {
      ...result,
      method_used: rustConfig.method,
      variables_in_equation: enrichedVariables,
      variables_not_in_equation: enrichedNotInEq,
      model_info: {
        y_encoding: yMap,
        n_samples: rows,
        // Pastikan step number sinkron jika ada history
        step_number:
          result.history && result.history.length > 0
            ? result.history[result.history.length - 1].step
            : 0,
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

// --- HELPER FUNCTIONS ---

function processDependentVariable(rawY) {
  const uniqueVals = [...new Set(rawY)]
    .filter((v) => v !== undefined && v !== null && v !== "")
    .sort();

  // Auto-detection untuk data biner (bisa angka 0/1, string Yes/No, dll)
  if (uniqueVals.length < 2)
    throw new Error(
      `Variabel dependen butuh minimal 2 kategori unik. Ditemukan: ${uniqueVals.length}`
    );

  // Map nilai pertama (secara urutan sort) ke 0, nilai kedua ke 1
  const map = {
    [uniqueVals[0]]: 0.0,
    [uniqueVals[1]]: 1.0,
  };

  const yVector = rawY.map((v) => map[v]);
  return { yVector, yMap: map };
}

function processCovariates(data, ids, details, getValueFn) {
  let xFeatureNames = [];
  const schema = ids.map((id) => {
    const detail = details[id];
    const isCategorical =
      detail?.measure === "nominal" || detail?.measure === "ordinal";

    if (isCategorical) {
      const rawValues = data.map((row) => getValueFn(row, id));
      const categories = [...new Set(rawValues)]
        .filter((v) => v !== null && v !== undefined && v !== "")
        .sort();

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

  schema.forEach((col) => {
    if (col.type === "numeric") {
      xFeatureNames.push(col.name);
    } else {
      col.dummyCols.forEach((d) => xFeatureNames.push(d.name));
    }
  });

  const xMatrix = data.map((row) => {
    let rowData = [];
    schema.forEach((col) => {
      const rawVal = getValueFn(row, col.id);
      if (col.type === "numeric") {
        rowData.push(Number(rawVal));
      } else {
        col.dummyCols.forEach((dummy) => {
          rowData.push(rawVal == dummy.val ? 1.0 : 0.0);
        });
      }
    });
    return rowData;
  });

  return { xMatrix, xFeatureNames };
}
