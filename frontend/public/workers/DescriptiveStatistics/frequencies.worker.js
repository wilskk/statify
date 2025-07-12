/**
 * @file frequencies.worker.js
 * Dedicated Web Worker for Frequencies analysis (including batched mode).
 */

importScripts('/workers/DescriptiveStatistics/libs/utils.js');
importScripts('/workers/DescriptiveStatistics/libs/descriptive.js');
importScripts('/workers/DescriptiveStatistics/libs/frequency.js');

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
  // 1. Batched Frequencies Mode (used by React Frequencies modal)
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
        if (stats) combinedResults.statistics[varDef.name] = stats;
        if (frequencyTable) combinedResults.frequencyTables[varDef.name] = frequencyTable;
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
    postMessage({ success: true, results });
  } catch (err) {
    console.error('[FrequenciesWorker] Error:', err);
    postMessage({ success: false, error: err?.message || String(err) });
  }
}; 