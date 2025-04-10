// nearest-neighbor-formatter.ts
import { ensureEnoughHeaders, formatDisplayNumber } from "@/hooks/useFormatter";
import { ResultJson, Table } from "@/types/Table";

export function transformNearestNeighborResult(data: any): ResultJson {
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
                { header: "Category" },
                { header: "Subcategory" },
                { header: "N" },
                { header: "Percent" },
            ],
            rows: [],
        };

        if (cps.training) {
            table.rows.push({
                rowHeader: ["Sample", "Training"],
                N: formatDisplayNumber(cps.training.n),
                Percent: formatDisplayNumber(cps.training.percent),
            });
        }

        if (cps.holdout) {
            table.rows.push({
                rowHeader: ["", "Holdout"],
                N: formatDisplayNumber(cps.holdout.n),
                Percent: formatDisplayNumber(cps.holdout.percent),
            });
        }

        if (cps.valid) {
            table.rows.push({
                rowHeader: ["Valid", null],
                N: formatDisplayNumber(cps.valid.n),
                Percent: formatDisplayNumber(cps.valid.percent),
            });
        }

        if (cps.excluded) {
            table.rows.push({
                rowHeader: ["Excluded", null],
                N: formatDisplayNumber(cps.excluded.n),
                Percent: cps.excluded.percent
                    ? formatDisplayNumber(cps.excluded.percent)
                    : null,
            });
        }

        if (cps.total) {
            table.rows.push({
                rowHeader: ["Total", null],
                N: formatDisplayNumber(cps.total.n),
                Percent: cps.total.percent
                    ? formatDisplayNumber(cps.total.percent)
                    : null,
            });
        }

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 2. System Settings
    if (data.system_settings) {
        const ss = data.system_settings;
        const table: Table = {
            key: "system_settings",
            title: "System Settings",
            columnHeaders: [
                { header: "Keyword" },
                { header: "Description" },
                { header: "Setting" },
            ],
            rows: [],
        };

        // Add RNG settings if available
        if (ss.rng) {
            table.rows.push({
                rowHeader: [ss.rng.keyword],
                Description: ss.rng.description,
                Setting: ss.rng.setting,
            });
        }

        // Add additional system settings here, following the same pattern
        // For example, if there are partitioning settings, algorithm settings, etc.

        // Check if there are other properties in system_settings that are not 'rng'
        for (const [key, value] of Object.entries(ss)) {
            if (key !== "rng" && typeof value === "object" && value !== null) {
                // Assuming other settings follow a similar structure to rng
                if (
                    "keyword" in value &&
                    "description" in value &&
                    "setting" in value
                ) {
                    const setting = value as {
                        keyword: string;
                        description: string;
                        setting: string;
                    };

                    table.rows.push({
                        rowHeader: [setting.keyword],
                        Description: setting.description,
                        Setting: setting.setting,
                    });
                } else {
                    // Handle differently structured settings
                    // This is a fallback for settings that don't match expected structure
                    table.rows.push({
                        rowHeader: [key],
                        Description: JSON.stringify(value),
                        Setting: "",
                    });
                }
            } else if (
                key !== "rng" &&
                (typeof value === "string" ||
                    typeof value === "number" ||
                    typeof value === "boolean")
            ) {
                // Handle simple value settings
                table.rows.push({
                    rowHeader: [key],
                    Description: "",
                    Setting: value.toString(),
                });
            }
        }

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 3. Classification Table
    if (data.classification_table) {
        const ct = data.classification_table;
        const table: Table = {
            key: "classification_table",
            title: "Classification Table",
            columnHeaders: [
                { header: "Partition" },
                { header: "Observed" },
                { header: "Predicted" },
                { header: "Predicted" },
                { header: "Percent Correct" },
            ],
            rows: [],
        };

        // For Training partition
        if (ct.training) {
            // Add observed categories rows
            for (let i = 0; i < ct.training.observed.length; i++) {
                table.rows.push({
                    rowHeader:
                        i === 0
                            ? ["Training", i.toString()]
                            : ["", i.toString()],
                    Category_0: ct.training.predicted[i],
                    Category_1: ct.training.missing
                        ? ct.training.missing[i]
                        : null,
                    "Percent Correct": formatDisplayNumber(
                        ct.training.percent_correct[i]
                    ),
                });
            }

            // Add Overall Percent row
            table.rows.push({
                rowHeader: ["", "Overall Percent"],
                Category_0: formatDisplayNumber(ct.training.overall_percent[0]),
                Category_1: formatDisplayNumber(ct.training.overall_percent[1]),
                "Percent Correct": formatDisplayNumber(100),
            });
        }

        // For Holdout partition
        if (ct.holdout) {
            // Add observed categories rows
            for (let i = 0; i < ct.holdout.observed.length; i++) {
                table.rows.push({
                    rowHeader:
                        i === 0
                            ? ["Holdout", i.toString()]
                            : ["", i.toString()],
                    Category_0: ct.holdout.predicted[i],
                    Category_1: ct.holdout.missing
                        ? ct.holdout.missing[i]
                        : null,
                    "Percent Correct": formatDisplayNumber(
                        ct.holdout.percent_correct[i]
                    ),
                });
            }

            // Add Missing row if available
            if (
                ct.holdout.missing &&
                ct.holdout.missing.some((val) => val !== undefined)
            ) {
                table.rows.push({
                    rowHeader: ["", "Missing"],
                    Category_0:
                        ct.holdout.missing[0] !== undefined
                            ? formatDisplayNumber(ct.holdout.missing[0])
                            : null,
                    Category_1:
                        ct.holdout.missing[1] !== undefined
                            ? formatDisplayNumber(ct.holdout.missing[1])
                            : null,
                    "Percent Correct": null,
                });
            }

            // Add Overall Percent row
            table.rows.push({
                rowHeader: ["", "Overall Percent"],
                Category_0: formatDisplayNumber(ct.holdout.overall_percent[0]),
                Category_1: formatDisplayNumber(ct.holdout.overall_percent[1]),
                "Percent Correct": formatDisplayNumber(100),
            });
        }

        // Modify column headers based on data
        if (ct.training || ct.holdout) {
            const categories = ct.training
                ? ct.training.observed.length
                : ct.holdout
                ? ct.holdout.observed.length
                : 0;
            if (categories > 0) {
                table.columnHeaders = [
                    { header: "Partition" },
                    { header: "Observed" },
                    { header: "Predicted" },
                    { header: "Predicted" },
                    { header: "Percent Correct" },
                ];
                table.columnHeaders[2].header = "0";
                table.columnHeaders[3].header = "1";
            }
        }

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 4. Error Summary
    if (data.error_summary) {
        const es = data.error_summary;
        const table: Table = {
            key: "error_summary",
            title: "Error Summary",
            columnHeaders: [
                { header: "Partition" },
                { header: "Percent of Records Incorrectly Classified" },
            ],
            rows: [],
        };

        if (es.training !== undefined) {
            table.rows.push({
                rowHeader: ["Training"],
                "Percent of Records Incorrectly Classified":
                    formatDisplayNumber(es.training),
            });
        }

        if (es.holdout !== undefined) {
            table.rows.push({
                rowHeader: ["Holdout"],
                "Percent of Records Incorrectly Classified":
                    formatDisplayNumber(es.holdout),
            });
        }

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 5. K Nearest Neighbors and Distances
    if (data.nearest_neighbors && data.nearest_neighbors.focal_neighbor_sets) {
        const nn = data.nearest_neighbors;
        const table: Table = {
            key: "k_nearest_neighbors_and_distances",
            title: "k Nearest Neighbors and Distances",
            columnHeaders: [{ header: "Focal Record" }],
            rows: [],
        };

        // Determine max number of neighbors for column headers
        let maxNeighbors = 0;
        for (const set of nn.focal_neighbor_sets) {
            maxNeighbors = Math.max(maxNeighbors, set.neighbors.length);
        }

        // Add column headers for neighbors and distances
        for (let i = 1; i <= maxNeighbors; i++) {
            table.columnHeaders.push({ header: i.toString() });
        }
        for (let i = 1; i <= maxNeighbors; i++) {
            table.columnHeaders.push({ header: i.toString() });
        }

        // Add subtitle row
        table.rows.push({
            rowHeader: ["DisplayedRecord"],
            Subtitle: "Initial Focal Records",
        });

        // Add headers row
        const headersRow: any = {
            rowHeader: ["HeaderRow"],
        };
        headersRow["Nearest Neighbors"] = null;
        headersRow["Nearest Distances"] = null;
        table.rows.push(headersRow);

        // Populate neighbor data
        for (const set of nn.focal_neighbor_sets) {
            const row: any = {
                rowHeader: [set.focal_record.toString()],
            };

            // Add neighbor IDs
            for (let i = 0; i < set.neighbors.length; i++) {
                row[`Neighbor_${i + 1}`] = set.neighbors[i].id;
            }

            // Add distances
            for (let i = 0; i < set.distances.length; i++) {
                row[`Distance_${i + 1}`] = formatDisplayNumber(
                    set.distances[i]
                );
            }

            table.rows.push(row);
        }

        // Update column headers to include the section labels
        if (maxNeighbors > 0) {
            table.columnHeaders = [
                { header: "Focal Record" },
                ...Array(maxNeighbors)
                    .fill(0)
                    .map((_, i) => ({ header: `Neighbor_${i + 1}` })),
                ...Array(maxNeighbors)
                    .fill(0)
                    .map((_, i) => ({ header: `Distance_${i + 1}` })),
            ];
        }

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 6. Predictor Importance
    if (data.predictor_importance) {
        const pi = data.predictor_importance;
        const table: Table = {
            key: "predictor_importance",
            title: "Predictor Importance",
            columnHeaders: [{ header: "Predictor" }, { header: "Importance" }],
            rows: [],
        };

        // Sort predictors by importance (descending)
        const sortedPredictors = Object.entries(pi.predictors).sort(
            (a, b) => b[1] - a[1]
        );

        for (const [predictor, importance] of sortedPredictors) {
            table.rows.push({
                rowHeader: [predictor],
                Importance: formatDisplayNumber(importance),
            });
        }

        if (pi.target) {
            table.rows.push({
                rowHeader: [`Target: ${pi.target}`],
                Importance: null,
            });
        }

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 7. Predictor Space
    if (data.predictor_space) {
        const ps = data.predictor_space;
        const table: Table = {
            key: "predictor_space",
            title: "Predictor Space",
            columnHeaders: [
                { header: "Dimension" },
                { header: "Point" },
                { header: "X" },
                { header: "Y" },
                { header: "Z" },
                { header: "Focal" },
                { header: "Target Value" },
                { header: "Type" },
            ],
            rows: [],
        };

        for (const dimension of ps.dimensions) {
            for (const point of dimension.points) {
                table.rows.push({
                    rowHeader: [dimension.name],
                    Point: point.point_type,
                    X: formatDisplayNumber(point.x),
                    Y: formatDisplayNumber(point.y),
                    Z: formatDisplayNumber(point.z),
                    Focal: point.focal ? "Yes" : "No",
                    "Target Value": point.target_value ? "Yes" : "No",
                    Type: point.point_type,
                });
            }
        }

        table.rows.push({
            rowHeader: [`Model includes ${ps.model_predictors} predictors`],
            Point: null,
        });

        table.rows.push({
            rowHeader: [`k = ${ps.k_value}`],
            Point: null,
        });

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    return resultJson;
}
