import { useState, useMemo, useCallback } from 'react';
import { useVariableStore } from '@/stores/useVariableStore';
import {
    COLUMN_INDEX,
    DEFAULT_VARIABLE_TYPE
} from '../tableConfig';
import { Variable, VariableType, ValueLabel, MissingValuesSpec } from '@/types/Variable';

// Placeholder types for dialog handler arguments, adjust as needed
type TypeChangePayload = { type: VariableType; width: number; decimals?: number };
type ValuesChangePayload = ValueLabel[];
type MissingChangePayload = MissingValuesSpec | null;

/**
 * Hook to manage dialogs for variable table operations.
 * 
 * Provides state and handlers for type, values, and missing values dialogs.
 * 
 * @returns An object containing dialog state, selected cell info, and action handlers.
 */
export function useVariableTableDialogs() {
    const { variables, updateMultipleFields, insertVariableAt } = useVariableStore();

    const [showTypeDialog, setShowTypeDialog] = useState(false);
    const [showValuesDialog, setShowValuesDialog] = useState(false);
    const [showMissingDialog, setShowMissingDialog] = useState(false);
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

    // Logic to get the selected variable based on the selected cell's row index
    const selectedVariable = useMemo(() => {
        if (!selectedCell) return null;
        // Assuming 'row' in selectedCell corresponds to columnIndex in the variable store
        return variables.find(v => v.columnIndex === selectedCell.row) ?? null;
    }, [selectedCell, variables]);

    const selectedVariableType = useMemo(() => {
        return selectedVariable?.type || DEFAULT_VARIABLE_TYPE;
    }, [selectedVariable]);

    const openDialogForCell = useCallback((row: number, col: number) => {
        // Use requestAnimationFrame to ensure state updates don't interfere with Handsontable rendering cycles
        requestAnimationFrame(() => {
            setSelectedCell({ row, col }); // Set the selected cell first
            // Determine which dialog to show based on the column index
            setShowTypeDialog(col === COLUMN_INDEX.TYPE);
            setShowValuesDialog(col === COLUMN_INDEX.VALUES);
            setShowMissingDialog(col === COLUMN_INDEX.MISSING);
        });
    }, []);

    // --- Dialog Update Handlers (Placeholders - Implement actual logic based on dialog components) ---

    const handleTypeChange = useCallback(async (payload: TypeChangePayload) => {
        if (!selectedCell) return;
        const rowIndex = selectedCell.row;
        if (!selectedVariable) {
            await insertVariableAt(rowIndex);
        }
        await updateMultipleFields(rowIndex, {
            type: payload.type,
            width: payload.width,
            ...(payload.decimals !== undefined && { decimals: payload.decimals })
        });
        setShowTypeDialog(false);
    }, [selectedCell, selectedVariable, updateMultipleFields, insertVariableAt]);

    const handleValuesChange = useCallback(async (newValueLabels: ValuesChangePayload) => {
        if (!selectedCell) return;
        const rowIndex = selectedCell.row;
        if (!selectedVariable) {
            await insertVariableAt(rowIndex);
        }
        await updateMultipleFields(rowIndex, { values: newValueLabels });
        setShowValuesDialog(false);
    }, [selectedCell, selectedVariable, updateMultipleFields, insertVariableAt]);

    const handleMissingChange = useCallback(async (newMissingSpec: MissingChangePayload) => {
        if (!selectedCell) return;
        const rowIndex = selectedCell.row;
        if (!selectedVariable) {
            await insertVariableAt(rowIndex);
        }
        await updateMultipleFields(rowIndex, { missing: newMissingSpec });
        setShowMissingDialog(false);
    }, [selectedCell, selectedVariable, updateMultipleFields, insertVariableAt]);

    // --- End Dialog Update Handlers ---

    const closeAllDialogs = useCallback(() => {
        setShowTypeDialog(false);
        setShowValuesDialog(false);
        setShowMissingDialog(false);
        // Optionally reset selectedCell if needed when closing all dialogs
        // setSelectedCell(null);
    }, []);

    // Memoize return object to stabilize references
    return useMemo(() => ({
        // Dialog State
        showTypeDialog,
        setShowTypeDialog,
        showValuesDialog,
        setShowValuesDialog,
        showMissingDialog,
        setShowMissingDialog,
        // Selected Cell Info
        selectedCell,
        setSelectedCell,
        selectedVariable,
        selectedVariableType,
        // Actions
        openDialogForCell,
        closeAllDialogs,
        // Dialog Handlers
        handleTypeChange,
        handleValuesChange,
        handleMissingChange,
    }), [
        showTypeDialog,
        showValuesDialog,
        showMissingDialog,
        selectedCell,
        selectedVariable,
        selectedVariableType,
        openDialogForCell,
        closeAllDialogs,
        handleTypeChange,
        handleValuesChange,
        handleMissingChange
    ]);
} 