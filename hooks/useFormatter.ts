import { Table } from "@/types/Table";

export function formatDisplayNumber(
    num: number | undefined | null
): string | null {
    if (typeof num === "undefined" || num === null) return null;

    if (Number.isInteger(num)) {
        return num.toString();
    } else {
        if (num === 100) {
            return "100.0";
        } else if (num < 1 && num > 0) {
            return num.toFixed(3).replace(/0+$/, "");
        } else {
            return num.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
        }
    }
}

// Helper function to ensure columnHeaders are sufficient for all rows
export function ensureEnoughHeaders(table: Table): Table {
    if (!table.rows || table.rows.length === 0) return table;

    // Get all unique column keys from all rows
    const allKeys = new Set<string>();
    table.rows.forEach((row) => {
        Object.keys(row).forEach((key) => {
            if (key !== "rowHeader") allKeys.add(key);
        });
    });

    // Check current column headers (excluding rowHeader columns)
    let headerCount = table.columnHeaders.length;
    const rowHeaderCount = table.rows[0].rowHeader
        ? Array.isArray(table.rows[0].rowHeader)
            ? table.rows[0].rowHeader.length
            : 1
        : 0;

    // Calculate how many non-rowHeader columns we have
    const dataColumnCount = allKeys.size;

    // Add empty headers if needed
    while (headerCount < rowHeaderCount + dataColumnCount) {
        table.columnHeaders.push({ header: "" });
        headerCount++;
    }

    return table;
}
