import { formatDisplayNumber, formatSig } from "@/hooks/useFormatter";
import { ResultJson, Row, Table } from "@/types/Table";

export function formatPart2(data: any, resultJson: ResultJson) {
    // Robust Parameter Estimates table
    if (
        data.robust_parameter_estimates &&
        data.robust_parameter_estimates.estimates
    ) {
        const estimates = data.robust_parameter_estimates;
        const notes: string[] = [];
        let redundantNoteLetter: string | null = null;
        let alphaNoteLetter: string | null = null;

        if (estimates.note && typeof estimates.note === "string") {
            const notesArray = estimates.note.split("\n");
            notesArray.forEach((note: string) => {
                notes.push(note);
                if (note.includes("redundant")) {
                    redundantNoteLetter = note.charAt(0);
                }
                if (note.includes("alpha =")) {
                    alphaNoteLetter = note.charAt(0);
                }
            });
        }

        const hasPartialEta = estimates.estimates.some(
            (e: any) =>
                e.partial_eta_squared != null && !isNaN(e.partial_eta_squared)
        );
        const hasNoncent = estimates.estimates.some(
            (e: any) =>
                e.noncent_parameter != null && !isNaN(e.noncent_parameter)
        );
        const hasPower = estimates.estimates.some(
            (e: any) => e.observed_power != null && !isNaN(e.observed_power)
        );

        const columnHeaders: any[] = [
            { header: "Parameter" },
            { header: "B", key: "b" },
            { header: "Robust Std. Error", key: "robust_std_error" },
            { header: "t", key: "t" },
            { header: "Sig.", key: "sig" },
            {
                header: "95% Confidence Interval",
                key: "confidence_interval",
                children: [
                    { header: "Lower Bound", key: "lower_bound" },
                    { header: "Upper Bound", key: "upper_bound" },
                ],
            },
        ];

        if (hasPartialEta) {
            columnHeaders.push({
                header: "Partial Eta Squared",
                key: "partial_eta_squared",
            });
        }
        if (hasNoncent) {
            columnHeaders.push({
                header: "Noncent. Parameter",
                key: "noncent_parameter",
            });
        }
        if (hasPower) {
            columnHeaders.push({
                header: `Observed Power${alphaNoteLetter ? `ᵃ` : ""}`,
                key: "observed_power",
            });
        }

        const table: Table = {
            key: "robust_parameter_estimates",
            title: `Robust Parameter Estimates`,
            columnHeaders: columnHeaders,
            rows: [],
            note: estimates.note,
            interpretation: estimates.interpretation,
        };

        const redundantRowValues: any = {
            robust_std_error: ".",
            t: ".",
            sig: ".",
            lower_bound: ".",
            upper_bound: ".",
        };

        if (hasPartialEta) redundantRowValues.partial_eta_squared = ".";
        if (hasNoncent) redundantRowValues.noncent_parameter = ".";
        if (hasPower) redundantRowValues.observed_power = ".";

        estimates.estimates.forEach((estimate: any) => {
            if (estimate.is_redundant) {
                table.rows.push({
                    rowHeader: [estimate.parameter],
                    b: `0${redundantNoteLetter || "a"}`,
                    ...redundantRowValues,
                });
            } else {
                const row: Row = {
                    rowHeader: [estimate.parameter],
                    b: formatDisplayNumber(estimate.b),
                    robust_std_error: formatDisplayNumber(
                        estimate.robust_std_error
                    ),
                    t: formatDisplayNumber(estimate.t_value),
                    sig: formatSig(estimate.significance),
                    lower_bound: formatDisplayNumber(
                        estimate.confidence_interval?.lower_bound
                    ),
                    upper_bound: formatDisplayNumber(
                        estimate.confidence_interval?.upper_bound
                    ),
                };

                if (hasPartialEta) {
                    row.partial_eta_squared = formatDisplayNumber(
                        estimate.partial_eta_squared
                    );
                }
                if (hasNoncent) {
                    row.noncent_parameter = formatDisplayNumber(
                        estimate.noncent_parameter
                    );
                }
                if (hasPower) {
                    row.observed_power = formatDisplayNumber(
                        estimate.observed_power
                    );
                }
                table.rows.push(row);
            }
        });

        const nullColumnsForNotes: any = {
            b: null,
            robust_std_error: null,
            t: null,
            sig: null,
            lower_bound: null,
            upper_bound: null,
        };

        if (hasPartialEta) nullColumnsForNotes.partial_eta_squared = null;
        if (hasNoncent) nullColumnsForNotes.noncent_parameter = null;
        if (hasPower) nullColumnsForNotes.observed_power = null;

        notes.forEach((note) => {
            table.rows.push({
                rowHeader: [note],
                ...nullColumnsForNotes,
            });
        });

        resultJson.tables.push(table);
    }

    // 6. General Estimable Function table
    if (
        data.general_estimable_function &&
        data.general_estimable_function.estimable_function
    ) {
        const gef = data.general_estimable_function;
        const estimable = gef.estimable_function;

        // Only process if matrix exists and has content
        if (
            estimable.parameter &&
            estimable.l_matrix &&
            estimable.l_label &&
            estimable.l_matrix.length > 0 &&
            estimable.parameter.length > 0
        ) {
            // Find the design note for title superscript
            let designNoteLetter = "";
            const designNote =
                gef.notes?.find((n: string) => n.match(/^a\./)) || "";
            if (designNote) {
                designNoteLetter = "a";
            }

            // Create column headers from l_label
            const lLabelKeys = estimable.l_label.map((l: string) =>
                l.toLowerCase()
            );
            const columnHeaders = [
                { header: "Parameter" },
                ...estimable.l_label.map((label: string, i: number) => ({
                    header: label,
                    key: lLabelKeys[i],
                })),
            ];

            const table: Table = {
                key: "general_estimable_function",
                title: `General Estimable Function${
                    designNoteLetter ? `ᵃ` : ""
                }`,
                columnHeaders,
                rows: [],
                note: gef.note,
                interpretation: gef.interpretation,
            };

            // Transpose l_matrix to populate rows
            const numParameters = estimable.parameter.length;
            const numLabels = estimable.l_label.length;

            for (let i = 0; i < numParameters; i++) {
                // For each parameter (table row)
                const rowData: any = {
                    rowHeader: [estimable.parameter[i]],
                };

                for (let j = 0; j < numLabels; j++) {
                    // For each L-vector (table column)
                    const key = lLabelKeys[j];
                    // Value is from l_matrix[j][i]
                    const value = estimable.l_matrix[j]?.[i];
                    rowData[key] =
                        value !== undefined && value !== null
                            ? formatDisplayNumber(value)
                            : "";
                }
                table.rows.push(rowData as Row);
            }

            // Add notes
            if (gef.notes && Array.isArray(gef.notes)) {
                const nullColumnsForNotes = Object.fromEntries(
                    lLabelKeys.map((key: string) => [key, null])
                );

                gef.notes.forEach((note: string) => {
                    table.rows.push({
                        rowHeader: [note],
                        ...nullColumnsForNotes,
                    });
                });
            }

            resultJson.tables.push(table);
        }
    }

    // Hypothesis L-Matrices
    if (data.hypothesis_l_matrices && data.hypothesis_l_matrices.matrices) {
        data.hypothesis_l_matrices.matrices.forEach((termMatrix: any) => {
            if (
                !termMatrix.parameter_names ||
                termMatrix.parameter_names.length === 0
            ) {
                return; // Skip if no parameters
            }

            const contrastKeys = termMatrix.contrast_names.map((c: string) =>
                c.toLowerCase()
            );
            const contrastHeaders = termMatrix.contrast_names.map(
                (name: string, i: number) => ({
                    header: name,
                    key: contrastKeys[i],
                })
            );

            const table: Table = {
                key: `hypothesis_matrix_${termMatrix.term.replace(/\W/g, "_")}`,
                title: `Contrast Coefficients for ${termMatrix.term}`,
                columnHeaders: [
                    { header: "Parameter" },
                    {
                        header: "Contrast",
                        key: "contrast_group",
                        children: contrastHeaders,
                    },
                ],
                rows: [],
                note: termMatrix.note,
                interpretation: termMatrix.interpretation,
            };

            termMatrix.parameter_names.forEach(
                (paramName: string, paramIndex: number) => {
                    const row: any = {
                        rowHeader: [paramName],
                    };
                    termMatrix.contrast_names.forEach(
                        (_contrastName: string, contrastIndex: number) => {
                            const key = contrastKeys[contrastIndex];
                            const value =
                                termMatrix.matrix[paramIndex]?.[contrastIndex];
                            row[key] =
                                value !== undefined && value !== null
                                    ? formatDisplayNumber(value)
                                    : ".";
                        }
                    );
                    table.rows.push(row as Row);
                }
            );

            const nullColumnsForNotes = Object.fromEntries(
                contrastKeys.map((key: string) => [key, null])
            );

            table.rows.push({
                rowHeader: [
                    "The default display of this matrix is the transpose of the corresponding L matrix.",
                ],
                ...nullColumnsForNotes,
            });

            if (termMatrix.note) {
                table.rows.push({
                    rowHeader: [termMatrix.note],
                    ...nullColumnsForNotes,
                });
            }

            resultJson.tables.push(table);
        });
    }

    // 7. Contrast Coefficients table
    if (data.contrast_coefficients) {
        const contrasts = data.contrast_coefficients;

        // Only process if we have parameters and coefficients
        if (
            contrasts.parameter &&
            contrasts.coefficients &&
            contrasts.parameter.length > 0 &&
            contrasts.coefficients.length > 0
        ) {
            const table: Table = {
                key: "contrast_coefficients",
                title: "Contrast Coefficients (L' Matrix)",
                columnHeaders: [
                    { header: "Parameter", key: "parameter" },
                    {
                        header: "Contrast",
                        key: "contrast_group",
                        children: [
                            // Only use contrast name if available, otherwise use L1
                            { header: "L1", key: "l1" },
                        ],
                    },
                ],
                rows: [],
                note: contrasts.note,
                interpretation: contrasts.interpretation,
            };

            // Process coefficients
            for (let i = 0; i < contrasts.parameter.length; i++) {
                if (i < contrasts.coefficients.length) {
                    table.rows.push({
                        rowHeader: [contrasts.parameter[i]],
                        l1: formatDisplayNumber(contrasts.coefficients[i]),
                    });
                }
            }

            resultJson.tables.push(table);
        }
    }

    // 8. Lack of Fit Tests table
    if (data.lack_of_fit_tests) {
        const lof = data.lack_of_fit_tests;
        const lofData = lof.lack_of_fit;
        const pureErrorData = lof.pure_error;

        const allEffects = [lofData, pureErrorData].filter(Boolean);

        // Check for optional columns
        const hasPartialEta = allEffects.some((e: any) => {
            const value = e.partial_eta_squared;
            return value != null && !isNaN(value);
        });
        const hasNoncent = allEffects.some((e: any) => {
            const value = e.noncent_parameter;
            return value != null && !isNaN(value);
        });
        const hasPower = allEffects.some((e: any) => {
            const value = e.observed_power;
            return value != null && !isNaN(value);
        });

        const depVarName =
            (data.tests_of_between_subjects_effects &&
                data.tests_of_between_subjects_effects.dependent_variable) ||
            (data.descriptive_statistics &&
                Object.values(data.descriptive_statistics).length > 0 &&
                (Object.values(data.descriptive_statistics)[0] as any)
                    .dependent_variable) ||
            "";

        const columnHeaders: any[] = [
            { header: "Source" },
            { header: "Sum of Squares", key: "sum_of_squares" },
            { header: "df", key: "df" },
            { header: "Mean Square", key: "mean_square" },
            { header: "F", key: "f" },
            { header: "Sig.", key: "sig" },
        ];

        if (hasPartialEta) {
            columnHeaders.push({
                header: "Partial Eta Squared",
                key: "partial_eta_squared",
            });
        }
        if (hasNoncent) {
            columnHeaders.push({
                header: "Noncent. Parameter",
                key: "noncent_parameter",
            });
        }
        if (hasPower) {
            columnHeaders.push({
                header: "Observed Power",
                key: "observed_power",
            });
        }

        const table: Table = {
            key: "lack_of_fit_tests",
            title: `Lack of Fit Tests`,
            columnHeaders: columnHeaders,
            rows: [],
            note: lof.note,
            interpretation: lof.interpretation,
        };

        if (lofData) {
            const row: Row = {
                rowHeader: ["Lack of Fit"],
                sum_of_squares: formatDisplayNumber(lofData.sum_of_squares),
                df: lofData.df,
                mean_square: formatDisplayNumber(lofData.mean_square),
                f: formatDisplayNumber(lofData.f_value),
                sig: formatSig(lofData.significance),
            };
            if (hasPartialEta) {
                row.partial_eta_squared = formatDisplayNumber(
                    lofData.partial_eta_squared
                );
            }
            if (hasNoncent) {
                row.noncent_parameter = formatDisplayNumber(
                    lofData.noncent_parameter
                );
            }
            if (hasPower) {
                row.observed_power = formatDisplayNumber(
                    lofData.observed_power
                );
            }
            table.rows.push(row);
        }

        if (pureErrorData) {
            const row: Row = {
                rowHeader: ["Pure Error"],
                sum_of_squares: formatDisplayNumber(
                    pureErrorData.sum_of_squares
                ),
                df: pureErrorData.df,
                mean_square: formatDisplayNumber(pureErrorData.mean_square),
                f: formatDisplayNumber(pureErrorData.f_value),
                sig: formatSig(pureErrorData.significance),
            };
            if (hasPartialEta) {
                row.partial_eta_squared = formatDisplayNumber(
                    pureErrorData.partial_eta_squared
                );
            }
            if (hasNoncent) {
                row.noncent_parameter = formatDisplayNumber(
                    pureErrorData.noncent_parameter
                );
            }
            if (hasPower) {
                row.observed_power = formatDisplayNumber(
                    pureErrorData.observed_power
                );
            }
            table.rows.push(row);
        }

        if (lof.notes && Array.isArray(lof.notes)) {
            const nullColumnsForNotes: any = {
                sum_of_squares: null,
                df: null,
                mean_square: null,
                f: null,
                sig: null,
            };
            if (hasPartialEta) nullColumnsForNotes.partial_eta_squared = null;
            if (hasNoncent) nullColumnsForNotes.noncent_parameter = null;
            if (hasPower) nullColumnsForNotes.observed_power = null;

            lof.notes.forEach((note: string) => {
                table.rows.push({
                    rowHeader: [note],
                    ...nullColumnsForNotes,
                });
            });
        }

        resultJson.tables.push(table);
    }

    // 9. Spread vs. Level Plots (data for chart)
    if (data.spread_vs_level_plots && data.spread_vs_level_plots.points) {
        const plots = data.spread_vs_level_plots;

        const table: Table = {
            key: "spread_vs_level_plots",
            title: "Spread vs. Level Plot Data",
            columnHeaders: [
                { header: "Level (Mean)", key: "level_mean" },
                {
                    header: "Spread (Standard Deviation)",
                    key: "spread_std_dev",
                },
            ],
            rows: [],
            note: plots.note,
            interpretation: plots.interpretation,
        };

        // Process each point
        plots.points.forEach((point: any) => {
            table.rows.push({
                rowHeader: [],
                level_mean: formatDisplayNumber(point.level_mean),
                spread_std_dev: formatDisplayNumber(
                    point.spread_standard_deviation
                ),
            });
        });

        resultJson.tables.push(table);
    }
}
