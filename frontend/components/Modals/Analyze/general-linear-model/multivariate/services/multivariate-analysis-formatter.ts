import type { ResultJson, Row, Table } from "@/types/Table";
import { formatDisplayNumber, formatSig } from "@/hooks/useFormatter";

export function transformMultivariateResult(
    data: any,
    errors: string[] = []
): ResultJson {
    const resultJson: ResultJson = { tables: [] };

    if (!data) return resultJson;

    formatBetweenSubjectsFactors(data, resultJson);
    formatDescriptiveStatistics(data, resultJson);
    formatBoxTest(data, resultJson);
    formatBartlettTest(data, resultJson);
    formatLeveneTest(data, resultJson);
    formatMultivariateTests(data, resultJson);
    formatTestsBetweenSubjectsEffects(data, resultJson);
    formatParameterEstimates(data, resultJson);
    formatBetweenSubjectsSSCP(data, resultJson);
    formatResidualMatrix(data, resultJson);
    formatSSCPMatrix(data, resultJson);
    formatContrastCoefficients(data, resultJson);
    formatGeneralEstimableFunction(data, resultJson);
    formatPosthocTests(data, resultJson);
    formatHomogeneousSubsets(data, resultJson);
    formatEmmeans(data, resultJson);
    formatSpreadVsLevel(data, resultJson);
    formatSavedVariables(data, resultJson);
    formatErrors(errors, resultJson);

    return resultJson;
}

// ── 1. Between-Subjects Factors ──────────────────────────────────────────────
function formatBetweenSubjectsFactors(data: any, resultJson: ResultJson) {
    if (!data.between_subjects_factors) return;

    const table: Table = {
        key: "between_subjects_factors",
        title: "Between-Subjects Factors",
        columnHeaders: [
            { header: "", key: "factor" },
            { header: "", key: "value_label" },
            { header: "N", key: "n" },
        ],
        rows: [],
        interpretation:
            "This table displays the levels of each between-subjects factor and the number of cases (N) at each level. It provides a summary of the categorical structure of the data used in the analysis.",
    };

    Object.entries(data.between_subjects_factors).forEach(
        ([factorName, factorData]: [string, any]) => {
            const valueCounts: Record<string, number> = factorData.value_counts || {};
            const entries = Object.entries(valueCounts);
            entries.forEach(([levelLabel, count], idx) => {
                table.rows.push({
                    rowHeader: [],
                    factor: idx === 0 ? factorName : "",
                    value_label: levelLabel,
                    n: String(count),
                });
            });
        }
    );

    resultJson.tables.push(table);
}

// ── 2. Descriptive Statistics ─────────────────────────────────────────────────
function formatDescriptiveStatistics(data: any, resultJson: ResultJson) {
    if (!data.descriptive_statistics) return;

    Object.entries(data.descriptive_statistics).forEach(
        ([dvName, stat]: [string, any]) => {
            const table: Table = {
                key: `descriptive_statistics_${dvName}`,
                title: `Descriptive Statistics — Dependent Variable: ${dvName}`,
                columnHeaders: [
                    { header: "", key: "group_label" },
                    { header: "Mean", key: "mean" },
                    { header: "Std. Deviation", key: "std_deviation" },
                    { header: "N", key: "n" },
                ],
                rows: [],
                interpretation:
                    "This table displays the mean, standard deviation, and count (N) for the dependent variable, broken down by each level of the specified factors and their combinations.",
            };

            function flattenGroups(gs: any[], depth: number) {
                gs.forEach((g: any) => {
                    const indent = "\u00a0".repeat(depth * 4);
                    if (g.stats) {
                        table.rows.push({
                            rowHeader: [],
                            group_label: `${indent}${g.factor_value || "Total"}`,
                            mean: formatDisplayNumber(g.stats.mean),
                            std_deviation: formatDisplayNumber(g.stats.std_deviation),
                            n: String(g.stats.n),
                        });
                    }
                    if (g.subgroups && g.subgroups.length > 0) {
                        flattenGroups(g.subgroups, depth + 1);
                    }
                });
            }
            flattenGroups(stat.groups || [], 0);

            resultJson.tables.push(table);
        }
    );
}

