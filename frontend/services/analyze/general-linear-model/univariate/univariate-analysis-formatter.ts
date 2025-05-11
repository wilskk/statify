// univariate-analysis-formatter.ts
import { formatDisplayNumber } from "@/hooks/useFormatter";
import { ResultJson, Table, Row } from "@/types/Table";

export function transformUnivariateResult(data: any): ResultJson {
    const resultJson: ResultJson = {
        tables: [],
    };

    // 1. Between-Subjects Factors table
    if (data.between_subjects_factors) {
        const table: Table = {
            key: "between_subjects_factors",
            title: "Between-Subjects Factors",
            columnHeaders: [
                { header: "", key: "factor" },
                { header: "", key: "value" },
                { header: "N", key: "n" },
            ],
            rows: [],
        };

        // Process each factor
        Object.entries(data.between_subjects_factors).forEach(
            ([factorName, factorData]: [string, any]) => {
                Object.entries(factorData.factors).forEach(
                    ([levelName, value]: [string, any]) => {
                        table.rows.push({
                            rowHeader: [factorName, String(value)],
                            n: String(value), // N value would need to come from elsewhere in a real implementation
                        });
                    }
                );
            }
        );

        resultJson.tables.push(table);
    }

    // 2. Descriptive Statistics table
    if (data.descriptive_statistics) {
        const table: Table = {
            key: "descriptive_statistics",
            title: "Descriptive Statistics",
            columnHeaders: [
                { header: "Dependent Variable:", key: "dependent_var" },
                { header: "", key: "factors" },
                { header: "Mean", key: "mean" },
                { header: "Std. Deviation", key: "std_deviation" },
                { header: "N", key: "n" },
            ],
            rows: [],
        };

        // Process each statistic
        Object.values(data.descriptive_statistics).forEach((stat: any) => {
            // Function to recursively process stat groups
            const processStatGroups = (
                groups: any[],
                factorPrefix: string = ""
            ) => {
                groups.forEach((group) => {
                    const factorInfo = factorPrefix
                        ? `${factorPrefix}, ${group.factor_name} ${group.factor_value}`
                        : `${group.factor_name} ${group.factor_value}`;

                    const rowData: any = {
                        rowHeader: [stat.dependent_variable, factorInfo],
                        mean: formatDisplayNumber(group.stats.mean),
                        std_deviation: formatDisplayNumber(
                            group.stats.std_deviation
                        ),
                        n: formatDisplayNumber(group.stats.n),
                    };

                    table.rows.push(rowData);

                    // Process subgroups recursively
                    if (group.subgroups && group.subgroups.length > 0) {
                        processStatGroups(group.subgroups, factorInfo);
                    }
                });
            };

            processStatGroups(stat.groups);
        });

        resultJson.tables.push(table);
    }

    // 3. Levene's Test table
    if (data.levene_test && data.levene_test.length > 0) {
        const table: Table = {
            key: "levene_test",
            title: "Levene's Test of Equality of Error Variances",
            columnHeaders: [
                { header: "Dependent Variable:", key: "dependent_var" },
                { header: "F", key: "f" },
                { header: "df1", key: "df1" },
                { header: "df2", key: "df2" },
                { header: "Sig.", key: "sig" },
            ],
            rows: [],
        };

        // Process each test
        data.levene_test.forEach((test: any) => {
            table.rows.push({
                rowHeader: [test.dependent_variable],
                f: formatDisplayNumber(test.f_statistic),
                df1: formatDisplayNumber(test.df1),
                df2: formatDisplayNumber(test.df2),
                sig: formatDisplayNumber(test.significance),
            });
        });

        // Add note about null hypothesis
        const nullColumns = Object.fromEntries(
            table.columnHeaders
                .filter((col) => col.key && col.key !== "dependent_var")
                .map((col) => [col.key!, null])
        );

        table.rows.push({
            rowHeader: [
                "Tests null hypothesis that the error variance of the dependent variable is equal across groups.",
            ],
            ...nullColumns,
        });

        // Add design info if available
        const firstTest = data.levene_test[0];
        if (firstTest && firstTest.design) {
            table.rows.push({
                rowHeader: [`a. Design: ${firstTest.design}`],
                ...nullColumns,
            });
        }

        resultJson.tables.push(table);
    }

    // 4. Tests of Between-Subjects Effects table
    if (data.tests_of_between_subjects_effects) {
        const effects = data.tests_of_between_subjects_effects;

        const table: Table = {
            key: "tests_of_between_subjects_effects",
            title: "Tests of Between-Subjects Effects",
            columnHeaders: [
                { header: "Dependent Variable:", key: "dependent_var" },
                { header: "Source", key: "source" },
                { header: "Type III Sum of Squares", key: "sum_of_squares" },
                { header: "df", key: "df" },
                { header: "Mean Square", key: "mean_square" },
                { header: "F", key: "f" },
                { header: "Sig.", key: "sig" },
                { header: "Partial Eta Squared", key: "partial_eta_squared" },
                { header: "Noncent. Parameter", key: "noncent_parameter" },
                { header: "Observed Power", key: "observed_power" },
            ],
            rows: [],
        };

        // Process each source
        effects.source &&
            Object.entries(effects.source).forEach(
                ([sourceName, effectData]: [string, any]) => {
                    table.rows.push({
                        rowHeader: [sourceName !== null ? sourceName : null],
                        sum_of_squares: formatDisplayNumber(
                            effectData.sum_of_squares
                        ),
                        df: formatDisplayNumber(effectData.df),
                        mean_square: formatDisplayNumber(
                            effectData.mean_square
                        ),
                        f: formatDisplayNumber(effectData.f_value),
                        sig: formatDisplayNumber(effectData.significance),
                        partial_eta_squared: formatDisplayNumber(
                            effectData.partial_eta_squared
                        ),
                        noncent_parameter: formatDisplayNumber(
                            effectData.noncent_parameter
                        ),
                        observed_power: formatDisplayNumber(
                            effectData.observed_power
                        ),
                    });
                }
            );

        // Add R-squared information
        if (
            effects.r_squared !== undefined &&
            effects.adjusted_r_squared !== undefined
        ) {
            const nullColumns = Object.fromEntries(
                table.columnHeaders
                    .filter(
                        (col) =>
                            col.key &&
                            !["dependent_var", "source"].includes(col.key)
                    )
                    .map((col) => [col.key!, null])
            );

            table.rows.push({
                rowHeader: [
                    `a. R Squared = ${formatDisplayNumber(
                        effects.r_squared
                    )} (Adjusted R Squared = ${formatDisplayNumber(
                        effects.adjusted_r_squared
                    )})`,
                ],
                ...nullColumns,
            });
        }

        // Add alpha note
        const nullColumns = Object.fromEntries(
            table.columnHeaders
                .filter(
                    (col) =>
                        col.key &&
                        !["dependent_var", "source"].includes(col.key)
                )
                .map((col) => [col.key!, null])
        );

        table.rows.push({
            rowHeader: ["b. Computed using alpha = .05"],
            ...nullColumns,
        });

        resultJson.tables.push(table);
    }

    // 5. Parameter Estimates table
    if (data.parameter_estimates) {
        const estimates = data.parameter_estimates;

        const table: Table = {
            key: "parameter_estimates",
            title: "Parameter Estimates",
            columnHeaders: [
                { header: "Dependent Variable:", key: "dependent_var" },
                { header: "Parameter", key: "parameter" },
                { header: "B", key: "b" },
                { header: "Std. Error", key: "std_error" },
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
                { header: "Partial Eta Squared", key: "partial_eta_squared" },
                { header: "Noncent. Parameter", key: "noncent_parameter" },
                { header: "Observed Power", key: "observed_power" },
            ],
            rows: [],
        };

        // Process each parameter estimate
        if (estimates.estimates) {
            estimates.estimates.forEach((estimate: any) => {
                table.rows.push({
                    rowHeader: [estimate.parameter],
                    b: formatDisplayNumber(estimate.b),
                    std_error: formatDisplayNumber(estimate.std_error),
                    t: formatDisplayNumber(estimate.t_value),
                    sig: formatDisplayNumber(estimate.significance),
                    lower_bound: formatDisplayNumber(
                        estimate.confidence_interval?.lower_bound
                    ),
                    upper_bound: formatDisplayNumber(
                        estimate.confidence_interval?.upper_bound
                    ),
                    partial_eta_squared: formatDisplayNumber(
                        estimate.partial_eta_squared
                    ),
                    noncent_parameter: formatDisplayNumber(
                        estimate.noncent_parameter
                    ),
                    observed_power: formatDisplayNumber(
                        estimate.observed_power
                    ),
                });
            });
        }

        // Add notes with nulls for all columns
        const nullColumns = {
            b: null,
            std_error: null,
            t: null,
            sig: null,
            lower_bound: null,
            upper_bound: null,
            partial_eta_squared: null,
            noncent_parameter: null,
            observed_power: null,
        };

        // Only add notes if there were any estimates
        if (estimates.estimates && estimates.estimates.length > 0) {
            table.rows.push({
                rowHeader: [
                    "a. This parameter is set to zero because it is redundant.",
                ],
                ...nullColumns,
            });

            table.rows.push({
                rowHeader: ["b. Computed using alpha = .05"],
                ...nullColumns,
            });
        }

        resultJson.tables.push(table);
    }

    // 6. General Estimable Function table
    if (data.general_estimable_function) {
        const gef = data.general_estimable_function;

        // Only process if matrix exists and has content
        if (gef.matrix && gef.matrix.length > 0 && gef.matrix[0].length > 0) {
            // Create column headers based on the matrix dimensions
            const columnHeaders = [{ header: "Parameter", key: "parameter" }];

            // Add L headers based on matrix width
            for (let i = 0; i < gef.matrix[0].length; i++) {
                columnHeaders.push({ header: `L${i + 1}`, key: `l${i + 1}` });
            }

            const table: Table = {
                key: "general_estimable_function",
                title: "General Estimable Function",
                columnHeaders,
                rows: [],
            };

            // Since parameter names aren't directly available in gef.matrix,
            // we'd need to get them from elsewhere or use generic names
            const parameters =
                data.parameter_estimates?.estimates?.map(
                    (est: any) => est.parameter
                ) || [];

            // Populate rows from matrix
            for (let i = 0; i < gef.matrix.length; i++) {
                const rowData: any = {
                    rowHeader: [parameters[i] || `Parameter ${i + 1}`],
                };

                for (let j = 0; j < gef.matrix[i].length; j++) {
                    rowData[`l${j + 1}`] = formatDisplayNumber(
                        gef.matrix[i][j]
                    );
                }

                table.rows.push(rowData);
            }

            // Add note with nulls for all L columns
            const nullLColumns = Object.fromEntries(
                Array.from({ length: gef.matrix[0].length }, (_, i) => [
                    `l${i + 1}`,
                    null,
                ])
            );

            table.rows.push({
                rowHeader: [
                    "a. This matrix has been transformed into the form required by the function evaluator.",
                ],
                ...nullLColumns,
            });

            resultJson.tables.push(table);
        }
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

        const table: Table = {
            key: "lack_of_fit_tests",
            title: "Lack of Fit Tests",
            columnHeaders: [
                { header: "Dependent Variable:", key: "dependent_var" },
                { header: "Source", key: "source" },
                { header: "Sum of Squares", key: "sum_of_squares" },
                { header: "df", key: "df" },
                { header: "Mean Square", key: "mean_square" },
                { header: "F", key: "f" },
                { header: "Sig.", key: "sig" },
                { header: "Partial Eta Squared", key: "partial_eta_squared" },
                { header: "Noncent. Parameter", key: "noncent_parameter" },
                { header: "Observed Power", key: "observed_power" },
            ],
            rows: [],
        };

        // Add Lack of Fit row
        table.rows.push({
            rowHeader: ["Lack of Fit"],
            sum_of_squares: formatDisplayNumber(lof.sum_of_squares),
            df: formatDisplayNumber(lof.df),
            mean_square: formatDisplayNumber(lof.mean_square),
            f: formatDisplayNumber(lof.f_value),
            sig: formatDisplayNumber(lof.significance),
            partial_eta_squared: formatDisplayNumber(lof.partial_eta_squared),
            noncent_parameter: formatDisplayNumber(lof.noncent_parameter),
            observed_power: formatDisplayNumber(lof.observed_power),
        });

        // Add Pure Error row - we'd need data from elsewhere
        // Only add placeholder row if we have relevant data
        if (lof.df !== undefined) {
            table.rows.push({
                rowHeader: ["Pure Error"],
                // These would need to come from another data source
                sum_of_squares: null,
                df: null,
                mean_square: null,
                f: null,
                sig: null,
                partial_eta_squared: null,
                noncent_parameter: null,
                observed_power: null,
            });
        }

        // Add note
        const nullColumns = Object.fromEntries(
            table.columnHeaders
                .filter((col) => col.key && col.key !== "source")
                .map((col) => [col.key!, null])
        );

        table.rows.push({
            rowHeader: ["a. Computed using alpha = .05"],
            ...nullColumns,
        });

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

    // 10. Post Hoc Tests table
    if (data.posthoc_tests) {
        Object.entries(data.posthoc_tests).forEach(
            ([testName, entries]: [string, any]) => {
                // Only process if we have entries
                if (Array.isArray(entries) && entries.length > 0) {
                    const table: Table = {
                        key: `posthoc_${testName
                            .toLowerCase()
                            .replace(/\s+/g, "_")}`,
                        title: `Post Hoc Tests - ${testName}`,
                        columnHeaders: [
                            {
                                header: "Dependent Variable:",
                                key: "dependent_var",
                            },
                            { header: "Parameter", key: "parameter" },
                            {
                                header: "Mean Difference",
                                key: "mean_difference",
                            },
                            { header: "Std. Error", key: "std_error" },
                            { header: "Sig.", key: "sig" },
                            {
                                header: "95% Confidence Interval",
                                key: "confidence_interval",
                                children: [
                                    {
                                        header: "Lower Bound",
                                        key: "lower_bound",
                                    },
                                    {
                                        header: "Upper Bound",
                                        key: "upper_bound",
                                    },
                                ],
                            },
                        ],
                        rows: [],
                    };

                    // Process each entry
                    entries.forEach((entry: any) => {
                        if (entry && entry.parameter) {
                            table.rows.push({
                                rowHeader: [entry.parameter],
                                mean_difference: formatDisplayNumber(entry.b),
                                std_error: formatDisplayNumber(entry.std_error),
                                sig: formatDisplayNumber(entry.significance),
                                lower_bound: formatDisplayNumber(
                                    entry.confidence_interval?.lower_bound
                                ),
                                upper_bound: formatDisplayNumber(
                                    entry.confidence_interval?.upper_bound
                                ),
                            });
                        }
                    });

                    resultJson.tables.push(table);
                }
            }
        );
    }

    // 11. Estimated Marginal Means table
    if (data.emmeans) {
        Object.entries(data.emmeans).forEach(
            ([factorName, entries]: [string, any]) => {
                // Only process if we have entries
                if (Array.isArray(entries) && entries.length > 0) {
                    const table: Table = {
                        key: `emmeans_${factorName
                            .toLowerCase()
                            .replace(/\s+/g, "_")}`,
                        title: `Estimated Marginal Means - ${factorName}`,
                        columnHeaders: [
                            {
                                header: "Dependent Variable:",
                                key: "dependent_var",
                            },
                            { header: factorName, key: "factor" },
                            { header: "Mean", key: "mean" },
                            { header: "Std. Error", key: "std_error" },
                            {
                                header: "95% Confidence Interval",
                                key: "confidence_interval",
                                children: [
                                    {
                                        header: "Lower Bound",
                                        key: "lower_bound",
                                    },
                                    {
                                        header: "Upper Bound",
                                        key: "upper_bound",
                                    },
                                ],
                            },
                        ],
                        rows: [],
                    };

                    // Process each entry
                    entries.forEach((entry: any) => {
                        if (entry && entry.parameter) {
                            table.rows.push({
                                rowHeader: [entry.parameter],
                                mean: formatDisplayNumber(entry.b),
                                std_error: formatDisplayNumber(entry.std_error),
                                lower_bound: formatDisplayNumber(
                                    entry.confidence_interval?.lower_bound
                                ),
                                upper_bound: formatDisplayNumber(
                                    entry.confidence_interval?.upper_bound
                                ),
                            });
                        }
                    });

                    resultJson.tables.push(table);
                }
            }
        );
    }

    // 12. Plots (data for visualization)
    if (data.plots) {
        Object.entries(data.plots).forEach(
            ([plotName, plotData]: [string, any]) => {
                // Only process if we have series and points
                if (plotData && plotData.series && plotData.series.length > 0) {
                    const table: Table = {
                        key: `plot_${plotName
                            .toLowerCase()
                            .replace(/\s+/g, "_")}`,
                        title: plotData.title || `Plot - ${plotName}`,
                        columnHeaders: [
                            { header: plotData.x_label || "X", key: "x" },
                            { header: plotData.y_label || "Y", key: "y" },
                            { header: "Series", key: "series" },
                            { header: "Label", key: "label" },
                        ],
                        rows: [],
                    };

                    // Process each series and its points
                    plotData.series.forEach((series: any) => {
                        if (
                            series &&
                            series.points &&
                            series.points.length > 0
                        ) {
                            series.points.forEach((point: any) => {
                                if (point) {
                                    table.rows.push({
                                        rowHeader: [],
                                        x: formatDisplayNumber(point.x),
                                        y: formatDisplayNumber(point.y),
                                        series: series.name || "",
                                        label: point.label || "",
                                    });
                                }
                            });
                        }
                    });

                    resultJson.tables.push(table);
                }
            }
        );
    }

    // 13. Saved Variables
    if (data.saved_variables) {
        const vars = data.saved_variables;

        // Only process if we have any saved variables
        if (
            vars &&
            Object.keys(vars).some(
                (key) => Array.isArray(vars[key]) && vars[key].length > 0
            )
        ) {
            const table: Table = {
                key: "saved_variables",
                title: "Saved Variables",
                columnHeaders: [
                    { header: "Variable", key: "variable" },
                    { header: "Values", key: "values" },
                ],
                rows: [],
            };

            // Process each saved variable array
            Object.entries(vars).forEach(([varName, values]: [string, any]) => {
                if (Array.isArray(values) && values.length > 0) {
                    // Format variable name to be more readable
                    const formattedName = varName
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase());

                    table.rows.push({
                        rowHeader: [formattedName],
                        values: values
                            .map((v: any) => formatDisplayNumber(v))
                            .join(", "),
                    });
                }
            });

            resultJson.tables.push(table);
        }
    }

    return resultJson;
}
