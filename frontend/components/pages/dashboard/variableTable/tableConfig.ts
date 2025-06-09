import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import { VariableType, Variable } from '@/types/Variable';

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
      className: 'htDropdownCell',
      readOnly: false
    }, // Type
    { data: 2, type: 'numeric', numericFormat: { pattern: '0' }, width: 100 },// Width
    { data: 3, type: 'numeric', numericFormat: { pattern: '0' }, width: 100 },// Decimals
    { data: 4, type: 'dropdown', width: 125, className: 'htDropdownCell' },    // Measure (cells hook sets source/class)
    { data: 5, type: 'text', width: 175 },                                   // Label
    { data: 6, type: 'text', width: 175 },                                   // Values
    { data: 7, type: 'text', width: 175 },                                   // Missing
    { data: 8, type: 'dropdown', source: ['input','target','both','none','partition','split'], strict: true, allowInvalid: false, width: 125, className: 'htDropdownCell' }, // Role
    { data: 9, type: 'numeric', numericFormat: { pattern: '0' }, width: 100 },// Columns
    { data: 10, type: 'dropdown', source: ['left','right','center'], width: 125, className: 'htDropdownCell' } // Align
];

// Default UI constants
export const DEFAULT_MIN_ROWS = 50;
export const DEFAULT_VARIABLE_TYPE: Variable['type'] = "NUMERIC";
export const DEFAULT_VARIABLE_WIDTH = 8;
export const DEFAULT_VARIABLE_DECIMALS = 2;

// Column index mapping & field map
export const COLUMN_INDEX: Record<string, number> = {
    NAME: 0,
    TYPE: 1,
    WIDTH: 2,
    DECIMALS: 3,
    MEASURE: 4,
    LABEL: 5,
    VALUES: 6,
    MISSING: 7,
    ROLE: 8,
    COLUMNS: 9,
    ALIGN: 10,
};
export const COLUMN_INDEX_TO_FIELD_MAP: (keyof Variable | string)[] = [
    "name", "type", "width", "decimals", "measure",
    "label", "values", "missing", "role", "columns", "align"
];

// Dialog and validation triggers
export const DIALOG_TRIGGER_COLUMNS = [
    COLUMN_INDEX.TYPE,
    COLUMN_INDEX.VALUES,
    COLUMN_INDEX.MISSING
];
export const VALIDATION_TRIGGER_FIELDS: (keyof Variable | string)[] = [
    "type", "width", "decimals"
];