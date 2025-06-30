import Handsontable from 'handsontable';
import {
    textRenderer,
    numericRenderer,
} from 'handsontable/renderers';
import { DEFAULT_COLUMN_WIDTH } from '../constants';
import { Variable } from '@/types/Variable';

const nullSafeRenderer = (
    renderer: (...args: any[]) => void
) => (
    instance: any,
    td: HTMLTableCellElement,
    row: number,
    col: number,
    prop: string | number,
    value: any,
    cellProperties: any
) => {
    if (value === null || value === undefined) {
        textRenderer(instance, td, row, col, prop, '', cellProperties);
    } else {
        renderer(instance, td, row, col, prop, value, cellProperties);
    }
};

// Helper function for default spare column config
export const getDefaultSpareColumnConfig = (): Handsontable.ColumnSettings => ({
    type: 'text',
    width: DEFAULT_COLUMN_WIDTH,
    className: 'htDimmed',
    readOnly: false, // Allow typing
});

export const getColumnConfig = (variable: Variable | undefined, viewMode: 'numeric' | 'label' = 'numeric'): Handsontable.ColumnSettings => {
    if (!variable || !variable.type) {
        return { 
            type: 'text',
            width: variable?.columns ?? DEFAULT_COLUMN_WIDTH,
        };
    }

    const type = variable.type;
    let config: Handsontable.ColumnSettings = {};

    switch (type) {
        case 'NUMERIC':
            config.type = 'numeric';
            config.renderer = nullSafeRenderer(numericRenderer);
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
        case 'DOT':
            config.numericFormat = { pattern: '0.[00]' };
            break;
        case 'DATE':
            config.type = 'date';
            config.dateFormat = 'DD-MM-YYYY';
            config.correctFormat = true;
            break;
        case 'STRING':
        default:
            config.type = 'text';
            config.renderer = nullSafeRenderer((
                hotInstance: any,
                td: HTMLTableCellElement,
                row: number,
                col: number,
                prop: number | string,
                value: any,
                cellProperties: any
            ) => {
                let displayValue: any = value;

                if (viewMode === 'label' && variable.values && variable.values.length > 0) {
                    const foundLabel = variable.values.find(v => v.value === value);
                    if (foundLabel) {
                        displayValue = foundLabel.label;
                    }
                }

                if (typeof value === 'string' && variable.width !== undefined && value.length > variable.width) {
                    displayValue = value.substring(0, variable.width);
                }
                textRenderer(hotInstance, td, row, col, prop, displayValue, cellProperties);
            });
            break;
    }

    config.width = variable.columns ?? DEFAULT_COLUMN_WIDTH;

    return config;
};

export const areValuesEqual = (val1: any, val2: any): boolean => {
    if (val1 === '' || val1 === null || val1 === undefined) {
        return val2 === '' || val2 === null || val2 === undefined;
    }
    return val1 === val2;
};