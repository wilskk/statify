// /stores/useDataStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import dataService from "@/services/data/DataService";
import { Variable } from "@/types/Variable";
import { WritableDraft } from 'immer';
import { DataRow } from "@/types/Data";

// Sync status types
export type SyncStatusType = 'idle' | 'syncing' | 'error';

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
    hasUnsavedChanges: boolean;
    // pending cell updates for delta sync
    pendingUpdates: CellUpdate[];
    syncStatus: SyncStatusType;
    lastSyncedAtSync: Date | null;
    syncError: string | null;

    loadData: () => Promise<void>;
    resetData: () => Promise<void>;

    setData: (newData: DataRow[]) => void;
    saveData: (rowsToSave?: DataRow[]) => Promise<void>;

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

    getVariableData: (variable: Variable) => Promise<{ variable: Variable, data: (string | number)[] }>;
    validateVariableData: (columnIndex: number, type: string, width: number) => Promise<{
        isValid: boolean;
        issues: Array<{ row: number; message: string }>
    }>;

    ensureColumns: (targetColIndex: number) => Promise<void>;
}

const initialState: Omit<DataStoreState, 'loadData' | 'resetData' | 'updateCell' | 'updateCells' | 'setData' | 'saveData' | 'addRow' | 'addRows' | 'addColumn' | 'addColumns' | 'deleteRow' | 'deleteRows' | 'deleteColumn' | 'deleteColumns' | 'sortData' | 'getVariableData' | 'validateVariableData' | 'ensureColumns'> = {
    data: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
    hasUnsavedChanges: false,
    pendingUpdates: [],
    syncStatus: 'idle',
    lastSyncedAtSync: null,
    syncError: null
};

const _ensureMatrixDimensionsInternal = (state: WritableDraft<DataStoreState>, maxRow: number, maxCol: number, minColCount?: number): boolean => {
    const effectiveMaxCol = minColCount !== undefined ? Math.max(maxCol, minColCount - 1) : maxCol;
    const currentRows = state.data?.length || 0;
    const initialCols = currentRows > 0 ? (state.data[0]?.length || 0) : 0;

    let structureChanged = false;
    const targetRows = maxRow + 1;
    const targetCols = Math.max(initialCols, effectiveMaxCol + 1);

    if (targetRows <= currentRows && targetCols <= initialCols) {
        return false;
    }

    if (targetRows > currentRows) {
        const rowsToAdd = targetRows - currentRows;

        for (let i = 0; i < rowsToAdd; i++) {
            state.data.push(Array(targetCols).fill(""));
        }
        structureChanged = true;
    }

    let columnWidthChanged = false;
    const finalRowCount = state.data.length;
    for (let i = 0; i < finalRowCount; i++) {
        const currentRowWidth = state.data[i]?.length || 0;
        if (!state.data[i] || currentRowWidth < targetCols) {
            const existingRowContent = state.data[i] || [];
            const colsToAdd = targetCols - currentRowWidth;
            if (colsToAdd > 0) {
                 state.data[i] = [...existingRowContent, ...Array(colsToAdd).fill("")];
                 columnWidthChanged = true;
            }
        }
    }

    if (columnWidthChanged) {
        structureChanged = true;
    }

    if (structureChanged) {
        state.lastUpdated = new Date();
    }

    return structureChanged;
};

