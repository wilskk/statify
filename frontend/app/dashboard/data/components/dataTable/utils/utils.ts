import Handsontable from 'handsontable';
import {
    textRenderer,
    numericRenderer,
} from 'handsontable/renderers';
import { DEFAULT_COLUMN_WIDTH } from '../constants';
import { Variable } from '@/types/Variable';

/**
 * Enhanced renderer that prevents word breaking and ensures proper text overflow handling
 */
const enhancedTextRenderer = (
    instance: any,
    td: HTMLTableCellElement,
    row: number,
    col: number,
    prop: string | number,
    value: any,
    cellProperties: any
) => {
    // Apply the base text renderer first
    textRenderer(instance, td, row, col, prop, value, cellProperties);
    
    // Apply enhanced CSS properties to prevent word breaking
    td.style.whiteSpace = 'nowrap';
    td.style.overflow = 'hidden';
    td.style.textOverflow = 'ellipsis';
    td.style.wordBreak = 'keep-all';
    td.style.wordWrap = 'normal';
    td.style.hyphens = 'none';
    td.style.overflowWrap = 'normal';
    td.style.lineHeight = '1.2';
    td.style.maxWidth = '100%';
    
    // Add title attribute for full text on hover
    if (value && String(value).length > 0) {
        td.title = String(value);
    }
};

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
        enhancedTextRenderer(instance, td, row, col, prop, '', cellProperties);
    } else {
        renderer(instance, td, row, col, prop, value, cellProperties);
        
        // Apply enhanced CSS properties to all rendered cells
        td.style.whiteSpace = 'nowrap';
        td.style.overflow = 'hidden';
        td.style.textOverflow = 'ellipsis';
        td.style.wordBreak = 'keep-all';
        td.style.wordWrap = 'normal';
        td.style.hyphens = 'none';
        td.style.overflowWrap = 'normal';
        td.style.lineHeight = '1.2';
        td.style.maxWidth = '100%';
        
        // Add title attribute for full text on hover
        if (value && String(value).length > 0) {
            td.title = String(value);
        }
    }
};

// Helper function for default spare column config
export const getDefaultSpareColumnConfig = (): Handsontable.ColumnSettings => ({
    type: 'text',
    width: DEFAULT_COLUMN_WIDTH,
    className: 'htDimmed',
    readOnly: false, // Allow typing
});

/**
 * Creates a custom Handsontable validator for columns with value labels.
 * This validator provides a hybrid behavior:
 * - It allows any valid numeric input.
 * - It allows any defined label (case-insensitive).
 * - It rejects any other string, preventing random text input.
 * @param variable The variable configuration containing the value labels.
 * @returns A Handsontable validator function.
 */
const createHybridAutocompleteValidator = (variable: Variable) => {
    return function(value: any, callback: (isValid: boolean) => void) {
        // Allow empty values.
        if (value === null || value === undefined || value === '') {
            return callback(true);
        }

        const sValue = String(value).trim();

        // 1. Check if it matches a label (case-insensitive).
        if (variable.values?.some(v => v.label.toLowerCase() === sValue.toLowerCase())) {
            return callback(true);
        }

        // 2. Check if it's a valid numeric input.
        if (sValue !== '' && !isNaN(Number(sValue))) {
            return callback(true);
        }
        
        // If it's neither a known label nor a number, it's invalid.
        callback(false);
    };
};

export const getColumnConfig = (variable: Variable | undefined, viewMode: 'numeric' | 'label' = 'numeric'): Handsontable.ColumnSettings => {
    if (!variable || !variable.type) {
        return { 
            type: 'text',
            width: variable?.columns ?? DEFAULT_COLUMN_WIDTH,
        };
    }

    const type = variable.type;
    let config: Handsontable.ColumnSettings = {};

    // Create value map for O(1) lookup instead of find()
    const valueMap = variable.values ? new Map(variable.values.map(v => [v.value, v])) : null;

    // Prevent matching empty string to numeric zero when searching for labels
    const mapValueToLabel = (rawValue: any) => {
        // Do not attempt to find a label for truly empty cells
        if (rawValue === '' || rawValue === null || rawValue === undefined) {
            return undefined;
        }
        // Use Map for O(1) lookup instead of find()
        return valueMap?.get(rawValue);
    };

    const valueLabelRenderer = (baseRenderer: Function) => nullSafeRenderer((
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
            const foundLabel = mapValueToLabel(value);
            if (foundLabel) {
                displayValue = foundLabel.label;
            }
        }
        baseRenderer(hotInstance, td, row, col, prop, displayValue, cellProperties);
    });

    if (viewMode === 'label' && variable.values && variable.values.length > 0) {
        config.type = 'autocomplete';
        config.source = variable.values.map(v => v.label);
        config.strict = false; // Let our custom validator handle logic
        config.allowInvalid = false; // DISALLOW invalid values completely
        config.validator = createHybridAutocompleteValidator(variable);
        config.renderer = valueLabelRenderer(enhancedTextRenderer);
    } else {
        switch (type) {
            case 'NUMERIC':
                config.type = 'numeric';
                config.renderer = valueLabelRenderer(numericRenderer);
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
                config.renderer = valueLabelRenderer(enhancedTextRenderer);
                break;
        }
    }


    if (variable.align) {
        config.className = `ht${variable.align.charAt(0).toUpperCase() + variable.align.slice(1)}`;
    }

    // Set column width from variable configuration
    config.width = variable.columns ?? DEFAULT_COLUMN_WIDTH;

    return config;
};

export const areValuesEqual = (val1: any, val2: any): boolean => {
    if (val1 === '' || val1 === null || val1 === undefined) {
        return val2 === '' || val2 === null || val2 === undefined;
    }
    return val1 === val2;
};