// ── 3. Box's M Test ───────────────────────────────────────────────────────────
function formatBoxTest(data: any, resultJson: ResultJson) {
    if (!data.box_test) return;

    const b = data.box_test;
    const table: Table = {
        key: "box_m_test",
        title: "Box's Test of Equality of Covariance Matrices",
        columnHeaders: [
            { header: "", key: "stat_label" },
            { header: "", key: "stat_value" },
        ],
        rows: [
            { rowHeader: [], stat_label: "Box's M", stat_value: formatDisplayNumber(b.box_m) },
            { rowHeader: [], stat_label: "F",       stat_value: formatDisplayNumber(b.f) },
            { rowHeader: [], stat_label: "df1",     stat_value: String(b.df1) },
            { rowHeader: [], stat_label: "df2",     stat_value: formatDisplayNumber(b.df2) },
            { rowHeader: [], stat_label: "Sig.",    stat_value: formatSig(b.significance) },
        ],
        note: b.description || "Tests the null hypothesis that the observed covariance matrices of the dependent variables are equal across groups.",
        interpretation:
            "Tests the assumption of homogeneity of covariance matrices across groups. A non-significant result (Sig. > .05) supports the multivariate assumption that the variance-covariance matrices are equal across groups.",
    };

    resultJson.tables.push(table);
}

// ── 4. Bartlett's Test ────────────────────────────────────────────────────────
function formatBartlettTest(data: any, resultJson: ResultJson) {
    if (!data.bartlett_test) return;

    const b = data.bartlett_test;
    const table: Table = {
        key: "bartlett_test",
        title: "Bartlett's Test of Sphericity",
        columnHeaders: [
            { header: "", key: "stat_label" },
            { header: "", key: "stat_value" },
        ],
        rows: [
            { rowHeader: [], stat_label: "Likelihood Ratio",   stat_value: formatDisplayNumber(b.likelihood_ratio) },
            { rowHeader: [], stat_label: "Approx. Chi-Square", stat_value: formatDisplayNumber(b.approx_chi_square) },
            { rowHeader: [], stat_label: "df",                 stat_value: String(b.df) },
            { rowHeader: [], stat_label: "Sig.",               stat_value: formatSig(b.significance) },
        ],
        note: b.description,
        interpretation:
            "Tests the sphericity of the residual covariance matrix. A significant result (Sig. < .05) indicates that the dependent variables are sufficiently correlated to justify a multivariate analysis.",
    };

    resultJson.tables.push(table);
}

// ── 5. Levene's Test ──────────────────────────────────────────────────────────
function formatLeveneTest(data: any, resultJson: ResultJson) {
    if (!data.levene_test) return;

    const tests: any[] = Array.isArray(data.levene_test)
        ? data.levene_test
        : [data.levene_test];

    tests.forEach((lt: any) => {
        const table: Table = {
            key: `levene_test_${lt.dependent_variable}`,
            title: `Levene's Test of Equality of Error Variances — Dependent Variable: ${lt.dependent_variable}`,
            columnHeaders: [
                { header: "Based on", key: "function" },
                { header: "Levene Statistic", key: "levene_statistic" },
                { header: "df1", key: "df1" },
                { header: "df2", key: "df2" },
                { header: "Sig.", key: "significance" },
            ],
            rows: [],
            interpretation:
                "Tests the null hypothesis that the error variance of the dependent variable is equal across groups. A non-significant result (Sig. > .05) supports the homogeneity-of-variance assumption required for between-subjects analyses.",
        };

        const leveneList: any[] = lt.levene || [];
        leveneList.forEach((entry: any) => {
            table.rows.push({
                rowHeader: [],
                function: entry.function || entry.test_basis || "Mean",
                levene_statistic: formatDisplayNumber(entry.levene_statistic),
                df1: String(entry.df1),
                df2: String(entry.df2),
                significance: formatSig(entry.significance),
            });
        });

        resultJson.tables.push(table);
    });
}

