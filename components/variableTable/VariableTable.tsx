"use client";

import React from "react";
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
} from './constants';

registerAllModules();

export default function VariableTable() {
    const {
        hotTableRef,
        tableData,
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
        getCellProperties,
        handleBeforeKeyDown,
        handleBeforeSetRangeEnd,
    } = useVariableTableLogic();

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
                    beforeChange={handleBeforeChange}
                    afterSelectionEnd={handleAfterSelectionEnd}
                    beforeSetRangeEnd={handleBeforeSetRangeEnd}
                    beforeKeyDown={handleBeforeKeyDown}
                    cells={getCellProperties}
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