import type { MultivariateFinalResultType } from "@/components/Modals/Analyze/general-linear-model/multivariate/types/multivariate-worker";
import type { Table } from "@/types/Table";
import { useResultStore } from "@/stores/useResultStore";

export async function resultMultivariateAnalysis({
    formattedResult,
}: MultivariateFinalResultType) {
    try {
        const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

        const findTable = (key: string): Table | undefined =>
            formattedResult.tables.find((t: Table) => t.key === key);

        const multivariateAnalysisResult = async () => {
            const logId = await addLog({ log: "Multivariate Analysis" });
            await addAnalytic(logId, {
                title: "Multivariate Analysis Result",
                note: "",
            });

            // ── Between-Subjects Factors ──────────────────────────────────
            const betweenSubjectsFactors = findTable("between_subjects_factors");
            if (betweenSubjectsFactors) {
                const analyticId = await addAnalytic(logId, {
                    title: betweenSubjectsFactors.title,
                    note: betweenSubjectsFactors.note || "",
                });
                await addStatistic(analyticId, {
                    title: betweenSubjectsFactors.title,
                    description: betweenSubjectsFactors.interpretation || betweenSubjectsFactors.title,
                    output_data: JSON.stringify({ tables: [betweenSubjectsFactors] }),
                    components: betweenSubjectsFactors.title,
                });
            }

            // ── Descriptive Statistics (one per DV) ───────────────────────
            const descTables = formattedResult.tables.filter((t: Table) =>
                t.key.startsWith("descriptive_statistics_")
            );
            for (const table of descTables) {
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: table.note || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.interpretation || table.title,
                    output_data: JSON.stringify({ tables: [table] }),
                    components: table.title,
                });
            }

            // ── Box's M Test ──────────────────────────────────────────────
            const boxMTest = findTable("box_m_test");
            if (boxMTest) {
                const analyticId = await addAnalytic(logId, {
                    title: boxMTest.title,
                    note: boxMTest.note || "",
                });
                await addStatistic(analyticId, {
                    title: boxMTest.title,
                    description: boxMTest.interpretation || boxMTest.title,
                    output_data: JSON.stringify({ tables: [boxMTest] }),
                    components: boxMTest.title,
                });
            }

            // ── Bartlett's Test ───────────────────────────────────────────
            const bartlettTest = findTable("bartlett_test");
            if (bartlettTest) {
                const analyticId = await addAnalytic(logId, {
                    title: bartlettTest.title,
                    note: bartlettTest.note || "",
                });
                await addStatistic(analyticId, {
                    title: bartlettTest.title,
                    description: bartlettTest.interpretation || bartlettTest.title,
                    output_data: JSON.stringify({ tables: [bartlettTest] }),
                    components: bartlettTest.title,
                });
            }

            // ── Levene's Test (one per DV) ────────────────────────────────
            const leveneTables = formattedResult.tables.filter((t: Table) =>
                t.key.startsWith("levene_test_")
            );
            for (const table of leveneTables) {
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: table.note || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.interpretation || table.title,
                    output_data: JSON.stringify({ tables: [table] }),
                    components: table.title,
                });
            }

            // ── Multivariate Tests (Pillai/Wilks/Hotelling/Roy) ───────────
            const multivariateTests = findTable("multivariate_tests");
            if (multivariateTests) {
                const analyticId = await addAnalytic(logId, {
                    title: multivariateTests.title,
                    note: multivariateTests.note || "",
                });
                await addStatistic(analyticId, {
                    title: multivariateTests.title,
                    description: multivariateTests.interpretation || multivariateTests.title,
                    output_data: JSON.stringify({ tables: [multivariateTests] }),
                    components: multivariateTests.title,
                });
            }

            // ── Tests of Between-Subjects Effects (combined table) ───────
            const tbsTable = findTable("tests_between_subjects_effects");
            if (tbsTable) {
                const analyticId = await addAnalytic(logId, {
                    title: tbsTable.title,
                    note: tbsTable.note || "",
                });
                await addStatistic(analyticId, {
                    title: tbsTable.title,
                    description: tbsTable.interpretation || tbsTable.title,
                    output_data: JSON.stringify({ tables: [tbsTable] }),
                    components: tbsTable.title,
                });
            }

            // ── Parameter Estimates (one per DV) ─────────────────────────
            const peTables = formattedResult.tables.filter((t: Table) =>
                t.key.startsWith("parameter_estimates_")
            );
            for (const table of peTables) {
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: table.note || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.interpretation || table.title,
                    output_data: JSON.stringify({ tables: [table] }),
                    components: table.title,
                });
            }

            // ── Between-Subjects SSCP ─────────────────────────────────────
            const sscpBsTables = formattedResult.tables.filter((t: Table) =>
                t.key.startsWith("between_subjects_sscp_")
            );
            for (const table of sscpBsTables) {
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: table.note || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.interpretation || table.title,
                    output_data: JSON.stringify({ tables: [table] }),
                    components: table.title,
                });
            }

            // ── Residual SSCP Matrix ──────────────────────────────────────
            const residualMatrix = findTable("residual_sscp_matrix");
            if (residualMatrix) {
                const analyticId = await addAnalytic(logId, {
                    title: residualMatrix.title,
                    note: residualMatrix.note || "",
                });
                await addStatistic(analyticId, {
                    title: residualMatrix.title,
                    description: residualMatrix.interpretation || residualMatrix.title,
                    output_data: JSON.stringify({ tables: [residualMatrix] }),
                    components: residualMatrix.title,
                });
            }

            // ── SSCP Matrices ─────────────────────────────────────────────
            const sscpTables = formattedResult.tables.filter((t: Table) =>
                t.key.startsWith("sscp_matrix_")
            );
            for (const table of sscpTables) {
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: table.note || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.interpretation || table.title,
                    output_data: JSON.stringify({ tables: [table] }),
                    components: table.title,
                });
            }

            // ── Contrast Coefficients ─────────────────────────────────────
            const contrastCoef = findTable("contrast_coefficients");
            if (contrastCoef) {
                const analyticId = await addAnalytic(logId, {
                    title: contrastCoef.title,
                    note: contrastCoef.note || "",
                });
                await addStatistic(analyticId, {
                    title: contrastCoef.title,
                    description: contrastCoef.interpretation || contrastCoef.title,
                    output_data: JSON.stringify({ tables: [contrastCoef] }),
                    components: contrastCoef.title,
                });
            }

            // ── General Estimable Function ────────────────────────────────
            const gef = findTable("general_estimable_function");
            if (gef) {
                const analyticId = await addAnalytic(logId, {
                    title: gef.title,
                    note: gef.note || "",
                });
                await addStatistic(analyticId, {
                    title: gef.title,
                    description: gef.interpretation || gef.title,
                    output_data: JSON.stringify({ tables: [gef] }),
                    components: gef.title,
                });
            }

            // ── Post Hoc Tests ────────────────────────────────────────────
            const posthocTables = formattedResult.tables.filter((t: Table) =>
                t.key.startsWith("posthoc_tests_")
            );
            for (const table of posthocTables) {
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: table.note || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.interpretation || table.title,
                    output_data: JSON.stringify({ tables: [table] }),
                    components: table.title,
                });
            }

            // ── Homogeneous Subsets ───────────────────────────────────────
            const homogSubsetsTables = formattedResult.tables.filter((t: Table) =>
                t.key.startsWith("homogeneous_subsets_")
            );
            for (const table of homogSubsetsTables) {
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: table.note || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.interpretation || table.title,
                    output_data: JSON.stringify({ tables: [table] }),
                    components: table.title,
                });
            }

            // ── Estimated Marginal Means ──────────────────────────────────
            const emmeansTables = formattedResult.tables.filter((t: Table) =>
                t.key.startsWith("emmeans_")
            );
            for (const table of emmeansTables) {
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: table.note || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.interpretation || table.title,
                    output_data: JSON.stringify({ tables: [table] }),
                    components: table.title,
                });
            }

            // ── Spread vs. Level ──────────────────────────────────────────
            const svrTables = formattedResult.tables.filter((t: Table) =>
                t.key.startsWith("spread_vs_level_")
            );
            for (const table of svrTables) {
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: table.note || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.interpretation || table.title,
                    output_data: JSON.stringify({ tables: [table] }),
                    components: table.title,
                });
            }

            // ── Error Table ───────────────────────────────────────────────
            const errorTable = findTable("error_table");
            if (errorTable) {
                const analyticId = await addAnalytic(logId, {
                    title: errorTable.title,
                    note: errorTable.note || "",
                });
                await addStatistic(analyticId, {
                    title: errorTable.title,
                    description: errorTable.interpretation || "Errors logs from the analysis.",
                    output_data: JSON.stringify({ tables: [errorTable] }),
                    components: "Errors Logs",
                });
            }
        };

        await multivariateAnalysisResult();
    } catch (e) {
        console.error(e);
    }
}
