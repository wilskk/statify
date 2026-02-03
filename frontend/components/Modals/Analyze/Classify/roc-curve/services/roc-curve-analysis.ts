import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
<<<<<<< HEAD
import {RocCurveAnalysisType} from "@/components/Modals/Analyze/Classify/roc-curve/types/roc-curve-worker";
=======
import type {RocCurveAnalysisType} from "@/components/Modals/Analyze/Classify/roc-curve/types/roc-curve-worker";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

export async function analyzeRocCurve({
    configData,
    dataVariables,
    variables,
}: RocCurveAnalysisType) {
    const TestVariables = configData.main.TestTargetVariable || [];
    const StateVariable = configData.main.StateTargetVariable
        ? [configData.main.StateTargetVariable]
        : [];

    const slicedDataForTest = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: TestVariables,
    });

    const slicedDataForState = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: StateVariable,
    });

    const varDefsForTest = getVarDefs(variables, TestVariables);
    const varDefsForState = getVarDefs(variables, StateVariable);

    console.log(configData);

    // await init();
    // const rocCurve = new RocCurve(
    //     slicedDataForTest,
    //     slicedDataForState,
    //     varDefsForTest,
    //     varDefsForState,
    //     configData
    // );

    // const results = rocCurve.get_formatted_results();
    // const error = rocCurve.get_all_errors();

    // console.log("results", results);
    // console.log("error", error);

    // const formattedResults = transformROCCurveResult(results);
    // console.log("formattedResults", formattedResults);

    /*
     * 🎉 Final Result Process 🎯
     * */
    // await resultROCCurve({
    //     formattedResult: formattedResults ?? [],
    // });
}
