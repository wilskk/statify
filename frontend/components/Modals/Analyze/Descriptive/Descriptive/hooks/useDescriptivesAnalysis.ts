import { useState, useCallback, useEffect } from 'react';
import { useResultStore } from '@/stores/useResultStore';
import { 
    DescriptivesAnalysisProps, 
    DescriptivesAnalysisResult,
    FetchedData,
    DisplayOrderType,
    ZScoreData
} from '../types';
import { useDataFetching } from './useDataFetching';
import { useDescriptivesWorker } from './useDescriptivesWorker';
import { formatDescriptiveTable } from '../utils';
import { useDataStore, CellUpdate } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';

export const useDescriptivesAnalysis = ({
    selectedVariables,
    displayStatistics,
    saveStandardized,
    displayOrder = 'variableList',
    onClose
}: DescriptivesAnalysisProps): DescriptivesAnalysisResult => {
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { updateCell, updateBulkCells, ensureColumns } = useDataStore();
    const { addMultipleVariables } = useVariableStore();
    
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

    // Function to process Z-score data and add to the data store
    const processZScoreData = useCallback(async (zScoreData: ZScoreData | null) => {
        if (!zScoreData) return;

        // Collect variables to add
        const newVariables: Partial<import('@/types/Variable').Variable>[] = [];
        const bulkCellUpdates: CellUpdate[] = [];

        // Get the existing variables from the store to determine next column index
        const currentVariables = useVariableStore.getState().variables;
        let nextColumnIndex = currentVariables.length;

        // Process each variable's Z-scores
        for (const varName in zScoreData) {
            const zData = zScoreData[varName];
            if (!zData || !zData.scores || !zData.variableInfo) continue;

            // Create the new variable definition
            const variableInfo: Partial<import('@/types/Variable').Variable> = {
                ...zData.variableInfo,
                columnIndex: nextColumnIndex,
                align: "right", // Z-scores align right
                role: "input", // Set role as input
                columns: 64 // Default column display width
            };
            
            newVariables.push(variableInfo);

            // Ensure the data column exists
            await ensureColumns(nextColumnIndex);

            // Create cell updates for this column
            zData.scores.forEach((zScore: number | string, rowIndex: number) => {
                if (zScore !== "" && zScore !== null && zScore !== undefined) {
                    bulkCellUpdates.push({
                        row: rowIndex,
                        col: nextColumnIndex,
                        value: zScore
                    });
                }
            });

            nextColumnIndex++; // Increment for next variable
        }

        // Add the new variables to the store
        if (newVariables.length > 0) {
            await addMultipleVariables(newVariables);
        }

        // Update the data cells in bulk
        if (bulkCellUpdates.length > 0) {
            await updateBulkCells(bulkCellUpdates);
        }
    }, [ensureColumns, updateBulkCells, addMultipleVariables]);

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
            
            // Format the raw data into table format using the utility
            const formattedTable = formatDescriptiveTable(
                statsOutput.output_data,
                displayStatistics,
                displayOrder as DisplayOrderType
            );

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
                    output_data: JSON.stringify({ tables: [formattedTable] }),
                    components: statsOutput.components || "DescriptiveStatisticsTable",
                    description: statsOutput.description || `Calculated descriptive statistics for ${selectedVariables.map(v => v.name).join(", ")}.`
                });

                // Handle saveStandardized option if implemented
                if (saveStandardized && result.zScoreData) {
                    try {
                        await processZScoreData(result.zScoreData);
                    } catch (zScoreError) {
                        console.error("Error processing Z-score data:", zScoreError);
                        setErrorMsg(`Statistics saved successfully but error creating Z-score variables: ${zScoreError instanceof Error ? zScoreError.message : String(zScoreError)}`);
                        // Jangan tutup dialog agar pengguna bisa melihat pesan error
                        return;
                    }
                }

                onClose(); // Close modal on success
            } catch (err) {
                console.error("Error saving descriptives results:", err);
                setErrorMsg("An error occurred while saving the analysis results.");
            }
        } catch (error) {
            console.error("Error in descriptives analysis:", error);
            setErrorMsg(`An error occurred during analysis: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, [selectedVariables, displayStatistics, displayOrder, saveStandardized, onClose, addLog, addAnalytic, addStatistic, fetchData, calculate, processZScoreData]);

    // Calculate combined loading state
    const isLoading = isFetching || isCalculating;

    return { 
        isLoading, 
        errorMsg, 
        runAnalysis,
        cancelAnalysis: cancelCalculation
    };
}; 