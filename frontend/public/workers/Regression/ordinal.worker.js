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

function clampProb(value, min = 1e-12, max = 1 - 1e-12) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function safeExp(value) {
  if (value > 700) return Math.exp(700);
  if (value < -700) return Math.exp(-700);
  return Math.exp(value);
}

function erf(value) {
  const sign = value >= 0 ? 1 : -1;
  const x = Math.abs(value);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
  return sign * y;
}

function normalCdf(value) {
  return 0.5 * (1 + erf(value / Math.SQRT2));
}

function inverseLink(eta, linkFunction) {
  const normalizedLink = String(linkFunction || "Logit").toLowerCase().replace(/[_\s]+/g, "-");
  switch (normalizedLink) {
    case "probit":
      return normalCdf(eta);
    case "cloglog":
    case "complementary-log-log":
      return 1 - safeExp(-safeExp(eta));
    case "nloglog":
    case "negative-log-log":
      return safeExp(-safeExp(-eta));
    case "cauchit":
      return 0.5 + Math.atan(eta) / Math.PI;
    case "logit":
    default: {
      if (eta >= 0) {
        return 1 / (1 + safeExp(-eta));
      }
      const e = safeExp(eta);
      return e / (1 + e);
    }
  }
}

function normalizeSavedOptions(savedOptions) {
  return {
    predictedResponseCategory: Boolean(
      savedOptions?.predictedResponseCategory ?? savedOptions?.predictedCategory
    ),
    estimatedResponseProbabilities: Boolean(
      savedOptions?.estimatedResponseProbabilities ?? savedOptions?.estimateResponseProbability
    ),
    predictedCategoryProbability: Boolean(savedOptions?.predictedCategoryProbability),
    actualCategoryProbability: Boolean(savedOptions?.actualCategoryProbability),
  };
}

function findSavedVariableBatchSuffix(existingColumnNames) {
  const existing = new Set(
    (Array.isArray(existingColumnNames) ? existingColumnNames : [])
      .filter((name) => typeof name === "string")
      .map((name) => name.toUpperCase())
  );

  let suffix = 1;
  const suffixExists = (candidate) => {
    if (existing.has(`PRE_${candidate}`) || existing.has(`PCP_${candidate}`) || existing.has(`ACP_${candidate}`)) {
      return true;
    }
    const estPattern = new RegExp(`^EST\\d+_${candidate}$`, "i");
    return Array.from(existing).some((name) => estPattern.test(name));
  };

  while (suffixExists(suffix)) {
    suffix += 1;
  }
  return suffix;
}

function normalizeCategoryProbabilities(categoryProbabilities) {
  const cleaned = categoryProbabilities.map((value) => {
    if (!Number.isFinite(value)) return null;
    return Math.min(Math.max(value, 0), 1);
  });

  if (cleaned.some((value) => value === null)) return null;
  const sumProb = cleaned.reduce((sum, value) => sum + value, 0);
  if (!(sumProb > 0)) return null;
  return cleaned.map((value) => value / sumProb);
}

function canonicalizeParameterName(name) {
  if (name === null || name === undefined) return "";
  let text = String(name).trim();
  if (text.startsWith("[") && text.endsWith("]")) {
    text = text.slice(1, -1);
  }
  // Normalize whitespace and "=" spacing so:
  //  - "[A = B]" => "A=B"
  //  - "A = B" => "A=B"
  //  - "A=B" => "A=B"
  text = text.replace(/\s+/g, " ").trim();
  text = text.replace(/\s*=\s*/g, "=");
  return text;
}

function buildLocationBetaVector({
  locationTermNames,
  locationParameterEstimates,
}) {
  const terms = Array.isArray(locationTermNames) ? locationTermNames : [];
  const rows = Array.isArray(locationParameterEstimates) ? locationParameterEstimates : [];

  const estimateByName = new Map();
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const rawName = row.variable ?? row.parameter;
    const key = canonicalizeParameterName(rawName);
    if (!key) continue;
    const estimate = Number(row.estimate);
    if (!Number.isFinite(estimate)) continue;
    if (!estimateByName.has(key)) {
      estimateByName.set(key, estimate);
    }
  }

  const betas = terms.map((termName) => {
    const key = canonicalizeParameterName(termName);
    const estimate = estimateByName.get(key);
    return Number.isFinite(estimate) ? estimate : 0;
  });

  return betas;
}

