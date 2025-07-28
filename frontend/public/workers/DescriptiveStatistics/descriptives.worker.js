importScripts('/workers/DescriptiveStatistics/libs/utils.js');
importScripts('/workers/DescriptiveStatistics/libs/descriptive.js');

function roundStatsObject(obj, decimals) {
  const rounded = {};
  for (const key in obj) {
    const val = obj[key];
    if (['N', 'Valid', 'Missing'].includes(key)) {
      rounded[key] = val;
    } else if (typeof val === 'number') {
      rounded[key] = roundToDecimals(val, decimals);
    } else if (Array.isArray(val)) {
      rounded[key] = val.map(v => (typeof v === 'number' ? roundToDecimals(v, decimals) : v));
    } else if (val && typeof val === 'object') {
      const inner = {};
      for (const k in val) {
        inner[k] = typeof val[k] === 'number' ? roundToDecimals(val[k], decimals) : val[k];
      }
      rounded[key] = inner;
    } else {
      rounded[key] = val;
    }
  }
  return rounded;
}

onmessage = function (event) {
  const { variable, data, weights, options } = event.data || {};

  try {
    const calculator = new self.DescriptiveCalculator({ variable, data, weights, options });
    const results = calculator.getStatistics();

    // Apply rounding before sending to main thread
    if (results && results.stats) {
      results.stats = roundStatsObject(results.stats, STATS_DECIMAL_PLACES);
    }

    postMessage({
      status: 'success',
      variableName: variable?.name,
      results,
    });
  } catch (err) {
    console.error('[DescriptivesWorker] Calculation error:', err);
    postMessage({
      status: 'error',
      variableName: variable?.name,
      error: err?.message || String(err),
    });
  }
}; 