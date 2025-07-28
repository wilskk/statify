import React, { useMemo } from 'react';
import { useTableLayout } from './useTableLayout';
import { useTableUpdates } from './useTableUpdates';
import { useContextMenuLogic } from './useContextMenuLogic';
import { useDataTablePerformance } from '@/hooks/usePerformanceMonitor';
import { useTableRefStore } from '@/stores/useTableRefStore';

/**
 * Main hook for the DataTable component.
 * This hook composes other hooks to manage layout, updates, and context menu logic.
 */
export const useDataTableLogic = (hotTableRef: React.RefObject<any>) => {
    const { measureRender, measureUpdate } = useDataTablePerformance();
    
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

    // 3. Setup Update Handling with performance monitoring
    const updateHandlers = useMemo(() => {
        const {
            handleBeforeChange,
            handleAfterChange,
            handleAfterColumnResize,
            handleAfterValidate,
        } = useTableUpdates(viewMode);
        
        // Wrap handlers with performance monitoring
        return {
            handleBeforeChange: (changes: any, source: string) => {
                measureRender(() => {});
                return handleBeforeChange(changes, source);
            },
            handleAfterChange: async (changes: any, source: string) => {
                return measureUpdate(() => handleAfterChange(changes, source));
            },
            handleAfterColumnResize,
            handleAfterValidate,
        };
    }, [measureRender, measureUpdate, viewMode]);

    // 4. Setup Context Menu
    const {
        contextMenuConfig,
        isRangeSelected,
    } = useContextMenuLogic({
        hotTableRef,
        actualNumRows,
        actualNumCols,
    });

    // 5. Memoize layout data to prevent unnecessary re-renders
    const memoizedLayoutData = useMemo(() => ({
        actualNumRows,
        actualNumCols,
        displayNumRows,
        displayNumCols,
        colHeaders,
        columns,
        displayData,
    }), [actualNumRows, actualNumCols, displayNumRows, displayNumCols, colHeaders, columns, displayData]);

    // 7. Memoize context menu data separately
    const contextMenuData = useMemo(() => ({
        contextMenuConfig,
        isRangeSelected,
    }), [contextMenuConfig, isRangeSelected]);

    // 8. Return combined object with minimal re-creation
    return useMemo(() => ({
        ...memoizedLayoutData,
        ...updateHandlers,
        ...contextMenuData,
    }), [memoizedLayoutData, updateHandlers, contextMenuData]);
};