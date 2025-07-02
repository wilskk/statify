/**
 * @file manager.js
 * @description
 * Bertindak sebagai entry point (controller) utama untuk semua web worker
 * statistik deskriptif. Menerima pesan dari main thread, mendelegasikan
 * tugas ke kalkulator yang sesuai (Descriptive, Frequency, Examine, Crosstabs),
 * dan mengirimkan hasilnya kembali.
 * 
 * Arsitektur ini memungkinkan penambahan analisis baru dengan mudah
 * tanpa mengubah logika perutean pesan utama.
 */

// Use absolute paths (relative to the site root) so the worker can resolve
// the dependencies correctly after Next.js/webpack bundles the worker file.
importScripts('/workers/DescriptiveStatistics/libs/utils.js');
importScripts('/workers/DescriptiveStatistics/libs/descriptive.js');
importScripts('/workers/DescriptiveStatistics/libs/frequency.js');
importScripts('/workers/DescriptiveStatistics/libs/examine.js');
importScripts('/workers/DescriptiveStatistics/libs/crosstabs.js');

/**
 * Peta (Map) untuk mengasosiasikan tipe analisis dengan kelas kalkulatornya.
 * Ini memungkinkan pemilihan kalkulator secara dinamis berdasarkan permintaan.
 * @type {Map<string, (new (...args: any[]) => any)>}
 */
const CALCULATOR_MAP = new Map([
    ['descriptives', self.DescriptiveCalculator],
    ['frequencies', self.FrequencyCalculator],
    ['examine', self.ExamineCalculator],
    ['crosstabs', self.CrosstabsCalculator],
]);

// Unified message handler to support both legacy single-variable requests
// and the batched `variableData` format used by the Frequencies modal.
onmessage = (event) => {
    const {
        analysisType,
        variable,
        data,
        weights,
        options,
        variableData,          // Batched data (array)
        weightVariableData,    // Optional weights array for batched mode
    } = event.data;

    // ---------------------------------------------------------------
    // 1. Batched Frequencies Mode (used by the React Frequencies modal)
    // ---------------------------------------------------------------
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

                if (stats) {
                    combinedResults.statistics[varDef.name] = stats;
                }
                if (frequencyTable) {
                    combinedResults.frequencyTables[varDef.name] = frequencyTable;
                }
            }

            postMessage({ success: true, results: combinedResults });

        } catch (err) {
            console.error('[Worker] Error in batched frequencies mode:', err);
            postMessage({ success: false, error: err.message || String(err) });
        }
        return; // Early exit — batched mode handled.
    }

    // ---------------------------------------------------------------
    // 2. Legacy Single-Variable Mode (descriptives, examine, etc.)
    // ---------------------------------------------------------------
    try {
        const CalculatorClass = CALCULATOR_MAP.get(analysisType);
        if (!CalculatorClass) {
            throw new Error(`Tipe analisis tidak valid: ${analysisType}`);
        }

        const calculator = new CalculatorClass({ variable, data, weights, options });
        const results = calculator.getStatistics();

        postMessage({
            status: 'success',
            variableName:
                analysisType === 'crosstabs' && variable
                    ? `${variable.row?.name} * ${variable.col?.name}`
                    : variable?.name,
            results,
        });
    } catch (error) {
        const varName =
            analysisType === 'crosstabs' && variable
                ? `${variable.row?.name} * ${variable.col?.name}`
                : variable?.name;

        console.error(`Error dalam worker untuk variabel ${varName}:`, error);
        postMessage({ status: 'error', variableName: varName || 'unknown', error: error.message });
    }
};

// (Debug helper block removed – legacy, unused)
// ... existing code ... 