import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    KRelatedSamplesAnalysisProps,
    KRelatedSamplesResults,
    KRelatedSamplesResult
} from '../types';

import {
    formatRanksTable,
    formatFrequenciesTable,
    formatTestStatisticsTable,
    formatDescriptiveStatisticsTable,
} from '../utils/formatters';

export const useKRelatedSamplesAnalysis = ({
    testVariables,
    testType,
    displayStatistics,
    onClose
}: KRelatedSamplesAnalysisProps) => {
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();
    
    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const workerRef = useRef<Worker | null>(null);
    
    const resultsRef = useRef<KRelatedSamplesResult[]>([]);
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);
    const processedCountBatchRef = useRef<number>(0);

    const runAnalysis = useCallback(async (): Promise<void> => {
        if (testVariables.length < 2) {
            setErrorMsg('Please select at least two variables to analyze.');
            return;
        }

        if (!testType.friedman && !testType.kendallsW && !testType.cochransQ) {
            setErrorMsg("Please select at least one test type.");
            return;
        }

        setIsCalculating(true);
        setErrorMsg(null);

        try {
            await useDataStore.getState().checkAndSave();
        } catch (e: any) {
            setErrorMsg(`Failed to save pending changes: ${e.message}`);
            setIsCalculating(false);
            return;
        }

        // Reset refs for new analysis run
        resultsRef.current = [];
        errorCountRef.current = 0;
        processedCountRef.current = 0;
        processedCountBatchRef.current = 0;

        const worker = new Worker('/workers/NonparametricTests/manager.js', { type: 'module' });
        workerRef.current = worker;

        const batch = testVariables.map(variable => ({
            variable,
            data: analysisData.map(row => row[variable.columnIndex]).filter(item => item !== null && item !== undefined) as (string | number)[],
        }));

        if (displayStatistics.descriptive || displayStatistics.quartiles) {
            testVariables.forEach(variable => {
                const dataForVar = analysisData.map(row => row[variable.columnIndex]);
                const descriptiveStatisticsPayload = {
                    analysisType: ['descriptiveStatistics'],
                    variable,
                    data: dataForVar,
                    options: { displayStatistics }
                };
                worker.postMessage(descriptiveStatisticsPayload);
                console.log('[Results] processedCountBatchRef.current:', processedCountBatchRef.current);
                processedCountBatchRef.current += 1;
            });
        }

        const payload = {
            analysisType: ['kRelatedSamples'],
            variable: 'K-Related Samples Test',
            batchVariable: batch.map(vd => vd.variable),
            data: batch.map(vd => vd.data),
            batchData: batch.flatMap(vd => vd.data),
            options: { 
                testType,
                k: testVariables.length
            }
        };
        worker.postMessage(payload);
        console.log('[Results] processedCountBatchRef.current:', processedCountBatchRef.current);
        processedCountBatchRef.current += 1;
        worker.onmessage = async (event) => {
            const { variableName, results, status, error: workerError } = event.data;
            
            if (status === 'success' && results) {
                if (results.descriptiveStatistics) {
                    const { variable, N, Mean, StdDev, Min, Max, Percentile25, Percentile50, Percentile75 } = results.descriptiveStatistics;

                    if (variable && N && Mean && StdDev && Min && Max && Percentile25 && Percentile50 && Percentile75) {
                        resultsRef.current.push({
                            variable,
                            descriptiveStatistics: {
                                N,
                                Mean,
                                StdDev,
                                Min,
                                Max,
                                Percentile25,
                                Percentile50,
                                Percentile75
                            }
                        });
                    } else {
                        console.error(`Error processing descriptive statistics for ${variableName}:`, workerError);
                        const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                        errorCountRef.current += 1;
                    }
                }

                if (results.ranks) {
                    const { variable, groups } = results.ranks;

                    if (variable && Array.isArray(groups)) {
                        resultsRef.current.push({
                            variable,
                            ranks: { groups }
                        });
                    } else {
                        console.error(`Error processing ranks for ${variableName}:`, workerError);
                        const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                        errorCountRef.current += 1;
                    }
                }

                if (results.frequencies) {
                    const { variable, groups } = results.frequencies;

                    if (variable && Array.isArray(groups)) {
                        resultsRef.current.push({
                            variable,
                            frequencies: {
                                groups
                            }
                        });
                    } else {
                        console.error(`Error processing ranks for ${variableName}:`, workerError);
                        const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                        errorCountRef.current += 1;
                    }
                }

                console.log('[Results] testStatistics:', JSON.stringify(results.testStatistics));
                // Jika results.testStatistics undefined, maka blok di bawah ini tidak akan dijalankan
                // Artinya, tidak ada hasil statistik uji yang akan diproses atau dimasukkan ke resultsRef.current
                if (results.testStatistics) {
                    const { variable, TestType, N, W, TestValue, PValue, df } = results.testStatistics;

                    if (variable && TestType && N && TestValue && PValue && df) {
                        resultsRef.current.push({
                            variable,
                            testStatistics: {
                                TestType,
                                N,
                                W,
                                TestValue,
                                PValue,
                                df
                            }
                        });
                    } else {
                        console.error(`Error processing test statistics for ${variableName}:`, workerError);
                        const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                        errorCountRef.current += 1;
                    }
                }
            } else {
                console.error(`Error processing ${variableName}:`, workerError);
                const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                errorCountRef.current += 1;
            }
            console.log('[Results before] processedCountRef.current:', processedCountRef.current);
            console.log('[Results] processedCountBatchRef.current:', processedCountBatchRef.current);
            processedCountRef.current += 1;
            console.log('[Results after] processedCountRef.current:', processedCountRef.current);
            console.log('[Results after] processedCountBatchRef.current:', processedCountBatchRef.current);

            if (processedCountRef.current === processedCountBatchRef.current) {

                if (resultsRef.current.length > 0) {
                    try {
                        console.log('[Results] resultsRef.current:', JSON.stringify(resultsRef.current));
                        const descriptiveStatistics = resultsRef.current.filter(r => 'descriptiveStatistics' in (r as any));
                        const ranks = resultsRef.current.filter(r => 'ranks' in (r as any));
                        const frequencies = resultsRef.current.filter(r => 'frequencies' in (r as any));
                        const testStatistics = resultsRef.current.filter(r => 'testStatistics' in (r as any));
                        
                        const results: KRelatedSamplesResults = {
                            descriptiveStatistics,
                            ranks,
                            frequencies,
                            testStatistics,
                        };

                        console.log('Results to format:', JSON.stringify(results));

                        // Prepare log message
                        const variableNames = testVariables.map(v => v.name).join(" ");
                        let logMsg = `NPAR TESTS`;

                        if (testType.friedman) {
                            logMsg += `{FRIEDMAN=${variableNames}}`;
                        }

                        if (testType.cochransQ) {
                            logMsg += `{COCHRAN=${variableNames}}`;
                        }

                        if (testType.kendallsW) {
                            logMsg += `{KENDALL=${variableNames}}`;
                        }

                        if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
                            logMsg += `{STATISTICS`;
                            if (displayStatistics.descriptive) logMsg += ` DESCRIPTIVES`;
                            if (displayStatistics.quartiles) logMsg += ` QUARTILES`;
                            logMsg += `}`;
                        }

                        // Save to database
                        const logId = await addLog({ log: logMsg });
                        const analyticId = await addAnalytic(logId, { title: "K Related Samples Test" });

                        // Add descriptive statistics table
                            if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
                            const formattedDescriptiveStatisticsTable = formatDescriptiveStatisticsTable(results, displayStatistics);
                            console.log('Formatted descriptive statistics table:', JSON.stringify(formattedDescriptiveStatisticsTable));
                        
                            await addStatistic(analyticId, {
                                title: "Descriptive Statistics",
                                output_data: JSON.stringify({ tables: [formattedDescriptiveStatisticsTable] }),
                                components: "Descriptive Statistics",
                                description: ""
                            });
                        }

                        if (testType.friedman) {
                            const formattedRanksTable = formatRanksTable(results);
                            console.log('Formatted ranks table:', JSON.stringify(formattedRanksTable));

                            await addStatistic(analyticId, {
                                title: "Ranks",
                                output_data: JSON.stringify({ tables: [formattedRanksTable] }),
                                components: "Friedman Test",
                                description: ""
                            });

                            const formattedTestStatisticsTable = formatTestStatisticsTable(results, "Friedman Test");
                            console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));

                            await addStatistic(analyticId, {
                                title: "Test Statistics",
                                output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                                components: "Friedman Test",
                                description: ""
                            });
                        }

                        if (testType.cochransQ) {
                            const formattedFrequenciesTable = formatFrequenciesTable(results);
                            console.log('Formatted frequencies table:', JSON.stringify(formattedFrequenciesTable));

                            await addStatistic(analyticId, {
                                title: "Frequencies",
                                output_data: JSON.stringify({ tables: [formattedFrequenciesTable] }),
                                components: "Cochran's Q Test",
                                description: ""
                            });

                            const formattedTestStatisticsTable = formatTestStatisticsTable(results, "Cochran's Q Test");
                            console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));

                            await addStatistic(analyticId, {
                                title: "Test Statistics",
                                output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                                components: "Cochran's Q Test",
                                description: ""
                            });
                        }

                        if (testType.kendallsW) {
                            const formattedRanksTable = formatRanksTable(results);
                            console.log('Formatted ranks table:', JSON.stringify(formattedRanksTable));

                            await addStatistic(analyticId, {
                                title: "Ranks",
                                output_data: JSON.stringify({ tables: [formattedRanksTable] }),
                                components: "Kendall's W Test",
                                description: ""
                            });

                            const formattedTestStatisticsTable = formatTestStatisticsTable(results, "Kendall's W Test");
                            console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));

                            await addStatistic(analyticId, {
                                title: "Test Statistics",
                                output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                                components: "Kendall's W Test",
                                description: ""
                            });
                        }

                        if (onClose) {
                            onClose();
                        }
                    } catch (err) {
                        console.error("Error saving results:", err);
                        setErrorMsg("Error saving results.");
                    }
                }

                setIsCalculating(false);
                worker.terminate();
                workerRef.current = null;
                if (errorCountRef.current === 0) {
                    onClose?.();
                }
            }
            
        };

        worker.onerror = (err) => {
            console.error("A critical worker error occurred:", err);
            setErrorMsg(`A critical worker error occurred: ${err.message}`);
            setIsCalculating(false);
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, [testVariables, testType, displayStatistics, addLog, addAnalytic, addStatistic, onClose, analysisData]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("K Related Samples Test calculation cancelled.");
        }
    }, []);

    useEffect(() => {
        return () => {
            cancelCalculation();
        };
    }, [cancelCalculation]);

    return {
        isCalculating,
        errorMsg,
        runAnalysis,
        cancelCalculation
    };
};

export default useKRelatedSamplesAnalysis;