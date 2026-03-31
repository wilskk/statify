/**
 * Factor Analysis Web Worker
 * 
 * Menjalankan komputasi analisis faktor (WASM) di thread terpisah
 * agar tidak memblokir main thread UI saat memproses data besar.
 * 
 * Supported actions:
 *   - "run_factor_analysis": Menjalankan full factor analysis via WASM
 * 
 * Message format:
 *   {
 *     action: "run_factor_analysis",
 *     slicedDataForTarget: any[],
 *     slicedDataForValue: any[],
 *     varDefsForTarget: any[][],
 *     varDefsForValue: any[][],
 *     configData: object,
 *   }
 * 
 * Response format:
 *   SUCCESS: { type: "SUCCESS", payload: { results, errors }, action }
 *   ERROR:   { type: "ERROR",   payload: string, action }
 *   PROGRESS:{ type: "PROGRESS", payload: { stage, message, percent }, action }
 */

import init, { FactorAnalysis } from "./pkg/wasm.js";

// Pantau apakah WASM telah diinisialisasi (hindari inisialisasi berlebihan saat digunakan kembali dari pool)
let wasmInitialized = false;

self.onmessage = async (event) => {
  const {
    action,
    slicedDataForTarget,
    slicedDataForValue,
    varDefsForTarget,
    varDefsForValue,
    configData,
  } = event.data;

  console.log("[FactorAnalysis Worker] Received action:", action);

  const validActions = ["run_factor_analysis"];
  if (!action || !validActions.includes(action)) {
    self.postMessage({
      type: "ERROR",
      payload: `Unknown action: ${action}`,
      action,
    });
    return;
  }

  try {
    // =================================================================
    // 1. Inisialisasi WASM  
    // =================================================================
    if (!wasmInitialized) {
      self.postMessage({
        type: "PROGRESS",
        payload: { stage: "init", message: "Initializing WASM module...", percent: 5 },
        action,
      });
      await init();
      wasmInitialized = true;
      console.log("[FactorAnalysis Worker] WASM initialized successfully.");
    }

    switch (action) {
      case "run_factor_analysis": {
        // =================================================================
        // 2. Validasi  
        // =================================================================
        if (!slicedDataForTarget || slicedDataForTarget.length === 0) {
          throw new Error("No target data provided to worker.");
        }

        if (!configData) {
          throw new Error("No configuration data provided to worker.");
        }

        self.postMessage({
          type: "PROGRESS",
          payload: {
            stage: "computing",
            message: "Running Factor Analysis computation...",
            percent: 20,
          },
          action,
        });

        // =================================================================
        // 3. Komputasi WASM
        // =================================================================
        console.log("[FactorAnalysis Worker] Creating FactorAnalysis instance...");
        console.log("[FactorAnalysis Worker] slicedDataForTarget vars:", slicedDataForTarget?.length);
        console.log("[FactorAnalysis Worker] slicedDataForTarget[0] length:", slicedDataForTarget?.[0]?.length);
        console.log("[FactorAnalysis Worker] configData:", JSON.stringify(configData, null, 2));

        const factor = new FactorAnalysis(
          slicedDataForTarget,
          slicedDataForValue,
          varDefsForTarget,
          varDefsForValue,
          configData
        );

        self.postMessage({
          type: "PROGRESS",
          payload: {
            stage: "formatting",
            message: "Retrieving formatted results...",
            percent: 70,
          },
          action,
        });

        const results = factor.get_formatted_results();
        const errors = factor.get_all_errors();

        console.log("[FactorAnalysis Worker] WASM results obtained.");
        console.log("[FactorAnalysis Worker] WASM errors:", errors);

        // Free WASM memory
        factor.free();

        self.postMessage({
          type: "PROGRESS",
          payload: {
            stage: "done",
            message: "Factor Analysis completed.",
            percent: 100,
          },
          action,
        });

        // =================================================================
        // 4. KIRIM HASIL KEMBALI
        // =================================================================
        self.postMessage({
          type: "SUCCESS",
          payload: {
            results,
            errors,
          },
          action,
        });

        break;
      }
    }
  } catch (error) {
    console.error("[FactorAnalysis Worker] Error:", error);
    self.postMessage({
      type: "ERROR",
      payload: error.message || "An unexpected error occurred in the Factor Analysis worker.",
      action,
    });
  }
};
