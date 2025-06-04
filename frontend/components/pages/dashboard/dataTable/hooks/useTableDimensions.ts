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

    // Calculate ACTUAL data/variable dimensions from the store
    const actualNumRows = useMemo(() => data.length, [data]);
    const actualNumCols = useMemo(() => {
        const maxVariableIndex = variables.length > 0
            ? Math.max(...variables.map(v => v.columnIndex))
            : -1;
        const requiredColsByVars = maxVariableIndex + 1;
        const dataCols = data.reduce((max, row) => Math.max(max, row.length), 0);
        // ACTUAL columns are based ONLY on existing data/vars, ignore visual minimums
        return Math.max(requiredColsByVars, dataCols);
    }, [variables, data]);

    // Calculate TARGET VISUAL dimensions (applying MIN_ROWS/MIN_COLS)
    const targetVisualDataRows = useMemo(() => Math.max(actualNumRows, MIN_ROWS), [actualNumRows]);
    const targetVisualDataCols = useMemo(() => Math.max(actualNumCols, MIN_COLS), [actualNumCols]);

    // Calculate final displayed dimensions (includes visual padding + final spare)
    // The +1 is for the visual spare row/column added for user interaction
    const displayNumRows = useMemo(() => targetVisualDataRows + 1, [targetVisualDataRows]);
    const displayNumCols = useMemo(() => targetVisualDataCols + 1, [targetVisualDataCols]);

    return {
        actualNumRows,
        actualNumCols,
        targetVisualDataRows,
        targetVisualDataCols,
        displayNumRows,
        displayNumCols,
    };
}; 