import React, { useRef, useCallback, useEffect } from 'react';
import Handsontable from 'handsontable';
import { HotTableClass } from '@handsontable/react';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { Variable, VariableAlign } from '@/types/Variable';
import { areValuesEqual } from '../utils/utils';

// Define our own specific column configuration type
interface ColumnConfig {
    data: number;
    type: string;
    readOnly: boolean;
    className: string;
    width: number;
    validator?: (value: any, callback: (isValid: boolean) => void) => void; // Make validator optional
}

interface PendingOperation {
    type: string;
    payload: any;
}

interface UseTableUpdatesProps {
    hotTableRef: React.RefObject<HotTableClass | null>;
    actualNumRows: number;
    actualNumCols: number;
    columns: ReadonlyArray<ColumnConfig>; // Use our defined interface
}

/**
 * Custom hook to manage data updates, pending operations queue, and Handsontable change events.
 */
export const useTableUpdates = ({
    hotTableRef,
    actualNumRows,
    actualNumCols,
    columns
}: UseTableUpdatesProps) => {
    const pendingOperations = useRef<PendingOperation[]>([]);
    const isProcessing = useRef(false);

    // Zustand store access
    const {
        data,
        addRow,
        addColumn,
        deleteRow,
        deleteColumn,
        updateCells,
    } = useDataStore();

    const {
        variables,
        addVariable,
        deleteVariable,
        updateVariable,
        addMultipleVariables,
        ensureCompleteVariables
    } = useVariableStore();

    // --- Core Update Logic ---

    const processCellUpdates = useCallback(async (updatePayload: {
        changes: Handsontable.CellChange[],
        targetStateRows: number,
        targetStateCols: number
    }) => {
        const { changes, targetStateRows, targetStateCols } = updatePayload;

        const cellUpdates: { row: number; col: number; value: any }[] = [];
        let maxColIndex = -1;

        for (const change of changes) {
            if (!change) continue;
            const [row, col, oldValue, newValue] = change;
            const columnIndex = typeof col === 'number' ? col : -1;
            const rowIndex = typeof row === 'number' ? row : -1;

            if (columnIndex === -1 || rowIndex === -1) continue;

            if (areValuesEqual(oldValue, newValue)) continue;

            const variable = variables.find(v => v.columnIndex === columnIndex);
            let processedValue = newValue;

            // --- Value processing based on variable type ---
            if (variable) {
                switch (variable.type) {
                    case 'NUMERIC':
                        if (newValue === '' || newValue === null || newValue === undefined) {
                            processedValue = '';
                        } else {
                            // Remove commas before converting to number
                            const valueString = String(newValue).replace(/,/g, '');
                            if (!isNaN(Number(valueString))) {
                                processedValue = Number(valueString);
                            } else {
                                console.warn(`Invalid numeric value skipped: Row ${row}, Col ${columnIndex}, Value: ${newValue}`);
                                continue; // Skip this update
                            }
                        }
                        break;
                    case 'STRING':
                        processedValue = (newValue === null || newValue === undefined) ? '' : String(newValue);
                        // Truncate string if its length exceeds the defined character limit (width)
                        if (variable.width > 0 && processedValue.length > variable.width) {
                            processedValue = processedValue.substring(0, variable.width);
                            console.warn(`Truncated string in Row ${row}, Col ${columnIndex} to fit width ${variable.width}`);
                        }
                        break;
                    case 'DATE':
                        processedValue = (newValue === '' || newValue === null || newValue === undefined) ? '' : newValue;
                        break;
                    default:
                        processedValue = (newValue === null || newValue === undefined) ? '' : String(newValue);
                }
            } else {
                // Default for columns without a defined variable (e.g., newly created spare)
                processedValue = (newValue === null || newValue === undefined) ? '' : String(newValue);
            }
            // --- End Value processing ---

            cellUpdates.push({ row: rowIndex, col: columnIndex, value: processedValue });
            maxColIndex = Math.max(maxColIndex, columnIndex);
        }

        if (cellUpdates.length > 0) {
            try {
                await updateCells(cellUpdates);

                if (maxColIndex > -1) {
                    console.log(`[processCellUpdates] Calling ensureCompleteVariables up to index: ${maxColIndex}`);
                    await ensureCompleteVariables(maxColIndex);
                }

            } catch (error) {
                console.error('Failed to update bulk cells or ensure variables:', error);
                // TODO: Add user feedback
            }
        }
    }, [variables, updateCells, ensureCompleteVariables]);

    const processPendingOperations = useCallback(async () => {
        if (isProcessing.current || pendingOperations.current.length === 0) return;
        isProcessing.current = true;

        const operation = pendingOperations.current.shift();
        if (!operation) {
            console.error("Shifted operation is undefined");
            isProcessing.current = false;
            return;
        }

        try {
            console.log("Processing operation:", operation.type, operation.payload);
            switch (operation.type) {
                case 'ADD_ROW_AND_UPDATE': {
                    const { changes, newActualRows, newActualCols } = operation.payload;
                    await addRow(); // Only add row data
                    // Variables are not added here, ensureMatrixDimensions handles cols
                    await processCellUpdates({ changes, targetStateRows: newActualRows, targetStateCols: newActualCols });
                    break;
                }
                case 'ADD_COL_AND_UPDATE': {
                    const { changes, newActualRows, newActualCols, newVariables } = operation.payload;
                    // Add multiple variables first
                    if (newVariables && newVariables.length > 0) {
                        await addMultipleVariables(newVariables);
                    }
                    // Then process cell updates (which includes ensureMatrixDimensions for data cols)
                    await processCellUpdates({ changes, targetStateRows: newActualRows, targetStateCols: newActualCols });
                    break;
                }
                case 'ADD_ROW_COL_AND_UPDATE': {
                    const { changes, newActualRows, newActualCols, newVariables } = operation.payload;
                    await addRow(); // Add row data
                    // Add multiple variables
                    if (newVariables && newVariables.length > 0) {
                        await addMultipleVariables(newVariables);
                    }
                    // Then process cell updates (which includes ensureMatrixDimensions for data cols)
                    await processCellUpdates({ changes, targetStateRows: newActualRows, targetStateCols: newActualCols });
                    break;
                }
                case 'UPDATE_CELLS': {
                    const { changes, targetStateRows, targetStateCols } = operation.payload;
                    await processCellUpdates({ changes, targetStateRows, targetStateCols });
                    break;
                }
                case 'ADD_COLS_IMPLICIT': { // Handle implicit column addition
                    const { newVariables } = operation.payload;
                    if (newVariables && newVariables.length > 0) {
                        await addMultipleVariables(newVariables);
                    }
                    break;
                }
                default:
                    console.warn(`Unknown operation type: ${operation.type}`);
            }
        } catch (error) {
            console.error('Error processing operation:', error, operation);
             // TODO: Add user feedback
        } finally {
            isProcessing.current = false;
            // Use queueMicrotask to process next operation without blocking UI thread
            if (pendingOperations.current.length > 0) {
                queueMicrotask(processPendingOperations);
            }
        }
    }, [processCellUpdates, addRow, addMultipleVariables]); // Removed addColumn and actualNumCols

    // --- Handsontable Event Handlers ---

    const handleBeforeChange = useCallback(
        (changes: (Handsontable.CellChange | null)[], source: Handsontable.ChangeSource) => {
            // Skip initial load or no changes
            if (source === 'loadData' || !changes) return;
            // rely on Handsontable built-in validators only
        },
        []
    );

    const handleAfterCreateRow = useCallback((index: number, amount: number, source?: Handsontable.ChangeSource) => {
        console.log('After Create Row', { index, amount, source });
        // May need logic if external actions can create rows
    }, []);

    const handleAfterCreateCol = useCallback((index: number, amount: number, source?: Handsontable.ChangeSource) => {
        console.log('After Create Col', { index, amount, source });
        // Sync variable store: batch create variables
        const maxIndex = index + amount - 1;
        ensureCompleteVariables(maxIndex);
        const newVars = Array.from({ length: amount }, (_, i) => ({ columnIndex: index + i }));
        addMultipleVariables(newVars);
    }, [ensureCompleteVariables, addMultipleVariables]);

    const handleAfterRemoveRow = useCallback((index: number, amount: number, physicalRows: number[], source?: Handsontable.ChangeSource) => {
        console.log('After Remove Row', { index, amount, physicalRows, source });
        // This should ideally be handled by the context menu logic calling deleteRow directly
    }, []);

    const handleAfterRemoveCol = useCallback((index: number, amount: number, physicalCols: number[], source?: Handsontable.ChangeSource) => {
        console.log('After Remove Col', { index, amount, physicalCols, source });
        // Sync variable store: batch delete variables
        const colsToDelete = [...physicalCols].sort((a, b) => b - a);
        colsToDelete.forEach(col => deleteVariable(col));
    }, [deleteVariable]);

    const handleAfterColumnResize = useCallback((newSize: number, currentColumn: number, isDoubleClick: boolean) => {
        console.log('Column Resized', { currentColumn, newSize });

        // Use variables from the hook's closure (updated on re-render)
        // console.log('Variables available in handleAfterColumnResize (closure):', variables);

        const variable = variables.find(v => v.columnIndex === currentColumn);

        if (variable && variable.columns !== newSize) {
            console.log(`Updating variable via Column Index: ${currentColumn}, Field: 'columns', New Value: ${newSize}`);
            // Use updateVariable from the hook's closure, using columnIndex as identifier
            updateVariable(currentColumn, 'columns', newSize);
        } else {
            // Adjust log message
            console.log('Skipping variable columns update. Reason:', {
                foundVariable: !!variable,
                currentColumns: variable?.columns,
                newSize: newSize,
                sizeChanged: variable?.columns !== newSize
            });
        }
    }, [variables, updateVariable]); // Keep dependencies

     const handleAfterValidate = useCallback((isValid: boolean, value: any, row: number, prop: string | number, source: Handsontable.ChangeSource) => {
        // This can be used for fine-grained validation feedback if needed
        // console.log('Validation:', { isValid, value, row, prop, source });
    }, []);


    // Ensure the operation queue is processed when the component mounts or dependencies change
    useEffect(() => {
        // Initial check in case operations were added before effect ran
        if (pendingOperations.current.length > 0 && !isProcessing.current) {
            queueMicrotask(processPendingOperations);
        }
    }, [processPendingOperations]);


    return {
        handleBeforeChange,
        handleAfterCreateRow,
        handleAfterCreateCol,
        handleAfterRemoveRow,
        handleAfterRemoveCol,
        handleAfterColumnResize,
        handleAfterValidate,
        // Expose other necessary handlers or states if needed
    };
}; 