import React, { useMemo } from 'react';
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

    // 5. Memoize layout data separately from handlers to reduce re-computation
    const layoutData = useMemo(() => ({
        colHeaders,
        columns,
        displayData,
        displayNumRows,
        displayNumCols,
        actualNumRows,
        actualNumCols,
    }), [colHeaders, columns, displayData, displayNumRows, displayNumCols, actualNumRows, actualNumCols]);

    // 6. Memoize handlers separately as they change less frequently
    const handlers = useMemo(() => ({
        handleBeforeChange,
        handleAfterColumnResize,
        handleAfterValidate,
        handleAfterChange,
    }), [handleBeforeChange, handleAfterColumnResize, handleAfterValidate, handleAfterChange]);

    // 7. Memoize context menu data separately
    const contextMenuData = useMemo(() => ({
        contextMenuConfig,
        isRangeSelected,
    }), [contextMenuConfig, isRangeSelected]);

    // 8. Return combined object with minimal re-creation
    return useMemo(() => ({
        ...layoutData,
        ...handlers,
        ...contextMenuData,
    }), [layoutData, handlers, contextMenuData]);
};