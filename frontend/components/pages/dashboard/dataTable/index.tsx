"use client";

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import HandsontableWrapper from './HandsontableWrapper';
import { registerAllModules } from 'handsontable/registry';
import debounce from 'lodash/debounce';

import { useDataStore } from '@/stores/useDataStore';
import { useDataTableLogic } from './hooks/useDataTableLogic';
import { addColumns, addMultipleVariables, getVariables } from './services/storeOperations';
import { useTableRefStore } from '@/stores/useTableRefStore';
import { useVariableStore } from '@/stores/useVariableStore';
import './DataTable.css';

registerAllModules();

/** Map Handsontable changes to update objects */
function mapChangesToUpdates(changes: any[]) {
  return changes.map((item: any[]) => {
    const [row, prop, , newValue] = item;
    const col = typeof prop === 'string' ? parseInt(prop as string, 10) : (prop as number);
    return { row: row as number, col, value: newValue as string | number };
  });
}

/** Truncate updates based on widthMap */
function applyTruncation(
  updates: Array<{ row: number; col: number; value: string | number }>,
  widthMap: Record<number, number>
) {
  updates.forEach(u => {
    const maxWidth = widthMap[u.col];
    if (typeof u.value === 'string' && maxWidth !== undefined && String(u.value).length > maxWidth) {
      u.value = String(u.value).substring(0, maxWidth);
    }
  });
}

export default function Index() {
    const hotTableRef = useRef<any>(null);
    const updateCells = useDataStore(state => state.updateCells);
    const data = useDataStore(state => state.data);
    const variables = useVariableStore(state => state.variables);
    const { viewMode } = useTableRefStore();

    // Debounce updates to batch rapid changes and improve performance
    const debouncedUpdateCells = useMemo(() => debounce(updateCells, 100), [updateCells]);

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAfterChange = useCallback(async (changes: any[] | null, source: any) => {
        if (!changes) return;
        const src = String(source).toLowerCase();
        if (src === 'loaddata' || src.includes('contextmenu')) return;
        try {
            const updates = mapChangesToUpdates(changes);
            const maxCol = updates.reduce((max, u) => Math.max(max, u.col), -1);
            const widthMap: Record<number, number> = {};
            if (maxCol >= actualNumCols) {
                const initialCols = actualNumCols;
                const newCols = Array.from({ length: maxCol - initialCols + 1 }, (_, idx) => initialCols + idx);
                const updatesByCol: Record<number, any[]> = {};
                updates.forEach(({ col, value }) => {
                    if (col >= initialCols) (updatesByCol[col] ||= []).push(value);
                });
                const varsToAdd = newCols.map(colIndex => {
                    const vals = updatesByCol[colIndex] || [];
                    const isNumericOnly = vals.every(v => {
                        const num = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
                        return !isNaN(num) && String(v).trim() !== '';
                    });
                    const width = isNumericOnly ? 8 : Math.max(...vals.map(v => String(v).length));
                    widthMap[colIndex] = width;
                    return { columnIndex: colIndex, type: isNumericOnly ? 'NUMERIC' : 'STRING', width } as Partial<import('@/types/Variable').Variable>;
                });
                try {
                    await addMultipleVariables(varsToAdd);
                    addColumns(newCols);
                } catch (error) {
                    console.error('Failed to add new variables/columns:', error);
                }
            }
            let vars: Array<{ columnIndex: number; width?: number }> = [];
            try {
                vars = getVariables();
            } catch (error) {
                console.error('Failed to fetch variables:', error);
            }
            vars.forEach(v => {
                if (widthMap[v.columnIndex] === undefined) widthMap[v.columnIndex] = v.width ?? 8;
            });
            applyTruncation(updates, widthMap);
            debouncedUpdateCells(updates);
        } catch (error) {
            console.error('Error in handleAfterChange:', error);
        }
    }, [debouncedUpdateCells, actualNumCols]);

    // When switching back to numeric mode, convert any remaining labels to codes
    useEffect(() => {
        if (viewMode === 'numeric') {
            const updates: {row: number; col: number; value: any}[] = [];
            data.forEach((row, r) => {
                variables.forEach(variable => {
                    const c = variable.columnIndex;
                    const cell = row[c];
                    if (typeof cell === 'string') {
                        const mapping = variable.values?.find(v => v.label === cell);
                        if (mapping) updates.push({ row: r, col: c, value: mapping.value });
                    }
                });
            });
            if (updates.length) updateCells(updates);
        }
    }, [viewMode]);

    // Cancel pending debounced calls on unmount
    useEffect(() => {
        return () => { debouncedUpdateCells.cancel(); };
    }, [debouncedUpdateCells]);

    // Update settings for headers & columns in one effect to reduce re-renders
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
                data={displayMatrix}
                colHeaders={colHeaders}
                columns={columns as any}
                contextMenu={contextMenuConfig}
                beforeChange={handleBeforeChange}
                afterCreateRow={handleAfterCreateRow}
                afterCreateCol={handleAfterCreateCol}
                afterRemoveRow={handleAfterRemoveRow}
                afterRemoveCol={handleAfterRemoveCol}
                afterColumnResize={handleAfterColumnResize}
                afterValidate={handleAfterValidate}
                afterGetRowHeader={handleAfterGetRowHeader}
                afterGetColHeader={handleAfterGetColHeader}
                afterChange={handleAfterChange}
            />
        </div>
    );
}