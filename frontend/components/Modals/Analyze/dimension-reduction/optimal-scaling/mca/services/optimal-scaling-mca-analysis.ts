import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
<<<<<<< HEAD
import {
=======
import type {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    OptScaMCAAnalysisType
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/mca/types/optimal-scaling-mca-worker";

// import init, { MultipleCorrespondenceAnalysis } from "@/wasm/pkg/wasm";

export async function analyzeOptScaMCA({
    configData,
    dataVariables,
    variables,
}: OptScaMCAAnalysisType) {
    const AnalysisVariables = configData.main.AnalysisVars || [];
    const SupplementVariables = configData.main.SuppleVars || [];
    const LabelingVariables = configData.main.LabelingVars || [];

    const slicedDataForAnalysis = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: AnalysisVariables,
    });

    const slicedDataForSupplement = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: SupplementVariables,
    });

    const slicedDataForLabeling = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: LabelingVariables,
    });

    const varDefsForAnalysis = getVarDefs(variables, AnalysisVariables);
    const varDefsForSupplement = getVarDefs(variables, SupplementVariables);
    const varDefsForLabeling = getVarDefs(variables, LabelingVariables);

    console.log(configData);

    // await init();
    // const mca = new MultipleCorrespondenceAnalysis(
    //     slicedDataForAnalysis,
    //     slicedDataForSupplement,
    //     slicedDataForLabeling,
    //     varDefsForAnalysis,
    //     varDefsForSupplement,
    //     varDefsForLabeling,
    //     configData
    // );

    // const results = mca.get_results();
    // const error = mca.get_all_errors();

    // console.log("Results", results);
    // console.log(error);

    // const formattedResults = transformMCAResult(results);
    // console.log("formattedResults", formattedResults);

    /*
     * 🎉 Final Result Process 🎯
     * */
    // await resultMCAAnalysis({
    //     formattedResult: formattedResults ?? [],
    // });
}
