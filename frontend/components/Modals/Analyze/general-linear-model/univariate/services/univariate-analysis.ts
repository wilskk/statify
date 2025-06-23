import { getSlicedData, getVarDefs } from "@/hooks/useVariable";
import { UnivariateAnalysisType } from "@/components/Modals/Analyze/general-linear-model/univariate/types/univariate-worker";
import init, { UnivariateAnalysis } from "@/wasm/pkg";
import { transformUnivariateResult } from "./univariate-analysis-formatter";
import { resultUnivariateAnalysis } from "./univariate-analysis-output";

export async function analyzeUnivariate({
    configData,
    dataVariables,
    variables,
}: UnivariateAnalysisType) {
    const DependentVariables = configData.main.DepVar || [];
    const FixFactorVariables = configData.main.FixFactor || [];
    const CovariateVariables = configData.main.Covar || [];
    const RandomFactorVariables = configData.main.RandFactor || [];
    const WlsWeightVariable = configData.main.WlsWeight
        ? [configData.main.WlsWeight]
        : [];

    const slicedDataForDependent = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: DependentVariables,
    });

    const slicedDataForFixFactor = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: FixFactorVariables,
    });

    const slicedDataForRandomFactor = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: RandomFactorVariables,
    });

    const slicedDataForCovariate = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: CovariateVariables,
    });

    const slicedDataForWlsWeight = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: WlsWeightVariable,
    });

    const varDefsForDependent = getVarDefs(variables, DependentVariables);
    const varDefsForFixFactor = getVarDefs(variables, FixFactorVariables);
    const varDefsForRandomFactor = getVarDefs(variables, RandomFactorVariables);
    const varDefsForCovariate = getVarDefs(variables, CovariateVariables);
    const varDefsForWlsWeight = getVarDefs(variables, WlsWeightVariable);

    console.log(configData);

    await init();
    const univariate = new UnivariateAnalysis(
        slicedDataForDependent,
        slicedDataForFixFactor,
        slicedDataForRandomFactor,
        slicedDataForCovariate,
        slicedDataForWlsWeight,
        varDefsForDependent,
        varDefsForFixFactor,
        varDefsForRandomFactor,
        varDefsForCovariate,
        varDefsForWlsWeight,
        configData
    );

    const results = univariate.get_formatted_results();
    const error = univariate.get_all_errors();

    console.log("Results", results);
    console.log(error);

    const formattedResults = transformUnivariateResult(results);
    console.log("formattedResults", formattedResults);

    /*
     * 🎉 Final Result Process 🎯
     * */
    await resultUnivariateAnalysis({
        formattedResult: formattedResults ?? [],
        configData: configData,
        variables: variables,
    });
}
