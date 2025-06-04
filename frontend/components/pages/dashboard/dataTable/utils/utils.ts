import Handsontable from 'handsontable';
// @ts-ignore
import { ColumnSettings } from 'handsontable/settings';
import { Variable } from '@/types/Variable';
import { DEFAULT_COLUMN_WIDTH, DEFAULT_MIN_COLUMNS, MIN_ROWS } from '../constants';

// Helper function for default spare column config
export const getDefaultSpareColumnConfig = (): ColumnSettings => ({
    type: 'text',
    width: DEFAULT_COLUMN_WIDTH,
    className: 'htDimmed',
    readOnly: false, // Allow typing
});

export const getColumnConfig = (variable?: Variable): ColumnSettings => {
    if (!variable) {
        return { width: DEFAULT_COLUMN_WIDTH };
    }

    const type = variable.type ?? 'STRING';
    let config: ColumnSettings = {};

    switch (type) {
        case 'NUMERIC':
            config.type = 'numeric';
            config.numericFormat = {
                pattern: `0.${'0'.repeat(variable.decimals ?? 0)}`,
                culture: 'en-US',
            };
            config.allowInvalid = false;
            config.validator = (value: any, callback: (valid: boolean) => void) => {
                const valid = value === '' || value === null ||
                    (typeof value === 'number' && !isNaN(value)) ||
                    (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value)));
                callback(valid);
            };
            break;
        case 'DATE':
            config.type = 'date';
            config.dateFormat = 'MM/DD/YYYY';
            config.correctFormat = true;
            config.allowInvalid = false;
            config.validator = 'date';
            break;
        case 'STRING':
        default:
            config.type = 'text';
            break;
    }

    config.width = variable.columns ?? DEFAULT_COLUMN_WIDTH;

    return config;
};

// Remove unused getDisplayMatrix function
/*
export const getDisplayMatrix = (
    stateData: (string | number | null)[][],
    varCount: number
): (string | number | null)[][] => {
    const defaultCols = Math.max(DEFAULT_MIN_COLUMNS, varCount);
    const stateRows = stateData?.length || 0;
    const stateCols = stateRows > 0 && stateData[0] ? stateData[0].length : 0;

    const newRows = Math.max(MIN_ROWS, stateRows);
    const newCols = Math.max(defaultCols, stateCols);

    return Array.from({ length: newRows }, (_, rowIndex) => {
        const row = rowIndex < stateRows ? stateData[rowIndex] : [];
        const fullRow = Array.from({ length: newCols }, (_, colIndex) =>
            colIndex < (row?.length ?? 0) ? row[colIndex] : null
        );
        return fullRow;
    });
};
*/

export const areValuesEqual = (val1: any, val2: any): boolean => {
    if (val1 === val2) return true;
    if ((val1 === null || val1 === undefined) && val2 === '') return true;
    if (val1 === '' && (val2 === null || val2 === undefined)) return true;
    return false;
};