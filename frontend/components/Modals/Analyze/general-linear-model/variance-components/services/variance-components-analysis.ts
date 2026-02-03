import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
<<<<<<< HEAD
import {
=======
import type {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    VarianceCompsAnalysisType
} from "@/components/Modals/Analyze/general-linear-model/variance-components/types/variance-components-worker";

export async function analyzeVarianceComps({
    configData,
    dataVariables,
    variables,
}: VarianceCompsAnalysisType) {
    const DependentVariables = configData.main.DepVar || [];
    const FixFactorVariables = configData.main.FixFactor || [];
    const CovariateVariables = configData.main.Covar || [];
    const RandomFactorVariables = configData.main.RandFactor || [];
    const WlsWeightVariable = configData.main.WlsWeight
        ? [configData.main.WlsWeight]
        : [];

    const slicedDataForDependent = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: DependentVariables,
    });

    const slicedDataForFixFactor = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: FixFactorVariables,
    });

    const slicedDataForRandomFactor = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: RandomFactorVariables,
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

    const slicedDataForWlsWeight = getSlicedData({
<<<<<<< HEAD
        dataVariables: dataVariables,
        variables: variables,
=======
        dataVariables,
        variables,
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        selectedVariables: WlsWeightVariable,
    });

    const varDefsForDependent = getVarDefs(variables, DependentVariables);
    const varDefsForFixFactor = getVarDefs(variables, FixFactorVariables);
    const varDefsForRandomFactor = getVarDefs(variables, RandomFactorVariables);
    const varDefsForCovariate = getVarDefs(variables, CovariateVariables);
    const varDefsForWlsWeight = getVarDefs(variables, WlsWeightVariable);

    console.log(configData);

    // await init();
    // const varianceComps = new VarianceComponentsAnalysis(
    //     slicedDataForDependent,
    //     slicedDataForFixFactor,
    //     slicedDataForRandomFactor,
    //     slicedDataForCovariate,
    //     slicedDataForWlsWeight,
    //     varDefsForDependent,
    //     varDefsForFixFactor,
    //     varDefsForRandomFactor,
    //     varDefsForCovariate,
    //     varDefsForWlsWeight,
    //     configData
    // );

    // const results = varianceComps.get_formatted_results();
    // const error = varianceComps.get_all_errors();

    // console.log("Results", results);
    // console.log(error);

    // const formattedResults = transformVarianceCompsResult(results);
    // console.log("formattedResults", formattedResults);

    /*
     * 🎉 Final Result Process 🎯
     * */
    // await resultVarianceComponents({
    //     formattedResult: formattedResults ?? [],
    // });
}
