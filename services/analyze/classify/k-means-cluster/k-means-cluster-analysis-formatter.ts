// clustering-results-formatter.ts
import { ensureEnoughHeaders, formatDisplayNumber } from "@/hooks/useFormatter";
import { ResultJson, Table } from "@/types/Table";

export function transformKMeansResult(data: any): ResultJson {
    const resultJson: ResultJson = {
        tables: [],
    };

    // 1. Number of Cases in each Cluster (matching Image 1)
    if (data.cases_count) {
        const casesCount = data.cases_count;
        const clusterKeys = Object.keys(casesCount.clusters).sort(
            (a, b) => parseInt(a) - parseInt(b)
        );

        const table: Table = {
            key: "number_of_cases",
            title: "Number of Cases in each Cluster",
            columnHeaders: [
                { header: "Cluster" },
                ...clusterKeys.map((cluster) => ({ header: cluster })),
            ],
            rows: [],
        };

        // Individual cluster rows
        const clusterRow: any = { rowHeader: ["Cluster"] };
        clusterKeys.forEach((cluster) => {
            clusterRow[cluster] = formatDisplayNumber(
                casesCount.clusters[cluster]
            );
        });
        table.rows.push(clusterRow);

        // Valid row
        const validRow: any = { rowHeader: ["Valid"] };
        clusterKeys.forEach(() => {
            validRow[clusterKeys[0]] = formatDisplayNumber(casesCount.valid);
        });
        table.rows.push(validRow);

        // Missing row
        const missingRow: any = { rowHeader: ["Missing"] };
        clusterKeys.forEach(() => {
            missingRow[clusterKeys[0]] = formatDisplayNumber(
                casesCount.missing
            );
        });
        table.rows.push(missingRow);

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 2. Initial Cluster Centers (matching Image 2)
    if (data.initial_centers) {
        const initialCenters = data.initial_centers;
        const variables = Object.keys(initialCenters.centers);
        const clusterCount =
            variables.length > 0
                ? initialCenters.centers[variables[0]].length
                : 0;

        const table: Table = {
            key: "initial_cluster_centers",
            title: "Initial Cluster Centers",
            columnHeaders: [
                { header: "Variable" },
                ...Array.from({ length: clusterCount }, (_, i) => ({
                    header: (i + 1).toString(),
                })),
            ],
            rows: [],
        };

        // Header row for "Cluster"
        table.rows.push({
            rowHeader: [""],
            Variable: "Cluster",
        });

        // Data rows for each variable
        variables.forEach((variable) => {
            const rowData: any = {
                rowHeader: [variable],
                Variable: variable,
            };

            for (let i = 0; i < clusterCount; i++) {
                rowData[(i + 1).toString()] = formatDisplayNumber(
                    initialCenters.centers[variable][i]
                );
            }

            table.rows.push(rowData);
        });

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 3. Iteration History (matching Image 3)
    if (data.iteration_history) {
        const iterHistory = data.iteration_history;
        const clusterCount = iterHistory.iterations[0]?.changes
            ? Object.keys(iterHistory.iterations[0].changes).length
            : 0;

        const table: Table = {
            key: "iteration_history",
            title: "Iteration History",
            columnHeaders: [
                { header: "Iteration" },
                ...Array.from({ length: clusterCount }, (_, i) => ({
                    header: (i + 1).toString(),
                })),
            ],
            rows: [],
        };

        // Header row
        table.rows.push({
            rowHeader: [""],
            Iteration: "Change in Cluster Centers",
        });

        // Data rows for each iteration
        iterHistory.iterations.forEach((iteration) => {
            const rowData: any = {
                rowHeader: [],
                Iteration: formatDisplayNumber(iteration.iteration),
            };

            // Extract values for each cluster
            const clusterKeys = Object.keys(iteration.changes).sort(
                (a, b) =>
                    parseInt(a.replace(/\D/g, "")) -
                    parseInt(b.replace(/\D/g, ""))
            );

            clusterKeys.forEach((key, index) => {
                rowData[(index + 1).toString()] = formatDisplayNumber(
                    iteration.changes[key]
                );
            });

            table.rows.push(rowData);
        });

        // Add footnote if available
        if (iterHistory.convergence_note) {
            table.rows.push({
                rowHeader: [`a. ${iterHistory.convergence_note}`],
                Iteration: null,
            });
        }

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 4. Cluster Membership (matching Image 4)
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

    // 5. Final Cluster Centers (matching Image 5)
    if (data.final_cluster_centers) {
        const finalCenters = data.final_cluster_centers;
        const variables = Object.keys(finalCenters.centers);
        const clusterCount =
            variables.length > 0
                ? finalCenters.centers[variables[0]].length
                : 0;

        const table: Table = {
            key: "final_cluster_centers",
            title: "Final Cluster Centers",
            columnHeaders: [
                { header: "Variable" },
                ...Array.from({ length: clusterCount }, (_, i) => ({
                    header: (i + 1).toString(),
                })),
            ],
            rows: [],
        };

        // Header row for "Cluster"
        table.rows.push({
            rowHeader: [""],
            Variable: "Cluster",
        });

        // Data rows for each variable
        variables.forEach((variable) => {
            const rowData: any = {
                rowHeader: [variable],
                Variable: variable,
            };

            for (let i = 0; i < clusterCount; i++) {
                rowData[(i + 1).toString()] = formatDisplayNumber(
                    finalCenters.centers[variable][i]
                );
            }

            table.rows.push(rowData);
        });

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 6. Distances between Final Cluster Centers (matching Image 6)
    if (data.distances_between_centers) {
        const distances = data.distances_between_centers;
        const clusterCount = distances.distances.length;

        const table: Table = {
            key: "distances_between_centers",
            title: "Distances between Final Cluster Centers",
            columnHeaders: [
                { header: "Cluster" },
                ...Array.from({ length: clusterCount }, (_, i) => ({
                    header: (i + 1).toString(),
                })),
            ],
            rows: [],
        };

        for (let i = 0; i < clusterCount; i++) {
            const rowData: any = {
                rowHeader: [(i + 1).toString()],
            };

            for (let j = 0; j < clusterCount; j++) {
                rowData[(j + 1).toString()] = formatDisplayNumber(
                    distances.distances[i][j]
                );
            }

            table.rows.push(rowData);
        }

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 7. ANOVA Table (matching Image 7)
    if (data.anova) {
        const anova = data.anova;
        const variables = Object.keys(anova.clusters);

        const table: Table = {
            key: "anova_table",
            title: "ANOVA",
            columnHeaders: [
                { header: "Variable" },
                { header: "Cluster_MS" },
                { header: "Cluster_df" },
                { header: "Error_MS" },
                { header: "Error_df" },
                { header: "F" },
                { header: "Sig." },
            ],
            rows: [],
        };

        // Header row with subheaders
        table.rows.push({
            rowHeader: [""],
            Variable: "",
            Cluster_MS: "Mean Square",
            Cluster_df: "df",
            Error_MS: "Mean Square",
            Error_df: "df",
            F: "F",
            "Sig.": "Sig.",
        });

        // Data rows for each variable
        variables.forEach((variable) => {
            const cluster = anova.clusters[variable];
            if (cluster) {
                table.rows.push({
                    rowHeader: [variable],
                    Variable: variable,
                    Cluster_MS: formatDisplayNumber(cluster.mean_square),
                    Cluster_df: formatDisplayNumber(cluster.df),
                    Error_MS: formatDisplayNumber(cluster.error_mean_square),
                    Error_df: formatDisplayNumber(cluster.error_df),
                    F: formatDisplayNumber(cluster.f),
                    "Sig.":
                        cluster.significance < 0.001
                            ? "<.001"
                            : formatDisplayNumber(cluster.significance),
                });
            }
        });

        // Add footnote
        table.rows.push({
            rowHeader: [
                "The F tests should be used only for descriptive purposes because the clusters have been chosen to maximize the differences among cases in different clusters. The observed significance levels are not corrected for this and thus cannot be interpreted as tests of the hypothesis that the cluster means are equal.",
            ],
            Variable: null,
            Cluster_MS: null,
            Cluster_df: null,
            Error_MS: null,
            Error_df: null,
            F: null,
            "Sig.": null,
        });

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    return resultJson;
}
