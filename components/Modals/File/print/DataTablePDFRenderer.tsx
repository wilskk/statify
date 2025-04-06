"use client";

// Types
type Alignment = 'left' | 'center' | 'right';
type CellStyle = 'headerCell' | 'rowHeaderCell' | 'bodyCell';

interface ColumnHeader {
    header: string;
    key?: string;
    children?: ColumnHeader[];
}

interface TableRowData {
    rowHeader: (string | null)[];
    [key: string]: any;
    children?: TableRowData[];
}

interface TableData {
    title: string;
    columnHeaders: ColumnHeader[];
    rows: TableRowData[];
}

interface PDFCell {
    text: string;
    style: CellStyle;
    alignment: Alignment;
    rowSpan?: number;
    colSpan?: number;
}

interface DataTablePDFRendererProps {
    data: string;
}

interface TablesData {
    tables: TableData[];
}

type PDFTableCell = PDFCell | 'skip' | null | {};
type PDFTableRow = PDFTableCell[];
type PDFTableContent = PDFTableRow[];

// Utility functions
const getLeafPaths = (columns: ColumnHeader[], currentPath: string[] = []): string[][] => {
    let paths: string[][] = [];

    for (const col of columns) {
        const newPath = [...currentPath, col.header];

        if (col.children?.length) {
            paths = paths.concat(getLeafPaths(col.children, newPath));
        } else {
            paths.push(newPath);
        }
    }

    return paths;
};

const getLeafColumnKeys = (columns: ColumnHeader[]): string[] => {
    const keys: string[] = [];

    const traverse = (col: ColumnHeader): void => {
        if (!col.children?.length) {
            keys.push(col.key || col.header);
        } else {
            col.children.forEach(traverse);
        }
    };

    columns.forEach(traverse);
    return keys;
};

const propagateHeaders = (
    row: TableRowData,
    accumulated: (string | null)[]
): TableRowData[] => {
    const combined: (string | null)[] = [];
    const length = Math.max(accumulated.length, row.rowHeader.length);

    for (let i = 0; i < length; i++) {
        combined[i] = row.rowHeader[i] !== undefined
            ? row.rowHeader[i]
            : accumulated[i] !== undefined
                ? accumulated[i]
                : null;
    }

    if (row.children?.length) {
        return row.children.flatMap(child => propagateHeaders(child, combined));
    } else {
        const newRow = { ...row, rowHeader: combined };
        return [newRow];
    }
};

const flattenRows = (rows: TableRowData[]): TableRowData[] => {
    return rows.flatMap(row => propagateHeaders(row, []));
};

const computeMaxRowHeaderDepth = (rows: TableRowData[]): number => {
    return rows.reduce((max, row) => Math.max(max, row.rowHeader.length), 0);
};

const buildHeaderRows = (leafPaths: string[][], maxDepth: number): PDFTableContent => {
    const headerRows: PDFTableContent = [];

    for (let r = 0; r < maxDepth; r++) {
        const row: PDFTableRow = [];
        let i = 0;

        while (i < leafPaths.length) {
            if (leafPaths[i].length <= r) {
                i++;
                continue;
            }

            const text = leafPaths[i][r];
            let count = 1;

            while (
                i + count < leafPaths.length &&
                leafPaths[i + count].length > r &&
                leafPaths[i + count][r] === text
                ) {
                count++;
            }

            const rowSpan = leafPaths[i].length === r + 1 ? maxDepth - r : 1;
            const cell: PDFCell = {
                text,
                style: 'headerCell',
                alignment: 'center'
            };

            if (count > 1) cell.colSpan = count;
            if (rowSpan > 1) cell.rowSpan = rowSpan;

            row.push(cell);

            // Add empty cells for colSpan
            row.push(...Array(count - 1).fill({}));
            i += count;
        }

        headerRows.push(row);
    }

    return headerRows;
};

// Main component
export function DataTablePDFRenderer({ data }: DataTablePDFRendererProps) {
    let parsedData: TablesData;

    try {
        parsedData = JSON.parse(data) as TablesData;
    } catch {
        return [{ text: "Invalid JSON format", color: "red", fontSize: 10 }];
    }

    if (!parsedData.tables || !Array.isArray(parsedData.tables)) {
        return [{ text: "Invalid tables format", color: "red", fontSize: 10 }];
    }

    const content = [];

    for (const table of parsedData.tables) {
        const { title, columnHeaders, rows } = table;

        const leafPaths = getLeafPaths(columnHeaders);
        const maxDepth = Math.max(...leafPaths.map(p => p.length));
        const headerRows = buildHeaderRows(leafPaths, maxDepth);
        const allLeafCols = getLeafColumnKeys(columnHeaders);

        const flatRows = flattenRows(rows);
        if (flatRows.length === 0) continue;

        const rowHeaderCount = computeMaxRowHeaderDepth(flatRows);
        const dataCols = allLeafCols.slice(rowHeaderCount);
        const totalColumns = allLeafCols.length;
        const numRows = flatRows.length;

        // Process row headers with rowSpan
        const headerCells: (PDFCell | 'skip' | null)[][] = Array(numRows)
            .fill(null)
            .map(() => Array(rowHeaderCount).fill(null));

        for (let j = 0; j < rowHeaderCount; j++) {
            let i = 0;
            while (i < numRows) {
                const value = flatRows[i].rowHeader[j] || "";
                let count = 1;

                // Count consecutive identical values for rowSpan
                for (let k = i + 1; k < numRows; k++) {
                    if (flatRows[k].rowHeader[j] === value) count++;
                    else break;
                }

                headerCells[i][j] = {
                    text: value,
                    style: 'rowHeaderCell',
                    alignment: 'left'
                };

                if (count > 1) {
                    (headerCells[i][j] as PDFCell).rowSpan = count;

                    // Mark cells to be skipped due to rowSpan
                    for (let k = i + 1; k < i + count; k++) {
                        headerCells[k][j] = 'skip';
                    }
                }

                i += count;
            }
        }

        // Build the final table body
        const bodyRows: PDFTableContent = flatRows.map((row, i) => {
            const rowCells: PDFTableRow = [];

            // Add row header cells
            for (let j = 0; j < rowHeaderCount; j++) {
                rowCells.push(headerCells[i][j] !== 'skip' ? headerCells[i][j] : {});
            }

            // Add data cells
            for (const col of dataCols) {
                rowCells.push({
                    text: row[col] || "",
                    style: 'bodyCell',
                    alignment: 'center'
                });
            }

            return rowCells;
        });

        const tableBody = [...headerRows, ...bodyRows];

        content.push({ text: title, style: 'tableTitle' });
        content.push({
            table: {
                headerRows: headerRows.length,
                widths: Array(totalColumns).fill('*'),
                body: tableBody
            },
            layout: 'lightHorizontalLines',
        });
    }

    return content;
}

export default DataTablePDFRenderer;