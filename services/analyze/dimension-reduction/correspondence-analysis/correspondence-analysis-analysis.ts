import { getSlicedData, getVarDefs } from "@/hooks/useVariable";
import { CorrespondenceAnalysisType } from "@/models/dimension-reduction/correspondence-analysis/correspondence-analysis-worker";
import init from "@/wasm/pkg/wasm";
import { transformCorrespondenceResult } from "./correspondence-analysis-formatter";
import { resultCorrespondence } from "./correspondence-analysis-output";

export async function analyzeCorrespondence({
    configData,
    dataVariables,
    variables,
    meta,
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
    const WeightVariable = meta.weight ? [meta.weight] : [];

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

    const slicedDataForWeight = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: WeightVariable,
    });

    const varDefsForRow = getVarDefs(variables, RowVariable);
    const varDefsForCol = getVarDefs(variables, ColVariable);
    const varDefsForWeight = getVarDefs(variables, WeightVariable);

    console.log(configData);

    // const correspondence = new CorrespondenceAnalysis(
    //     slicedDataForRow,
    //     slicedDataForCol,
    //     slicedDataForWeight,
    //     varDefsForRow,
    //     varDefsForCol,
    //     varDefsForWeight,
    //     configData
    // );

    // const results = correspondence.get_formatted_results();
    // const error = correspondence.get_all_errors();

    // console.log("results", results);
    // console.log("error", error);

    // const formattedResults = transformCorrespondenceResult(
    //     results,
    //     configData.main.RowTargetVar ?? "Row",
    //     configData.main.ColTargetVar ?? "Column"
    // );
    // console.log("formattedResults", formattedResults);

    // /*
    //  * 🎉 Final Result Process 🎯
    //  * */
    // await resultCorrespondence({
    //     addLog,
    //     addAnalytic,
    //     addStatistic,
    //     formattedResult: formattedResults ?? [],
    // });
}
