import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { Variable } from "@/types/Variable";
import { CSVProcessingOptions } from "../types";

export interface ProcessedCsvData {
    variables: Variable[];
    data: string[][];
}

/**
 * Parses CSV content off the main thread via Web Worker.
 */
export function parseCsvWithWorker(
  fileContent: string,
  options: CSVProcessingOptions
): Promise<ProcessedCsvData> {
  return new Promise((resolve, reject) => {
    const worker = new Worker("/workers/file-management/csvWorker.js");
    worker.onmessage = (e) => {
      const { result, error } = e.data;
      if (error) reject(new Error(error));
      else resolve(result);
      worker.terminate();
    };
    worker.onerror = (err) => {
      reject(err.error || new Error("Worker error"));
      worker.terminate();
    };
    worker.postMessage({ fileContent, options });
  });
}

export const importCsvDataService = {
    async resetStores(): Promise<void> {
        // It's good practice to call getState() right when you need the action
        // to ensure you're getting the latest state of the store if actions themselves
        // don't directly cause re-renders in this non-React context.
        await useDataStore.getState().resetData();
        await useVariableStore.getState().resetVariables();
    },

    async populateStores(processedData: ProcessedCsvData): Promise<void> {
        const { variables, data } = processedData;
        const dataStore = useDataStore.getState();
        const variableStore = useVariableStore.getState();

        // Bulk replace variables
        await variableStore.overwriteVariables(variables);

        // Bulk replace data
        dataStore.setData(data);
    }
}; 