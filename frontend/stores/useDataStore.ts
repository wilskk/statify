// /stores/useDataStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import dataService from "@/services/data/DataService";
import { Variable } from "@/types/Variable";
import { WritableDraft } from 'immer';
import { DataRow } from "@/types/Data";

export type CellUpdate = { row: number; col: number; value: string | number };
export type DataStoreError = {
    message: string;
    source: string;
    originalError?: any;
};

export interface DataStoreState {
    data: DataRow[];
    isLoading: boolean;
    error: DataStoreError | null;
    lastUpdated: Date | null;

    setData: (data: DataRow[]) => void;
    loadData: () => Promise<void>;
    resetData: () => Promise<void>;

    setDataAndSync: (newData: DataRow[]) => Promise<void>;
    applyDiffAndSync: (newData: DataRow[], oldData: DataRow[]) => Promise<void>;
    saveData: () => Promise<void>;

    updateCell: (row: number, col: number, value: string | number) => Promise<void>;
    updateCells: (updates: CellUpdate[]) => Promise<void>;

    addRow: (index?: number) => Promise<void>;
    addRows: (indices: number[]) => Promise<void>;

    addColumn: (index?: number) => Promise<void>;
    addColumns: (indices: number[]) => Promise<void>;

    deleteRow: (index: number) => Promise<void>;
    deleteRows: (indices: number[]) => Promise<void>;

    deleteColumn: (index: number) => Promise<void>;
    deleteColumns: (indices: number[]) => Promise<void>;

    sortData: (columnIndex: number, direction: 'asc' | 'desc') => Promise<void>;
    swapRows: (row1: number, row2: number) => Promise<void>;
    swapColumns: (col1: number, col2: number) => Promise<void>;

    getVariableData: (variable: Variable) => Promise<{ variable: Variable, data: (string | number)[] }>;
    validateVariableData: (columnIndex: number, type: string, width: number) => Promise<{
        isValid: boolean;
        issues: Array<{ row: number; message: string }>
    }>;

    ensureColumns: (targetColIndex: number) => Promise<void>;
}

// Define the initial state explicitly with the correct type
const initialState: Omit<DataStoreState, 'loadData' | 'resetData' | 'updateCell' | 'updateCells' | 'setDataAndSync' | 'applyDiffAndSync' | 'saveData' | 'addRow' | 'addRows' | 'addColumn' | 'addColumns' | 'deleteRow' | 'deleteRows' | 'deleteColumn' | 'deleteColumns' | 'sortData' | 'swapRows' | 'swapColumns' | 'getVariableData' | 'validateVariableData' | 'ensureColumns'> = {
    data: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
    setData: function (data: DataRow[]): void {
        throw new Error("Function not implemented.");
    }
};

// Fungsi helper yang disederhanakan dan diperbaiki, diganti nama menjadi internal
const _ensureMatrixDimensionsInternal = (state: WritableDraft<DataStoreState>, maxRow: number, maxCol: number, minColCount?: number): boolean => {
    const effectiveMaxCol = minColCount !== undefined ? Math.max(maxCol, minColCount - 1) : maxCol;
    const currentRows = state.data?.length || 0;
    const initialCols = currentRows > 0 ? (state.data[0]?.length || 0) : 0;

    let structureChanged = false;
    const targetRows = maxRow + 1; // Need rows up to index maxRow
    const targetCols = Math.max(initialCols, effectiveMaxCol + 1); // Need columns up to index effectiveMaxCol

    // Check if expansion is needed at all
    if (targetRows <= currentRows && targetCols <= initialCols) {
        return false; // No change needed
    }

    // 1. Add rows if needed
    if (targetRows > currentRows) {
        const rowsToAdd = targetRows - currentRows;

        for (let i = 0; i < rowsToAdd; i++) {
            // Add new rows with the *target* width directly
            state.data.push(Array(targetCols).fill(""));
        }
        structureChanged = true;
    }

    // 2. Ensure all rows (including existing ones) have the target column width
    let columnWidthChanged = false;
    const finalRowCount = state.data.length; // Use updated length
    for (let i = 0; i < finalRowCount; i++) {
        const currentRowWidth = state.data[i]?.length || 0;
        if (!state.data[i] || currentRowWidth < targetCols) {
            const existingRowContent = state.data[i] || [];
            const colsToAdd = targetCols - currentRowWidth;
            if (colsToAdd > 0) {
                 // If row doesn't exist or is too short, create/extend it
                 state.data[i] = [...existingRowContent, ...Array(colsToAdd).fill("")];
                 columnWidthChanged = true;
            }
        }
        // Optional: Trim if too wide (shouldn't happen with this logic)
        // else if (currentRowWidth > targetCols) {
        //     state.data[i] = state.data[i].slice(0, targetCols);
        //     columnWidthChanged = true;
        // }
    }

    if (columnWidthChanged) {
        structureChanged = true;
    }

    if (structureChanged) {
        state.lastUpdated = new Date();
    } else {
    }

    // Log final state of specific row if error involves it (example)
    if (maxRow >= 3 && state.data && state.data.length > 3) {
    }

    return structureChanged;
};

