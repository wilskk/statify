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
// import './libs/runs.js';
// import './libs/twoIndependentSamples.js';
// import './libs/twoRelatedSamples.js';
// import './libs/kIndependentSamples.js';
// import './libs/kRelatedSamples.js';
// import './libs/statisticsDescriptives.js';

// Import functions for descriptives and frequencies
// import { calculateDescriptives } from './libs/descriptives.js';
// import { calculateFrequencies } from './libs/frequencies.js';

// Definisikan global calculator map
const calculators = {
    chiSquare: ChiSquareCalculator
    // runs: RunsCalculator,
    // twoIndependentSamples: TwoIndependentSamplesCalculator,
    // twoRelatedSamples: TwoRelatedSamplesCalculator,
    // kIndependentSamples: KIndependentSamplesCalculator,
    // kRelatedSamples: KRelatedSamplesCalculator,
    // statisticsDescriptives: StatisticsDescriptivesCalculator
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
        const CalculatorClass = calculators[analysisType];
        if (!CalculatorClass) {
            throw new Error(`Tipe analisis tidak valid: ${analysisType}`);
        }

        // Ekstrak argumen dan buat instance kalkulator.
        // Memastikan semua argumen diteruskan secara eksplisit.
        let calculator;
        
        // Handle different calculator types with their specific parameters
        if (analysisType === 'chiSquare') {
            calculator = new CalculatorClass({ 
                variable, 
                data, 
                options 
            });
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
        
        console.log('[Worker] Calculator instance created:', calculator);
        const results = calculator.getOutput();
        console.log('[Worker] Results:', results);
        
        if (analysisType === 'chiSquare') {
            postMessage({
                status: 'success',
                variableName: variable.name || 'unknown',
                specifiedRange: options?.expectedRange?.useSpecifiedRange,
                results: results,
            });
            return;
        }

        postMessage({
            status: 'success',
            variableName: variable.name || 'unknown',
            results: results,
        });

    } catch (error) {
        console.error(`Error dalam worker untuk variabel ${variable?.name || 'unknown'}:`, error);
        postMessage({
            status: 'error',
            variableName: variable?.name || 'unknown',
            error: error.message,
        });
    }
};