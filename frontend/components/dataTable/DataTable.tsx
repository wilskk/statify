"use client";

import React, { useRef, useEffect } from 'react';
import { HotTable, HotTableClass } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

import { useTableRefStore } from '@/stores/useTableRefStore';
import { useDataTableLogic } from './useDataTableLogic';

registerAllModules();

export default function DataTable() {
    const hotTableRef = useRef<HotTableClass>(null);
    const { setDataTableRef } = useTableRefStore();

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
    } = useDataTableLogic(hotTableRef);

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
        <div className="h-full w-full z-0 relative hot-container">
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
                dropdownMenu={true}
                filters={true}
                customBorders={true}
                copyPaste={true}
                licenseKey="non-commercial-and-evaluation"
                minSpareRows={1}
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
            />
        </div>
    );
}