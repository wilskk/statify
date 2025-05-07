import { useState, useCallback, useRef, useEffect } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useResultStore } from '@/stores/useResultStore';
import { useMetaStore } from '@/stores/useMetaStore';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable, VariableData } from '@/types/Variable'; // Added VariableData

// Define structure for parameters specific to descriptives analysis
interface DescriptivesParams {
    mean: boolean;
    stdDev: boolean;
    minimum: boolean;
    maximum: boolean;
    variance: boolean;
    range: boolean;
    sum: boolean;
    median: boolean;
    skewness: boolean;
    kurtosis: boolean;
    standardError: boolean;
}

// Define types for worker messages
interface DescriptiveWorkerResult {
    success: boolean;
    statistics?: {
        title: string;
        output_data: { tables: Array<any> }; // Structure from user example
        components: string;
        description: string;
    };
    error?: string;
}

interface DescriptivesAnalysisHookParams {
    selectedVariables: Variable[];
    displayStatistics: DescriptivesParams;
    saveStandardized: boolean; // Keep for potential future use
    onClose: () => void;
}

export const useDescriptivesAnalysis = ({
    selectedVariables,
    displayStatistics,
    saveStandardized, // Keep for potential future use
    onClose,
}: DescriptivesAnalysisHookParams) => {
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const descWorkerRef = useRef<Worker | null>(null);
    const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

    const cleanupWorker = useCallback(() => {
        if (descWorkerRef.current) {
            descWorkerRef.current.terminate();
            descWorkerRef.current = null;
        }
        if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
            timeoutIdRef.current = null;
        }
    }, []);

    const runAnalysis = useCallback(async () => {
        if (selectedVariables.length === 0) {
            setErrorMsg("Please select at least one variable.");
            return;
        }
        setErrorMsg(null);
        setIsCalculating(true);
        cleanupWorker(); // Clean up previous worker/timeout if any

        try {
            // --- Data Fetching ---
            const variableDataPromises = selectedVariables.map(varDef =>
                useDataStore.getState().getVariableData(varDef)
            );
            const fetchedVariableData: VariableData[] = await Promise.all(variableDataPromises);

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
                        cleanupWorker();
                        return;
                    }
                } else {
                    console.warn(`Weight variable "${weightVariableName}" is set in meta, but not found in variable definitions.`);
                    // Decide if this should be a critical error or just a warning
                    // For now, we'll proceed without weights if definition not found, but it might be better to error.
                }
            }

            // --- Worker Setup ---
            descWorkerRef.current = new Worker('/workers/DescriptiveStatistics/Descriptives/descriptives.js'); // Adjust path if needed

            descWorkerRef.current.onmessage = (e: MessageEvent<DescriptiveWorkerResult>) => {
                const workerResult = e.data;
                if (workerResult.success && workerResult.statistics) { // Ensure statistics object exists
                    // --- Placeholder for Processing and Saving Results ---
                    console.log("Descriptives calculated:", workerResult.statistics);
                    const statsOutput = workerResult.statistics; // Reference for clarity

                    // Simulate saving results (replace with actual logic)
                    const saveResults = async () => {
                        const logEntry = {
                            log: `DESCRIPTIVES VARIABLES=${selectedVariables.map(v => v.name).join(" ")}`
                        };
                        const logId = await addLog(logEntry);

                        const analyticEntry = {
                            title: statsOutput.title || "Descriptives", // Use title from worker or default
                            note: ``
                        };
                        const analyticId = await addAnalytic(logId, analyticEntry);

                        await addStatistic(analyticId, {
                            title: statsOutput.title || "Descriptive Statistics", // Use title from worker or default
                            output_data: JSON.stringify(statsOutput.output_data), // Stringify the table structure
                            components: statsOutput.components || "DescriptiveStatisticsTable", // Component name from worker or default
                            description: statsOutput.description || `Calculated descriptive statistics for ${selectedVariables.map(v => v.name).join(", ")}.` // Description from worker or default
                        });

                        // TODO: Handle saveStandardized option if implemented

                        setIsCalculating(false);
                        onClose(); // Close modal on success
                        cleanupWorker(); // Clean up after successful completion
                    };

                    saveResults().catch(err => {
                        console.error("Error saving descriptives results:", err);
                        setErrorMsg("An error occurred while saving the analysis results.");
                        setIsCalculating(false);
                        cleanupWorker();
                    });

                } else {
                    setErrorMsg(workerResult.error || "An unknown error occurred in the descriptives worker or statistics data is missing.");
                    setIsCalculating(false);
                    cleanupWorker();
                }
            };

            descWorkerRef.current.onerror = (event) => {
                console.error("Descriptives Worker error:", event);
                setErrorMsg("A critical error occurred in the descriptives worker. Check console for details.");
                setIsCalculating(false);
                cleanupWorker();
            };

            // --- Send Data to Worker ---
            descWorkerRef.current.postMessage({
                action: 'CALCULATE_DESCRIPTIVES',
                variableData: fetchedVariableData, // Send fetched variable data
                weightVariableData: weightVariableData, // Send fetched weight data (can be null)
                params: displayStatistics,
                saveStandardized: saveStandardized
            });

            // --- Timeout Setup ---
            const timeoutDuration = 60000; // 60 seconds
            timeoutIdRef.current = setTimeout(() => {
                setErrorMsg("Descriptives analysis timed out. Please try again.");
                setIsCalculating(false);
                cleanupWorker();
            }, timeoutDuration);

        } catch (error) {
            console.error("Error setting up descriptives analysis:", error);
            setErrorMsg("An error occurred before starting the analysis. Please try again.");
            setIsCalculating(false);
            cleanupWorker();
        }
    }, [selectedVariables, displayStatistics, saveStandardized, onClose, addLog, addAnalytic, addStatistic, cleanupWorker]);

    // Effect to clear timeout and worker on unmount
    useEffect(() => {
        return () => {
            cleanupWorker();
        };
    }, [cleanupWorker]);

    return { isCalculating, errorMsg, runAnalysis };
}; 