import React from "react";

type ColumnHeader = { header: string; key?: string };
type TableRow = { rowHeader?: (string | null)[];[key: string]: unknown };
type TableData = {
    title?: string;
    columnHeaders?: ColumnHeader[];
    rows?: TableRow[];
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
    const headers = table?.columnHeaders ?? [];
    const rows = table?.rows ?? [];

    if (!headers.length) {
        return <div className="text-destructive">Case Processing Summary has no headers</div>;
    }

    const colKeys = headers.map((h) => h.key || h.header);

    const getRowSpanForFirstHeader = (startIndex: number): number => {
        const startHeaders = rows[startIndex]?.rowHeader || ["", ""];
        const startValue = startHeaders[0] ?? "";
        if (!startValue) return 1;

        let span = 1;
        for (let i = startIndex + 1; i < rows.length; i++) {
            const nextHeaders = rows[i]?.rowHeader || ["", ""];
            const nextValue = nextHeaders[0] ?? "";
            if (nextValue !== startValue) break;
            span += 1;
        }
        return span;
    };

    const shouldRenderFirstHeader = (rowIndex: number): boolean => {
        if (rowIndex === 0) return true;
        const current = (rows[rowIndex]?.rowHeader || ["", ""])[0] ?? "";
        const prev = (rows[rowIndex - 1]?.rowHeader || ["", ""])[0] ?? "";
        return current !== prev;
    };

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse border border-border">
                <thead>
                    <tr>
                        <th
                            colSpan={Math.max(3, headers.length + 2)}
                            className="border border-border bg-muted px-2 py-2 text-center text-sm font-semibold"
                        >
                            {table?.title || "Case Processing Summary"}
                        </th>
                    </tr>
                    <tr>
                        <th className="border border-border bg-muted px-2 py-1 text-left text-sm font-medium"></th>
                        <th className="border border-border bg-muted px-2 py-1 text-left text-sm font-medium"></th>
                        {headers.map((h) => (
                            <th
                                key={h.key || h.header}
                                className="border border-border bg-muted px-2 py-1 text-center text-sm font-medium"
                            >
                                {h.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => {
                        const rh = row.rowHeader || ["", ""];
                        const renderFirstHeader = shouldRenderFirstHeader(idx);
                        const firstHeaderRowSpan = renderFirstHeader ? getRowSpanForFirstHeader(idx) : 0;

                        return (
                            <tr key={idx}>
                                {renderFirstHeader && (
                                    <th
                                        rowSpan={firstHeaderRowSpan}
                                        className="border border-border bg-muted px-2 py-1 text-center align-middle text-sm font-normal whitespace-nowrap"
                                    >
                                        {rh[0] ?? ""}
                                    </th>
                                )}
                                <th className="border border-border bg-muted px-2 py-1 text-left text-sm font-normal whitespace-nowrap">
                                    {rh[1] ?? ""}
                                </th>
                                {colKeys.map((k) => (
                                    <td
                                        key={`${idx}-${k}`}
                                        className="border border-border px-2 py-1 text-center text-sm whitespace-nowrap"
                                    >
                                        {String(row[k] ?? "")}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default CaseProcessingSummary;
