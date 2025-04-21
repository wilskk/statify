// components/VariableTable.tsx (sesuaikan path jika perlu)
"use client";

import React, { useCallback } from "react"; // Import useCallback
import { HotTable, HotTableClass } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";

import { VariableTypeDialog } from "./dialog/VariableTypeDialog";
import { ValueLabelsDialog } from "./dialog/ValueLabelsDialog";
import { MissingValuesDialog } from "./dialog/MissingValuesDialog";

import { colHeaders, columns } from "./tableConfig";
import { useVariableTableLogic } from './useVariableTableLogic';
import {
    DEFAULT_VARIABLE_TYPE,
    DEFAULT_VARIABLE_WIDTH,
    DEFAULT_VARIABLE_DECIMALS
} from './constants'; // Asumsi path ini benar
import './VariableTable.css'; // Import CSS

registerAllModules();

export default function VariableTable() {
    const {
        hotTableRef,
        tableData,
        actualVariableCount, // <-- Ambil nilai ini
        showTypeDialog,
        setShowTypeDialog,
        showValuesDialog,
        setShowValuesDialog,
        showMissingDialog,
        setShowMissingDialog,
        selectedVariableType,
        handleBeforeChange,
        handleAfterSelectionEnd,
        handleTypeSelection,
        handleValuesSelection,
        handleMissingSelection,
        getSelectedVariableName,
        getSelectedVariableValues,
        getSelectedVariableMissing,
        getSelectedVariableOrDefault,
        customContextMenu,
        handleBeforeKeyDown,
        handleBeforeSetRangeEnd,
    } = useVariableTableLogic();

    const handleAfterGetRowHeader = useCallback((row: number, TH: HTMLTableCellElement) => {
        if (row >= actualVariableCount) {
            TH.classList.add('grayed-header');
        } else {
            TH.classList.remove('grayed-header');
        }
    }, [actualVariableCount]);

    return (
        <div className="h-full w-full relative">
            <div className="h-full w-full relative z-0">
                <HotTable
                    ref={hotTableRef}
                    data={tableData}
                    colHeaders={colHeaders}
                    columns={columns}
                    rowHeaders={true}
                    width="100%"
                    height="100%"
                    autoWrapRow={true}
                    autoWrapCol={true}
                    manualColumnResize={true}
                    contextMenu={customContextMenu}
                    licenseKey="non-commercial-and-evaluation"
                    minSpareRows={1}
                    afterGetRowHeader={handleAfterGetRowHeader} // <-- Tambahkan prop ini
                    beforeChange={handleBeforeChange}
                    afterSelectionEnd={handleAfterSelectionEnd}
                    beforeSetRangeEnd={handleBeforeSetRangeEnd}
                    beforeKeyDown={handleBeforeKeyDown}
                    outsideClickDeselects={false}
                    selectionMode="single"
                />
            </div>

            <VariableTypeDialog
                open={showTypeDialog}
                onOpenChange={setShowTypeDialog}
                onSave={handleTypeSelection}
                initialType={getSelectedVariableOrDefault('type', DEFAULT_VARIABLE_TYPE)}
                initialWidth={getSelectedVariableOrDefault('width', DEFAULT_VARIABLE_WIDTH)}
                initialDecimals={getSelectedVariableOrDefault('decimals', DEFAULT_VARIABLE_DECIMALS)}
            />

            <ValueLabelsDialog
                open={showValuesDialog}
                onOpenChange={setShowValuesDialog}
                onSave={handleValuesSelection}
                initialValues={getSelectedVariableValues()}
                variableName={getSelectedVariableName()}
                variableType={selectedVariableType}
            />

            <MissingValuesDialog
                open={showMissingDialog}
                onOpenChange={setShowMissingDialog}
                onSave={handleMissingSelection}
                initialMissingValues={getSelectedVariableMissing()}
                variableType={selectedVariableType}
            />
        </div>
    );
}