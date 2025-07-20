import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    OneWayAnovaAnalysisProps,
    OneWayAnovaResults,
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
    formatHomogeneousSubsetsTable
} from '../utils/formatters';

export const useOneWayAnovaAnalysis = ({
    testVariables,
    factorVariable,
    estimateEffectSize,
    equalVariancesAssumed,
    statisticsOptions,
    onClose
}: OneWayAnovaAnalysisProps) => {
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();
    
    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const workerRef = useRef<Worker | null>(null);

    const resultsRef = useRef<OneWayAnovaResult[]>([]);
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);
    
    const runAnalysis = useCallback(async (): Promise<void> => {
        if (testVariables.length === 0) {
            setErrorMsg("Please select at least one test variable.");
            return;
        }
        
        if (!factorVariable) {
            setErrorMsg("Please select a factor variable.");
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

        testVariables.forEach(variable => {
            const dataForVar = analysisData.map(row => row[variable.columnIndex]);
            const dataForFactorVar = analysisData.map(row => row[factorVariable.columnIndex]);
            const payload = {
                analysisType: ['oneWayAnova'],
                variable,
                data: dataForVar,
                factorVariable,
                factorData: dataForFactorVar,
                options: { equalVariancesAssumed, statisticsOptions, estimateEffectSize }
            };
            console.log("payload", JSON.stringify(payload));
            worker.postMessage(payload);
        });

        worker.onmessage = async (event) => {
            console.log("Received message:", JSON.stringify(event.data));
            const { variableName, results, status, error: workerError } = event.data;

            if (status === 'success' && results) {
                if (results.oneWayAnova) {
                    const { variable, SumOfSquares, df, MeanSquare, F, Sig, 
                            withinGroupsSumOfSquares, withinGroupsDf, withinGroupsMeanSquare,
                            totalSumOfSquares, totalDf } = results.oneWayAnova;
                    
                    if (variable) {
                        resultsRef.current.push({
                            variable,
                            oneWayAnova: {
                                SumOfSquares,
                                df,
                                MeanSquare,
                                F,
                                Sig,
                                withinGroupsSumOfSquares,
                                withinGroupsDf,
                                withinGroupsMeanSquare,
                                totalSumOfSquares,
                                totalDf
                            }
                        });
                    } else {
                        console.error(`Error processing ANOVA results for ${variableName}:`, workerError);
                        const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                        errorCountRef.current += 1;
                    }
                }

                // Process Descriptive Statistics
                if (statisticsOptions.descriptive && results.descriptives) {
                    const { variable, descriptive } = results.descriptives;

                    if (variable && descriptive && Array.isArray(descriptive)) {
                        // Add all descriptive statistics for this variable as a single entry
                        resultsRef.current.push({
                            variable,
                            descriptives: descriptive as Descriptives[]
                        });
                    } else {
                        console.error(`Error processing descriptive statistics for ${variableName}:`, workerError);
                        const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                        errorCountRef.current += 1;
                    }
                }

                // Process Homogeneity of Variance
                if (statisticsOptions.homogeneityOfVariance && results.homogeneityOfVariances) {
                    const { variable, homogeneityOfVariances } = results.homogeneityOfVariances;

                    if (variable && homogeneityOfVariances && Array.isArray(homogeneityOfVariances)) {
                        resultsRef.current.push({
                            variable,
                            homogeneityOfVariance: homogeneityOfVariances as HomogeneityOfVariance[]
                        });
                    } else {
                        console.error(`Error processing homogeneity of variance for ${variableName}:`, workerError);
                        const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                        errorCountRef.current += 1;
                    }
                }

                // Process Multiple Comparisons
                if (equalVariancesAssumed.tukey && results.multipleComparisons) {
                    const { variable, multipleComparisons } = results.multipleComparisons;

                    if (variable && multipleComparisons && Array.isArray(multipleComparisons)) {
                        resultsRef.current.push({
                            variable,
                            multipleComparisons: multipleComparisons
                        });
                    } else {
                        console.error(`Error processing multiple comparisons for ${variableName}:`, workerError);
                        const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                        setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                        errorCountRef.current += 1;
                    }
                }

                // Process Homogeneous Subsets
                // Support multiple homogeneousSubsets per variable (e.g., Tukey, Duncan, etc.)
                if ((equalVariancesAssumed.tukey || equalVariancesAssumed.duncan) && results.homogeneousSubsets) {
                    let homogeneousSubsetsArr: any[] = [];

                    // If results.homogeneousSubsets is an array (multiple methods), use as is, else wrap in array
                    if (Array.isArray(results.homogeneousSubsets)) {
                        homogeneousSubsetsArr = results.homogeneousSubsets;
                    } else if (results.homogeneousSubsets && typeof results.homogeneousSubsets === 'object') {
                        // Sometimes the worker returns a single object, not an array
                        homogeneousSubsetsArr = [results.homogeneousSubsets];
                    }

                    // For each method's homogeneousSubsets for this variable, push a result entry
                    for (const subsetObj of homogeneousSubsetsArr) {
                        const { variable, subsetCount, homogeneousSubsets } = subsetObj;
                        console.log("results.homogeneousSubsets (per method)", JSON.stringify(subsetObj));

                        if (variable && subsetCount && homogeneousSubsets && Array.isArray(homogeneousSubsets)) {
                            resultsRef.current.push({
                                variable,
                                subsetCount,
                                homogeneousSubsets: homogeneousSubsets as HomogeneousSubsets[]
                            });
                        } else {
                            console.error(`Error processing homogeneous subsets for ${variableName}:`, workerError);
                            const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                            setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                            errorCountRef.current += 1;
                        }
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
                        console.log('resultsRef.current:', JSON.stringify(resultsRef.current));
                        const oneWayAnova = resultsRef.current.filter(r => 'oneWayAnova' in (r as any));
                        const descriptives = resultsRef.current.filter(r => 'descriptives' in (r as any));
                        const homogeneityOfVariance = resultsRef.current.filter(r => 'homogeneityOfVariance' in (r as any));
                        const multipleComparisons = resultsRef.current.filter(r => 'multipleComparisons' in (r as any));
                        const homogeneousSubsets = resultsRef.current.filter(r => 'subsetCount' in (r as any));
                      
                        const results: OneWayAnovaResults = {
                            oneWayAnova,
                            descriptives,
                            homogeneityOfVariance,
                            multipleComparisons,
                            homogeneousSubsets
                        };
                        console.log('results to format:', JSON.stringify(results));
                        // Format tables
                        const formattedOneWayAnovaTable = formatOneWayAnovaTable(results);
                        
                        const variableNames = testVariables.map(v => v.name);
                        let logMsg = `ONE-WAY ANOVA`;

                        if (equalVariancesAssumed.tukey) {
                            logMsg += `{POST HOC=TUKEY}`;
                        }
                        
                        if (equalVariancesAssumed.duncan) {
                            logMsg += `{POST HOC=DUNCAN}`;
                        }

                        if (statisticsOptions.descriptive) {
                            logMsg += `{STATISTICS=DESCRIPTIVES}`;
                        }

                        if (statisticsOptions.homogeneityOfVariance) {
                            logMsg += `{STATISTICS=HOMOGENEITY}`;
                        }

                        const logId = await addLog({ log: logMsg });
                        const analyticId = await addAnalytic(logId, { title: "One-Way ANOVA", note: "" });

                        // Add Descriptive Statistics table if enabled
                        if (statisticsOptions.descriptive && results.descriptives) {
                            const formattedDescriptiveStatisticsTable = formatDescriptiveStatisticsTable(results);
                            await addStatistic(analyticId, {
                                title: "Descriptives",
                                output_data: JSON.stringify({ tables: [formattedDescriptiveStatisticsTable] }),
                                components: "Descriptives",
                                description: ""
                            });
                        }

                        // Add Homogeneity of Variance table if enabled
                        if (statisticsOptions.homogeneityOfVariance && results.homogeneityOfVariance) {
                            const formattedHomogeneityOfVarianceTable = formatHomogeneityOfVarianceTable(results);
                            await addStatistic(analyticId, {
                                title: "Test of Homogeneity of Variances",
                                output_data: JSON.stringify({ tables: [formattedHomogeneityOfVarianceTable] }),
                                components: "Homogeneity of Variance",
                                description: ""
                            });
                        }

                        // Add ANOVA table
                        await addStatistic(analyticId, {
                            title: "ANOVA",
                            output_data: JSON.stringify({ tables: [formattedOneWayAnovaTable] }),
                            components: "One-Way ANOVA",
                            description: ""
                        });

                        // Add Multiple Comparisons table if post hoc tests are enabled
                        if (equalVariancesAssumed.tukey && results.multipleComparisons) {
                            const formattedMultipleComparisonsTable = formatMultipleComparisonsTable(results, factorVariable.label || factorVariable.name);
                            console.log("formattedMultipleComparisonsTable", JSON.stringify(formattedMultipleComparisonsTable));
                            await addStatistic(analyticId, {
                                title: "Multiple Comparisons",
                                output_data: JSON.stringify({ tables: [formattedMultipleComparisonsTable] }),
                                components: "Multiple Comparisons",
                                description: ""
                            });
                        }

                        // Add Homogeneous Subsets tables if post hoc tests are enabled
                        if ((equalVariancesAssumed.tukey || equalVariancesAssumed.duncan) && results.homogeneousSubsets) {
                            // Create separate tables for each test variable
                            testVariables.forEach(async (variable, index) => {
                                const formattedHomogeneousSubsetsTable = formatHomogeneousSubsetsTable(results, index, variable);
                                console.log("formattedHomogeneousSubsetsTable", JSON.stringify(formattedHomogeneousSubsetsTable));
                                await addStatistic(analyticId, {
                                    title: variable.label || variable.name,
                                    output_data: JSON.stringify({ tables: [formattedHomogeneousSubsetsTable] }),
                                    components: "Homogeneous Subsets",
                                    description: ""
                                });
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
    }, [testVariables, factorVariable, estimateEffectSize, equalVariancesAssumed, statisticsOptions, onClose]);

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