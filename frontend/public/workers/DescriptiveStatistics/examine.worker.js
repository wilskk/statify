/**
 * @file examine.worker.js
 * Dedicated Web Worker for the Examine/Explore dialog.
 */

importScripts('/workers/DescriptiveStatistics/libs/utils.js');
importScripts('/workers/DescriptiveStatistics/libs/descriptive.js');
importScripts('/workers/DescriptiveStatistics/libs/frequency.js');
importScripts('/workers/DescriptiveStatistics/libs/examine.js');

onmessage = function (event) {
  const { variable, data, weights, options } = event.data || {};

  try {
    const calculator = new self.ExamineCalculator({ variable, data, weights, options });
    const results = calculator.getStatistics();

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