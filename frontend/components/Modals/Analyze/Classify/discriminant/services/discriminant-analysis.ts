import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
<<<<<<< HEAD
import {DiscriminantAnalysisType} from "@/components/Modals/Analyze/Classify/discriminant/types/discriminant-worker";
=======
import type {DiscriminantAnalysisType} from "@/components/Modals/Analyze/Classify/discriminant/types/discriminant-worker";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

// import init, { DiscriminantAnalysis } from "@/wasm/pkg/wasm";

export async function analyzeDiscriminant({
    configData,
    dataVariables,
    variables,
}: DiscriminantAnalysisType) {
    const GroupingVariable = configData.main.GroupingVariable
        ? [configData.main.GroupingVariable]
        : [];
    const IndependentVariables = configData.main.IndependentVariables || [];
    const SelectionVariable = configData.main.SelectionVariable
        ? [configData.main.SelectionVariable]
        : [];

    const slicedDataForGrouping = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: GroupingVariable,
    });

    const slicedDataForIndependent = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: IndependentVariables,
    });

    const slicedDataForSelection = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: SelectionVariable,
    });

    const varDefsForGrouping = getVarDefs(variables, GroupingVariable);
    const varDefsForIndependent = getVarDefs(variables, IndependentVariables);
    const varDefsForSelection = getVarDefs(variables, SelectionVariable);
    console.log(configData);

    // await init();
    // const da = new DiscriminantAnalysis(
    //     slicedDataForGrouping,
    //     slicedDataForIndependent,
    //     slicedDataForSelection,
    //     varDefsForGrouping,
    //     varDefsForIndependent,
    //     varDefsForSelection,
    //     configData
    // );

    // const results = da.get_formatted_results();

    // const executed = da.get_all_log();
    // const errors = da.get_all_errors();

    // console.log("executed", executed);
    // console.log("errors", errors);
    // console.log("results", results);

    // const formattedResults = transformDiscriminantResult(results);
    // console.log("formattedResults", formattedResults);

    // /*
    //  * 🎉 Final Result Process 🎯
    //  * */
    // await resultDiscriminant({
    //     formattedResult: formattedResults ?? [],
    // });
}