function computeEta(xRow, betas) {
  let eta = 0;
  for (let j = 0; j < betas.length; j += 1) {
    eta += Number(xRow[j]) * betas[j];
  }
  return eta;
}

function computeCellProbabilities({ eta, thresholds, linkFunction }) {
  // gamma_ij = F(theta_j - eta_i) for j=1..J-1
  const gamma = thresholds.map((theta) => {
    const value = inverseLink(Number(theta) - eta, linkFunction);
    // clamp only to [0, 1] (not eps) to preserve SPSS-like behavior
    return Math.min(Math.max(Number(value), 0), 1);
  });

  // enforce monotonicity (numerical safety)
  for (let j = 1; j < gamma.length; j += 1) {
    if (gamma[j] < gamma[j - 1]) gamma[j] = gamma[j - 1];
  }

  const pi = [];
  if (gamma.length === 0) {
    // J=1 is invalid for ordinal; caller should guard
    return pi;
  }

  pi.push(gamma[0]);
  for (let j = 1; j < gamma.length; j += 1) {
    pi.push(gamma[j] - gamma[j - 1]);
  }
  pi.push(1 - gamma[gamma.length - 1]);

  // Numerical cleanup (avoid negatives or >1 due to float errors)
  for (let j = 0; j < pi.length; j += 1) {
    const value = Number(pi[j]);
    if (!Number.isFinite(value)) return null;
    pi[j] = Math.min(Math.max(value, 0), 1);
  }

  const sum = pi.reduce((acc, value) => acc + value, 0);
  if (!(sum > 0)) return null;
  // Mild renormalization to ensure the row sums to 1 after clamping.
  // This preserves the intended SPSS interpretation of EST* as cell probabilities.
  return pi.map((value) => value / sum);
}

