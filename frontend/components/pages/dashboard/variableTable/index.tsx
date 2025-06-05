// components/VariableTable.tsx (sesuaikan path jika perlu)
"use client";

import React, { useCallback } from "react"; // Import useCallback
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import Handsontable from 'handsontable'; // Import Handsontable namespace
import "handsontable/dist/handsontable.full.min.css";

import { VariableTypeDialog } from "./dialog/VariableTypeDialog";
import { ValueLabelsDialog } from "./dialog/ValueLabelsDialog";
import { MissingValuesDialog } from "./dialog/MissingValuesDialog";

import { colHeaders, columns } from "./tableConfig";
import { useVariableTableLogic } from './hooks/useVariableTableLogic';
import {
    DEFAULT_VARIABLE_TYPE,
    DEFAULT_VARIABLE_WIDTH,
    DEFAULT_VARIABLE_DECIMALS,
    COLUMN_INDEX // Import COLUMN_INDEX
} from './constants'; // Asumsi path ini benar
import { VariableType } from "@/types/Variable"; // Import VariableType
import './VariableTable.css'; // Import CSS

registerAllModules();

export default function VariableTable() {
    const {
        hotTableRef,
        tableData,
        variables, // Get the full variables array

        // Event Handlers from useVariableTableEvents (via useVariableTableLogic)
        handleBeforeChange,
        handleAfterSelectionEnd,
        handleInsertVariable,
        handleDeleteVariable,
        handleCopyVariable,

        // Dialog State & Handlers from useVariableTableDialogs (via useVariableTableLogic)
        showTypeDialog,
        setShowTypeDialog,
        showValuesDialog,
        setShowValuesDialog,
        showMissingDialog,
        setShowMissingDialog,
        selectedVariable, // Use this directly
        selectedVariableType,
        handleTypeChange,
        handleValuesChange,
        handleMissingChange,
        // closeAllDialogs, // Keep if needed
    } = useVariableTableLogic();

    const variableCount = variables.length; // Derive count from variables array

    const handleAfterGetRowHeader = useCallback((row: number, TH: HTMLTableCellElement) => {
        // Use variableCount derived from the variables array length
        if (row >= variableCount) {
            TH.classList.add('grayed-header');
        } else {
            TH.classList.remove('grayed-header');
        }
    }, [variableCount]); // Depend on variableCount

    // Wrapper function for VariableTypeDialog onSave
    const handleSaveTypeDialog = useCallback((type: string, width: number, decimals: number) => {
        // Construct the payload expected by handleTypeChange
        const payload = {
            type: type as VariableType, // Cast string to VariableType (ensure type safety if needed)
            width: width,
            decimals: decimals
        };
        handleTypeChange(payload);
    }, [handleTypeChange]);

    // Prepare props for dialogs using selectedVariable
    const typeDialogProps = {
        open: showTypeDialog,
        onOpenChange: setShowTypeDialog,
        onSave: handleSaveTypeDialog, // Use the wrapper function
        initialType: selectedVariable?.type ?? DEFAULT_VARIABLE_TYPE,
        initialWidth: selectedVariable?.width ?? DEFAULT_VARIABLE_WIDTH,
        initialDecimals: selectedVariable?.decimals ?? DEFAULT_VARIABLE_DECIMALS,
    };

    const valuesDialogProps = {
        open: showValuesDialog,
        onOpenChange: setShowValuesDialog,
        onSave: handleValuesChange, // Use the new handler
        initialValues: selectedVariable?.values || [],
        variableName: selectedVariable?.name || "",
        variableType: selectedVariableType, // This is already derived in the hook
    };

    const missingDialogProps = {
        open: showMissingDialog,
        onOpenChange: setShowMissingDialog,
        onSave: handleMissingChange, // Use the new handler
        initialMissingValues: selectedVariable?.missing || null,
        variableType: selectedVariableType, // This is already derived in the hook
    };

    // --- Dynamic Cell Configuration ---
    const dynamicCellsConfig = useCallback((row: number, col: number, prop: string | number) => {
        // Check if it's the Measure column
        if (col === COLUMN_INDEX.MEASURE) {
            const currentVar = variables.find(v => v.columnIndex === row);
            const currentType = currentVar?.type;
            const currentMeasure = currentVar?.measure;

            let allowedMeasures: string[] = [];
            if (currentType === 'STRING') {
                allowedMeasures = ['nominal', 'ordinal'];
            } else {
                allowedMeasures = ['nominal', 'ordinal', 'scale'];
            }
            if (currentMeasure === 'unknown') {
                allowedMeasures.unshift('unknown');
            }

            return {
                type: 'dropdown',
                source: allowedMeasures,
                strict: true,
                allowInvalid: false,
                className: currentMeasure === 'unknown' ? 'htUnknown' : ''
            } as Handsontable.CellProperties;
        }

        // For other columns, return an empty object to use default settings
        return {};
    }, [variables]);
    // --- End Dynamic Cell Configuration ---

    return (
        <div className="h-full w-full relative">
            <div className="h-full w-full relative z-0 overflow-hidden">
                <HotTable
                    ref={hotTableRef}
                    data={tableData}
                    colHeaders={colHeaders}
                    columns={columns}
                    cells={dynamicCellsConfig}
                    rowHeaders={true}
                    width="100%"
                    height="100%"
                    autoWrapRow={true}
                    autoWrapCol={true}
                    manualColumnResize={true}
                    // Custom context menu for variable actions
                    contextMenu={{
                        items: {
                            insert_variable: { name: 'Insert Variable' },
                            copy_variable:   { name: 'Copy Variable' },
                            delete_variable: { name: 'Delete Variable' },
                        },
                        callback: (key: string) => {
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
                            }
                        },
                    }}
                    licenseKey="non-commercial-and-evaluation"
                    minSpareRows={1}
                    afterGetRowHeader={handleAfterGetRowHeader}
                    beforeChange={handleBeforeChange}
                    afterSelectionEnd={handleAfterSelectionEnd}
                    outsideClickDeselects={false} // Keep this to prevent dialogs closing unexpectedly
                    selectionMode="single" // Keep single selection mode
                />
            </div>

            {/* Render dialogs only if the required variable data is available */}
            {selectedVariable && (
                <>
                    <VariableTypeDialog {...typeDialogProps} />
                    <ValueLabelsDialog {...valuesDialogProps} />
                    <MissingValuesDialog {...missingDialogProps} />
                </>
            )}
        </div>
    );
}