// ── 6. Multivariate Tests (Pillai / Wilks / Hotelling / Roy) ─────────────────
function formatMultivariateTests(data: any, resultJson: ResultJson) {
    if (!data.multivariate_tests) return;

    const mt = data.multivariate_tests;
    const effects: Record<string, Record<string, any>> = mt.effects || {};

    const table: Table = {
        key: "multivariate_tests",
        title: "Multivariate Tests",
        columnHeaders: [
            { header: "Effect", key: "effect" },
            { header: "", key: "test_name" },
            { header: "Value", key: "value" },
            { header: "F", key: "f" },
            { header: "Hypothesis df", key: "hypothesis_df" },
            { header: "Error df", key: "error_df" },
            { header: "Sig.", key: "significance" },
            { header: "Partial Eta Squared", key: "partial_eta_squared" },
            { header: "Noncent. Parameter", key: "noncent_parameter" },
            { header: "Observed Power", key: "observed_power" },
        ],
        rows: [],
        note: mt.design,
        interpretation:
            "Tests the joint effect of each predictor on the combined dependent variables using four multivariate statistics (Pillai's Trace, Wilks' Lambda, Hotelling's Trace, Roy's Largest Root). A significant Sig. (< .05) indicates that the effect significantly influences the joint distribution of the dependent variables.",
    };

    const testOrder = [
        "Pillai's Trace",
        "Wilks' Lambda",
        "Hotelling's Trace",
        "Roy's Largest Root",
    ];

    Object.entries(effects).forEach(([effectName, testMap]: [string, any]) => {
        let isFirstRow = true;
        testOrder.forEach((testName) => {
            const entry = testMap[testName];
            if (!entry) return;

            const row: Row = {
                rowHeader: [],
                effect: isFirstRow ? effectName : "",
                test_name: testName,
                value: formatDisplayNumber(entry.value),
                f: formatDisplayNumber(entry.f),
                hypothesis_df: formatDisplayNumber(entry.hypothesis_df),
                error_df: formatDisplayNumber(entry.error_df),
                significance: formatSig(entry.significance),
                partial_eta_squared: formatDisplayNumber(entry.partial_eta_squared),
                noncent_parameter: formatDisplayNumber(entry.noncent_parameter),
                observed_power: formatDisplayNumber(entry.observed_power),
            };
            table.rows.push(row);
            isFirstRow = false;
        });
    });

    resultJson.tables.push(table);
}

