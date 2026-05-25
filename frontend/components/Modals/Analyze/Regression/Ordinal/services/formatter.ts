import { formatParameterEstimates } from "./formatter_parameter";
import {
  AnalysisSection,
  OrdinalLocationParams,
  OrdinalOptions,
  OrdinalOptionsParams,
  OrdinalOutputParams,
  OrdinalPlumPayload,
  OrdinalScaleParams,
} from "../types/ordinal";
import {
  buildDefaultEstimationOptions,
  buildDefaultOutputOptions,
  inferModelType,
  inferScaleType,
  normalizeLinkFunction,
  normalizeOrderedCategories,
  createSection,
  safeFixed,
  fmtSig,
} from "./formatter_utils";

export interface BuildOrdinalPlumPayloadInput {
  options: OrdinalOptions;
  locationParams: OrdinalLocationParams;
  scaleParams: OrdinalScaleParams;
  optionParams: OrdinalOptionsParams;
  outputParams: OrdinalOutputParams;
  data: Array<Record<string, any>>;
}

export const buildOrdinalPlumPayload = (
  input: BuildOrdinalPlumPayloadInput
): OrdinalPlumPayload => {
  const { options, locationParams, scaleParams, optionParams, outputParams, data } = input;

  const responseVariable = options.dependent?.name ?? "";
  const responseColumnIndex = options.dependent?.columnIndex;
  const responseValues = Array.isArray(data) && typeof responseColumnIndex === "number"
    ? data.map((row) => row?.[responseColumnIndex])
    : [];

  const orderedCategories = normalizeOrderedCategories(responseValues);
  const categoryCount = orderedCategories.length;

  const locationVariables = locationParams.locationModel.length > 0
    ? locationParams.locationModel.map((v) => v.name)
    : [...options.factors, ...options.covariates].map((v) => v.name);

  const scaleVariables = scaleParams.scaleModel.map((v) => v.name);
  const scaleType = inferScaleType(scaleVariables);
  const modelType = inferModelType(scaleType);

  const parameterVector: Array<"theta" | "beta" | "tau"> = ["theta"];
  if (locationVariables.length > 0) {
    parameterVector.push("beta");
  }
  if (scaleType === "non_constant") {
    parameterVector.push("tau");
  }

  return {
    procedure: "PLUM",
    version: "plum-v1",
    response: {
      variable: responseVariable,
      orderedCategories,
      categoryCount,
    },
    model: {
      modelType,
      linkFunction: normalizeLinkFunction(optionParams.linkFunction),
      parameterVector,
    },
    location: {
      variables: locationVariables,
      parameterName: "beta",
      thresholdName: "theta",
    },
    scale: {
      scaleType,
      variables: scaleVariables,
      parameterName: "tau",
    },
    estimation: buildDefaultEstimationOptions(optionParams),
    output: buildDefaultOutputOptions(outputParams),
    frequencyWeightVariable: null,
  };
};

