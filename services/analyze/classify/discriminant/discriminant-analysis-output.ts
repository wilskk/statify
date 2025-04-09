// discriminant-analysis-output.ts
import { DiscriminantFinalResultType } from "@/models/classify/discriminant/discriminant-worker";
import { Table } from "@/types/Table";

export async function resultDiscriminant({
    addLog,
    addAnalytic,
    addStatistic,
    formattedResult,
}: DiscriminantFinalResultType) {
    try {
        console.log("formattedResult", formattedResult);
        const findTable = (key: string) => {
            const foundTable = formattedResult.tables.find(
                (table: Table) => table.key === key
            );
            return foundTable ? JSON.stringify({ tables: [foundTable] }) : null;
        };

        const discriminantResult = async () => {
            /*
             * 🎉 Title Result 🎉
             * */
            const titleMessage = "Discriminant Analysis";
            const logId = await addLog({ log: titleMessage });
            const analyticId = await addAnalytic(logId, {
                title: `Discriminant Analysis Result`,
                note: "",
            });

            /*
             * 📊 Analysis Case Result 📊
             * */
            const caseProcessingSummary = findTable("case_processing_summary");
            if (caseProcessingSummary) {
                const analyzeCaseId = await addAnalytic(logId, {
                    title: `Analysis Case Processing Summary`,
                    note: "",
                });

                await addStatistic(analyzeCaseId, {
                    title: `Analyse Case Processing Summary`,
                    description: `Analysis Case Processing Summary`,
                    output_data: caseProcessingSummary,
                    components: `Analyse Case Processing Summary`,
                });
            }

            /*
             * 📈 Group Statistics Result 📈
             * */
            const groupStatistics = findTable("group_statistics");
            if (groupStatistics) {
                const groupStatisticsId = await addAnalytic(logId, {
                    title: `Group Statistics`,
                    note: "",
                });

                await addStatistic(groupStatisticsId, {
                    title: `Group Statistics`,
                    description: `Group Statistics`,
                    output_data: groupStatistics,
                    components: `Group Statistics`,
                });
            }

            /*
             * 📊 Tests of Equality Result 📊
             * */
            const testsOfEquality = findTable("equality_tests");
            if (testsOfEquality) {
                const testsOfEqualityId = await addAnalytic(logId, {
                    title: `Tests of Equality of Group Means`,
                    note: "",
                });

                await addStatistic(testsOfEqualityId, {
                    title: `Tests of Equality of Group Means`,
                    description: `Tests of Equality of Group Means`,
                    output_data: testsOfEquality,
                    components: `Tests of Equality of Group Means`,
                });
            }

            /*
             * 📈 Pooled Within-Group Covariance Matrices Result 📈
             * */
            const pooledMatrices = findTable("pooled_within_groups_matrices");
            if (pooledMatrices) {
                const pooledMatricesId = await addAnalytic(logId, {
                    title: `Pooled Within-Group Covariance Matrices`,
                    note: "",
                });

                await addStatistic(pooledMatricesId, {
                    title: `Pooled Within-Group Covariance Matrices`,
                    description: `Pooled Within-Group Covariance Matrices`,
                    output_data: pooledMatrices,
                    components: `Pooled Within-Group Covariance Matrices`,
                });
            }

            /*
             * 📈 Covariance Matrices Result 📈
             * */
            const covarianceMatrices = findTable("covariance_matrices");
            if (covarianceMatrices) {
                const covarianceMatricesId = await addAnalytic(logId, {
                    title: `Covariance Matrices`,
                    note: "",
                });

                await addStatistic(covarianceMatricesId, {
                    title: `Covariance Matrices`,
                    description: `Covariance Matrices`,
                    output_data: covarianceMatrices,
                    components: `Covariance Matrices`,
                });
            }

            /*
             * 📊 Box's Test of Equality of Covariance Matrices Result 📊
             * */
            const boxTestLogDeterminants = findTable("log_determinants");
            const boxTestResults = findTable("box_m_test");
            if (boxTestLogDeterminants || boxTestResults) {
                const boxTest = await addAnalytic(logId, {
                    title: `Box's Test of Equality of Covariance Matrices`,
                    note: "",
                });

                if (boxTestLogDeterminants) {
                    await addStatistic(boxTest, {
                        title: `Box's Test of Equality of Covariance Matrices`,
                        description: `Box's Test of Equality of Covariance Matrices - Log Determinants`,
                        output_data: boxTestLogDeterminants,
                        components: `Box's Test of Equality of Covariance Matrices`,
                    });
                }

                if (boxTestResults) {
                    await addStatistic(boxTest, {
                        title: `Box's Test of Equality of Covariance Matrices`,
                        description: `Box's Test of Equality of Covariance Matrices - Results`,
                        output_data: boxTestResults,
                        components: `Box's Test of Equality of Covariance Matrices`,
                    });
                }
            }

            /*
             * 🚀 Stepwise Statistics Result 🚀
             * */
            const variablesEnteredTable = findTable("stepwise_statistics");
            const variablesInAnalysisTable = findTable("variables_in_analysis");
            const variablesNotInAnalysisTable = findTable(
                "variables_not_in_analysis"
            );
            const wilksLambdaStepsTable = findTable("wilks_lambda_steps");
            const pairwiseGroupComparisonsTable = findTable(
                "pairwise_group_comparisons"
            );

            if (
                variablesEnteredTable ||
                variablesInAnalysisTable ||
                variablesNotInAnalysisTable ||
                wilksLambdaStepsTable ||
                pairwiseGroupComparisonsTable
            ) {
                const stepwiseStatisticsId = await addAnalytic(logId, {
                    title: `Stepwise Statistics`,
                    note: "",
                });

                if (variablesEnteredTable) {
                    await addStatistic(stepwiseStatisticsId, {
                        title: `Variables Entered`,
                        description: `Variables Entered in Stepwise Analysis`,
                        output_data: variablesEnteredTable,
                        components: `Variables Entered`,
                    });
                }

                if (variablesInAnalysisTable) {
                    await addStatistic(stepwiseStatisticsId, {
                        title: `Variables in the Analysis`,
                        description: `Variables in the Stepwise Analysis`,
                        output_data: variablesInAnalysisTable,
                        components: `Variables in the Analysis`,
                    });
                }

                if (variablesNotInAnalysisTable) {
                    await addStatistic(stepwiseStatisticsId, {
                        title: `Variables Not in the Analysis`,
                        description: `Variables Not in the Stepwise Analysis`,
                        output_data: variablesNotInAnalysisTable,
                        components: `Variables Not in the Analysis`,
                    });
                }

                if (wilksLambdaStepsTable) {
                    await addStatistic(stepwiseStatisticsId, {
                        title: `Wilks' Lambda Steps`,
                        description: `Wilks' Lambda Steps in Stepwise Analysis`,
                        output_data: wilksLambdaStepsTable,
                        components: `Wilks' Lambda Steps`,
                    });
                }

                /*
                 * 📈 Pairwise Group Comparisons Result 📈
                 * */
                if (pairwiseGroupComparisonsTable) {
                    await addStatistic(stepwiseStatisticsId, {
                        title: `Pairwise Group Comparisons`,
                        description: `Pairwise Group Comparisons in Stepwise Analysis`,
                        output_data: pairwiseGroupComparisonsTable,
                        components: `Pairwise Group Comparisons`,
                    });
                }
            }

            /*
             * 📜 Summary Canonical Result 📜
             * */
            const eigenvaluesTable = findTable("eigenvalues");
            const wilksLambdaTable = findTable("wilks_lambda_test");
            if (eigenvaluesTable || wilksLambdaTable) {
                const summaryCanonicalId = await addAnalytic(logId, {
                    title: `Summary Canonical`,
                    note: "",
                });

                if (eigenvaluesTable) {
                    await addStatistic(summaryCanonicalId, {
                        title: `Eigenvalues`,
                        description: `Eigenvalues of Canonical Discriminant Functions`,
                        output_data: eigenvaluesTable,
                        components: `Eigenvalues`,
                    });
                }

                if (wilksLambdaTable) {
                    await addStatistic(summaryCanonicalId, {
                        title: `Wilks' Lambda`,
                        description: `Wilks' Lambda Test of Canonical Functions`,
                        output_data: wilksLambdaTable,
                        components: `Wilks' Lambda`,
                    });
                }
            }

            /*
             * 🛠️ Standardized Function Result 🛠️
             * */
            const stdCoefficientsTable = findTable(
                "standardized_canonical_coefficients"
            );
            const structureMatrixTable = findTable("structure_matrix");
            if (stdCoefficientsTable || structureMatrixTable) {
                const standardizedFunctionId = await addAnalytic(logId, {
                    title: `Standardized Function`,
                    note: "",
                });

                if (stdCoefficientsTable) {
                    await addStatistic(standardizedFunctionId, {
                        title: `Standardized Coefficients`,
                        description: `Standardized Canonical Discriminant Function Coefficients`,
                        output_data: stdCoefficientsTable,
                        components: `Standardized Coefficients`,
                    });
                }

                if (structureMatrixTable) {
                    await addStatistic(standardizedFunctionId, {
                        title: `Structure Matrix`,
                        description: `Structure Matrix of Discriminant Functions`,
                        output_data: structureMatrixTable,
                        components: `Structure Matrix`,
                    });
                }
            }

            /*
             * 🎯 Function Group Centroids Result 🎯
             * */
            const groupCentroidsTable = findTable(
                "functions_at_group_centroids"
            );
            if (groupCentroidsTable) {
                const functionGroupCentroidsId = await addAnalytic(logId, {
                    title: `Function Group Centroids`,
                    note: "",
                });

                await addStatistic(functionGroupCentroidsId, {
                    title: `Group Centroids`,
                    description: `Functions at Group Centroids`,
                    output_data: groupCentroidsTable,
                    components: `Group Centroids`,
                });
            }

            /*
             * 🎯 Classification Results 🎯
             * */
            const classificationSummaryTable = findTable(
                "classification_processing_summary"
            );
            const priorProbabilitiesTable = findTable("prior_probabilities");
            const classificationFunctionCoefficientsTable = findTable(
                "classification_function_coefficients"
            );
            const classificationResultsTable = findTable(
                "classification_results"
            );

            if (
                classificationSummaryTable ||
                priorProbabilitiesTable ||
                classificationFunctionCoefficientsTable ||
                classificationResultsTable
            ) {
                const classificationResultsId = await addAnalytic(logId, {
                    title: `Classification Results`,
                    note: "",
                });

                if (classificationSummaryTable) {
                    await addStatistic(classificationResultsId, {
                        title: `Classification Processing Summary`,
                        description: `Classification Processing Summary`,
                        output_data: classificationSummaryTable,
                        components: `Classification Processing Summary`,
                    });
                }

                if (priorProbabilitiesTable) {
                    await addStatistic(classificationResultsId, {
                        title: `Prior Probabilites for Groups`,
                        description: `Prior Probabilities Used in Classification`,
                        output_data: priorProbabilitiesTable,
                        components: `Prior Probabilites for Groups`,
                    });
                }

                if (classificationFunctionCoefficientsTable) {
                    await addStatistic(classificationResultsId, {
                        title: `Classification Function Coefficients`,
                        description: `Classification Function Coefficients (Fisher's linear discriminant functions)`,
                        output_data: classificationFunctionCoefficientsTable,
                        components: `Classification Function Coefficients`,
                    });
                }

                if (classificationResultsTable) {
                    await addStatistic(classificationResultsId, {
                        title: `Classification Results`,
                        description: `Classification Results Table`,
                        output_data: classificationResultsTable,
                        components: `Classification Results`,
                    });
                }
            }

            /*
             * 📝 Casewise Statistics Results 📝
             * */
            const casewiseStatisticsTable = findTable("casewise_statistics");
            if (casewiseStatisticsTable) {
                const casewiseStatisticsId = await addAnalytic(logId, {
                    title: `Casewise Statistics`,
                    note: "",
                });

                await addStatistic(casewiseStatisticsId, {
                    title: `Casewise Statistics`,
                    description: `Casewise Statistics for Classification`,
                    output_data: casewiseStatisticsTable,
                    components: `Casewise Statistics`,
                });
            }
        };

        await discriminantResult();
    } catch (e) {
        console.error(e);
    }
}