function computeOrdinalSavedVariables({
  thresholds,
  betas,
  designMatrix,
  dependentCategories,
  actualY,
  originalRowIndices,
  totalRows,
  linkFunction,
  savedOptions,
  existingColumnNames,
  dependentVariable,
}) {
  const options = normalizeSavedOptions(savedOptions);
  const shouldCompute = Object.values(options).some(Boolean);
  if (!shouldCompute) return null;

  console.log("[ORDINAL][SAVED_VARIABLES][OPTIONS]", options);
  console.log("[ORDINAL][SAVED_VARIABLES][DEPENDENT_CATEGORIES]", dependentCategories);

  const categoryCount = dependentCategories.length;
  const batchSuffix = findSavedVariableBatchSuffix(existingColumnNames);
  const predictedType = dependentVariable?.type === "STRING"
    || dependentCategories.some((category) => typeof category === "string")
    ? "string"
    : "numeric";

  const makeValues = () => Array(totalRows).fill(null);
  const predictedValues = makeValues();
  const estimatedValues = Array.from({ length: categoryCount }, makeValues);
  const predictedProbabilityValues = makeValues();
  const actualProbabilityValues = makeValues();
  const sampleRows = [];

  console.log("[ORDINAL][SAVED_VARIABLES][BATCH_SUFFIX]", batchSuffix);
  console.log("[ORDINAL][SAVED_VARIABLES][ROW_MAPPING]", {
    totalRows,
    validRows: originalRowIndices.length,
    sample: originalRowIndices.slice(0, 5),
  });

  for (let i = 0; i < designMatrix.length; i += 1) {
    const x = designMatrix[i];
    const originalRowIndex = originalRowIndices[i];
    if (!Number.isInteger(originalRowIndex) || originalRowIndex < 0 || originalRowIndex >= totalRows) {
      continue;
    }

    const eta = computeEta(x, betas);
    const cellProbabilities = computeCellProbabilities({ eta, thresholds, linkFunction });
    if (!cellProbabilities || cellProbabilities.length !== categoryCount) {
      console.warn("[ORDINAL][SAVED_VARIABLES] Invalid probability row; values set to null.", {
        row: originalRowIndex,
        eta,
      });
      continue;
    }

    let predictedIndex = 0;
    let predictedCategoryProbability = cellProbabilities[0];
    for (let j = 1; j < cellProbabilities.length; j += 1) {
      if (cellProbabilities[j] > predictedCategoryProbability) {
        predictedCategoryProbability = cellProbabilities[j];
        predictedIndex = j;
      }
    }

    const actualIndex = Math.round(Number(actualY[i])) - 1;
    const actualCategoryProbability = actualIndex >= 0 && actualIndex < cellProbabilities.length
      ? cellProbabilities[actualIndex]
      : null;

    predictedValues[originalRowIndex] = dependentCategories[predictedIndex] ?? null;
    for (let j = 0; j < categoryCount; j += 1) {
      estimatedValues[j][originalRowIndex] = cellProbabilities[j];
    }
    predictedProbabilityValues[originalRowIndex] = predictedCategoryProbability;
    actualProbabilityValues[originalRowIndex] = actualCategoryProbability;

    if (sampleRows.length < 5) {
      sampleRows.push({
        row: originalRowIndex,
        eta,
        cellProbabilities,
        predictedCategory: dependentCategories[predictedIndex] ?? null,
        predictedCategoryProbability,
        actualCategory: actualIndex >= 0 ? dependentCategories[actualIndex] ?? null : null,
        actualCategoryProbability,
      });
    }
  }

  const columns = [];
  if (options.predictedResponseCategory) {
    columns.push({
      name: `PRE_${batchSuffix}`,
      label: "Predicted Response Category",
      type: predictedType,
      values: predictedValues,
    });
  }
  if (options.estimatedResponseProbabilities) {
    for (let j = 0; j < categoryCount; j += 1) {
      columns.push({
        name: `EST${j + 1}_${batchSuffix}`,
        label: `Estimated Cell Probability for Response Category: ${String(dependentCategories[j])}`,
        type: "numeric",
        decimals: 6,
        values: estimatedValues[j],
      });
    }
  }
  if (options.predictedCategoryProbability) {
    columns.push({
      name: `PCP_${batchSuffix}`,
      label: "Estimated Classification Probability for the Predicted Category",
      type: "numeric",
      decimals: 6,
      values: predictedProbabilityValues,
    });
  }
  if (options.actualCategoryProbability) {
    columns.push({
      name: `ACP_${batchSuffix}`,
      label: "Estimated Classification Probability for the Actual Category",
      type: "numeric",
      decimals: 6,
      values: actualProbabilityValues,
    });
  }

  console.log("[ORDINAL][SAVED_VARIABLES][COLUMN_NAMES]", columns.map((column) => column.name));
  console.log("[ORDINAL][SAVED_VARIABLES][PROBABILITY_SAMPLE]", sampleRows);

  return {
    batchSuffix,
    columns,
  };
}

