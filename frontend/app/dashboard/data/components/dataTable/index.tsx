"use client";

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import HandsontableWrapper from './HandsontableWrapper';
import { registerAllModules } from 'handsontable/registry';
import { useDataStore } from '@/stores/useDataStore';
import { useDataTableLogic } from './hooks/useDataTableLogic';
import { useTableRefStore } from '@/stores/useTableRefStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useMetaStore } from '@/stores/useMetaStore';
import './DataTable.css';

registerAllModules();

export default function Index() {
    const hotTableRef = useRef<any>(null);
    const { viewMode } = useTableRefStore();
    
    const {
        colHeaders,
        columns,
        displayData,
        contextMenuConfig,
        handleBeforeChange,
        handleAfterChange,
        handleAfterColumnResize,
        handleAfterValidate,
        actualNumRows,
        actualNumCols,
        displayNumRows,
        displayNumCols,
    } = useDataTableLogic(hotTableRef);
    
    const filterVarName = useMetaStore(state => state.meta.filter);
    const variables = useVariableStore(state => state.variables); // Keep for filter logic
    const filterVarIndex = useMemo(() => 
        variables.find(v => v.name === filterVarName)?.columnIndex,
    [variables, filterVarName]);

    const handleAfterGetRowHeader = useCallback((row: number, TH: HTMLTableCellElement) => {
        TH.classList.remove('grayed-row-header', 'visual-spare-header', 'unselected-row-header');
        if (row >= actualNumRows) {
            TH.classList.add('grayed-row-header', 'visual-spare-header');
            return;
        }
        if (filterVarIndex !== undefined) {
            const val = displayData[row]?.[filterVarIndex];
            if (val === 0 || val === '' || val === null || val === undefined) {
                TH.classList.add('unselected-row-header');
            }
        }
    }, [actualNumRows, filterVarIndex, displayData]);

    const handleAfterGetColHeader = useCallback((col: number, TH: HTMLTableCellElement) => {
        TH.classList.remove('grayed-col-header', 'visual-spare-header');
        if (col >= actualNumCols) {
            TH.classList.add('grayed-col-header', 'visual-spare-header');
        }
    }, [actualNumCols]);

    useEffect(() => {
        const hotInstance = hotTableRef.current?.hotInstance;
        if (hotInstance) {
            hotInstance.updateSettings({ colHeaders, columns: columns as any });
            hotInstance.render();
        }
    }, [colHeaders, columns, viewMode]);

    return (
        <div className="h-full w-full z-0 relative hot-container overflow-hidden">
            <HandsontableWrapper
                ref={hotTableRef}
                data={displayData}
                minRows={displayNumRows}
                minCols={displayNumCols}
                colHeaders={colHeaders}
                columns={columns as any}
                contextMenu={contextMenuConfig}
                beforeChange={handleBeforeChange}
                afterColumnResize={handleAfterColumnResize}
                afterValidate={handleAfterValidate}
                afterGetRowHeader={handleAfterGetRowHeader}
                afterGetColHeader={handleAfterGetColHeader}
                afterChange={handleAfterChange}
            />
        </div>
    );
}