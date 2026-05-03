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

    // Determine whether the user actually requested post-hoc tests so we can
    // suppress non-failure warnings when they didn't (Rust always runs
    // homogeneous_subsets regardless of config, and posthoc may run when
    // SrcList is auto-populated even if no test method is selected).
    const ph = configData.posthoc;
    const userRequestedPosthoc =
        (ph.FixFactorVars?.length ?? 0) > 0 &&
        Boolean(
            ph.Lsd || ph.Bonfe || ph.Sidak || ph.Scheffe || ph.Regwf ||
            ph.Regwq || ph.Snk || ph.Tu || ph.Tub || ph.Dun || ph.Hoc ||
            ph.Gabriel || ph.Waller || ph.Dunnett || ph.Tam || ph.Dunt ||
            ph.Games || ph.Dunc
        );

    const isSuppressibleContext = (ctx: string): boolean => {
        const lower = ctx.toLowerCase();
        return (
            lower === "calculate_posthoc_tests" ||
            lower === "calculate_homogeneous_subsets"
        );
    };

    // Parse the Rust error string into context-grouped messages, drop
    // suppressible groups, then re-serialize for the formatter.
    let errors: string[] = ["No errors occurred."];
    if (errorsString && errorsString.trim() !== "No errors occurred.") {
        type ErrGroup = { context: string; messages: string[] };
        const groups: ErrGroup[] = [];
        let current: ErrGroup | null = null;

        errorsString.split("\n").forEach((line: string) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "Error Summary:") return;
            if (trimmed.startsWith("Context: ")) {
                current = {
                    context: trimmed.replace("Context: ", "").trim(),
                    messages: [],
                };
                groups.push(current);
            } else if (current) {
                current.messages.push(trimmed.replace(/^\d+\.\s*/, ""));
            }
        });

        const filtered = groups.filter(
            (g) => userRequestedPosthoc || !isSuppressibleContext(g.context)
        );

        if (filtered.length === 0) {
            errors = ["No errors occurred."];
        } else {
            const lines: string[] = ["Error Summary:"];
            filtered.forEach((g) => {
                lines.push(`Context: ${g.context}`);
                g.messages.forEach((m, i) => lines.push(`${i + 1}. ${m}`));
            });
            errors = lines;
        }
    } else if (errorsString) {
        errors = [errorsString.trim()];
    }

    const formattedResults = transformMultivariateResult(results, errors);

    // SPSS only shows the "Contrast Coefficients" table when the user
    // explicitly picks a contrast method (Deviation/Simple/etc.). Drop it
    // here if the method is "none" (default) so our output matches SPSS.
    const contrastMethod = configData.contrast.ContrastMethod;
    if (!contrastMethod || contrastMethod.toLowerCase() === "none") {
        formattedResults.tables = formattedResults.tables.filter(
            (t) => t.key !== "contrast_coefficients"
        );
    }

    /*
     * 🎉 Final Result Process 🎯
     * */
    await resultMultivariateAnalysis({
        formattedResult: formattedResults ?? [],
    });
}
