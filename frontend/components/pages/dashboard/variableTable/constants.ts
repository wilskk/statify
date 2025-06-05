import { Variable } from "@/types/Variable";

export const DEFAULT_MIN_ROWS = 50;
export const DEFAULT_VARIABLE_TYPE = "NUMERIC";
export const DEFAULT_VARIABLE_WIDTH = 8;
export const DEFAULT_VARIABLE_DECIMALS = 2;

// Reorder indices: Measure after Decimals; last: Role, Columns, Align
export const COLUMN_INDEX = {
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

// Update field map to new column order
export const COLUMN_INDEX_TO_FIELD_MAP: (keyof Variable | string)[] = [
    "name", "type", "width", "decimals", "measure",
    "label", "values", "missing", "role", "columns", "align"
];

export const DIALOG_TRIGGER_COLUMNS = [
    COLUMN_INDEX.TYPE,
    COLUMN_INDEX.VALUES,
    COLUMN_INDEX.MISSING
];

export const VALIDATION_TRIGGER_FIELDS: (keyof Variable | string)[] = ["type", "width"];