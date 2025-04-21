import React, { useRef, useCallback, useEffect } from 'react';
import Handsontable from 'handsontable';
import { HotTableClass } from '@handsontable/react';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { Variable } from '@/types/Variable';
import { areValuesEqual } from './utils';

interface PendingOperation {
    type: string;
    payload: any;
}

interface UseTableUpdatesProps {
    hotTableRef: React.RefObject<HotTableClass | null>;
    actualNumRows: number;
    actualNumCols: number;
    // No need for visual/display dims here, only actual for state updates
}

/**
 * Custom hook to manage data updates, pending operations queue, and Handsontable change events.
 */
export const useTableUpdates = ({
    hotTableRef,
    actualNumRows,
    actualNumCols
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
        updateBulkCells,
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
                await updateBulkCells(cellUpdates);

                if (maxColIndex > -1) {
                    console.log(`[processCellUpdates] Calling ensureCompleteVariables up to index: ${maxColIndex}`);
                    await ensureCompleteVariables(maxColIndex);
                }

            } catch (error) {
                console.error('Failed to update bulk cells or ensure variables:', error);
                // TODO: Add user feedback
            }
        }
    }, [variables, updateBulkCells, ensureCompleteVariables]); // Dependencies: variables for type checking, store actions

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
    }, [processCellUpdates, addRow, addMultipleVariables]); // Update dependencies

    // --- Handsontable Event Handlers ---

    const handleBeforeChange = useCallback(( // --- Modified handleBeforeChange ---
        changes: (Handsontable.CellChange | null)[],
        source: Handsontable.ChangeSource
    ): boolean | void => {
        if (source === 'loadData' || !changes) {
            return true; // Allow initial load
        }

        // Filter out null changes and changes that don't actually modify the value
        // or are just clearing spare cells (which shouldn't trigger add row/col)
        const validChanges = changes.filter((change): change is Handsontable.CellChange => {
            if (!change) return false;
            const [, , oldValue, newValue] = change;
            const isEffectivelyClearingSpare = (oldValue === null || oldValue === undefined || oldValue === '') &&
                                            (newValue === null || newValue === undefined || newValue === '');
            return !areValuesEqual(oldValue, newValue) && !isEffectivelyClearingSpare;
        });


        if (validChanges.length === 0) {
            return false; // Prevent the change if no meaningful modifications
        }

        let maxModifiedRow = -1;
        let maxModifiedCol = -1;
        let isAddingRow = false;
        let isAddingCol = false;

        validChanges.forEach((change) => {
            const [row, col] = change;
            if (typeof col !== 'number' || typeof row !== 'number') return;

            maxModifiedRow = Math.max(maxModifiedRow, row);
            maxModifiedCol = Math.max(maxModifiedCol, col);

            // Check if edit occurs IN the spare row/column (index === actual size)
            if (row === actualNumRows) {
                isAddingRow = true;
            }
            if (col === actualNumCols) {
                isAddingCol = true;
            }
        });

        // Calculate target state dimensions based on *current* actual size
        const currentActualRows = actualNumRows;
        const currentActualCols = actualNumCols;
        let targetStateRows = currentActualRows;
        let targetStateCols = currentActualCols;

        const basePayload = { changes: validChanges }; // No target state here yet

        let newVariables: Partial<Variable>[] = []; // Initialize here
        if (isAddingRow && isAddingCol) {
            targetStateRows = currentActualRows + 1;
            targetStateCols = Math.max(currentActualCols + 1, maxModifiedCol + 1); // Ensure target covers max col
            // Create variables for all new columns from currentActualCols up to maxModifiedCol
            for (let i = currentActualCols; i <= maxModifiedCol; i++) {
                let inferredType: Variable['type'] = 'NUMERIC'; // Default to NUMERIC
                let maxLength = 0;
                const changesForCol = validChanges.filter(change => change[1] === i && change[3] !== null && change[3] !== undefined && change[3] !== '');
                if (changesForCol.length > 0) {
                     if (changesForCol.some(change => isNaN(Number(String(change[3]).replace(/,/g, ''))))) {
                        inferredType = 'STRING';
                        maxLength = changesForCol.reduce((max, change) => Math.max(max, String(change[3]).length), 0);
                     } else {
                        // Still numeric, maxLength remains 0 (or could calculate max numeric width if needed)
                     }
                } else {
                    // No changes for this new column in this batch, default type remains NUMERIC
                }

                const characterLimit = (inferredType === 'STRING') ? Math.max(maxLength, 8) : 8; // Calculate character limit (width)
                const visualWidth = 64; // Default visual width (columns)

                const tempVar: Partial<Variable> = {
                    name: `var${i + 1}`, 
                    type: inferredType,
                    columnIndex: i,
                    width: characterLimit, // Character limit
                    columns: visualWidth, // Visual cell width (default)
                    decimals: (inferredType === 'NUMERIC' ? 2 : 0), 
                    values: [], missing: null, 
                    align: (inferredType === 'STRING' ? 'left' : 'right'), 
                    measure: 'nominal', role: 'input'
                };
                newVariables.push(tempVar);
            }
            pendingOperations.current.push({
                type: 'ADD_ROW_COL_AND_UPDATE',
                payload: { ...basePayload, newActualRows: targetStateRows, newActualCols: targetStateCols, newVariables }
            });
        } else if (isAddingRow) {
            targetStateRows = currentActualRows + 1;
            targetStateCols = Math.max(currentActualCols, maxModifiedCol + 1);
            // No new variables created here, only row added
            pendingOperations.current.push({
                type: 'ADD_ROW_AND_UPDATE',
                payload: { ...basePayload, newActualRows: targetStateRows, newActualCols: targetStateCols }
            });
        } else if (isAddingCol) {
            targetStateRows = Math.max(currentActualRows, maxModifiedRow + 1);
            targetStateCols = Math.max(currentActualCols + 1, maxModifiedCol + 1); // Ensure target covers max col
            // Create variables for all new columns from currentActualCols up to maxModifiedCol
             for (let i = currentActualCols; i <= maxModifiedCol; i++) {
                let inferredType: Variable['type'] = 'NUMERIC'; // Default to NUMERIC
                let maxLength = 0;
                const changesForCol = validChanges.filter(change => change[1] === i && change[3] !== null && change[3] !== undefined && change[3] !== '');
                if (changesForCol.length > 0) {
                     if (changesForCol.some(change => isNaN(Number(String(change[3]).replace(/,/g, ''))))) {
                        inferredType = 'STRING';
                        maxLength = changesForCol.reduce((max, change) => Math.max(max, String(change[3]).length), 0);
                     } else {
                        // Numeric
                     }
                } else {
                     // No changes
                }
                const characterLimit = (inferredType === 'STRING') ? Math.max(maxLength, 8) : 8;
                const visualWidth = 64;
                const tempVar: Partial<Variable> = {
                    name: `var${i + 1}`, 
                    type: inferredType,
                    columnIndex: i,
                    width: characterLimit, // Character limit
                    columns: visualWidth, // Visual cell width (default)
                    decimals: (inferredType === 'NUMERIC' ? 2 : 0), 
                    values: [], missing: null, 
                    align: (inferredType === 'STRING' ? 'left' : 'right'), 
                    measure: 'nominal', role: 'input'
                };
                newVariables.push(tempVar);
            }
            pendingOperations.current.push({
                type: 'ADD_COL_AND_UPDATE',
                payload: { ...basePayload, newActualRows: targetStateRows, newActualCols: targetStateCols, newVariables }
            });
        } else {
             // Standard update within existing actual bounds or jumping over spare cols
             targetStateRows = Math.max(currentActualRows, maxModifiedRow + 1);
             targetStateCols = Math.max(currentActualCols, maxModifiedCol + 1);

             // Check if standard update implicitly requires new columns beyond the current actual ones
             if (targetStateCols > currentActualCols) {
                 newVariables = []; 
                 for (let i = currentActualCols; i < targetStateCols; i++) {
                    let inferredType: Variable['type'] = 'NUMERIC'; // Default to NUMERIC
                    let maxLength = 0;
                    const changesForCol = validChanges.filter(change => change[1] === i && change[3] !== null && change[3] !== undefined && change[3] !== '');
                    if (changesForCol.length > 0) {
                        if (changesForCol.some(change => isNaN(Number(String(change[3]).replace(/,/g, ''))))) {
                            inferredType = 'STRING';
                            maxLength = changesForCol.reduce((max, change) => Math.max(max, String(change[3]).length), 0);
                        } else {
                            // Numeric
                        }
                    } else {
                        // No changes
                    }
                    const characterLimit = (inferredType === 'STRING') ? Math.max(maxLength, 8) : 8;
                    const visualWidth = 64;
                     const tempVar: Partial<Variable> = {
                         name: `var${i + 1}`,
                         type: inferredType,
                         columnIndex: i,
                         width: characterLimit, // Character limit
                         columns: visualWidth, // Visual cell width (default)
                        decimals: (inferredType === 'NUMERIC' ? 2 : 0), 
                        values: [], missing: null, 
                        align: (inferredType === 'STRING' ? 'left' : 'right'), 
                        measure: 'nominal', role: 'input'
                     };
                     newVariables.push(tempVar);
                 }
                 // Add variables first if needed for update operation
                 if (newVariables.length > 0) {
                    pendingOperations.current.push({
                        type: 'ADD_COLS_IMPLICIT',
                        payload: { newVariables }
                    });
                 }
             }

             // Always queue the cell update itself
             pendingOperations.current.push({
                 type: 'UPDATE_CELLS',
                 payload: { ...basePayload, targetStateRows, targetStateCols }
             });
        }

        // Trigger processing if not already running
        if (!isProcessing.current) {
            queueMicrotask(processPendingOperations);
        }

        // IMPORTANT: Prevent Handsontable's default change mechanism
        // We handle all state updates asynchronously via the queue
        return false;

    }, [actualNumRows, actualNumCols, processPendingOperations]); // Dependencies: dimensions, process function

    // Placeholder handlers for other events if needed later
    const handleAfterCreateRow = useCallback((index: number, amount: number, source?: Handsontable.ChangeSource) => {
        console.log('After Create Row', { index, amount, source });
        // May need logic if external actions can create rows
    }, []);

    const handleAfterCreateCol = useCallback((index: number, amount: number, source?: Handsontable.ChangeSource) => {
        console.log('After Create Col', { index, amount, source });
        // May need logic if external actions can create cols
    }, []);

    const handleAfterRemoveRow = useCallback((index: number, amount: number, physicalRows: number[], source?: Handsontable.ChangeSource) => {
        console.log('After Remove Row', { index, amount, physicalRows, source });
        // This should ideally be handled by the context menu logic calling deleteRow directly
    }, []);

    const handleAfterRemoveCol = useCallback((index: number, amount: number, physicalCols: number[], source?: Handsontable.ChangeSource) => {
        console.log('After Remove Col', { index, amount, physicalCols, source });
        // This should ideally be handled by the context menu logic calling deleteColumn directly
    }, []);

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