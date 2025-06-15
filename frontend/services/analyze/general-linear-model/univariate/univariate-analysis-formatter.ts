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
                processedRows.push(newRow);
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
                    title: "Levene's Test of Equality of Error Variancesᵃ",
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
                title: "Levene's Test of Equality of Error Variancesᵃᵇ",
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
                title: "Breusch-Pagan Test for Heteroskedasticityᵃᵇᶜ",
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
                title: "Modified Breusch-Pagan Test for Heteroskedasticityᵃᵇᶜ",
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
                title: "White Test for Heteroskedasticityᵃᵇᶜ",
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
                title: "F Test for Heteroskedasticityᵃᵇᶜ",
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
                { header: "Observed Powerᵇ", key: "observed_power" },
            ],
            rows: [],
        };

        if (effects.sources && Array.isArray(effects.sources)) {
            const allSourceNames = effects.sources.map((s: any) => s.name);

            const sourceOrder = [
                "Corrected Model",
                "Model",
                "Intercept",
                ...allSourceNames
                    .filter(
                        (s: string) =>
                            ![
                                "Corrected Model",
                                "Model",
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
                            ? `${sourceName}ᵃ`
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
                    header: `Observed Power${alphaNoteLetter ? `ᵃ` : ""}`,
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
                    b: `0${redundantNoteLetter || "a"}`,
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
                { header: "Parameter", key: "rowHeader" },
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
                title: termMatrix.term,
                columnHeaders: [
                    { header: "Parameter", key: "rowHeader" },
                    {
                        header: "Contrast",
                        key: "contrast_group",
                        children: contrastHeaders,
                    },
                ],
                rows: [],
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

        const depVarName =
            (data.tests_of_between_subjects_effects &&
                data.tests_of_between_subjects_effects.dependent_variable) ||
            (data.descriptive_statistics &&
                Object.values(data.descriptive_statistics).length > 0 &&
                (Object.values(data.descriptive_statistics)[0] as any)
                    .dependent_variable) ||
            "";

        const table: Table = {
            key: "lack_of_fit_tests",
            title: `Lack of Fit Tests (Dependent Variable: ${depVarName})`,
            columnHeaders: [
                { header: "Source", key: "rowHeader" },
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

        if (lofData) {
            table.rows.push({
                rowHeader: ["Lack of Fit"],
                sum_of_squares: formatCell(lofData.sum_of_squares),
                df: lofData.df,
                mean_square: formatCell(lofData.mean_square),
                f: formatCell(lofData.f_value),
                sig: formatSig(lofData.significance),
                partial_eta_squared: formatCell(lofData.partial_eta_squared),
                noncent_parameter: formatCell(lofData.noncent_parameter),
                observed_power: formatCell(lofData.observed_power),
            });
        }

        if (pureErrorData) {
            table.rows.push({
                rowHeader: ["Pure Error"],
                sum_of_squares: formatCell(pureErrorData.sum_of_squares),
                df: pureErrorData.df,
                mean_square: formatCell(pureErrorData.mean_square),
                f: formatCell(pureErrorData.f_value),
                sig: formatSig(pureErrorData.significance),
                partial_eta_squared: formatCell(
                    pureErrorData.partial_eta_squared
                ),
                noncent_parameter: formatCell(pureErrorData.noncent_parameter),
                observed_power: formatCell(pureErrorData.observed_power),
            });
        }

        if (lof.notes && Array.isArray(lof.notes)) {
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

    // 10. Post Hoc Tests
    if (data.posthoc_tests) {
        const posthoc = data.posthoc_tests;
        const factorName = posthoc.factor_names[0] || "Factor";

        // Multiple Comparisons Table
        if (posthoc.comparison && posthoc.comparison.length > 0) {
            const comparisonData = posthoc.comparison[0];
            const table: any = {
                key: "multiple_comparisons",
                title: "Multiple Comparisons",
                subtitle: `Dependent Variable: ${
                    data.descriptive_statistics
                        ? (Object.values(data.descriptive_statistics)[0] as any)
                              .dependent_variable
                        : ""
                }`,
                columnHeaders: [
                    { header: "", key: "method", colSpan: 2 },
                    { header: "Mean Difference (I-J)", key: "mean_diff" },
                    { header: "Std. Error", key: "std_err" },
                    { header: "Sig.", key: "sig" },
                    {
                        header: "95% Confidence Interval",
                        key: "ci",
                        colSpan: 2,
                    },
                ],
                rows: [],
            };

            // Sub-headers for CI
            const subHeaders: Row = {
                rowHeader: [],
                method: null,
                mean_diff: null,
                std_err: null,
                sig: null,
                ci: "Lower Bound",
                upper_bound: "Upper Bound",
            };
            table.rows.push(subHeaders);

            comparisonData.entries.forEach((entry: any) => {
                table.rows.push({
                    rowHeader: [],
                    method: entry.method,
                    i_factor: null,
                    j_factor: null,
                    mean_diff: null,
                    std_err: null,
                    sig: null,
                    ci: null,
                    upper_bound: null,
                    isHeader: true,
                });

                entry.parameter.forEach((param: string, index: number) => {
                    const [i, j] = param.split(" vs ");
                    const row: Row = {
                        rowHeader: [],
                        method: "",
                        i_factor: i,
                        j_factor: j,
                        mean_diff: formatDisplayNumber(
                            entry.mean_difference[index]
                        ),
                        std_err: formatDisplayNumber(
                            entry.standard_error[index]
                        ),
                        sig: formatDisplayNumber(entry.significance[index]),
                        ci: formatDisplayNumber(
                            entry.confidence_interval[index].lower_bound
                        ),
                        upper_bound: formatDisplayNumber(
                            entry.confidence_interval[index].upper_bound
                        ),
                    };
                    table.rows.push(row);
                });
            });

            if (comparisonData.notes && comparisonData.notes.length > 0) {
                comparisonData.notes.forEach((note: string) => {
                    table.rows.push({ rowHeader: [note] });
                });
            }

            resultJson.tables.push(table);
        }

        // Homogeneous Subsets Table
        if (posthoc.homogoneous && posthoc.homogoneous.length > 0) {
            const homogeneousData = posthoc.homogoneous[0];
            const maxSubsets = Math.max(
                ...homogeneousData.entries.map((e: any) => e.subsets.length)
            );

            const columnHeaders = [
                { header: "", key: "method" },
                { header: factorName, key: "factor_level" },
                { header: "N", key: "n" },
            ];
            for (let i = 1; i <= maxSubsets; i++) {
                columnHeaders.push({
                    header: `Subset ${i}`,
                    key: `subset_${i}`,
                });
            }

            const table: any = {
                key: "homogeneous_subsets",
                title: "Homogeneous Subsets",
                columnHeaders: columnHeaders,
                rows: [],
            };

            homogeneousData.entries.forEach((entry: any) => {
                const numLevels = entry.parameter.length;
                const numSubsets = entry.subsets.length;

                // Add rows for each level
                entry.parameter.forEach((level: string, levelIndex: number) => {
                    const row: Row = {
                        rowHeader: [],
                        method: levelIndex === 0 ? entry.method : "",
                        factor_level: level,
                        n: entry.n[levelIndex],
                    };
                    for (let i = 1; i <= maxSubsets; i++) {
                        row[`subset_${i}`] =
                            i <= numSubsets
                                ? formatDisplayNumber(
                                      entry.subsets[i - 1].subset[levelIndex]
                                  )
                                : null;
                    }
                    table.rows.push(row);
                });

                // Add significance row
                const sigRow: Row = {
                    rowHeader: [],
                    method: "",
                    factor_level: "Sig.",
                    n: null,
                };
                for (let i = 1; i <= maxSubsets; i++) {
                    sigRow[`subset_${i}`] =
                        i <= numSubsets && entry.significances
                            ? formatDisplayNumber(entry.significances[i - 1])
                            : null;
                }
                table.rows.push(sigRow);
            });

            if (homogeneousData.notes && homogeneousData.notes.length > 0) {
                homogeneousData.notes.forEach((note: string) => {
                    table.rows.push({ rowHeader: [note] });
                });
            }

            resultJson.tables.push(table);
        }
    }

    // 11. EM Means
    if (data.emmeans) {
        const emmeans = data.emmeans;
        const depVarName =
            (data.tests_of_between_subjects_effects &&
                data.tests_of_between_subjects_effects.dependent_variable) ||
            (data.descriptive_statistics &&
                Object.values(data.descriptive_statistics).length > 0 &&
                (Object.values(data.descriptive_statistics)[0] as any)
                    .dependent_variable) ||
            "";

        emmeans.parameter_names.forEach((paramName: string, index: number) => {
            const estimates = emmeans.em_estimates?.[index];
            const contrastCoeffs = emmeans.contrast_coefficients?.[index];

            // 11.1 Estimates Table
            if (
                estimates &&
                estimates.entries.length > 0 &&
                estimates.entries[0].levels.length > 0
            ) {
                const isOverall = paramName === "(OVERALL)";
                let factorNames: string[] = [];
                if (!isOverall) {
                    factorNames = estimates.entries[0].levels[0]
                        .split(", ")
                        .map((p: string) => p.split("=")[0]);
                }

                const columnHeaders: any[] = [
                    ...factorNames.map((f) => ({ header: f, key: f })),
                    { header: "Mean", key: "mean" },
                    { header: "Std. Error", key: "std_error" },
                    {
                        header: "95% Confidence Interval",
                        key: "ci",
                        children: [
                            { header: "Lower Bound", key: "lower_bound" },
                            { header: "Upper Bound", key: "upper_bound" },
                        ],
                    },
                ];

                if (isOverall) {
                    columnHeaders.unshift({
                        header: "",
                        key: "grand_mean_label",
                    });
                }

                const table: any = {
                    key: `emmeans_estimates_${paramName.replace(/\W/g, "_")}`,
                    title: isOverall ? `Grand Mean` : `Estimates`,
                    subtitle: `Dependent Variable: ${depVarName}`,
                    columnHeaders,
                    rows: [],
                };

                if (!isOverall) {
                    table.title = `Estimates: ${paramName}`;
                }

                estimates.entries.forEach((entry: any) => {
                    entry.levels.forEach((levelString: string, i: number) => {
                        const row: Row = { rowHeader: [] };
                        if (isOverall) {
                            row.grand_mean_label = "";
                        } else {
                            const levelParts = levelString.split(", ");
                            const levelMap = new Map(
                                levelParts
                                    .map((p: string) => p.split("="))
                                    .filter((p) => p.length === 2) as [
                                    string,
                                    string
                                ][]
                            );
                            factorNames.forEach((fn) => {
                                row[fn] = levelMap.get(fn) || "";
                            });
                        }

                        row.mean = formatDisplayNumber(entry.mean[i]);
                        row.std_error = formatDisplayNumber(
                            entry.standard_error[i]
                        );
                        row.lower_bound = formatDisplayNumber(
                            entry.confidence_interval[i]?.lower_bound
                        );
                        row.upper_bound = formatDisplayNumber(
                            entry.confidence_interval[i]?.upper_bound
                        );
                        table.rows.push(row);
                    });
                });

                if (factorNames.length > 1) {
                    const processedRows: Row[] = [];
                    const lastFactorValues = new Array(factorNames.length).fill(
                        null
                    );
                    table.rows.forEach((row: Row) => {
                        const newRow = { ...row };
                        for (let i = 0; i < factorNames.length; i++) {
                            const key = factorNames[i];
                            if (newRow[key] === lastFactorValues[i]) {
                                newRow[key] = "";
                            } else {
                                lastFactorValues[i] = newRow[key] as string;
                                for (
                                    let j = i + 1;
                                    j < factorNames.length;
                                    j++
                                ) {
                                    lastFactorValues[j] = null;
                                }
                            }
                        }
                        processedRows.push(newRow);
                    });
                    table.rows = processedRows;
                }

                resultJson.tables.push(table);
            }

            // 11.2 Contrast Coefficients Table
            if (contrastCoeffs) {
                const isOverall = paramName === "(OVERALL)";
                const title = isOverall
                    ? "Contrast Coefficients (L' Matrix): Grand Mean"
                    : `Contrast Coefficients (L' Matrix): ${paramName}`;

                const lMatrixHeaders: any[] = [
                    { header: "Parameter", key: "parameter" },
                ];

                const factorNames = isOverall ? [] : paramName.split("*");

                if (isOverall) {
                    lMatrixHeaders.push({ header: "Grand Mean", key: "l0" });
                } else if (factorNames.length === 1) {
                    lMatrixHeaders.push({
                        header: paramName,
                        key: `${paramName}_group`,
                        children: contrastCoeffs.l_label.map(
                            (label: string, i: number) => ({
                                header: label.split("=")[1] || `L${i + 1}`,
                                key: `l${i}`,
                            })
                        ),
                    });
                } else {
                    const childrenHeaders: any[] = contrastCoeffs.l_label.map(
                        (label: string, i: number) => {
                            const parts = label
                                .replace("EMM: ", "")
                                .split(", ");
                            const headerParts = parts.map(
                                (p) => p.split("=")[1]
                            );
                            return {
                                header: headerParts.join(" "),
                                key: `l${i}`,
                            };
                        }
                    );

                    const topLevelFactors = paramName.split("*");
                    const groupedHeaders: any = {};
                    topLevelFactors.forEach((factor) => {
                        groupedHeaders[factor] = [];
                    });

                    lMatrixHeaders.push(...childrenHeaders);
                }

                const lMatrixTable: Table = {
                    key: `emmeans_contrast_coefficients_${paramName.replace(
                        /\W/g,
                        "_"
                    )}`,
                    title: title,
                    columnHeaders: lMatrixHeaders,
                    rows: [],
                };

                contrastCoeffs.parameter.forEach(
                    (param: string, paramIndex: number) => {
                        const row: Row = { rowHeader: [], parameter: param };
                        contrastCoeffs.l_matrix.forEach(
                            (l_row: number[], l_index: number) => {
                                row[`l${l_index}`] = formatDisplayNumber(
                                    l_row[paramIndex]
                                );
                            }
                        );
                        lMatrixTable.rows.push(row);
                    }
                );

                resultJson.tables.push(lMatrixTable);
            }
        });

        // 11.3 Pairwise Comparisons
        if (emmeans.pairwise_comparisons) {
            emmeans.pairwise_comparisons.forEach((comparison: any) => {
                if (!comparison.entries || comparison.entries.length === 0)
                    return;

                const notes = comparison.notes[0] || "";
                const factorMatch = notes.match(
                    /Pairwise comparisons for (.*?)\./
                );
                const factorName = factorMatch ? factorMatch[1] : "Unknown";
                const adjMatch = notes.match(
                    /Adjustment for multiple comparisons: (.*?)\./
                );
                const adjMethod = adjMatch ? adjMatch[1] : "None";

                const table: any = {
                    key: `emmeans_pairwise_${factorName}`,
                    title: `Pairwise Comparisons: ${factorName}`,
                    subtitle: `Dependent Variable: ${depVarName}`,
                    columnHeaders: [
                        { header: `(I) ${factorName}`, key: "i_level" },
                        { header: `(J) ${factorName}`, key: "j_level" },
                        { header: "Mean Difference (I-J)", key: "mean_diff" },
                        { header: "Std. Error", key: "std_error" },
                        { header: "Sig.ᵃ", key: "sig" },
                        {
                            header: `95% Confidence Interval for Differenceᵃ`,
                            key: "ci",
                            children: [
                                { header: "Lower Bound", key: "lower_bound" },
                                { header: "Upper Bound", key: "upper_bound" },
                            ],
                        },
                    ],
                    rows: [],
                };

                const groupedRows: { [key: string]: Row[] } = {};
                comparison.entries.forEach((entry: any) => {
                    const iLevel = entry.parameter[0]?.split("=")[1];
                    if (!groupedRows[iLevel]) {
                        groupedRows[iLevel] = [];
                    }
                    groupedRows[iLevel].push({
                        rowHeader: [],
                        i_level: iLevel,
                        j_level: entry.parameter[1]?.split("=")[1],
                        mean_diff: formatDisplayNumber(
                            entry.mean_difference[0]
                        ),
                        std_error: formatDisplayNumber(entry.standard_error[0]),
                        sig: formatDisplayNumber(entry.significance[0]),
                        lower_bound: formatDisplayNumber(
                            entry.confidence_interval[0]?.lower_bound
                        ),
                        upper_bound: formatDisplayNumber(
                            entry.confidence_interval[0]?.upper_bound
                        ),
                    });
                });

                Object.keys(groupedRows)
                    .sort()
                    .forEach((key) => {
                        groupedRows[key].forEach((row, rowIndex) => {
                            if (rowIndex > 0) {
                                row.i_level = "";
                            }
                            table.rows.push(row);
                        });
                    });

                const nullNoteCols = {
                    j_level: null,
                    mean_diff: null,
                    std_error: null,
                    sig: null,
                    lower_bound: null,
                    upper_bound: null,
                };
                table.rows.push({
                    rowHeader: ["Based on estimated marginal means"],
                    ...nullNoteCols,
                });
                table.rows.push({
                    rowHeader: [
                        `a. Adjustment for multiple comparisons: ${adjMethod}.`,
                    ],
                    ...nullNoteCols,
                });

                resultJson.tables.push(table);
            });
        }

        // 11.4 Univariate Tests
        if (emmeans.univariate_tests) {
            emmeans.univariate_tests.forEach((test: any) => {
                const factorName = test.entries[0]?.source || "Unknown";
                const table: any = {
                    key: `emmeans_univariate_${factorName.replace(/\W/g, "_")}`,
                    title: `Univariate Tests`,
                    subtitle: `Dependent Variable: ${depVarName}`,
                    columnHeaders: [
                        { header: "", key: "source" },
                        { header: "Sum of Squares", key: "sum_of_squares" },
                        { header: "df", key: "df" },
                        { header: "Mean Square", key: "mean_square" },
                        { header: "F", key: "f" },
                        { header: "Sig.", key: "sig" },
                        {
                            header: "Partial Eta Squared",
                            key: "partial_eta_squared",
                        },
                        {
                            header: "Noncent. Parameter",
                            key: "noncent_parameter",
                        },
                        { header: "Observed Powerᵃ", key: "observed_power" },
                    ],
                    rows: [],
                };

                const sigLevelMatch = test.notes.find((n: string) =>
                    n.includes("alpha =")
                );
                const sigLevel = sigLevelMatch
                    ? sigLevelMatch.split("=")[1].trim()
                    : "0.05";

                test.entries.forEach((entry: any) => {
                    table.rows.push({
                        rowHeader: [],
                        source: entry.source,
                        sum_of_squares: formatDisplayNumber(
                            entry.sum_of_squares
                        ),
                        df: entry.df,
                        mean_square: formatDisplayNumber(entry.mean_square),
                        f: formatDisplayNumber(entry.f_value),
                        sig: formatDisplayNumber(entry.significance),
                        partial_eta_squared: formatDisplayNumber(
                            entry.partial_eta_squared
                        ),
                        noncent_parameter: formatDisplayNumber(
                            entry.noncent_parameter
                        ),
                        observed_power: formatDisplayNumber(
                            entry.observed_power
                        ),
                    });
                });

                const nullNoteCols = {
                    sum_of_squares: null,
                    df: null,
                    mean_square: null,
                    f: null,
                    sig: null,
                    partial_eta_squared: null,
                    noncent_parameter: null,
                    observed_power: null,
                };
                const effectNote = test.notes.find((n: string) =>
                    n.startsWith("The F tests")
                );
                if (effectNote) {
                    table.rows.push({
                        rowHeader: [effectNote],
                        ...nullNoteCols,
                    });
                }
                table.rows.push({
                    rowHeader: [`a. Computed using alpha = ${sigLevel}`],
                    ...nullNoteCols,
                });

                resultJson.tables.push(table);
            });
        }
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
        const varKeys = Object.keys(vars).filter(
            (key) => Array.isArray(vars[key]) && vars[key].length > 0
        );

        if (varKeys.length > 0) {
            const nameMapping: { [key: string]: string } = {
                predicted_values: "PRED",
                weighted_predicted_values: "WPRED",
                residuals: "RESID",
                weighted_residuals: "WRESID",
                deleted_residuals: "DRESID",
                standardized_residuals: "ZRESID",
                studentized_residuals: "SRESID",
                standard_errors: "SEPRED",
                cook_distances: "COOK",
                leverages: "LEVER",
            };

            const columnHeaders: any[] = [
                { header: "Case Number", key: "case" },
            ];
            varKeys.forEach((key) => {
                columnHeaders.push({
                    header: nameMapping[key] || key,
                    key: key,
                });
            });

            const table: Table = {
                key: "saved_variables_table",
                title: "Case Diagnostics",
                columnHeaders: columnHeaders,
                rows: [],
            };

            const numRows = vars[varKeys[0]].length;
            for (let i = 0; i < numRows; i++) {
                const row: Row = { rowHeader: [], case: String(i + 1) };
                varKeys.forEach((key) => {
                    const value = vars[key][i];
                    row[key] =
                        value !== null ? formatDisplayNumber(value) : ".";
                });
                table.rows.push(row);
            }

            resultJson.tables.push(table);
        }
    }

    // 14. Custom Hypothesis Tests
    if (data.contrast_coefficients) {
        const custom_tests = data.contrast_coefficients;

        // 14.1 Custom Hypothesis Tests Index table
        if (custom_tests.information && custom_tests.information.length > 0) {
            const table: Table = {
                key: "custom_hypothesis_tests_index",
                title: "Custom Hypothesis Tests Index",
                columnHeaders: [
                    { header: "", key: "index" },
                    { header: "", key: "matrix_type" },
                    { header: "", key: "description" },
                ],
                rows: [],
            };

            custom_tests.information.forEach((info: any, index: number) => {
                table.rows.push({
                    rowHeader: [],
                    index: String(index + 1),
                    matrix_type: "Contrast Coefficients (L' Matrix)",
                    description: info.contrast_name,
                });
                table.rows.push({
                    rowHeader: [],
                    index: "",
                    matrix_type: "Transformation Coefficients (M Matrix)",
                    description: info.transformation_coef,
                });
                table.rows.push({
                    rowHeader: [],
                    index: "",
                    matrix_type: "Contrast Results (K Matrix)",
                    description: info.contrast_result,
                });
            });

            resultJson.tables.push(table);
        }

        const depVarName =
            (data.tests_of_between_subjects_effects &&
                data.tests_of_between_subjects_effects.dependent_variable) ||
            (data.descriptive_statistics &&
                Object.values(data.descriptive_statistics).length > 0 &&
                (Object.values(data.descriptive_statistics)[0] as any)
                    .dependent_variable) ||
            "";

        // Loop through each custom test
        custom_tests.factor_names?.forEach(
            (_factorName: string, index: number) => {
                const info = custom_tests.information?.[index];
                const test_result = custom_tests.contrast_test_result?.[index];
                const contrast_k_result = custom_tests.contrast_result?.[index];
                const contrast_def =
                    custom_tests.contrast_coefficients?.[index];

                // 14.2 Test Results table
                if (test_result) {
                    const table: any = {
                        key: `custom_test_results_${index}`,
                        title: "Test Results",
                        subtitle: `Dependent Variable: ${depVarName}`,
                        columnHeaders: [
                            { header: "Source", key: "source" },
                            { header: "Sum of Squares", key: "sum_of_squares" },
                            { header: "df", key: "df" },
                            { header: "Mean Square", key: "mean_square" },
                            { header: "F", key: "f" },
                            { header: "Sig.", key: "sig" },
                        ],
                        rows: [],
                    };

                    test_result.contrast_result.forEach((res: any) => {
                        table.rows.push({
                            rowHeader: [],
                            source: res.source,
                            sum_of_squares: formatDisplayNumber(
                                res.sum_of_squares
                            ),
                            df: res.df,
                            mean_square: formatDisplayNumber(res.mean_square),
                            f: formatDisplayNumber(res.f_value),
                            sig: formatDisplayNumber(res.significance),
                        });
                    });
                    resultJson.tables.push(table);
                }

                // 14.3 Contrast Results (K Matrix)
                if (contrast_k_result && info) {
                    const table: Table = {
                        key: `custom_contrast_results_k_matrix_${index}`,
                        title: "Contrast Results (K Matrix)",
                        columnHeaders: [
                            {
                                header:
                                    info.contrast_name.split(" for ")[1] ||
                                    info.contrast_name,
                                key: "param_group",
                            },
                            { header: "", key: "stat" },
                            { header: "", key: "sub_stat" },
                            {
                                header: `Dependent Variable: ${depVarName}`,
                                key: "value",
                            },
                        ],
                        rows: [],
                    };

                    contrast_k_result.parameter.forEach(
                        (paramName: string, paramIndex: number) => {
                            const resultData =
                                contrast_k_result.contrast_result[paramIndex];
                            if (resultData) {
                                table.rows.push(
                                    {
                                        rowHeader: [],
                                        param_group: paramName,
                                        stat: "Contrast Estimate",
                                        sub_stat: "",
                                        value: formatDisplayNumber(
                                            resultData.contrast_estimate
                                        ),
                                    },
                                    {
                                        rowHeader: [],
                                        param_group: "",
                                        stat: "Hypothesized Value",
                                        sub_stat: "",
                                        value: resultData.hypothesized_value,
                                    },
                                    {
                                        rowHeader: [],
                                        param_group: "",
                                        stat: "Difference (Estimate - Hypothesized)",
                                        sub_stat: "",
                                        value: formatDisplayNumber(
                                            resultData.difference
                                        ),
                                    },
                                    {
                                        rowHeader: [],
                                        param_group: "",
                                        stat: "Std. Error",
                                        sub_stat: "",
                                        value: formatDisplayNumber(
                                            resultData.standard_error
                                        ),
                                    },
                                    {
                                        rowHeader: [],
                                        param_group: "",
                                        stat: "Sig.",
                                        sub_stat: "",
                                        value: formatDisplayNumber(
                                            resultData.significance
                                        ),
                                    },
                                    {
                                        rowHeader: [],
                                        param_group: "",
                                        stat: "95% Confidence Interval for Difference",
                                        sub_stat: "Lower Bound",
                                        value: formatDisplayNumber(
                                            resultData.confidence_interval
                                                ?.lower_bound
                                        ),
                                    },
                                    {
                                        rowHeader: [],
                                        param_group: "",
                                        stat: "",
                                        sub_stat: "Upper Bound",
                                        value: formatDisplayNumber(
                                            resultData.confidence_interval
                                                ?.upper_bound
                                        ),
                                    }
                                );
                            }
                        }
                    );
                    resultJson.tables.push(table);
                }

                // 14.4 Contrast Coefficients (L' Matrix)
                if (contrast_def && info) {
                    const contrastHeaders = contrast_def.l_label.map(
                        (_label: string, i: number) => ({
                            header:
                                contrast_k_result?.parameter[i] || `L${i + 1}`,
                            key: `l${i + 1}`,
                        })
                    );

                    const table: Table = {
                        key: `contrast_coefficients_${index}`,
                        title: "Contrast Coefficients (L' Matrix)",
                        columnHeaders: [
                            { header: "Parameter", key: "parameter" },
                            {
                                header: info.contrast_name,
                                key: "contrast_group",
                                children: contrastHeaders,
                            },
                        ],
                        rows: [],
                    };

                    contrast_def.parameter.forEach(
                        (param: string, paramIndex: number) => {
                            const row: Row = {
                                rowHeader: [param],
                                parameter: param,
                            };
                            contrast_def.l_label.forEach(
                                (_label: string, contrastIndex: number) => {
                                    row[`l${contrastIndex + 1}`] =
                                        formatDisplayNumber(
                                            contrast_def.l_matrix[
                                                contrastIndex
                                            ]?.[paramIndex]
                                        );
                                }
                            );
                            table.rows.push(row);
                        }
                    );

                    const nullColumnsForNotes = Object.fromEntries(
                        table.columnHeaders
                            .filter((h) => h.key !== "parameter")
                            .map((h) => [h.key, null])
                    );

                    if (contrast_def.l_label.length > 1) {
                        contrast_def.l_label.forEach((_l: any, i: number) => {
                            nullColumnsForNotes[`l${i + 1}`] = null;
                        });
                    }

                    table.rows.push({
                        rowHeader: [
                            "a. The default display of this matrix is the transpose of the corresponding L matrix.",
                        ],
                        ...nullColumnsForNotes,
                    });

                    resultJson.tables.push(table);
                }
            }
        );
    }

    return resultJson;
}
