import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
<<<<<<< HEAD
import {
=======
import type {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    HierClusAnalysisType
} from "@/components/Modals/Analyze/Classify/hierarchical-cluster/types/hierarchical-cluster-worker";

export async function analyzeHierClus({
    configData,
    dataVariables,
    variables,
}: HierClusAnalysisType) {
    const ClusterVariables = configData.main.Variables || [];

    const LabelCasesVariable = configData.main.LabelCases
        ? [configData.main.LabelCases]
        : [];

    const slicedDataForCluster = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: ClusterVariables,
    });

    const slicedDataForLabelCases = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: LabelCasesVariable,
    });

    const varDefsForCluster = getVarDefs(variables, ClusterVariables);
    const varDefsForLabelCases = getVarDefs(variables, LabelCasesVariable);

    console.log(configData);

    // await init();
    // const hc = new HierarchicalCluster(
    //     slicedDataForCluster,
    //     slicedDataForLabelCases,
    //     varDefsForCluster,
    //     varDefsForLabelCases,
    //     configData
    // );

    // const results = hc.get_formatted_results();
    // const results_original = hc.get_results();
    // const error = hc.get_all_errors();

    // console.log("Results:", results);
    // console.log("Original Results: ", results_original);
    // console.log("Errors:", error);

    // const formattedResults = transformHierClusResult(results);
    // console.log("formattedResults", formattedResults);

    // /*
    //  * 🎉 Final Result Process 🎯
    //  * */
    // await resultHierarchicalCluster({
    //     formattedResult: formattedResults ?? [],
    // });
}
