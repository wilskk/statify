import { useState, useCallback, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { 
    DescriptivesAnalysisProps, 
    DescriptivesAnalysisResult,
    FetchedData
} from '../types';
import { useDataFetching } from './useDataFetching';
import { useDescriptivesWorker } from './useDescriptivesWorker';

export const useDescriptivesAnalysis = ({
    selectedVariables,
    displayStatistics,
    saveStandardized,
    onClose,
}: DescriptivesAnalysisProps): DescriptivesAnalysisResult => {
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    
    // Use the data fetching hook
    const { fetchData, error: fetchError, isLoading: isFetching } = useDataFetching();
    
    // Use the worker hook
    const { calculate, error: workerError, isCalculating, cancelCalculation } = useDescriptivesWorker();

    // Sync fetch error and worker error to our error state
    useEffect(() => {
        if (fetchError) {
            setErrorMsg(fetchError);
        } else if (workerError) {
            setErrorMsg(workerError);
        } else {
            setErrorMsg(null);
        }
    }, [fetchError, workerError]);

    const runAnalysis = useCallback(async () => {
        if (selectedVariables.length === 0) {
            setErrorMsg("Please select at least one variable.");
            return;
        }
        
        setErrorMsg(null);

        try {
            // Use the data fetching hook to fetch variable data
            const { variableData, weightVariableData } = await fetchData(selectedVariables);
            
            // Check if data fetching was successful
            if (!variableData) {
                // Error already set by fetchData
                return;
            }

            // Use the worker hook to calculate statistics
            const result = await calculate({
                variableData,
                weightVariableData,
                params: displayStatistics,
                saveStandardized
            });

            // Check if calculation was successful
            if (!result || !result.success || !result.statistics) {
                // Error already set by worker hook
                return;
            }

            // Process the successful result
            const statsOutput = result.statistics;

            // Save results
            try {
                const logEntry = {
                    log: `DESCRIPTIVES VARIABLES=${selectedVariables.map(v => v.name).join(" ")}`
                };
                const logId = await addLog(logEntry);

                const analyticEntry = {
                    title: statsOutput.title || "Descriptives",
                    note: ``
                };
                const analyticId = await addAnalytic(logId, analyticEntry);

                await addStatistic(analyticId, {
                    title: statsOutput.title || "Descriptive Statistics",
                    output_data: JSON.stringify(statsOutput.output_data),
                    components: statsOutput.components || "DescriptiveStatisticsTable",
                    description: statsOutput.description || `Calculated descriptive statistics for ${selectedVariables.map(v => v.name).join(", ")}.`
                });

                // TODO: Handle saveStandardized option if implemented

                onClose(); // Close modal on success
            } catch (err) {
                console.error("Error saving descriptives results:", err);
                setErrorMsg("An error occurred while saving the analysis results.");
            }
        } catch (error) {
            console.error("Error in descriptives analysis:", error);
            setErrorMsg(`An error occurred during analysis: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, [selectedVariables, displayStatistics, saveStandardized, onClose, addLog, addAnalytic, addStatistic, fetchData, calculate]);

    // Calculate combined loading state
    const isLoading = isFetching || isCalculating;

    return { 
        isLoading, 
        errorMsg, 
        runAnalysis,
        cancelAnalysis: cancelCalculation
    };
}; 