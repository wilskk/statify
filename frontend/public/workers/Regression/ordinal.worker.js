/**
 * ORDINAL WORKER PAYLOAD CONTRACT
 *
 * Debug checklist:
 * 1. MAIN: cek [ORDINAL][MAIN][PAYLOAD_TO_WORKER]
 * 2. WORKER: cek [ORDINAL][WORKER][RECEIVED] & [ORDINAL][WORKER][PAYLOAD_VALID]
 * 3. RUST: cek hasil plum_validate (missing field => struct Rust belum sama)
 * 4. WORKER RESULT: cek [ORDINAL][WORKER][NORMALIZED_RESULT]
 * 5. MAIN FORMATTER: cek [ORDINAL][MAIN][FORMATTED_SECTIONS]
 */

import init, { plum_fit, plum_validate } from "./Ordinal/pkg/statify_ordinal.js";

let wasmReady = false;

function postSuccess(result) {
  self.postMessage({ type: "SUCCESS", payload: result });
  console.log("[ORDINAL][WORKER][SUCCESS_SENT]");
}

function postError(error, stage, details) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[ORDINAL][WORKER][ERROR]", {
    stage,
    message,
    details,
  });
  self.postMessage({
    type: "ERROR",
    payload: {
      message,
      stage,
      details,
    },
  });
}

async function ensureWasmReady(wasmPath) {
  if (wasmReady) return;
  const path = wasmPath || new URL("./Ordinal/pkg/statify_ordinal_bg.wasm", self.location.href).href;
  await init(path);
  wasmReady = true;
  console.log("[ORDINAL][WORKER][WASM_READY]");
}

function parseMaybeJson(value, stage) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (err) {
      throw new Error(`WASM returned invalid JSON string at ${stage}.`);
    }
  }
  return value;
}

function toFiniteNumber(value, context) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`${context} is not a finite number.`);
  }
  return num;
}

function validateMainPlumPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload PLUM tidak valid: payload bukan object.");
  }
  if (payload.analysisType !== "ORDINAL_REGRESSION_PLUM") {
    throw new Error("Payload PLUM tidak valid: analysisType harus ORDINAL_REGRESSION_PLUM.");
  }
  if (payload.procedure !== "PLUM") {
    throw new Error("Payload PLUM tidak valid: procedure harus PLUM.");
  }
  if (payload.version !== "plum-v1") {
    throw new Error("Payload PLUM tidak valid: version harus plum-v1.");
  }

  const responseVector = payload?.response?.responseVector;
  const responseCategories = payload?.response?.responseCategories;
  if (!Array.isArray(responseVector) || responseVector.length === 0) {
    throw new Error("Payload PLUM tidak valid: missing response.responseVector.");
  }
  if (!Array.isArray(responseCategories) || responseCategories.length < 2) {
    throw new Error("Payload PLUM tidak valid: response.responseCategories minimal 2.");
  }
  if (payload?.response?.categoryCount !== responseCategories.length) {
    throw new Error("Payload PLUM tidak valid: response.categoryCount mismatch.");
  }

  const locationDesignMatrix = payload?.locationModel?.locationDesignMatrix;
  const locationTermNames = payload?.locationModel?.locationTermNames;
  if (!Array.isArray(locationDesignMatrix) || locationDesignMatrix.length === 0) {
    throw new Error("Payload PLUM tidak valid: locationDesignMatrix kosong.");
  }
  if (!Array.isArray(locationTermNames) || locationTermNames.length === 0) {
    throw new Error("Payload PLUM tidak valid: locationTermNames kosong.");
  }

  if (locationDesignMatrix.length !== responseVector.length) {
    throw new Error("Payload PLUM tidak valid: jumlah baris X != panjang responseVector.");
  }

  const expectedColumns = locationDesignMatrix[0].length;
  if (expectedColumns !== locationTermNames.length) {
    throw new Error("Payload PLUM tidak valid: jumlah kolom X != jumlah locationTermNames.");
  }

  locationDesignMatrix.forEach((row, rowIndex) => {
    if (!Array.isArray(row) || row.length !== expectedColumns) {
      throw new Error(`Payload PLUM tidak valid: row length mismatch at row ${rowIndex}.`);
    }
    row.forEach((value, colIndex) => {
      toFiniteNumber(value, `locationDesignMatrix[${rowIndex}][${colIndex}]`);
    });
  });

  responseVector.forEach((value, index) => {
    const numeric = toFiniteNumber(value, `responseVector[${index}]`);
    const upper = responseCategories.length;
    if (numeric < 1 || numeric > upper) {
      throw new Error("responseVector contains values outside 1..J.");
    }
  });

  const scaleEnabled = Boolean(payload?.scaleModel?.enabled);
  const scaleDesignMatrix = payload?.scaleModel?.scaleDesignMatrix || [];
  const scaleTermNames = payload?.scaleModel?.scaleTermNames || [];
  if (scaleEnabled) {
    if (!Array.isArray(scaleDesignMatrix) || scaleDesignMatrix.length === 0) {
      throw new Error("Payload PLUM tidak valid: scaleDesignMatrix kosong.");
    }
    if (!Array.isArray(scaleTermNames) || scaleTermNames.length === 0) {
      throw new Error("Payload PLUM tidak valid: scaleTermNames kosong.");
    }
    if (scaleDesignMatrix.length !== responseVector.length) {
      throw new Error("Payload PLUM tidak valid: jumlah baris Z != panjang responseVector.");
    }
    const expectedScaleCols = scaleDesignMatrix[0].length;
    if (expectedScaleCols !== scaleTermNames.length) {
      throw new Error("Payload PLUM tidak valid: jumlah kolom Z != jumlah scaleTermNames.");
    }
    scaleDesignMatrix.forEach((row, rowIndex) => {
      if (!Array.isArray(row) || row.length !== expectedScaleCols) {
        throw new Error(`Payload PLUM tidak valid: scale row length mismatch at row ${rowIndex}.`);
      }
      row.forEach((value, colIndex) => {
        toFiniteNumber(value, `scaleDesignMatrix[${rowIndex}][${colIndex}]`);
      });
    });
  }

  const estimation = payload?.estimationOptions || {};
  if (!(estimation.maxIterations > 0)) {
    throw new Error("Payload PLUM tidak valid: maxIterations harus > 0.");
  }
  if (estimation.maxStepHalving < 0) {
    throw new Error("Payload PLUM tidak valid: maxStepHalving harus >= 0.");
  }
  if (!(estimation.parameterTolerance > 0)) {
    throw new Error("Payload PLUM tidak valid: parameterTolerance harus > 0.");
  }
  if (!(estimation.logLikelihoodTolerance >= 0)) {
    throw new Error("Payload PLUM tidak valid: logLikelihoodTolerance harus >= 0.");
  }
  if (!(estimation.singularityTolerance > 0)) {
    throw new Error("Payload PLUM tidak valid: singularityTolerance harus > 0.");
  }
  if (!(estimation.confidenceLevel >= 50 && estimation.confidenceLevel <= 99.99)) {
    throw new Error("Payload PLUM tidak valid: confidenceLevel harus 50..99.99.");
  }
  if (estimation.linkFunction !== "Logit") {
    throw new Error("Link function selain Logit belum didukung oleh WASM.");
  }

  const metadata = payload?.metadata || {};
  if (typeof metadata.totalRows !== "number" || typeof metadata.validRows !== "number") {
    throw new Error("Payload PLUM tidak valid: metadata rows missing.");
  }
}

