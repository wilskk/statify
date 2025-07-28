importScripts('/workers/DescriptiveStatistics/libs/utils.js');

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
  const { variable, data, caseNumbers, weights, options } = event.data || {};

  try {
    const calculator = new self.ExamineCalculator({ variable, data, caseNumbers, weights, options });
    const results = calculator.getStatistics();

    
    
    if (results.descriptives) {
      results.descriptives = roundDeep(results.descriptives, STATS_DECIMAL_PLACES);
    }
    
    
    if (results.percentiles) {
      results.percentiles = roundDeep(results.percentiles, STATS_DECIMAL_PLACES);
    }
    if (results.trimmedMean !== undefined) {
      results.trimmedMean = roundDeep(results.trimmedMean, STATS_DECIMAL_PLACES);
    }
    if (results.mEstimators) {
      results.mEstimators = roundDeep(results.mEstimators, STATS_DECIMAL_PLACES);
    }
    if (results.descriptives?.confidenceInterval) {
      results.descriptives.confidenceInterval = roundDeep(results.descriptives.confidenceInterval, STATS_DECIMAL_PLACES);
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