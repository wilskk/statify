import { useCallback } from 'react';
import Handsontable from 'handsontable';
import { COLUMN_INDEX_TO_FIELD_MAP, DIALOG_TRIGGER_COLUMNS, COLUMN_INDEX } from '../tableConfig';
import { Variable } from "@/types/Variable";
import { useVariableStore } from '@/stores/useVariableStore';

// Define types for the arguments passed to the hook
interface UseVariableTableEventsProps {
    hotTableRef: React.RefObject<any>; // Ref to HotTable instance
    variables: Variable[]; // Needed for checking existence
    openDialog: (dialog: 'type' | 'values' | 'missing', row: number, col: number) => void;
    setSelectedCell: (cell: { row: number; col: number } | null) => void; // Added to manage selection state
}

export function useVariableTableEvents({
    hotTableRef,
    variables,
    openDialog,
    setSelectedCell
}: UseVariableTableEventsProps) {
    const { addVariable, updateMultipleFields, deleteVariable } = useVariableStore();

    const handleBeforeChange = useCallback((
        changes: (Handsontable.CellChange | null)[], source: Handsontable.ChangeSource
    ): boolean | void => {
        if (source === 'loadData' || !changes) return;

        for (const change of changes) {
            if (!change) continue;
            const [row, prop, oldValue, newValue] = change;
            if (newValue === oldValue || typeof row !== 'number') continue;

            let columnIndex: number | undefined;
            if (typeof prop === 'number') {
                columnIndex = prop;
            } else if (typeof prop === 'string') {
                columnIndex = hotTableRef.current?.hotInstance?.propToCol(prop);
            }
            if (typeof columnIndex !== 'number') continue;

            if (DIALOG_TRIGGER_COLUMNS.includes(columnIndex)) {
                if (columnIndex === COLUMN_INDEX.TYPE) openDialog('type', row, columnIndex);
                else if (columnIndex === COLUMN_INDEX.VALUES) openDialog('values', row, columnIndex);
                else if (columnIndex === COLUMN_INDEX.MISSING) openDialog('missing', row, columnIndex);
                return false;
            }

            const field = COLUMN_INDEX_TO_FIELD_MAP[columnIndex];
            if (field && typeof field === 'string') {
                const existingVariable = variables.find(v => v.columnIndex === row);
                const changePayload = { [field]: newValue };

                if (existingVariable) {
                    updateMultipleFields(row, changePayload);
                } else {
                    addVariable({ ...changePayload, columnIndex: row });
                }
            }
        }
        
        return; // Return void, as we are not blocking the change
    }, [variables, addVariable, updateMultipleFields, openDialog, hotTableRef]);

    const handleAfterSelectionEnd = useCallback((
        row: number, column: number, row2: number, column2: number
    ) => {
        const isSingleCell = row === row2 && column === column2;
        if (isSingleCell) {
            setSelectedCell({ row, col: column }); // Update selected cell state
            // Open dialog immediately if a dialog trigger column is selected
            if (DIALOG_TRIGGER_COLUMNS.includes(column)) {
                if (column === COLUMN_INDEX.TYPE) openDialog('type', row, column);
                else if (column === COLUMN_INDEX.VALUES) openDialog('values', row, column);
                else if (column === COLUMN_INDEX.MISSING) openDialog('missing', row, column);
            }
        } else {
            setSelectedCell(null); // Clear selection if multiple cells are selected
        }
    }, [openDialog, setSelectedCell]); // Added setSelectedCell dependency

    // Insert variable at selected row or append if bottom
    const handleInsertVariable = useCallback(async () => {
        const hotInstance = hotTableRef.current?.hotInstance;
        if (!hotInstance) return;
        const selectedRange = hotInstance.getSelectedRangeLast();
        let insertIndex = selectedRange ? selectedRange.from.row : variables.length;
        
        insertIndex = Math.min(insertIndex, variables.length);
        
        await addVariable({ columnIndex: insertIndex });

    }, [hotTableRef, addVariable, variables.length]);

    const handleDeleteVariable = useCallback(async () => {
        const hotInstance = hotTableRef.current?.hotInstance;
        if (!hotInstance) return;
        const selectedRange = hotInstance.getSelectedRangeLast();
        if (!selectedRange) return;

        const startRow = Math.min(selectedRange.from.row, selectedRange.to.row);
        const endRow = Math.max(selectedRange.from.row, selectedRange.to.row);
        
        const deletePromises: Promise<void>[] = [];
        for (let row = endRow; row >= startRow; row--) {
            const variableExists = variables.some(v => v.columnIndex === row);
            if (variableExists) {
                deletePromises.push(deleteVariable(row));
            }
        }
        
        try {
            await Promise.all(deletePromises);
        } catch(error) {
            console.error("Error deleting variables:", error);
        }
    }, [hotTableRef, deleteVariable, variables]);

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