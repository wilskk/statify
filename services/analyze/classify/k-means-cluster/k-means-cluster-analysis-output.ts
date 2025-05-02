// k-means-cluster-analysis-output.ts
import { KMeansClusterFinalResultType } from "@/models/classify/k-means-cluster/k-means-cluster-worker";
import { Table } from "@/types/Table";

export async function resultKMeans({
    addLog,
    addAnalytic,
    addStatistic,
    formattedResult,
}: KMeansClusterFinalResultType) {
    try {
        console.log("formattedResult", formattedResult);
        const findTable = (key: string) => {
            const foundTable = formattedResult.tables.find(
                (table: Table) => table.key === key
            );
            return foundTable ? JSON.stringify({ tables: [foundTable] }) : null;
        };

        const kMeansClusterAnalysisResult = async () => {
            /*
             * 🎉 Title Result 🎉
             * */
            const titleMessage = "K-Means Cluster Analysis";
            const logId = await addLog({ log: titleMessage });
            const analyticId = await addAnalytic(logId, {
                title: `K-Means Cluster Analysis Result`,
                note: "",
            });

            /*
             * 📊 Initial Cluster Centers Result 📊
             * */
            const initialClusterCenters = findTable("initial_cluster_centers");
            if (initialClusterCenters) {
                const initialClusterCentersId = await addAnalytic(logId, {
                    title: `Initial Cluster Centers`,
                    note: "",
                });

                await addStatistic(initialClusterCentersId, {
                    title: `Initial Cluster Centers`,
                    description: `Initial Cluster Centers`,
                    output_data: initialClusterCenters,
                    components: `Initial Cluster Centers`,
                });
            }

            /*
             * 📈 Iteration History Result 📈
             * */
            const iterationHistory = findTable("iteration_history");
            if (iterationHistory) {
                const iterationHistoryId = await addAnalytic(logId, {
                    title: `Iteration History`,
                    note: "",
                });

                await addStatistic(iterationHistoryId, {
                    title: `Iteration History`,
                    description: `Iteration History`,
                    output_data: iterationHistory,
                    components: `Iteration History`,
                });
            }

            /*
             * 👥 Cluster Membership Result 👥
             * */
            const clusterMembership = findTable("cluster_membership");
            if (clusterMembership) {
                const clusterMembershipId = await addAnalytic(logId, {
                    title: `Cluster Membership`,
                    note: "",
                });

                await addStatistic(clusterMembershipId, {
                    title: `Cluster Membership`,
                    description: `Cluster Membership`,
                    output_data: clusterMembership,
                    components: `Cluster Membership`,
                });
            }

            /*
             * 📊 Final Cluster Centers Result 📊
             * */
            const finalClusterCenters = findTable("final_cluster_centers");
            if (finalClusterCenters) {
                const finalClusterCentersId = await addAnalytic(logId, {
                    title: `Final Cluster Centers`,
                    note: "",
                });

                await addStatistic(finalClusterCentersId, {
                    title: `Final Cluster Centers`,
                    description: `Final Cluster Centers`,
                    output_data: finalClusterCenters,
                    components: `Final Cluster Centers`,
                });
            }

            /*
             * 📏 Distances between Final Cluster Centers Result 📏
             * */
            const distancesBetweenCenters = findTable(
                "distances_between_centers"
            );
            if (distancesBetweenCenters) {
                const distancesBetweenCentersId = await addAnalytic(logId, {
                    title: `Distances between Final Cluster Centers`,
                    note: "",
                });

                await addStatistic(distancesBetweenCentersId, {
                    title: `Distances between Final Cluster Centers`,
                    description: `Distances between Final Cluster Centers`,
                    output_data: distancesBetweenCenters,
                    components: `Distances between Final Cluster Centers`,
                });
            }

            /*
             * 📊 ANOVA Table Result 📊
             * */
            const anovaTable = findTable("anova");
            if (anovaTable) {
                const anovaTableId = await addAnalytic(logId, {
                    title: `ANOVA Table`,
                    note: "",
                });

                await addStatistic(anovaTableId, {
                    title: `ANOVA Table`,
                    description: `ANOVA Table`,
                    output_data: anovaTable,
                    components: `ANOVA Table`,
                });
            }

            /*
             * 📈 Number of Cases in each Cluster Result 📈
             * */
            const numberOfCases = findTable("number_of_cases");
            if (numberOfCases) {
                const numberOfCasesId = await addAnalytic(logId, {
                    title: `Number of Cases in each Cluster`,
                    note: "",
                });

                await addStatistic(numberOfCasesId, {
                    title: `Number of Cases in each Cluster`,
                    description: `Number of Cases in each Cluster`,
                    output_data: numberOfCases,
                    components: `Number of Cases in each Cluster`,
                });
            }
        };

        await kMeansClusterAnalysisResult();
    } catch (e) {
        console.error(e);
    }
}
