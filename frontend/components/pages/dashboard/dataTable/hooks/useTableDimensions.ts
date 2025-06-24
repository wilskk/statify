import { useMemo } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { MIN_ROWS, MIN_COLS } from '../constants';

/**
 * Custom hook to calculate various dimensions of the data table.
 * Calculates both the actual dimensions based on data/variables
 * and the target visual dimensions including minimums.
 */
export const useTableDimensions = () => {
    const data = useDataStore((state) => state.data);
    const variables = useVariableStore((state) => state.variables);

    // Calculate ACTUAL data/variable dimensions directly
    const actualNumRows = data.length;
    const actualNumCols = (() => {
        const maxVariableIndex = variables.length > 0
            ? Math.max(...variables.map(v => v.columnIndex))
            : -1;
        const requiredColsByVars = maxVariableIndex + 1;
        const dataCols = data.reduce((max, row) => Math.max(max, row.length), 0);
        return Math.max(requiredColsByVars, dataCols);
    })();

    // Apply minimum SPSS-like grid: at least MIN_ROWS and MIN_COLS
    const targetVisualDataRows = Math.max(actualNumRows, MIN_ROWS);
    const targetVisualDataCols = Math.max(actualNumCols, MIN_COLS);
    // Display dims include one spare row/col for entry
    const displayNumRows = targetVisualDataRows + 1;
    const displayNumCols = targetVisualDataCols + 1;

    return {
        actualNumRows,
        actualNumCols,
        targetVisualDataRows,
        targetVisualDataCols,
        displayNumRows,
        displayNumCols,
    };
}; 