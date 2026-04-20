import React from "react";
import DataTableRenderer from "@/components/Output/Table/DataTableRenderer";

type TableData = {
    title?: string;
    columnHeaders?: Array<{ header: string; key?: string; children?: unknown[] }>;
    rows?: Array<{ rowHeader?: (string | null)[]; [key: string]: unknown }>;
    note?: string | string[];
};

interface CaseProcessingSummaryProps {
    data: string | { tables?: TableData[] };
}

const CaseProcessingSummary: React.FC<CaseProcessingSummaryProps> = ({ data }) => {
    let parsed: { tables?: TableData[] } | null = null;

    try {
        parsed = typeof data === "string" ? JSON.parse(data) : data;
    } catch {
        return <div className="text-destructive">Invalid Case Processing Summary format</div>;
    }

    const table = parsed?.tables?.[0];
    if (!table?.columnHeaders?.length) {
        return <div className="text-destructive">Case Processing Summary has no headers</div>;
    }

    // Normalize rows for DataTableRenderer:
    // - Keep only true data rows in tbody
    // - Move descriptive rows (a./b./c. notes) to footer
    const sourceRows = table.rows ?? [];
    const dataRows = sourceRows.filter((row) =>
        Object.keys(row).some(
            (k) =>
                k !== "rowHeader" &&
                row[k] !== null &&
                row[k] !== undefined &&
                String(row[k]).trim() !== ""
        )
    );

    const noteRows = sourceRows
        .filter((row) =>
            !Object.keys(row).some(
                (k) =>
                    k !== "rowHeader" &&
                    row[k] !== null &&
                    row[k] !== undefined &&
                    String(row[k]).trim() !== ""
            )
        )
        .map((row) => (row.rowHeader ?? []).filter(Boolean).join(" ").trim())
        .filter(Boolean);

    const existingFooterLines =
        typeof table.note === "string"
            ? table.note.split("\n")
            : Array.isArray(table.note)
            ? table.note
            : [];

    const normalizedTable: TableData = {
        ...table,
        rows: dataRows.map((row) => ({ ...row, rowHeader: [] })),
        footer: [...existingFooterLines, ...noteRows],
    } as TableData & { footer?: string[] };

    return <DataTableRenderer data={JSON.stringify({ tables: [normalizedTable] })} align="left" />;
};

export default CaseProcessingSummary;
