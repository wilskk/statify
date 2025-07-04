import React from 'react';
import { useTableLayout } from './useTableLayout';
import { useTableUpdates } from './useTableUpdates';
import { useContextMenuLogic } from './useContextMenuLogic';
import { useTableRefStore } from '@/stores/useTableRefStore';

/**
 * Main hook for the DataTable component.
 * This hook composes other hooks to manage layout, updates, and context menu logic.
 */
export const useDataTableLogic = (hotTableRef: React.RefObject<any>) => {
    // 1. Get viewMode from the store
    const { viewMode } = useTableRefStore();

    // 2. Generate Table Layout (Dimensions, Headers, Data Matrix, Column Configs)
    const {
        actualNumRows,
        actualNumCols,
        displayNumRows,
        displayNumCols,
        colHeaders,
        columns,
        displayData,
    } = useTableLayout();

    // 3. Setup Update Handling
    const {
        handleBeforeChange,
        handleAfterChange,
        handleAfterColumnResize,
        handleAfterValidate,
    } = useTableUpdates(viewMode);

    // 4. Setup Context Menu
    const {
        contextMenuConfig,
        isRangeSelected,
    } = useContextMenuLogic({
        hotTableRef,
        actualNumRows,
        actualNumCols,
    });

    // 5. Return all necessary values and handlers
    return {
        // Layout & Data
        colHeaders,
        columns,
        displayData,
        displayNumRows,
        displayNumCols,
        actualNumRows,
        actualNumCols,

        // Event Handlers
        handleBeforeChange,
        handleAfterColumnResize,
        handleAfterValidate,
        handleAfterChange,

        // Context Menu
        contextMenuConfig,
        isRangeSelected,
    };
};