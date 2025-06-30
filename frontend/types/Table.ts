export interface ResultJson {
    tables: Table[];
}

export interface Table {
    key: string;
    title: string;
    columnHeaders: ColumnHeader[];
    rows: Row[];
}

interface ColumnHeader {
    header: string;
    key?: string;
    children?: ColumnHeader[];
}

export interface Row {
    rowHeader: (string | null)[];
    [key: string]: string | number | null | undefined | Row[] | (string | null)[];
    children?: Row[];
}
