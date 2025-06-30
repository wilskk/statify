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
    const { variables, updateMultipleFields } = useVariableStore();

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

    const selectedVariableInfo = useMemo(() => {
        if (!selectedVariable) {
            return { type: DEFAULT_VARIABLE_TYPE, id: undefined, name: '' };
        }
        return {
            type: selectedVariable.type || DEFAULT_VARIABLE_TYPE,
            id: selectedVariable.id,
            name: selectedVariable.name
        };
    }, [selectedVariable]);

    const selectedVariableType = useMemo(() => {
        return selectedVariable?.type || DEFAULT_VARIABLE_TYPE;
    }, [selectedVariable]);

    const openDialog = useCallback((dialog: 'type' | 'values' | 'missing', row: number, col: number) => {
        requestAnimationFrame(() => {
            setSelectedCell({ row, col });
            setShowTypeDialog(dialog === 'type');
            setShowValuesDialog(dialog === 'values');
            setShowMissingDialog(dialog === 'missing');
        });
    }, []);

    // --- Dialog Update Handlers (Placeholders - Implement actual logic based on dialog components) ---

    const handleTypeChange = useCallback(async (type: VariableType, width: number, decimals: number) => {
        if (!selectedCell) return;
        const rowIndex = selectedCell.row;
        
        const payload: Partial<Variable> = { type, width };
        if (decimals !== undefined) {
            payload.decimals = decimals;
        }

        // Jika variabel belum ada, logika di useVariableStore.addVariable akan menanganinya
        await updateMultipleFields(rowIndex, payload);
        setShowTypeDialog(false);
    }, [selectedCell, updateMultipleFields]);

    const handleValuesChange = useCallback(async (newValueLabels: ValuesChangePayload) => {
        if (!selectedCell) return;
        const rowIndex = selectedCell.row;
        if (!selectedVariable) {
            // The creation is now handled by the on-edit logic in useVariableTableEvents
            // await insertVariableAt(rowIndex);
        }
        await updateMultipleFields(rowIndex, { values: newValueLabels });
        setShowValuesDialog(false);
    }, [selectedCell, selectedVariable, updateMultipleFields]);

    const handleMissingChange = useCallback(async (newMissingSpec: MissingChangePayload) => {
        if (!selectedCell) return;
        const rowIndex = selectedCell.row;
        if (!selectedVariable) {
            // The creation is now handled by the on-edit logic in useVariableTableEvents
            // await insertVariableAt(rowIndex);
        }
        await updateMultipleFields(rowIndex, { missing: newMissingSpec });
        setShowMissingDialog(false);
    }, [selectedCell, selectedVariable, updateMultipleFields]);

    // --- End Dialog Update Handlers ---

    const closeAllDialogs = useCallback(() => {
        setShowTypeDialog(false);
        setShowValuesDialog(false);
        setShowMissingDialog(false);
        // Optionally reset selectedCell if needed when closing all dialogs
        // setSelectedCell(null);
    }, []);

    // Memoize return object to stabilize references
    return {
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
        selectedVariableInfo,
        selectedVariableType,
        // Actions
        openDialog,
        closeAllDialogs,
        // Dialog Handlers
        handleTypeChange,
        handleValuesChange,
        handleMissingChange,
    };
} 