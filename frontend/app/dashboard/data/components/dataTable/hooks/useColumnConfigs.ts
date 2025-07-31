import { useMemo } from 'react';
import { useTableRefStore } from '@/stores/useTableRefStore';
import { getColumnConfig } from '../utils/utils';

/**
 * Hook untuk mengelola column configurations
 * Memisahkan logika column config generation dari useTableLayout
 */
export const useColumnConfigs = (variableMap: Map<number, any>, displayNumCols: number) => {
    const { viewMode } = useTableRefStore();

    // Generate Column Configurations untuk Handsontable dengan optimized lookups
    const columns = useMemo(() => {
        return Array.from({ length: displayNumCols }, (_, colIndex) => {
            const variable = variableMap.get(colIndex);
            return getColumnConfig(variable, viewMode);
        });
    }, [variableMap, displayNumCols, viewMode]);

    return {
        columns,
    };
};