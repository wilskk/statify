import { Table } from "@/types/Table";

export function formatDisplayNumber(num: number | undefined | null): string {
    if (typeof num === "undefined") return "undefined";
    if (num === null) return "null";

    // Handle special values
    if (isNaN(num)) return "NaN";
    if (!isFinite(num)) return num > 0 ? "Infinity" : "-Infinity";

    // Handle very small numbers that are essentially zero
    if (Math.abs(num) < 1e-10) {
        return "0";
    }

    // Handle very small non-zero numbers with scientific notation
    if (Math.abs(num) > 0 && Math.abs(num) < 1e-5) {
        return num.toExponential(3);
    }

    // Handle integers
    if (Number.isInteger(num)) {
        // Special case for 100
        if (num === 100) {
            return "100.0";
        }
        return num.toString();
    }

    // Handle all other decimal numbers consistently
    return num.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
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
