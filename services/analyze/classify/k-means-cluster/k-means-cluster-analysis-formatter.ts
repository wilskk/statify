// clustering-results-formatter.ts
import { ensureEnoughHeaders, formatDisplayNumber } from "@/hooks/useFormatter";
import { ResultJson, Table } from "@/types/Table";

export function transformKMeansResult(data: any): ResultJson {
    const resultJson: ResultJson = {
        tables: [],
    };

    // 1. Initial Cluster Centers
    if (data.initial_centers) {
        const initialCenters = data.initial_centers;
        const variables = Object.keys(initialCenters.centers);
        const clusterCount = initialCenters.centers[variables[0]]?.length || 0;

        const table: Table = {
            key: "initial_cluster_centers",
            title: "Initial Cluster Centers",
            columnHeaders: [
                { header: "Variable" },
                ...Array.from({ length: clusterCount }, (_, i) => ({
                    header: `Cluster ${i + 1}`,
                })),
            ],
            rows: [],
        };

        variables.forEach((variable) => {
            const rowData: any = {
                rowHeader: [variable],
            };

            for (let i = 0; i < clusterCount; i++) {
                rowData[`Cluster ${i + 1}`] = formatDisplayNumber(
                    initialCenters.centers[variable]?.[i]
                );
            }

            table.rows.push(rowData);
        });

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 2. Iteration History
    if (data.iteration_history) {
        const iterHistory = data.iteration_history;
        const clusterKeys = iterHistory.iterations[0]?.changes
            ? Object.keys(iterHistory.iterations[0].changes)
            : [];

        const table: Table = {
            key: "iteration_history",
            title: "Iteration History",
            columnHeaders: [
                { header: "Iteration" },
                ...clusterKeys.map((key) => ({
                    header: `Change in Cluster Center ${key.replace(
                        "Cluster ",
                        ""
                    )}`,
                })),
            ],
            rows: [],
        };

        iterHistory.iterations.forEach((iteration) => {
            const rowData: any = {
                rowHeader: [],
                Iteration: formatDisplayNumber(iteration.iteration),
            };

            clusterKeys.forEach((key) => {
                rowData[
                    `Change in Cluster Center ${key.replace("Cluster ", "")}`
                ] = formatDisplayNumber(iteration.changes[key]);
            });

            table.rows.push(rowData);
        });

        if (iterHistory.convergence_note) {
            table.rows.push({
                rowHeader: [iterHistory.convergence_note],
                Iteration: null,
                ...Object.fromEntries(
                    clusterKeys.map((key) => [
                        `Change in Cluster Center ${key.replace(
                            "Cluster ",
                            ""
                        )}`,
                        null,
                    ])
                ),
            });
        }

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 3. Cluster Membership
    if (data.cluster_membership) {
        const clusterMembership = data.cluster_membership;

        const table: Table = {
            key: "cluster_membership",
            title: "Cluster Membership",
            columnHeaders: [
                { header: "Case Number" },
                { header: "Cluster" },
                { header: "Distance" },
            ],
            rows: [],
        };

        clusterMembership.forEach((member) => {
            table.rows.push({
                rowHeader: [],
                "Case Number": formatDisplayNumber(member.case_number),
                Cluster: formatDisplayNumber(member.cluster),
                Distance: formatDisplayNumber(member.distance),
            });
        });

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 4. Final Cluster Centers
    if (data.final_cluster_centers) {
        const finalCenters = data.final_cluster_centers;
        const variables = Object.keys(finalCenters.centers);
        const clusterCount = finalCenters.centers[variables[0]]?.length || 0;

        const table: Table = {
            key: "final_cluster_centers",
            title: "Final Cluster Centers",
            columnHeaders: [
                { header: "Variable" },
                ...Array.from({ length: clusterCount }, (_, i) => ({
                    header: `Cluster ${i + 1}`,
                })),
            ],
            rows: [],
        };

        variables.forEach((variable) => {
            const rowData: any = {
                rowHeader: [variable],
            };

            for (let i = 0; i < clusterCount; i++) {
                rowData[`Cluster ${i + 1}`] = formatDisplayNumber(
                    finalCenters.centers[variable]?.[i]
                );
            }

            table.rows.push(rowData);
        });

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 5. Distances between Final Cluster Centers
    if (data.distances_between_centers) {
        const distances = data.distances_between_centers;
        const clusterCount = distances.distances.length;

        const table: Table = {
            key: "distances_between_centers",
            title: "Distances between Final Cluster Centers",
            columnHeaders: [
                { header: "Cluster" },
                ...Array.from({ length: clusterCount }, (_, i) => ({
                    header: `${i + 1}`,
                })),
            ],
            rows: [],
        };

        for (let i = 0; i < clusterCount; i++) {
            const rowData: any = {
                rowHeader: [`${i + 1}`],
            };

            for (let j = 0; j < clusterCount; j++) {
                rowData[`${j + 1}`] = formatDisplayNumber(
                    distances.distances[i]?.[j]
                );
            }

            table.rows.push(rowData);
        }

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 6. ANOVA Table
    if (data.anova) {
        const anova = data.anova;
        const variables = Object.keys(anova.clusters);

        const table: Table = {
            key: "anova_table",
            title: "ANOVA",
            columnHeaders: [
                { header: "" },
                { header: "Cluster" },
                { header: "Error" },
                { header: "" },
                { header: "" },
            ],
            rows: [
                {
                    rowHeader: [""],
                    Cluster: "Mean Square",
                    Error: "df",
                    "": "Mean Square",
                    " ": "df",
                    F: "F",
                    Sig: "Sig.",
                },
            ],
        };

        // Add F and Sig columns that weren't in the initial headers
        table.columnHeaders.push({ header: "F" });
        table.columnHeaders.push({ header: "Sig" });

        variables.forEach((variable) => {
            const cluster = anova.clusters[variable];
            if (cluster) {
                table.rows.push({
                    rowHeader: [variable],
                    Cluster: formatDisplayNumber(cluster.mean_square),
                    Error: formatDisplayNumber(cluster.df),
                    "": formatDisplayNumber(cluster.mean_square / cluster.f), // Calculate error mean square from f-ratio
                    " ": formatDisplayNumber(cluster.df * (clusterCount - 1)), // Calculate error df
                    F: formatDisplayNumber(cluster.f),
                    Sig: formatDisplayNumber(cluster.significance),
                });
            }
        });

        table.rows.push({
            rowHeader: [
                "The F tests should be used only for descriptive purposes because the clusters have been chosen to maximize the differences among cases in different clusters. The observed significance levels are not corrected for this and thus cannot be interpreted as tests of the hypothesis that the cluster means are equal.",
            ],
            Cluster: null,
            Error: null,
            "": null,
            " ": null,
            F: null,
            Sig: null,
        });

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 7. Number of Cases in each Cluster
    if (data.cases_count) {
        const casesCount = data.cases_count;
        const clusterKeys = Object.keys(casesCount.clusters);

        const table: Table = {
            key: "number_of_cases",
            title: "Number of Cases in each Cluster",
            columnHeaders: [
                { header: "Cluster" },
                { header: "N" },
                { header: "%" },
            ],
            rows: [],
        };

        clusterKeys.forEach((cluster) => {
            const count = casesCount.clusters[cluster];
            const percentage = (count / casesCount.valid) * 100;

            table.rows.push({
                rowHeader: [cluster],
                N: formatDisplayNumber(count),
                "%": formatDisplayNumber(percentage),
            });
        });

        table.rows.push({
            rowHeader: ["Valid"],
            N: formatDisplayNumber(casesCount.valid),
            "%": formatDisplayNumber(100),
        });

        if (casesCount.missing > 0) {
            table.rows.push({
                rowHeader: ["Missing"],
                N: formatDisplayNumber(casesCount.missing),
                "%": null,
            });
        }

        const total = casesCount.valid + casesCount.missing;
        table.rows.push({
            rowHeader: ["Total"],
            N: formatDisplayNumber(total),
            "%": null,
        });

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    return resultJson;
}
