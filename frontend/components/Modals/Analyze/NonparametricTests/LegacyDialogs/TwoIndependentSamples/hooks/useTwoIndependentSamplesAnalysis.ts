import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    TwoIndependentSamplesTestAnalysisProps,
    TwoIndependentSamplesTestResults,
    TwoIndependentSamplesTestResult
} from '../types';

import {
    formatFrequenciesRanksTable,
    formatMannWhitneyUTestStatisticsTable,
    formatKolmogorovSmirnovZTestStatisticsTable,
    formatDescriptiveStatisticsTable,
} from '../utils/formatters';

export const useTwoIndependentSamplesAnalysis = ({
    testVariables,
    groupingVariable,
    group1,
    group2,
    testType,
    displayStatistics,
    onClose
}: TwoIndependentSamplesTestAnalysisProps) => {
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();
    
    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const workerRef = useRef<Worker | null>(null);
    
    const resultsRef = useRef<TwoIndependentSamplesTestResult[]>([]);
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

        if (group1 === null || group2 === null) {
            setErrorMsg("Please define grouping variable range.");
            return;
        }

        if (!testType.mannWhitneyU && !testType.mosesExtremeReactions && 
            !testType.kolmogorovSmirnovZ && !testType.waldWolfowitzRuns) {
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
            analysisTypes = ['descriptiveStatistics', 'twoIndependentSamples'];
        } else {
            analysisTypes = ['twoIndependentSamples'];
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
                options: { testType, displayStatistics, group1, group2 }
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

                if (results.frequenciesRanks) {
                    const { variable, group1, group2 } = results.frequenciesRanks;

                    if (variable && group1 && group2) {
                        resultsRef.current.push({
                            variable,
                            frequenciesRanks: {
                                group1,
                                group2
                            }
                        });
                    } else {
                        console.error(`Error processing frequencies ranks for ${variableName}:`, workerError);
                        const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                        errorCountRef.current += 1;
                    }
                }

                if (results.testStatisticsMannWhitneyU) {
                    const { variable, U, W, Z, pValue, pExact, showExact } = results.testStatisticsMannWhitneyU;

                    if (variable && U !== undefined && W !== undefined && Z !== undefined && pValue !== undefined && pExact !== undefined && showExact !== undefined) {
                        resultsRef.current.push({
                            variable,
                            testStatisticsMannWhitneyU: {
                                U,
                                W,
                                Z,
                                pValue,
                                pExact,
                                showExact
                            }
                        });
                    } else {
                        console.error(`Error processing test statistics for ${variableName}:`, workerError);
                        const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                        errorCountRef.current += 1;
                    }
                }

                if (results.testStatisticsKolmogorovSmirnovZ) {
                    const { variable, D_absolute, D_positive, D_negative, d_stat, pValue } = results.testStatisticsKolmogorovSmirnovZ;

                    if (variable && D_absolute !== undefined && D_positive !== undefined && D_negative !== undefined && d_stat !== undefined && pValue !== undefined) {
                        resultsRef.current.push({
                            variable,
                            testStatisticsKolmogorovSmirnovZ: {
                                D_absolute,
                                D_positive,
                                D_negative,
                                d_stat,
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
                        const descriptiveStatistics = resultsRef.current.filter(r => 'descriptiveStatistics' in (r as any));
                        const frequenciesRanks = resultsRef.current.filter(r => 'frequenciesRanks' in (r as any));
                        const testStatisticsMannWhitneyU = resultsRef.current.filter(r => 'testStatisticsMannWhitneyU' in (r as any));
                        const testStatisticsKolmogorovSmirnovZ = resultsRef.current.filter(r => 'testStatisticsKolmogorovSmirnovZ' in (r as any));
                      
                        const results: TwoIndependentSamplesTestResults = {
                            descriptiveStatistics,
                            frequenciesRanks,
                            testStatisticsMannWhitneyU,
                            testStatisticsKolmogorovSmirnovZ
                        };

                        console.log('Results to format:', JSON.stringify(results));

                        // Prepare log message
                        const variableNames = testVariables.map(v => v.name).join(" ");
                        let logMsg = `NPAR TESTS`;

                        if (testType.mannWhitneyU) {
                            logMsg += `{M-W=${variableNames} BY ${groupingVariable.name}(${group1} ${group2})}`;
                        }

                        if (testType.mosesExtremeReactions) {
                            logMsg += `{MOSES=${variableNames} BY ${groupingVariable.name}(${group1} ${group2})}`;
                        }

                        if (testType.kolmogorovSmirnovZ) {
                            logMsg += `{K-S=${variableNames} BY ${groupingVariable.name}(${group1} ${group2})}`;
                        }

                        if (testType.waldWolfowitzRuns) {
                            logMsg += `{W-W=${variableNames} BY ${groupingVariable.name}(${group1} ${group2})}`;
                        }

                        if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
                            logMsg += `{STATISTICS`;
                            if (displayStatistics.descriptive) logMsg += ` DESCRIPTIVES`;
                            if (displayStatistics.quartiles) logMsg += ` QUARTILES`;
                            logMsg += `}`;
                        }

                        // Save to database
                        const logId = await addLog({ log: logMsg });
                        const analyticId = await addAnalytic(logId, { title: "Two Independent Samples Test" });

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

                        if (testType.mannWhitneyU) {
                            const formattedFrequenciesRanksTable = formatFrequenciesRanksTable(results, groupingVariable.label || groupingVariable.name, "M-W");
                            console.log('Formatted frequencies ranks table:', JSON.stringify(formattedFrequenciesRanksTable));

                            await addStatistic(analyticId, {
                                title: "Ranks",
                                output_data: JSON.stringify({ tables: [formattedFrequenciesRanksTable] }),
                                components: "Mann-Whitney Test",
                                description: ""
                            });

                            const formattedTestStatisticsTable = formatMannWhitneyUTestStatisticsTable(results);
                            console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));

                            await addStatistic(analyticId, {
                                title: "Test Statistics",
                                output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                                components: "Mann-Whitney Test",
                                description: ""
                            });
                        }

                        if (testType.kolmogorovSmirnovZ) {
                            const formattedFrequenciesRanksTable = formatFrequenciesRanksTable(results, groupingVariable.label || groupingVariable.name, "K-S");
                            console.log('Formatted frequencies ranks table:', JSON.stringify(formattedFrequenciesRanksTable));

                            await addStatistic(analyticId, {
                                title: "Frequencies",
                                output_data: JSON.stringify({ tables: [formattedFrequenciesRanksTable] }),
                                components: "Two-Samples Kolmogorov-Smirnov Test",
                                description: ""
                            });

                            const formattedTestStatisticsTable = formatKolmogorovSmirnovZTestStatisticsTable(results);
                            console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));

                            await addStatistic(analyticId, {
                                title: "Test Statistics",
                                output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                                components: "Two-Samples Kolmogorov-Smirnov Test",
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
    }, [testVariables, groupingVariable, group1, group2, testType, displayStatistics, addLog, addAnalytic, addStatistic, onClose, analysisData]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("Two Independent Samples Test calculation cancelled.");
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

export default useTwoIndependentSamplesAnalysis;