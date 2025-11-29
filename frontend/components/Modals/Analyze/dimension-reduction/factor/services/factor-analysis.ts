import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
import {FactorAnalysisType} from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor-worker";

export async function analyzeFactor({
    configData,
    dataVariables,
    variables,
}: FactorAnalysisType) {
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

    // await init();
    // const factor = new FactorAnalysis(
    //     slicedDataForTarget,
    //     slicedDataForValue,
    //     varDefsForTarget,
    //     varDefsForValue,
    //     configData
    // );

    // const results = factor.get_formatted_results();
    // const error = factor.get_all_errors();

    // console.log("results", results);
    // console.log("error", error);

    // const formattedResults = transformFactorAnalysisResult(results);
    // console.log("formattedResults", formattedResults);

    // /*
    //  * 🎉 Final Result Process 🎯
    //  * */
    // await resultFactorAnalysis({
    //     formattedResult: formattedResults ?? [],
    // });
}
