import { useState } from "react";
// Store imports are no longer directly needed here as service handles them
// import { useDataStore, CellUpdate } from "@/stores/useDataStore"; 
// import { useVariableStore } from "@/stores/useVariableStore";
import { 
    processCSVContent, 
    CSVProcessingError 
} from "../utils/importCsvUtils"; 
import { CSVProcessingOptions } from "../types";
// import { DataRow } from "@/types/Data"; // No longer needed here
import { importCsvDataService } from "../services/services"; // Import the new service

interface ProcessCSVParams {
    fileContent: string;
    options: CSVProcessingOptions;
}

export const useImportCsvProcessor = () => {
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    
    const processCSV = async (params: ProcessCSVParams) => {
        const { fileContent, options } = params;
        setIsProcessing(true);
        
        try {
            // Reset existing data and variables using the service
            await importCsvDataService.resetStores();
            
            // Process CSV content (this util remains)
            const result = processCSVContent(fileContent, options);
            
            // Populate stores with processed data using the service
            await importCsvDataService.populateStores(result);
            
            return result; // Still returning result for potential use, though stores are updated
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