// ── 7. Tests of Between-Subjects Effects ─────────────────────────────────────
function formatTestsBetweenSubjectsEffects(data: any, resultJson: ResultJson) {
    if (!data.tests_of_between_subjects_effects) return;

    const tbs = data.tests_of_between_subjects_effects;
    // Structure from Rust: effects: { [dvName]: { [sourceName]: entry } }
    const effects: Record<string, Record<string, any>> = tbs.effects || {};

    // DV names are the outer keys (preserves insertion order).
    const dvNames: string[] = Object.keys(effects);

    // Source names are the inner keys; collect across all DVs preserving order.
    const sourceNames: string[] = [];
    const seenSrc = new Set<string>();
    dvNames.forEach((dv) => {
        Object.keys(effects[dv] || {}).forEach((src) => {
            if (!seenSrc.has(src)) {
                seenSrc.add(src);
                sourceNames.push(src);
            }
        });
    });

    // Order sources to match SPSS: Corrected Model, Intercept, [factors/covariates],
    // Error, Total, Corrected Total.
    const sourceOrder = (name: string): number => {
        const n = name.toLowerCase();
        if (n === "corrected model") return 0;
        if (n === "intercept") return 1;
        if (n === "error") return 3;
        if (n === "total") return 4;
        if (n === "corrected total") return 5;
        return 2;
    };
    sourceNames.sort((a, b) => sourceOrder(a) - sourceOrder(b));

    // Synthesize "Total" source (uncorrected): SS_total = SS_intercept + SS_corrected_total,
    // df_total = df_corrected_total + 1. Rust currently doesn't compute it.
    const totalEntries: Record<string, { sum_of_squares: number; df: number }> = {};
    dvNames.forEach((dv) => {
        const intercept = effects[dv]?.["Intercept"];
        const correctedTotal = effects[dv]?.["Corrected Total"];
        if (intercept && correctedTotal) {
            totalEntries[dv] = {
                sum_of_squares:
                    (intercept.sum_of_squares ?? 0) +
                    (correctedTotal.sum_of_squares ?? 0),
                df: (correctedTotal.df ?? 0) + 1,
            };
        }
    });
    if (Object.keys(totalEntries).length > 0 && !seenSrc.has("Total")) {
        const ctIdx = sourceNames.indexOf("Corrected Total");
        if (ctIdx >= 0) {
            sourceNames.splice(ctIdx, 0, "Total");
        } else {
            sourceNames.push("Total");
        }
    }

    // Build R Squared footnote for each DV (matches SPSS a/b/c suffixes).
    const noteLetters = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const noteLines: string[] = [];
    dvNames.forEach((dvName, idx) => {
        const rSq = tbs.r_squared?.[dvName];
        const adjRSq = tbs.adjusted_r_squared?.[dvName];
        if (rSq === undefined && adjRSq === undefined) return;
        const letter = noteLetters[idx] || "";
        const parts: string[] = [];
        if (rSq !== undefined) parts.push(`R Squared = ${formatDisplayNumber(rSq)}`);
        if (adjRSq !== undefined)
            parts.push(`(Adjusted R Squared = ${formatDisplayNumber(adjRSq)})`);
        noteLines.push(
            `${letter ? letter + ". " : ""}${parts.join(" ")} — ${dvName}`
        );
    });

    const table: Table = {
        key: "tests_between_subjects_effects",
        title: "Tests of Between-Subjects Effects",
        columnHeaders: [
            { header: "Source", key: "source" },
            { header: "Dependent Variable", key: "dependent_variable" },
            { header: "Type III Sum of Squares", key: "sum_of_squares" },
            { header: "df", key: "df" },
            { header: "Mean Square", key: "mean_square" },
            { header: "F", key: "f_value" },
            { header: "Sig.", key: "significance" },
            { header: "Partial Eta Squared", key: "partial_eta_squared" },
            { header: "Noncent. Parameter", key: "noncent_parameter" },
            { header: "Observed Power", key: "observed_power" },
        ],
        rows: [],
        note: noteLines.join("\n"),
        interpretation:
            "This table tests the hypothesis that each effect (e.g., factor or interaction) in the model is null. A significant F-value (Sig. < .05) suggests that the effect significantly contributes to explaining the variance in the dependent variable. The Partial Eta Squared indicates the proportion of variance uniquely explained by that effect.",
    };

    sourceNames.forEach((sourceName) => {
        const lower = sourceName.toLowerCase();
        // SPSS leaves these stats blank for Error, Total, and Corrected Total.
        const blankInferential =
            lower === "error" || lower === "total" || lower === "corrected total";
        // Mean Square is also blank for Total and Corrected Total (but shown for Error).
        const blankMeanSquare = lower === "total" || lower === "corrected total";

        dvNames.forEach((dvName, dvIdx) => {
            const entry =
                sourceName === "Total"
                    ? totalEntries[dvName]
                    : effects[dvName]?.[sourceName];
            if (!entry) return;
            table.rows.push({
                rowHeader: [],
                // Show source label only on the first DV row of the group (SPSS merges).
                source: dvIdx === 0 ? sourceName : "",
                dependent_variable: dvName,
                sum_of_squares: formatDisplayNumber(entry.sum_of_squares),
                df: entry.df !== undefined && entry.df !== null ? String(entry.df) : "",
                mean_square: blankMeanSquare ? "" : formatDisplayNumber(entry.mean_square),
                f_value: blankInferential ? "" : formatDisplayNumber(entry.f_value),
                significance: blankInferential ? "" : formatSig(entry.significance),
                partial_eta_squared: blankInferential
                    ? ""
                    : formatDisplayNumber(entry.partial_eta_squared),
                noncent_parameter: blankInferential
                    ? ""
                    : formatDisplayNumber(entry.noncent_parameter),
                observed_power: blankInferential
                    ? ""
                    : formatDisplayNumber(entry.observed_power),
            });
        });
    });

    resultJson.tables.push(table);
}

