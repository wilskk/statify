// DEBUG biar yakin worker ke-load
console.log("WORKER FILE LOADED");

import init, { KNNAnalysis } from "/workers/Classify/NearestNeighbor/pkg/wasm.js";

self.onmessage = async (e) => {
  console.log("WORKER GOT MESSAGE");

  const {
    target,
    features,
    focal,
    caseData,
    targetDefs,
    featureDefs,
    focalDefs,
    caseDefs,
    config
  } = e.data;

  try {
    // init WASM (WAJIB kasih path biar ga error)
    await init("/workers/Classify/NearestNeighbor/pkg/wasm_bg.wasm");

    console.log("WASM INITIALIZED");

    const knn = new KNNAnalysis(
      target,
      features,
      focal,
      caseData,
      targetDefs,
      featureDefs,
      focalDefs,
      caseDefs,
      config
    );

    const result = knn.get_formatted_results();

    console.log("KNN DONE");

    self.postMessage({
      success: true,
      data: result
    });

  } catch (err) {
    console.error("WORKER ERROR:", err);

    self.postMessage({
      success: false,
      error: err instanceof Error ? err.message : String(err)
    });
  }
};