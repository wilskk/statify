// statify/components/variableTable/useVariableTableLogic.ts
import { useRef, useMemo, useCallback } from "react";
import Handsontable from 'handsontable';
import { useVariableStore } from "@/stores/useVariableStore";
import { COLUMN_INDEX } from '../tableConfig';
import { useVariableTableUpdates } from './useVariableTableUpdates';
import { useVariableTableDialogs } from './useVariableTableDialogs';
import { useVariableTableEvents } from './useVariableTableEvents';
import { transformVariablesToTableData } from '../utils';

const MEASURE_OPTIONS: Record<string, string[]> = {
    STRING: ['nominal', 'ordinal'],
    DEFAULT: ['nominal', 'ordinal', 'scale'],
};

export function useVariableTableLogic() {
    // Removed HotTableClass import; using any for ref
    const hotTableRef = useRef<any>(null);

    // Subscribe to variables and compute tableData with memoization
    const variables = useVariableStore(state => state.variables);
    const tableData = useMemo(() => transformVariablesToTableData(variables), [variables]);

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

    // --- Dynamic Cell Configuration ---
    const dynamicCellsConfig = useCallback((row: number, col: number, prop: string | number) => {
        if (col === COLUMN_INDEX.MEASURE) {
            const currentVar = variables.find(v => v.columnIndex === row);
            const currentType = currentVar?.type;
            const currentMeasure = currentVar?.measure;
            // Use DEFAULT if type is undefined or not in map
            const baseMeasures = MEASURE_OPTIONS[currentType ?? 'DEFAULT'];
            const sourceOptions = currentMeasure === 'unknown'
                ? ['unknown', ...baseMeasures]
                : baseMeasures;
            return {
                type: 'autocomplete',
                source: sourceOptions,
                strict: true,
                allowInvalid: false,
                trimDropdown: false,
                visibleRows: 5,
                className: currentMeasure === 'unknown' ? 'htUnknown' : ''
            } as Handsontable.CellProperties;
        }

        return {};
    }, [variables]);
    // --- End Dynamic Cell Configuration ---

    // Unified context-menu dispatch
    const handleContextMenu = useCallback((key: string) => {
        switch (key) {
            case 'insert_variable':
                handleInsertVariable();
                break;
            case 'copy_variable':
                handleCopyVariable();
                break;
            case 'delete_variable':
                handleDeleteVariable();
                break;
            default:
                break;
        }
    }, [handleInsertVariable, handleCopyVariable, handleDeleteVariable]);

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

        // Unified context-menu dispatch
        handleContextMenu,

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