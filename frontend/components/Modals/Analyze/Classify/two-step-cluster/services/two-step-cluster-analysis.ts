import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
<<<<<<< HEAD
import {
=======
import type {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    TwoStepClusterAnalysisType
} from "@/components/Modals/Analyze/Classify/two-step-cluster/types/two-step-cluste-worker";

export async function analyzeTwoStepCluster({
    configData,
    dataVariables,
    variables,
}: TwoStepClusterAnalysisType) {
    const CategoricalVariables = configData.main.CategoricalVar || [];
    const ContinousVariables = configData.main.ContinousVar || [];

    const slicedDataForCategorical = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: CategoricalVariables,
    });

    const slicedDataForContinous = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: ContinousVariables,
    });

    const varDefsForCategorical = getVarDefs(variables, CategoricalVariables);
    const varDefsForContinous = getVarDefs(variables, ContinousVariables);

    console.log(configData);

    // await init();
    // const twostep = new TwoStepClusterAnalysis(
    //     slicedDataForCategorical,
    //     slicedDataForContinous,
    //     varDefsForCategorical,
    //     varDefsForContinous,
    //     configData
    // );

    // const results = twostep.get_formatted_results();
    // const error = twostep.get_all_errors();

    // console.log("results", results);
    // console.log("error", error);

    // const formattedResults = transformClusteringResult(results);
    // console.log("formattedResults", formattedResults);

    /*
     * 🎉 Final Result Process 🎯
     * */
    // await resultTwoStepCluster({
    //     formattedResult: formattedResults ?? [],
    // });
}