function normalizeParameterEstimate(row, index) {
  if (!row || typeof row !== "object") {
    return {
      parameter: `param_${index + 1}`,
      estimate: Number.NaN,
      standardError: null,
      waldStatistic: null,
      degreesOfFreedom: 1,
      significance: null,
      confidenceIntervalLower: null,
      confidenceIntervalUpper: null,
    };
  }

  const estimate = typeof row.estimate === "number" ? row.estimate : Number(row.estimate);
  const stdError = typeof row.stdError === "number"
    ? row.stdError
    : (typeof row.std_error === "number" ? row.std_error : null);
  const waldStatistic = typeof row.wald === "number" ? row.wald : (typeof row.waldStatistic === "number" ? row.waldStatistic : null);
  const significance = typeof row.sig === "number" ? row.sig : (typeof row.significance === "number" ? row.significance : null);
  const confidenceIntervalLower = typeof row.lower === "number"
    ? row.lower
    : (typeof row.confidenceIntervalLower === "number" ? row.confidenceIntervalLower : null);
  const confidenceIntervalUpper = typeof row.upper === "number"
    ? row.upper
    : (typeof row.confidenceIntervalUpper === "number" ? row.confidenceIntervalUpper : null);
  const parameter = row.parameter || row.variable || `param_${index + 1}`;

  return {
    parameter,
    estimate,
    standardError: stdError ?? null,
    waldStatistic: waldStatistic ?? null,
    degreesOfFreedom: row.degreesOfFreedom ?? 1,
    significance: significance ?? null,
    confidenceIntervalLower: confidenceIntervalLower ?? null,
    confidenceIntervalUpper: confidenceIntervalUpper ?? null,
    group: row.group,
    variable: row.variable ?? parameter,
    stdError: stdError ?? null,
    wald: waldStatistic ?? null,
    sig: significance ?? null,
    lower: confidenceIntervalLower ?? null,
    upper: confidenceIntervalUpper ?? null,
  };
}

