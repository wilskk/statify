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

        const kMeansResult = async () => {
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
                const initialClustersId = await addAnalytic(logId, {
                    title: `Initial Cluster Centers`,
                    note: "",
                });

                await addStatistic(initialClustersId, {
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
                    description: `Convergence History of Cluster Centers`,
                    output_data: iterationHistory,
                    components: `Iteration History`,
                });
            }

            /*
             * 📊 Cluster Membership Result 📊
             * */
            const clusterMembership = findTable("cluster_membership");
            if (clusterMembership) {
                const clusterMembershipId = await addAnalytic(logId, {
                    title: `Cluster Membership`,
                    note: "",
                });

                await addStatistic(clusterMembershipId, {
                    title: `Cluster Membership`,
                    description: `Cluster Membership of Cases`,
                    output_data: clusterMembership,
                    components: `Cluster Membership`,
                });
            }

            /*
             * 🛠️ Final Cluster Centers Result 🛠️
             * */
            const finalClusterCenters = findTable("final_cluster_centers");
            if (finalClusterCenters) {
                const finalClustersId = await addAnalytic(logId, {
                    title: `Final Cluster Centers`,
                    note: "",
                });

                await addStatistic(finalClustersId, {
                    title: `Final Cluster Centers`,
                    description: `Final Cluster Centers`,
                    output_data: finalClusterCenters,
                    components: `Final Cluster Centers`,
                });
            }

            /*
             * 📏 Distances Between Clusters Result 📏
             * */
            const distancesBetweenCenters = findTable(
                "distances_between_centers"
            );
            if (distancesBetweenCenters) {
                const distancesId = await addAnalytic(logId, {
                    title: `Distances Between Final Cluster Centers`,
                    note: "",
                });

                await addStatistic(distancesId, {
                    title: `Distances Between Final Cluster Centers`,
                    description: `Euclidean Distances Between Final Cluster Centers`,
                    output_data: distancesBetweenCenters,
                    components: `Distances Between Final Cluster Centers`,
                });
            }

            /*
             * 📊 ANOVA Table Result 📊
             * */
            const anovaTable = findTable("anova_table");
            if (anovaTable) {
                const anovaId = await addAnalytic(logId, {
                    title: `ANOVA`,
                    note: "",
                });

                await addStatistic(anovaId, {
                    title: `ANOVA`,
                    description: `ANOVA Table for Cluster Analysis`,
                    output_data: anovaTable,
                    components: `ANOVA`,
                });
            }

            /*
             * 🔢 Number of Cases Result 🔢
             * */
            const numberOfCases = findTable("number_of_cases");
            if (numberOfCases) {
                const casesCountId = await addAnalytic(logId, {
                    title: `Number of Cases in each Cluster`,
                    note: "",
                });

                await addStatistic(casesCountId, {
                    title: `Number of Cases in each Cluster`,
                    description: `Distribution of Cases Across Clusters`,
                    output_data: numberOfCases,
                    components: `Number of Cases in each Cluster`,
                });
            }
        };

        await kMeansResult();
    } catch (e) {
        console.error(e);
    }
}
