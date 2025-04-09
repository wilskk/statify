import { getSlicedData, getVarDefs } from "@/hooks/useVariable";
import { HierClusAnalysisType } from "@/models/classify/hierarchical-cluster/hierarchical-cluster-worker";
import init, { HierarchicalCluster } from "@/wasm/pkg/wasm";
import { resultHierarchicalCluster } from "./hierarchical-cluster-analysis-output";
import { transformHierClusResult } from "./hierarchical-cluster-analysis-formatter";

export async function analyzeHierClus({
    configData,
    dataVariables,
    variables,
    addLog,
    addAnalytic,
    addStatistic,
}: HierClusAnalysisType) {
    await init();

    const ClusterVariables = configData.main.Variables || [];

    const LabelCasesVariable = configData.main.LabelCases
        ? [configData.main.LabelCases]
        : [];

    const slicedDataForCluster = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: ClusterVariables,
    });

    const slicedDataForLabelCases = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: LabelCasesVariable,
    });

    const varDefsForCluster = getVarDefs(variables, ClusterVariables);
    const varDefsForLabelCases = getVarDefs(variables, LabelCasesVariable);

    console.log(configData);
    console.log("Sliced Data for Cluster:", slicedDataForCluster);
    console.log("Sliced Data for Label Cases:", slicedDataForLabelCases);
    console.log("Variable Definitions for Cluster:", varDefsForCluster);
    console.log("Variable Definitions for Label Cases:", varDefsForLabelCases);

    const hc = new HierarchicalCluster(
        slicedDataForCluster,
        slicedDataForLabelCases,
        varDefsForCluster,
        varDefsForLabelCases,
        configData
    );

    const results = hc.get_results();
    const error = hc.get_all_errors();

    console.log("Results:", results);
    console.log("Errors:", error);

    const formattedResults = transformHierClusResult(results);
    console.log("formattedResults", formattedResults);

    /*
     * 🎉 Final Result Process 🎯
     * */
    await resultHierarchicalCluster({
        addLog,
        addAnalytic,
        addStatistic,
        formattedResult: formattedResults ?? [],
    });
}
