// /stores/useDataStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import db from "@/lib/db";
import { Variable } from "@/types/Variable";

export type DataRow = (string | number)[];
export type CellUpdate = { row: number; col: number; value: string | number };
export type DataStoreError = {
    message: string;
    source: string;
    originalError?: any;
};
type CellPrimaryKey = [number, number]; // [col, row]

export interface DataStoreState {
    data: DataRow[];
    isLoading: boolean;
    error: DataStoreError | null;
    lastUpdated: Date | null;

    setData: (data: DataRow[]) => void;
    loadData: () => Promise<void>;
    resetData: () => Promise<void>;
    ensureMatrixDimensions: (maxRow: number, maxCol: number, minColCount?: number) => void;

    updateCell: (row: number, col: number, value: string | number) => Promise<void>;
    updateBulkCells: (updates: CellUpdate[]) => Promise<void>;

    setDataAndSync: (newData: DataRow[]) => Promise<void>;
    applyDiffAndSync: (newData: DataRow[], oldData: DataRow[]) => Promise<void>;
    saveData: () => Promise<void>;

    addRow: (index?: number) => Promise<void>;
    addColumn: (index?: number) => Promise<void>;
    deleteRow: (index: number) => Promise<void>;
    deleteColumn: (index: number) => Promise<void>;
    sortData: (columnIndex: number, direction: 'asc' | 'desc') => Promise<void>;
    swapRows: (row1: number, row2: number) => Promise<void>;
    swapColumns: (col1: number, col2: number) => Promise<void>;

    getVariableData: (variable: Variable) => Promise<{ variable: Variable, data: (string | number)[] }>;
    validateVariableData: (columnIndex: number, type: string, width: number) => Promise<{
        isValid: boolean;
        issues: Array<{ row: number; message: string }>
    }>;
}

