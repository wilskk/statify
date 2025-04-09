// clustering-formatter.ts
import { ResultJson, Table } from "@/types/Table";
import { ensureEnoughHeaders, formatDisplayNumber } from "@/hooks/useFormatter";

export function transformClusteringResult(data: any): ResultJson {
    const resultJson: ResultJson = {
        tables: [],
    };

    // 1. Case Processing Summary
    if (data.case_processing_summary) {
        const cps = data.case_processing_summary;
        const table: Table = {
            key: "case_processing_summary",
            title: "Case Processing Summary",
            columnHeaders: [
                { header: "Cases" },
                { header: "N" },
                { header: "Percent" },
            ],
            rows: [
                {
                    rowHeader: ["Valid"],
                    N: formatDisplayNumber(cps.valid_cases),
                    Percent: formatDisplayNumber(cps.valid_percent),
                },
                {
                    rowHeader: ["Missing"],
                    N: formatDisplayNumber(cps.missing_cases),
                    Percent: formatDisplayNumber(cps.missing_percent),
                },
                {
                    rowHeader: ["Total"],
                    N: formatDisplayNumber(cps.total_cases),
                    Percent: formatDisplayNumber(cps.total_percent),
                },
            ],
        };

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 2. Proximity Matrix
    if (data.proximity_matrix) {
        const pm = data.proximity_matrix;
        const cases = new Set<string>();

        // Extract unique case names
        Object.keys(pm.distances).forEach((key) => {
            const [case1, case2] = key.replace(/[()]/g, "").split(",");
            cases.add(case1.trim());
            cases.add(case2.trim());
        });

        const sortedCases = Array.from(cases).sort();

        const table: Table = {
            key: "proximity_matrix",
            title: "Proximity Matrix (Squared Euclidean Distance)",
            columnHeaders: [
                { header: "Case" },
                ...sortedCases.map((c) => ({ header: c })),
            ],
            rows: [],
        };

        sortedCases.forEach((rowCase) => {
            const rowData: any = {
                rowHeader: [rowCase],
            };

            sortedCases.forEach((colCase) => {
                const distance =
                    pm.distances[`(${rowCase}, ${colCase})`] ||
                    pm.distances[`(${colCase}, ${rowCase})`] ||
                    (rowCase === colCase ? 0 : null);

                if (distance !== null) {
                    rowData[colCase] = formatDisplayNumber(distance);
                }
            });

            table.rows.push(rowData);
        });

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 3. Agglomeration Schedule
    if (data.agglomeration_schedule) {
        const as = data.agglomeration_schedule;
        const table: Table = {
            key: "agglomeration_schedule",
            title: "Agglomeration Schedule",
            columnHeaders: [
                { header: "Stage" },
                { header: "Cluster Combined" },
                { header: "Coefficients" },
                { header: "Stage Cluster First Appears" },
                { header: "Cluster 1" },
                { header: "Cluster 2" },
                { header: "Next Stage" },
            ],
            rows: [],
        };

        as.stages.forEach((stage: any, index: number) => {
            table.rows.push({
                rowHeader: [null],
                Stage: formatDisplayNumber(index + 1),
                "Cluster Combined": `${stage.clusters_combined[0]} ${stage.clusters_combined[1]}`,
                Coefficients: formatDisplayNumber(stage.coefficients),
                "Stage Cluster First Appears": `${stage.cluster_first_appears[0]} ${stage.cluster_first_appears[1]}`,
                "Cluster 1": formatDisplayNumber(stage.clusters_combined[0]),
                "Cluster 2": formatDisplayNumber(stage.clusters_combined[1]),
                "Next Stage": formatDisplayNumber(stage.next_stage),
            });
        });

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    return resultJson;
}
