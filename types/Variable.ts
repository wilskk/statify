export type ValueLabel = {
    id?: number;
    variableName: string;
    value: number | string;
    label: string;
};

export type VariableType =
    | "NUMERIC"
    | "COMMA"
    | "DOT"
    | "SCIENTIFIC"
    | "DATE"
    | "ADATE"
    | "EDATE"
    | "SDATE"
    | "JDATE"
    | "QYR"
    | "MOYR"
    | "WKYR"
    | "DATETIME"
    | "TIME"
    | "DTIME"
    | "WKDAY"
    | "MONTH"
    | "DOLLAR"
    | "CCA"
    | "CCB"
    | "CCC"
    | "CCD"
    | "CCE"
    | "STRING"
    | "RESTRICTED_NUMERIC";

export type VariableAlign = "right" | "left" | "center";

export type VariableMeasure = "scale" | "ordinal" | "nominal" | "unknown";

export type VariableRole = "input" | "target" | "both" | "none" | "partition" | "split";

export type Variable = {
    id?: number;
    columnIndex: number;
    name: string;
    type: VariableType;
    width: number;
    decimals: number;
    label?: string;
    values: ValueLabel[];
    missing: (number | string)[];
    columns: number;
    align: VariableAlign;
    measure: VariableMeasure;
    role: VariableRole;
};