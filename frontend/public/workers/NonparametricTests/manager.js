/**
 * @file manager.js
 * @description
 * Entry point (controller) utama untuk semua web worker
 * Nonparametric Tests. Menerima pesan dari main thread, mendelegasikan
 * tugas ke kalkulator yang sesuai (ChiSquare, Runs, TwoIndependentSamples, TwoRelatedSamples, KIndependentSamples, KRelatedSamples),
 * dan mengirimkan hasilnya kembali.
 * 
 * Arsitektur ini memungkinkan penambahan analisis baru dengan mudah
 * tanpa mengubah logika perutean pesan utama.
 */

// Muat semua pustaka kalkulator dan utilitas
import './libs/utils.js';
import './libs/chiSquare.js';
import './libs/runs.js';
// import './libs/twoIndependentSamples.js';
// import './libs/twoRelatedSamples.js';
// import './libs/kIndependentSamples.js';
// import './libs/kRelatedSamples.js';
import './libs/descriptiveStatistics.js';

// Definisikan global calculator map
const calculators = {
    chiSquare: ChiSquareCalculator,
    runs: RunsCalculator,
    // twoIndependentSamples: TwoIndependentSamplesCalculator,
    // twoRelatedSamples: TwoRelatedSamplesCalculator,
    // kIndependentSamples: KIndependentSamplesCalculator,
    // kRelatedSamples: KRelatedSamplesCalculator,
    descriptiveStatistics: DescriptiveStatisticsCalculator
};

/**
 * Menangani pesan masuk dari main thread.
 * @param {MessageEvent} event - Event pesan yang diterima.
 */
onmessage = (event) => {
    const { analysisType, variable, data, options } = event.data;

    // --- Start of Debugging ---
    console.log(`[Worker] Received analysis request: ${analysisType}`);
    console.log('[Worker] Received variable:', JSON.parse(JSON.stringify(variable)));
    console.log('[Worker] Received data (first 5 rows):', data ? data.slice(0, 5) : 'No data');
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

            if (type === 'descriptiveStatistics') {
                calculator = new CalculatorClass({ 
                    variable, 
                    data, 
                    options 
                });

                console.log('[Worker] Calculator instance created:', JSON.stringify(calculator));
                console.log('[Worker] Descriptive Statistics Results:', JSON.stringify(calculator.getOutput().descriptiveStatistics));
                results.descriptiveStatistics = calculator.getOutput().descriptiveStatistics;
            } else if (type === 'chiSquare') {
                calculator = new CalculatorClass({ 
                    variable,
                    data,
                    options
                });

                console.log('[Worker] Calculator instance created:', JSON.stringify(calculator));
                console.log('[Worker] Frequencies Results:', JSON.stringify(calculator.getOutput().frequencies));
                console.log('[Worker] Chi Square Results:', JSON.stringify(calculator.getOutput().testStatistics));
                results.frequencies = calculator.getOutput().frequencies;
                results.testStatistics = calculator.getOutput().testStatistics;

            } else if (type === 'runs') {
                calculator = new CalculatorClass({ 
                    variable, 
                    data,
                    options 
                });

                console.log('[Worker] Calculator instance created:', JSON.stringify(calculator));
                console.log('[Worker] Runs Results:', JSON.stringify(calculator.getOutput().runsTest));
                results.runsTest = calculator.getOutput().runsTest;
            
            // } else if (['twoIndependentSamples', 'kIndependentSamples'].includes(analysisType)) {
            //     calculator = new CalculatorClass({ 
            //         variable, 
            //         data, 
            //         groupingVariable, 
            //         groupingData, 
            //         weights, 
            //         options 
            //     });
            // } else if (['twoRelatedSamples', 'kRelatedSamples'].includes(analysisType)) {
            //     calculator = new CalculatorClass({ 
            //         variable, 
            //         data, 
            //         weights, 
            //         options 
            //     });
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

        let postMessageBody = {
            status: 'success',
            variableName: variable.name || 'unknown',
            results: results,
        }

        if (analysisType.includes('descriptiveStatistics')) {
            postMessageBody.displayStatistics = options?.displayStatistics;
        }

        if (analysisType.includes('chiSquare')) {
            postMessageBody.specifiedRange = options?.expectedRange?.useSpecifiedRange;
        }

        if (analysisType.includes('runs')) {
            postMessageBody.cutPoint = options?.cutPoint;
            postMessageBody.customValue = options?.customValue;
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