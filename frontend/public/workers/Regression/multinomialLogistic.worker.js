/// <reference lib="webworker" />

// Store WASM instance
let wasmInitialized = false;
let wasmExports = null;

// Load WASM module
async function loadWasm() {
    if (wasmInitialized) return wasmExports;

    try {
        console.log("[Multinomial Worker] Loading WASM module...");

        // Get the base URL for the worker
        const baseUrl = new URL('.', self.location.href).href;
        const wasmUrl = new URL('./pkg/statify_multinomial_bg.wasm', baseUrl).href;
        const jsUrl = new URL('./pkg/statify_multinomial.js', baseUrl).href;

        console.log("[Multinomial Worker] WASM URL:", wasmUrl);
        console.log("[Multinomial Worker] JS URL:", jsUrl);

        // Import the JS glue code
        const wasmModule = await import(/* webpackIgnore: true */ jsUrl);

        // Initialize WASM (new wasm-bindgen signature)
        await wasmModule.default({ module_or_path: wasmUrl });
        wasmExports = wasmModule;
        wasmInitialized = true;

        console.log("[Multinomial Worker] WASM loaded successfully");
        return wasmExports;
    } catch (error) {
        console.error("[Multinomial Worker] Failed to load WASM:", error);
        throw new Error(`WASM loading failed: ${error}`);
    }
}

self.onmessage = async (event) => {
    try {
        console.log("[Multinomial Worker] Message received");

        // Load WASM if not already loaded
        const wasm = await loadWasm();

        const { data, options } = event.data || {};

        // DEBUG: Log input data
        console.log("[Multinomial Worker] Input Data Debug:", {
            dependentLength: data?.dependent?.length,
            dependentSample: data?.dependent?.slice(0, 5),
            independentCount: data?.independent?.length,
            weightsLength: data?.weights?.length,
            weightsSample: data?.weights?.slice(0, 10),
            weightsSum: data?.weights?.reduce((a, b) => a + b, 0),
            variableNames: data?.variableNames,
            options
        });
        console.log("[Multinomial Worker] Input Data JSON:", JSON.stringify({
            dependentLength: data?.dependent?.length,
            dependentSample: data?.dependent?.slice(0, 5),
            independentCount: data?.independent?.length,
            weightsLength: data?.weights?.length,
            weightsSample: data?.weights?.slice(0, 10),
            weightsSum: data?.weights?.reduce((a, b) => a + b, 0),
            variableNames: data?.variableNames,
            options
        }));

        const result = wasm.calculate_multinomial_logistic(data, options);

        // DEBUG: Log result
        console.log("[Multinomial Worker] Result Debug:", {
            logLikelihood: result?.logLikelihood,
            nullLogLikelihood: result?.nullLogLikelihood,
            chiSquare: result?.chiSquare,
            df: result?.df,
            pValueModel: result?.pValueModel,
            pseudoRSquare: result?.pseudoRSquare,
            coefficientsShape: [result?.coefficients?.length, result?.coefficients?.[0]?.length],
            neg2LL_final: -2 * (result?.logLikelihood ?? NaN),
            neg2LL_null: -2 * (result?.nullLogLikelihood ?? NaN)
        });
        console.log("[Multinomial Worker] Result JSON:", JSON.stringify({
            logLikelihood: result?.logLikelihood,
            nullLogLikelihood: result?.nullLogLikelihood,
            chiSquare: result?.chiSquare,
            df: result?.df,
            pValueModel: result?.pValueModel,
            neg2LL_final: -2 * (result?.logLikelihood ?? NaN),
            neg2LL_null: -2 * (result?.nullLogLikelihood ?? NaN)
        }));

        console.log("[Multinomial Worker] Analysis complete:", result);

        self.postMessage({ type: "SUCCESS", payload: result });
    } catch (error) {
        console.error("[Multinomial Worker] Error:", error);
        const message = error?.message || String(error);
        self.postMessage({ type: "ERROR", error: message });
    }
};