self.onmessage = async (event) => {
  try {
    console.log("Worker started");

    // IMPORT YANG BENAR (JS BINDING WASM)
    const wasm = await import("/workers/Classify/Nearest-Neighbor/pkg/statify_knn.js");

    await wasm.default(); // init WASM
    console.log("WASM loaded");

    const result = wasm.knn_predict();
    console.log("Result:", result);

    self.postMessage({ result });
  } catch (err) {
    console.error("Worker error:", err);
    self.postMessage({ error: err.message });
  }
};
