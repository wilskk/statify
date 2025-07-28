import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    OneWayAnovaAnalysisProps,
    OneWayAnovaResult,
    Descriptives,
    HomogeneityOfVariance,
    HomogeneousSubsets
} from '../types';

import {
    formatOneWayAnovaTable,
    formatDescriptiveStatisticsTable,
    formatHomogeneityOfVarianceTable,
    formatMultipleComparisonsTable,
    formatHomogeneousSubsetsTable,
    formatErrorTable
} from '../utils/formatters';

export const useOneWayAnovaAnalysis = ({
    testVariables,
    factorVariable,
    estimateEffectSize,
    equalVariancesAssumed,
    statisticsOptions,
    onClose
}: OneWayAnovaAnalysisProps) => {
    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();
    
    const workerRef = useRef<Worker | null>(null);

    const resultsRef = useRef<OneWayAnovaResult[]>([]);
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);
    const insufficientDataVarsRef = useRef<string[]>([]);

    const runAnalysis = useCallback(async (): Promise<void> => {
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
        insufficientDataVarsRef.current = [];

        const worker = new Worker('/workers/CompareMeans/manager.js', { type: 'module' });
        workerRef.current = worker;

        testVariables.forEach(variable => {
            const dataForVar = analysisData.map(row => row[variable.columnIndex]);
            const dataForFactorVar = analysisData.map(row => row[factorVariable!.columnIndex]);
            const payload = {
                analysisType: ['oneWayAnova'],
                variable1: variable,
                data1: dataForVar,
                variable2: factorVariable,
                data2: dataForFactorVar,
                options: { equalVariancesAssumed, statisticsOptions, estimateEffectSize }
            };
            // console.log("payload", JSON.stringify(payload));
            worker.postMessage(payload);
        });

        worker.onmessage = async (event) => {
            // console.log("Received message:", JSON.stringify(event.data));
            const { variableName, results, status, error: workerError } = event.data;

            if (status === 'success' && results) {
                if (results.metadata.hasInsufficientData) {
                    insufficientDataVarsRef.current.push(results.metadata.variable1Name);
                    console.warn(`Insufficient valid data for: ${results.metadata.variable1Name} & ${results.metadata.variable2Name}. Total1: ${results.metadata.totalData1}, Total2: ${results.metadata.totalData2}, Valid1: ${results.metadata.validData1}, Valid2: ${results.metadata.validData2}`);
                }

                // Since the worker now returns simplified structure, we can directly push the results
                resultsRef.current.push(results);
            } else {
                console.error(`Error processing ${variableName}:`, workerError);
                const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                errorCountRef.current += 1;
            }

            processedCountRef.current += 1;

            if (processedCountRef.current === testVariables.length) {

                try {
                    // Format tables - now resultsRef.current contains array of results for each variable
                    // console.log("resultsRef.current", JSON.stringify(resultsRef.current));
                    const formattedOneWayAnovaTable = formatOneWayAnovaTable(resultsRef.current);
                    
                    const variableNames = testVariables.map(v => v.name);
                    let logMsg = `ONEWAY ${variableNames.join(' ')} BY ${factorVariable!.name}`;
                    

                    if (statisticsOptions.descriptive && statisticsOptions.homogeneityOfVariance) {
                        logMsg += `{STATISTICS DESCRIPTIVES HOMOGENEITY}`;
                    } else if (statisticsOptions.descriptive || statisticsOptions.homogeneityOfVariance) {
                        if (statisticsOptions.descriptive) {
                            logMsg += `{STATISTICS DESCRIPTIVES}`;
                        }
                        if (statisticsOptions.homogeneityOfVariance) {
                            logMsg += `{STATISTICS HOMOGENEITY}`;
                        }
                    }

                    logMsg += `{MISSING ANALYSIS}{CRITERIA=CILEVEL(0.95)}`;

                    if (equalVariancesAssumed.tukey && equalVariancesAssumed.duncan) {
                        logMsg += `{POSTHOC=TUKEY DUNCAN ALPHA(0.05)}`;
                    } else if (equalVariancesAssumed.tukey) {
                        logMsg += `{POSTHOC=TUKEY ALPHA(0.05)}`;
                    } else if (equalVariancesAssumed.duncan) {
                        logMsg += `{POSTHOC=DUNCAN ALPHA(0.05)}`;
                    }

                    const logId = await addLog({ log: logMsg });

                    let note = "";
                    if (insufficientDataVarsRef.current.length > 0) {
                        note = `Note: The following variables did not have sufficient valid data for analysis: ${insufficientDataVarsRef.current.join(', ')}. These variables require at least one valid numeric value for ANOVA calculation.`;
                    }

                    const analyticId = await addAnalytic(logId, { title: "Oneway", note: note || undefined });

                    if (insufficientDataVarsRef.current.length < testVariables.length) {
                        // Add Descriptive Statistics table if enabled
                        if (statisticsOptions.descriptive) {
                            const formattedDescriptiveStatisticsTable = formatDescriptiveStatisticsTable(resultsRef.current);
                            await addStatistic(analyticId, {
                                title: "Descriptives",
                                output_data: JSON.stringify({ tables: [formattedDescriptiveStatisticsTable] }),
                                components: "Descriptives",
                                description: ""
                            });
                        }

                        if (insufficientDataVarsRef.current.length === 0) {
                            // Add Homogeneity of Variance table if enabled
                            if (statisticsOptions.homogeneityOfVariance) {
                                const formattedHomogeneityOfVarianceTable = formatHomogeneityOfVarianceTable(resultsRef.current);
                                // console.log("formattedHomogeneityOfVarianceTable", JSON.stringify(formattedHomogeneityOfVarianceTable));
                                await addStatistic(analyticId, {
                                    title: "Test of Homogeneity of Variances",
                                    output_data: JSON.stringify({ tables: [formattedHomogeneityOfVarianceTable] }),
                                    components: "Test of Homogeneity of Variances",
                                    description: ""
                                });
                            }
                        }

                        // Add ANOVA table
                        await addStatistic(analyticId, {
                            title: "ANOVA",
                            output_data: JSON.stringify({ tables: [formattedOneWayAnovaTable] }),
                            components: "ANOVA",
                            description: ""
                        });

                        // Add Multiple Comparisons table if post hoc tests are enabled
                        if (equalVariancesAssumed.tukey) {
                            const formattedMultipleComparisonsTable = formatMultipleComparisonsTable(resultsRef.current, factorVariable!.label || factorVariable!.name);
                            // console.log("formattedMultipleComparisonsTable", JSON.stringify(formattedMultipleComparisonsTable));
                            await addStatistic(analyticId, {
                                title: "Multiple Comparisons",
                                output_data: JSON.stringify({ tables: [formattedMultipleComparisonsTable] }),
                                components: "Post Hoc Tests",
                                description: ""
                            });
                        }

                        // Add Homogeneous Subsets tables if post hoc tests are enabled
                        if (equalVariancesAssumed.tukey || equalVariancesAssumed.duncan) {
                            // Create separate tables for each test variable
                            testVariables.forEach(async (variable, index) => {
                                if (insufficientDataVarsRef.current.includes(variable.name)) {
                                    return;
                                }
                                const formattedHomogeneousSubsetsTable = formatHomogeneousSubsetsTable(resultsRef.current, index, variable);
                                // console.log("formattedHomogeneousSubsetsTable", JSON.stringify(formattedHomogeneousSubsetsTable));
                                await addStatistic(analyticId, {
                                    title: "Homogeneous Subsets",
                                    output_data: JSON.stringify({ tables: [formattedHomogeneousSubsetsTable] }),
                                    components: "Post Hoc Tests",
                                    description: ""
                                });
                            });
                        }
                    }

                    if (resultsRef.current.length === 0 || insufficientDataVarsRef.current.length === testVariables.length) {
                        const formattedErrorTable = formatErrorTable();
                        // console.log('formattedErrorTable', JSON.stringify(formattedErrorTable));
                        await addStatistic(analyticId, {
                            title: "Error",
                            output_data: JSON.stringify({ tables: [formattedErrorTable] }),
                            components: "Error",
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
    }, [testVariables, factorVariable, estimateEffectSize, equalVariancesAssumed, statisticsOptions, addLog, addStatistic, addAnalytic, analysisData, onClose]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("One-Way ANOVA calculation cancelled.");
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

export default useOneWayAnovaAnalysis; 