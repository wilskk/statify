import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    ChiSquareAnalysisProps,
    ChiSquareResults,
    ChiSquareResult
} from '../types';

import {
    formatFrequenciesTable,
    formatTestStatisticsTable,
    formatDescriptiveStatisticsTable,
} from '../utils/formatters';

export const useChiSquareAnalysis = ({
    testVariables,
    expectedRange,
    rangeValue,
    expectedValue,
    expectedValueList,
    displayStatistics,
    onClose
}: ChiSquareAnalysisProps) => {
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();
    
    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const workerRef = useRef<Worker | null>(null);
    
    const resultsRef = useRef<ChiSquareResult[]>([]);
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);

    const runAnalysis = useCallback(async (): Promise<void> => {
        if (testVariables.length === 0) {
            setErrorMsg('Please select at least one variable to analyze.');
            return;
        }

        if (expectedRange.useSpecifiedRange && !rangeValue.lowerValue && !rangeValue.upperValue) {
            setErrorMsg('Please specify a range of values to analyze.');
            return;
        }

        if (!expectedValue.allCategoriesEqual && expectedValueList.length === 0) {
            setErrorMsg('Please specify a list of values to analyze.');
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
            analysisTypes = ['descriptiveStatistics', 'chiSquare'];
        } else {
            analysisTypes = ['chiSquare'];
        }

        testVariables.forEach(variable => {
            const dataForVar = analysisData.map(row => row[variable.columnIndex]);
            const payload = {
                analysisType: analysisTypes,
                variable,
                data: dataForVar,
                options: { expectedRange, rangeValue, expectedValue, expectedValueList, displayStatistics }
            };
            worker.postMessage(payload);
        });

        worker.onmessage = async (event) => {
            const { variableName, results, status, error: workerError, specifiedRange, displayStatistics } = event.data;

            if (status === 'success' && results) {
                if (results.descriptiveStatistics) {
                    const { variable, N, Mean, StdDev, Min, Max, Percentile25, Percentile50, Percentile75 } = results.descriptiveStatistics;

                    if (variable && N && Mean && StdDev && Min && Max && Percentile25 && Percentile50 && Percentile75) {
                        resultsRef.current.push({
                            variable,
                            displayStatistics,
                            stats: {
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

                if (results.frequencies) {
                    const { variable, categoryList, observedN, expectedN, residual, N } = results.frequencies;

                    if (variable && categoryList && observedN && expectedN && residual && N) {
                        resultsRef.current.push({
                            variable,
                            specifiedRange,
                            stats: {
                                categoryList,
                                observedN,
                                expectedN,
                                residual,
                                N
                            }
                        });
                    } else {
                        console.error(`Error processing frequencies for ${variableName}:`, workerError);
                        const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                        errorCountRef.current += 1;
                    }
                }

                if (results.testStatistics) {
                    const { variable, ChiSquare, DF, PValue } = results.testStatistics;

                    if (variable && ChiSquare !== undefined && DF !== undefined && PValue !== undefined) {
                        resultsRef.current.push({
                          variable,
                          stats: {
                            ChiSquare,
                            DF,
                            PValue
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

            processedCountRef.current += 1;

            if (processedCountRef.current === testVariables.length) {
                if (resultsRef.current.length > 0) {
                    try {
                        const descriptiveStatistics = resultsRef.current.filter(r => 'Mean' in (r.stats as any));
                        const frequencies = resultsRef.current.filter(r => 'categoryList' in (r.stats as any));
                        const testStatistics = resultsRef.current.filter(r => 'ChiSquare' in (r.stats as any));
                      
                        const results: ChiSquareResults = {
                            descriptiveStatistics,
                            frequencies,
                            testStatistics
                        };

                        console.log('Results to format:', JSON.stringify(results));

                        // Format tables
                        const formattedDescriptiveStatisticsTable = formatDescriptiveStatisticsTable(results, displayStatistics);
                        const formattedFrequenciesTable = formatFrequenciesTable(results, specifiedRange);
                        const formattedTestStatisticsTable = formatTestStatisticsTable(results);
                      
                        console.log('Formatted descriptive statistics table:', JSON.stringify(formattedDescriptiveStatisticsTable));
                        console.log('Formatted frequencies table:', JSON.stringify(formattedFrequenciesTable));
                        console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));
                        // Prepare log message
                        const variableNames = testVariables.map(v => v.name).join(" ");
                        let logMsg = `NPAR TESTS`;
                        
                        // Only add tests that are enabled
                        if (expectedRange.useSpecifiedRange) {
                            logMsg += `{CHISQUARE=${variableNames} (${rangeValue.lowerValue},${rangeValue.upperValue})}`;
                        } else {
                            logMsg += `{CHISQUARE=${variableNames}}`;
                        }

                        if (expectedValue.allCategoriesEqual) {
                            logMsg += `{EXPECTED=EQUAL}`;
                        } else {
                            logMsg += `{EXPECTED=${expectedValueList.join(" ")}}`;
                        }

                        if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
                            logMsg += `{STATISTICS`;
                            if (displayStatistics.descriptive) logMsg += ` DESCRIPTIVES`;
                            if (displayStatistics.quartiles) logMsg += ` QUARTILES`;
                            logMsg += `}`;
                        }

                        // Save to database
                        const logId = await addLog({ log: logMsg });
                        const analyticId = await addAnalytic(logId, { title: "Chi-Square Test" });
                            
                                                    
                        // Add descriptive statistics table
                        if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
                            await addStatistic(analyticId, {
                                title: "Chi-Square Test",
                                output_data: JSON.stringify({ tables: [formattedDescriptiveStatisticsTable] }),
                                components: "Descriptive Statistics",
                                description: ""
                            });
                        }

                        // Add frequencies table
                        // Handle both array and single object for formattedFrequenciesTable
                        if (Array.isArray(formattedFrequenciesTable)) {
                            for (const table of formattedFrequenciesTable) {
                                await addStatistic(analyticId, {
                                    title: "Chi-Square Test",
                                    output_data: JSON.stringify({ tables: [table] }),
                                    components: "Frequencies",
                                    description: ""
                                });
                            }
                        } else if (formattedFrequenciesTable) {
                            await addStatistic(analyticId, {
                                title: "Chi-Square Test",
                                output_data: JSON.stringify({ tables: [formattedFrequenciesTable] }),
                                components: "Frequencies",
                                description: ""
                            });
                        }
                            
                        // Add test statistics table
                        await addStatistic(analyticId, {
                            title: "Chi-Square Test",
                            output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                            components: "Chi-Square Test",
                            description: ""
                        });
                            
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
    }, [testVariables, expectedRange, rangeValue, expectedValue, expectedValueList, displayStatistics, onClose, addLog, addAnalytic, addStatistic, analysisData]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("Chi-Square Test calculation cancelled.");
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

export default useChiSquareAnalysis;