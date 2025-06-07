// statify/components/variableTable/useVariableTableLogic.ts
import { useRef, useEffect, useMemo, useCallback } from "react";
import Handsontable from 'handsontable';
import { useVariableStore } from "@/stores/useVariableStore";
import { transformVariablesToTableData } from '../utils';
import { COLUMN_INDEX } from '../constants';
import { useVariableTableUpdates } from './useVariableTableUpdates';
import { useVariableTableDialogs } from './useVariableTableDialogs';
import { useVariableTableEvents } from './useVariableTableEvents';

// Add static measure options map
const MEASURE_OPTIONS: Record<string, string[]> = {
    STRING: ['nominal', 'ordinal'],
    DEFAULT: ['nominal', 'ordinal', 'scale'],
};

export function useVariableTableLogic() {
    // Removed HotTableClass import; using any for ref
    const hotTableRef = useRef<any>(null);
    const { variables } = useVariableStore(); // Get variables

    // Replace state-based tableData handling with memoization
    const tableData = useMemo(() => transformVariablesToTableData(variables), [variables]);

    // No longer storing variableTableRef in global store

    // --- Initialize Child Hooks ---

    const { enqueueOperation } = useVariableTableUpdates();

    const {
        // Dialog State & Setters
        showTypeDialog, setShowTypeDialog,
        showValuesDialog, setShowValuesDialog,
        showMissingDialog, setShowMissingDialog,
        // Selected Cell Info
        selectedCell, setSelectedCell,
        selectedVariable,
        selectedVariableType,
        // Dialog Actions & Handlers
        openDialogForCell,
        closeAllDialogs,
        handleTypeChange,
        handleValuesChange,
        handleMissingChange,
    } = useVariableTableDialogs();

    const {
        // Handsontable Event Handlers
        handleBeforeChange,
        handleAfterSelectionEnd,
        handleInsertVariable,
        handleDeleteVariable,
        handleCopyVariable,
    } = useVariableTableEvents({
        hotTableRef,
        variables,
        enqueueOperation,
        openDialogForCell,
        setSelectedCell, // Pass down the setter from dialogs hook
    });

    // Memoize measure options lookup
    const measureSourceMap = useMemo(() => MEASURE_OPTIONS, []);

    // --- Dynamic Cell Configuration ---
    const dynamicCellsConfig = useCallback((row: number, col: number, prop: string | number) => {
        if (col === COLUMN_INDEX.MEASURE) {
            const currentVar = variables.find(v => v.columnIndex === row);
            const currentType = currentVar?.type;
            const currentMeasure = currentVar?.measure;
            // Use DEFAULT if type is undefined or not in map
            const baseMeasures = measureSourceMap[currentType ?? 'DEFAULT'];
            const sourceOptions = currentMeasure === 'unknown'
                ? ['unknown', ...baseMeasures]
                : baseMeasures;
            return {
                source: sourceOptions,
                strict: true,
                allowInvalid: false,
                className: currentMeasure === 'unknown' ? 'htUnknown' : ''
            } as Handsontable.CellProperties;
        }

        return {};
    }, [variables, measureSourceMap]);
    // --- End Dynamic Cell Configuration ---

    // --- Return values needed by the VariableTable component ---
    return {
        hotTableRef,
        tableData,
        variables, // Pass variables down if needed by the component itself

        // Event Handlers for Handsontable
        handleBeforeChange,
        handleAfterSelectionEnd,
        handleInsertVariable,
        handleDeleteVariable,
        handleCopyVariable,

        // Dialog State & Handlers for Dialog Components
        showTypeDialog,
        setShowTypeDialog, // Pass setters if dialogs are controlled from VariableTable
        showValuesDialog,
        setShowValuesDialog,
        showMissingDialog,
        setShowMissingDialog,
        selectedCell, // Needed for context/positioning dialogs
        selectedVariable, // Data for the dialogs
        selectedVariableType, // Derived type for convenience
        handleTypeChange,
        handleValuesChange,
        handleMissingChange,
        closeAllDialogs,
    };
}