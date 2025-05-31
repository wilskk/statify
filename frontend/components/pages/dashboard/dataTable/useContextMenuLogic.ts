import React, { useCallback, useMemo } from 'react';
import Handsontable from 'handsontable';
import { HotTableClass } from '@handsontable/react';
import { useVariableStore } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore'; // Import useDataStore
import { Variable, VariableAlign } from '@/types/Variable'; // Import Variable type and VariableAlign

interface UseContextMenuLogicProps {
    hotTableRef: React.RefObject<HotTableClass | null>;
    actualNumRows: number;
    actualNumCols: number;
    // We need store actions for alignment updates, assume they are passed or accessed
    // For simplicity, accessing store directly here. Consider passing actions if preferred.
}

/**
 * Custom hook to manage Handsontable context menu logic, including item configuration and actions.
 */
export const useContextMenuLogic = ({
    hotTableRef,
    actualNumRows,
    actualNumCols
}: UseContextMenuLogicProps) => {

    const variableStore = useVariableStore(); // Get the whole store
    const dataStore = useDataStore(); // Get the whole store

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
        const hotInstance = hotTableRef.current?.hotInstance;
        const selectedRanges = hotInstance?.getSelectedRange();

        if (!hotInstance || !selectedRanges || selectedRanges.length === 0) {
            return;
        }

        const affectedColumns = new Set<number>();
        selectedRanges.forEach(range => {
            const startCol = Math.min(range.from.col, range.to.col);
            const endCol = Math.max(range.from.col, range.to.col);
            for (let col = startCol; col <= endCol; col++) {
                // Only apply to actual data columns
                if (col < actualNumCols) {
                    affectedColumns.add(col);
                }
            }
        });

        affectedColumns.forEach(columnIndex => {
            // Akses langsung ke array variables dari store
            const variable = variableStore.variables.find(v => v.columnIndex === columnIndex);
            // Only update variable store if alignment changed
            if (variable && variable.align !== alignment) {
                 variableStore.updateVariable(columnIndex, 'align', alignment);
            }
            // Visual update is now handled by DataTable re-rendering with updated `columns` prop
        });

        // No need to call hotInstance.render() here explicitly

    }, [variableStore, hotTableRef, actualNumCols]);

    // --- Context Menu Configuration ---

    const contextMenuConfig = useMemo((): Handsontable.GridSettings['contextMenu'] => {
        const hot = hotTableRef.current?.hotInstance;

        const handleInsertRow = (above: boolean) => {
            const { row } = getSelectedCell();
            if (row !== -1) {
                dataStore.addRow(above ? row : row + 1);
            }
        };

        const handleInsertColumn = (left: boolean) => {
            const { col } = getSelectedCell();
            if (col !== -1) {
                const targetIndex = left ? col : col + 1;
                console.log(`[handleInsertColumn] Attempting insert at targetIndex: ${targetIndex} (left: ${left})`); // Log target

                try {
                    console.log(`[handleInsertColumn] Calling variableStore.addVariable with columnIndex: ${targetIndex}`);
                    // MUST add variable first to shift indices before adding data column
                    variableStore.addVariable({ columnIndex: targetIndex });
                    console.log(`[handleInsertColumn] variableStore.addVariable completed for index: ${targetIndex}`);

                    console.log(`[handleInsertColumn] Calling dataStore.addColumns with targetIndex: ${targetIndex}`);
                    dataStore.addColumns([targetIndex]);
                    console.log(`[handleInsertColumn] dataStore.addColumns completed for index: ${targetIndex}`);

                    console.log(`[handleInsertColumn] Insert column operation completed successfully for index: ${targetIndex}`);
                } catch (error) {
                     console.error(`[handleInsertColumn] Error during insert column operation for index: ${targetIndex}`, error);
                }
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
                dataStore.deleteRows(rowsToDelete);
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
                
                // Delete all variables first to maintain consistency
                for (let i = 0; i < colCount; i++) {
                    variableStore.deleteVariable(startCol);
                }
                
                // Then delete all columns at once
                dataStore.deleteColumns(columnsToDelete);
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
    }, [hotTableRef, dataStore, variableStore, getSelectedCell, isRangeSelected, applyAlignment]); 

    // Removed isContextMenuEnabled as Handsontable handles this implicitly
    // when contextMenu config is provided.

    return {
        contextMenuConfig,
        isRangeSelected // Expose if needed elsewhere
    };
}; 