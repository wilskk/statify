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
import './libs/twoIndependentSamples.js';
import './libs/twoRelatedSamples.js';
import './libs/kIndependentSamples.js';
import './libs/kRelatedSamples.js';
import './libs/descriptiveStatistics.js';

// Definisikan global calculator map
const calculators = {
    chiSquare: ChiSquareCalculator,
    runs: RunsCalculator,
    twoIndependentSamples: TwoIndependentSamplesCalculator,
    twoRelatedSamples: TwoRelatedSamplesCalculator,
    kIndependentSamples: KIndependentSamplesCalculator,
    kRelatedSamples: KRelatedSamplesCalculator,
    descriptiveStatistics: DescriptiveStatisticsCalculator
};

/**
 * Menangani pesan masuk dari main thread.
 * @param {MessageEvent} event - Event pesan yang diterima.
 */
onmessage = (event) => {
    const { analysisType, variable, variable1, variable2, batchVariable, data, data1, data2, batchData, groupingVariable, groupingData, options } = event.data;
    let variableName;
    if (variable1 && variable2 && data1 && data2) {
        variableName = variable1.name + ' - ' + variable2.name;
    } else if (variable && data) {
        variableName = typeof variable === 'string' ? variable : variable.name || 'unknown';
    }
    // --- Start of Debugging ---
    console.log('[Worker] Received analysis request:', JSON.stringify(analysisType));
    if (analysisType.includes('twoRelatedSamples')) {
        console.log('[Worker] Received variable1:', JSON.stringify(variable1));
        console.log('[Worker] Received variable2:', JSON.stringify(variable2));
        console.log('[Worker] Received data1 (first 5 rows):', data1 ? JSON.stringify(data1.slice(0, 5)) : 'No data');
        console.log('[Worker] Received data2 (first 5 rows):', data2 ? JSON.stringify(data2.slice(0, 5)) : 'No data');
    } else if (analysisType.includes('kRelatedSamples')) {
        console.log('[Worker] Received batch variable:', JSON.stringify(batchVariable));
        console.log('[Worker] Received batch data (first 5 rows):', batchData ? JSON.stringify(batchData.slice(0, 5)) : 'No data');
    } else if (analysisType.includes('kIndependentSamples') || analysisType.includes('twoIndependentSamples')) {
        console.log('[Worker] Received grouping variable:', JSON.stringify(groupingVariable));
        console.log('[Worker] Received grouping data (first 5 rows):', groupingData ? JSON.stringify(groupingData.slice(0, 5)) : 'No data');
    } else {
        console.log('[Worker] Received variable:', JSON.stringify(variable));
        console.log('[Worker] Received data (first 5 rows):', data ? JSON.stringify(data.slice(0, 5)) : 'No data');
    }
    console.log('[Worker] Received options:', JSON.stringify(options || {}));
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
                // Jika variable1, variable2, data1, data2 ada, kirim juga ke calculator
                const calculatorParams = { variable, data, options };
                if (variable1 && variable2 && data1 && data2) {
                    calculatorParams.variable1 = variable1;
                    calculatorParams.variable2 = variable2;
                    calculatorParams.data1 = data1;
                    calculatorParams.data2 = data2;
                }
                calculator = new CalculatorClass(calculatorParams);

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
                console.log('[Worker] Cut Point Results:', JSON.stringify(calculator.getOutput().cutPoint));
                console.log('[Worker] Custom Value Results:', JSON.stringify(calculator.getOutput().customValue));
                console.log('[Worker] Runs Results:', JSON.stringify(calculator.getOutput().runsTest));
                results.cutPoint = calculator.getOutput().cutPoint;
                results.customValue = calculator.getOutput().customValue;
                results.runsTest = calculator.getOutput().runsTest;
            } else if (type === 'twoIndependentSamples') {
                calculator = new CalculatorClass({ 
                    variable, 
                    data, 
                    groupingVariable,
                    groupingData,
                    options 
                });

                console.log('[Worker] Calculator instance created:', JSON.stringify(calculator));
                console.log('[Worker] Frequencies Ranks Results:', JSON.stringify(calculator.getOutput().frequenciesRanks));
                console.log('[Worker] Mann Whitney U Results:', JSON.stringify(calculator.getOutput().testStatisticsMannWhitneyU));
                console.log('[Worker] Kolmogorov Smirnov Z Results:', JSON.stringify(calculator.getOutput().testStatisticsKolmogorovSmirnovZ));
                results.frequenciesRanks = calculator.getOutput().frequenciesRanks;
                results.testStatisticsMannWhitneyU = calculator.getOutput().testStatisticsMannWhitneyU;
                results.testStatisticsKolmogorovSmirnovZ = calculator.getOutput().testStatisticsKolmogorovSmirnovZ;
            } else if (type === 'kIndependentSamples') {
                calculator = new CalculatorClass({ 
                    variable, 
                    data, 
                    groupingVariable, 
                    groupingData, 
                    options 
                });

                console.log('[Worker] Calculator instance created:', JSON.stringify(calculator));
                console.log('[Worker] Ranks Results:', JSON.stringify(calculator.getOutput().ranks));
                console.log('[Worker] Kruskal Wallis H Results:', JSON.stringify(calculator.getOutput().testStatistics));
                console.log('[Worker] Frequencies Results:', JSON.stringify(calculator.getOutput().frequencies));
                console.log('[Worker] Median Results:', JSON.stringify(calculator.getOutput().testStatisticsMedian));
                console.log('[Worker] Jonckheere Terpstra Results:', JSON.stringify(calculator.getOutput().testStatisticsJonckheereTerpstra));
                results.ranks = calculator.getOutput().ranks;
                results.testStatisticsKruskalWallisH = calculator.getOutput().testStatisticsKruskalWallisH;
                results.frequencies = calculator.getOutput().frequencies;
                results.testStatisticsMedian = calculator.getOutput().testStatisticsMedian;
                results.testStatisticsJonckheereTerpstra = calculator.getOutput().testStatisticsJonckheereTerpstra;
            } else if (type === 'twoRelatedSamples') {
                calculator = new CalculatorClass({ 
                    variable1,
                    variable2,
                    data1,
                    data2,
                    options 
                });

                console.log('[Worker] Calculator instance created:', JSON.stringify(calculator));
                console.log('[Worker] Ranks Frequencies Results:', JSON.stringify(calculator.getOutput().ranksFrequencies));
                console.log('[Worker] Test Statistics Wilcoxon Results:', JSON.stringify(calculator.getOutput().testStatisticsWilcoxon));
                console.log('[Worker] Test Statistics Sign Results:', JSON.stringify(calculator.getOutput().testStatisticsSign));
                results.ranksFrequencies = calculator.getOutput().ranksFrequencies;
                results.testStatisticsWilcoxon = calculator.getOutput().testStatisticsWilcoxon;
                results.testStatisticsSign = calculator.getOutput().testStatisticsSign;
            } else if (type === 'kRelatedSamples') {
                calculator = new CalculatorClass({ 
                    batchVariable,
                    variable,
                    batchData,
                    data,
                    options 
                });

                console.log('[Worker] Calculator instance created:', JSON.stringify(calculator));
                console.log('[Worker] Ranks Results:', JSON.stringify(calculator.getOutput().ranks));
                console.log('[Worker] Frequencies Results:', JSON.stringify(calculator.getOutput().frequencies));
                console.log('[Worker] Test Statistics Results:', JSON.stringify(calculator.getOutput().testStatistics));
                results.ranks = calculator.getOutput().ranks;
                results.frequencies = calculator.getOutput().frequencies;
                results.testStatistics = calculator.getOutput().testStatistics;
            } else {
                calculator = new CalculatorClass({ 
                    variable, 
                    data, 
                    options 
                });
            
                console.log('[Worker] Calculator instance created:', JSON.stringify(calculator));
                console.log('[Worker] Results:', JSON.stringify(results));
            }
        });

        console.log('[Worker] Final results:', JSON.stringify(results));

        postMessage({
            status: 'success',
            variableName: variableName,
            results: results,
        });

    } catch (error) {
        console.error(`[Worker] Error dalam worker untuk variabel ${variableName}:`, error);
        postMessage({
            status: 'error',
            variableName: variableName,
            error: error.message,
        });
    }
};