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
    const PlotsTargetVariable = configData.main.PlotsTargetVariable || [];

    // Process each set separately to maintain nested structure
    const slicedDataSets = [];
    const varDefsSets = [];

    // For each set in the nested structure
    for (const set of SetTargetVariable) {
        // Extract just the variable names for this set
        const setVariableNames = set.map((variableStr) =>
            extractVariableName(variableStr)
        );

        // Get sliced data for this set
        const setSlicedData = getSlicedData({
            dataVariables: dataVariables,
            variables: variables,
            selectedVariables: setVariableNames,
        });

        // Get variable definitions for this set
        const setVarDefs = getVarDefs(variables, setVariableNames);

        // Add to our nested results
        slicedDataSets.push(setSlicedData);
        varDefsSets.push(setVarDefs);
    }

    // For plots target (keeping this as-is since it wasn't nested in the original)
    const slicedDataForPlotsTarget = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: PlotsTargetVariable,
    });

    const varDefsForPlotsTarget = getVarDefs(variables, PlotsTargetVariable);

    console.log(configData);

    const overals = new OVERALSAnalysis(
        slicedDataSets,
        slicedDataForPlotsTarget,
        varDefsSets,
        varDefsForPlotsTarget,
        configData
    );

    // const results = overals.get_results();
    // const error = overals.get_all_errors();

    // console.log("Results", results);
    // console.log(error);

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
