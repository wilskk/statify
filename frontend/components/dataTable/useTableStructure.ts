import { useMemo, useEffect, useState } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { getColumnConfig, getDefaultSpareColumnConfig } from './utils';
import { Variable, VariableAlign } from '@/types/Variable';

/**
 * Custom hook to generate the structures needed for Handsontable display.
 * Creates column headers, the display matrix (with padding), and column configurations.
 *
 * @param actualNumRows - Actual number of data rows from the store.
 * @param actualNumCols - Actual number of data columns (based on data and variables).
 * @param targetVisualDataRows - Target number of rows to display (including min rows).
 * @param targetVisualDataCols - Target number of columns to display (including min cols).
 * @param displayNumCols - Total columns to display including the final spare column.
 */
export const useTableStructure = (
    actualNumRows: number,
    actualNumCols: number,
    targetVisualDataRows: number,
    targetVisualDataCols: number,
    displayNumCols: number // Needed for final spare column config
) => {
    const data = useDataStore((state) => state.data);
    const variables = useVariableStore((state) => state.variables);

    const colHeaders = useMemo(() => {
        const headers = Array.from({ length: targetVisualDataCols }, (_, index) => {
            const variable = variables.find(v => v.columnIndex === index);
            return (variable?.name && variable.name.trim() !== '')
                   ? variable.name
                   : 'var'; // Change default header to just 'var'
        });
        headers.push('var'); // Change spare header text to 'var' as well
        return headers;
    }, [variables, targetVisualDataCols]);

    const displayMatrix = useMemo(() => {
        const matrix: (string | number | null)[][] = [];
        const displayRows = targetVisualDataRows + 1; // +1 for visual spare row
        // displayNumCols already includes the +1 for spare col

        for (let r = 0; r < displayRows; r++) {
            matrix[r] = [];
            for (let c = 0; c < displayNumCols; c++) {
                // Fill with actual data if within true bounds
                if (r < actualNumRows && c < actualNumCols) {
                    matrix[r][c] = data[r]?.[c] ?? '';
                } else {
                    // Fill with null for all visual padding and spare areas
                    matrix[r][c] = null;
                }
            }
        }
        return matrix;
    }, [data, actualNumRows, actualNumCols, targetVisualDataRows, displayNumCols]);

    const columns = useMemo(() => {
        const getAlignmentClass = (align: VariableAlign | undefined): string => {
            switch (align) {
                case 'left': return 'htLeft';
                case 'center': return 'htCenter';
                case 'right': return 'htRight';
                default: return 'htLeft'; // Default alignment
            }
        };

        const generatedColumns = Array(displayNumCols).fill(null).map((_, colIndex) => {
            if (colIndex < actualNumCols) {
                const variable = variables.find(v => v.columnIndex === colIndex);
                if (variable) {
                    const type = variable.type.startsWith('NUMERIC') || [
                        'COMMA', 'DOT', 'SCIENTIFIC', 'DOLLAR'
                    ].includes(variable.type) ? 'numeric' : 'text';
                    
                    // Construct the column config
                    return {
                        data: colIndex, // Map to data source index
                        type: type,
                        readOnly: false,
                        className: getAlignmentClass(variable.align) // Apply alignment class
                        // Add other variable-derived settings here later if needed (e.g., format)
                    };
                }
                // Fallback for a data column missing a variable (shouldn't happen ideally)
                return { data: colIndex, type: 'text', readOnly: false, className: 'htLeft' }; 
            }
            // Config for visual spare columns
            return { data: colIndex, ...getDefaultSpareColumnConfig() };
        });
        return generatedColumns;
    }, [variables, actualNumCols, displayNumCols]);

    return {
        colHeaders,
        displayMatrix,
        columns,
    };
}; 