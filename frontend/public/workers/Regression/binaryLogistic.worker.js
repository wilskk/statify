// frontend/public/workers/Regression/binaryLogistic.worker.js

// PERHATIKAN PATH IMPORT INI!
// Path ini harus mengarah ke file .js yang dihasilkan wasm-pack tadi.
import init, {
  calculate_logistic_regression,
} from "./pkg/statify_logistic.js";

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === "RUN_ANALYSIS") {
    try {
      await init(); // Inisialisasi WASM

      // Panggil fungsi Rust
      // Payload harus berisi { y: [...], x: [[...], ...], config: {...} }
      const result = calculate_logistic_regression(payload);

      // Kirim hasil sukses
      self.postMessage({ type: "SUCCESS", result });
    } catch (error) {
      console.error("Worker Error:", error);
      self.postMessage({ type: "ERROR", error: error.toString() });
    }
  }
};
