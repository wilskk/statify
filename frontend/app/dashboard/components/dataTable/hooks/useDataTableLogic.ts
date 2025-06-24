import React from 'react';

import { useTableDimensions } from './useTableDimensions';
import { useTableStructure } from './useTableStructure';
import { useTableUpdates } from './useTableUpdates';
import { useContextMenuLogic } from './useContextMenuLogic';
import { useTableRefStore } from '@/stores/useTableRefStore';

/**
 * Main hook for the DataTable component.
 * Coordinates dimension calculations, structure generation, update handling,
 * and context menu logic by composing other specialized hooks.
 */
export const useDataTableLogic = (hotTableRef: React.RefObject<any>) => {

    // 1. Calculate Dimensions
    const {
        actualNumRows,
        actualNumCols,
        targetVisualDataRows,
        targetVisualDataCols,
        displayNumRows,
        displayNumCols,
    } = useTableDimensions();

    const { viewMode} = useTableRefStore();

    // 2. Generate Table Structure (Headers, Data Matrix, Column Configs)
    const {
        colHeaders,
        columns,
    } = useTableStructure(
        viewMode,
        actualNumRows,
        actualNumCols,
        targetVisualDataRows,
        targetVisualDataCols,
        displayNumCols
    );

    // 3. Setup Update Handling (Change Events, Operation Queue)
    const {
        handleBeforeChange,
        handleAfterCreateRow, // Still needed for context menu trigger
        handleAfterCreateCol, // Still needed for context menu trigger
        handleAfterRemoveRow, // Still needed for context menu trigger
        handleAfterRemoveCol, // Still needed for context menu trigger
        handleAfterColumnResize,
        handleAfterValidate,
    } = useTableUpdates({
        hotTableRef,
        actualNumRows,
        actualNumCols,
        columns,
    });

    // 4. Setup Context Menu
    const {
        contextMenuConfig,
        isRangeSelected,
    } = useContextMenuLogic({
        hotTableRef,
        actualNumRows,
        actualNumCols,
    });

    // 5. Return all necessary values and handlers for the DataTable component
    return {
        // Structure & Data
        colHeaders,
        columns,

        // Dimensions (for component rendering/styling)
        displayNumRows,
        displayNumCols,
        actualNumRows,
        actualNumCols,

        // Event Handlers
        handleBeforeChange,
        handleAfterCreateRow,
        handleAfterCreateCol,
        handleAfterRemoveRow,
        handleAfterRemoveCol,
        handleAfterColumnResize,
        handleAfterValidate,

        // Context Menu
        contextMenuConfig,
        isRangeSelected,
    };
};