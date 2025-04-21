export interface Cell {
    id?: number;
    col: number;
    row: number;
    value: string | number;
}

export type DataRow = (string | number)[];