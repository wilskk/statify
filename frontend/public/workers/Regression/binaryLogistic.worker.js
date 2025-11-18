// frontend/public/workers/Regression/binaryLogistic.worker.js

// 1. Import WASM (Nanti kita buat file Rust-nya di langkah berikutnya)
// Saat ini path ini mungkin belum ada, tidak apa-apa, kita siapkan dulu.
import init, { run_binary_logistic } from "../../components/Modals/Analyze/Regression/BinaryLogistic/rust/pkg/wasm.js";

let wasmInitialized = false;

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === "RUN_ANALYSIS") {
    try {
      // 2. Inisialisasi WASM (Hanya sekali)
      if (!wasmInitialized) {
        await init();
        wasmInitialized = true;
      }

      // 3. Jalankan komputasi berat di sini (memanggil Rust)
      // Payload berisi: { data, options, variables }
      console.log("Worker: Memulai analisis logistic regression...", payload);
      
      const result = run_binary_logistic(payload);

      // 4. Kirim hasil balik ke Main Thread
      self.postMessage({ type: "SUCCESS", result });

    } catch (error) {
      console.error("Worker Error:", error);
      self.postMessage({ type: "ERROR", error: error.message });
    }
  }
};