// ── 8. Parameter Estimates ────────────────────────────────────────────────────
function formatParameterEstimates(data: any, resultJson: ResultJson) {
    if (!data.parameter_estimates) return;

    const pe = data.parameter_estimates;
    const estimates: Record<string, any[]> = pe.estimates || {};

    Object.entries(estimates).forEach(([dvName, entries]: [string, any[]]) => {
        const table: Table = {
            key: `parameter_estimates_${dvName}`,
            title: `Parameter Estimates — Dependent Variable: ${dvName}`,
            columnHeaders: [
                { header: "Parameter", key: "parameter" },
                { header: "B", key: "b" },
                { header: "Std. Error", key: "std_error" },
                { header: "t", key: "t_value" },
                { header: "Sig.", key: "significance" },
                {
                    header: "95% Confidence Interval",
                    children: [
                        { header: "Lower Bound", key: "ci_lower" },
                        { header: "Upper Bound", key: "ci_upper" },
                    ],
                },
                { header: "Partial Eta Squared", key: "partial_eta_squared" },
                { header: "Noncent. Parameter", key: "noncent_parameter" },
                { header: "Observed Power", key: "observed_power" },
            ],
            rows: [],
            interpretation:
                "Displays the regression coefficient (B), standard error, t-statistic, significance, and 95% confidence interval for each model parameter. A significant Sig. (< .05) indicates that the parameter contributes significantly to predicting the dependent variable.",
        };

        entries.forEach((entry: any) => {
            table.rows.push({
                rowHeader: [],
                parameter: entry.parameter,
                b: formatDisplayNumber(entry.b),
                std_error: formatDisplayNumber(entry.std_error),
                t_value: formatDisplayNumber(entry.t_value),
                significance: formatSig(entry.significance),
                ci_lower: formatDisplayNumber(entry.confidence_interval?.lower_bound),
                ci_upper: formatDisplayNumber(entry.confidence_interval?.upper_bound),
                partial_eta_squared: entry.partial_eta_squared !== null
                    ? formatDisplayNumber(entry.partial_eta_squared)
                    : "",
                noncent_parameter: entry.noncent_parameter !== null
                    ? formatDisplayNumber(entry.noncent_parameter)
                    : "",
                observed_power: entry.observed_power !== null
                    ? formatDisplayNumber(entry.observed_power)
                    : "",
            });
        });

        resultJson.tables.push(table);
    });
}

// ── 9. Between-Subjects SSCP ──────────────────────────────────────────────────
function formatBetweenSubjectsSSCP(data: any, resultJson: ResultJson) {
    if (!data.between_subjects_sscp) return;

    const sscp = data.between_subjects_sscp;
    const matrices: Record<string, any> = sscp.matrices || {};

    Object.entries(matrices).forEach(([termName, matrixData]: [string, any]) => {
        const values: Record<string, Record<string, number>> = matrixData.values || {};
        const dvNames = Object.keys(values);

        const table: Table = {
            key: `between_subjects_sscp_${termName}`,
            title: `Between-Subjects SSCP Matrix — ${termName}`,
            columnHeaders: [
                { header: "", key: "row_dv" },
                ...dvNames.map((dv) => ({ header: dv, key: `col_${dv}` })),
            ],
            rows: [],
            note: sscp.based_on,
            interpretation:
                "Sums-of-squares-and-cross-products (SSCP) matrix for the specified effect. Diagonal entries are sums of squares; off-diagonal entries are cross-products between dependent variables. These matrices form the basis of the multivariate test statistics.",
        };

        dvNames.forEach((rowDv) => {
            const row: Row = { rowHeader: [], row_dv: rowDv };
            dvNames.forEach((colDv) => {
                row[`col_${colDv}`] = formatDisplayNumber(values[rowDv]?.[colDv]);
            });
            table.rows.push(row);
        });

        resultJson.tables.push(table);
    });
}

// ── 10. Residual SSCP Matrix ──────────────────────────────────────────────────
function formatResidualMatrix(data: any, resultJson: ResultJson) {
    if (!data.residual_matrix) return;

    const rm = data.residual_matrix;
    const values: Record<string, Record<string, number>> = rm.values || {};
    const dvNames = Object.keys(values);

    const table: Table = {
        key: "residual_sscp_matrix",
        title: "Residual SSCP Matrix",
        columnHeaders: [
            { header: "", key: "row_dv" },
            ...dvNames.map((dv) => ({ header: dv, key: `col_${dv}` })),
        ],
        rows: [],
        note: rm.description,
        interpretation:
            "Sums-of-squares-and-cross-products matrix of the residuals (the E matrix). It serves as the error term for multivariate test statistics and provides the basis for examining correlations among the dependent variables after fitting the model.",
    };

    dvNames.forEach((rowDv) => {
        const row: Row = { rowHeader: [], row_dv: rowDv };
        dvNames.forEach((colDv) => {
            row[`col_${colDv}`] = formatDisplayNumber(values[rowDv]?.[colDv]);
        });
        table.rows.push(row);
    });

    resultJson.tables.push(table);
}

