import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    BivariateAnalysisProps,
    BivariateResults,
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
    missingValuesOptions,
    controlVariables,
    onClose
}: BivariateAnalysisProps) => {
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();

    const options = useMemo(() => ({
        testOfSignificance,
        flagSignificantCorrelations,
        showOnlyTheLowerTriangle,
        showDiagonal,
        statisticsOptions,
        partialCorrelationKendallsTauB,
        missingValuesOptions,
        controlVariables
    }), [
        testOfSignificance,
        flagSignificantCorrelations,
        showOnlyTheLowerTriangle,
        showDiagonal,
        statisticsOptions,
        partialCorrelationKendallsTauB,
        missingValuesOptions,
        controlVariables
    ]);

    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const workerRef = useRef<Worker | null>(null);
    
    const resultsRef = useRef<BivariateResults>();
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
        errorCountRef.current = 0;
        processedCountRef.current = 0;

        const worker = new Worker('/workers/Correlate/manager.js', { type: 'module' });
        workerRef.current = worker;

        const batch = testVariables.map(variable => ({
            variable,
            data: analysisData.map(row => row[variable.columnIndex]).filter(item => item !== null && item !== undefined) as (string | number)[],
        }));

        const batchControl = controlVariables.map(variable => ({
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
                partialCorrelationKendallsTauB,
                missingValuesOptions,
                controlVariables: batchControl.map(vd => vd.variable),
                controlData: batchControl.map(vd => vd.data)
            }
        };
        worker.postMessage(payload);

        worker.onmessage = async (event) => {
            // console.log('Received message:', JSON.stringify(event.data));
            const { variableName, results, status, error: workerError } = event.data;

            if (status === 'success' && results) {
                resultsRef.current = results;
            } else {
                console.error(`Error processing ${variableName}:`, workerError);
                const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                errorCountRef.current += 1;
            }

            processedCountRef.current += 1;
            if (processedCountRef.current === 1) {
                if (resultsRef.current) {
                    try {
                        // console.log('Results ref:', JSON.stringify(resultsRef.current));
                        // Prepare log message
                        const variableNames = testVariables.map(v => v.name).join(" ");
                        let logMsg = `CORRELATIONS {VARIABLES=${variableNames}}`;

                        // Save to database
                        const logId = await addLog({ log: logMsg });
                        const analyticId = await addAnalytic(logId, { title: "Correlation" });

                        // Add descriptive statistics table
                        if (statisticsOptions.meansAndStandardDeviations) {
                            const formattedDescriptiveStatisticsTable = formatDescriptiveStatisticsTable(resultsRef.current);
                       
                            await addStatistic(analyticId, {
                                title: "Descriptive Statistics",
                                output_data: JSON.stringify({ tables: [formattedDescriptiveStatisticsTable] }),
                                components: "Descriptive Statistics",
                                description: ""
                            });
                        }

                        if (correlationCoefficient.pearson) {
                            const formattedCorrelationTable = formatCorrelationTable(resultsRef.current, options, testVariables, ["Pearson"]);

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
                            const formattedCorrelationTable = formatCorrelationTable(resultsRef.current, options, testVariables, correlationType);

                            await addStatistic(analyticId, {
                                title: "Nonparametric Correlation",
                                output_data: JSON.stringify({ tables: [formattedCorrelationTable] }),
                                components: "Nonparametric Correlation",
                                description: ""
                            });

                            if (partialCorrelationKendallsTauB && correlationCoefficient.kendallsTauB && testVariables.length > 2 && missingValuesOptions.excludeCasesListwise) {
                                const formattedPartialCorrelationTable = formatPartialCorrelationTable(resultsRef.current, options, testVariables);
                                // console.log('Formatted partial correlation table:', JSON.stringify(formattedPartialCorrelationTable));

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
    }, [testVariables, correlationCoefficient, testOfSignificance, flagSignificantCorrelations, showOnlyTheLowerTriangle, showDiagonal, statisticsOptions, partialCorrelationKendallsTauB, missingValuesOptions, controlVariables, options, addLog, addAnalytic, addStatistic, onClose, analysisData]);

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