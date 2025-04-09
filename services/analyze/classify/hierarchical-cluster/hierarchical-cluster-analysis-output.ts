// hierarchical-cluster-analysis-output.ts
import { HierClusFinalResultType } from "@/models/classify/hierarchical-cluster/hierarchical-cluster-worker";
import { Table } from "@/types/Table";

export async function resultHierarchicalCluster({
    addLog,
    addAnalytic,
    addStatistic,
    formattedResult,
}: HierClusFinalResultType) {
    try {
        console.log("formattedResult", formattedResult);
        const findTable = (key: string) => {
            const foundTable = formattedResult.tables.find(
                (table: Table) => table.key === key
            );
            return foundTable ? JSON.stringify({ tables: [foundTable] }) : null;
        };

        const hierarchicalClusterResult = async () => {
            /*
             * 🎉 Title Result 🎉
             * */
            const titleMessage = "Hierarchical Cluster Analysis";
            const logId = await addLog({ log: titleMessage });
            const analyticId = await addAnalytic(logId, {
                title: `Hierarchical Cluster Analysis Result`,
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
                    description: `Summary of cases processed in the analysis`,
                    output_data: caseProcessingSummary,
                    components: `Case Processing Summary`,
                });
            }

            /*
             * 📊 Proximity Matrix Result 📊
             * */
            const proximityMatrix = findTable("proximity_matrix");
            if (proximityMatrix) {
                const proximityMatrixId = await addAnalytic(logId, {
                    title: `Proximity Matrix`,
                    note: "",
                });

                await addStatistic(proximityMatrixId, {
                    title: `Proximity Matrix`,
                    description: `Distance matrix between cases`,
                    output_data: proximityMatrix,
                    components: `Proximity Matrix`,
                });
            }

            /*
             * 📈 Agglomeration Schedule Result 📈
             * */
            const agglomerationSchedule = findTable("agglomeration_schedule");
            if (agglomerationSchedule) {
                const agglomerationScheduleId = await addAnalytic(logId, {
                    title: `Agglomeration Schedule`,
                    note: "",
                });

                await addStatistic(agglomerationScheduleId, {
                    title: `Agglomeration Schedule`,
                    description: `Stages of the clustering process`,
                    output_data: agglomerationSchedule,
                    components: `Agglomeration Schedule`,
                });
            }

            /*
             * 🌳 Dendrogram Result 🌳
             * */
            const dendrogram = findTable("dendrogram");
            if (dendrogram) {
                const dendrogramId = await addAnalytic(logId, {
                    title: `Dendrogram`,
                    note: "",
                });

                await addStatistic(dendrogramId, {
                    title: `Dendrogram`,
                    description: `Hierarchical tree diagram showing cluster formation`,
                    output_data: dendrogram,
                    components: `Dendrogram`,
                });
            }

            /*
             * 🧊 Icicle Plot Result 🧊
             * */
            const iciclePlot = findTable("icicle_plot");
            if (iciclePlot) {
                const iciclePlotId = await addAnalytic(logId, {
                    title: `Icicle Plot`,
                    note: "",
                });

                await addStatistic(iciclePlotId, {
                    title: `Icicle Plot`,
                    description: `Alternative visualization of the hierarchical clustering`,
                    output_data: iciclePlot,
                    components: `Icicle Plot`,
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
                    description: `Case assignments to clusters for selected solutions`,
                    output_data: clusterMembership,
                    components: `Cluster Membership`,
                });
            }

            /*
             * 📊 Cluster Means Result 📊
             * */
            const clusterMeans = findTable("cluster_means");
            if (clusterMeans) {
                const clusterMeansId = await addAnalytic(logId, {
                    title: `Cluster Means`,
                    note: "",
                });

                await addStatistic(clusterMeansId, {
                    title: `Cluster Means`,
                    description: `Average values of variables within each cluster`,
                    output_data: clusterMeans,
                    components: `Cluster Means`,
                });
            }

            /*
             * 🧮 Silhouette Measures Result 🧮
             * */
            const silhouetteMeasures = findTable("silhouette_measures");
            if (silhouetteMeasures) {
                const silhouetteMeasuresId = await addAnalytic(logId, {
                    title: `Silhouette Measures`,
                    note: "",
                });

                await addStatistic(silhouetteMeasuresId, {
                    title: `Silhouette Measures`,
                    description: `Measures of cluster cohesion and separation`,
                    output_data: silhouetteMeasures,
                    components: `Silhouette Measures`,
                });
            }
        };

        await hierarchicalClusterResult();
    } catch (e) {
        console.error(e);
    }
}