export const useDataStore = create<DataStoreState>()(
    devtools(
        immer((set, get) => ({
            ...initialState,

            loadData: async () => {
                set((state) => { state.isLoading = true; state.error = null; });
                try {
                    const { data } = await dataService.loadAllData();
                    set((state) => { 
                        state.data = data; 
                        state.lastUpdated = new Date(); 
                        state.isLoading = false;
                        state.hasUnsavedChanges = false; 
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
                    set((state) => { 
                        state.data = []; 
                        state.lastUpdated = new Date(); 
                        state.error = null; 
                        state.hasUnsavedChanges = false;
                    });
                } catch (error: any) {
                    console.error("Failed to reset data:", error);
                    set((state) => { state.error = { message: error.message || "Error resetting data", source: "resetData", originalError: error }; });
                }
            },

            updateCell: async (row, col, value) => {
                return await get().updateCells([{ row, col, value }]);
            },

            updateCells: async (updates) => {
                if (!updates || updates.length === 0) return;

                const oldData = get().data;

                let maxRow = -1; let maxCol = -1;
                updates.forEach(({ row, col }) => { if (row > maxRow) maxRow = row; if (col > maxCol) maxCol = col; });

                const validUpdatesForPotentialChange = updates.filter(({ row, col, value }) => {
                    const currentValue = oldData[row]?.[col];
                    const isNewCell = !(row < oldData.length && col < (oldData[row]?.length ?? 0));
                    const isMeaningfulNewValue = value !== "" && value !== null && value !== undefined;
                    const needsUpdate = (currentValue !== value) || (isNewCell && isMeaningfulNewValue);
                    return needsUpdate;
                });

                if (validUpdatesForPotentialChange.length === 0) return;

                let dataChangedInState = false;
                let structureActuallyChanged = false;

                set((state) => {
                    const minCols = state.data.length > 0 ? state.data[0]?.length ?? 0 : 0;
                    structureActuallyChanged = _ensureMatrixDimensionsInternal(state, maxRow, maxCol, minCols);

                    updates.forEach(({ row, col, value }) => {
                        if (row < state.data.length && col < (state.data[row]?.length ?? 0)) {
                            if(state.data[row][col] !== value) {
                                state.data[row][col] = value;
                                dataChangedInState = true;
                            }
                        } else {
                            console.error(`[updateCells] Skipping update (out of bounds!): Cell (${row}, ${col}) STILL not accessible after ensure. State R=${state.data.length}, State C[${row}]=${state.data[row]?.length}`);
                        }
                    });

                    if(dataChangedInState || structureActuallyChanged) {
                        state.lastUpdated = new Date();
                        state.hasUnsavedChanges = true;
                        // track deltas for sync
                        state.pendingUpdates.push(...validUpdatesForPotentialChange);
                    }
                });
            },

            setData: (newData) => {
                set(state => {
                    state.data = newData;
                    state.lastUpdated = new Date();
                    state.error = null;
                    state.hasUnsavedChanges = true;
                });
            },

            saveData: async (rowsToSave?: DataRow[]) => {
                // mark syncing
                set((state) => { state.syncStatus = 'syncing'; state.syncError = null; });
                // decide full replace vs delta
                if (rowsToSave) {
                    await dataService.replaceAllData(rowsToSave);
                } else if (get().pendingUpdates.length > 0) {
                    await dataService.applyBulkUpdates(get().pendingUpdates);
                } else {
                    // nothing to sync
                    set((state) => {
                        state.syncStatus = 'idle';
                    });
                    return;
                }
                try {
                    // clear pending and update meta
                    set((state) => {
                        state.error = null;
                        state.lastUpdated = new Date();
                        state.hasUnsavedChanges = false;
                        state.syncStatus = 'idle';
                        state.lastSyncedAtSync = new Date();
                        state.pendingUpdates = [];
                    });
                } catch (error: any) {
                    console.error("Failed to explicitly save data:", error);
                    set(state => {
                        state.error = { message: error.message || "Failed to save data during explicit save", source: "saveData", originalError: error };
                        state.syncStatus = 'error';
                        state.syncError = error.message;
                    });
                    throw error;
                }
            },

            addRow: async (index?) => {
                return await get().addRows(index !== undefined ? [index] : [get().data.length]);
            },

            addRows: async (indices: number[]) => {
                if (!indices || indices.length === 0) return;
                
                const sortedIndices = [...indices].sort((a, b) => b - a);
                const oldData = get().data;
                
                set((state) => {
                    const colCount = state.data.length > 0 ? (state.data[0]?.length ?? 0) : 0;
                    const newRow = Array(colCount).fill("");
                    const updatedData = [...state.data];
                    
                    for (const index of sortedIndices) {
                        const rowIndex = index !== undefined ? index : updatedData.length;
                        updatedData.splice(rowIndex, 0, [...newRow]);
                    }
                    
                    state.data = updatedData;
                    state.lastUpdated = new Date();
                    state.hasUnsavedChanges = true;
                });
            },

            addColumn: async (index?) => {
                const colIndex = index !== undefined ? index : (get().data.length > 0 ? (get().data[0]?.length ?? 0) : 0);
                return await get().addColumns([colIndex]);
            },

            addColumns: async (indices: number[]) => {
                if (!indices || indices.length === 0) return;
                
                const sortedIndices = [...indices].sort((a, b) => b - a);
                
                set((state) => {
                    state.data = state.data.map(row => {
                        const newRow = [...row];
                        for (const colIndex of sortedIndices) {
                            const columnIndex = colIndex !== undefined ? colIndex : newRow.length;
                            newRow.splice(columnIndex, 0, "");
                        }
                        return newRow;
                    });
                    
                    state.lastUpdated = new Date();
                    state.hasUnsavedChanges = true;
                });
            },

            deleteRow: async (index: number) => {
                return await get().deleteRows([index]);
            },

            deleteRows: async (indices: number[]) => {
                if (!indices || indices.length === 0) return;
                
                const oldData = get().data;
                
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
                
                const sortedIndices = [...indices].sort((a, b) => b - a);
                
                set((state) => {
                    const updatedData = [...state.data];
                    
                    for (const index of sortedIndices) {
                        updatedData.splice(index, 1);
                    }
                    
                    state.data = updatedData;
                    state.lastUpdated = new Date();
                    state.hasUnsavedChanges = true;
                });
            },

            deleteColumn: async (index: number) => {
                return await get().deleteColumns([index]);
            },

            deleteColumns: async (indices: number[]) => {
                if (!indices || indices.length === 0) return;
                
                const oldData = get().data;
                
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
                
                const sortedIndices = [...indices].sort((a, b) => b - a);
                
                set((state) => {
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
                    state.hasUnsavedChanges = true;
                });
            },

            sortData: async (columnIndex: number, direction: 'asc' | 'desc') => {
                const oldData = get().data;
                if (oldData.length === 0) return;
                
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
                    state.hasUnsavedChanges = true;
                });
            },

            getVariableData: async (variable: Variable) => {
                if (get().data.length === 0 && !get().isLoading) { await get().loadData(); }
                const currentData = get().data;
                const { columnIndex } = variable;
                if (columnIndex < 0) return { variable, data: [] };
                
                try {
                    const { columnData } = await dataService.getColumnData(columnIndex);
                    return { variable, data: columnData };
                } catch (error) {
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

                if (targetColIndex > currentMaxCol) {
                    set((state) => {
                        const maxRowIndex = state.data.length > 0 ? state.data.length - 1 : 0;
                        _ensureMatrixDimensionsInternal(state, maxRowIndex, targetColIndex);
                    });
                }
            },
        }))
    )
);