import init, { plum_fit, plum_validate } from "./Ordinal/pkg/statify_ordinal.js";

let wasmReady = false;

async function ensureWasmReady(wasmPath) {
  if (wasmReady) return;
  const path = wasmPath || new URL("./Ordinal/pkg/statify_ordinal_bg.wasm", self.location.href).href;
  await init(path);
  wasmReady = true;
  console.log('wasm is ready')
}

function parseMaybeJson(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (err) {
      throw new Error("WASM returned invalid JSON string");
    }
  }
  return value;
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function buildPlumInput(payload, data, featureNames) {
  if (!payload || payload.procedure !== "PLUM" || payload.version !== "plum-v1") {
    throw new Error("Payload PLUM tidak valid.");
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Data kosong.");
  }

  const orderedCategories = payload?.response?.orderedCategories || [];
  if (!Array.isArray(orderedCategories) || orderedCategories.length < 2) {
    throw new Error("orderedCategories harus minimal 2.");
  }

  const catToIndex = new Map();
  orderedCategories.forEach((value, idx) => {
    catToIndex.set(value, idx + 1);
  });

  const resolvedFeatureNames = Array.isArray(featureNames) && featureNames.length > 0
    ? featureNames
    : (payload?.location?.variables || []);

  const encodedData = data.map((row) => {
    if (!row) throw new Error("Row data tidak valid.");

    const yRaw = row.y;
    const yEncoded = catToIndex.has(yRaw) ? catToIndex.get(yRaw) : yRaw;
    const y = Number(yEncoded);

    if (!Number.isFinite(y)) {
      throw new Error("Nilai y tidak valid.");
    }

    const x = Array.isArray(row.x) ? row.x.map(toNumber) : [];
    if (resolvedFeatureNames.length > 0 && x.length !== resolvedFeatureNames.length) {
      throw new Error("Panjang x tidak sesuai jumlah variabel location.");
    }

    const w = row.w !== undefined && row.w !== null ? toNumber(row.w) : 1;

    return { y, x, w };
  });

  return {
    payload,
    data: encodedData,
    featureNames: resolvedFeatureNames,
  };
}

function extractParameterEstimates(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.parameterEstimates)) return result.parameterEstimates;
  if (Array.isArray(result?.payload)) return result.payload;
  throw new Error("WASM result tidak memiliki parameterEstimates.");
}

self.onmessage = async (e) => {
  try {
    const { payload, data, featureNames, wasmPath } = e.data || {};

    const plumInput = buildPlumInput(payload, data, featureNames);

    await ensureWasmReady(wasmPath);

    if (typeof plum_validate === "function") {
      const rawValidation = await Promise.resolve(plum_validate(plumInput));
      const validation = parseMaybeJson(rawValidation);
      if (validation && validation.valid === false) {
        const errors = Array.isArray(validation.errors) ? validation.errors.join(" ") : "Input tidak valid.";
        throw new Error(errors);
      }
      console.log('plum input sudah valid')
    }

    const rawResult = await Promise.resolve(plum_fit(plumInput));
    console.log(rawResult);
    const result = parseMaybeJson(rawResult);
    console.log(result);

    if (result?.errors && Array.isArray(result.errors) && result.errors.length > 0) {
      throw new Error(result.errors.join(" "));
    }

    self.postMessage({ type: "SUCCESS", payload: result });
  } catch (err) {
    self.postMessage({ type: "ERROR", payload: err?.message || "Worker error" });
  }
};
