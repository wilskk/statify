// @ts-ignore
import { ColumnSettings } from 'handsontable/settings';
import { Variable } from '@/types/Variable';
import { DEFAULT_COLUMN_WIDTH } from '../constants';
import { textRenderer } from 'handsontable/renderers';

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
            // Truncate string values based on variable.columns length
            config.renderer = (
                hotInstance: any,
                td: HTMLTableCellElement,
                row: number,
                col: number,
                prop: number | string,
                value: any,
                cellProperties: any
            ) => {
                let displayValue: any = value;
                if (typeof value === 'string' && variable.columns !== undefined && value.length > variable.columns) {
                    displayValue = value.substring(0, variable.columns);
                }
                // Use Handsontable textRenderer
                textRenderer(hotInstance, td, row, col, prop, displayValue, cellProperties);
            };
            break;
    }

    config.width = variable.columns ?? DEFAULT_COLUMN_WIDTH;

    return config;
};

export const areValuesEqual = (val1: any, val2: any): boolean => {
    if (val1 === val2) return true;
    if ((val1 === null || val1 === undefined) && val2 === '') return true;
    if (val1 === '' && (val2 === null || val2 === undefined)) return true;
    return false;
};