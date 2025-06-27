import { useMemo } from 'react';
import ReactDOMServer from 'react-dom/server';
import { getVariableIcon } from '@/components/Common/iconHelper';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { getColumnConfig, getDefaultSpareColumnConfig } from '../utils/utils';
import { Variable, VariableAlign, VariableType, spssDateTypes } from '@/types/Variable';
import { DEFAULT_COLUMN_WIDTH } from '../constants';
import { textRenderer } from 'handsontable/renderers';

/**
 * Custom hook to generate the structures needed for Handsontable display.
 * Creates column headers, the display matrix (with padding), and column configurations.
 *
 * @param viewMode - Current view mode (numeric or label)
 * @param actualNumRows - Actual number of data rows from the store.
 * @param actualNumCols - Actual number of data columns (based on data and variables).
 * @param targetVisualDataRows - Target number of rows to display (including min rows).
 * @param targetVisualDataCols - Target number of columns to display (including min cols).
 * @param displayNumCols - Total columns to display including the final spare column.
 */
export const useTableStructure = (
    viewMode: 'numeric' | 'label',
    actualNumRows: number,
    actualNumCols: number,
    targetVisualDataRows: number,
    targetVisualDataCols: number,
    displayNumCols: number // Needed for final spare column config
) => {
    const data = useDataStore((state) => state.data);
    const variables = useVariableStore((state) => state.variables);
    const variableMap = useMemo(() => new Map(variables.map(v => [v.columnIndex, v])), [variables]);

    const colHeaders = useMemo(() => {
        const headers = Array.from({ length: targetVisualDataCols }, (_, index) => {
            const variable = variableMap.get(index);
            if (variable) {
                const iconElement = getVariableIcon(variable);
                // eslint-disable-next-line testing-library/render-result-naming-convention
                const iconHtml = ReactDOMServer.renderToStaticMarkup(iconElement);
                const variableName = (variable.name && variable.name.trim() !== '') ? variable.name : 'var';
                return `<div class="col-header-container">${iconHtml}<span class="colHeader">${variableName}</span></div>`;
            }
            return 'var';
        });
        headers.push('var');
        return headers;
    }, [variableMap, targetVisualDataCols]);

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
                    // Fill with empty string for visual padding
                    matrix[r][c] = '';
                }
            }
        }
        return matrix;
    }, [data, actualNumRows, actualNumCols, targetVisualDataRows, displayNumCols]);

    /**
     * Returns dropdown column config for label mode if applicable
     */
    function getDropdownColumnConfig(
        viewMode: 'numeric' | 'label',
        variable: Variable | undefined,
        colIndex: number,
        data: (string | number)[][],
        alignClass: string,
        truncateClass: string
    ): any {
        if (viewMode !== 'label' || !variable?.values?.length) return;
        // preserve original column width
        const baseConfig = getColumnConfig(variable);
        const mappingLabels = variable.values.map(v => v.label);
        const rawLabels = Array.from(new Set(data.map(row => String(row[colIndex]))));
        const source = mappingLabels.length ? mappingLabels : rawLabels;
        return {
            data: colIndex,
            readOnly: false,
            className: `${alignClass} ${truncateClass}`.trim(),
            type: 'dropdown',
            source,
            strict: false,
            allowInvalid: false,
            width: baseConfig.width,
            validator(value: any, callback: (isValid: boolean) => void) {
                if (value === null || value === undefined || String(value) === '') return callback(true);
                const valStr = String(value).trim();
                if (variable.type === 'NUMERIC') {
                    const num = Number(valStr.replace(/,/g, ''));
                    if (!isNaN(num)) return callback(true);
                }
                if (variable.type === 'STRING') return callback(true);
                return callback(source.includes(valStr));
            },
            renderer(
                hotInstance: any,
                td: HTMLTableCellElement,
                row: number,
                col: number,
                prop: string | number,
                cellValue: string | number,
                cellProps: any
            ) {
                const match = variable.values.find(v => String(v.value) === String(cellValue));
                const display = match ? match.label : String(cellValue);
                textRenderer(hotInstance, td, row, col, prop, display, cellProps);
            },
        };
    }

    const columns = useMemo(() => {
        const variableMap = new Map(variables.map(v => [v.columnIndex, v]));
        const getAlignmentClass = (align: VariableAlign | undefined): string => {
            switch (align) {
                case 'left': return 'htLeft';
                case 'center': return 'htCenter';
                case 'right': return 'htRight';
                default: return 'htLeft'; // Default alignment
            }
        };

        const dateValidator = (value: any, callback: (isValid: boolean) => void) => {
            if (value === null || value === '' || /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/.test(value)) {
                callback(true);
            } else {
                callback(false);
            }
        };

        // Generate column configs: data columns, skeleton editable, and spare column
        const generatedColumns = Array(displayNumCols).fill(null).map((_, colIndex) => {
            if (colIndex < actualNumCols) {
                // Existing variable column: editable with alignment and truncate for strings
                const variable = variableMap.get(colIndex);
                const baseConfig = getColumnConfig(variable);
                const alignClass = getAlignmentClass(variable?.align);
                const truncateClass = variable?.type === 'STRING' ? 'truncate-cell' : '';
                const dropdown = getDropdownColumnConfig(viewMode, variable, colIndex, data, alignClass, truncateClass);
                if (dropdown) return dropdown;
                return { data: colIndex, readOnly: false, className: `${alignClass} ${truncateClass}`.trim(), ...baseConfig };
            } else if (colIndex < targetVisualDataCols) {
                // Editable skeleton column
                return { data: colIndex, readOnly: false, type: 'text', className: 'htLeft', width: DEFAULT_COLUMN_WIDTH };
            } else {
                // Spare column for adding new variable
                return { data: colIndex, readOnly: false, ...getDefaultSpareColumnConfig(), width: DEFAULT_COLUMN_WIDTH };
            }
        });
        return generatedColumns;
    }, [data, variables, actualNumCols, targetVisualDataCols, displayNumCols, viewMode]);

    return {
        colHeaders,
        displayMatrix,
        columns,
    };
}; 