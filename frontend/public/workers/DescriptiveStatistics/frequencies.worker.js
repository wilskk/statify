importScripts('/workers/DescriptiveStatistics/libs/utils.js');
importScripts('/workers/DescriptiveStatistics/libs/descriptive.js');
importScripts('/workers/DescriptiveStatistics/libs/frequency.js');


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
  const {
    variable,
    data,
    weights,
    options,
    variableData,          // Batched mode array [{ variable, data }]
    weightVariableData,    // Optional weights array for batched mode
  } = event.data || {};

  // -------------------------------------------------------------
  
  // -------------------------------------------------------------
  if (Array.isArray(variableData)) {
    try {
      const combinedResults = {
        statistics: {},
        frequencyTables: {},
      };

      const freqOptions = options || {};

      for (const item of variableData) {
        const { variable: varDef, data: varData } = item;
        const calculator = new self.FrequencyCalculator({
          variable: varDef,
          data: varData,
          weights: weightVariableData || null,
          options: freqOptions,
        });

        const { stats, frequencyTable } = calculator.getStatistics();

        let processedStats = stats;
        if (stats) {
          processedStats = roundStatsObject(stats, STATS_DECIMAL_PLACES);
        }

        let processedFreqTbl = frequencyTable ? applyValueLabels(frequencyTable, varDef) : null;

        if (processedStats) combinedResults.statistics[varDef.name] = processedStats;
        if (processedFreqTbl) combinedResults.frequencyTables[varDef.name] = processedFreqTbl;
      }

      postMessage({ success: true, results: combinedResults });
    } catch (err) {
      console.error('[FrequenciesWorker] Error (batched mode):', err);
      postMessage({ success: false, error: err?.message || String(err) });
    }
    return; // Early exit – batched mode handled
  }

  // -------------------------------------------------------------
  // 2. Single-Variable Mode
  // -------------------------------------------------------------
  try {
    const calculator = new self.FrequencyCalculator({ variable, data, weights, options });
    const results = calculator.getStatistics();
    if (results && results.stats) {
       results.stats = roundStatsObject(results.stats, STATS_DECIMAL_PLACES);
    }
    if (results && results.frequencyTable) {
       results.frequencyTable = applyValueLabels(results.frequencyTable, variable);
    }
    postMessage({ success: true, results });
  } catch (err) {
    console.error('[FrequenciesWorker] Error:', err);
    postMessage({ success: false, error: err?.message || String(err) });
  }
}; 