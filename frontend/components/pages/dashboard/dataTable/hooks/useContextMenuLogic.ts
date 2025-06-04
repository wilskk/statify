import React, { useCallback, useMemo } from 'react';
import Handsontable from 'handsontable';
import { HotTableClass } from '@handsontable/react';
import { VariableAlign } from '@/types/Variable';
import { insertRow, insertColumn, removeRows, removeColumns, applyAlignment as svcApplyAlignment } from '../services/contextMenuService';

interface UseContextMenuLogicProps {
    hotTableRef: React.RefObject<HotTableClass | null>;
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

    const applyAlignment = useCallback((alignment: VariableAlign) => {
        // collect selected columns
        const hot = hotTableRef.current?.hotInstance;
        const ranges = hot?.getSelectedRange();
        if (!ranges || ranges.length === 0) return;
        const cols = new Set<number>();
        ranges.forEach(r => {
            for (let c = Math.min(r.from.col, r.to.col); c <= Math.max(r.from.col, r.to.col); c++) {
                if (c < actualNumCols) cols.add(c);
            }
        });
        svcApplyAlignment(Array.from(cols), alignment);
    }, [hotTableRef, actualNumCols]);

    // --- Context Menu Configuration ---

    const contextMenuConfig = useMemo((): Handsontable.GridSettings['contextMenu'] => {
        const hot = hotTableRef.current?.hotInstance;

        const handleInsertRow = (above: boolean) => {
            const { row } = getSelectedCell();
            if (row !== -1) {
                insertRow(above ? row : row + 1);
            }
        };

        const handleInsertColumn = (left: boolean) => {
            const { col } = getSelectedCell();
            if (col !== -1) {
                const targetIndex = left ? col : col + 1;
                insertColumn(targetIndex);
            }
        };

        const handleRemoveRow = () => {
            const { row } = getSelectedCell();
            if (row !== -1 && hot) {
                // Handsontable's selection might span multiple rows
                const selectedRange = hot.getSelectedRange();
                if (!selectedRange || selectedRange.length === 0) return;
                
                const startRow = Math.min(selectedRange[0].from.row, selectedRange[0].to.row);
                const endRow = Math.max(selectedRange[0].from.row, selectedRange[0].to.row);
                const rowCount = endRow - startRow + 1;

                // Use deleteRows instead of multiple deleteRow calls
                const rowsToDelete = Array.from({ length: rowCount }, (_, i) => startRow + i);
                removeRows(rowsToDelete);
            }
        };

        const handleRemoveColumn = () => {
            const { col } = getSelectedCell();
            if (col !== -1 && hot) {
                const selectedRange = hot.getSelectedRange();
                if (!selectedRange || selectedRange.length === 0) return;
                
                const startCol = Math.min(selectedRange[0].from.col, selectedRange[0].to.col);
                const endCol = Math.max(selectedRange[0].from.col, selectedRange[0].to.col);
                const colCount = endCol - startCol + 1;

                // Create array of columns to delete
                const columnsToDelete = Array.from({ length: colCount }, (_, i) => startCol);
                
                // Then delete all columns at once
                removeColumns(startCol, colCount);
            }
        };

        return {
            items: {
                row_above: { 
                    name: 'Insert row above',
                    callback: () => handleInsertRow(true),
                    disabled: () => !isRangeSelected()
                },
                row_below: { 
                    name: 'Insert row below',
                    callback: () => handleInsertRow(false),
                    disabled: () => !isRangeSelected()
                 },
                col_left: { 
                    name: 'Insert column left',
                    callback: () => handleInsertColumn(true),
                    disabled: () => !isRangeSelected()
                },
                col_right: { 
                    name: 'Insert column right',
                    callback: () => handleInsertColumn(false),
                    disabled: () => !isRangeSelected()
                },
                sp1: Handsontable.plugins.ContextMenu.SEPARATOR,
                remove_row: { 
                    name: 'Remove row(s)',
                    callback: handleRemoveRow,
                    disabled: () => !isRangeSelected() 
                },
                remove_col: { 
                    name: 'Remove column(s)',
                    callback: handleRemoveColumn,
                    disabled: () => !isRangeSelected()
                 },
                sp2: Handsontable.plugins.ContextMenu.SEPARATOR,
                copy: { name: 'Copy', disabled: () => !isRangeSelected() }, // Handled by Handsontable
                cut: { name: 'Cut', disabled: () => !isRangeSelected() }, // Handled by Handsontable
                sp3: Handsontable.plugins.ContextMenu.SEPARATOR,
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
                sp4: Handsontable.plugins.ContextMenu.SEPARATOR, // Added separator
                clear_column: { // Renamed from clear_custom
                    name: 'Clear contents',
                    // Same action as remove_col
                    callback: handleRemoveColumn, 
                    disabled: () => !isRangeSelected()
                },
            }
        };
    }, [hotTableRef, getSelectedCell, isRangeSelected, applyAlignment]); 

    // Removed isContextMenuEnabled as Handsontable handles this implicitly
    // when contextMenu config is provided.

    return {
        contextMenuConfig,
        isRangeSelected // Expose if needed elsewhere
    };
}; 