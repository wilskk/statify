import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
<<<<<<< HEAD
import {
=======
import type {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    RepeatedMeasuresAnalysisType
} from "@/components/Modals/Analyze/general-linear-model/repeated-measures/types/repeated-measures-worker";

export async function analyzeRepeatedMeasures({
    configData,
    dataVariables,
    variables,
}: RepeatedMeasuresAnalysisType) {
    const SubjectVariables = configData.main.SubVar || [];
    const FactorsVariables = configData.main.FactorsVar || [];
    const CovariateVariables = configData.main.Covariates || [];

    const slicedDataForSubject = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: SubjectVariables,
    });

    const slicedDataForFactors = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: FactorsVariables,
    });

    const slicedDataForCovariate = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: CovariateVariables,
    });

    const varDefsForSubject = getVarDefs(variables, SubjectVariables);
    const varDefsForFactors = getVarDefs(variables, FactorsVariables);
    const varDefsForCovariate = getVarDefs(variables, CovariateVariables);

    console.log(configData);

    // await init();
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
    // await resultRepeatedMeasures({
    //     formattedResult: formattedResults ?? [],
    // });
}
