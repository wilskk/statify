import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
<<<<<<< HEAD
import {
=======
import type {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    OptScaOveralsAnalysisType
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/overals/types/optimal-scaling-overals-worker";

// Helper function to extract just the variable name from a string like "age (Ordinal 1 10) (Ordinal 1 5)"
function extractVariableName(variableStr: string) {
    const nameMatch = variableStr.match(/^(\w+)/);
    return nameMatch ? nameMatch[1] : variableStr;
}

export async function analyzeOptScaOverals({
    configData,
    dataVariables,
    variables,
}: OptScaOveralsAnalysisType) {
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
<<<<<<< HEAD
            dataVariables: dataVariables,
            variables: variables,
=======
            dataVariables,
            variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
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
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: PlotsTargetVariable,
    });

    const varDefsForPlotsTarget = getVarDefs(variables, PlotsTargetVariable);

    console.log(configData);

    // await init();
    // const overals = new OVERALSAnalysis(
    //     slicedDataSets,
    //     slicedDataForPlotsTarget,
    //     varDefsSets,
    //     varDefsForPlotsTarget,
    //     configData
    // );

    // const results = overals.get_results();
    // const error = overals.get_all_errors();

    // console.log("Results", results);
    // console.log(error);

    /*
     * 🎉 Final Result Process 🎯
     * */
    // await resultOVERALSAnalysis({
    //     formattedResult: formattedResults ?? [],
    // });
}
