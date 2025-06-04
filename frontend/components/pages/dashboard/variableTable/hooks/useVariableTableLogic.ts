// statify/components/variableTable/useVariableTableLogic.ts
import { useRef, useState, useEffect, useMemo } from "react";
import { HotTableClass } from "@handsontable/react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useTableRefStore } from "@/stores/useTableRefStore";
import { transformVariablesToTableData } from '../utils';
import { useVariableTableUpdates } from './useVariableTableUpdates';
import { useVariableTableDialogs } from './useVariableTableDialogs';
import { useVariableTableEvents } from './useVariableTableEvents';

export function useVariableTableLogic() {
    const hotTableRef = useRef<HotTableClass>(null);
    const { variables } = useVariableStore(); // Get variables
    const { setVariableTableRef } = useTableRefStore();

    // State for the data displayed in the Handsontable
    const [tableData, setTableData] = useState<(string | number)[][]>([]);

    // Transform variables from store into table data format whenever variables change
    useEffect(() => {
        setTableData(transformVariablesToTableData(variables));
    }, [variables]);

    // Register the table ref in the global store when it mounts
    useEffect(() => {
        if (hotTableRef.current) {
            setVariableTableRef(hotTableRef as React.RefObject<any>);
        }
        return () => {
            setVariableTableRef(null); // Clear ref on unmount
        };
    }, [setVariableTableRef]);

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
    } = useVariableTableEvents({
        hotTableRef,
        variables,
        enqueueOperation,
        openDialogForCell,
        setSelectedCell, // Pass down the setter from dialogs hook
    });

    // --- Return values needed by the VariableTable component ---
    return {
        hotTableRef,
        tableData,
        variables, // Pass variables down if needed by the component itself

        // Event Handlers for Handsontable
        handleBeforeChange,
        handleAfterSelectionEnd,
        // Note: Insert/Delete might be triggered by buttons outside the table,
        // so they are exposed here as well.
        handleInsertVariable,
        handleDeleteVariable,

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