import { useState } from "react";
import { useDataStore } from "@/stores/useDataStore";
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
    const { updateCell, resetData, addRow } = useDataStore(); // Added addRow
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
            
            // Add data to store
            result.data.forEach((row, rowIndex) => {
                // Ensure row exists if needed, though processCSVContent should handle data structure
                // For example, if using addRow from scratch:
                // addRow(row); 
                // Or if updating cells in pre-existing rows (ensure rows are created):
                // if (rowIndex >= data.length) { addRow(); } // Simplified example
                row.forEach((value, colIndex) => {
                    updateCell(rowIndex, colIndex, value);
                });
            });
            
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