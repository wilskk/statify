import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    KIndependentSamplesTestAnalysisProps,
    KIndependentSamplesTestResults,
    KIndependentSamplesTestResult
} from '../types';

import {
    formatRanksTable,
    formatKruskalWallisHTestStatisticsTable,
    // formatFrequenciesTable,
    // formatMedianTestStatisticsTable,
    // formatJonckheereTerpstraTestTable,
    formatDescriptiveStatisticsTable,
} from '../utils/formatters';

export const useKIndependentSamplesAnalysis = ({
    testVariables,
    groupingVariable,
    minimum,
    maximum,
    testType,
    displayStatistics,
    onClose
}: KIndependentSamplesTestAnalysisProps) => {
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();
    
    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const workerRef = useRef<Worker | null>(null);
    
    const resultsRef = useRef<KIndependentSamplesTestResult[]>([]);
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);

    const runAnalysis = useCallback(async (): Promise<void> => {
        if (testVariables.length === 0) {
            setErrorMsg('Please select at least one variable to analyze.');
            return;
        }

        if (!groupingVariable) {
            setErrorMsg("Please select a grouping variable.");
            return;
        }

        if (minimum === null || maximum === null) {
            setErrorMsg("Please define grouping variable range.");
            return;
        }

        if (!testType.kruskalWallisH && !testType.median && 
            !testType.jonckheereTerpstra) {
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

        const worker = new Worker('/workers/NonparametricTests/manager.js', { type: 'module' });
        workerRef.current = worker;

        let analysisTypes;
        if (displayStatistics.descriptive || displayStatistics.quartiles) {
            analysisTypes = ['descriptiveStatistics', 'kIndependentSamples'];
        } else {
            analysisTypes = ['kIndependentSamples'];
        }

        testVariables.forEach(variable => {
            const dataForVar = analysisData.map(row => row[variable.columnIndex]);
            const groupingDataForVar = analysisData.map(row => row[groupingVariable.columnIndex]);
            const payload = {
                analysisType: analysisTypes,
                variable,
                data: dataForVar,
                groupingVariable,
                groupingData: groupingDataForVar,
                options: { testType, displayStatistics, minimum, maximum }
            };
            worker.postMessage(payload);
        });

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

                if (results.testStatisticsKruskalWallisH) {
                    const { variable, H, df, pValue } = results.testStatisticsKruskalWallisH;

                    if (variable && H !== undefined && df !== undefined && pValue !== undefined) {
                        resultsRef.current.push({
                            variable,
                            testStatisticsKruskalWallisH: {
                                H,
                                df,
                                pValue
                            }
                        });
                    } else {
                        console.error(`Error processing test statistics for ${variableName}:`, workerError);
                        const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                        errorCountRef.current += 1;
                    }
                }

                // if (results.frequencies) {
                //     const { variable, group1, group2 } = results.frequencies;

                //     if (variable && group1 && group2) {
                //         resultsRef.current.push({
                //             variable,
                //             frequencies: {
                //                 group1,
                //                 group2
                //             }
                //         });
                //     } else {
                //         console.error(`Error processing test statistics for ${variableName}:`, workerError);
                //         const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                //         setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                //         errorCountRef.current += 1;
                //     }
                // }

                // if (results.testStatisticsMedian) {
                //     const { variable, N, Median, ChiSquare, df, pValue } = results.testStatisticsMedian;

                //     if (variable && N && Median && ChiSquare && df && pValue) {
                //         resultsRef.current.push({
                //             variable,
                //             testStatisticsMedian: {
                //                 N,
                //                 Median,
                //                 ChiSquare,
                //                 df,
                //                 pValue
                //             }
                //         });
                //     } else {
                //         console.error(`Error processing test statistics for ${variableName}:`, workerError);
                //         const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                //         setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                //         errorCountRef.current += 1;
                //     }
                // }

                // if (results.jonckheereTerpstraTest) {
                //     const { variable, Levels, N, Observed, Mean, StdDev, Std, pValue } = results.jonckheereTerpstraTest;

                //     if (variable && Levels && N && Observed && Mean && StdDev && Std && pValue) {
                //         resultsRef.current.push({
                //             variable,
                //             jonckheereTerpstraTest: {
                //                 Levels,
                //                 N,
                //                 Observed,
                //                 Mean,
                //                 StdDev,
                //                 Std,
                //                 pValue
                //             }
                //         });
                //     } else {
                //         console.error(`Error processing test statistics for ${variableName}:`, workerError);
                //         const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                //         setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                //         errorCountRef.current += 1;
                //     }
                // }
            } else {
                console.error(`Error processing ${variableName}:`, workerError);
                const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                errorCountRef.current += 1;
            }
            console.log('[Results before] processedCountRef.current:', processedCountRef.current);
            processedCountRef.current += 1;
            console.log('[Results after] processedCountRef.current:', processedCountRef.current);

            if (processedCountRef.current === testVariables.length) {
                if (resultsRef.current.length > 0) {
                    try {
                        const descriptiveStatistics = resultsRef.current.filter(r => 'descriptiveStatistics' in (r as any));
                        const ranks = resultsRef.current.filter(r => 'ranks' in (r as any));
                        const testStatisticsKruskalWallisH = resultsRef.current.filter(r => 'testStatisticsKruskalWallisH' in (r as any));
                        // const frequencies = resultsRef.current.filter(r => 'frequencies' in (r as any));
                        // const testStatisticsMedian = resultsRef.current.filter(r => 'testStatisticsMedian' in (r as any));
                        // const jonckheereTerpstraTest = resultsRef.current.filter(r => 'jonckheereTerpstraTest' in (r as any));
                      
                        const results: KIndependentSamplesTestResults = {
                            descriptiveStatistics,
                            ranks,
                            testStatisticsKruskalWallisH,
                            // frequencies,
                            // testStatisticsMedian,
                            // jonckheereTerpstraTest
                        };

                        console.log('Results to format:', JSON.stringify(results));

                        // Prepare log message
                        const variableNames = testVariables.map(v => v.name).join(" ");
                        let logMsg = `NPAR TESTS`;

                        if (testType.kruskalWallisH) {
                            logMsg += `{K-W=${variableNames} BY ${groupingVariable.name}(${minimum} ${maximum})}`;
                        }

                        if (testType.median) {
                            logMsg += `{MEDIAN=${variableNames} BY ${groupingVariable.name}(${minimum} ${maximum})}`;
                        }

                        if (testType.jonckheereTerpstra) {
                            logMsg += `{J-T=${variableNames} BY ${groupingVariable.name}(${minimum} ${maximum})}`;
                        }

                        if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
                            logMsg += `{STATISTICS`;
                            if (displayStatistics.descriptive) logMsg += ` DESCRIPTIVES`;
                            if (displayStatistics.quartiles) logMsg += ` QUARTILES`;
                            logMsg += `}`;
                        }

                        // Save to database
                        const logId = await addLog({ log: logMsg });
                        const analyticId = await addAnalytic(logId, { title: "K Independent Samples Test" });

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

                        if (testType.kruskalWallisH) {
                            const formattedRanksTable = formatRanksTable(results, groupingVariable.label || groupingVariable.name);
                            console.log('Formatted ranks table:', JSON.stringify(formattedRanksTable));

                            await addStatistic(analyticId, {
                                title: "Ranks",
                                output_data: JSON.stringify({ tables: [formattedRanksTable] }),
                                components: "Kruskal-Wallis Test",
                                description: ""
                            });

                            const formattedTestStatisticsTable = formatKruskalWallisHTestStatisticsTable(results);
                            console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));

                            await addStatistic(analyticId, {
                                title: "Test Statistics",
                                output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                                components: "Kruskal-Wallis Test",
                                description: ""
                            });
                        }

                        // if (testType.median) {
                        //     const formattedFrequenciesTable = formatFrequenciesTable(results, groupingVariable.label || groupingVariable.name);
                        //     console.log('Formatted frequencies table:', JSON.stringify(formattedFrequenciesTable));

                        //     await addStatistic(analyticId, {
                        //         title: "Frequencies",
                        //         output_data: JSON.stringify({ tables: [formattedFrequenciesTable] }),
                        //         components: "Median Test",
                        //         description: ""
                        //     });

                        //     const formattedTestStatisticsTable = formatMedianTestStatisticsTable(results);
                        //     console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));

                        //     await addStatistic(analyticId, {
                        //         title: "Test Statistics",
                        //         output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                        //         components: "Median Test",
                        //         description: ""
                        //     });
                        // }

                        // if (testType.jonckheereTerpstra) {
                        //     const formattedJonckheereTerpstraTestTable = formatJonckheereTerpstraTestTable(results);
                        //     console.log('Formatted test statistics table:', JSON.stringify(formattedJonckheereTerpstraTestTable));

                        //     await addStatistic(analyticId, {
                        //         title: "Jonckheere-Terpstra Test",
                        //         output_data: JSON.stringify({ tables: [formattedJonckheereTerpstraTestTable] }),
                        //         components: "Jonckheere-Terpstra Test",
                        //         description: ""
                        //     });
                        // }

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
    }, [testVariables, groupingVariable, minimum, maximum, testType, displayStatistics, addLog, addAnalytic, addStatistic, onClose, analysisData]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("K Independent Samples Test calculation cancelled.");
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

export default useKIndependentSamplesAnalysis;