// ── 11. SSCP Matrix ───────────────────────────────────────────────────────────
function formatSSCPMatrix(data: any, resultJson: ResultJson) {
    if (!data.sscp_matrix) return;

    const sscp = data.sscp_matrix;
    const categories: Record<string, Record<string, Record<string, number>>> =
        sscp.categories || {};

    Object.entries(categories).forEach(([categoryName, matrixData]: [string, any]) => {
        const dvNames = Object.keys(matrixData);

        const table: Table = {
            key: `sscp_matrix_${categoryName}`,
            title: `SSCP Matrix — ${categoryName}`,
            columnHeaders: [
                { header: "", key: "row_dv" },
                ...dvNames.map((dv) => ({ header: dv, key: `col_${dv}` })),
            ],
            rows: [],
            interpretation:
                "Sums-of-squares-and-cross-products matrix per effect category, showing how the variability for that effect is distributed across and between the dependent variables.",
        };

        dvNames.forEach((rowDv) => {
            const row: Row = { rowHeader: [], row_dv: rowDv };
            dvNames.forEach((colDv) => {
                row[`col_${colDv}`] = formatDisplayNumber(matrixData[rowDv]?.[colDv]);
            });
            table.rows.push(row);
        });

        resultJson.tables.push(table);
    });
}

// ── 12. Contrast Coefficients ─────────────────────────────────────────────────
function formatContrastCoefficients(data: any, resultJson: ResultJson) {
    if (!data.contrast_coefficients) return;

    const cc = data.contrast_coefficients;
    const table: Table = {
        key: "contrast_coefficients",
        title: "Contrast Coefficients",
        columnHeaders: [
            { header: "Parameter", key: "parameter" },
            { header: "Coefficient", key: "coefficient" },
        ],
        rows: [],
        interpretation:
            "This matrix provides the coefficients for the linear combinations of model parameters that form the basis for testing the hypothesis for the chosen contrast. Each row corresponds to a specific contrast.",
    };

    const params: string[] = cc.parameter || [];
    const coefficients: number[] = cc.coefficients || [];
    params.forEach((param: string, idx: number) => {
        table.rows.push({
            rowHeader: [],
            parameter: param,
            coefficient: formatDisplayNumber(coefficients[idx]),
        });
    });

    if (table.rows.length > 0) resultJson.tables.push(table);
}

// ── 14. General Estimable Function ───────────────────────────────────────────
function formatGeneralEstimableFunction(data: any, resultJson: ResultJson) {
    if (!data.general_estimable_function) return;

    const gef = data.general_estimable_function;
    const matrix: Record<string, Record<string, number>> = gef.matrix || {};
    const rowKeys = Object.keys(matrix);
    if (rowKeys.length === 0) return;

    const colKeys = Object.keys(matrix[rowKeys[0]] || {});

    const table: Table = {
        key: "general_estimable_function",
        title: "General Estimable Function",
        columnHeaders: [
            { header: "Parameter", key: "param_name" },
            ...colKeys.map((k) => ({ header: k, key: `col_${k}` })),
        ],
        rows: [],
        note: gef.design,
        interpretation:
            "Displays the linear combinations of model parameters that are estimable, given the chosen model and Sum of Squares method. Each row defines an estimable function used in hypothesis testing.",
    };

    rowKeys.forEach((rowKey) => {
        const row: Row = { rowHeader: [], param_name: rowKey };
        colKeys.forEach((colKey) => {
            row[`col_${colKey}`] = String(matrix[rowKey]?.[colKey] ?? "");
        });
        table.rows.push(row);
    });

    resultJson.tables.push(table);
}

