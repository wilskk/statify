import { useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { getVariableIcon } from '@/components/Common/iconHelper';
import { createDefaultVariable } from '@/stores/useVariableStore';
import { getColumnConfig } from '../utils/utils';
import { DataRow } from '@/types/Data';
import { MIN_ROWS, MIN_COLS } from '../constants';
import { useTableRefStore } from '@/stores/useTableRefStore';

/**
 * A custom hook that centralizes the logic for calculating table dimensions
 * and generating the structure (headers, columns, data grid) for the DataTable.
 *
 * This hook combines the responsibilities of the previous `useTableDimensions`
 * and `useTableStructure` hooks to create a more streamlined and efficient
 * data flow, reducing prop-drilling and simplifying the main DataTable component.
 *
 * @returns An object containing all necessary properties for rendering the Handsontable instance,
 * including dimensions, column configurations, headers, and the data matrix.
 */
export const useTableLayout = () => {
    // 1. Subscribe to necessary stores
    const data = useDataStore(state => state.data);
    const variables = useVariableStore(state => state.variables);
    const { viewMode } = useTableRefStore();

    // 2. Calculate Actual Dimensions
    const actualNumRows = useMemo(() => data?.length ?? 0, [data]);

    const actualNumCols = useMemo(() => {
        if ((!variables || variables.length === 0) && (!data || data.length === 0)) {
            return 0;
        }
        const maxVarIndex = variables.length > 0 ? Math.max(...variables.map(v => v.columnIndex)) : -1;
        const maxDataCols = data?.[0]?.length ?? 0;
        return Math.max(maxVarIndex + 1, maxDataCols);
    }, [variables, data]);

    // 3. Determine Visual Grid Size (enforcing minimums)
    const targetVisualDataRows = useMemo(() => Math.max(actualNumRows, MIN_ROWS), [actualNumRows]);
    const targetVisualDataCols = useMemo(() => Math.max(actualNumCols, MIN_COLS), [actualNumCols]);

    // 4. Calculate Final Display Dimensions (adding a spare row/column for UI)
    const displayNumRows = useMemo(() => targetVisualDataRows + 1, [targetVisualDataRows]);
    const displayNumCols = useMemo(() => targetVisualDataCols + 1, [targetVisualDataCols]);

    // 5. Generate Column Headers
    const colHeaders = useMemo(() => {
        return Array.from({ length: displayNumCols }, (_, colIndex) => {
            const variable = variables.find(v => v.columnIndex === colIndex);
            if (variable) {
                const icon = getVariableIcon(variable);
                const iconHtml = renderToStaticMarkup(icon);
                return `<div class="col-header-container">${iconHtml}<span class="colHeader">${variable.name}</span></div>`;
            }
            if (colIndex < targetVisualDataCols) {
                return `var`; // Header for uninitialized but allocated columns
            }
            return ''; // Spare column header is empty
        });
    }, [variables, displayNumCols, targetVisualDataCols]);

    // 6. Generate Column Configurations for Handsontable
    const columns = useMemo(() => {
        return Array.from({ length: displayNumCols }, (_, colIndex) => {
            const variable = variables.find(v => v.columnIndex === colIndex);
            return getColumnConfig(variable, viewMode);
        });
    }, [variables, displayNumCols, viewMode]);

    // 7. Construct the Data Matrix for Display
    const displayData = useMemo(() => {
        const matrix: DataRow[] = Array(targetVisualDataRows).fill(null).map(() => Array(targetVisualDataCols).fill(null));
        if (data && data.length > 0) {
            for (let i = 0; i < actualNumRows; i++) {
                if (data[i]) {
                    for (let j = 0; j < actualNumCols; j++) {
                        matrix[i][j] = data[i][j] ?? null;
                    }
                }
            }
        }
        return matrix;
    }, [data, actualNumRows, actualNumCols, targetVisualDataRows, targetVisualDataCols]);


    // 8. Return all computed values
    return {
        // Dimensions
        actualNumRows,
        actualNumCols,
        displayNumRows,
        displayNumCols,
        // Structure
        colHeaders,
        columns,
        displayData,
    };
}; 