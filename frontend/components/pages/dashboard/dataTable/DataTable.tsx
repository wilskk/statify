"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { HotTable, HotTableClass } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

import { useTableRefStore } from '@/stores/useTableRefStore';
import { useDataStore } from '@/stores/useDataStore';
import { useDataTableLogic } from './useDataTableLogic';
import './DataTable.css';

registerAllModules();

export default function DataTable() {
    const hotTableRef = useRef<HotTableClass>(null);
    const { setDataTableRef } = useTableRefStore();
    const updateCells = useDataStore.getState().updateCells;

    const {
        displayMatrix,
        colHeaders,
        columns,
        contextMenuConfig,
        handleBeforeChange,
        handleAfterCreateRow,
        handleAfterCreateCol,
        handleAfterRemoveRow,
        handleAfterRemoveCol,
        handleAfterColumnResize,
        handleAfterValidate,
        isRangeSelected,
        actualNumRows,
        actualNumCols,
    } = useDataTableLogic(hotTableRef);

    const handleAfterGetRowHeader = useCallback((row: number, TH: HTMLTableCellElement) => {
        if (row >= actualNumRows) {
            TH.classList.add('grayed-row-header', 'visual-spare-header');
        } else {
            TH.classList.remove('grayed-row-header', 'visual-spare-header');
        }
    }, [actualNumRows]);

    const handleAfterGetColHeader = useCallback((col: number, TH: HTMLTableCellElement) => {
        TH.classList.remove('grayed-col-header', 'visual-spare-header');

        if (col >= actualNumCols) {
            TH.classList.add('grayed-col-header', 'visual-spare-header');
        } else {
            // Active columns (0 <= col < actualNumCols) - ensure spare styles are removed
            // No specific class needed unless you want a distinct active style
        }
    }, [actualNumCols]);

    useEffect(() => {
        if (hotTableRef.current) {
            setDataTableRef(hotTableRef as React.RefObject<any>);
        }
        return () => {
            setDataTableRef(null);
        };
    }, [setDataTableRef]);

    useEffect(() => {
        const hotInstance = hotTableRef.current?.hotInstance;
        if (hotInstance) {
            hotInstance.updateSettings({ colHeaders: colHeaders }, false);
        }
    }, [colHeaders]);

    useEffect(() => {
        const hotInstance = hotTableRef.current?.hotInstance;
        if (hotInstance) {
            hotInstance.updateSettings({ columns: columns as any }, false);
        }
    }, [columns]);

    return (
        <div className="h-full w-full z-0 relative hot-container overflow-hidden">
            <HotTable
                ref={hotTableRef}
                data={displayMatrix}
                colHeaders={colHeaders}
                columns={columns as any}
                rowHeaders={true}
                width="100%"
                height="100%"
                contextMenu={contextMenuConfig}
                manualColumnResize={true}
                manualRowResize={false}
                manualColumnMove={false}
                manualRowMove={false}
                dropdownMenu={false}
                filters={true}
                customBorders={true}
                copyPaste={true}
                licenseKey="non-commercial-and-evaluation"
                minSpareRows={0}
                minSpareCols={0}
                allowInvalid={false}
                outsideClickDeselects={false}
                invalidCellClassName="htInvalid"
                preventOverflow="horizontal"
                beforeChange={handleBeforeChange}
                afterCreateRow={handleAfterCreateRow}
                afterCreateCol={handleAfterCreateCol}
                afterRemoveRow={handleAfterRemoveRow}
                afterRemoveCol={handleAfterRemoveCol}
                afterColumnResize={handleAfterColumnResize}
                afterValidate={handleAfterValidate}
                afterGetRowHeader={handleAfterGetRowHeader}
                afterGetColHeader={handleAfterGetColHeader}
                afterChange={(changes, source) => {
                    if (!changes || source === 'loadData') return;
                    const updates = changes.map(([row, prop, , newValue]) => ({
                        row: row as number,
                        col: typeof prop === 'string' ? parseInt(prop, 10) : (prop as number),
                        value: newValue as string | number,
                    }));
                    updateCells(updates);
                }}
            />
        </div>
    );
}