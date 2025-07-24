import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    TwoRelatedSamplesAnalysisProps,
    TwoRelatedSamplesResults,
    TwoRelatedSamplesResult
} from '../types';

import {
    formatDescriptiveStatisticsTable,
    formatRanksFrequenciesTable,
    formatTestStatisticsTable,
} from '../utils/formatters';

export const useTwoRelatedSamplesAnalysis = ({
    testVariables1,
    testVariables2,
    testType,
    displayStatistics,
    areAllPairsValid,
    hasDuplicatePairs,
    onClose
}: TwoRelatedSamplesAnalysisProps) => {
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();
    
    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const workerRef = useRef<Worker | null>(null);
    
    const resultsRef = useRef<TwoRelatedSamplesResult[]>([]);
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);

    const runAnalysis = useCallback(async (): Promise<void> => {
        if (testVariables1.length === 0 || testVariables2.length === 0) {
            setErrorMsg('Please select at least one variable to analyze.');
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
            analysisTypes = ['descriptiveStatistics', 'twoRelatedSamples'];
        } else {
            analysisTypes = ['twoRelatedSamples'];
        }

        for (let i = 0; i < testVariables1.length; i++) {
            const dataForVar1 = analysisData.map(row => row[testVariables1[i].columnIndex]);
            const dataForVar2 = analysisData.map(row => row[testVariables2[i].columnIndex]);
            const payload = {
                analysisType: analysisTypes,
                variable1: testVariables1[i],
                variable2: testVariables2[i],
                data1: dataForVar1,
                data2: dataForVar2,
                options: { testType, displayStatistics }
            };
            worker.postMessage(payload);
        }

        worker.onmessage = async (event) => {
            const { variableName, results, status, error: workerError } = event.data;

            if (status === 'success' && results) {
                if (results.descriptiveStatistics) {
                    const { variable1, variable2, N1, Mean1, StdDev1, Min1, Max1, Percentile25_1, Percentile50_1, Percentile75_1, N2, Mean2, StdDev2, Min2, Max2, Percentile25_2, Percentile50_2, Percentile75_2 } = results.descriptiveStatistics;

                    if (variable1 && variable2 && N1 && Mean1 !== undefined && StdDev1 !== undefined && Min1 !== undefined && Max1 !== undefined && Percentile25_1 !== undefined && Percentile50_1 !== undefined && Percentile75_1 !== undefined && N2 && Mean2 !== undefined && StdDev2 !== undefined && Min2 !== undefined && Max2 !== undefined && Percentile25_2 !== undefined && Percentile50_2 !== undefined && Percentile75_2 !== undefined) {
                        resultsRef.current.push({
                            variable1,
                            variable2,
                            descriptiveStatistics: {
                                N1,
                                Mean1,
                                StdDev1,
                                Min1,
                                Max1,
                                Percentile25_1,
                                Percentile50_1,
                                Percentile75_1,
                                N2,
                                Mean2,
                                StdDev2,
                                Min2,
                                Max2,
                                Percentile25_2,
                                Percentile50_2,
                                Percentile75_2
                            }
                        });
                    } else {
                        console.error(`Error processing descriptive statistics for ${variableName}:`, workerError);
                        const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                        errorCountRef.current += 1;
                    }
                }
                if (results.ranksFrequencies) {
                    const { variable1, variable2, negative, positive, ties, total } = results.ranksFrequencies;

                    if (variable1 && variable2 && negative !== undefined && positive !== undefined && ties !== undefined && total !== undefined) {
                        resultsRef.current.push({
                            variable1,
                            variable2,
                            ranksFrequencies: {
                                negative,
                                positive,
                                ties,
                                total
                            }
                        });
                    } else {
                        console.error(`Error processing ranks frequencies for ${variableName}:`, workerError);
                        const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                        errorCountRef.current += 1;
                    }
                }

                if (results.testStatisticsWilcoxon) {
                    const { variable1, variable2, zValue, pValue } = results.testStatisticsWilcoxon;

                    if (variable1 && variable2 && zValue !== undefined && pValue !== undefined) {
                        resultsRef.current.push({
                            variable1,
                            variable2,
                            testStatisticsWilcoxon: {
                                Z: zValue,
                                PValue: pValue
                            }
                        });
                    } else {
                        console.error(`Error processing two related samples test statistics wilcoxon for ${variableName}:`, workerError);
                        const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                        errorCountRef.current += 1;
                    }
                }

                if (results.testStatisticsSign) {
                    const { variable1, variable2, zValue, pValue } = results.testStatisticsSign;

                    if (variable1 && variable2 && zValue !== undefined && pValue !== undefined) {
                        resultsRef.current.push({
                            variable1,
                            variable2,
                            testStatisticsSign: {
                                Z: zValue,
                                PValue: pValue
                            }
                        });
                    } else {
                        console.error(`Error processing two related samples test statistics sign for ${variableName}:`, workerError);
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
            processedCountRef.current += 1;
            console.log('[Results after] processedCountRef.current:', processedCountRef.current);

            if (processedCountRef.current === testVariables1.length) {
                if (resultsRef.current.length > 0) {
                    try {
                        const descriptiveStatistics = resultsRef.current.filter(r => 'descriptiveStatistics' in (r as any));
                        const ranksFrequencies = resultsRef.current.filter(r => 'ranksFrequencies' in (r as any));
                        const testStatisticsWilcoxon = resultsRef.current.filter(r => 'testStatisticsWilcoxon' in (r as any));
                        const testStatisticsSign = resultsRef.current.filter(r => 'testStatisticsSign' in (r as any));
                      
                        const results: TwoRelatedSamplesResults = {
                            descriptiveStatistics,
                            ranksFrequencies,
                            testStatisticsWilcoxon,
                            testStatisticsSign
                        };

                        console.log('Results to format:', JSON.stringify(results));

                        // Prepare log message
                        const variableNames1 = testVariables1.map(v => v.name).join(" ");
                        const variableNames2 = testVariables2.map(v => v.name).join(" ");
                        let logMsg = `NPAR TEST`;


                        if (testType.wilcoxon) {
                            logMsg += `{WILCOXON=${variableNames1} WITH ${variableNames2} (PAIRED)}`;
                        }

                        if (testType.sign) {
                            logMsg += `{SIGN=${variableNames1} WITH ${variableNames2} (PAIRED)}`;
                        }

                        if (testType.mcNemar) {
                            logMsg += `{MCNEMAR=${variableNames1} WITH ${variableNames2} (PAIRED)}`;
                        }

                        if (testType.marginalHomogeneity) {
                            logMsg += `{MH=${variableNames1} WITH ${variableNames2} (PAIRED)}`;
                        }

                        if (displayStatistics?.descriptive || displayStatistics?.quartiles) {
                            logMsg += `{STATISTICS`;
                            if (displayStatistics.descriptive) logMsg += ` DESCRIPTIVES`;
                            if (displayStatistics.quartiles) logMsg += ` QUARTILES`;
                            logMsg += `}`;
                        }


                        // Save to database
                        const logId = await addLog({ log: logMsg });
                        const analyticId = await addAnalytic(logId, { title: "Two Related Samples Test" });



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

                        if (testType.wilcoxon) {
                            const formattedRanksFrequenciesTable = formatRanksFrequenciesTable(results, "WILCOXON");
                            console.log('Formatted frequencies ranks table:', JSON.stringify(formattedRanksFrequenciesTable));

                            await addStatistic(analyticId, {
                                title: "Ranks",
                                output_data: JSON.stringify({ tables: [formattedRanksFrequenciesTable] }),
                                components: "Wilcoxon Test",
                                description: ""
                            });

                            const formattedTestStatisticsTable = formatTestStatisticsTable(results, "WILCOXON");
                            console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));

                            await addStatistic(analyticId, {
                                title: "Test Statistics",
                                output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                                components: "Wilcoxon Test",
                                description: ""
                            });
                        }

                        if (testType.sign) {
                            const formattedRanksFrequenciesTable = formatRanksFrequenciesTable(results, "SIGN");
                            console.log('Formatted frequencies ranks table:', JSON.stringify(formattedRanksFrequenciesTable));

                            await addStatistic(analyticId, {
                                title: "Frequencies",
                                output_data: JSON.stringify({ tables: [formattedRanksFrequenciesTable] }),
                                components: "Sign Test",
                                description: ""
                            });

                            const formattedTestStatisticsTable = formatTestStatisticsTable(results, "SIGN");
                            console.log('Formatted test statistics table:', JSON.stringify(formattedTestStatisticsTable));

                            await addStatistic(analyticId, {
                                title: "Test Statistics",
                                output_data: JSON.stringify({ tables: [formattedTestStatisticsTable] }),
                                components: "Sign Test",
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
    }, [testVariables1, testVariables2, testType, displayStatistics, addLog, addAnalytic, addStatistic, onClose, analysisData]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("Two Related Samples Test calculation cancelled.");
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

export default useTwoRelatedSamplesAnalysis;