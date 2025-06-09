// univariate-analysis-output.ts
import { UnivariateFinalResultType } from "@/models/general-linear-model/univariate/univariate-worker";
import { Table } from "@/types/Table";
import { useResultStore } from "@/stores/useResultStore";

export async function resultUnivariateAnalysis({
    formattedResult,
}: UnivariateFinalResultType) {
    try {
        const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

        const findTable = (key: string) => {
            const foundTable = formattedResult.tables.find(
                (table: Table) => table.key === key
            );
            return foundTable ? JSON.stringify({ tables: [foundTable] }) : null;
        };

        const univariateAnalysisResult = async () => {
            /*
             * 🎉 Title Result 🎉
             * */
            const titleMessage = "Univariate Analysis";
            const logId = await addLog({ log: titleMessage });
            const analyticId = await addAnalytic(logId, {
                title: `Univariate Analysis Result`,
                note: "",
            });

            /*
             * 👥 Between-Subjects Factors Result 👥
             * */
            const betweenSubjectsFactors = findTable(
                "between_subjects_factors"
            );
            if (betweenSubjectsFactors) {
                const betweenSubjectsFactorsId = await addAnalytic(logId, {
                    title: `Between-Subjects Factors`,
                    note: "",
                });

                await addStatistic(betweenSubjectsFactorsId, {
                    title: `Between-Subjects Factors`,
                    description: `Between-Subjects Factors`,
                    output_data: betweenSubjectsFactors,
                    components: `Between-Subjects Factors`,
                });
            }

            /*
             * 📊 Descriptive Statistics Result 📊
             * */
            const descriptiveStatistics = findTable("descriptive_statistics");
            if (descriptiveStatistics) {
                const descriptiveStatisticsId = await addAnalytic(logId, {
                    title: `Descriptive Statistics`,
                    note: "",
                });

                await addStatistic(descriptiveStatisticsId, {
                    title: `Descriptive Statistics`,
                    description: `Descriptive Statistics`,
                    output_data: descriptiveStatistics,
                    components: `Descriptive Statistics`,
                });
            }

            /*
             * ⚖️ Levene's Test Result ⚖️
             * */
            const leveneTest = findTable("levene_test");
            if (leveneTest) {
                const leveneTestId = await addAnalytic(logId, {
                    title: `Levene's Test of Equality of Error Variances`,
                    note: "",
                });

                await addStatistic(leveneTestId, {
                    title: `Levene's Test of Equality of Error Variances`,
                    description: `Levene's Test of Equality of Error Variances`,
                    output_data: leveneTest,
                    components: `Levene's Test of Equality of Error Variances`,
                });
            }

            /*
             * 🔬 Heteroscedasticity Tests Result 🔬
             * */
            const heteroTables = formattedResult.tables.filter((table: Table) =>
                table.key.startsWith("hetero_")
            );

            for (const heteroTable of heteroTables) {
                const heteroData = JSON.stringify({ tables: [heteroTable] });
                const heteroId = await addAnalytic(logId, {
                    title: heteroTable.title,
                    note: "",
                });

                await addStatistic(heteroId, {
                    title: heteroTable.title,
                    description: heteroTable.title,
                    output_data: heteroData,
                    components: heteroTable.title,
                });
            }

            /*
             * 🧪 Tests of Between-Subjects Effects Result 🧪
             * */
            const testsOfBetweenSubjectsEffects = findTable(
                "tests_of_between_subjects_effects"
            );
            if (testsOfBetweenSubjectsEffects) {
                const testsOfBetweenSubjectsEffectsId = await addAnalytic(
                    logId,
                    {
                        title: `Tests of Between-Subjects Effects`,
                        note: "",
                    }
                );

                await addStatistic(testsOfBetweenSubjectsEffectsId, {
                    title: `Tests of Between-Subjects Effects`,
                    description: `Tests of Between-Subjects Effects`,
                    output_data: testsOfBetweenSubjectsEffects,
                    components: `Tests of Between-Subjects Effects`,
                });
            }

            /*
             * 📏 Parameter Estimates Result 📏
             * */
            const parameterEstimates = findTable("parameter_estimates");
            if (parameterEstimates) {
                const parameterEstimatesId = await addAnalytic(logId, {
                    title: `Parameter Estimates`,
                    note: "",
                });

                await addStatistic(parameterEstimatesId, {
                    title: `Parameter Estimates`,
                    description: `Parameter Estimates`,
                    output_data: parameterEstimates,
                    components: `Parameter Estimates`,
                });
            }

            /*
             * 🧮 General Estimable Function Result 🧮
             * */
            const generalEstimableFunction = findTable(
                "general_estimable_function"
            );
            if (generalEstimableFunction) {
                const generalEstimableFunctionId = await addAnalytic(logId, {
                    title: `General Estimable Function`,
                    note: "",
                });

                await addStatistic(generalEstimableFunctionId, {
                    title: `General Estimable Function`,
                    description: `General Estimable Function`,
                    output_data: generalEstimableFunction,
                    components: `General Estimable Function`,
                });
            }

            /*
             * 📝 Hypothesis L-Matrix Result 📝
             */
            const lMatrixTables = formattedResult.tables.filter(
                (table: Table) => table.key.startsWith("hypothesis_matrix_")
            );

            for (const lMatrixTable of lMatrixTables) {
                const lMatrixData = JSON.stringify({ tables: [lMatrixTable] });
                const termName = lMatrixTable.title;
                const lMatrixId = await addAnalytic(logId, {
                    title: `Contrast Coefficients (L Matrix) - ${termName}`,
                    note: "",
                });

                await addStatistic(lMatrixId, {
                    title: lMatrixTable.title,
                    description: `The default display of this matrix is the transpose of the corresponding L matrix.`,
                    output_data: lMatrixData,
                    components: `Hypothesis Matrix - ${termName}`,
                });
            }

            /*
             * 🔬 Custom Hypothesis Tests Result 🔬
             */
            const customHypothesisIndexTable = findTable(
                "custom_hypothesis_tests_index"
            );
            if (customHypothesisIndexTable) {
                const analyticId = await addAnalytic(logId, {
                    title: `Custom Hypothesis Tests Index`,
                    note: "",
                });
                await addStatistic(analyticId, {
                    title: `Custom Hypothesis Tests Index`,
                    description: `Index of all custom hypothesis tests performed.`,
                    output_data: customHypothesisIndexTable,
                    components: `Custom Hypothesis Tests Index`,
                });
            }

            const testResultTables = formattedResult.tables.filter(
                (table: Table) => table.key.startsWith("custom_test_results_")
            );
            for (const table of testResultTables) {
                const tableData = JSON.stringify({ tables: [table] });
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: (table as any).subtitle || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.title,
                    output_data: tableData,
                    components: table.title,
                });
            }

            const kMatrixTables = formattedResult.tables.filter(
                (table: Table) =>
                    table.key.startsWith("custom_contrast_results_k_matrix_")
            );
            for (const table of kMatrixTables) {
                const tableData = JSON.stringify({ tables: [table] });
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.title,
                    output_data: tableData,
                    components: table.title,
                });
            }

            const lMatrixTablesCustom = formattedResult.tables.filter(
                (table: Table) => table.key.startsWith("contrast_coefficients_")
            );
            for (const table of lMatrixTablesCustom) {
                const tableData = JSON.stringify({ tables: [table] });
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.title,
                    output_data: tableData,
                    components: table.title,
                });
            }

            /*
             * 📊 Contrast Coefficients Result 📊
             * */
            const contrastCoefficients = findTable("contrast_coefficients");
            if (contrastCoefficients) {
                const contrastCoefficientsId = await addAnalytic(logId, {
                    title: `Contrast Coefficients`,
                    note: "",
                });

                await addStatistic(contrastCoefficientsId, {
                    title: `Contrast Coefficients`,
                    description: `Contrast Coefficients`,
                    output_data: contrastCoefficients,
                    components: `Contrast Coefficients`,
                });
            }

            /*
             * 🧪 Lack of Fit Tests Result 🧪
             * */
            const lackOfFitTests = findTable("lack_of_fit_tests");
            if (lackOfFitTests) {
                const lackOfFitTestsId = await addAnalytic(logId, {
                    title: `Lack of Fit Tests`,
                    note: "",
                });

                await addStatistic(lackOfFitTestsId, {
                    title: `Lack of Fit Tests`,
                    description: `Lack of Fit Tests`,
                    output_data: lackOfFitTests,
                    components: `Lack of Fit Tests`,
                });
            }

            /*
             * 📈 Spread vs. Level Plots Result 📈
             * */
            const spreadVsLevelPlots = findTable("spread_vs_level_plots");
            if (spreadVsLevelPlots) {
                const spreadVsLevelPlotsId = await addAnalytic(logId, {
                    title: `Spread vs. Level Plots`,
                    note: "",
                });

                await addStatistic(spreadVsLevelPlotsId, {
                    title: `Spread vs. Level Plots`,
                    description: `Spread vs. Level Plots`,
                    output_data: spreadVsLevelPlots,
                    components: `Spread vs. Level Plots`,
                });
            }

            /*
             * 📊 Post Hoc Tests Result 📊
             * */
            // Since post hoc tests can have dynamic keys, we need to find all tables with 'posthoc_' prefix
            const postHocTables = formattedResult.tables.filter(
                (table: Table) => table.key.startsWith("posthoc_")
            );

            for (const postHocTable of postHocTables) {
                const testName = postHocTable.title.replace(
                    "Post Hoc Tests - ",
                    ""
                );
                const postHocData = JSON.stringify({ tables: [postHocTable] });

                const postHocId = await addAnalytic(logId, {
                    title: `Post Hoc Tests - ${testName}`,
                    note: "",
                });

                await addStatistic(postHocId, {
                    title: `Post Hoc Tests - ${testName}`,
                    description: `Post Hoc Tests - ${testName}`,
                    output_data: postHocData,
                    components: `Post Hoc Tests - ${testName}`,
                });
            }

            /*
             * 📏 Estimated Marginal Means Result 📏
             * */
            const emmeansEstimatesTables = formattedResult.tables.filter(
                (table: Table) => table.key.startsWith("emmeans_estimates_")
            );
            for (const table of emmeansEstimatesTables) {
                const tableData = JSON.stringify({ tables: [table] });
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: (table as any).subtitle || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.title,
                    output_data: tableData,
                    components: table.title,
                });
            }

            const emmeansLMatrixTables = formattedResult.tables.filter(
                (table: Table) =>
                    table.key.startsWith("emmeans_contrast_coefficients_")
            );
            for (const table of emmeansLMatrixTables) {
                const tableData = JSON.stringify({ tables: [table] });
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.title,
                    output_data: tableData,
                    components: table.title,
                });
            }

            const emmeansPairwiseTables = formattedResult.tables.filter(
                (table: Table) => table.key.startsWith("emmeans_pairwise_")
            );
            for (const table of emmeansPairwiseTables) {
                const tableData = JSON.stringify({ tables: [table] });
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: (table as any).subtitle || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.title,
                    output_data: tableData,
                    components: table.title,
                });
            }

            const emmeansUnivariateTables = formattedResult.tables.filter(
                (table: Table) => table.key.startsWith("emmeans_univariate_")
            );
            for (const table of emmeansUnivariateTables) {
                const tableData = JSON.stringify({ tables: [table] });
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: (table as any).subtitle || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.title,
                    output_data: tableData,
                    components: table.title,
                });
            }

            /*
             * 📈 Plots Result ��
             * */
            // Since plots can have dynamic keys, we need to find all tables with 'plot_' prefix
            const plotTables = formattedResult.tables.filter((table: Table) =>
                table.key.startsWith("plot_")
            );

            for (const plotTable of plotTables) {
                const plotName = plotTable.title.startsWith("Plot - ")
                    ? plotTable.title.replace("Plot - ", "")
                    : plotTable.title;
                const plotData = JSON.stringify({ tables: [plotTable] });

                const plotId = await addAnalytic(logId, {
                    title: plotName,
                    note: "",
                });

                await addStatistic(plotId, {
                    title: plotName,
                    description: plotName,
                    output_data: plotData,
                    components: plotName,
                });
            }

            /*
             * 💾 Saved Variables Result 💾
             * */
            const savedVariables = findTable("saved_variables");
            if (savedVariables) {
                const savedVariablesId = await addAnalytic(logId, {
                    title: `Saved Variables`,
                    note: "",
                });

                await addStatistic(savedVariablesId, {
                    title: `Saved Variables`,
                    description: `Saved Variables`,
                    output_data: savedVariables,
                    components: `Saved Variables`,
                });
            }
        };

        await univariateAnalysisResult();
    } catch (e) {
        console.error(e);
    }
}
