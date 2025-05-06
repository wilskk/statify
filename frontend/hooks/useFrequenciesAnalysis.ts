import { useState, useCallback, useRef, useEffect } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useResultStore } from '@/stores/useResultStore';
import { useMetaStore } from '@/stores/useMetaStore';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable, VariableData } from '@/types/Variable';
import { Statistic } from '@/types/Result';
import type { StatisticsOptions, ChartOptions, FrequenciesAnalysisParams as FrequenciesAnalysisParamsType } from "@/types/Analysis";

// Define types for worker messages (optional but good practice)
interface FrequencyResult {
    success: boolean;
    frequencies?: any[]; // Adjust type as needed
    error?: string;
}

interface DescriptiveResult {
    success: boolean;
    descriptive?: any; // Adjust type as needed
    error?: string;
}

export const useFrequenciesAnalysis = ({
    selectedVariables,
    showFrequencyTables,
    showStatistics,
    statisticsOptions,
    showCharts, // Keep for potential future use
    chartOptions, // Add chartOptions here
    onClose,
}: FrequenciesAnalysisParamsType) => {
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    // Use refs to hold worker instances and results
    const freqWorkerRef = useRef<Worker | null>(null);
    const descWorkerRef = useRef<Worker | null>(null);
    const resultsRef = useRef<{ frequencies?: any[]; descriptive?: any; }>({});
    const workersFinishedRef = useRef<number>(0); // Track finished workers
    const totalWorkersRef = useRef<number>(0); // Track expected workers
    const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

    const cleanupWorkers = useCallback(() => {
        if (freqWorkerRef.current) {
            freqWorkerRef.current.terminate();
            freqWorkerRef.current = null;
        }
        if (descWorkerRef.current) {
            descWorkerRef.current.terminate();
            descWorkerRef.current = null;
        }
        workersFinishedRef.current = 0;
        totalWorkersRef.current = 0;
        resultsRef.current = {};
    }, []);

    const handleWorkerCompletion = useCallback(async (workerError?: string) => {
        workersFinishedRef.current += 1;

        if (workerError && !errorMsg) { // Only set first error
            setErrorMsg(workerError);
        }

        // Check if all expected workers have finished
        if (workersFinishedRef.current >= totalWorkersRef.current) {
            // Clear the main timeout since all workers are done (or an error occurred)
            if (timeoutIdRef.current) { // Check if timeoutId exists
                clearTimeout(timeoutIdRef.current);
                timeoutIdRef.current = null; // Clear the ref
            }

            if (!errorMsg) { // Proceed only if no errors occurred
                try {
                    const variableNames = selectedVariables.map(v => v.name);
                    const executedActions = [];
                    if (resultsRef.current.frequencies) executedActions.push("Frequencies");
                    if (resultsRef.current.descriptive) executedActions.push("Statistics");

                    if (executedActions.length === 0) {
                        // This case might happen if workers finished but didn't produce expected results
                         console.warn("Workers finished, but no results were generated.");
                         setErrorMsg("Analysis completed but produced no output."); // Inform user
                         setIsCalculating(false);
                         cleanupWorkers();
                         return; // Exit early
                    }

                    const logMsg = `${executedActions.join(' & ').toUpperCase()} VARIABLES=${variableNames.join(", ")}`;
                    const logId = await addLog({ log: logMsg });

                    const analyticId = await addAnalytic(logId, {
                        title: executedActions.join(' & '),
                        note: `Analysis performed on: ${variableNames.join(", ")}`
                    });

                    const statisticsToAdd: Omit<Statistic, 'id' | 'analytic_id'>[] = [];

                    // Add Descriptive Statistics (now returned in standard format by worker)
                    if (resultsRef.current.descriptive) {
                        statisticsToAdd.push({
                            title: resultsRef.current.descriptive.title, // Use title from worker response
                            // Worker now returns output_data already in {"tables":[...]} format
                            output_data: JSON.stringify(resultsRef.current.descriptive.output_data), // Stringify the received output_data directly
                            components: resultsRef.current.descriptive.components, // Use components from worker response
                            description: resultsRef.current.descriptive.description // Use description from worker response
                        });
                    }

                    // Add Frequency Tables (already formatted)
                    if (resultsRef.current.frequencies) {
                        // resultsRef.current.frequencies is now an array of formatted table objects
                        resultsRef.current.frequencies.forEach((formattedFreqTable: any) => {
                            statisticsToAdd.push({
                                title: formattedFreqTable.title, // Use title from formatted object
                                output_data: JSON.stringify({ tables: [formattedFreqTable] }), // Nest in tables array and stringify
                                components: formattedFreqTable.components,
                                description: formattedFreqTable.description
                            });
                        });
                    }

                    for (const stat of statisticsToAdd) {
                        await addStatistic(analyticId, stat);
                    }

                    onClose(); // Close modal on success

                } catch (err) {
                    console.error("Error saving results:", err);
                    setErrorMsg("An error occurred while saving the results.");
                }
            }
            // Final cleanup regardless of success/error after processing
            setIsCalculating(false);
            cleanupWorkers();
        }
    }, [selectedVariables, addLog, addAnalytic, addStatistic, onClose, cleanupWorkers, errorMsg]); // Added errorMsg to deps

    const runAnalysis = useCallback(async () => {
        if (!selectedVariables.length) {
            setErrorMsg("Please select at least one variable.");
            return;
        }
        setErrorMsg(null);
        setIsCalculating(true);
        // Reset state for new analysis run
        cleanupWorkers();

        // TODO: Pass chartOptions to workers if needed
        // console.log("Chart Options:", chartOptions); // Removed

        // Determine actions and required workers
        const calculateFrequencies = showFrequencyTables;
        const calculateDescriptives = showStatistics && statisticsOptions;
        totalWorkersRef.current = (calculateFrequencies ? 1 : 0) + (calculateDescriptives ? 1 : 0);

        if (totalWorkersRef.current === 0) {
            setErrorMsg("Please select at least one analysis option (Frequency Tables or Statistics).");
            setIsCalculating(false);
            return;
        }

        try {
            // Revert the data fetching part to assume getVariableData returns the correct structure
            const variableDataPromises = selectedVariables.map(varDef =>
                useDataStore.getState().getVariableData(varDef)
            );
            const variableData = await Promise.all(variableDataPromises);

            // Get weight variable data if a weight variable is set
            const weightVariableName = useMetaStore.getState().meta.weight;
            let weightVariableData: (string | number)[] | null = null;
            let weightVariable: Variable | undefined | null = null;

            if (weightVariableName) {
                weightVariable = useVariableStore.getState().getVariableByName(weightVariableName);
                if (weightVariable) {
                    try {
                        const weightDataResult = await useDataStore.getState().getVariableData(weightVariable);
                        weightVariableData = weightDataResult.data;
                    } catch (err) {
                        console.error(`Error fetching data for weight variable "${weightVariableName}":`, err);
                        setErrorMsg(`Could not fetch data for the weight variable "${weightVariableName}". Analysis aborted.`);
                        setIsCalculating(false);
                        cleanupWorkers(); // Clean up any potential worker refs
                        return;
                    }
                } else {
                    console.warn(`Weight variable "${weightVariableName}" is set in meta, but not found in variable definitions.`);
                }
            }
            const commonData = {
                 variableData: variableData,
                 weightVariableData: weightVariableData
            };

            // Timeout setup
            const timeoutDuration = 60000; // 60 seconds per worker potentially
            const timeoutId = setTimeout(() => {
                 setErrorMsg("Analysis timed out. Please try again with fewer variables or check worker logic.");
                 setIsCalculating(false);
                 cleanupWorkers(); // Terminate both workers on timeout
            }, timeoutDuration * totalWorkersRef.current ); // Adjust timeout based on number of workers
            timeoutIdRef.current = timeoutId; // Store timeout ID

            // --- Frequency Worker ---
            if (calculateFrequencies) {
                freqWorkerRef.current = new Worker("/workers/DescriptiveStatistics/Frequencies/frequency.js");

                freqWorkerRef.current.onmessage = (e: MessageEvent<FrequencyResult>) => {
                    const wData = e.data;
                    console.log("Received data from frequency worker:", wData); // Removed log
                    if (wData.success) {
                        resultsRef.current.frequencies = wData.frequencies;
                        handleWorkerCompletion();
                    } else {
                        handleWorkerCompletion(wData.error || "Frequency calculation failed.");
                    }
                };

                freqWorkerRef.current.onerror = (event) => {
                    console.error("Frequency Worker error:", event);
                    handleWorkerCompletion("A critical error occurred in the Frequency worker.");
                };

                console.log("Sending data to frequency worker:", commonData); // Added log
                freqWorkerRef.current.postMessage(commonData); // Send common data
            }

            // --- Descriptive Statistics Worker ---
            if (calculateDescriptives) {
                descWorkerRef.current = new Worker("/workers/DescriptiveStatistics/Frequencies/descriptive.js");

                descWorkerRef.current.onmessage = (e: MessageEvent<DescriptiveResult>) => {
                     const wData = e.data;
                     console.log("Received data from descriptive worker:", wData); // Added log
                     if (wData.success) {
                         resultsRef.current.descriptive = wData.descriptive;
                         handleWorkerCompletion();
                     } else {
                         handleWorkerCompletion(wData.error || "Descriptive statistics calculation failed.");
                     }
                 };

                 descWorkerRef.current.onerror = (event) => {
                     console.error("Descriptive Worker error:", event);
                     handleWorkerCompletion("A critical error occurred in the Descriptive Statistics worker.");
                 };

                 const dataToSend = {
                     ...commonData,
                     options: statisticsOptions // Send options only to descriptive worker
                 };
                 console.log("Sending data to descriptive worker:", dataToSend); // Added log
                 descWorkerRef.current.postMessage(dataToSend);
            }
             // Clear timeout ONLY if all workers finish successfully before timeout
             // This is tricky with multiple workers. The main timeout handles the overall process.
             // Individual worker completions don't clear the main timeout, handleWorkerCompletion does the final steps.

        } catch (ex) {
            console.error("Error preparing analysis:", ex);
            // console.log("Caught error during preparation:", ex); // Removed log
            setErrorMsg("An unexpected error occurred before starting the analysis.");
            setIsCalculating(false);
            cleanupWorkers(); // Ensure cleanup on preparation error
        }
    }, [
        selectedVariables, showFrequencyTables, showStatistics, statisticsOptions,
        onClose, addLog, addAnalytic, addStatistic, cleanupWorkers, handleWorkerCompletion, chartOptions
    ]);

    // Effect to clear timeout on unmount
    useEffect(() => {
        const currentTimeoutId = timeoutIdRef.current; // Store the current ID
        return () => {
            if (currentTimeoutId) { // Use the stored ID in cleanup
                clearTimeout(currentTimeoutId);
            }
            cleanupWorkers(); // Also clean up workers on unmount
        };
    }, [cleanupWorkers]);

    // chartOptions: This parameter carries the configuration for chart generation,
    // such as chart type, values to display (frequencies/percentages),
    // and specific options like showing a normal curve on histograms.
    // It is currently passed to the hook but not yet fully integrated into the worker logic.
    return { isCalculating, errorMsg, runAnalysis };
}; 