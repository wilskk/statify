// components/VariableTable.tsx (sesuaikan path jika perlu)
"use client";

import React, { useCallback, useMemo, useRef } from "react";
import { HotTable } from "@handsontable/react-wrapper";
import { registerAllModules } from "handsontable/registry";
import Handsontable from 'handsontable';
import "handsontable/dist/handsontable.full.min.css";

import { VariableTypeDialog } from "./dialog/VariableTypeDialog";
import { ValueLabelsDialog } from "./dialog/ValueLabelsDialog";
import { MissingValuesDialog } from "./dialog/MissingValuesDialog";

import { colHeaders, columns, DEFAULT_VARIABLE_TYPE, DEFAULT_VARIABLE_WIDTH, DEFAULT_VARIABLE_DECIMALS, COLUMN_INDEX, DATE_VARIABLE_TYPES } from "./tableConfig";
import { transformVariablesToTableData } from './utils';
import { useVariableStore } from "@/stores/useVariableStore";
import { useVariableTableDialogs } from './hooks/useVariableTableDialogs';
import { useVariableTableEvents } from './hooks/useVariableTableEvents';
import { VariableType } from "@/types/Variable";
import './VariableTable.css';

registerAllModules();

export default function VariableTable() {
    const hotTableRef = useRef<any>(null);
    const variables = useVariableStore(state => state.variables);
    const tableData = useMemo(() => transformVariablesToTableData(variables), [variables]);

    const {
        showTypeDialog, setShowTypeDialog,
        showValuesDialog, setShowValuesDialog,
        showMissingDialog, setShowMissingDialog,
        selectedVariable,
        selectedVariableType,
        openDialog,
        handleTypeChange,
        handleValuesChange,
        handleMissingChange,
        setSelectedCell,
    } = useVariableTableDialogs();

    const {
        handleBeforeChange,
        handleAfterSelectionEnd,
        handleInsertVariable,
        handleDeleteVariable,
        handleCopyVariable,
    } = useVariableTableEvents({
        hotTableRef,
        variables,
        openDialog,
        setSelectedCell,
    });
    
    const handleContextMenu = useCallback((key: string, selection: any) => {
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
    
    const variableCount = variables.length;

    const handleAfterGetRowHeader = useCallback((row: number, TH: HTMLTableCellElement) => {
        if (row >= variableCount) {
            TH.classList.add('grayed-header');
        } else {
            TH.classList.remove('grayed-header');
        }
    }, [variableCount]);

    const dynamicCellsConfig = useCallback((row: number, col: number, prop: string | number) => {
        if (col === COLUMN_INDEX.MEASURE) {
            const currentVar = variables.find(v => v.columnIndex === row);
            const currentType = currentVar?.type;
            const currentMeasure = currentVar?.measure;

            let allowedMeasures: string[] = [];
            if (currentType && DATE_VARIABLE_TYPES.includes(currentType)) {
                allowedMeasures = ['scale'];
            } else if (currentType === 'STRING') {
                allowedMeasures = ['nominal', 'ordinal'];
            } else {
                allowedMeasures = ['nominal', 'ordinal', 'scale'];
            }
            if (currentMeasure === 'unknown' && !allowedMeasures.includes('unknown')) {
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

        return {};
    }, [variables]);

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
                    contextMenu={{
                        items: {
                            insert_variable: { name: 'Insert Variable' },
                            copy_variable:   { name: 'Copy Variable' },
                            delete_variable: { name: 'Delete Variable' },
                        },
                        callback: handleContextMenu,
                    }}
                    licenseKey="non-commercial-and-evaluation"
                    minSpareRows={1}
                    afterGetRowHeader={handleAfterGetRowHeader}
                    beforeChange={handleBeforeChange}
                    afterSelectionEnd={handleAfterSelectionEnd}
                    outsideClickDeselects={false}
                    selectionMode="single"
                />
            </div>

            {selectedVariable && showTypeDialog && (
                <VariableTypeDialog
                    open={showTypeDialog}
                    onOpenChange={setShowTypeDialog}
                    onSave={handleTypeChange}
                    initialType={selectedVariable.type ?? DEFAULT_VARIABLE_TYPE}
                    initialWidth={selectedVariable.width}
                    initialDecimals={selectedVariable.decimals}
                />
            )}
            {selectedVariable && showValuesDialog && (
                <ValueLabelsDialog
                    open={showValuesDialog}
                    onOpenChange={setShowValuesDialog}
                    onSave={handleValuesChange}
                    initialValues={selectedVariable.values || []}
                    variableId={selectedVariable.id}
                    variableType={selectedVariableType ?? DEFAULT_VARIABLE_TYPE}
                />
            )}
            {selectedVariable && showMissingDialog && (
                <MissingValuesDialog
                    open={showMissingDialog}
                    onOpenChange={setShowMissingDialog}
                    onSave={handleMissingChange}
                    initialMissingValues={selectedVariable.missing || null}
                    variableType={selectedVariableType ?? DEFAULT_VARIABLE_TYPE}
                />
            )}
        </div>
    );
}