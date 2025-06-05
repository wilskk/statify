import { useCallback } from 'react';
import Handsontable from 'handsontable';
import { HotTableClass } from '@handsontable/react';
import { Variable, VariableType } from "@/types/Variable";
import {
    COLUMN_INDEX_TO_FIELD_MAP,
    DIALOG_TRIGGER_COLUMNS,
    COLUMN_INDEX
} from '../constants';
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
        changes: (Handsontable.CellChange | null)[], source: Handsontable.ChangeSource
    ): void | boolean => {
        if (source === 'loadData' || source === 'updateData' || !changes) return;
        for (const change of changes) {
            if (!change) continue;
            const [row, prop, oldValue, newValue] = change;
            if (newValue === oldValue || typeof row !== 'number') continue;

            let columnIndex: number | undefined;
            if (typeof prop === 'number') columnIndex = prop;
            else if (typeof prop === 'string') columnIndex = hotTableRef.current?.hotInstance?.propToCol(prop);
            else continue;
            if (typeof columnIndex !== 'number') continue;

            // Dialog triggers
            if (DIALOG_TRIGGER_COLUMNS.includes(columnIndex)) {
                if (source === 'edit' || source === 'Autofill.fill' || source === 'CopyPaste.paste') {
                    openDialogForCell(row, columnIndex);
                    return false;
                }
                continue;
            }

            const field = COLUMN_INDEX_TO_FIELD_MAP[columnIndex];
            if (field && typeof field === 'string') {
                const existingVariable = variables.find(v => v.columnIndex === row);
                const rawChange: any = { [field]: newValue };
                // Constraint: STRING variables cannot have measure 'scale'
                if (existingVariable && field === 'measure' && existingVariable.type === 'STRING' && newValue === 'scale') {
                    console.warn(`Constraint Applied (UI): Variable type is STRING, measure cannot be 'scale'.`);
                    rawChange.measure = 'nominal';
                }
                const op: PendingOperation = existingVariable
                    ? { type: 'UPDATE_VARIABLE', payload: { row, changes: rawChange } }
                    : { type: 'CREATE_VARIABLE', payload: { row, variableData: rawChange } };
                enqueueOperation(op);
            }
        }
        return true;
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

    // Insert variable at selected row or append if bottom
    const handleInsertVariable = useCallback(() => {
        const hotInstance = hotTableRef.current?.hotInstance;
        if (!hotInstance) return;
        const selectedRange = hotInstance.getSelectedRangeLast();
        // Determine insertion index: use selected row or append
        let selectedRow = selectedRange ? selectedRange.from.row : variables.length;
        // Clamp to existing variable count
        selectedRow = Math.min(selectedRow, variables.length);
        enqueueOperation({ type: 'INSERT_VARIABLE', payload: { row: selectedRow } });
    }, [hotTableRef, enqueueOperation, variables]);

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

    // Copy variable data to system clipboard
    const handleCopyVariable = useCallback(() => {
        const hotInstance = hotTableRef.current?.hotInstance;
        if (!hotInstance) return;
        const selectedRange = hotInstance.getSelectedRangeLast();
        if (!selectedRange) return;
        const row = selectedRange.from.row;
        const variable = variables.find(v => v.columnIndex === row);
        if (!variable) {
            console.warn(`No variable found at index ${row} to copy`);
            return;
        }
        try {
            // Exclude internal identifiers
            const { id, tempId, ...copyData } = variable;
            const text = JSON.stringify(copyData);
            navigator.clipboard.writeText(text).then(() => {
                console.log('[useVariableTableEvents] Variable copied to clipboard', variable);
            }).catch(err => {
                console.error('[useVariableTableEvents] Copy to clipboard failed', err);
            });
        } catch (err) {
            console.error('[useVariableTableEvents] Failed to copy variable', err);
        }
    }, [hotTableRef, variables]);

    return {
        handleBeforeChange,
        handleAfterSelectionEnd,
        handleInsertVariable,
        handleDeleteVariable,
        handleCopyVariable,
    };
} 