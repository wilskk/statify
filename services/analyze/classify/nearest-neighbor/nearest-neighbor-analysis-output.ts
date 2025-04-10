// nearest-neighbor-analysis-output.ts
import { KNNFinalResultType } from "@/models/classify/nearest-neighbor/nearest-neighbor-worker";
import { Table } from "@/types/Table";

export async function resultNearestNeighbor({
    addLog,
    addAnalytic,
    addStatistic,
    formattedResult,
}: KNNFinalResultType) {
    try {
        console.log("formattedResult", formattedResult);
        const findTable = (key: string) => {
            const foundTable = formattedResult.tables.find(
                (table: Table) => table.key === key
            );
            return foundTable ? JSON.stringify({ tables: [foundTable] }) : null;
        };

        const nearestNeighborResult = async () => {
            /*
             * 🎉 Title Result 🎉
             * */
            const titleMessage = "Nearest Neighbor Analysis";
            const logId = await addLog({ log: titleMessage });
            const analyticId = await addAnalytic(logId, {
                title: `Nearest Neighbor Analysis Result`,
                note: "",
            });

            /*
             * 📊 Case Processing Summary Result 📊
             * */
            const caseProcessingSummary = findTable("case_processing_summary");
            if (caseProcessingSummary) {
                const caseProcessingId = await addAnalytic(logId, {
                    title: `Case Processing Summary`,
                    note: "",
                });

                await addStatistic(caseProcessingId, {
                    title: `Case Processing Summary`,
                    description: `Case Processing Summary`,
                    output_data: caseProcessingSummary,
                    components: `Case Processing Summary`,
                });
            }

            /*
             * ⚙️ System Settings Result ⚙️
             * */
            const systemSettings = findTable("system_settings");
            if (systemSettings) {
                const systemSettingsId = await addAnalytic(logId, {
                    title: `System Settings`,
                    note: "",
                });

                await addStatistic(systemSettingsId, {
                    title: `System Settings`,
                    description: `System Settings for Nearest Neighbor Analysis`,
                    output_data: systemSettings,
                    components: `System Settings`,
                });
            }

            /*
             * 📝 Classification Table Result 📝
             * */
            const classificationTable = findTable("classification_table");
            if (classificationTable) {
                const classificationTableId = await addAnalytic(logId, {
                    title: `Classification Table`,
                    note: "",
                });

                await addStatistic(classificationTableId, {
                    title: `Classification Table`,
                    description: `Classification Table for Nearest Neighbor Analysis`,
                    output_data: classificationTable,
                    components: `Classification Table`,
                });
            }

            /*
             * ❌ Error Summary Result ❌
             * */
            const errorSummary = findTable("error_summary");
            if (errorSummary) {
                const errorSummaryId = await addAnalytic(logId, {
                    title: `Error Summary`,
                    note: "",
                });

                await addStatistic(errorSummaryId, {
                    title: `Error Summary`,
                    description: `Percent of Records Incorrectly Classified`,
                    output_data: errorSummary,
                    components: `Error Summary`,
                });
            }

            /*
             * 👥 K Nearest Neighbors and Distances Result 👥
             * */
            const kNearestNeighbors = findTable(
                "k_nearest_neighbors_and_distances"
            );
            if (kNearestNeighbors) {
                const kNearestNeighborsId = await addAnalytic(logId, {
                    title: `K Nearest Neighbors and Distances`,
                    note: "",
                });

                await addStatistic(kNearestNeighborsId, {
                    title: `K Nearest Neighbors and Distances`,
                    description: `K Nearest Neighbors and Distances`,
                    output_data: kNearestNeighbors,
                    components: `K Nearest Neighbors and Distances`,
                });
            }

            /*
             * 📈 Predictor Importance Result 📈
             * */
            const predictorImportance = findTable("predictor_importance");
            if (predictorImportance) {
                const predictorImportanceId = await addAnalytic(logId, {
                    title: `Predictor Importance`,
                    note: "",
                });

                await addStatistic(predictorImportanceId, {
                    title: `Predictor Importance`,
                    description: `Predictor Importance for Nearest Neighbor Analysis`,
                    output_data: predictorImportance,
                    components: `Predictor Importance`,
                });
            }

            /*
             * 🌐 Predictor Space Result 🌐
             * */
            const predictorSpace = findTable("predictor_space");
            if (predictorSpace) {
                const predictorSpaceId = await addAnalytic(logId, {
                    title: `Predictor Space`,
                    note: "",
                });

                await addStatistic(predictorSpaceId, {
                    title: `Predictor Space`,
                    description: `Predictor Space Dimensions and Points`,
                    output_data: predictorSpace,
                    components: `Predictor Space`,
                });
            }
        };

        await nearestNeighborResult();
    } catch (e) {
        console.error(e);
    }
}