// ── 15. Post Hoc Tests ────────────────────────────────────────────────────────
function formatPosthocTests(data: any, resultJson: ResultJson) {
    if (!data.posthoc_tests) return;

    const posthoc: Record<string, any[]> = data.posthoc_tests;

    Object.entries(posthoc).forEach(([dvName, tests]: [string, any[]]) => {
        const table: Table = {
            key: `posthoc_tests_${dvName}`,
            title: `Multiple Comparisons — Dependent Variable: ${dvName}`,
            columnHeaders: [
                { header: "Test", key: "test_type" },
                { header: "Factor", key: "factor_name" },
                { header: "(I)", key: "i_level" },
                { header: "(J)", key: "j_level" },
                { header: "Mean Difference (I-J)", key: "mean_difference" },
                { header: "Std. Error", key: "std_error" },
                { header: "Sig.", key: "significance" },
                {
                    header: "95% Confidence Interval",
                    children: [
                        { header: "Lower Bound", key: "ci_lower" },
                        { header: "Upper Bound", key: "ci_upper" },
                    ],
                },
            ],
            rows: [],
            interpretation:
                "Pairwise comparisons of factor level means with adjusted significance values and confidence intervals. A significant Sig. (< .05) indicates a statistically significant difference between the two means after correcting for multiple comparisons.",
        };

        tests.forEach((entry: any) => {
            table.rows.push({
                rowHeader: [],
                test_type: entry.test_type,
                factor_name: entry.factor_name,
                i_level: entry.i_level,
                j_level: entry.j_level,
                mean_difference: formatDisplayNumber(entry.mean_difference),
                std_error: formatDisplayNumber(entry.std_error),
                significance: formatSig(entry.significance),
                ci_lower: formatDisplayNumber(entry.confidence_interval?.lower_bound),
                ci_upper: formatDisplayNumber(entry.confidence_interval?.upper_bound),
            });
        });

        if (table.rows.length > 0) resultJson.tables.push(table);
    });
}

// ── 16. Homogeneous Subsets ───────────────────────────────────────────────────
function formatHomogeneousSubsets(data: any, resultJson: ResultJson) {
    if (!data.homogeneous_subsets) return;

    const hs: Record<string, Record<string, any>> = data.homogeneous_subsets;

    Object.entries(hs).forEach(([dvName, testMap]: [string, any]) => {
        Object.entries(testMap).forEach(([testName, subsets]: [string, any]) => {
            const groups: any[] = subsets.groups || [];
            const subsetKeys = new Set<number>();
            groups.forEach((g: any) => {
                Object.keys(g.subsets || {}).forEach((k) => subsetKeys.add(Number(k)));
            });
            const sortedSubsetKeys = Array.from(subsetKeys).sort((a, b) => a - b);

            const table: Table = {
                key: `homogeneous_subsets_${dvName}_${testName}`,
                title: `${testName} — Dependent Variable: ${dvName}`,
                columnHeaders: [
                    { header: subsets.test_name || testName, key: "factor_value" },
                    { header: "N", key: "n" },
                    ...sortedSubsetKeys.map((k) => ({
                        header: `Subset ${k}`,
                        key: `subset_${k}`,
                    })),
                ],
                rows: [],
                note: subsets.notes?.join(" "),
                interpretation:
                    "Groups factor levels into subsets whose means are not statistically different from one another. Levels appearing in the same subset are not significantly different at the chosen alpha level.",
            };

            groups.forEach((g: any) => {
                const row: Row = {
                    rowHeader: [],
                    factor_value: g.factor_value,
                    n: String(g.n),
                };
                sortedSubsetKeys.forEach((k) => {
                    row[`subset_${k}`] =
                        g.subsets[k] !== undefined
                            ? formatDisplayNumber(g.subsets[k])
                            : "";
                });
                table.rows.push(row);
            });

            if (table.rows.length > 0) resultJson.tables.push(table);
        });
    });
}

// ── 17. Estimated Marginal Means ──────────────────────────────────────────────
function formatEmmeans(data: any, resultJson: ResultJson) {
    if (!data.emmeans) return;

    const emmeans: Record<string, any[]> = data.emmeans;

    Object.entries(emmeans).forEach(([factorKey, entries]: [string, any[]]) => {
        const table: Table = {
            key: `emmeans_${factorKey}`,
            title: `Estimated Marginal Means — ${factorKey}`,
            columnHeaders: [
                { header: "Dependent Variable", key: "dependent_variable" },
                { header: factorKey, key: "factor_value" },
                { header: "Mean", key: "mean" },
                { header: "Std. Error", key: "std_error" },
                {
                    header: "95% Confidence Interval",
                    children: [
                        { header: "Lower Bound", key: "ci_lower" },
                        { header: "Upper Bound", key: "ci_upper" },
                    ],
                },
            ],
            rows: [],
            interpretation:
                "This table shows the Estimated Marginal Means (EMMs) — the adjusted means for each level of the factor, controlling for other variables in the model. Useful for interpreting effects after accounting for covariates.",
        };

        entries.forEach((entry: any) => {
            table.rows.push({
                rowHeader: [],
                dependent_variable: entry.dependent_variable,
                factor_value: entry.factor_value,
                mean: formatDisplayNumber(entry.mean),
                std_error: formatDisplayNumber(entry.std_error),
                ci_lower: formatDisplayNumber(entry.confidence_interval?.lower_bound),
                ci_upper: formatDisplayNumber(entry.confidence_interval?.upper_bound),
            });
        });

        if (table.rows.length > 0) resultJson.tables.push(table);
    });
}

