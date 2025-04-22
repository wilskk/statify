import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

export const colHeaders = [
    'Name',
    'Type',
    'Width',
    'Decimals',
    'Label',
    'Values',
    'Missing',
    'Columns',
    'Align',
    'Measure',
    'Role'
];

export const columns: Handsontable.GridSettings['columns'] = [
    {
        data: 0,
        type: 'text',
        width: 200,
    },
    {
        data: 1,
        type: 'text',
        width: 125,
        readOnly: false,
    },
    {
        data: 2,
        type: 'numeric',
        numericFormat: { pattern: '0' },
        width: 100,
    },
    {
        data: 3,
        type: 'numeric',
        numericFormat: { pattern: '0' },
        width: 100,
    },
    {
        data: 4,
        type: 'text',
        width: 175,
    },
    {
        data: 5,
        type: 'text',
        width: 175,
    },
    {
        data: 6,
        type: 'text',
        width: 175,
    },
    {
        data: 7,
        type: 'numeric',
        numericFormat: { pattern: '0' },
        width: 100,
    },
    {
        data: 8,
        type: 'dropdown',
        source: ['left', 'right', 'center'],
        width: 125,
    },
    {
        data: 9,
        type: 'dropdown',
        strict: true,
        allowInvalid: false,
        width: 125,
    },
    {
        data: 10,
        type: 'dropdown',
        source: ['input', 'target', 'both', 'none', 'partition', 'split'],
        strict: true,
        allowInvalid: false,
        width: 125,
    },
];