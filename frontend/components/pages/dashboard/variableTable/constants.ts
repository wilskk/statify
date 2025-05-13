import { Variable } from "@/types/Variable";

export const DEFAULT_MIN_ROWS = 50;
export const DEFAULT_VARIABLE_TYPE = "NUMERIC";
export const DEFAULT_VARIABLE_WIDTH = 8;
export const DEFAULT_VARIABLE_DECIMALS = 2;

export const COLUMN_INDEX = {
    NAME: 0,
    TYPE: 1,
    WIDTH: 2,
    DECIMALS: 3,
    LABEL: 4,
    VALUES: 5,
    MISSING: 6,
    COLUMNS: 7,
    ALIGN: 8,
    MEASURE: 9,
    ROLE: 10,
};

export const COLUMN_INDEX_TO_FIELD_MAP: (keyof Variable | string)[] = [
    "name", "type", "width", "decimals", "label",
    "values", "missing", "columns", "align", "measure", "role"
];

export const DIALOG_TRIGGER_COLUMNS = [
    COLUMN_INDEX.TYPE,
    COLUMN_INDEX.VALUES,
    COLUMN_INDEX.MISSING
];

export const VALIDATION_TRIGGER_FIELDS: (keyof Variable | string)[] = ["type", "width"];