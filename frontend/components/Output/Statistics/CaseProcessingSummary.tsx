import React from "react";
import DataTableRenderer from "@/components/Output/Table/DataTableRenderer";

type TableData = {
    title?: string;
    columnHeaders?: Array<{ header: string; key?: string; children?: unknown[] }>;
    rows?: Array<{ rowHeader?: (string | null)[]; [key: string]: unknown }>;
    note?: string;
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

    return <DataTableRenderer data={JSON.stringify({ tables: [table] })} align="left" />;
};

export default CaseProcessingSummary;
