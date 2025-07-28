import { useState, useCallback, useRef, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';

import {
    PairedSamplesTTestAnalysisProps,
    PairedSamplesTTestResult,
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
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { data: analysisData } = useAnalysisData();
    
    const workerRef = useRef<Worker | null>(null);

    const insufficientDataVarsRef = useRef<string[]>([]);
    const resultsRef = useRef<PairedSamplesTTestResult[]>([]);
    const errorCountRef = useRef<number>(0);
    const processedCountRef = useRef<number>(0);

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
            // console.log(`event.data ke-${processedCountRef.current}: `, JSON.stringify(event.data));
            const { variable1Name, variable2Name, pair, results, status, error: workerError } = event.data;

            if (status === 'success' && results) {
                // Check for metadata about insufficient data
                if (results.metadata && results.metadata.hasInsufficientData) {
                    insufficientDataVarsRef.current.push(`Pair ${results.metadata.pair}`);
                    console.warn(`Insufficient valid data for Pair ${results.metadata.pair}. Total1: ${results.metadata.totalData1}, Valid1: ${results.metadata.validData1}, Total2: ${results.metadata.totalData2}, Valid2: ${results.metadata.validData2}, Variable1: ${results.metadata.variable1Name}, Variable2: ${results.metadata.variable2Name}`);
                }

                // if (results.pairedSamplesStatistics) {
                    // const { variable1, variable2, pair, group1, group2 } = results.pairedSamplesStatistics;

                    // if (group1 && group2) {
                    //     resultsRef.current.push({
                    //         variable1,
                    //         variable2,
                    //         pair: pair,
                    //         pairedSamplesStatistics: {
                    //             group1,
                    //             group2
                    //         }
                    //     });
                    // }
                    // else {
                    //     console.error(`Error processing paired samples statistics for ${variableName}:`, workerError);
                    //     const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                    //     setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                    //     errorCountRef.current += 1;
                    // }
                // }

                // if (results.pairedSamplesCorrelation) {
                //     const { variable1, variable2, pair, Label, N, Correlation, PValue } = results.pairedSamplesCorrelation;

                //     // if (variable1 && variable2 && Label && N && Correlation && PValue) {
                //         resultsRef.current.push({
                //             variable1,
                //             variable2,
                //             pair: pair || 0,
                //             pairedSamplesCorrelation: {
                //                 Label,
                //                 N,
                //                 Correlation,
                //                 PValue
                //             }
                //         });
                //     // }
                    // else {
                    //     console.error(`Error processing paired samples correlation for ${variableName}:`, workerError);
                    //     const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                    //     setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                    //     errorCountRef.current += 1;
                    // }
                // }

                // if (results.pairedSamplesTest) {
                    const { group1, group2 } = results.pairedSamplesStatistics;
                    const { correlationLabel, N, Correlation, correlationPValue } = results.pairedSamplesCorrelation;
                    const { label, Mean, StdDev, SEMean, LowerCI, UpperCI, t, df, pValue } = results.pairedSamplesTest;

                    // if (variable1 && variable2 && label && Mean && StdDev && SEMean && LowerCI && UpperCI && t && df && pValue !== undefined && pair !== undefined) {
                        resultsRef.current.push({
                            variable1: results.variable1,
                            variable2: results.variable2,
                            pair: results.pair,
                            pairedSamplesStatistics: {
                                group1,
                                group2
                            },
                            pairedSamplesCorrelation: {
                                correlationLabel,
                                N,
                                Correlation,
                                correlationPValue
                            },
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
                    // }
                    // else {
                    //     console.error(`Error processing paired samples test for ${variableName}:`, workerError);
                    //     const errorMsg = `Calculation failed for ${variableName}: ${workerError || 'Unknown error'}`;
                    //     setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                    //     errorCountRef.current += 1;
                    // }
                // }
            } else {
                console.error(`Error processing ${variable1Name} and ${variable2Name}:`, workerError);
                const errorMsg = `Calculation failed for ${variable1Name} and ${variable2Name}: ${workerError || 'Unknown error'}`;
                setErrorMsg(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
                errorCountRef.current += 1;
            }
            // console.log('[Results before] processedCountRef.current:', processedCountRef.current);
            processedCountRef.current += 1;
            // console.log('[Results after] processedCountRef.current:', processedCountRef.current);

            if (processedCountRef.current === testVariables1.length) {
                if (resultsRef.current.length > 0) {
                    try {
                        // console.log('Results to format:', JSON.stringify(resultsRef.current));

                        const formattedPairedSamplesStatisticsTable = formatPairedSamplesStatisticsTable(resultsRef.current);
                        const formattedPairedSamplesCorrelationTable = formatPairedSamplesCorrelationTable(resultsRef.current);
                        const formattedPairedSamplesTestTable = formatPairedSamplesTestTable(resultsRef.current);
                        // console.log('formattedPairedSamplesStatisticsTable', JSON.stringify(formattedPairedSamplesStatisticsTable));
                        // console.log('formattedPairedSamplesCorrelationTable', JSON.stringify(formattedPairedSamplesCorrelationTable));
                        // console.log('formattedPairedSamplesTestTable', JSON.stringify(formattedPairedSamplesTestTable));

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