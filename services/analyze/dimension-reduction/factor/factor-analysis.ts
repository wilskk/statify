import { getSlicedData, getVarDefs } from "@/hooks/useVariable";
import { FactorAnalysisType } from "@/models/dimension-reduction/factor/factor-worker";
import init, { FactorAnalysis } from "@/wasm/pkg/wasm";
import { transformFactorAnalysisResult } from "./factor-analysis-formatter";
import { resultFactorAnalysis } from "./factor-analysis-output";

export async function analyzeFactor({
    configData,
    dataVariables,
    variables,
    addLog,
    addAnalytic,
    addStatistic,
}: FactorAnalysisType) {
    await init();

    const targetVariables = configData.main.TargetVar || [];
    const valueTarget = configData.main.ValueTarget
        ? [configData.main.ValueTarget]
        : [];

    const slicedDataForTarget = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: targetVariables,
    });

    const slicedDataForValue = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: valueTarget,
    });

    const varDefsForTarget = getVarDefs(variables, targetVariables);
    const varDefsForValue = getVarDefs(variables, valueTarget);

    console.log(configData);

    const factor = new FactorAnalysis(
        slicedDataForTarget,
        slicedDataForValue,
        varDefsForTarget,
        varDefsForValue,
        configData
    );

    const results = factor.get_formatted_results();
    const error = factor.get_all_errors();

    console.log("results", results);
    console.log("error", error);

    const formattedResults = transformFactorAnalysisResult(results);
    console.log("formattedResults", formattedResults);

    /*
     * 🎉 Final Result Process 🎯
     * */
    await resultFactorAnalysis({
        addLog,
        addAnalytic,
        addStatistic,
        formattedResult: formattedResults ?? [],
    });
}
