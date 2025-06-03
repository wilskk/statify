import { useDataStore, CellUpdate } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { Variable } from "@/types/Variable";

interface ProcessedCsvData {
    variables: Variable[];
    data: string[][];
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

        for (const variable of variables) {
            await variableStore.addVariable(variable);
        }

        if (data.length > 0) {
            const rowIndices = Array.from({ length: data.length }, (_, i) => i);
            await dataStore.addRows(rowIndices);
        }

        const allUpdates: CellUpdate[] = [];
        data.forEach((row, rowIndex) => {
            row.forEach((value, colIndex) => {
                allUpdates.push({ row: rowIndex, col: colIndex, value });
            });
        });

        if (allUpdates.length > 0) {
            await dataStore.updateCells(allUpdates);
        }
    }
}; 