// ── 18. Spread vs. Level ──────────────────────────────────────────────────────
function formatSpreadVsLevel(data: any, resultJson: ResultJson) {
    if (!data.spread_vs_level_plots) return;

    const plots: Record<string, any> = data.spread_vs_level_plots;

    Object.entries(plots).forEach(([dvName, plotData]: [string, any]) => {
        const points: any[] = plotData.points || [];
        const table: Table = {
            key: `spread_vs_level_${dvName}`,
            title: `Spread vs. Level — Dependent Variable: ${dvName}`,
            columnHeaders: [
                { header: "Level Mean", key: "level_mean" },
                { header: "Spread (Std. Deviation)", key: "spread_standard_deviation" },
            ],
            rows: [],
            interpretation:
                "Pairs each group's mean against its standard deviation. A systematic relationship between spread and level suggests that variance differs by group, which violates the homogeneity-of-variance assumption.",
        };

        points.forEach((p: any) => {
            table.rows.push({
                rowHeader: [],
                level_mean: formatDisplayNumber(p.level_mean),
                spread_standard_deviation: formatDisplayNumber(p.spread_standard_deviation),
            });
        });

        if (table.rows.length > 0) resultJson.tables.push(table);
    });
}

// ── 19. Saved Variables summary ───────────────────────────────────────────────
function formatSavedVariables(data: any, resultJson: ResultJson) {
    if (!data.saved_variables) return;

    const sv = data.saved_variables;
    const varValues: Record<string, number[]> = sv.variable_values || {};
    const varNames = Object.keys(varValues);
    if (varNames.length === 0) return;

    const n = varValues[varNames[0]]?.length || 0;

    const table: Table = {
        key: "saved_variables_table",
        title: "Saved Variables",
        columnHeaders: [
            { header: "Case", key: "case" },
            ...varNames.map((v) => ({ header: v, key: v })),
        ],
        rows: [],
        interpretation:
            "Per-case predicted values, residuals, and diagnostic measures saved as new variables based on the fitted model. Useful for inspecting the model's fit and identifying influential observations.",
    };

    for (let i = 0; i < n; i++) {
        const row: Row = { rowHeader: [], case: String(i + 1) };
        varNames.forEach((v) => {
            row[v] = formatDisplayNumber(varValues[v][i]);
        });
        table.rows.push(row);
    }

    resultJson.tables.push(table);
}

// ── 20. Errors ────────────────────────────────────────────────────────────────
function formatErrors(errors: string[], resultJson: ResultJson) {
    if (!errors || errors.length === 0) return;

    if (errors.length === 1 && errors[0] === "No errors occurred.") {
        resultJson.tables.push({
            key: "error_table",
            title: "Errors Logs",
            columnHeaders: [{ header: "Message", key: "message" }],
            rows: [{ rowHeader: [], message: "No errors occurred." }],
            interpretation: "Errors logs from the analysis.",
        });
        return;
    }

    const table: Table = {
        key: "error_table",
        title: "Errors Logs",
        columnHeaders: [
            { header: "Context", key: "context" },
            { header: "Message", key: "message" },
        ],
        rows: [],
        interpretation: "Errors logs from the analysis.",
    };

    let currentContext = "";
    let isFirstRowForContext = true;

    const errorLines =
        errors[0] === "Error Summary:" ? errors.slice(1) : errors;

    errorLines.forEach((line: string) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("Context: ")) {
            currentContext = trimmed.replace("Context: ", "").trim();
            isFirstRowForContext = true;
        } else if (trimmed) {
            const message = trimmed.replace(/^\d+\.\s*/, "");
            table.rows.push({
                rowHeader: [],
                context: isFirstRowForContext ? currentContext : "",
                message,
            });
            isFirstRowForContext = false;
        }
    });

    resultJson.tables.push(table);
}
