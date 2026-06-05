/// <reference lib="webworker" />

// Store WASM instance
let wasmInitialized = false;
let wasmExports: any = null;

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

        // Initialize WASM
        await wasmModule.default(wasmUrl);
        wasmExports = wasmModule;
        wasmInitialized = true;

        console.log("[Multinomial Worker] WASM loaded successfully");
        return wasmExports;
    } catch (error) {
        console.error("[Multinomial Worker] Failed to load WASM:", error);
        throw new Error(`WASM loading failed: ${error}`);
    }
}

self.onmessage = async (event: MessageEvent) => {
    try {
        console.log("[Multinomial Worker] Message received");

        // Load WASM if not already loaded
        const wasm = await loadWasm();

        const { data, options } = event.data || {};
        console.log("[Multinomial Worker] Received data:", {
            dependentLength: data?.dependent?.length,
            independentCount: data?.independent?.length,
            options
        });

        const result = wasm.calculate_multinomial_logistic(data, options);
        console.log("[Multinomial Worker] Analysis complete:", result);

        self.postMessage({ type: "SUCCESS", payload: result });
    } catch (error: any) {
        console.error("[Multinomial Worker] Error:", error);
        const message = error?.message || String(error);
        self.postMessage({ type: "ERROR", error: message });
    }
};
