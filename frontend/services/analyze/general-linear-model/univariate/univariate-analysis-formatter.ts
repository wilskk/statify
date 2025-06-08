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
        if (Array.isArray(data.between_subjects_factors)) {
            data.between_subjects_factors.forEach((factorGroup: any) => {
                const factorName = factorGroup.name;
                if (factorGroup.factors && Array.isArray(factorGroup.factors)) {
                    factorGroup.factors.forEach(
                        (factor: any, index: number) => {
                            table.rows.push({
                                rowHeader: [],
                                factor: index === 0 ? factorName : "",
                                value: factor.name,
                                n: String(factor.value),
                            });
                        }
                    );
                }
            });
        }

        resultJson.tables.push(table);
    }

    // 2. Descriptive Statistics table
    if (data.descriptive_statistics) {
        Object.values(data.descriptive_statistics).forEach((stat: any) => {
            const factorKeys = stat.factor_names.map((name: string) =>
                name.toLowerCase().replace(/\s+/g, "_")
            );
            const factorHeaders = stat.factor_names.map(
                (name: string, i: number) => ({
                    header: name.charAt(0).toUpperCase() + name.slice(1),
                    key: factorKeys[i],
                })
            );

            const table: Table = {
                key: "descriptive_statistics",
                title: `Descriptive Statistics - Dependent Variable: ${stat.dependent_variable}`,
                columnHeaders: [
                    ...factorHeaders,
                    { header: "Mean", key: "mean" },
                    { header: "Std. Deviation", key: "std_deviation" },
                    { header: "N", key: "n" },
                ],
                rows: [],
            };

            const allRows: Row[] = [];

            function addRows(groups: any[], path: { [key: string]: string }) {
                groups.forEach((group) => {
                    const newPath: { [key: string]: string } = {
                        ...path,
                        [group.factor_name]: group.factor_value,
                    };

                    const isLeafNode =
                        !group.subgroups || group.subgroups.length === 0;

                    if (isLeafNode) {
                        const row: { [key: string]: any } = { rowHeader: [] };
                        const factorValues = Object.fromEntries(
                            stat.factor_names.map((name: string) => [
                                name.toLowerCase().replace(/\s+/g, "_"),
                                newPath[name],
                            ])
                        );
                        Object.assign(row, factorValues);

                        row.mean = formatDisplayNumber(group.stats.mean);
                        const stdDev = group.stats.std_deviation;
                        row.std_deviation =
                            stdDev === null || isNaN(stdDev)
                                ? "."
                                : formatDisplayNumber(stdDev);
                        row.n = group.stats.n;
                        allRows.push(row as Row);
                    } else {
                        addRows(group.subgroups, newPath);
                    }
                });
            }

            if (stat.groups) {
                addRows(stat.groups, {});
            }

            const processedRows: Row[] = [];
            const lastFactorValues: (string | null)[] = new Array(
                stat.factor_names.length
            ).fill(null);

            allRows.forEach((row) => {
                const newRow: any = { ...row };
                for (let i = 0; i < stat.factor_names.length; i++) {
                    const key = factorKeys[i];
                    if (newRow[key] === lastFactorValues[i]) {
                        newRow[key] = "";
                    } else {
                        lastFactorValues[i] = newRow[key] as string;
                        for (let j = i + 1; j < stat.factor_names.length; j++) {
                            lastFactorValues[j] = null;
                        }
                    }
                }
                processedRows.push(newRow as Row);
            });

            table.rows = processedRows;
            resultJson.tables.push(table);
        });
    }

    // 3. Levene's Test table
    if (data.levene_test && data.levene_test.length > 0) {
        const firstTest = data.levene_test[0];
        const isSimpleLevene =
            firstTest &&
            firstTest.entries &&
            firstTest.entries.length === 1 &&
            firstTest.entries[0].function === "Levene";

        if (isSimpleLevene) {
            data.levene_test.forEach((test: any) => {
                const entry = test.entries[0];
                const table: any = {
                    key: `levene_test_${test.dependent_variable.replace(
                        /\s+/g,
                        "_"
                    )}`,
                    title: "Levene's Test of Equality of Error Variances<sup>a</sup>",
                    subtitle: `Dependent Variable: ${test.dependent_variable}`,
                    columnHeaders: [
                        { header: "F", key: "f" },
                        { header: "df1", key: "df1" },
                        { header: "df2", key: "df2" },
                        { header: "Sig.", key: "sig" },
                    ],
                    rows: [
                        {
                            f: formatDisplayNumber(entry.levene_statistic),
                            df1: entry.df1,
                            df2: formatDisplayNumber(entry.df2),
                            sig: formatDisplayNumber(entry.significance),
                        },
                    ],
                };

                const nullColumns = {
                    f: null,
                    df1: null,
                    df2: null,
                    sig: null,
                };

                table.rows.push({
                    rowHeader: [
                        "Tests the null hypothesis that the error variance of the dependent variable is equal across groups.",
                    ],
                    ...nullColumns,
                });

                if (test.design) {
                    table.rows.push({
                        rowHeader: [`a. Design: ${test.design}`],
                        ...nullColumns,
                    });
                }

                resultJson.tables.push(table);
            });
        } else {
            const table: Table = {
                key: "levene_test",
                title: "Levene's Test of Equality of Error Variances<sup>a,b</sup>",
                columnHeaders: [
                    { header: "", key: "dependent_variable" },
                    { header: "", key: "based_on" },
                    { header: "Levene Statistic", key: "levene_statistic" },
                    { header: "df1", key: "df1" },
                    { header: "df2", key: "df2" },
                    { header: "Sig.", key: "sig" },
                ],
                rows: [],
            };

            data.levene_test.forEach((test: any) => {
                if (test.entries && test.entries.length > 0) {
                    test.entries.forEach((entry: any, entryIndex: number) => {
                        table.rows.push({
                            rowHeader: [],
                            dependent_variable:
                                entryIndex === 0 ? test.dependent_variable : "",
                            based_on: entry.function,
                            levene_statistic: formatDisplayNumber(
                                entry.levene_statistic
                            ),
                            df1: entry.df1,
                            df2: formatDisplayNumber(entry.df2),
                            sig: formatDisplayNumber(entry.significance),
                        });
                    });
                }
            });

            const nullColumns = {
                levene_statistic: null,
                df1: null,
                df2: null,
                sig: null,
            };

            table.rows.push({
                rowHeader: [
                    "Tests the null hypothesis that the error variance of the dependent variable is equal across groups.",
                ],
                ...nullColumns,
            });

            const firstTest = data.levene_test[0];
            if (firstTest) {
                table.rows.push({
                    rowHeader: [
                        `a. Dependent variable: ${firstTest.dependent_variable}`,
                    ],
                    ...nullColumns,
                });
            }
            if (firstTest && firstTest.design) {
                table.rows.push({
                    rowHeader: [`b. Design: ${firstTest.design}`],
                    ...nullColumns,
                });
            }

            resultJson.tables.push(table);
        }
    }

    // 3.5 Heteroscedasticity Tests
    if (data.heteroscedasticity_tests) {
        const tests = data.heteroscedasticity_tests;
        const formatSig = (value: any) => {
            if (
                value === null ||
                typeof value === "undefined" ||
                isNaN(value)
            ) {
                return null;
            }
            if (value < 0.001) {
                return "<.001";
            }
            return formatDisplayNumber(value);
        };

        // Breusch-Pagan Test
        if (tests.breusch_pagan) {
            const testData = tests.breusch_pagan;
            let depVarName = "Unknown";
            let designString = "";
            if (testData.note && Array.isArray(testData.note)) {
                testData.note.forEach((note: string) => {
                    if (note.startsWith("__DEP_VAR:")) {
                        depVarName = note.replace("__DEP_VAR:", "");
                    } else if (note.startsWith("__DESIGN:")) {
                        designString = note.replace("__DESIGN:", "");
                    }
                });
            }

            const table: Table = {
                key: "hetero_breusch_pagan",
                title: "Breusch-Pagan Test for Heteroskedasticity<sup>a,b,c</sup>",
                columnHeaders: [
                    { header: "", key: "dependent_variable" },
                    { header: "Chi-Square", key: "statistic" },
                    { header: "df", key: "df" },
                    { header: "Sig.", key: "sig" },
                ],
                rows: [],
            };

            table.rows.push({
                rowHeader: [],
                statistic: formatDisplayNumber(testData.statistic),
                df: testData.df,
                sig: formatSig(testData.p_value),
            });

            const nullColumns = { statistic: null, df: null, sig: null };
            table.rows.push({
                rowHeader: [`a. Dependent variable: ${depVarName}`],
                ...nullColumns,
            });
            table.rows.push({
                rowHeader: [
                    "b. Tests the null hypothesis that the variance of the errors does not depend on the values of the independent variables.",
                ],
                ...nullColumns,
            });
            table.rows.push({
                rowHeader: [`c. Predicted values from design: ${designString}`],
                ...nullColumns,
            });

            resultJson.tables.push(table);
        }

        // Modified Breusch-Pagan Test
        if (tests.modified_breusch_pagan) {
            const testData = tests.modified_breusch_pagan;
            let depVarName = "Unknown";
            let designString = "";
            if (testData.note && Array.isArray(testData.note)) {
                testData.note.forEach((note: string) => {
                    if (note.startsWith("__DEP_VAR:")) {
                        depVarName = note.replace("__DEP_VAR:", "");
                    } else if (note.startsWith("__DESIGN:")) {
                        designString = note.replace("__DESIGN:", "");
                    }
                });
            }

            const table: Table = {
                key: "hetero_modified_breusch_pagan",
                title: "Modified Breusch-Pagan Test for Heteroskedasticity<sup>a,b,c</sup>",
                columnHeaders: [
                    { header: "", key: "dependent_variable" },
                    { header: "Chi-Square", key: "statistic" },
                    { header: "df", key: "df" },
                    { header: "Sig.", key: "sig" },
                ],
                rows: [],
            };

            table.rows.push({
                rowHeader: [],
                statistic: formatDisplayNumber(testData.statistic),
                df: testData.df,
                sig: formatSig(testData.p_value),
            });

            const nullColumns = { statistic: null, df: null, sig: null };
            table.rows.push({
                rowHeader: [`a. Dependent variable: ${depVarName}`],
                ...nullColumns,
            });
            table.rows.push({
                rowHeader: [
                    "b. Tests the null hypothesis that the variance of the errors does not depend on the values of the independent variables.",
                ],
                ...nullColumns,
            });
            table.rows.push({
                rowHeader: [`c. Predicted values from design: ${designString}`],
                ...nullColumns,
            });

            resultJson.tables.push(table);
        }

        // White Test
        if (tests.white) {
            const testData = tests.white;
            let depVarName = "Unknown";
            let designString = "";
            if (testData.note && Array.isArray(testData.note)) {
                testData.note.forEach((note: string) => {
                    if (note.startsWith("__DEP_VAR:")) {
                        depVarName = note.replace("__DEP_VAR:", "");
                    } else if (note.startsWith("__DESIGN:")) {
                        designString = note.replace("__DESIGN:", "");
                    }
                });
            }

            const table: Table = {
                key: "hetero_white",
                title: "White Test for Heteroskedasticity<sup>a,b,c</sup>",
                columnHeaders: [
                    { header: "", key: "dependent_variable" },
                    { header: "Chi-Square", key: "statistic" },
                    { header: "df", key: "df" },
                    { header: "Sig.", key: "sig" },
                ],
                rows: [],
            };

            table.rows.push({
                rowHeader: [],
                statistic: formatDisplayNumber(testData.statistic),
                df: testData.df,
                sig: formatSig(testData.p_value),
            });

            const nullColumns = { statistic: null, df: null, sig: null };
            table.rows.push({
                rowHeader: [`a. Dependent variable: ${depVarName}`],
                ...nullColumns,
            });
            table.rows.push({
                rowHeader: [
                    "b. Tests the null hypothesis that the variance of the errors does not depend on the values of the independent variables.",
                ],
                ...nullColumns,
            });
            table.rows.push({
                rowHeader: [`c. Design: ${designString}`],
                ...nullColumns,
            });

            resultJson.tables.push(table);
        }

        // F Test
        if (tests.f_test) {
            const testData = tests.f_test;
            let depVarName = "Unknown";
            let designString = "";
            if (testData.note && Array.isArray(testData.note)) {
                testData.note.forEach((note: string) => {
                    if (note.startsWith("__DEP_VAR:")) {
                        depVarName = note.replace("__DEP_VAR:", "");
                    } else if (note.startsWith("__DESIGN:")) {
                        designString = note.replace("__DESIGN:", "");
                    }
                });
            }

            const table: Table = {
                key: "hetero_f_test",
                title: "F Test for Heteroskedasticity<sup>a,b,c</sup>",
                columnHeaders: [
                    { header: "", key: "dependent_variable" },
                    { header: "F", key: "statistic" },
                    { header: "df1", key: "df1" },
                    { header: "df2", key: "df2" },
                    { header: "Sig.", key: "sig" },
                ],
                rows: [],
            };

            table.rows.push({
                rowHeader: [],
                statistic: formatDisplayNumber(testData.statistic),
                df1: testData.df1,
                df2: testData.df2,
                sig: formatSig(testData.p_value),
            });

            const nullColumns = {
                statistic: null,
                df1: null,
                df2: null,
                sig: null,
            };
            table.rows.push({
                rowHeader: [`a. Dependent variable: ${depVarName}`],
                ...nullColumns,
            });
            table.rows.push({
                rowHeader: [
                    "b. Tests the null hypothesis that the variance of the errors does not depend on the values of the independent variables.",
                ],
                ...nullColumns,
            });
            table.rows.push({
                rowHeader: [`c. Predicted values from design: ${designString}`],
                ...nullColumns,
            });

            resultJson.tables.push(table);
        }
    }

    // 4. Tests of Between-Subjects Effects table
    if (data.tests_of_between_subjects_effects) {
        const effects = data.tests_of_between_subjects_effects;

        // Parse notes to get metadata
        let sigLevel = 0.05;
        let ssMethodString = "TypeIII"; // Default
        if (effects.notes && Array.isArray(effects.notes)) {
            effects.notes.forEach((note: string) => {
                if (note.startsWith("__SIG_LEVEL:")) {
                    sigLevel =
                        parseFloat(note.replace("__SIG_LEVEL:", "")) || 0.05;
                }
                if (note.startsWith("__SS_METHOD:")) {
                    ssMethodString = note.replace("__SS_METHOD:", "");
                }
            });
        }

        const formatCell = (value: any) => {
            if (
                value === null ||
                typeof value === "undefined" ||
                isNaN(value)
            ) {
                return null;
            }
            return formatDisplayNumber(value);
        };

        const formatSig = (value: any) => {
            if (
                value === null ||
                typeof value === "undefined" ||
                isNaN(value)
            ) {
                return null;
            }
            if (value < 0.001) {
                return "<.001";
            }
            return formatDisplayNumber(value);
        };

        const ssTypeMap: { [key: string]: string } = {
            TypeI: "I",
            TypeII: "II",
            TypeIII: "III",
            TypeIV: "IV",
        };
        const ssType = ssTypeMap[ssMethodString] || "III";
        const sumOfSquaresHeader = `Type ${ssType} Sum of Squares`;

        const depVarName =
            effects.dependent_variable ||
            (data.descriptive_statistics &&
                Object.values(data.descriptive_statistics).length > 0 &&
                (Object.values(data.descriptive_statistics)[0] as any)
                    .dependent_variable) ||
            "";

        const table: Table = {
            key: "tests_of_between_subjects_effects",
            title: `Tests of Between-Subjects Effects (Dependent Variable: ${depVarName})`,
            columnHeaders: [
                { header: "Source", key: "rowHeader" },
                {
                    header: sumOfSquaresHeader,
                    key: "sum_of_squares",
                },
                { header: "df", key: "df" },
                { header: "Mean Square", key: "mean_square" },
                { header: "F", key: "f" },
                { header: "Sig.", key: "sig" },
                {
                    header: "Partial Eta Squared",
                    key: "partial_eta_squared",
                },
                { header: "Noncent. Parameter", key: "noncent_parameter" },
                { header: "Observed Power<sup>b</sup>", key: "observed_power" },
            ],
            rows: [],
        };

        if (effects.sources && Array.isArray(effects.sources)) {
            const allSourceNames = effects.sources.map((s: any) => s.name);

            const sourceOrder = [
                "Corrected Model",
                "Intercept",
                ...allSourceNames
                    .filter(
                        (s: string) =>
                            ![
                                "Corrected Model",
                                "Intercept",
                                "Error",
                                "Total",
                                "Corrected Total",
                            ].includes(s)
                    )
                    .sort((a: string, b: string) => {
                        // Sort by interaction level, then alphabetically
                        const aInteractions = (a.match(/\*/g) || []).length;
                        const bInteractions = (b.match(/\*/g) || []).length;
                        if (aInteractions !== bInteractions) {
                            return aInteractions - bInteractions;
                        }
                        return a.localeCompare(b);
                    }),
                "Error",
                "Total",
                "Corrected Total",
            ].filter((s: string) => allSourceNames.includes(s));

            const sourcesMap = new Map(
                effects.sources.map((s: any) => [s.name, s.effect])
            );

            sourceOrder.forEach((sourceName) => {
                const effectData: any = sourcesMap.get(sourceName);
                if (!effectData) return;

                const sumOfSquares = formatCell(effectData.sum_of_squares);
                const row: Row = {
                    rowHeader: [
                        sourceName === "Corrected Model" &&
                        sumOfSquares !== null
                            ? `${sourceName}<sup>a</sup>`
                            : sourceName,
                    ],
                    sum_of_squares: sumOfSquares,
                    df: effectData.df,
                    mean_square: formatCell(effectData.mean_square),
                    f: formatCell(effectData.f_value),
                    sig: formatSig(effectData.significance),
                    partial_eta_squared: formatCell(
                        effectData.partial_eta_squared
                    ),
                    noncent_parameter: formatCell(effectData.noncent_parameter),
                    observed_power: formatCell(effectData.observed_power),
                };

                table.rows.push(row);
            });
        }

        const nullColumnsForNotes = {
            sum_of_squares: null,
            df: null,
            mean_square: null,
            f: null,
            sig: null,
            partial_eta_squared: null,
            noncent_parameter: null,
            observed_power: null,
        };

        if (
            effects.r_squared !== undefined &&
            effects.adjusted_r_squared !== undefined
        ) {
            table.rows.push({
                rowHeader: [
                    `a. R Squared = ${formatDisplayNumber(
                        effects.r_squared
                    )} (Adjusted R Squared = ${formatDisplayNumber(
                        effects.adjusted_r_squared
                    )})`,
                ],
                ...nullColumnsForNotes,
            });
        }

        table.rows.push({
            rowHeader: [
                `b. Computed using alpha = ${formatDisplayNumber(sigLevel)}`,
            ],
            ...nullColumnsForNotes,
        });

        resultJson.tables.push(table);
    }

    // 5. Parameter Estimates table
    if (data.parameter_estimates && data.parameter_estimates.estimates) {
        const estimates = data.parameter_estimates;
        let depVarName = "";
        const notes: string[] = [];
        let redundantNoteLetter: string | null = null;
        let alphaNoteLetter: string | null = null;
        let sigLevel = 0.05; // Default

        if (estimates.notes && Array.isArray(estimates.notes)) {
            estimates.notes.forEach((note: string) => {
                if (note.startsWith("__DEP_VAR:")) {
                    depVarName = note.replace("__DEP_VAR:", "");
                } else if (note.startsWith("__SIG_LEVEL:")) {
                    sigLevel = parseFloat(note.replace("__SIG_LEVEL:", ""));
                } else {
                    notes.push(note);
                    if (note.includes("redundant")) {
                        redundantNoteLetter = note.charAt(0);
                    }
                    if (note.includes("Computed using alpha")) {
                        alphaNoteLetter = note.charAt(0);
                    }
                }
            });
        }

        const formatSig = (value: any) => {
            if (
                value === null ||
                typeof value === "undefined" ||
                isNaN(value)
            ) {
                return null;
            }
            if (value < 0.001) {
                return "<.001";
            }
            return formatDisplayNumber(value);
        };

        const table: Table = {
            key: "parameter_estimates",
            title: `Parameter Estimates (Dependent Variable: ${depVarName})`,
            columnHeaders: [
                { header: "Parameter", key: "rowHeader" },
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
                {
                    header: "Partial Eta Squared",
                    key: "partial_eta_squared",
                },
                {
                    header: "Noncent. Parameter",
                    key: "noncent_parameter",
                },
                {
                    header: `Observed Power<sup>${alphaNoteLetter || ""}</sup>`,
                    key: "observed_power",
                },
            ],
            rows: [],
        };

        const redundantRowValues = {
            std_error: ".",
            t: ".",
            sig: ".",
            lower_bound: ".",
            upper_bound: ".",
            partial_eta_squared: ".",
            noncent_parameter: ".",
            observed_power: ".",
        };

        estimates.estimates.forEach((estimate: any) => {
            if (estimate.is_redundant) {
                table.rows.push({
                    rowHeader: [estimate.parameter],
                    b: `0<sup>${redundantNoteLetter || "a"}</sup>`,
                    ...redundantRowValues,
                });
            } else {
                table.rows.push({
                    rowHeader: [estimate.parameter],
                    b: formatDisplayNumber(estimate.b),
                    std_error: formatDisplayNumber(estimate.std_error),
                    t: formatDisplayNumber(estimate.t_value),
                    sig: formatSig(estimate.significance),
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
            }
        });

        const nullColumnsForNotes = {
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

        notes
            .filter(
                (note) =>
                    !note.startsWith("Observed Power") &&
                    !note.startsWith("Degrees of freedom")
            )
            .forEach((note) => {
                table.rows.push({
                    rowHeader: [note],
                    ...nullColumnsForNotes,
                });
            });

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
