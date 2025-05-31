import { useState } from "react";
import { useDataStore, CellUpdate } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { 
    CSVProcessingOptions, 
    processCSVContent, 
    CSVProcessingError 
} from "./utils/importCsvUtils"; // Corrected import path
import { DataRow } from "@/types/Data"; // Added DataRow import

interface ProcessCSVParams {
    fileContent: string;
    options: CSVProcessingOptions;
}

export const useImportCsvProcessor = () => { // Renamed hook
    const { updateCells, resetData, addRows } = useDataStore();
    const { resetVariables, addVariable } = useVariableStore();
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    
    const processCSV = async (params: ProcessCSVParams) => {
        const { fileContent, options } = params;
        setIsProcessing(true);
        
        try {
            // Reset existing data and variables
            await resetData();
            await resetVariables();
            
            // Process CSV content
            const result = processCSVContent(fileContent, options);
            
            // Add variables to store
            for (const variable of result.variables) {
                await addVariable(variable);
            }
            
            // Prepare to add rows in bulk if needed
            if (result.data.length > 0) {
                // Create row indices array for all rows to add
                const rowIndices = Array.from({ length: result.data.length }, (_, i) => i);
                await addRows(rowIndices);
            }
            
            // Add data to store using bulk update
            const allUpdates: CellUpdate[] = [];
            result.data.forEach((row, rowIndex) => {
                row.forEach((value, colIndex) => {
                    // Collect all updates in a single array
                    allUpdates.push({ row: rowIndex, col: colIndex, value });
                });
            });
            
            // Apply all updates at once
            if (allUpdates.length > 0) {
                await updateCells(allUpdates);
            }
            
            return result;
        } catch (error) {
            console.error("Error in useImportCsvProcessor:", error);
            if (error instanceof CSVProcessingError) {
                throw error;
            }
            throw new Error(
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred while processing the CSV file"
            );
        } finally {
            setIsProcessing(false);
        }
    };
    
    return {
        processCSV,
        isProcessing
    };
}; 