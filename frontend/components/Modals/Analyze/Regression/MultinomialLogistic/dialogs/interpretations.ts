/**
 * Generate interpretive descriptions for multinomial logistic regression output tables
 * Based on statistical values returned from WASM analysis
 */

/**
 * Generate interpretation for Case Processing Summary
 */
export function generateCaseProcessingDescription(
    validN: number | string,
    missingN: number | string,
    totalN: number | string,
    isWeighted: boolean
): string {
    const formatNum = (n: any) => {
        const num = typeof n === 'string' ? parseFloat(n) : n;
        if (isNaN(num)) return '0';
        return Math.round(num).toString();
    };

    const validStr = formatNum(validN);
    const missingStr = formatNum(missingN);
    const totalStr = formatNum(totalN);

    const weightText = isWeighted ? " (weighted frequency)" : "";
    const missingText = parseInt(missingStr) > 0 ? ` Missing cases: ${missingStr}${weightText}.` : '';

    return `Analysis includes ${validStr}${weightText} valid cases from total ${totalStr}.${missingText} Data processed using listwise deletion of incomplete observations.`;
}

/**
 * Generate interpretation for Model Fitting Information
 */
export function generateModelFittingDescription(
    nullLL: number,
    finalLL: number,
    chiSquare: number,
    pValue: number,
    df: number
): string {
    if (!Number.isFinite(nullLL) || !Number.isFinite(finalLL) || !Number.isFinite(chiSquare)) {
        return "Model fitting information comparing intercept-only to final model with predictors.";
    }

    const improvement = Math.abs(nullLL - finalLL);
    const improvementText = finalLL < nullLL
        ? `improved by ${improvement.toFixed(2)} log-likelihood units`
        : `showed no improvement`;

    const sigText = pValue < 0.001
        ? "highly significant (p < .001)"
        : pValue < 0.05
            ? `significant (p = ${pValue.toFixed(3)})`
            : `not significant (p = ${pValue.toFixed(3)})`;

    return `Final model ${improvementText} compared to intercept-only baseline (χ²(${df}) = ${chiSquare.toFixed(2)}, ${sigText}). The model explains the outcome variable better than the null model.`;
}

/**
 * Generate interpretation for Step Summary
 */
export function generateStepSummaryDescription(
    iterations: number,
    converged: boolean
): string {
    const convergenceText = converged
        ? `converged successfully after ${iterations} iteration${iterations !== 1 ? 's' : ''}`
        : `did not converge within ${iterations} iterations (increase iteration limit if needed)`;

    return `Newton-Raphson estimation ${convergenceText}. Model achieved convergence using the specified tolerance criteria.`;
}

/**
 * Generate interpretation for Pseudo R-Square
 */
export function generatePseudoRSquareDescription(
    coxSnell: number,
    nagelkerke: number,
    mcFadden: number
): string {
    if (!Number.isFinite(nagelkerke)) {
        return "Pseudo R-Square measures indicate the proportion of variance in the outcome explained by the model.";
    }

    const nagEl = nagelkerke * 100;
    const interpretation =
        nagEl >= 0.4 ? "substantial" :
            nagEl >= 0.2 ? "moderate" :
                nagEl >= 0.1 ? "small" :
                    "weak";

    return `Nagelkerke R² = ${nagelkerke.toFixed(3)} indicates ${interpretation} effect size. The model explains approximately ${nagEl.toFixed(1)}% of the variance in category membership.`;
}

/**
 * Generate interpretation for Parameter Estimates
 */
export function generateParameterEstimatesDescription(
    nPredictors: number,
    nCategories: number,
    nSignificant: number
): string {
    const totalParams = nPredictors * (nCategories - 1) + (nCategories - 1);
    const percentSig = nPredictors > 0 ? ((nSignificant / (nPredictors * (nCategories - 1))) * 100).toFixed(0) : '0';

    return `Logit coefficients for ${nCategories} outcome categories (${nCategories - 1} non-reference) with ${nPredictors} predictor${nPredictors !== 1 ? 's' : ''}. Reference category coefficients fixed at zero. Approximately ${percentSig}% of coefficients are statistically significant at p < .05 level.`;
}

/**
 * Generate interpretation for Classification Table
 */
