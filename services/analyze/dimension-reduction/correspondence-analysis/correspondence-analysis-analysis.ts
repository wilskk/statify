import { getSlicedData, getVarDefs } from "@/hooks/useVariable";
import { CorrespondenceAnalysisType } from "@/models/dimension-reduction/correspondence-analysis/correspondence-analysis-worker";
import init, { CorrespondenceAnalysis } from "@/wasm/pkg/wasm";

export async function analyzeCorrespondence({
    configData,
    dataVariables,
    variables,
    addLog,
    addAnalytic,
    addStatistic,
}: CorrespondenceAnalysisType) {
    await init();

    const RowVariable = configData.main.RowTargetVar
        ? [configData.main.RowTargetVar]
        : [];
    const ColVariable = configData.main.ColTargetVar
        ? [configData.main.ColTargetVar]
        : [];

    const slicedDataForRow = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: RowVariable,
    });

    const slicedDataForCol = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: ColVariable,
    });

    const varDefsForRow = getVarDefs(variables, RowVariable);
    const varDefsForCol = getVarDefs(variables, ColVariable);

    console.log(configData);

    const correspondence = new CorrespondenceAnalysis(
        slicedDataForRow,
        slicedDataForCol,
        varDefsForRow,
        varDefsForCol,
        configData
    );

    const results = correspondence.get_results();
    const error = correspondence.get_all_errors();

    // console.log("results", results);
    // console.log("error", error);

    // const formattedResults = transformClusteringResult(results);
    // console.log("formattedResults", formattedResults);

    // /*
    //  * 🎉 Final Result Process 🎯
    //  * */
    // await resultTwoStepCluster({
    //     addLog,
    //     addAnalytic,
    //     addStatistic,
    //     formattedResult: formattedResults ?? [],
    // });
}
