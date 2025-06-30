// factor-analysis-output.ts
import {FactorFinalResultType} from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor-worker";
import {Table} from "@/types/Table";
import {useResultStore} from "@/stores/useResultStore";

export async function resultFactorAnalysis({
    formattedResult,
}: FactorFinalResultType) {
    try {
        const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

        const findTable = (key: string) => {
            const foundTable = formattedResult.tables.find(
                (table: Table) => table.key === key
            );
            return foundTable ? JSON.stringify({ tables: [foundTable] }) : null;
        };

        const factorAnalysisResult = async () => {
            /*
             * 🎉 Title Result 🎉
             * */
            const titleMessage = "Factor Analysis";
            const logId = await addLog({ log: titleMessage });
            const analyticId = await addAnalytic(logId, {
                title: `Factor Analysis Result`,
                note: "",
            });

            /*
             * 📊 Descriptive Statistics Result 📊
             * */
            const descriptiveStatistics = findTable("descriptive_statistics");
            if (descriptiveStatistics) {
                const descriptiveStatsId = await addAnalytic(logId, {
                    title: `Descriptive Statistics`,
                    note: "",
                });

                await addStatistic(descriptiveStatsId, {
                    title: `Descriptive Statistics`,
                    description: `Descriptive Statistics`,
                    output_data: descriptiveStatistics,
                    components: `Descriptive Statistics`,
                });
            }

            /*
             * 📈 Correlation Matrix Result 📈
             * */
            const correlationMatrix = findTable("correlation_matrix");
            if (correlationMatrix) {
                const correlationMatrixId = await addAnalytic(logId, {
                    title: `Correlation Matrix`,
                    note: "",
                });

                await addStatistic(correlationMatrixId, {
                    title: `Correlation Matrix`,
                    description: `Correlation Matrix`,
                    output_data: correlationMatrix,
                    components: `Correlation Matrix`,
                });
            }

            /*
             * 📊 Inverse Correlation Matrix Result 📊
             * */
            const inverseCorrelationMatrix = findTable(
                "inverse_correlation_matrix"
            );
            if (inverseCorrelationMatrix) {
                const inverseCorrelationMatrixId = await addAnalytic(logId, {
                    title: `Inverse of Correlation Matrix`,
                    note: "",
                });

                await addStatistic(inverseCorrelationMatrixId, {
                    title: `Inverse of Correlation Matrix`,
                    description: `Inverse of Correlation Matrix`,
                    output_data: inverseCorrelationMatrix,
                    components: `Inverse of Correlation Matrix`,
                });
            }

            /*
             * 📈 KMO and Bartlett's Test Result 📈
             * */
            const kmoBartlettsTest = findTable("kmo_bartletts_test");
            if (kmoBartlettsTest) {
                const kmoBartlettsTestId = await addAnalytic(logId, {
                    title: `KMO and Bartlett's Test`,
                    note: "",
                });

                await addStatistic(kmoBartlettsTestId, {
                    title: `KMO and Bartlett's Test`,
                    description: `KMO and Bartlett's Test`,
                    output_data: kmoBartlettsTest,
                    components: `KMO and Bartlett's Test`,
                });
            }

            /*
             * 🔍 Anti-image Matrices Result 🔍
             * */
            const antiImageMatrices = findTable("anti_image_matrices");
            if (antiImageMatrices) {
                const antiImageMatricesId = await addAnalytic(logId, {
                    title: `Anti-image Matrices`,
                    note: "",
                });

                await addStatistic(antiImageMatricesId, {
                    title: `Anti-image Matrices`,
                    description: `Anti-image Matrices`,
                    output_data: antiImageMatrices,
                    components: `Anti-image Matrices`,
                });
            }

            /*
             * 📊 Communalities Result 📊
             * */
            const communalities = findTable("communalities");
            if (communalities) {
                const communalitiesId = await addAnalytic(logId, {
                    title: `Communalities`,
                    note: "",
                });

                await addStatistic(communalitiesId, {
                    title: `Communalities`,
                    description: `Communalities`,
                    output_data: communalities,
                    components: `Communalities`,
                });
            }

            /*
             * 📈 Total Variance Explained Result 📈
             * */
            const totalVarianceExplained = findTable(
                "total_variance_explained"
            );
            if (totalVarianceExplained) {
                const totalVarianceExplainedId = await addAnalytic(logId, {
                    title: `Total Variance Explained`,
                    note: "",
                });

                await addStatistic(totalVarianceExplainedId, {
                    title: `Total Variance Explained`,
                    description: `Total Variance Explained`,
                    output_data: totalVarianceExplained,
                    components: `Total Variance Explained`,
                });
            }

            /*
             * 🧩 Component Matrix Result 🧩
             * */
            const componentMatrix = findTable("component_matrix");
            if (componentMatrix) {
                const componentMatrixId = await addAnalytic(logId, {
                    title: `Component Matrix`,
                    note: "",
                });

                await addStatistic(componentMatrixId, {
                    title: `Component Matrix`,
                    description: `Component Matrix`,
                    output_data: componentMatrix,
                    components: `Component Matrix`,
                });
            }

            /*
             * 🔄 Reproduced Correlations Result 🔄
             * */
            const reproducedCorrelations = findTable("reproduced_correlations");
            if (reproducedCorrelations) {
                const reproducedCorrelationsId = await addAnalytic(logId, {
                    title: `Reproduced Correlations`,
                    note: "",
                });

                await addStatistic(reproducedCorrelationsId, {
                    title: `Reproduced Correlations`,
                    description: `Reproduced Correlations`,
                    output_data: reproducedCorrelations,
                    components: `Reproduced Correlations`,
                });
            }

            /*
             * 🔄 Rotated Component Matrix Result 🔄
             * */
            const rotatedComponentMatrix = findTable(
                "rotated_component_matrix"
            );
            if (rotatedComponentMatrix) {
                const rotatedComponentMatrixId = await addAnalytic(logId, {
                    title: `Rotated Component Matrix`,
                    note: "",
                });

                await addStatistic(rotatedComponentMatrixId, {
                    title: `Rotated Component Matrix`,
                    description: `Rotated Component Matrix`,
                    output_data: rotatedComponentMatrix,
                    components: `Rotated Component Matrix`,
                });
            }

            /*
             * 🔄 Component Transformation Matrix Result 🔄
             * */
            const componentTransformationMatrix = findTable(
                "component_transformation_matrix"
            );
            if (componentTransformationMatrix) {
                const componentTransformationMatrixId = await addAnalytic(
                    logId,
                    {
                        title: `Component Transformation Matrix`,
                        note: "",
                    }
                );

                await addStatistic(componentTransformationMatrixId, {
                    title: `Component Transformation Matrix`,
                    description: `Component Transformation Matrix`,
                    output_data: componentTransformationMatrix,
                    components: `Component Transformation Matrix`,
                });
            }

            /*
             * 📊 Component Score Coefficient Matrix Result 📊
             * */
            const componentScoreCoefficientMatrix = findTable(
                "component_score_coefficient_matrix"
            );
            if (componentScoreCoefficientMatrix) {
                const componentScoreCoefficientMatrixId = await addAnalytic(
                    logId,
                    {
                        title: `Component Score Coefficient Matrix`,
                        note: "",
                    }
                );

                await addStatistic(componentScoreCoefficientMatrixId, {
                    title: `Component Score Coefficient Matrix`,
                    description: `Component Score Coefficient Matrix`,
                    output_data: componentScoreCoefficientMatrix,
                    components: `Component Score Coefficient Matrix`,
                });
            }

            /*
             * 📈 Component Score Covariance Matrix Result 📈
             * */
            const componentScoreCovarianceMatrix = findTable(
                "component_score_covariance_matrix"
            );
            if (componentScoreCovarianceMatrix) {
                const componentScoreCovarianceMatrixId = await addAnalytic(
                    logId,
                    {
                        title: `Component Score Covariance Matrix`,
                        note: "",
                    }
                );

                await addStatistic(componentScoreCovarianceMatrixId, {
                    title: `Component Score Covariance Matrix`,
                    description: `Component Score Covariance Matrix`,
                    output_data: componentScoreCovarianceMatrix,
                    components: `Component Score Covariance Matrix`,
                });
            }

            /*
             * 📉 Scree Plot Data Result 📉
             * */
            const screePlot = findTable("scree_plot");
            if (screePlot) {
                const screePlotId = await addAnalytic(logId, {
                    title: `Scree Plot Data`,
                    note: "",
                });

                await addStatistic(screePlotId, {
                    title: `Scree Plot Data`,
                    description: `Scree Plot Data`,
                    output_data: screePlot,
                    components: `Scree Plot Data`,
                });
            }
        };

        await factorAnalysisResult();
    } catch (e) {
        console.error(e);
    }
}
