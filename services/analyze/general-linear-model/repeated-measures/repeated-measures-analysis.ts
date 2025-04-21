import { getSlicedData, getVarDefs } from "@/hooks/useVariable";
import { RepeatedMeasuresAnalysisType } from "@/models/general-linear-model/repeated-measures/repeated-measures-worker";
import init from "@/wasm/pkg/wasm";

export async function analyzeRepeatedMeasures({
    configData,
    dataVariables,
    variables,
    addLog,
    addAnalytic,
    addStatistic,
}: RepeatedMeasuresAnalysisType) {
    await init();

    const SubjectVariables = configData.main.SubVar || [];
    const FactorsVariables = configData.main.FactorsVar || [];
    const CovariateVariables = configData.main.Covariates || [];

    const slicedDataForSubject = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: SubjectVariables,
    });

    const slicedDataForFactors = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: FactorsVariables,
    });

    const slicedDataForCovariate = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: CovariateVariables,
    });

    const varDefsForSubject = getVarDefs(variables, SubjectVariables);
    const varDefsForFactors = getVarDefs(variables, FactorsVariables);
    const varDefsForCovariate = getVarDefs(variables, CovariateVariables);

    console.log(configData);

    // const repeatedMeasure = new RepeatedMeasureAnalysis(
    //     slicedDataForDependent,
    //     slicedDataForFixFactor,
    //     slicedDataForCovariate,
    //     slicedDataForWlsWeight,
    //     varDefsForDependent,
    //     varDefsForFixFactor,
    //     varDefsForCovariate,
    //     varDefsForWlsWeight,
    //     configData
    // );

    // const results = repeatedMeasure.get_formatted_results();
    // const error = repeatedMeasure.get_all_errors();

    // console.log("Results", results);
    // console.log(error);

    // const formattedResults = transformRepeatedMeasureResult(results);
    // console.log("formattedResults", formattedResults);

    /*
     * 🎉 Final Result Process 🎯
     * */
    // await resultRepeatedMeasureAnalysis({
    //     addLog,
    //     addAnalytic,
    //     addStatistic,
    //     formattedResult: formattedResults ?? [],
    // });
}
