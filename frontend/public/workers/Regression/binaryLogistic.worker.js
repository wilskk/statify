import init, { calculate_logistic_regression } from "./pkg/statify_logistic.js";

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === "RUN_ANALYSIS") {
    try {
      await init();
      console.log("Payload received in Worker:", payload);
      // Cek apakah payload.x adalah array of arrays
      if (payload.x && payload.x.length > 0 && !Array.isArray(payload.x[0])) {
        throw new Error(
          "Format Data Salah: 'x' harus berupa Matriks (Array of Arrays)."
        );
      }
      const result = calculate_logistic_regression(payload);
      self.postMessage({ type: "SUCCESS", result });
    } catch (error) {
      console.error("Worker Error:", error);
      self.postMessage({ type: "ERROR", error: error.toString() });
    }
  }
};
