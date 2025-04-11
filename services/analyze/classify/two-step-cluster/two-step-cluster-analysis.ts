import { getSlicedData, getVarDefs } from "@/hooks/useVariable";
import { TwoStepClusterAnalysisType } from "@/models/classify/two-step-cluster/two-step-cluste-worker";
import init, { TwoStepClusterAnalysis } from "@/wasm/pkg/wasm";
import { transformClusteringResult } from "./two-step-cluster-analysis-formatter";
import { resultTwoStepCluster } from "./two-step-cluster-analysis-output";

export async function analyzeTwoStepCluster({
    configData,
    dataVariables,
    variables,
    addLog,
    addAnalytic,
    addStatistic,
}: TwoStepClusterAnalysisType) {
    await init();

    const CategoricalVariables = configData.main.CategoricalVar || [];
    const ContinousVariables = configData.main.ContinousVar || [];

    const slicedDataForCategorical = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: CategoricalVariables,
    });

    const slicedDataForContinous = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: ContinousVariables,
    });

    const varDefsForCategorical = getVarDefs(variables, CategoricalVariables);
    const varDefsForContinous = getVarDefs(variables, ContinousVariables);

    console.log(configData);

    const twostep = new TwoStepClusterAnalysis(
        slicedDataForCategorical,
        slicedDataForContinous,
        varDefsForCategorical,
        varDefsForContinous,
        configData
    );

    const results = twostep.get_formatted_results();
    const error = twostep.get_all_errors();

    console.log("results", results);
    console.log("error", error);

    const formattedResults = transformClusteringResult(results);
    console.log("formattedResults", formattedResults);

    /*
     * 🎉 Final Result Process 🎯
     * */
    await resultTwoStepCluster({
        addLog,
        addAnalytic,
        addStatistic,
        formattedResult: formattedResults ?? [],
    });
}
