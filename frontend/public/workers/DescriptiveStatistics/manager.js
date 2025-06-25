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

// Muat semua pustaka kalkulator dan utilitas
importScripts('./libs/utils.js');
importScripts('./libs/descriptive.js');
importScripts('./libs/frequency.js');
importScripts('./libs/examine.js');
importScripts('./libs/crosstabs.js');

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

/**
 * Menangani pesan masuk dari main thread.
 * @param {MessageEvent} event - Event pesan yang diterima.
 */
onmessage = (event) => {
    const { analysisType, variable, data, weights, options } = event.data;

    // --- Start of Debugging ---
    console.log(`[Worker] Received analysis request: ${analysisType}`);
    console.log('[Worker] Received variable:', JSON.parse(JSON.stringify(variable)));
    console.log('[Worker] Received data (first 5 rows):', data ? data.slice(0, 5) : 'No data');
    console.log('[Worker] Received options:', JSON.parse(JSON.stringify(options || {})));
    // --- End of Debugging ---

    try {
        const CalculatorClass = CALCULATOR_MAP.get(analysisType);
        if (!CalculatorClass) {
            throw new Error(`Tipe analisis tidak valid: ${analysisType}`);
        }

        // Ekstrak argumen dan buat instance kalkulator.
        // Memastikan semua argumen diteruskan secara eksplisit.
        const calculator = new CalculatorClass({ variable, data, weights, options });
        
        const results = calculator.getStatistics();
        
        postMessage({
            status: 'success',
            variableName: analysisType === 'crosstabs' 
                ? `${variable.row.name} * ${variable.col.name}` 
                : variable.name,
            results: results,
        });

    } catch (error) {
        const varName = analysisType === 'crosstabs' && variable
            ? `${variable.row?.name} * ${variable.col?.name}`
            : variable?.name;
            
        console.error(`Error dalam worker untuk variabel ${varName}:`, error);
        postMessage({
            status: 'error',
            variableName: varName || 'unknown',
            error: error.message,
        });
    }
};

// The `process` function is called by the main thread to perform the descriptive statistics calculations.
process: (vars) => {
    variables = vars;

    // --- Start of Debugging for invalid cases ---
    console.log('--- [Worker] Debugging Invalid Cases ---');
    console.log(
        '[Worker] Received data for processing (first 5 rows):',
        data.slice(0, 5)
    );
    console.log('[Worker] Received variables for processing:', vars);

    const numericVars = vars.filter((v) => v.type === 'numeric');

    data.forEach((row, rowIndex) => {
        numericVars.forEach((variable) => {
            const value = row[variable.name];
            let reason = '';

            if (value === null || value === undefined || value === '') {
                reason = 'is null, undefined, or an empty string.';
            } else if (isNaN(Number(value))) {
                reason = 'cannot be converted to a number.';
            } else {
                const numValue = Number(value);
                if (
                    variable.missing === 'discrete' &&
                    variable.missingValues?.includes(numValue)
                ) {
                    reason = 'is a user-defined discrete missing value.';
                } else if (
                    variable.missing === 'range' &&
                    Array.isArray(variable.missingValues) &&
                    variable.missingValues.length === 2 &&
                    variable.missingValues[0] !== null &&
                    variable.missingValues[1] !== null
                ) {
                    if (
                        numValue >= variable.missingValues[0] &&
                        numValue <= variable.missingValues[1]
                    ) {
                        reason = 'is within the user-defined missing value range.';
                    }
                }
            }

            if (reason) {
                console.log(
                    `[Worker - Row ${
                        rowIndex + 1
                    }, Var "${variable.name}"]: Value '${value}' is considered invalid. Reason: ${reason}`
                );
            }
        });
    });
    console.log('--- [Worker] End of Debugging ---');
    // --- End of Debugging ---

    const { processedData, caseSummary } = processDescriptive(data, variables);
    caseProcessingSummary = getCaseProcessingSummary(caseSummary, data.length);
    descriptives = getDescriptives(processedData, variables);

    return {
        status: 'success',
        variableName: analysisType === 'crosstabs' 
            ? `${variable.row.name} * ${variable.col.name}` 
            : variable.name,
        results: results,
    };
} 