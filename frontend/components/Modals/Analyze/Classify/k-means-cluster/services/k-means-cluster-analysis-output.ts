import {
    KMeansClusterFinalResultType
} from "@/components/Modals/Analyze/Classify/k-means-cluster/types/k-means-cluster-worker";
import {Table} from "@/types/Table";
import {Variable} from "@/types/Variable";
import {useVariableStore} from "@/stores/useVariableStore";
import {useDataStore} from "@/stores/useDataStore";
import {useResultStore} from "@/stores/useResultStore";

export async function resultKMeans({
    formattedResult,
    configData,
    variables,
}: KMeansClusterFinalResultType) {
    try {
        const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

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

                // Save Cluster Membership and Distance as variables if enabled
                if (
                    configData.save.ClusterMembership ||
                    configData.save.DistanceClusterCenter
                ) {
                    await saveClusterResults(
                        formattedResult,
                        configData,
                        variables
                    );
                }
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

            /*
             * 📊 Cluster Plot Result 📊
             * */
            if (formattedResult.charts && formattedResult.charts.length > 0) {
                for (const chart of formattedResult.charts) {
                    const chartId = await addAnalytic(logId, {
                        title: chart.chartMetadata.title,
                        note: chart.chartMetadata.description,
                    });

                    await addStatistic(chartId, {
                        title: chart.chartMetadata.title,
                        description: chart.chartMetadata.description,
                        output_data: JSON.stringify({ charts: [chart] }),
                        components: chart.chartType,
                    });
                }
            }
        };

        await kMeansClusterAnalysisResult();
    } catch (e) {
        console.error(e);
    }
}

/**
 * Save cluster membership and distance from cluster center as new variables
 */
async function saveClusterResults(
    formattedResult: any,
    configData: any,
    variables: Variable[]
) {
    const { addVariable } = useVariableStore.getState();
    const { updateCells } = useDataStore.getState();

    // Find the cluster membership table
    const clusterMembershipTable = formattedResult.tables.find(
        (table: Table) => table.key === "cluster_membership"
    );

    if (
        !clusterMembershipTable ||
        !clusterMembershipTable.rows ||
        clusterMembershipTable.rows.length === 0
    ) {
        console.error("No cluster membership data found for saving variables");
        return;
    }

    // Get next column index
    let nextColumnIndex = variables.length;

    // Generate unique variable names
    const generateUniqueName = (prefix: string) => {
        let idx = 1;
        let name = `${prefix}_${idx}`;
        while (variables.some((v) => v.name === name)) {
            idx++;
            name = `${prefix}_${idx}`;
        }
        return name;
    };

    // Extract cluster membership values and distance values
    const clusterValues: string[] = [];
    const distanceValues: string[] = [];

    clusterMembershipTable.rows.forEach((row: any) => {
        if (row.cluster) {
            clusterValues.push(row.cluster.toString());
        }
        if (row.distance) {
            distanceValues.push(row.distance.toString());
        }
    });

    // Save cluster membership as a new variable
    if (configData.save.ClusterMembership && clusterValues.length > 0) {
        const clusterVarName = generateUniqueName("CM");

        const newClusterVariable: Partial<Variable> = {
            name: clusterVarName,
            columnIndex: nextColumnIndex,
            type: "NUMERIC",
            label: "Cluster Membership",
            values: [],
            missing: null,
            measure: "nominal",
            width: 8,
            decimals: 0,
            columns: 200,
            align: "right",
        };

        await addVariable(newClusterVariable);

        // Create updates for cluster values
        const clusterUpdates = clusterValues.map((value, rowIndex) => ({
            row: rowIndex,
            col: nextColumnIndex,
            value: value,
        }));

        if (clusterUpdates.length > 0) {
            await updateCells(clusterUpdates);
        }

        nextColumnIndex++;
    }

    // Save distance from cluster center as a new variable
    if (configData.save.DistanceClusterCenter && distanceValues.length > 0) {
        const distanceVarName = generateUniqueName("CD");

        const newDistanceVariable: Partial<Variable> = {
            name: distanceVarName,
            columnIndex: nextColumnIndex,
            type: "NUMERIC",
            label: "Distance from Cluster Center",
            values: [],
            missing: null,
            measure: "scale",
            width: 8,
            decimals: 3,
            columns: 200,
            align: "right",
        };

        await addVariable(newDistanceVariable);

        // Create updates for distance values
        const distanceUpdates = distanceValues.map((value, rowIndex) => ({
            row: rowIndex,
            col: nextColumnIndex,
            value: value,
        }));

        if (distanceUpdates.length > 0) {
            await updateCells(distanceUpdates);
        }
    }
}
