import { getSlicedData, getVarDefs } from "@/hooks/useVariable";
import { OptScaOveralsAnalysisType } from "@/models/dimension-reduction/optimal-scaling/overals/optimal-scaling-overals-worker";
import init, { OVERALSAnalysis } from "@/wasm/pkg/wasm";

// Helper function to extract just the variable name from a string like "age (Ordinal 1 10) (Ordinal 1 5)"
function extractVariableName(variableStr: string) {
    const nameMatch = variableStr.match(/^(\w+)/);
    return nameMatch ? nameMatch[1] : variableStr;
}

export async function analyzeOptScaOverals({
    configData,
    dataVariables,
    variables,
    addLog,
    addAnalytic,
    addStatistic,
}: OptScaOveralsAnalysisType) {
    await init();

    // Keep the original nested structure from configData
    const SetTargetVariable = configData?.main?.SetTargetVariable || [];

    // Extract just the variable names (flattened) for getSlicedData and getVarDefs
    const flattenedVariableNames = SetTargetVariable.flat().map((variableStr) =>
        extractVariableName(variableStr)
    );

    const PlotsTargetVariable = configData.main.PlotsTargetVariable || [];

    const slicedDataForSetTarget = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: flattenedVariableNames,
    });

    const slicedDataForPlotsTarget = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: PlotsTargetVariable,
    });

    const varDefsForSetTarget = getVarDefs(variables, flattenedVariableNames);
    const varDefsForPlotsTarget = getVarDefs(variables, PlotsTargetVariable);

    console.log(configData);
    console.log(flattenedVariableNames);
    console.log("slicedDataForSetTarget", slicedDataForSetTarget);

    // const overals = new OVERALSAnalysis(
    //     slicedDataForSetTarget,
    //     slicedDataForPlotsTarget,
    //     varDefsForSetTarget,
    //     varDefsForPlotsTarget,
    //     configData // Pass the original configData with preserved nested structure
    // );

    // const results = overals.get_results();
    // const error = overals.get_all_errors();

    // console.log("Results", results);
    // console.log(error);

    // const formattedResults = transformOVERALSResult(results);
    // console.log("formattedResults", formattedResults);

    /*
     * 🎉 Final Result Process 🎯
     * */
    // await resultOVERALSAnalysis({
    //     addLog,
    //     addAnalytic,
    //     addStatistic,
    //     formattedResult: formattedResults ?? [],
    // });
}
