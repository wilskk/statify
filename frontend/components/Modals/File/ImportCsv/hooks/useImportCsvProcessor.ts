import { useState } from "react";
import { 
    CSVProcessingError 
} from "../importCsvUtils"; 
import type { CSVProcessingOptions } from "../types";
// import { DataRow } from "@/types/Data"; // No longer needed here
import { importCsvDataService } from "../services/services"; // Import the new service
import type { ProcessedCsvData } from "../services/services";
import { parseCsvWithWorker } from "../services/services";

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
            // Reset is no longer needed here, overwriteAll handles it.
            
            // Parse CSV off main thread
            const result: ProcessedCsvData = await parseCsvWithWorker(fileContent, options);
            
            // Populate stores
            await importCsvDataService.populateStores(result);
            
            return result; // Still returning result for potential use, though stores are updated
        } catch (error) {
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