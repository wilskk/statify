import React, { useCallback, useMemo } from 'react';
import Handsontable from 'handsontable';
import { VariableAlign } from '@/types/Variable';
import { insertRow, insertColumn, removeRows, removeColumns, applyAlignment as svcApplyAlignment } from '../services/contextMenuService';

// Removed HotTableClass import; using any for ref

interface UseContextMenuLogicProps {
    hotTableRef: React.RefObject<any>;
    actualNumRows: number;
    actualNumCols: number;
}

/**
 * Custom hook to manage Handsontable context menu logic, including item configuration and actions.
 */
export const useContextMenuLogic = ({
    hotTableRef,
    actualNumRows,
    actualNumCols
}: UseContextMenuLogicProps) => {

    // service layer handles store interactions

    // --- Helper functions for context menu conditions ---

    const isRangeSelected = useCallback(() => {
        const hot = hotTableRef.current?.hotInstance;
        return !!hot && hot.getSelectedRange() !== undefined && hot.getSelectedRange()!.length > 0;
    }, [hotTableRef]);

    // Helper to get the primary selected row/col (top-left of the first range)
    const getSelectedCell = useCallback(() => {
        const hot = hotTableRef.current?.hotInstance;
        const selectedRange = hot?.getSelectedRange();
        if (!selectedRange || selectedRange.length === 0) {
            return { row: -1, col: -1 };
        }
        const firstRange = selectedRange[0];
        // Use the top-left cell of the first selected range as the anchor
        return { row: Math.min(firstRange.from.row, firstRange.to.row), col: Math.min(firstRange.from.col, firstRange.to.col) };
    }, [hotTableRef]);

    // --- Context Menu Actions ---

    const applyAlignment = useCallback(async (alignment: VariableAlign) => {
        // collect selected columns
        const hot = hotTableRef.current?.hotInstance;
        const ranges = hot?.getSelectedRange();
        if (!ranges || ranges.length === 0) return;
        const cols = new Set<number>();
        ranges.forEach((r: Handsontable.CellRange) => {
            for (let c = Math.min(r.from.col, r.to.col); c <= Math.max(r.from.col, r.to.col); c++) {
                if (c < actualNumCols) cols.add(c);
            }
        });
        await svcApplyAlignment(Array.from(cols), alignment);
        // re-render table to apply new column configs
        hot?.render();
    }, [hotTableRef, actualNumCols]);

    // --- Context Menu Handlers ---

    const handleInsertRow = useCallback((above: boolean) => {
        const { row } = getSelectedCell();
        if (row !== -1) insertRow(above ? row : row + 1);
    }, [getSelectedCell]);

    const handleInsertColumn = useCallback((left: boolean) => {
        const { col } = getSelectedCell();
        if (col !== -1) insertColumn(left ? col : col + 1);
    }, [getSelectedCell]);

    const handleRemoveRow = useCallback(() => {
        const { row } = getSelectedCell();
        const hot = hotTableRef.current?.hotInstance;
        if (row !== -1 && hot) {
            const range = hot.getSelectedRange()![0];
            const start = Math.min(range.from.row, range.to.row);
            const end = Math.max(range.from.row, range.to.row);
            removeRows(Array.from({ length: end - start + 1 }, (_, i) => start + i));
        }
    }, [getSelectedCell]);

    const handleRemoveColumn = useCallback(() => {
        const { col } = getSelectedCell();
        const hot = hotTableRef.current?.hotInstance;
        if (col !== -1 && hot) {
            const range = hot.getSelectedRange()![0];
            const start = Math.min(range.from.col, range.to.col);
            const end = Math.max(range.from.col, range.to.col);
            removeColumns(start, end - start + 1);
        }
    }, [getSelectedCell]);

    // --- Context Menu Configuration ---

    const contextMenuConfig = useMemo((): Handsontable.GridSettings['contextMenu'] => {
        const SEP = Handsontable.plugins.ContextMenu.SEPARATOR;

        return {
            items: {
                row_above: { name: 'Insert row above', callback: () => handleInsertRow(true), disabled: () => !isRangeSelected() },
                row_below: { name: 'Insert row below', callback: () => handleInsertRow(false), disabled: () => !isRangeSelected() },
                col_left: { name: 'Insert column left', callback: () => handleInsertColumn(true), disabled: () => !isRangeSelected() },
                col_right: { name: 'Insert column right', callback: () => handleInsertColumn(false), disabled: () => !isRangeSelected() },
                sp1: SEP,
                remove_row: { name: 'Remove row(s)', callback: handleRemoveRow, disabled: () => !isRangeSelected() },
                remove_col: { name: 'Remove column(s)', callback: handleRemoveColumn, disabled: () => !isRangeSelected() },
                sp2: SEP,
                copy: { name: 'Copy', disabled: () => !isRangeSelected() }, // Handled by Handsontable
                cut: { name: 'Cut', disabled: () => !isRangeSelected() }, // Handled by Handsontable
                sp3: SEP,
                alignment: { // Add Alignment submenu back
                    name: 'Alignment',
                    disabled: () => !isRangeSelected(),
                    submenu: {
                        items: [
                            { key: 'alignment:left', name: 'Left', callback: () => applyAlignment('left') },
                            { key: 'alignment:center', name: 'Center', callback: () => applyAlignment('center') },
                            { key: 'alignment:right', name: 'Right', callback: () => applyAlignment('right') }
                        ]
                    }
                },
                sp4: SEP, // Added separator
                clear_column: { // Renamed from clear_custom
                    name: 'Clear contents',
                    // Same action as remove_col
                    callback: handleRemoveColumn, 
                    disabled: () => !isRangeSelected()
                },
            }
        };
    }, [isRangeSelected, applyAlignment, handleInsertRow, handleInsertColumn, handleRemoveRow, handleRemoveColumn]);

    // Removed isContextMenuEnabled as Handsontable handles this implicitly
    // when contextMenu config is provided.

    return {
        contextMenuConfig,
        isRangeSelected // Expose if needed elsewhere
    };
}; 