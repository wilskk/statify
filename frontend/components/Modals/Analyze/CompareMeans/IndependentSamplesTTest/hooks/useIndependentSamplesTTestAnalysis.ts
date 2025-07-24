import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    IndependentSamplesTTestAnalysisProps,
    IndependentSamplesTTestResults,
    IndependentSamplesTTestResult
} from '../types';

import {
    formatGroupStatisticsTable,
    formatIndependentSamplesTestTable,
    // formatEffectSizeTable,
} from '../utils/formatters';

export const useIndependentSamplesTTestAnalysis = ({
    testVariables,
    groupingVariable,
    defineGroups,
    group1,
    group2,
    cutPointValue,
    estimateEffectSize,
    onClose
}: IndependentSamplesTTestAnalysisProps) => {
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();
    
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const workerRef = useRef<Worker | null>(null);

    const resultsRef = useRef<IndependentSamplesTTestResult[]>([]);
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);
    
    const runAnalysis = useCallback(async (): Promise<void> => {
        if (testVariables.length === 0) {
            setErrorMsg("Please select at least one test variable.");
            return;
        }
        
        if (!groupingVariable) {
            setErrorMsg("Please select a grouping variable.");
            return;
        }
        
        if ((defineGroups.useSpecifiedValues && (!group1 || !group2)) || 
            (!defineGroups.useSpecifiedValues && !cutPointValue)) {
            setErrorMsg("Please define groups for the grouping variable.");
            return;
        }
        
        setErrorMsg(null);
        setIsCalculating(true);

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

        const worker = new Worker('/workers/CompareMeans/manager.js', { type: 'module' });
        workerRef.current = worker;

        let analysisTypes;
        if (estimateEffectSize) {
            analysisTypes = ['independentSamplesTTest'];
            // analysisTypes = ['independentSamplesTTest', 'effectSize'];
        } else {
            analysisTypes = ['independentSamplesTTest'];
        }

        testVariables.forEach(variable => {
            const dataForVar = analysisData.map(row => row[variable.columnIndex]);
            const dataForGroupingVar = analysisData.map(row => row[groupingVariable.columnIndex]);
            const payload = {
                analysisType: analysisTypes,
                variable,
                data: dataForVar,
                groupingVariable,
                groupingData: dataForGroupingVar,
                options: { defineGroups, group1, group2, cutPointValue, estimateEffectSize }
            };
            console.log("payload", JSON.stringify(payload));
            worker.postMessage(payload);
        });

        worker.onmessage = async (event) => {
            const { variableName, results, status, error: workerError } = event.data;

            if (status === 'success' && results) {
                if (results.groupStatistics) {
                    const { variable, group1, group2 } = results.groupStatistics;

                    if (variable && group1 && group2) {
                        resultsRef.current.push({
                            variable,
                            stats: {
                                group1,
                                group2
                            }
                        });
                    } else {
                        console.error(`Error processing group statistics for ${variableName}:`, workerError);
                        const errorMsg = `Calculation failed for group statistics for ${variableName}: ${workerError || 'Unknown error'}`;
                        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                        errorCountRef.current += 1;
                    }
                }
                
                if (results.independentSamplesTest) {
                    const { variable, levene, equalVariances, unequalVariances } = results.independentSamplesTest;

                    if (variable && levene && equalVariances && unequalVariances) {
                        resultsRef.current.push({
                            variable,
                            stats: {
                                levene,
                                equalVariances,
                                unequalVariances
                            }
                        });
                    } else {
                        console.error(`Error processing independent samples test for ${variableName}:`, workerError);
                        const errorMsg = `Calculation failed for independent samples test for ${variableName}: ${workerError || 'Unknown error'}`;
                        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                        errorCountRef.current += 1;
                    }
                }

                // if (results.independentSamplesEffectSize) {
                //     const { variable, stats } = results.independentSamplesEffectSize;

                //     if (variable && stats) {
                //         resultsRef.current.push({
                //             variable,
                //             stats
                //         });
                //     } else {
                //         console.error(`Error processing ${variableName}:`, workerError);
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

            processedCountRef.current += 1;

            if (processedCountRef.current === testVariables.length) {
                if (resultsRef.current.length > 0) {
                    try {
                        const groupStatistics = resultsRef.current.filter(r => 'group1' in (r.stats as any));
                        const independentSamplesTest = resultsRef.current.filter(r => 'levene' in (r.stats as any));
                        // const independentSamplesEffectSize = resultsRef.current.filter(r => 'Mean' in (r.stats as any));

                        const results: IndependentSamplesTTestResults = {
                            groupStatistics,
                            independentSamplesTest,
                            // independentSamplesEffectSize
                        };

                        // Format tables
                        const formattedGroupStatisticsTable = formatGroupStatisticsTable(results, groupingVariable.label || groupingVariable.name);
                        const formattedIndependentSamplesTestTable = formatIndependentSamplesTestTable(results);
                        // const formattedIndependentSamplesEffectSizeTable = formatEffectSizeTable(results);

                        const variableNames = testVariables.map(v => v.name);
                        let logMsg = `T-TEST`;

                        if (defineGroups.useSpecifiedValues) {
                            logMsg += `GROUPS=${groupingVariable.name}(${group1} ${group2}) {${variableNames.join(" ")}}`;
                        } else {
                            logMsg += `GROUPS=${groupingVariable.name}(${cutPointValue}) {${variableNames.join(" ")}}`;
                        }

                        // Only add tests that are enabled
                        if (estimateEffectSize) {
                            logMsg += `{ES DISPLAY (TRUE)}`;
                        } else {
                            logMsg += `{ES DISPLAY (FALSE)}`;
                        }

                        logMsg += `{CRITERIA=0.95}`;

                        const logId = await addLog({ log: logMsg });
                        const analyticId = await addAnalytic(logId, { title: "T-Test", note: "" });

                        // Add group statistics table
                        await addStatistic(analyticId, {
                            title: "Independent Samples T-Test",
                            output_data: JSON.stringify({ tables: [formattedGroupStatisticsTable] }),
                            components: "Group Statistics",
                            description: ""
                        });

                        // Add test statistics table
                        await addStatistic(analyticId, {
                            title: "Independent Samples T-Test",
                            output_data: JSON.stringify({ tables: [formattedIndependentSamplesTestTable] }),
                            components: "Independent Samples Test",
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
    }, [testVariables, groupingVariable, defineGroups, group1, group2, cutPointValue, estimateEffectSize, addLog, addStatistic, addAnalytic, analysisData, onClose]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("Independent Samples T-Test calculation cancelled.");
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

export default useIndependentSamplesTTestAnalysis; 