function normalizeWasmResult(result, mainPayload) {
  const base = result && typeof result === "object" ? result : {};
  const rawParameterEstimates = Array.isArray(base.parameterEstimates)
    ? base.parameterEstimates
    : (Array.isArray(base.parameter_estimates) ? base.parameter_estimates : []);
  const parameterEstimates = rawParameterEstimates.map(normalizeParameterEstimate);

  const thresholdFromGroup = rawParameterEstimates.filter((row) => row?.group === "Threshold");
  const locationFromGroup = rawParameterEstimates.filter((row) => row?.group === "Location");
  const scaleFromGroup = rawParameterEstimates.filter((row) => row?.group === "Scale");

  const thresholdEstimates = Array.isArray(base.thresholdEstimates)
    ? base.thresholdEstimates.map(normalizeParameterEstimate)
    : thresholdFromGroup.map(normalizeParameterEstimate);
  const locationParameterEstimates = Array.isArray(base.locationParameterEstimates)
    ? base.locationParameterEstimates.map(normalizeParameterEstimate)
    : locationFromGroup.map(normalizeParameterEstimate);
  const scaleParameterEstimates = Array.isArray(base.scaleParameterEstimates)
    ? base.scaleParameterEstimates.map(normalizeParameterEstimate)
    : scaleFromGroup.map(normalizeParameterEstimate);

  const iterations = typeof base.iterations === "number" ? base.iterations : 0;
  const logLikelihood = typeof base.logLikelihood === "number"
    ? base.logLikelihood
    : (typeof base.log_likelihood === "number" ? base.log_likelihood : null);
  const minus2LogLikelihood = typeof base.minus2LogLikelihood === "number"
    ? base.minus2LogLikelihood
    : (typeof base.minus2_log_likelihood === "number"
      ? base.minus2_log_likelihood
      : (typeof logLikelihood === "number" ? -2 * logLikelihood : null));

  const metadata = {
    modelType: mainPayload?.metadata?.modelType,
    totalRows: mainPayload?.metadata?.totalRows,
    validRows: mainPayload?.metadata?.validRows,
    droppedRows: mainPayload?.metadata?.droppedRows,
    responseCategoryCount: mainPayload?.metadata?.responseCategoryCount,
    locationParameterCount: mainPayload?.metadata?.locationParameterCount,
    scaleParameterCount: mainPayload?.metadata?.scaleParameterCount,
  };

  return {
    ...base,
    converged: Boolean(base.converged ?? base.convergence ?? false),
    iterations,
    logLikelihood,
    minus2LogLikelihood,
    parameterEstimates,
    thresholdEstimates,
    locationParameterEstimates,
    scaleParameterEstimates,
    iterationHistory: Array.isArray(base.iterationHistory) ? base.iterationHistory : (base.iteration_history || []),
    warnings: Array.isArray(base.warnings) ? base.warnings : [],
    metadata,
  };
}

function validateNormalizedResult(result) {
  if (!result || typeof result !== "object") {
    throw new Error("Worker result missing.");
  }
  if (typeof result.converged !== "boolean") {
    throw new Error("Worker result missing converged.");
  }
  if (!Array.isArray(result.parameterEstimates)) {
    throw new Error("Worker result missing parameterEstimates.");
  }
  result.parameterEstimates.forEach((estimate, index) => {
    if (estimate && typeof estimate === "object" && "estimate" in estimate) {
      toFiniteNumber(estimate.estimate, `parameterEstimates[${index}].estimate`);
    }
  });
}

self.onmessage = async (event) => {
  console.log("[ORDINAL][WORKER][RECEIVED]", event.data);
  try {
    const mainPayload = event.data;
    const wasmPath = event.data?.wasmPath || mainPayload?.wasmPath;

    validateMainPlumPayload(mainPayload);
    console.log("[ORDINAL][WORKER][PAYLOAD_VALID]", {
      rows: mainPayload.response.responseVector.length,
      categories: mainPayload.response.responseCategories,
      terms: mainPayload.locationModel.locationTermNames,
    });

    await ensureWasmReady(wasmPath);

    if (typeof plum_validate === "function") {
      const rawValidation = await Promise.resolve(plum_validate(mainPayload));
      console.log("[ORDINAL][WORKER][PLUM_VALIDATE_RAW]", rawValidation);
      const validation = parseMaybeJson(rawValidation, "plum_validate");
      console.log("[ORDINAL][WORKER][PLUM_VALIDATE_PARSED]", validation);
      if (validation && validation.valid === false) {
        const errors = Array.isArray(validation.errors) ? validation.errors.join(" ") : "Input tidak valid.";
        throw new Error(errors);
      }
    }

    const rawResult = await Promise.resolve(plum_fit(mainPayload));
    console.log("[ORDINAL][WORKER][PLUM_FIT_RAW]", rawResult);
    const parsedResult = parseMaybeJson(rawResult, "plum_fit");
    console.log("[ORDINAL][WORKER][PLUM_FIT_PARSED]", parsedResult);

    if (parsedResult?.errors && Array.isArray(parsedResult.errors) && parsedResult.errors.length > 0) {
      throw new Error(parsedResult.errors.join(" "));
    }

    const normalizedResult = normalizeWasmResult(parsedResult, mainPayload);
    console.log("[ORDINAL][WORKER][NORMALIZED_RESULT]", normalizedResult);

    validateNormalizedResult(normalizedResult);

    postSuccess(normalizedResult);
  } catch (error) {
    postError(error, "worker", { receivedKeys: Object.keys(event.data || {}) });
  }
};
