/**
 * @file descriptives.worker.js
 * Dedicated Web Worker for Descriptive Statistics analysis.
 * Receives a single–variable payload and responds with a statistics object
 * identical to the one produced previously by manager.js.
 */

// Core calculation libraries
importScripts('/workers/DescriptiveStatistics/libs/utils.js');
importScripts('/workers/DescriptiveStatistics/libs/descriptive.js');

/**
 * Handle message from the main thread.
 * Expected payload structure:
 * {
 *   variable: VarDefinition,
 *   data: Array<any>,
 *   weights: Array<number>|null,
 *   options: object
 * }
 */
onmessage = function (event) {
  const { variable, data, weights, options } = event.data || {};

  try {
    const calculator = new self.DescriptiveCalculator({ variable, data, weights, options });
    const results = calculator.getStatistics();

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