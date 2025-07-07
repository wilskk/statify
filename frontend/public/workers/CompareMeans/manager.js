/**
 * @file manager.js
 * @description
 * Entry point (controller) utama untuk semua web worker
 * Compare Means. Menerima pesan dari main thread, mendelegasikan
 * tugas ke kalkulator yang sesuai (OneSampleTTest, IndependentSamplesTTest, PairedSamplesTTest, OneWayAnova, EffectSize),
 * dan mengirimkan hasilnya kembali.
 * 
 * Arsitektur ini memungkinkan penambahan analisis baru dengan mudah
 * tanpa mengubah logika perutean pesan utama.
 */

// Muat semua pustaka kalkulator dan utilitas
import './libs/utils.js';
import './libs/oneSampleTTest.js';
import './libs/independentSamplesTTest.js';
// import './libs/pairedSamplesTTest.js';
// import './libs/oneWayAnova.js';
// import './libs/effectSize.js';

// Definisikan global calculator map
const calculators = {
    oneSampleTTest: OneSampleTTestCalculator,
    independentSamplesTTest: IndependentSamplesTTestCalculator,
    // pairedSamplesTTest: PairedSamplesTTestCalculator,
    // oneWayAnova: OneWayAnovaCalculator,
    // effectSize: EffectSizeCalculator,
};

/**
 * Menangani pesan masuk dari main thread.
 * @param {MessageEvent} event - Event pesan yang diterima.
 */
onmessage = (event) => {
    const { analysisType, variable, data, groupingVariable, groupingData, options } = event.data;

    // --- Start of Debugging ---
    console.log(`[Worker] Received analysis request: ${analysisType}`);
    console.log('[Worker] Received variable:', JSON.parse(JSON.stringify(variable)));
    console.log('[Worker] Received data (first 5 rows):', data ? data.slice(0, 5) : 'No data');
    if (groupingVariable) {
        console.log('[Worker] Received grouping variable:', JSON.parse(JSON.stringify(groupingVariable)));
        console.log('[Worker] Received grouping data (first 5 rows):', groupingData ? groupingData.slice(0, 5) : 'No data');
    }
    console.log('[Worker] Received options:', JSON.parse(JSON.stringify(options || {})));
    // --- End of Debugging ---

    try {
        let results = {};
        analysisType.forEach(type => {
            const CalculatorClass = calculators[type];
            if (!CalculatorClass) {
                throw new Error(`Tipe analisis tidak valid: ${type}`);
            }

            let calculator;

            if (type === 'oneSampleTTest') {
                calculator = new CalculatorClass({ 
                    variable, 
                    data, 
                    options 
                });

                console.log('[Worker] Calculator instance created:', JSON.stringify(calculator));
                console.log('[Worker] One Sample Statistics Results:', JSON.stringify(calculator.getOutput().oneSampleStatistics));
                console.log('[Worker] One Sample Test Results:', JSON.stringify(calculator.getOutput().oneSampleTest));
                results.oneSampleStatistics = calculator.getOutput().oneSampleStatistics;
                results.oneSampleTest = calculator.getOutput().oneSampleTest;
            } else if (type === 'independentSamplesTTest') {
                calculator = new CalculatorClass({ 
                    variable,
                    groupingVariable,
                    data,
                    groupingData,
                    options
                });

                console.log('[Worker] Calculator instance created:', JSON.stringify(calculator));
                console.log('[Worker] Group Statistics Results:', JSON.stringify(calculator.getOutput().groupStatistics));
                console.log('[Worker] Independent Samples Test Results:', JSON.stringify(calculator.getOutput().independentSamplesTest));
                results.groupStatistics = calculator.getOutput().groupStatistics;
                results.independentSamplesTest = calculator.getOutput().independentSamplesTest;
            } else if (type === 'pairedSamplesTTest') {
                calculator = new CalculatorClass({ 
                    variable, 
                    data, 
                    groupingVariable, 
                    groupingData, 
                    weights, 
                    options 
                });
            } else if (type === 'oneWayAnova') {
                calculator = new CalculatorClass({ 
                    variable, 
                    data, 
                    weights, 
                    options 
                });
            } else if (type === 'effectSize') {
                calculator = new CalculatorClass({ 
                    variable, 
                    data, 
                    options 
                });
            } else {
                calculator = new CalculatorClass({ 
                    variable, 
                    data, 
                    options 
                });
            }
            console.log('[Worker] Calculator instance created:', JSON.stringify(calculator));
            console.log('[Worker] Results:', JSON.stringify(results));
        });

        console.log('[Worker] Final results:', JSON.stringify(results));

        const postMessageBody = {
            status: 'success',
            variableName: variable.name || 'unknown',
            results: results,
        }

        postMessage(postMessageBody);

    } catch (error) {
        console.error(`[Worker] Error dalam worker untuk variabel ${variable?.name || 'unknown'}:`, error);
        postMessage({
            status: 'error',
            variableName: variable?.name || 'unknown',
            error: error.message,
        });
    }
};