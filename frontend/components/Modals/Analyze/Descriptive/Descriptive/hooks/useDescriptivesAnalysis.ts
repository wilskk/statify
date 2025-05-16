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

/**
 * Hook untuk menjalankan analisis deskriptif
 * 
 * @param selectedVariables - Variabel yang dipilih untuk analisis
 * @param displayStatistics - Pengaturan statistik yang ditampilkan
 * @param saveStandardized - Flag apakah akan membuat variabel Z-score terstandarisasi
 * @param displayOrder - Urutan tampilan hasil
 * @param onClose - Function untuk menutup modal
 */
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

    /**
     * Mengolah data Z-score dari worker dan menyimpannya sebagai variabel baru
     * 
     * @param zScoreData - Data Z-score yang dikalkulasi oleh worker
     * @returns Promise<number> - Jumlah variabel Z-score yang berhasil dibuat
     */
    const processZScoreData = useCallback(async (zScoreData: ZScoreData | null): Promise<number> => {
        if (!zScoreData) return 0;

        // Collect variables to add
        const newVariables: Partial<import('@/types/Variable').Variable>[] = [];
        const bulkCellUpdates: CellUpdate[] = [];

        // Get the existing variables from the store to determine next column index
        const currentVariables = useVariableStore.getState().variables;
        let nextColumnIndex = currentVariables.length;
        
        // Create maps to track variable creation
        const variableCreationMap = new Map<string, string>();

        // Process each variable's Z-scores
        for (const varName in zScoreData) {
            const zData = zScoreData[varName];
            if (!zData || !zData.scores || !zData.variableInfo) continue;

            // Periksa apakah variabel dengan nama ini sudah ada
            const newVarName = zData.variableInfo.name;
            const existingVar = currentVariables.find(v => v.name === newVarName);
            
            if (existingVar) {
                // Dalam kasus variabel sudah ada, kita gunakan kolom yang sama
                console.log(`Z-score variable ${newVarName} already exists at column ${existingVar.columnIndex}. Updating values.`);
                
                // Tambahkan ke map tracking
                variableCreationMap.set(varName, `${newVarName} (updated existing)`);
                
                // Perbarui nilai di kolom yang sudah ada
                zData.scores.forEach((zScore: number | string, rowIndex: number) => {
                    if (zScore !== "" && zScore !== null && zScore !== undefined) {
                        bulkCellUpdates.push({
                            row: rowIndex,
                            col: existingVar.columnIndex,
                            value: zScore
                        });
                    }
                });
            } else {
                // Create the new variable definition
                const variableInfo: Partial<import('@/types/Variable').Variable> = {
                    ...zData.variableInfo,
                    columnIndex: nextColumnIndex,
                    align: "right", // Z-scores align right
                    role: "input", // Set role as input
                    columns: 64 // Default column display width
                };
                
                newVariables.push(variableInfo);
                
                // Tambahkan ke map tracking
                variableCreationMap.set(varName, newVarName);
                
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
        }

        // Add the new variables to the store
        if (newVariables.length > 0) {
            await addMultipleVariables(newVariables);
        }

        // Update the data cells in bulk
        if (bulkCellUpdates.length > 0) {
            await updateBulkCells(bulkCellUpdates);
        }
        
        console.log(`Created ${newVariables.length} new Z-score variables and updated ${bulkCellUpdates.length} cells.`);
        
        // Return jumlah variabel yang dibuat
        return newVariables.length;
    }, [ensureColumns, updateBulkCells, addMultipleVariables]);

    /**
     * Jalankan analisis deskriptif
     */
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
                // --- Simpan hasil statistik ---
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

                // --- Handle saveStandardized option ---
                let zScoreVariablesCreated = 0;
                
                if (saveStandardized && result.zScoreData) {
                    try {
                        zScoreVariablesCreated = await processZScoreData(result.zScoreData);
                        
                        // Tambahkan notasi tentang Z-score ke deskripsi
                        if (zScoreVariablesCreated > 0) {
                            // Update analytic dengan catatan tambahan tentang Z-score
                            await addAnalytic(logId, {
                                ...analyticEntry,
                                note: `Created ${zScoreVariablesCreated} standardized Z-score variables.`
                            });
                        }
                        
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