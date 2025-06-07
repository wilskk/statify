import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import { VariableType } from '@/types/Variable';

// Updated headers: Measure after Decimals; last columns: Role, Columns, Align
export const colHeaders = [
    'Name',
    'Type',
    'Width',
    'Decimals',
    'Measure',
    'Label',
    'Values',
    'Missing',
    'Role',
    'Columns',
    'Align'
];

// SPSS Variable Types list
const VARIABLE_TYPES: VariableType[] = [
  'NUMERIC','COMMA','DOT','SCIENTIFIC','DATE','ADATE','EDATE',
  'SDATE','JDATE','QYR','MOYR','WKYR','DATETIME','TIME','DTIME',
  'WKDAY','MONTH','DOLLAR','CCA','CCB','CCC','CCD','CCE','STRING',
  'RESTRICTED_NUMERIC'
];

// Updated column configs to match new order and data indices
export const columns: Handsontable.GridSettings['columns'] = [
    { data: 0, type: 'text', numericFormat: undefined, width: 200 },        // Name
    {
      data: 1,
      type: 'dropdown',
      source: VARIABLE_TYPES,
      strict: false,
      allowInvalid: true,
      validator: (value: any, callback: (valid: boolean) => void) => {
        const valid = value === '' || VARIABLE_TYPES.includes(value);
        callback(valid);
      },
      width: 125,
      readOnly: false
    }, // Type
    { data: 2, type: 'numeric', numericFormat: { pattern: '0' }, width: 100 },// Width
    { data: 3, type: 'numeric', numericFormat: { pattern: '0' }, width: 100 },// Decimals
    { data: 4, type: 'dropdown', width: 125 },                               // Measure (cells hook sets source/class)
    { data: 5, type: 'text', width: 175 },                                   // Label
    { data: 6, type: 'text', width: 175 },                                   // Values
    { data: 7, type: 'text', width: 175 },                                   // Missing
    { data: 8, type: 'dropdown', source: ['input','target','both','none','partition','split'], strict: true, allowInvalid: false, width: 125 }, // Role
    { data: 9, type: 'numeric', numericFormat: { pattern: '0' }, width: 100 },// Columns
    { data: 10, type: 'dropdown', source: ['left','right','center'], width: 125 } // Align
];