export const formatOrdinalResult = (result: any) => {
  const allSections: AnalysisSection[] = [];

  if (!result) return { sections: allSections };

  // 0. Case Processing Summary
  if (result.summaryStatistics && result.metadata?.caseProcessingSummary) {
    const summary = result.metadata.caseProcessingSummary;
    const total = Number(summary.totalN ?? 0);
    const valid = Number(summary.validN ?? 0);
    const missing = Number(summary.missingN ?? Math.max(0, total - valid));
    const totalSafe = total > 0 ? total : valid + missing;
    const variableLabel = summary.variableLabel || "Ordinal Regression";

    const columnHeaders = [
      { header: "N", key: "n" },
      { header: "Percent", key: "percent" },
    ];

    const rows = Array.isArray(summary.categories)
      ? summary.categories.map((category: any) => ({
        rowHeader: [variableLabel, String(category.label ?? "")],
        n: Number(category.n ?? 0),
        percent: valid > 0 ? `${(((category.n ?? 0) / valid) * 100).toFixed(1)}%` : "0.0%",
      }))
      : [];

    rows.push({
      rowHeader: ["Overall", "Valid"],
      n: valid,
      percent: totalSafe > 0 ? `${((valid / totalSafe) * 100).toFixed(1)}%` : "0.0%",
    });

    rows.push({
      rowHeader: ["Overall", "Missing"],
      n: missing,
      percent: totalSafe > 0 ? `${((missing / totalSafe) * 100).toFixed(1)}%` : "0.0%",
    });

    rows.push({
      rowHeader: ["Overall", "Total"],
      n: totalSafe,
      percent: "100.0%",
    });

    allSections.push(
      createSection(
        "ordinal_case_processing_summary",
        "Case Processing Summary",
        { columnHeaders, rows },
        {
          description: "Ringkasan jumlah kasus valid dan missing dalam analisis.",
        }
      )
    );
  }

  // 1. Model Fitting Information
  if (result.summaryStatistics) {
    const sumStats = result.summaryStatistics;
    const model = sumStats.model;
    const interceptOnly = sumStats.interceptOnly;
    const modelChiSquare = sumStats.modelChiSquare;

    if (model && interceptOnly && modelChiSquare) {
      const columnHeaders = [
        { header: "Model", key: "rh1" },
        { header: "-2 Log Likelihood", key: "neg2ll" },
        { header: "Chi-Square", key: "chiSquare" },
        { header: "df", key: "df" },
        { header: "Sig.", key: "sig" },
      ];

      const rows = [
        {
          rowHeader: ["Intercept Only"],
          neg2ll: safeFixed(interceptOnly.minus2LogLikelihood),
          chiSquare: ".",
          df: ".",
          sig: ".",
        },
        {
          rowHeader: ["Final"],
          neg2ll: safeFixed(model.minus2LogLikelihood),
          chiSquare: safeFixed(modelChiSquare.chiSquare),
          df: safeFixed(modelChiSquare.df, 0),
          sig: fmtSig(modelChiSquare.sig),
        },
      ];

      allSections.push(
        createSection(
          "ordinal_model_fitting_information",
          "Model Fitting Information",
          { columnHeaders, rows },
          {
            description: "Uji signifikansi model secara keseluruhan (perbandingan model dengan konstanta saja vs model lengkap)",
            note: "Link function: Logit.",
          }
        )
      );
    }
  }

  // 2. Goodness-of-Fit
  if (result.goodnessOfFit) {
    const gof = result.goodnessOfFit;
    const pearson = gof.pearson;
    const deviance = gof.deviance;

    if (pearson && deviance) {
      const columnHeaders = [
        { header: "", key: "rh1" },
        { header: "Chi-Square", key: "chiSquare" },
        { header: "df", key: "df" },
        { header: "Sig.", key: "sig" },
      ];

      const rows = [
        {
          rowHeader: ["Pearson"],
          chiSquare: safeFixed(pearson.chiSquare),
          df: safeFixed(pearson.df, 0),
          sig: fmtSig(pearson.sig),
        },
        {
          rowHeader: ["Deviance"],
          chiSquare: safeFixed(deviance.chiSquare),
          df: safeFixed(deviance.df, 0),
          sig: fmtSig(deviance.sig),
        },
      ];

      allSections.push(
        createSection(
          "ordinal_goodness_of_fit",
          "Goodness-of-Fit",
          { columnHeaders, rows },
          {
            description: "Uji Goodness-of-Fit Pearson dan Deviance (menguji kecocokan model, null hypothesis: model cocok dengan data)",
          }
        )
      );
    }
  }

  // 3. Pseudo R-Square
  if (result.summaryStatistics && result.summaryStatistics.pseudoRSquare) {
    const pseudo = result.summaryStatistics.pseudoRSquare;
    const columnHeaders = [
      { header: "Pseudo R-Square", key: "rh1" },
      { header: "Value", key: "value" },
    ];

    const rows = [
      {
        rowHeader: ["Cox and Snell"],
        value: safeFixed(pseudo.coxSnell),
      },
      {
        rowHeader: ["Nagelkerke"],
        value: safeFixed(pseudo.nagelkerke),
      },
      {
        rowHeader: ["McFadden"],
        value: safeFixed(pseudo.mcfadden),
      },
    ];

    allSections.push(
      createSection(
        "ordinal_pseudo_r_square",
        "Pseudo R-Square",
        { columnHeaders, rows },
        {
          description: "Koefisien Pseudo R-Square (mengukur proporsi variansi dependen yang dapat dijelaskan oleh model)",
        }
      )
    );
  }

  // 4. Parameter Estimates
  const estimates = result.parameterEstimates || result.parameter_estimates;
  if (estimates && Array.isArray(estimates) && estimates.length > 0) {
    const param = formatParameterEstimates(estimates);
    if (param.sections) {
      allSections.push(...param.sections);
    }
  }

  // 5. Test of Parallel Lines
  if (result.testOfParallelLines) {
    const parallelTest = result.testOfParallelLines;
    const columnHeaders = [
      { header: "Model", key: "rh1" },
      { header: "-2 Log Likelihood", key: "neg2ll" },
      { header: "Chi-Square", key: "chiSquare" },
      { header: "df", key: "df" },
      { header: "Sig.", key: "sig" },
    ];

    const rows = [
      {
        rowHeader: ["Null Hypothesis"],
        neg2ll: safeFixed(parallelTest.minus2LogLikelihoodParallel),
        chiSquare: ".",
        df: ".",
        sig: ".",
      },
      {
        rowHeader: ["General"],
        neg2ll: safeFixed(parallelTest.minus2LogLikelihoodNonParallel),
        chiSquare: safeFixed(parallelTest.chiSquare),
        df: safeFixed(parallelTest.df, 0),
        sig: fmtSig(parallelTest.sig),
      },
    ];

    allSections.push(
      createSection(
        "ordinal_test_of_parallel_lines",
        "Test of Parallel Lines",
        { columnHeaders, rows },
        {
          description: "Uji asumsi parallel lines (null hypothesis states that the location parameters (slope coefficients) are the same across response categories)",
        }
      )
    );
  }

  // 6. Iteration History
  const iterationHistory = Array.isArray(result.iterationHistory)
    ? result.iterationHistory
    : (Array.isArray(result.iteration_history) ? result.iteration_history : []);
  const iterationHistoryMeta = result.iterationHistoryMeta || result.iteration_history_meta || null;

  if (iterationHistory.length > 0) {
    const thresholdNames = Array.isArray(iterationHistoryMeta?.thresholdNames)
      ? iterationHistoryMeta.thresholdNames
      : [];
    const locationNames = Array.isArray(iterationHistoryMeta?.locationNames)
      ? iterationHistoryMeta.locationNames
      : [];
    const scaleNames = Array.isArray(iterationHistoryMeta?.scaleNames)
      ? iterationHistoryMeta.scaleNames
      : [];

    const columnHeaders = [
      { header: "Iteration", key: "rh1" },
      { header: "Number of Step-Halvings", key: "stepHalvings" },
      { header: "-2 Log Likelihood", key: "neg2ll" },
      ...thresholdNames.map((name: string, index: number) => ({
        header: `Threshold: ${name}`,
        key: `threshold_${index}`,
      })),
      ...locationNames.map((name: string, index: number) => ({
        header: `Location: ${name}`,
        key: `location_${index}`,
      })),
      ...scaleNames.map((name: string, index: number) => ({
        header: `Scale: ${name}`,
        key: `scale_${index}`,
      })),
    ];

    const rows = iterationHistory.map((row: any) => {
      const thresholdValues = Array.isArray(row.threshold) ? row.threshold : [];
      const locationValues = Array.isArray(row.location) ? row.location : [];
      const scaleValues = Array.isArray(row.scale) ? row.scale : [];
      const iterationValue = Number(row.iteration ?? 0);
      const stepHalvings = Number(row.stepHalvings ?? row.step_halvings ?? 0);

      const formatted: Record<string, any> = {
        rowHeader: [Number.isFinite(iterationValue) ? iterationValue.toString() : "0"],
        stepHalvings: Number.isFinite(stepHalvings) ? stepHalvings.toString() : "0",
        neg2ll: safeFixed(row.minus2LogLikelihood ?? row.minus2_log_likelihood, 3),
      };

      thresholdNames.forEach((_: string, index: number) => {
        formatted[`threshold_${index}`] = safeFixed(thresholdValues[index], 6);
      });
      locationNames.forEach((_: string, index: number) => {
        formatted[`location_${index}`] = safeFixed(locationValues[index], 6);
      });
      scaleNames.forEach((_: string, index: number) => {
        formatted[`scale_${index}`] = safeFixed(scaleValues[index], 6);
      });

      return formatted;
    });

    const linkFunction = iterationHistoryMeta?.linkFunction || "Logit";
    const lastChangeNeg2ll = safeFixed(
      iterationHistoryMeta?.lastAbsChangeMinus2LogLikelihood,
      3
    );
    const lastChangeParams = safeFixed(
      iterationHistoryMeta?.lastMaxAbsChangeParameters,
      6
    );
    const converged = Boolean(iterationHistoryMeta?.converged ?? result.converged);
    const note = `a. Link function: ${linkFunction}.\n`
      + `b. The parameter estimates ${converged ? "converged" : "did not converge"}. `
      + `Last absolute change in -2 Log Likelihood is ${lastChangeNeg2ll}, and last maximum absolute change in parameters is ${lastChangeParams}.`;

    console.log("[ORDINAL][FORMATTER][ITERATION_HISTORY]", {
      rows: iterationHistory.length,
      meta: iterationHistoryMeta,
    });

    allSections.push(
      createSection(
        "ordinal_iteration_history",
        "Iteration History",
        { columnHeaders, rows },
        {
          description: "Riwayat Iterasi Estimasi Parameter",
          note,
        }
      )
    );
  }

  return { sections: allSections };
};