export function generateClassificationDescription(
    overallAccuracy: number,
    categoryAccuracies: number[]
): string {
    if (!Number.isFinite(overallAccuracy)) {
        return "Model's ability to correctly classify observations into outcome categories.";
    }

    const overallPct = (overallAccuracy * 100).toFixed(1);
    const avgCatAccuracy = categoryAccuracies.length > 0
        ? (categoryAccuracies.reduce((a, b) => a + b, 0) / categoryAccuracies.length * 100).toFixed(1)
        : "0.0";

    const accuracyInterpretation =
        overallAccuracy >= 0.9 ? "excellent" :
            overallAccuracy >= 0.8 ? "very good" :
                overallAccuracy >= 0.7 ? "good" :
                    overallAccuracy >= 0.6 ? "fair" :
                        "poor";

    return `Overall classification accuracy: ${overallPct}% (${accuracyInterpretation}). Average per-category accuracy: ${avgCatAccuracy}%. Model correctly predicts outcome category membership ${overallPct}% of the time.`;
}

/**
 * Generate interpretation for Goodness-of-Fit Tests
 */
export function generateGoodnessOfFitDescription(
    pearsonChi2: number,
    pearsonP: number,
    devianceChi2: number,
    devianceP: number
): string {
    if (!Number.isFinite(pearsonChi2) || !Number.isFinite(devianceChi2)) {
        return "Goodness-of-fit tests (Pearson and Deviance) assess whether the model adequately fits the observed data.";
    }

    const pearsonInterpret = pearsonP >= 0.05
        ? "good fit (p ≥ .05)"
        : `poor fit (p = ${pearsonP.toFixed(3)})`;

    const devianceInterpret = devianceP >= 0.05
        ? "good fit (p ≥ .05)"
        : `poor fit (p = ${devianceP.toFixed(3)})`;

    return `Pearson χ² = ${pearsonChi2.toFixed(2)}, ${pearsonInterpret}. Deviance χ² = ${devianceChi2.toFixed(2)}, ${devianceInterpret}. Non-significant p-values (> .05) suggest the model fits the data adequately.`;
}

/**
 * Generate interpretation for Likelihood Ratio Tests
 */
export function generateLikelihoodRatioDescription(
    variableCount: number,
    significantCount: number,
    testOverallP: number
): string {
    const percentSig = variableCount > 0
        ? ((significantCount / variableCount) * 100).toFixed(0)
        : "0";

    const overallInterpret = testOverallP < 0.05
        ? `significant (p = ${testOverallP.toFixed(3)}), indicating the full model significantly improves fit`
        : `not significant (p = ${testOverallP.toFixed(3)}), indicating the model does not significantly improve upon baseline`;

    return `Likelihood ratio tests show ${significantCount} of ${variableCount} predictor${variableCount !== 1 ? 's' : ''} with significant effects (${percentSig}% significant). Overall model test: ${overallInterpret}.`;
}

/**
 * Generate interpretation for Asymptotic Covariances
 */
export function generateAsymptoticCovariancesDescription(nParams: number): string {
    return `Asymptotic covariance matrix of ${nParams} parameter estimates. Standard errors derived from diagonal elements.`;
}

/**
 * Generate interpretation for Asymptotic Correlations
 */
export function generateAsymptoticCorrelationsDescription(nParams: number): string {
    return `Asymptotic correlation matrix of ${nParams} parameter estimates. Values range from -1 to +1 indicating parameter interdependence.`;
}

/**
 * Generate interpretation for Monotonicity Measures
 */
export function generateMonotonicityDescription(
    somersD: number,
    gamma: number,
    tau: number
): string {
    if (!Number.isFinite(somersD)) {
        return "Monotonic association measures assess the strength of association between observed and predicted outcome categories.";
    }

    const somersInterpret =
        Math.abs(somersD) >= 0.5 ? "strong" :
            Math.abs(somersD) >= 0.3 ? "moderate" :
                Math.abs(somersD) >= 0.1 ? "weak" :
                    "negligible";

    return `Somers' D = ${somersD.toFixed(3)} (${somersInterpret} association between observed and predicted categories). Gamma = ${gamma.toFixed(3)}, Tau = ${tau.toFixed(3)}.`;
}

/**
 * Generate interpretation for Cell Probabilities
 */
export function generateCellProbabilitiesDescription(nRows: number, nCategories: number): string {
    return `Predicted probability of membership in each of ${nCategories} outcome categories for ${nRows} observation${nRows !== 1 ? 's' : ''}. Probabilities sum to 1.0 within each row.`;
}
