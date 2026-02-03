import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
import type {
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
        dataVariables,
        variables,
        selectedVariables: AnalysisVariables,
    });

    const slicedDataForSupplement = getSlicedData({
        dataVariables,
        variables,
        selectedVariables: SupplementVariables,
    });

    const slicedDataForLabeling = getSlicedData({
        dataVariables,
        variables,
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
