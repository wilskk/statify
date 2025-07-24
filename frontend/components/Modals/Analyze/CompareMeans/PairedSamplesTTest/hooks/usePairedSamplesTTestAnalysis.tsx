import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    PairedSamplesTTestAnalysisProps,
    PairedSamplesTTestResults,
    PairedSamplesTTestResult
} from '../types';

import {
    formatPairedSamplesStatisticsTable,
    formatPairedSamplesCorrelationTable,
    formatPairedSamplesTestTable,
} from '../utils/formatters';

export const usePairedSamplesTTestAnalysis = ({
    testVariables1,
    testVariables2,
    pairNumbers,
    estimateEffectSize,
    calculateStandardizer,
    areAllPairsValid,
    hasDuplicatePairs,
    onClose
}: PairedSamplesTTestAnalysisProps) => {
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();
    
    const [isCalculating, setIsCalculating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const workerRef = useRef<Worker | null>(null);

    const insufficientDataVarsRef = useRef<string[]>([]);
    const resultsRef = useRef<PairedSamplesTTestResult[]>([]);
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

        const worker = new Worker('/workers/CompareMeans/manager.js', { type: 'module' });
        workerRef.current = worker;
        
        for (let i = 0; i < testVariables1.length; i++) {
            const dataForVar1 = analysisData.map(row => row[testVariables1[i].columnIndex]);
            const dataForVar2 = analysisData.map(row => row[testVariables2[i].columnIndex]);
            const payload = {
                analysisType: ['pairedSamplesTTest'],
                variable1: testVariables1[i],
                variable2: testVariables2[i],
                pair: pairNumbers[i] || i + 1,
                data1: dataForVar1,
                data2: dataForVar2,
                options: { estimateEffectSize, calculateStandardizer }
            };
            worker.postMessage(payload);
        }

        worker.onmessage = async (event) => {
            const { variableName, results, status, error: workerError } = event.data;

            if (status === 'success' && results) {
                // Check for metadata about insufficient data
                if (results.metadata && results.metadata.hasInsufficientData) {
                    insufficientDataVarsRef.current.push(`Pair ${results.metadata.pair}`);
                    console.warn(`Insufficient valid data for Pair ${results.metadata.pair}`);
                }

                if (results.pairedSamplesStatistics) {
                    const { variable1, variable2, pair, group1, group2 } = results.pairedSamplesStatistics;

                    if (group1 && group2) {
                        resultsRef.current.push({
                            variable1,
                            variable2,
                            pair: pair || 0,
                            pairedSamplesStatistics: {
                                group1,
                                group2
                            }
                        });
                    }
                    // else {
                    //     console.error(`Error processing paired samples statistics for ${variableName}:`, workerError);
                    //     const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                    //     setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                    //     errorCountRef.current += 1;
                    // }
                }

                if (results.pairedSamplesCorrelation) {
                    const { variable1, variable2, pair, Label, N, Correlation, PValue } = results.pairedSamplesCorrelation;

                    if (variable1 && variable2 && Label && N && Correlation && PValue) {
                        resultsRef.current.push({
                            variable1,
                            variable2,
                            pair: pair || 0,
                            pairedSamplesCorrelation: {
                                Label,
                                N,
                                Correlation,
                                PValue
                            }
                        });
                    }
                    // else {
                    //     console.error(`Error processing paired samples correlation for ${variableName}:`, workerError);
                    //     const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                    //     setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                    //     errorCountRef.current += 1;
                    // }
                }

                if (results.pairedSamplesTest) {
                    console.log('results.pairedSamplesTest', JSON.stringify(results.pairedSamplesTest));
                    const { variable1, variable2, pair, label, Mean, StdDev, SEMean, LowerCI, UpperCI, t, df, pValue } = results.pairedSamplesTest;

                    if (variable1 && variable2 && label && Mean && StdDev && SEMean && LowerCI && UpperCI && t && df && pValue !== undefined && pair !== undefined) {
                        resultsRef.current.push({
                            variable1,
                            variable2,
                            pair: pair || 0,
                            pairedSamplesTest: {
                                label,
                                Mean,
                                StdDev,
                                SEMean,
                                LowerCI,
                                UpperCI,
                                t,
                                df,
                                pValue
                            }
                        });
                    }
                    // else {
                    //     console.error(`Error processing paired samples test for ${variableName}:`, workerError);
                    //     const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                    //     setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                    //     errorCountRef.current += 1;
                    // }
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
                        const pairedSamplesStatistics = resultsRef.current.filter(r => 'pairedSamplesStatistics' in (r as any));
                        const pairedSamplesCorrelation = resultsRef.current.filter(r => 'pairedSamplesCorrelation' in (r as any));
                        const pairedSamplesTest = resultsRef.current.filter(r => 'pairedSamplesTest' in (r as any));
                        
                        const results: PairedSamplesTTestResults = {
                            pairedSamplesStatistics,
                            pairedSamplesCorrelation,
                            pairedSamplesTest,
                        };

                        console.log('Results to format:', JSON.stringify(results));

                        const formattedPairedSamplesStatisticsTable = formatPairedSamplesStatisticsTable(results);
                        const formattedPairedSamplesCorrelationTable = formatPairedSamplesCorrelationTable(results);
                        const formattedPairedSamplesTestTable = formatPairedSamplesTestTable(results);
                        console.log('formattedPairedSamplesTestTable', JSON.stringify(formattedPairedSamplesTestTable));

                        // Prepare log message
                        const variableNames1 = testVariables1.map(v => v.name).join(" ");
                        const variableNames2 = testVariables2.map(v => v.name).join(" ");
                        let logMsg = `T-TEST PAIRS=${variableNames1} WITH ${variableNames2} PAIRED`;

                        if (estimateEffectSize) {
                            logMsg += `{K-W=${variableNames1} BY ${variableNames2}}`;
                        }

                        // Save to database
                        const logId = await addLog({ log: logMsg });

                        // Prepare note about insufficient data if needed
                        let note = "";
                        if (insufficientDataVarsRef.current.length > 0) {
                            note = `Note: The following pairs did not have sufficient valid data for analysis: ${insufficientDataVarsRef.current.join(', ')}. These pairs require at least two valid numeric values in each pair for T-Test calculation.`;
                        }

                        const analyticId = await addAnalytic(logId, { title: "T Test", note: note || undefined });


                        await addStatistic(analyticId, {
                            title: "Paired Samples Statistics",
                            output_data: JSON.stringify({ tables: [formattedPairedSamplesStatisticsTable] }),
                            components: "Paired Samples Statistics",
                            description: ""
                        });

                        if (formattedPairedSamplesCorrelationTable.rows.length > 0) {
                            await addStatistic(analyticId, {
                                title: "Paired Samples Correlation",
                                output_data: JSON.stringify({ tables: [formattedPairedSamplesCorrelationTable] }),
                                components: "Paired Samples Correlation",
                                description: ""
                            });
                        }

                        if (formattedPairedSamplesTestTable.rows.length > 0) {
                            await addStatistic(analyticId, {
                                title: "Paired Samples Test",
                                output_data: JSON.stringify({ tables: [formattedPairedSamplesTestTable] }),
                                components: "Paired Samples Test",
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
    }, [testVariables1, testVariables2, pairNumbers, estimateEffectSize, calculateStandardizer, addLog, addAnalytic, addStatistic, onClose, analysisData]);

    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsCalculating(false);
            console.log("Paired Samples T Test calculation cancelled.");
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

export default usePairedSamplesTTestAnalysis;