export const useDataStore = create<DataStoreState>()(
    devtools(
        immer((set, get) => ({
            data: [],
            isLoading: false,
            error: null,
            lastUpdated: null,

            setData: (data: DataRow[]) => set(state => {
                state.data = data;
                state.lastUpdated = new Date();
            }),

            loadData: async () => {
                set((state) => { state.isLoading = true; state.error = null; });
                try {
                    const allCells = await db.cells.toArray();
                    if (allCells.length === 0) {
                        set((state) => { state.data = []; state.lastUpdated = new Date(); state.isLoading = false; });
                        return;
                    }
                    let maxRow = -1; let maxCol = -1;
                    allCells.forEach(cell => {
                        if (cell.row > maxRow) maxRow = cell.row;
                        if (cell.col > maxCol) maxCol = cell.col;
                    });
                    const numRows = maxRow + 1; const numCols = maxCol + 1;
                    const newData: DataRow[] = Array.from({ length: numRows }, () => Array(numCols).fill(""));
                    allCells.forEach((cell) => {
                        if (cell.row < numRows && cell.col < numCols) {
                            newData[cell.row][cell.col] = cell.value;
                        }
                    });
                    set((state) => {
                        state.data = newData; state.lastUpdated = new Date(); state.isLoading = false;
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
                    await db.cells.clear();
                    set((state) => { state.data = []; state.lastUpdated = new Date(); state.error = null; });
                } catch (error: any) {
                    console.error("Failed to reset data:", error);
                    set((state) => { state.error = { message: error.message || "Error resetting data", source: "resetData", originalError: error }; });
                }
            },

            ensureMatrixDimensions: (maxRow, maxCol, minColCount) => {
                set((state) => {
                    const effectiveMaxCol = minColCount !== undefined ? Math.max(maxCol, minColCount - 1) : maxCol;
                    const currentRows = state.data?.length || 0;
                    const currentCols = currentRows > 0 ? (state.data[0]?.length || 0) : 0;
                    if (maxRow < currentRows && effectiveMaxCol < currentCols) return;
                    let structureChanged = false;
                    if (currentRows === 0) {
                        if (maxRow >= 0 || effectiveMaxCol >= 0) {
                            const rowsCount = maxRow + 1; const colsCount = effectiveMaxCol + 1;
                            state.data = Array.from({ length: rowsCount }, () => Array(colsCount).fill(""));
                            structureChanged = true;
                        } else { return; }
                    } else {
                        if (maxRow >= currentRows) {
                            const targetCols = Math.max(currentCols, effectiveMaxCol + 1);
                            for (let i = currentRows; i <= maxRow; i++) { state.data.push(Array(targetCols).fill("")); }
                            structureChanged = true;
                        }
                        const checkRows = state.data.length; const checkCols = checkRows > 0 ? (state.data[0]?.length || 0) : 0;
                        if (effectiveMaxCol >= checkCols) {
                            const additionalColsCount = effectiveMaxCol + 1 - checkCols;
                            if (additionalColsCount > 0) {
                                for (let i = 0; i < checkRows; i++) {
                                    if(state.data[i]) { state.data[i].push(...Array(additionalColsCount).fill("")); }
                                    else { state.data[i] = Array(effectiveMaxCol + 1).fill(""); }
                                }
                                structureChanged = true;
                            }
                        }
                    }
                    if (structureChanged) { state.lastUpdated = new Date(); }
                });
            },

            updateCell: async (row, col, value) => {
                const currentData = get().data;
                if (row < currentData.length && col < (currentData[0]?.length ?? 0) && currentData[row][col] === value) return;
                if (!(row < currentData.length && col < (currentData[0]?.length ?? 0)) && value === "") return;

                const oldData = get().data;
                let dataChanged = false;
                set((state) => {
                    const minCols = state.data.length > 0 ? state.data[0]?.length ?? 0 : 0;
                    get().ensureMatrixDimensions(row, col, minCols);
                    if(state.data[row]?.[col] !== value) {
                        state.data[row][col] = value; state.lastUpdated = new Date(); dataChanged = true;
                    }
                });
                if (!dataChanged) return;
                try {
                    if (value === "" || value === null || value === undefined) await db.cells.where({ row, col }).delete();
                    else await db.cells.put({ row, col, value });
                } catch (error: any) {
                    console.error(`Failed to update cell (${row}, ${col}) in database:`, error);
                    set((state) => {
                        state.data = oldData;
                        state.error = { message: "Failed to update cell in database", source: "updateCell", originalError: error };
                    });
                }
            },

            updateBulkCells: async (updates) => {
                const oldData = get().data;
                const validUpdates = updates.filter(({ row, col, value }) => {
                    const currentValue = oldData[row]?.[col]; return currentValue !== value || currentValue === undefined;
                });
                if (validUpdates.length === 0) return;
                let maxRow = -1; let maxCol = -1;
                validUpdates.forEach(({ row, col }) => { if (row > maxRow) maxRow = row; if (col > maxCol) maxCol = col; });
                let dataChanged = false;
                set((state) => {
                    const minCols = state.data.length > 0 ? state.data[0]?.length ?? 0 : 0;
                    get().ensureMatrixDimensions(maxRow, maxCol, minCols);
                    validUpdates.forEach(({ row, col, value }) => {
                        if(state.data[row]?.[col] !== value) { state.data[row][col] = value; dataChanged = true; }
                    });
                    if(dataChanged) state.lastUpdated = new Date();
                });
                if (!dataChanged) return;
                const cellsToPut = validUpdates.filter(({ value }) => value !== "" && value !== null && value !== undefined);
                const keysToDelete = validUpdates.filter(({ value }) => value === "" || value === null || value === undefined).map(({ row, col }) => [col, row] as CellPrimaryKey);
                if (cellsToPut.length > 0 || keysToDelete.length > 0) {
                    try {
                        await db.transaction('rw', db.cells, async () => {
                            if (keysToDelete.length > 0) await db.cells.bulkDelete(keysToDelete);
                            if (cellsToPut.length > 0) await db.cells.bulkPut(cellsToPut);
                        });
                        set(state => { state.error = null; });
                    } catch (error: any) {
                        console.error("Bulk update failed:", error);
                        set((state) => {
                            state.data = oldData;
                            state.error = { message: "Bulk update failed", source: "updateBulkCells", originalError: error };
                        });
                    }
                }
            },

            setDataAndSync: async (newData) => {
                set(state => {
                    state.data = newData;
                    state.lastUpdated = new Date();
                    state.error = null;
                });

                try {
                    await db.transaction('rw', db.cells, async () => {
                        await db.cells.clear();
                        const cellsToPut: Array<{ row: number, col: number, value: string | number }> = [];
                        for (let row = 0; row < newData.length; row++) {
                            for (let col = 0; col < (newData[row]?.length ?? 0); col++) {
                                const value = newData[row][col];
                                if (value !== "" && value !== null && value !== undefined) {
                                    cellsToPut.push({ row, col, value });
                                }
                            }
                        }
                        if (cellsToPut.length > 0) {
                            await db.cells.bulkPut(cellsToPut);
                        }
                    });
                } catch (error: any) {
                    console.error("Failed to sync data (replace approach):", error);
                    set((state) => {
                        state.error = { message: "Failed to sync data (replace)", source: "setDataAndSync", originalError: error };
                    });
                    await get().loadData();
                }
            },

            applyDiffAndSync: async (newData, oldData) => {
                const cellsToPut: Array<{ row: number, col: number, value: string | number }> = [];
                const keysToDelete: CellPrimaryKey[] = [];
                const maxRows = Math.max(oldData.length, newData.length);
                const oldRowLengths = oldData.map(r => r?.length ?? 0);
                const newRowLengths = newData.map(r => r?.length ?? 0);

                for (let r = 0; r < maxRows; r++) {
                    const oldLength = oldRowLengths[r] ?? 0;
                    const newLength = newRowLengths[r] ?? 0;
                    const maxCols = Math.max(oldLength, newLength);
                    for (let c = 0; c < maxCols; c++) {
                        const oldValue = oldData[r]?.[c] ?? "";
                        const newValue = newData[r]?.[c] ?? "";

                        if (oldValue !== newValue) {
                            if (newValue !== "") {
                                cellsToPut.push({ row: r, col: c, value: newValue });
                            } else if (oldValue !== "") {
                                keysToDelete.push([c, r]);
                            }
                        }
                    }
                }

                if (cellsToPut.length > 0 || keysToDelete.length > 0) {
                    try {
                        await db.transaction('rw', db.cells, async () => {
                            if (keysToDelete.length > 0) await db.cells.bulkDelete(keysToDelete);
                            if (cellsToPut.length > 0) await db.cells.bulkPut(cellsToPut);
                        });
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
                    await db.transaction('rw', db.cells, async () => {
                        await db.cells.clear();
                        const cellsToPut: Array<{ row: number, col: number, value: string | number }> = [];
                        for (let row = 0; row < currentData.length; row++) {
                            for (let col = 0; col < (currentData[row]?.length ?? 0); col++) {
                                const value = currentData[row][col];
                                if (value !== "" && value !== null && value !== undefined) {
                                    cellsToPut.push({ row, col, value });
                                }
                            }
                        }
                        if (cellsToPut.length > 0) {
                            await db.cells.bulkPut(cellsToPut);
                        }
                    });
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
                let finalData: DataRow[] = [];
                set((state) => {
                    const rowIndex = index !== undefined ? index : state.data.length;
                    const colCount = state.data.length > 0 ? (state.data[0]?.length ?? 0) : 0;
                    const newRow = Array(colCount).fill("");
                    const updatedData = [...state.data];
                    updatedData.splice(rowIndex, 0, newRow);
                    state.data = updatedData;
                    state.lastUpdated = new Date();
                    finalData = state.data;
                });
                await get().applyDiffAndSync(finalData, oldData);
            },

            addColumn: async (index?) => {
                const oldData = get().data;
                let finalData: DataRow[] = [];
                set((state) => {
                    const colIndex = index !== undefined ? index : (state.data.length > 0 ? (state.data[0]?.length ?? 0) : 0);
                    state.data = state.data.map(row => {
                        const newRow = [...row];
                        newRow.splice(colIndex, 0, "");
                        return newRow;
                    });
                    state.lastUpdated = new Date();
                    finalData = state.data;
                });
                await get().applyDiffAndSync(finalData, oldData);
            },

            deleteRow: async (index: number) => {
                const oldData = get().data;
                if (index < 0 || index >= oldData.length) { set(state => { state.error = { message: "Invalid row index", source: "deleteRow" }; }); return; }
                let finalData: DataRow[] = [];
                set((state) => {
                    const updatedData = [...state.data];
                    updatedData.splice(index, 1);
                    state.data = updatedData;
                    state.lastUpdated = new Date();
                    finalData = state.data;
                });
                await get().applyDiffAndSync(finalData, oldData);
            },

            deleteColumn: async (index: number) => {
                const oldData = get().data;
                if (oldData.length === 0 || index < 0 || index >= (oldData[0]?.length ?? 0)) { set(state => { state.error = { message: "Invalid column index", source: "deleteColumn" }; }); return; }
                let finalData: DataRow[] = [];
                set((state) => {
                    state.data = state.data.map(row => {
                        const newRow = [...row];
                        newRow.splice(index, 1);
                        return newRow;
                    });
                    state.lastUpdated = new Date();
                    finalData = state.data;
                });
                await get().applyDiffAndSync(finalData, oldData);
            },

            sortData: async (columnIndex: number, direction: 'asc' | 'desc') => {
                const oldData = get().data;
                if (oldData.length === 0) return;
                let finalData: DataRow[] = [];
                set(state => {
                    const rowsToSort = [...state.data];
                    rowsToSort.sort((rowA, rowB) => {
                        const valueA = columnIndex < (rowA?.length ?? 0) ? rowA[columnIndex] : "";
                        const valueB = columnIndex < (rowB?.length ?? 0) ? rowB[columnIndex] : "";
                        const isANumeric = typeof valueA === 'number' || (typeof valueA === 'string' && valueA !== "" && !isNaN(Number(valueA)));
                        const isBNumeric = typeof valueB === 'number' || (typeof valueB === 'string' && valueB !== "" && !isNaN(Number(valueB)));
                        if (isANumeric && isBNumeric) {
                            const numA = typeof valueA === 'number' ? valueA : Number(valueA); const numB = typeof valueB === 'number' ? valueB : Number(valueB);
                            return direction === 'asc' ? numA - numB : numB - numA;
                        }
                        if (isANumeric && !isBNumeric) return direction === 'asc' ? -1 : 1;
                        if (!isANumeric && isBNumeric) return direction === 'asc' ? 1 : -1;
                        const strA = String(valueA ?? '').toLowerCase(); const strB = String(valueB ?? '').toLowerCase();
                        return direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
                    });
                    state.data = rowsToSort;
                    state.lastUpdated = new Date();
                    finalData = state.data;
                });
                await get().applyDiffAndSync(finalData, oldData);
            },

            swapRows: async (row1: number, row2: number) => {
                const oldData = get().data;
                if (row1 < 0 || row2 < 0 || row1 >= oldData.length || row2 >= oldData.length || row1 === row2) { set(state => { state.error = { message: "Invalid row indices for swapping", source: "swapRows" }; }); return; }
                let finalData: DataRow[] = [];
                set((state) => {
                    const updatedData = [...state.data];
                    [updatedData[row1], updatedData[row2]] = [updatedData[row2], updatedData[row1]];
                    state.data = updatedData;
                    state.lastUpdated = new Date();
                    finalData = state.data;
                });
                await get().applyDiffAndSync(finalData, oldData);
            },

            swapColumns: async (col1: number, col2: number) => {
                const oldData = get().data;
                if (oldData.length === 0) return;
                const colCount = oldData[0]?.length ?? 0;
                if (col1 < 0 || col2 < 0 || col1 >= colCount || col2 >= colCount || col1 === col2) { set(state => { state.error = { message: "Invalid column indices for swapping", source: "swapColumns" }; }); return; }
                let finalData: DataRow[] = [];
                set((state) => {
                    state.data = state.data.map(row => {
                        const newRow = [...row];
                        [newRow[col1], newRow[col2]] = [newRow[col2], newRow[col1]];
                        return newRow;
                    });
                    state.lastUpdated = new Date();
                    finalData = state.data;
                });
                await get().applyDiffAndSync(finalData, oldData);
            },

            getVariableData: async (variable: Variable) => {
                if (get().data.length === 0 && !get().isLoading) { await get().loadData(); }
                const currentData = get().data;
                const { columnIndex } = variable;
                if (columnIndex < 0) return { variable, data: [] };
                const columnData = currentData.map(row => (row && columnIndex < row.length) ? row[columnIndex] : "" );
                return { variable, data: columnData };
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
                if (updates.length > 0) await get().updateBulkCells(updates);
                return { isValid, issues };
            },

        }))
    )
);