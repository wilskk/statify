/**
 * @file examine.worker.js
 * Dedicated Web Worker for the Examine/Explore dialog.
 */

// Debug: signal worker script loaded
console.log('[ExamineWorker] Script loaded');
importScripts('/workers/DescriptiveStatistics/libs/utils.js');
// Utility to round numbers deeply in an object/array based on decimals
function roundDeep(value, decimals) {
  if (typeof value === 'number') {
    return roundToDecimals(value, decimals);
  }
  if (Array.isArray(value)) {
    return value.map(v => roundDeep(v, decimals));
  }
  if (value && typeof value === 'object') {
    const newObj = {};
    for (const k in value) {
      newObj[k] = roundDeep(value[k], decimals);
    }
    return newObj;
  }
  return value;
}
importScripts('/workers/DescriptiveStatistics/libs/descriptive.js');
importScripts('/workers/DescriptiveStatistics/libs/frequency.js');
importScripts('/workers/DescriptiveStatistics/libs/examine.js');

onmessage = function (event) {
  console.log('[ExamineWorker] Message received', event.data);
  const { variable, data, weights, options } = event.data || {};

  try {
    const calculator = new self.ExamineCalculator({ variable, data, weights, options });
    const results = calculator.getStatistics();

    // Apply rounding if decimals specified
    if (typeof variable?.decimals === 'number' && variable.decimals >= 0) {
      const dec = variable.decimals;
      // Round descriptives, trimmedMean, mEstimators, percentiles, confidenceInterval values
      if (results.descriptives) results.descriptives = roundDeep(results.descriptives, dec);
      if (results.trimmedMean !== undefined) results.trimmedMean = roundDeep(results.trimmedMean, dec);
      if (results.mEstimators) results.mEstimators = roundDeep(results.mEstimators, dec);
      if (results.percentiles) results.percentiles = roundDeep(results.percentiles, dec);
      if (results.descriptives?.confidenceInterval) {
        results.descriptives.confidenceInterval = roundDeep(results.descriptives.confidenceInterval, dec);
      }
    }

    console.log('[ExamineWorker] Calculation success – posting results');
    postMessage({
      status: 'success',
      variableName: variable?.name,
      results,
    });
  } catch (err) {
    console.error('[ExamineWorker] Error:', err);
    postMessage({
      status: 'error',
      variableName: variable?.name,
      error: err?.message || String(err),
    });
  }
}; 