import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    BivariateAnalysisProps,
    BivariateResults,
    BivariateResult,
    BivariateTable
} from '../types';

import {
    formatCorrelationTable,
    formatDescriptiveStatisticsTable,
    formatPartialCorrelationTable,
} from '../utils/formatters';

export const useBivariateAnalysis = ({
    testVariables,
    correlationCoefficient,
    testOfSignificance,
    flagSignificantCorrelations,
    showOnlyTheLowerTriangle,
    showDiagonal,
    partialCorrelationKendallsTauB,
    statisticsOptions,
    onClose
}: BivariateAnalysisProps) => {
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();

    const options = {
        testOfSignificance,
        flagSignificantCorrelations,
        showOnlyTheLowerTriangle,
        showDiagonal,
        statisticsOptions,
        partialCorrelationKendallsTauB
    };

    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const workerRef = useRef<Worker | null>(null);
    
    const resultsRef = useRef<BivariateResult[]>([]);
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);

    const runAnalysis = useCallback(async (): Promise<void> => {
        if (testVariables.length === 0) {
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

        const worker = new Worker('/workers/Correlate/manager.js', { type: 'module' });
        workerRef.current = worker;

        const batch = testVariables.map(variable => ({
            variable,
            data: analysisData.map(row => row[variable.columnIndex]).filter(item => item !== null && item !== undefined) as (string | number)[],
        }));

        const payload = {
            analysisType: 'bivariate',
            variable: batch.map(vd => vd.variable),
            data: batch.map(vd => vd.data),
            options: {
                correlationCoefficient,
                testOfSignificance,
                flagSignificantCorrelations,
                showOnlyTheLowerTriangle,
                showDiagonal,
                statisticsOptions,
                partialCorrelationKendallsTauB
            }
        };
        worker.postMessage(payload);

        worker.onmessage = async (event) => {
            console.log('Received message:', JSON.stringify(event.data));
            const { variableName, results, status, error: workerError } = event.data;

            if (status === 'success' && results) {
                // Handle descriptive statistics
                if (results.descriptiveStatistics && Array.isArray(results.descriptiveStatistics)) {
                    for (const stats of results.descriptiveStatistics) {
                        const { variable, N, Mean, StdDev } = stats;
                        
                        if (variable && N !== undefined && Mean !== undefined && StdDev !== undefined) {
                            // Find the corresponding variable object
                            const variableObj = testVariables.find(v => v.name === variable);
                            if (variableObj) {
                                resultsRef.current.push({
                                    variable1: variableObj,
                                    descriptiveStatistics: {
                                        N,
                                        Mean,
                                        StdDev
                                    },
                                });
                            }
                        }
                    }
                }

                // Handle correlations
                if (results.correlation && Array.isArray(results.correlation)) {
                    for (const correlation of results.correlation) {
                        const { variable1, variable2, pearsonCorrelation, kendallsTauBCorrelation, spearmanCorrelation } = correlation;

                        if (variable1 && variable2 && (pearsonCorrelation !== undefined || kendallsTauBCorrelation !== undefined || spearmanCorrelation !== undefined)) {
                            // Find the corresponding variable object
                            const variableObj = testVariables.find(v => v.name === variable1);
                            if (variableObj) {
                                resultsRef.current.push({
                                    variable1,
                                    variable2,
                                    correlation: {
                                        pearsonCorrelation,
                                        kendallsTauBCorrelation,
                                        spearmanCorrelation
                                    }
                                });
                            }
                        } else {
                            console.error(`Error processing correlation:`, correlation);
                            const errorMsg = `Calculation failed for correlation: ${workerError || 'Missing data'}`;
                            setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                            errorCountRef.current += 1;
                        }
                    }
                }

                // Handle partial correlation
                if (results.partialCorrelation && Array.isArray(results.partialCorrelation)) {
                    for (const partial of results.partialCorrelation) {
                        const { controlVariable, variable1, variable2, partialCorrelation } = partial;

                        if (controlVariable && variable1 && variable2 && partialCorrelation) {
                            // Find the corresponding variable objects
                            const controlVarObj = testVariables.find(v => v.name === controlVariable);
                            const var1Obj = testVariables.find(v => v.name === variable1);
                            const var2Obj = testVariables.find(v => v.name === variable2);
                            
                            if (controlVarObj && var1Obj && var2Obj) {
                                resultsRef.current.push({
                                    controlVariable: controlVarObj,
                                    variable1: var1Obj,
                                    variable2: var2Obj,
                                    partialCorrelation: {
                                        PartialCorrelation: partialCorrelation.Correlation,
                                        PValue: partialCorrelation.PValue,
                                        df: partialCorrelation.df
                                    }
                                });
                            }
                        } else {
                            console.error(`Error processing partial correlation:`, partial);
                            const errorMsg = `Calculation failed for partial correlation: ${workerError || 'Missing data'}`;
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
            console.log('Processed count:', processedCountRef.current);
            console.log('Results ref:', JSON.stringify(resultsRef.current));
            if (processedCountRef.current === 1) {
                if (resultsRef.current.length > 0) {
                    try {
                        const descriptiveStatistics = resultsRef.current.filter(r => r.descriptiveStatistics);
                        const correlation = resultsRef.current.filter(r => r.correlation);
                        const partialCorrelation = resultsRef.current.filter(r => r.partialCorrelation);
                        
                        const results: BivariateResults = {
                            descriptiveStatistics,
                            correlation,
                            partialCorrelation
                        };

                        console.log('Results to format:', JSON.stringify(results));

                        // Prepare log message
                        const variableNames = testVariables.map(v => v.name).join(" ");
                        let logMsg = `CORRELATIONS {VARIABLES=${variableNames}}`;

                        // Save to database
                        const logId = await addLog({ log: logMsg });
                        const analyticId = await addAnalytic(logId, { title: "Correlation" });

                        // Add descriptive statistics table
                        if (statisticsOptions.meansAndStandardDeviations) {
                            const formattedDescriptiveStatisticsTable = formatDescriptiveStatisticsTable(results);
                            console.log('Formatted descriptive statistics table:', JSON.stringify(formattedDescriptiveStatisticsTable));
                       
                            await addStatistic(analyticId, {
                                title: "Descriptive Statistics",
                                output_data: JSON.stringify({ tables: [formattedDescriptiveStatisticsTable] }),
                                components: "Descriptive Statistics",
                                description: ""
                            });
                        }

                        if (correlationCoefficient.pearson) {
                            console.log(`const formattedCorrelationTable = formatCorrelationTable(results:${JSON.stringify(results)}, options:${JSON.stringify(options)}, testVariables:${JSON.stringify(testVariables)}, correlationType:["Pearson"])`);
                            const formattedCorrelationTable = formatCorrelationTable(results, options, testVariables, ["Pearson"]);
                            console.log('Formatted correlation table:', JSON.stringify(formattedCorrelationTable));

                            await addStatistic(analyticId, {
                                title: "Correlation",
                                output_data: JSON.stringify({ tables: [formattedCorrelationTable] }),
                                components: "Correlation",
                                description: ""
                            });
                        }

                        if (correlationCoefficient.kendallsTauB || correlationCoefficient.spearman) {
                            let correlationType = [];
                            if (correlationCoefficient.kendallsTauB) {
                                correlationType.push("Kendall's tau_b");
                            }
                            if (correlationCoefficient.spearman) {
                                correlationType.push("Spearman's rho");
                            }
                            console.log(`const formattedCorrelationTable = formatCorrelationTable(results:${JSON.stringify(results)}, options:${JSON.stringify(options)}, testVariables:${JSON.stringify(testVariables)}, correlationType:${JSON.stringify(correlationType)})`);
                            const formattedCorrelationTable = formatCorrelationTable(results, options, testVariables, correlationType);
                            console.log('Formatted nonparametric correlation table:', JSON.stringify(formattedCorrelationTable));

                            await addStatistic(analyticId, {
                                title: "Nonparametric Correlation",
                                output_data: JSON.stringify({ tables: [formattedCorrelationTable] }),
                                components: "Nonparametric Correlation",
                                description: ""
                            });

                            if (partialCorrelationKendallsTauB && correlationCoefficient.kendallsTauB && partialCorrelation.length > 0) {
                                const formattedPartialCorrelationTable = formatPartialCorrelationTable(results, options, testVariables);
                                console.log('Formatted partial correlation table:', JSON.stringify(formattedPartialCorrelationTable));

                                await addStatistic(analyticId, {
                                    title: "Partial Correlation",
                                    output_data: JSON.stringify({ tables: [formattedPartialCorrelationTable] }),
                                    components: "Partial Correlation",
                                    description: ""
                                });
                            }
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
    }, [testVariables, correlationCoefficient, testOfSignificance, flagSignificantCorrelations, showOnlyTheLowerTriangle, showDiagonal, statisticsOptions, partialCorrelationKendallsTauB, addLog, addAnalytic, addStatistic, onClose, analysisData]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("Bivariate correlation calculation cancelled.");
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

export default useBivariateAnalysis;