export const useDataStore = create<DataStoreState>()(
    devtools(
        immer((set, get) => ({
            ...initialState, // Spread the explicitly typed initial state

            setData: (data: DataRow[]) => set(state => {
                state.data = data;
                state.lastUpdated = new Date();
            }),

            loadData: async () => {
                set((state) => { state.isLoading = true; state.error = null; });
                try {
                    const { data } = await dataService.loadAllData();
                    set((state) => { 
                        state.data = data; 
                        state.lastUpdated = new Date(); 
                        state.isLoading = false; 
                    });
                } catch (error: any) {
                    console.error("Failed to load data:", error);
                    set((state) => {
                        state.error = { message: error.message || "Error loading data", source: "loadData", originalError: error };
                        state.isLoading = false; state.data = [];
                    });
                }
            },

            resetData: async () => {
                try {
                    await dataService.resetAllData();
                    set((state) => { state.data = []; state.lastUpdated = new Date(); state.error = null; });
                } catch (error: any) {
                    console.error("Failed to reset data:", error);
                    set((state) => { state.error = { message: error.message || "Error resetting data", source: "resetData", originalError: error }; });
                }
            },

            updateCell: async (row, col, value) => {
                return await get().updateCells([{ row, col, value }]);
            },

            updateCells: async (updates) => {
                if (!updates || updates.length === 0) {
                     return;
                }

                const oldData = get().data; // For rollback and comparison

                // Calculate max dimensions based on ALL incoming updates *before* filtering
                let maxRow = -1; let maxCol = -1;
                updates.forEach(({ row, col }) => { if (row > maxRow) maxRow = row; if (col > maxCol) maxCol = col; });

                // Filter updates *before* expansion (based on oldData) to determine if DB op needed later
                const validUpdatesForPotentialChange = updates.filter(({ row, col, value }) => {
                    const currentValue = oldData[row]?.[col];
                    const isNewCell = !(row < oldData.length && col < (oldData[row]?.length ?? 0));
                    const isMeaningfulNewValue = value !== "" && value !== null && value !== undefined;
                    // Update needed if: value changes OR it's a new cell with a meaningful value
                    const needsUpdate = (currentValue !== value) || (isNewCell && isMeaningfulNewValue);
                    return needsUpdate;
                });

                const oldDataCopy = oldData.map(r => [...r]); // Deep copy for rollback

                let dataChangedInState = false;
                let structureActuallyChanged = false;

                set((state) => {
                    const minCols = state.data.length > 0 ? state.data[0]?.length ?? 0 : 0;
                    // Use the renamed internal helper, ensure dimensions based on maxRow/maxCol from *all* updates
                    structureActuallyChanged = _ensureMatrixDimensionsInternal(state, maxRow, maxCol, minCols);

                    // Iterate through the *original* updates again, but apply based on the *current* (potentially expanded) state
                    updates.forEach(({ row, col, value }) => {
                        // Check bounds against the *current* state inside 'set'
                        if (row < state.data.length && col < (state.data[row]?.length ?? 0)) {
                            // Apply if value is different in the *current* state
                             if(state.data[row][col] !== value) {
                                state.data[row][col] = value;
                                dataChangedInState = true; // Mark that data *in the state* definitely changed
                            }
                        } else {
                            // This error check is still valid, should not happen if ensure is correct
                            console.error(`[updateCells] Skipping update (out of bounds!): Cell (${row}, ${col}) STILL not accessible after ensure. State R=${state.data.length}, State C[${row}]=${state.data[row]?.length}`);
                        }
                    });

                    if(dataChangedInState || structureActuallyChanged) {
                        state.lastUpdated = new Date();
                    }
                });

                // Perform DB operations if there are valid updates
                if (validUpdatesForPotentialChange.length === 0) {
                     return;
                }

                try {
                    // Use dataService to apply bulk updates
                    await dataService.applyBulkUpdates(validUpdatesForPotentialChange);
                    
                    // Clear related error on success
                    set(state => { if(state.error?.source === 'updateCells') state.error = null; });
                } catch (error: any) {
                    console.error("[updateCells] DB transaction failed:", error);
                    // Rollback state using the copy made *before* the 'set' call
                    set((state) => {
                        state.data = oldDataCopy;
                        state.lastUpdated = new Date(); // Reflect rollback time
                        state.error = { message: "Bulk update failed, state rolled back", source: "updateCells", originalError: error };
                    });
                }
            },

            setDataAndSync: async (newData) => {
                set(state => {
                    state.data = newData;
                    state.lastUpdated = new Date();
                    state.error = null;
                });

                try {
                    // Use dataService's replaceAllData
                    await dataService.replaceAllData(newData);
                } catch (error: any) {
                    console.error("Failed to sync data (replace approach):", error);
                    set((state) => {
                        state.error = { message: "Failed to sync data (replace)", source: "setDataAndSync", originalError: error };
                    });
                    await get().loadData(); // Reload data from DB on error
                }
            },

            applyDiffAndSync: async (newData, oldData) => {
                // Calculate row differences for efficient updates
                const maxRows = Math.max(oldData.length, newData.length);
                const updatedRowIndices: number[] = [];
                
                for (let r = 0; r < maxRows; r++) {
                    const oldRow = oldData[r] || [];
                    const newRow = newData[r] || [];
                    
                    // Check if this row has any differences
                    const maxCols = Math.max(oldRow.length, newRow.length);
                    let rowChanged = false;
                    
                    for (let c = 0; c < maxCols; c++) {
                        const oldValue = oldRow[c] ?? "";
                        const newValue = newRow[c] ?? "";
                        
                        if (oldValue !== newValue) {
                            rowChanged = true;
                            break;
                        }
                    }
                    
                    if (rowChanged) {
                        updatedRowIndices.push(r);
                    }
                }
                
                if (updatedRowIndices.length > 0) {
                    try {
                        // Prepare bulk updates for the data service
                        const bulkUpdates: CellUpdate[] = [];
                        
                        for (const rowIndex of updatedRowIndices) {
                            if (rowIndex < newData.length) {
                                const row = newData[rowIndex];
                                for (let colIndex = 0; colIndex < row.length; colIndex++) {
                                    // Only add to bulk updates if the value has changed
                                    const oldValue = oldData[rowIndex]?.[colIndex] ?? "";
                                    const newValue = row[colIndex];
                                    
                                    if (oldValue !== newValue) {
                                        bulkUpdates.push({
                                            row: rowIndex,
                                            col: colIndex,
                                            value: newValue
                                        });
                                    }
                                }
                            } else {
                                // Row was deleted in newData
                                // For each column in the old row, set to empty
                                const oldRow = oldData[rowIndex] || [];
                                for (let colIndex = 0; colIndex < oldRow.length; colIndex++) {
                                    bulkUpdates.push({
                                        row: rowIndex,
                                        col: colIndex,
                                        value: ""
                                    });
                                }
                            }
                        }
                        
                        // Apply all the updates through the service
                        if (bulkUpdates.length > 0) {
                            await dataService.applyBulkUpdates(bulkUpdates);
                        }
                        
                        set(state => { if(state.error?.source === 'applyDiffAndSync') state.error = null; });
                    } catch (error: any) {
                        console.error("Failed to sync data (diff approach):", error);
                        set((state) => {
                            state.error = { message: "Failed to sync data (diff)", source: "applyDiffAndSync", originalError: error };
                            state.data = oldData;
                        });
                    }
                } else {
                    set(state => { if(state.error?.source === 'applyDiffAndSync') state.error = null; });
                }
            },

            saveData: async () => {
                const currentData = get().data;
                try {
                    // Use dataService.replaceAllData to save the entire dataset
                    await dataService.replaceAllData(currentData);
                    set((state) => { state.error = null; state.lastUpdated = new Date(); });
                } catch (error: any) {
                    console.error("Failed to explicitly save data:", error);
                    set((state) => {
                        state.error = { message: error.message || "Failed to save data during explicit save", source: "saveData", originalError: error };
                    });
                    throw error;
                }
            },

            addRow: async (index?) => {
                const oldData = get().data;
                const rowIndex = index !== undefined ? index : oldData.length;
                
                try {
                    // Update state locally first for immediate UI update
                    let finalData: DataRow[] = [];
                    set((state) => {
                        const colCount = state.data.length > 0 ? (state.data[0]?.length ?? 0) : 0;
                        const newRow = Array(colCount).fill("");
                        const updatedData = [...state.data];
                        updatedData.splice(rowIndex, 0, newRow);
                        state.data = updatedData;
                        state.lastUpdated = new Date();
                        finalData = state.data;
                    });
                    
                    // Use the service to add the row
                    await dataService.addRow(rowIndex);
                    
                    // Clear any errors on success
                    set(state => { if(state.error?.source === 'addRow') state.error = null; });
                } catch (error: any) {
                    console.error(`Failed to add row at index ${rowIndex}:`, error);
                    // Rollback state on error
                    set((state) => {
                        state.data = oldData;
                        state.lastUpdated = new Date();
                        state.error = { 
                            message: error.message || "Failed to add row", 
                            source: "addRow",
                            originalError: error
                        };
                    });
                }
            },

            addRows: async (indices: number[]) => {
                if (!indices || indices.length === 0) return;
                
                // Sort indices in descending order to avoid shifting problems
                const sortedIndices = [...indices].sort((a, b) => b - a);
                const oldData = get().data;
                
                try {
                    // Update state locally first for immediate UI update
                    let finalData: DataRow[] = [];
                    set((state) => {
                        const colCount = state.data.length > 0 ? (state.data[0]?.length ?? 0) : 0;
                        const newRow = Array(colCount).fill("");
                        const updatedData = [...state.data];
                        
                        // Add rows at each index
                        for (const index of sortedIndices) {
                            const rowIndex = index !== undefined ? index : updatedData.length;
                            updatedData.splice(rowIndex, 0, [...newRow]);
                        }
                        
                        state.data = updatedData;
                        state.lastUpdated = new Date();
                        finalData = state.data;
                    });
                    
                    // Use the service to add each row individually since addRows doesn't exist
                    for (const index of sortedIndices) {
                        await dataService.addRow(index);
                    }
                    
                    // Clear any errors on success
                    set(state => { if(state.error?.source === 'addRows') state.error = null; });
                } catch (error: any) {
                    console.error("Failed to add bulk rows:", error);
                    // Rollback state on error
                    set((state) => {
                        state.data = oldData;
                        state.lastUpdated = new Date();
                        state.error = { 
                            message: error.message || "Failed to add bulk rows", 
                            source: "addRows",
                            originalError: error
                        };
                    });
                }
            },

            addColumn: async (index?) => {
                const oldData = get().data;
                const colIndex = index !== undefined ? index : (oldData.length > 0 ? (oldData[0]?.length ?? 0) : 0);
                
                try {
                    // Update state locally first for immediate UI update
                    let finalData: DataRow[] = [];
                    set((state) => {
                        state.data = state.data.map(row => {
                            const newRow = [...row];
                            newRow.splice(colIndex, 0, "");
                            return newRow;
                        });
                        state.lastUpdated = new Date();
                        finalData = state.data;
                    });
                    
                    // Use the service to add the column
                    await dataService.addColumn(colIndex);
                    
                    // Clear any errors on success
                    set(state => { if(state.error?.source === 'addColumn') state.error = null; });
                } catch (error: any) {
                    console.error(`Failed to add column at index ${colIndex}:`, error);
                    // Rollback state on error
                    set((state) => {
                        state.data = oldData;
                        state.lastUpdated = new Date();
                        state.error = { 
                            message: error.message || "Failed to add column", 
                            source: "addColumn",
                            originalError: error
                        };
                    });
                }
            },

            addColumns: async (indices: number[]) => {
                if (!indices || indices.length === 0) return;
                
                // Sort indices in descending order to avoid shifting problems
                const sortedIndices = [...indices].sort((a, b) => b - a);
                const oldData = get().data;
                
                try {
                    // Update state locally first for immediate UI update
                    let finalData: DataRow[] = [];
                    set((state) => {
                        // Add columns to each row
                        state.data = state.data.map(row => {
                            const newRow = [...row];
                            for (const colIndex of sortedIndices) {
                                const columnIndex = colIndex !== undefined ? colIndex : newRow.length;
                                newRow.splice(columnIndex, 0, "");
                            }
                            return newRow;
                        });
                        
                        state.lastUpdated = new Date();
                        finalData = state.data;
                    });
                    
                    // Use the service to add each column individually since addColumns doesn't exist
                    for (const colIndex of sortedIndices) {
                        await dataService.addColumn(colIndex);
                    }
                    
                    // Clear any errors on success
                    set(state => { if(state.error?.source === 'addColumns') state.error = null; });
                } catch (error: any) {
                    console.error("Failed to add bulk columns:", error);
                    // Rollback state on error
                    set((state) => {
                        state.data = oldData;
                        state.lastUpdated = new Date();
                        state.error = { 
                            message: error.message || "Failed to add bulk columns", 
                            source: "addColumns",
                            originalError: error
                        };
                    });
                }
            },

            deleteRow: async (index: number) => {
                const oldData = get().data;
                if (index < 0 || index >= oldData.length) { 
                    set(state => { 
                        state.error = { message: "Invalid row index", source: "deleteRow" }; 
                    }); 
                    return; 
                }
                
                try {
                    // Update state locally first for immediate UI update
                    let finalData: DataRow[] = [];
                    set((state) => {
                        const updatedData = [...state.data];
                        updatedData.splice(index, 1);
                        state.data = updatedData;
                        state.lastUpdated = new Date();
                        finalData = state.data;
                    });
                    
                    // Use the service to delete the row
                    await dataService.deleteRow(index);
                    
                    // Clear any errors on success
                    set(state => { if(state.error?.source === 'deleteRow') state.error = null; });
                } catch (error: any) {
                    console.error(`Failed to delete row at index ${index}:`, error);
                    // Rollback state on error
                    set((state) => {
                        state.data = oldData;
                        state.lastUpdated = new Date();
                        state.error = { 
                            message: error.message || "Failed to delete row", 
                            source: "deleteRow",
                            originalError: error
                        };
                    });
                }
            },

            deleteRows: async (indices: number[]) => {
                if (!indices || indices.length === 0) return;
                
                const oldData = get().data;
                
                // Validate indices
                for (const index of indices) {
                    if (index < 0 || index >= oldData.length) {
                        set(state => { 
                            state.error = { 
                                message: `Invalid row index ${index} for deletion`,
                                source: "deleteRows" 
                            }; 
                        });
                        return;
                    }
                }
                
                try {
                    // Sort indices in descending order to avoid shifting problems
                    const sortedIndices = [...indices].sort((a, b) => b - a);
                    
                    // Update state locally first for immediate UI update
                    let finalData: DataRow[] = [];
                    set((state) => {
                        const updatedData = [...state.data];
                        
                        // Delete rows at each index
                        for (const index of sortedIndices) {
                            updatedData.splice(index, 1);
                        }
                        
                        state.data = updatedData;
                        state.lastUpdated = new Date();
                        finalData = state.data;
                    });
                    
                    // Use the service to delete the rows
                    for (const index of sortedIndices) {
                        await dataService.deleteRow(index);
                    }
                    
                    // Clear any errors on success
                    set(state => { if(state.error?.source === 'deleteRows') state.error = null; });
                } catch (error: any) {
                    console.error("Failed to delete bulk rows:", error);
                    // Rollback state on error
                    set((state) => {
                        state.data = oldData;
                        state.lastUpdated = new Date();
                        state.error = { 
                            message: error.message || "Failed to delete bulk rows", 
                            source: "deleteRows",
                            originalError: error
                        };
                    });
                }
            },

            deleteColumn: async (index: number) => {
                const oldData = get().data;
                if (oldData.length === 0 || index < 0 || index >= (oldData[0]?.length ?? 0)) { 
                    set(state => { 
                        state.error = { message: "Invalid column index for deletion", source: "deleteColumn" }; 
                    }); 
                    return; 
                }
                
                try {
                    // Update state locally first for immediate UI update
                    let finalData: DataRow[] = [];
                    set((state) => {
                        state.data = state.data.map(row => {
                            // Ensure the row exists and the index is valid before splicing
                            if (row && index < row.length) {
                                const newRow = [...row];
                                newRow.splice(index, 1);
                                return newRow;
                            } 
                            return row; // Return unmodified row if index is out of bounds for it
                        });
                        state.lastUpdated = new Date();
                        state.error = null; // Clear previous errors on success
                        finalData = state.data;
                    });
                    
                    // Use the service to delete the column
                    await dataService.deleteColumn(index);
                    
                    // Clear any errors on success
                    set(state => { if(state.error?.source === 'deleteColumn') state.error = null; });
                } catch (error: any) {
                    console.error(`Failed to delete column at index ${index}:`, error);
                    // Rollback state on error
                    set((state) => {
                        state.data = oldData;
                        state.lastUpdated = new Date();
                        state.error = { 
                            message: error.message || "Failed to delete column", 
                            source: "deleteColumn",
                            originalError: error
                        };
                    });
                }
            },

            deleteColumns: async (indices: number[]) => {
                if (!indices || indices.length === 0) return;
                
                const oldData = get().data;
                
                // Validate indices
                if (oldData.length === 0) return;
                const colCount = oldData[0]?.length ?? 0;
                
                for (const index of indices) {
                    if (index < 0 || index >= colCount) {
                        set(state => { 
                            state.error = { 
                                message: `Invalid column index ${index} for deletion`,
                                source: "deleteColumns" 
                            }; 
                        });
                        return;
                    }
                }
                
                try {
                    // Sort indices in descending order to avoid shifting problems
                    const sortedIndices = [...indices].sort((a, b) => b - a);
                    
                    // Update state locally first for immediate UI update
                    let finalData: DataRow[] = [];
                    set((state) => {
                        // Delete columns from each row
                        state.data = state.data.map(row => {
                            if (!row) return row;
                            
                            const newRow = [...row];
                            for (const index of sortedIndices) {
                                if (index < newRow.length) {
                                    newRow.splice(index, 1);
                                }
                            }
                            return newRow;
                        });
                        
                        state.lastUpdated = new Date();
                        state.error = null; // Clear previous errors on success
                        finalData = state.data;
                    });
                    
                    // Use the service to delete the columns
                    for (const index of sortedIndices) {
                        await dataService.deleteColumn(index);
                    }
                    
                    // Clear any errors on success
                    set(state => { if(state.error?.source === 'deleteColumns') state.error = null; });
                } catch (error: any) {
                    console.error("Failed to delete bulk columns:", error);
                    // Rollback state on error
                    set((state) => {
                        state.data = oldData;
                        state.lastUpdated = new Date();
                        state.error = { 
                            message: error.message || "Failed to delete bulk columns", 
                            source: "deleteColumns",
                            originalError: error
                        };
                    });
                }
            },

            sortData: async (columnIndex: number, direction: 'asc' | 'desc') => {
                const oldData = get().data;
                if (oldData.length === 0) return;
                
                let finalData: DataRow[] = [];
                
                try {
                    // Sort locally first for immediate UI update
                    set(state => {
                        const rowsToSort = [...state.data];
                        rowsToSort.sort((rowA, rowB) => {
                            const valueA = columnIndex < (rowA?.length ?? 0) ? rowA[columnIndex] : "";
                            const valueB = columnIndex < (rowB?.length ?? 0) ? rowB[columnIndex] : "";
                            const isANumeric = typeof valueA === 'number' || (typeof valueA === 'string' && valueA !== "" && !isNaN(Number(valueA)));
                            const isBNumeric = typeof valueB === 'number' || (typeof valueB === 'string' && valueB !== "" && !isNaN(Number(valueB)));
                            if (isANumeric && isBNumeric) {
                                const numA = typeof valueA === 'number' ? valueA : Number(valueA); 
                                const numB = typeof valueB === 'number' ? valueB : Number(valueB);
                                return direction === 'asc' ? numA - numB : numB - numA;
                            }
                            if (isANumeric && !isBNumeric) return direction === 'asc' ? -1 : 1;
                            if (!isANumeric && isBNumeric) return direction === 'asc' ? 1 : -1;
                            const strA = String(valueA ?? '').toLowerCase(); 
                            const strB = String(valueB ?? '').toLowerCase();
                            return direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
                        });
                        state.data = rowsToSort;
                        state.lastUpdated = new Date();
                        finalData = state.data;
                    });
                    
                    // Use the service to persist the sorted data
                    await dataService.sortData(columnIndex, direction);
                    
                    // Clear any errors on success
                    set(state => { if(state.error?.source === 'sortData') state.error = null; });
                } catch (error: any) {
                    console.error(`Failed to sort data by column ${columnIndex}:`, error);
                    // Rollback state on error
                    set((state) => {
                        state.data = oldData;
                        state.lastUpdated = new Date();
                        state.error = { 
                            message: error.message || "Failed to sort data", 
                            source: "sortData",
                            originalError: error
                        };
                    });
                }
            },

            swapRows: async (row1: number, row2: number) => {
                const oldData = get().data;
                if (row1 < 0 || row2 < 0 || row1 >= oldData.length || row2 >= oldData.length || row1 === row2) { 
                    set(state => { 
                        state.error = { message: "Invalid row indices for swapping", source: "swapRows" }; 
                    }); 
                    return; 
                }
                
                let finalData: DataRow[] = [];
                
                try {
                    // Update state locally first for immediate UI update
                    set((state) => {
                        const updatedData = [...state.data];
                        [updatedData[row1], updatedData[row2]] = [updatedData[row2], updatedData[row1]];
                        state.data = updatedData;
                        state.lastUpdated = new Date();
                        finalData = state.data;
                    });
                    
                    // Use the service to perform the swap operation
                    await dataService.swapRows(row1, row2);
                    
                    // Clear any errors on success
                    set(state => { if(state.error?.source === 'swapRows') state.error = null; });
                } catch (error: any) {
                    console.error(`Failed to swap rows ${row1} and ${row2}:`, error);
                    // Rollback state on error
                    set((state) => {
                        state.data = oldData;
                        state.lastUpdated = new Date();
                        state.error = { 
                            message: error.message || "Failed to swap rows", 
                            source: "swapRows",
                            originalError: error
                        };
                    });
                }
            },

            swapColumns: async (col1: number, col2: number) => {
                const oldData = get().data;
                if (oldData.length === 0) return;
                const colCount = oldData[0]?.length ?? 0;
                
                if (col1 < 0 || col2 < 0 || col1 >= colCount || col2 >= colCount || col1 === col2) { 
                    set(state => { 
                        state.error = { message: "Invalid column indices for swapping", source: "swapColumns" }; 
                    }); 
                    return; 
                }
                
                let finalData: DataRow[] = [];
                
                try {
                    // Update state locally first for immediate UI update
                    set((state) => {
                        state.data = state.data.map(row => {
                            const newRow = [...row];
                            [newRow[col1], newRow[col2]] = [newRow[col2], newRow[col1]];
                            return newRow;
                        });
                        state.lastUpdated = new Date();
                        finalData = state.data;
                    });
                    
                    // Use the service to perform the swap operation
                    await dataService.swapColumns(col1, col2);
                    
                    // Clear any errors on success
                    set(state => { if(state.error?.source === 'swapColumns') state.error = null; });
                } catch (error: any) {
                    console.error(`Failed to swap columns ${col1} and ${col2}:`, error);
                    // Rollback state on error
                    set((state) => {
                        state.data = oldData;
                        state.lastUpdated = new Date();
                        state.error = { 
                            message: error.message || "Failed to swap columns", 
                            source: "swapColumns",
                            originalError: error
                        };
                    });
                }
            },

            getVariableData: async (variable: Variable) => {
                if (get().data.length === 0 && !get().isLoading) { await get().loadData(); }
                const currentData = get().data;
                const { columnIndex } = variable;
                if (columnIndex < 0) return { variable, data: [] };
                
                // Use DataService to get column data if possible
                try {
                    const { columnData } = await dataService.getColumnData(columnIndex);
                    return { variable, data: columnData };
                } catch (error) {
                    // Fallback to local data if service call fails
                    console.error(`Failed to get variable data via service, using local: ${error}`);
                    const columnData = currentData.map(row => (row && columnIndex < row.length) ? row[columnIndex] : "" );
                    return { variable, data: columnData };
                }
            },

            validateVariableData: async (columnIndex: number, type: string, width: number) => {
                const currentData = get().data;
                const issues: Array<{ row: number; message: string }> = [];
                const updates: CellUpdate[] = [];
                let isValid = true;
                if (currentData.length === 0 || columnIndex < 0) return { isValid: true, issues: [] };
                for (let row = 0; row < currentData.length; row++) {
                    if (!currentData[row] || columnIndex >= currentData[row].length) continue;
                    const value = currentData[row][columnIndex]; const originalValue = value; let correctedValue: string | number | undefined = undefined; let issueMessage: string | null = null;
                    if (value === "" || value === null || value === undefined) continue;

                    if (type.startsWith("NUMERIC") || ["COMMA", "DOT", "SCIENTIFIC"].includes(type)) { const numValue = Number(value); if (isNaN(numValue)) { issueMessage = `R${row + 1}C${columnIndex + 1}: "${value}" invalid number.`; isValid = false; correctedValue = ""; } else { const valueStr = String(value); if (valueStr.length > width) { issueMessage = `R${row + 1}C${columnIndex + 1}: Number "${value}" exceeds width (${valueStr.length}>${width}).`; isValid = false; correctedValue = ""; } } }
                    else if (type === "STRING") { const strValue = String(value); if (strValue.length > width) { issueMessage = `R${row + 1}C${columnIndex + 1}: String "${strValue}" exceeds width (${strValue.length}>${width}).`; isValid = false; correctedValue = strValue.substring(0, width); } }
                    else if (["DATE", "ADATE", "EDATE", "SDATE", "JDATE"].includes(type)) { const dateStr = String(value); const isValidDate = !isNaN(Date.parse(dateStr)); if (!isValidDate) { issueMessage = `R${row + 1}C${columnIndex + 1}: Value "${dateStr}" invalid date.`; isValid = false; correctedValue = ""; } }

                    if (issueMessage) issues.push({ row, message: issueMessage });
                    if (correctedValue !== undefined && correctedValue !== originalValue) updates.push({ row, col: columnIndex, value: correctedValue });
                }
                if (updates.length > 0) await get().updateCells(updates);
                return { isValid, issues };
            },

            ensureColumns: async (targetColIndex: number) => {
                const currentMaxCol = get().data.length > 0 ? (get().data[0]?.length ?? 0) - 1 : -1;

                // Only proceed if the target index requires expansion
                if (targetColIndex > currentMaxCol) {
                     console.log(`[ensureColumns] Expanding data columns up to index ${targetColIndex}. Current max: ${currentMaxCol}`);
                    set((state) => {
                        // Use the internal helper to expand columns efficiently
                        // We pass state.data.length - 1 for maxRow to avoid adding new rows
                        const maxRowIndex = state.data.length > 0 ? state.data.length - 1 : 0;
                        _ensureMatrixDimensionsInternal(state, maxRowIndex, targetColIndex);
                        // No explicit DB sync needed here as _ensureMatrixDimensionsInternal
                        // only adds empty cells/columns which are not persisted until filled.
                        // It updates lastUpdated internally.
                    });
                } else {
                     console.log(`[ensureColumns] No expansion needed. Target: ${targetColIndex}, Current max: ${currentMaxCol}`);
                }
                // No async DB operation here, so the Promise resolves quickly.
            },
        }))
    )
);