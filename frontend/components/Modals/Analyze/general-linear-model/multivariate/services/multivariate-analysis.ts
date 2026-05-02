import { getSlicedData, getVarDefs } from "@/hooks/useVariable";
import type {
    MultivariateAnalysisType
} from "@/components/Modals/Analyze/general-linear-model/multivariate/types/multivariate-worker";
import { transformMultivariateResult } from "./multivariate-analysis-formatter";
import { resultMultivariateAnalysis } from "./multivariate-analysis-output";
import init, {
    MultivariateAnalysis,
} from "@/components/Modals/Analyze/general-linear-model/multivariate/rust/pkg";

export async function analyzeMultivariate({
    configData,
    dataVariables,
    variables,
}: MultivariateAnalysisType) {
    const DependentVariables = configData.main.DepVar || [];
    const FixFactorVariables = configData.main.FixFactor || [];
    const CovariateVariables = configData.main.Covar || [];
    const WlsWeightVariable = configData.main.WlsWeight
        ? [configData.main.WlsWeight]
        : [];

    const slicedDataForDependent = getSlicedData({
        dataVariables,
        variables,
        selectedVariables: DependentVariables,
    });

    const slicedDataForFixFactor = getSlicedData({
        dataVariables,
        variables,
        selectedVariables: FixFactorVariables,
    });

    const slicedDataForCovariate = getSlicedData({
        dataVariables,
        variables,
        selectedVariables: CovariateVariables,
    });

    const slicedDataForWlsWeight = getSlicedData({
        dataVariables,
        variables,
        selectedVariables: WlsWeightVariable,
    });

    const varDefsForDependent = getVarDefs(variables, DependentVariables);
    const varDefsForFixFactor = getVarDefs(variables, FixFactorVariables);
    const varDefsForCovariate = getVarDefs(variables, CovariateVariables);
    const varDefsForWlsWeight = getVarDefs(variables, WlsWeightVariable);

    await init();

    const multivariate = new MultivariateAnalysis(
        slicedDataForDependent,
        slicedDataForFixFactor,
        slicedDataForCovariate,
        slicedDataForWlsWeight,
        varDefsForDependent,
        varDefsForFixFactor,
        varDefsForCovariate,
        varDefsForWlsWeight,
        configData
    );

    const results = multivariate.get_formatted_results();
    const errorsString = multivariate.get_all_errors();

    let errors: string[] = [];
    if (errorsString) {
        errors = errorsString
            .split("\n")
            .filter((line: string) => line.trim() !== "");
    }

    const formattedResults = transformMultivariateResult(results, errors);

    /*
     * 🎉 Final Result Process 🎯
     * */
    await resultMultivariateAnalysis({
        formattedResult: formattedResults ?? [],
    });
}