function computePlumSavedVariables(mainPayload, normalizedResult) {
  const savedOptions = mainPayload?.savedVariables || {};
  const options = normalizeSavedOptions(savedOptions);
  const shouldCompute = Object.values(options).some(Boolean);

  if (!shouldCompute) {
    return null;
  }

  if (!normalizedResult?.converged) {
    console.warn("[ORDINAL][SAVED_VARIABLES] Model not converged; skipping saved variables.");
    return null;
  }

  const thresholds = Array.isArray(normalizedResult.thresholdEstimates)
    ? normalizedResult.thresholdEstimates.map((row) => Number(row.estimate))
    : [];

  const locationTermNames = mainPayload?.locationModel?.locationTermNames || [];
  const betas = buildLocationBetaVector({
    locationTermNames,
    locationParameterEstimates: normalizedResult.locationParameterEstimates || [],
  });

  const dependentCategories = mainPayload?.response?.responseCategories || [];
  const actualY = mainPayload?.response?.responseVector || [];
  const designMatrix = mainPayload?.locationModel?.locationDesignMatrix || [];
  const originalRowIndices = Array.isArray(mainPayload?.rowIndexMap) ? mainPayload.rowIndexMap : [];
  const totalRows = Number(mainPayload?.metadata?.totalRows);
  const linkFunction = mainPayload?.estimationOptions?.linkFunction || "Logit";

  if (dependentCategories.length < 3) {
    console.warn("[ORDINAL][SAVED_VARIABLES] Response categories < 3; skipping saved variables.");
    return null;
  }
  if (thresholds.length !== dependentCategories.length - 1) {
    console.warn("[ORDINAL][SAVED_VARIABLES] Threshold count mismatch; skipping saved variables.");
    return null;
  }
  if (!Array.isArray(designMatrix) || designMatrix.length === 0) {
    console.warn("[ORDINAL][SAVED_VARIABLES] Missing design matrix; skipping saved variables.");
    return null;
  }
  if (betas.length !== (designMatrix[0] || []).length) {
    console.warn("[ORDINAL][SAVED_VARIABLES] Beta length mismatch; skipping saved variables.", {
      betas: betas.length,
      designColumns: (designMatrix[0] || []).length,
      termNames: Array.isArray(locationTermNames) ? locationTermNames.length : null,
    });
    return null;
  }
  if (originalRowIndices.length !== actualY.length || designMatrix.length !== actualY.length) {
    console.warn("[ORDINAL][SAVED_VARIABLES] Row mapping mismatch; skipping saved variables.");
    return null;
  }
  if (!Number.isInteger(totalRows) || totalRows < actualY.length) {
    console.warn("[ORDINAL][SAVED_VARIABLES] Invalid total row count; skipping saved variables.");
    return null;
  }

  return computeOrdinalSavedVariables({
    thresholds,
    betas,
    designMatrix,
    dependentCategories,
    actualY,
    originalRowIndices,
    totalRows,
    linkFunction,
    savedOptions: options,
    existingColumnNames: mainPayload?.existingColumnNames || [],
    dependentVariable: mainPayload?.dependent || null,
  });
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

  if (!payload.dependent || typeof payload.dependent !== "object") {
    throw new Error("Payload PLUM tidak valid: dependent tidak tersedia.");
  }
  if (!Array.isArray(payload.factors)) {
    throw new Error("Payload PLUM tidak valid: factors harus array.");
  }
  if (!Array.isArray(payload.covariates)) {
    throw new Error("Payload PLUM tidak valid: covariates harus array.");
  }

  const dependentName = payload.dependent?.name;
  if (payload.factors.some((v) => v.name === dependentName)) {
    throw new Error("Payload PLUM tidak valid: dependent tidak boleh masuk factors.");
  }
  if (payload.covariates.some((v) => v.name === dependentName)) {
    throw new Error("Payload PLUM tidak valid: dependent tidak boleh masuk covariates.");
  }

  const factorNames = new Set(payload.factors.map((v) => v.name));
  for (const covariate of payload.covariates) {
    if (factorNames.has(covariate.name)) {
      throw new Error("Payload PLUM tidak valid: variabel tidak boleh muncul di factors dan covariates.");
    }
  }

  const responseVector = payload?.response?.responseVector;
  const responseCategories = payload?.response?.responseCategories;
  const weights = Array.isArray(payload?.weights) ? payload.weights : null;
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
  if (weights && weights.length !== responseVector.length) {
    throw new Error("Payload PLUM tidak valid: panjang weights tidak sama dengan responseVector.");
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
  if (weights) {
    weights.forEach((value, index) => {
      const numeric = toFiniteNumber(value, `weights[${index}]`);
      if (numeric <= 0) {
        throw new Error("weights must be positive for valid cases.");
      }
    });
  }

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

  const metadata = payload?.metadata || {};
  if (typeof metadata.totalRows !== "number" || typeof metadata.validRows !== "number") {
    throw new Error("Payload PLUM tidak valid: metadata rows missing.");
  }

  payload.factors.forEach((factor) => {
    if (Array.isArray(factor?.valueLabels) && factor.valueLabels.length > 0) return;
  });
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
  const degreesOfFreedom = row.degreesOfFreedom ?? row.df ?? (row.isRedundant ? 0 : 1);

  return {
    parameter,
    estimate,
    standardError: stdError ?? null,
    waldStatistic: waldStatistic ?? null,
    degreesOfFreedom,
    significance: significance ?? null,
    confidenceIntervalLower: confidenceIntervalLower ?? null,
    confidenceIntervalUpper: confidenceIntervalUpper ?? null,
    isRedundant: Boolean(row.isRedundant ?? row.is_redundant ?? false),
    group: row.group,
    variable: row.variable ?? parameter,
    stdError: stdError ?? null,
    wald: waldStatistic ?? null,
    sig: significance ?? null,
    lower: confidenceIntervalLower ?? null,
    upper: confidenceIntervalUpper ?? null,
    df: degreesOfFreedom,
  };
}

function pickNumber(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
}

function normalizeModelSummaryRow(row) {
  if (!row || typeof row !== "object") return null;
  return {
    ...row,
    minus2LogLikelihood: pickNumber(row.minus2LogLikelihood, row.minus2_log_likelihood),
    logLikelihood: pickNumber(row.logLikelihood, row.log_likelihood),
    converged: Boolean(row.converged),
    iterations: pickNumber(row.iterations),
    method: row.method,
  };
}

function normalizeInterceptOnlyRow(row) {
  if (!row || typeof row !== "object") return null;
  return {
    ...row,
    minus2LogLikelihood: pickNumber(row.minus2LogLikelihood, row.minus2_log_likelihood),
    logLikelihood: pickNumber(row.logLikelihood, row.log_likelihood),
  };
}

function normalizeFitStat(row) {
  if (!row || typeof row !== "object") return null;
  return {
    ...row,
    chiSquare: pickNumber(row.chiSquare, row.chi_square),
    df: pickNumber(row.df),
    sig: pickNumber(row.sig),
  };
}

function normalizePseudoRSquare(row) {
  if (!row || typeof row !== "object") return null;
  return {
    ...row,
    coxSnell: pickNumber(row.coxSnell, row.cox_snell),
    nagelkerke: pickNumber(row.nagelkerke),
    mcfadden: pickNumber(row.mcfadden),
  };
}

function normalizeSummaryStatistics(summary) {
  if (!summary || typeof summary !== "object") return null;
  return {
    ...summary,
    model: normalizeModelSummaryRow(summary.model),
    interceptOnly: normalizeInterceptOnlyRow(summary.interceptOnly || summary.intercept_only),
    modelChiSquare: normalizeFitStat(summary.modelChiSquare || summary.model_chi_square),
    pseudoRSquare: normalizePseudoRSquare(summary.pseudoRSquare || summary.pseudo_r_square),
  };
}

function normalizeGoodnessOfFit(gof) {
  if (!gof || typeof gof !== "object") return null;
  return {
    ...gof,
    pearson: normalizeFitStat(gof.pearson),
    deviance: normalizeFitStat(gof.deviance),
  };
}

function normalizeParallelLinesTest(test) {
  if (!test || typeof test !== "object") return null;
  return {
    ...test,
    minus2LogLikelihoodParallel: pickNumber(
      test.minus2LogLikelihoodParallel,
      test.minus2_log_likelihood_parallel
    ),
    minus2LogLikelihoodNonParallel: pickNumber(
      test.minus2LogLikelihoodNonParallel,
      test.minus2_log_likelihood_non_parallel
    ),
    chiSquare: pickNumber(test.chiSquare, test.chi_square),
    df: pickNumber(test.df),
    sig: pickNumber(test.sig),
    converged: Boolean(test.converged),
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

  const logLikelihoodKernel = typeof base.logLikelihoodKernel === "number"
    ? base.logLikelihoodKernel
    : (typeof base.log_likelihood_kernel === "number" ? base.log_likelihood_kernel : null);
  const logLikelihoodComplete = typeof base.logLikelihoodComplete === "number"
    ? base.logLikelihoodComplete
    : (typeof base.log_likelihood_complete === "number" ? base.log_likelihood_complete : null);
  const logLikelihoodDisplayed = typeof base.logLikelihoodDisplayed === "number"
    ? base.logLikelihoodDisplayed
    : (typeof base.log_likelihood_displayed === "number" ? base.log_likelihood_displayed : null);
  const minus2LogLikelihoodDisplayed = typeof base.minus2LogLikelihoodDisplayed === "number"
    ? base.minus2LogLikelihoodDisplayed
    : (typeof base.minus2_log_likelihood_displayed === "number" ? base.minus2_log_likelihood_displayed : null);
  const logLikelihoodDisplayMode = typeof base.logLikelihoodDisplayMode === "string"
    ? base.logLikelihoodDisplayMode
    : (typeof base.log_likelihood_display_mode === "string" ? base.log_likelihood_display_mode : null);

  const metadata = {
    modelType: mainPayload?.metadata?.modelType,
    totalRows: mainPayload?.metadata?.totalRows,
    validRows: mainPayload?.metadata?.validRows,
    droppedRows: mainPayload?.metadata?.droppedRows,
    responseCategoryCount: mainPayload?.metadata?.responseCategoryCount,
    locationParameterCount: mainPayload?.metadata?.locationParameterCount,
    scaleParameterCount: mainPayload?.metadata?.scaleParameterCount,
    caseProcessingSummary: mainPayload?.metadata?.caseProcessingSummary,
  };

  const iterationHistoryMeta = base.iterationHistoryMeta
    || base.iteration_history_meta
    || null;
  const summaryStatistics = normalizeSummaryStatistics(
    base.summaryStatistics || base.summary_statistics
  );
  const goodnessOfFit = normalizeGoodnessOfFit(base.goodnessOfFit || base.goodness_of_fit);
  const testOfParallelLines = normalizeParallelLinesTest(
    base.testOfParallelLines || base.test_of_parallel_lines
  );

  return {
    ...base,
    converged: Boolean(base.converged ?? base.convergence ?? false),
    iterations,
    logLikelihood,
    minus2LogLikelihood,
    logLikelihoodKernel,
    logLikelihoodComplete,
    logLikelihoodDisplayed,
    minus2LogLikelihoodDisplayed,
    logLikelihoodDisplayMode,
    parameterEstimates,
    thresholdEstimates,
    locationParameterEstimates,
    scaleParameterEstimates,
    summaryStatistics,
    goodnessOfFit,
    testOfParallelLines,
    estimationOptions: mainPayload?.estimationOptions || {},
    outputOptions: mainPayload?.outputOptions || {},
    savedVariableOptions: mainPayload?.savedVariables || {},
    iterationHistory: Array.isArray(base.iterationHistory) ? base.iterationHistory : (base.iteration_history || []),
    iterationHistoryMeta,
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
    const outputOptions = mainPayload?.outputOptions || {};
    const printIterationHistory = Boolean(
      outputOptions?.printIterationHistory ?? outputOptions?.iterationHistory
    );
    const iterationHistoryEvery = Number(
      outputOptions?.iterationHistoryEvery ?? outputOptions?.iterationHistoryStep ?? 1
    );

    console.log("[ORDINAL][WORKER][ITERATION_HISTORY_OPTIONS]", {
      printIterationHistory,
      iterationHistoryEvery,
    });

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
    console.log("[ORDINAL][PLUM_ESTIMATION]", {
      converged: normalizedResult.converged,
      iterations: normalizedResult.iterations,
      minus2LogLikelihood: normalizedResult.minus2LogLikelihoodDisplayed ?? normalizedResult.minus2LogLikelihood,
      thresholdParameters: normalizedResult.thresholdEstimates?.length ?? 0,
      locationParameters: normalizedResult.locationParameterEstimates?.length ?? 0,
    });
    console.log("[ORDINAL][WORKER][ITERATION_HISTORY_RESULT]", {
      rows: Array.isArray(normalizedResult.iterationHistory) ? normalizedResult.iterationHistory.length : 0,
      meta: normalizedResult.iterationHistoryMeta || null,
    });

    validateNormalizedResult(normalizedResult);

    const savedVariables = computePlumSavedVariables(mainPayload, normalizedResult);
    if (savedVariables) {
      normalizedResult.savedVariables = savedVariables;
    }

    postSuccess(normalizedResult);
  } catch (error) {
    postError(error, "worker", { receivedKeys: Object.keys(event.data || {}) });
  }
};
