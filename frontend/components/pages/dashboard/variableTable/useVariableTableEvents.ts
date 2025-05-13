import { useCallback } from 'react';
import Handsontable from 'handsontable';
import { HotTableClass } from '@handsontable/react';
import { Variable, VariableType } from "@/types/Variable";
import {
    COLUMN_INDEX_TO_FIELD_MAP,
    DIALOG_TRIGGER_COLUMNS,
    COLUMN_INDEX
} from './constants';
import { PendingOperation, OperationType } from './useVariableTableUpdates'; // Assuming types are exported from here

// Define types for the arguments passed to the hook
interface UseVariableTableEventsProps {
    hotTableRef: React.RefObject<HotTableClass | null>; // Allow null for initial ref
    variables: Variable[]; // Needed for checking existence
    enqueueOperation: (operation: PendingOperation) => void; // Use the specific PendingOperation type
    openDialogForCell: (row: number, col: number) => void;
    setSelectedCell: (cell: { row: number; col: number } | null) => void; // Added to manage selection state

}

export function useVariableTableEvents({
    hotTableRef,
    variables,
    enqueueOperation,
    openDialogForCell,
    setSelectedCell
}: UseVariableTableEventsProps) {

    const handleBeforeChange = useCallback((
        changes: (Handsontable.CellChange | null)[],
        source: Handsontable.ChangeSource
    ): void | boolean => {
        if (source === "loadData" || source === "updateData" || !changes) return;

        const changesByRow: Record<number, Partial<Variable>> = {};
        let shouldPreventDefault = false;
        let cellToOpenDialog: { row: number; col: number } | null = null;

        for (const change of changes) {
            if (!change) continue;
            const [row, prop, oldValue, newValue] = change;
            if (newValue === oldValue) continue;
            if (typeof row !== "number") continue;

            let columnIndex: number | undefined;
            if (typeof prop === 'number') {
                columnIndex = prop;
            } else if (typeof prop === 'string') {
                // Ensure hotInstance exists before calling propToCol
                columnIndex = hotTableRef.current?.hotInstance?.propToCol(prop);
            } else {
                continue;
            }

            if (typeof columnIndex !== 'number') continue;

            if (DIALOG_TRIGGER_COLUMNS.includes(columnIndex)) {
                 // Prevent default editing for dialog trigger columns
                 // Only trigger dialog opening if source indicates user interaction
                if (source === 'edit' || source === 'Autofill.fill' || source === 'CopyPaste.paste') {
                    shouldPreventDefault = true;
                     // Store the first cell that triggers a dialog
                     if (!cellToOpenDialog) {
                        cellToOpenDialog = { row, col: columnIndex };
                    }
                }
            } else {
                const field = COLUMN_INDEX_TO_FIELD_MAP[columnIndex];
                if (field && typeof field === 'string') {
                    if (!changesByRow[row]) changesByRow[row] = {};
                    // Apply the change to the temporary record
                    changesByRow[row][field as keyof Variable] = newValue as any;
                }
            }
        }

        // If any change requires a dialog, prevent default and open the dialog for the first trigger cell
        if (shouldPreventDefault && cellToOpenDialog) {
            openDialogForCell(cellToOpenDialog.row, cellToOpenDialog.col);
            return false; // Prevent Handsontable from applying the change
        }

        // If no dialog trigger, proceed to enqueue update/create operations
        Object.keys(changesByRow).forEach(rowKey => {
            const row = Number(rowKey);
            const rowChanges = changesByRow[row];
            const existingVariable = variables.find(v => v.columnIndex === row);

            // --- Constraint Check ---
            let finalType = rowChanges.type ?? existingVariable?.type;
            let finalMeasure = rowChanges.measure ?? existingVariable?.measure;

            if (finalType === 'STRING' && finalMeasure === 'scale') {
                console.warn(`Constraint Applied (UI): Variable type is STRING, measure cannot be 'scale'. Setting measure to 'nominal' for row ${row}.`);
                rowChanges.measure = 'nominal'; // Force measure back to nominal
            }
            // --- End Constraint Check ---

            if (existingVariable) {
                enqueueOperation({
                    type: 'UPDATE_VARIABLE', // Ensure this matches OperationType
                    payload: { row, changes: rowChanges }
                });
            } else {
                // Apply constraint check also for new variables if type/measure are set
                 let createChanges = { ...rowChanges };
                 let createType = createChanges.type;
                 let createMeasure = createChanges.measure;
                 if (createType === 'STRING' && createMeasure === 'scale') {
                     console.warn(`Constraint Applied (UI): Variable type is STRING, measure cannot be 'scale'. Setting measure to 'nominal' for new row ${row}.`);
                     createChanges.measure = 'nominal';
                 }
                enqueueOperation({
                    type: 'CREATE_VARIABLE', // Ensure this matches OperationType
                    payload: { row, variableData: createChanges }
                });
            }
        });

        return true; // Allow Handsontable to proceed if no dialog was triggered
    }, [variables, enqueueOperation, openDialogForCell, hotTableRef]);

    const handleAfterSelectionEnd = useCallback((
        row: number, column: number, row2: number, column2: number
    ) => {
        const isSingleCell = row === row2 && column === column2;
        if (isSingleCell) {
            setSelectedCell({ row, col: column }); // Update selected cell state
            // Open dialog immediately if a dialog trigger column is selected
            if (DIALOG_TRIGGER_COLUMNS.includes(column)) {
                openDialogForCell(row, column);
            }
        } else {
            setSelectedCell(null); // Clear selection if multiple cells are selected
        }
    }, [openDialogForCell, setSelectedCell]); // Added setSelectedCell dependency

    const handleInsertVariable = useCallback(() => {
        const hotInstance = hotTableRef.current?.hotInstance;
        if (!hotInstance) return;
        const selectedRange = hotInstance.getSelectedRangeLast();
        // Use countRows() directly if selectedRange is null/undefined
        const selectedRow = selectedRange ? selectedRange.from.row : hotInstance.countRows();

        enqueueOperation({
            type: 'INSERT_VARIABLE', // Ensure this matches OperationType
            payload: { row: selectedRow }
        });
    }, [hotTableRef, enqueueOperation]);

    const handleDeleteVariable = useCallback(() => {
        const hotInstance = hotTableRef.current?.hotInstance;
        if (!hotInstance) return;
        const selectedRange = hotInstance.getSelectedRangeLast();
        if (!selectedRange) return; // Require a selection to delete

        const startRow = selectedRange.from.row;
        const endRow = selectedRange.to.row;

        // Enqueue delete operation for each selected row (from bottom up recommended for index stability if needed, but store handles it)
        for (let row = Math.max(startRow, endRow); row >= Math.min(startRow, endRow); row--) {
             // Check if variable actually exists at this index before queuing deletion
            const variableExists = variables.some(v => v.columnIndex === row);
            if (variableExists) {
                enqueueOperation({
                    type: 'DELETE_VARIABLE', // Ensure this matches OperationType
                    payload: { row }
                });
             } else {
                 console.warn(`Attempted to delete non-existent variable at index ${row}`);
             }
        }
    }, [hotTableRef, enqueueOperation, variables]); // Added variables dependency

    return {
        handleBeforeChange,
        handleAfterSelectionEnd,
        handleInsertVariable,
        handleDeleteVariable,
    };
} 