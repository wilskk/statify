import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
<<<<<<< HEAD
import {RocAnalysisAnalysisType} from "@/components/Modals/Analyze/Classify/roc-analysis/types/roc-analysis-worker";
=======
import type {RocAnalysisAnalysisType} from "@/components/Modals/Analyze/Classify/roc-analysis/types/roc-analysis-worker";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

export async function analyzeRocAnalysis({
    configData,
    dataVariables,
    variables,
}: RocAnalysisAnalysisType) {
    const TestVariables = configData.main.TestTargetVariable || [];
    const StateVariable = configData.main.StateTargetVariable
        ? [configData.main.StateTargetVariable]
        : [];
    const TargetGroupVariable = configData.main.TargetGroupVar
        ? [configData.main.TargetGroupVar]
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

    const slicedDataForTargetGroup = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: TargetGroupVariable,
    });

    const varDefsForTest = getVarDefs(variables, TestVariables);
    const varDefsForState = getVarDefs(variables, StateVariable);
    const varDefsForTargetGroup = getVarDefs(variables, TargetGroupVariable);

    console.log(configData);

    // await init();
    // const rocAnalysis = new RocAnalysis(
    //     slicedDataForTest,
    //     slicedDataForState,
    //     slicedDataForTargetGroup,
    //     varDefsForTest,
    //     varDefsForState,
    //     varDefsForTargetGroup,
    //     configData
    // );

    // const results = rocAnalysis.get_formatted_results();
    // const error = rocAnalysis.get_all_errors();

    // console.log("result", results);
    // console.log("error", error);

    // const formattedResults = transformROCAnalysisResult(results);
    // console.log("formattedResults", formattedResults);

    /*
     * 🎉 Final Result Process 🎯
     * */
    // await resultROCAnalysis({
    //     formattedResult: formattedResults ?? [],
    // });
}
