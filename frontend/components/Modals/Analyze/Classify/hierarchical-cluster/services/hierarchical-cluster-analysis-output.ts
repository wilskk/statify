// hierarchical-cluster-analysis-output.ts
<<<<<<< HEAD
import {
    HierClusFinalResultType
} from "@/components/Modals/Analyze/Classify/hierarchical-cluster/types/hierarchical-cluster-worker";
import {Table} from "@/types/Table";
=======
import type {
    HierClusFinalResultType
} from "@/components/Modals/Analyze/Classify/hierarchical-cluster/types/hierarchical-cluster-worker";
import type {Table} from "@/types/Table";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
import {useResultStore} from "@/stores/useResultStore";

export async function resultHierarchicalCluster({
    formattedResult,
}: HierClusFinalResultType) {
    try {
        const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

        const findTable = (key: string) => {
            const foundTable = formattedResult.tables.find(
                (table: Table) => table.key === key
            );
            return foundTable ? JSON.stringify({ tables: [foundTable] }) : null;
        };

        const hierarchicalClusterAnalysisResult = async () => {
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
                const caseProcessingSummaryId = await addAnalytic(logId, {
                    title: `Case Processing Summary`,
                    note: "",
                });

                await addStatistic(caseProcessingSummaryId, {
                    title: `Case Processing Summary`,
                    description: `Case Processing Summary`,
                    output_data: caseProcessingSummary,
                    components: `Case Processing Summary`,
                });
            }

            /*
             * 📈 Proximity Matrix Result 📈
             * */
            const proximityMatrix = findTable("proximity_matrix");
            if (proximityMatrix) {
                const proximityMatrixId = await addAnalytic(logId, {
                    title: `Proximity Matrix`,
                    note: "",
                });

                await addStatistic(proximityMatrixId, {
                    title: `Proximity Matrix`,
                    description: `Proximity Matrix`,
                    output_data: proximityMatrix,
                    components: `Proximity Matrix`,
                });
            }

            /*
             * 📊 Agglomeration Schedule Result 📊
             * */
            const agglomerationSchedule = findTable("agglomeration_schedule");
            if (agglomerationSchedule) {
                const agglomerationScheduleId = await addAnalytic(logId, {
                    title: `Agglomeration Schedule`,
                    note: "",
                });

                await addStatistic(agglomerationScheduleId, {
                    title: `Agglomeration Schedule`,
                    description: `Agglomeration Schedule`,
                    output_data: agglomerationSchedule,
                    components: `Agglomeration Schedule`,
                });
            }

            /*
             * 🧩 Cluster Memberships Result 🧩
             * */
            const clusterMemberships = findTable("cluster_memberships");
            if (clusterMemberships) {
                const clusterMembershipsId = await addAnalytic(logId, {
                    title: `Cluster Membership`,
                    note: "",
                });

                await addStatistic(clusterMembershipsId, {
                    title: `Cluster Membership`,
                    description: `Cluster Membership`,
                    output_data: clusterMemberships,
                    components: `Cluster Membership`,
                });
            }

            /*
             * 📉 Icicle Plot Data Result 📉
             * */
            const iciclePlotData = findTable("icicle_plot_data");
            if (iciclePlotData) {
                const iciclePlotDataId = await addAnalytic(logId, {
                    title: `Icicle Plot Data`,
                    note: "",
                });

                await addStatistic(iciclePlotDataId, {
                    title: `Icicle Plot Data`,
                    description: `Icicle Plot Data`,
                    output_data: iciclePlotData,
                    components: `Icicle Plot Data`,
                });
            }

            /*
             * 🌳 Dendrogram Data Result 🌳
             * */
            const dendrogramData = findTable("dendrogram_data");
            if (dendrogramData) {
                const dendrogramDataId = await addAnalytic(logId, {
                    title: `Dendrogram Data`,
                    note: "",
                });

                await addStatistic(dendrogramDataId, {
                    title: `Dendrogram Data`,
                    description: `Dendrogram Data`,
                    output_data: dendrogramData,
                    components: `Dendrogram Data`,
                });
            }
        };

        await hierarchicalClusterAnalysisResult();
    } catch (e) {
        console.error(e);
    }
}
