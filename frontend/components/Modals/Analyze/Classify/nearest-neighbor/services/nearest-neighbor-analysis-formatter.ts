import { formatDisplayNumber } from "@/hooks/useFormatter";
import type { ResultJson, Table } from "@/types/Table";

export function transformNearestNeighborResult(data: any): ResultJson {
  const tables: Table[] = [];

  if (data.case_processing_summary) {
    tables.push(buildCaseProcessingSummary(data.case_processing_summary));
  }

  if (data.feature_selection_summary?.enabled) {
    tables.push(
      buildFeatureSelectionSummary(
        data.feature_selection_summary,
        data.feature_selection_steps,
      ),
    );
    if (data.feature_selection_steps?.length) {
      tables.push(buildFeatureSelectionSteps(data.feature_selection_steps));
    }
  }

  if (data.k_feature_selection_summary?.length) {
    tables.push(buildKFeatureSelectionSummary(data.k_feature_selection_summary));
  }

  if (data.k_selection_chart?.candidates?.length) {
    tables.push(buildKSelectionChart(data.k_selection_chart));
    tables.push(buildKSelectionErrorLog(data.k_selection_chart));
    const cvDebugTable = buildKSelectionCvDebug(data.k_selection_chart);
    if (cvDebugTable) {
      tables.push(cvDebugTable);
    }
  }

  if (data.system_settings) {
    tables.push(buildSystemSettings(data.system_settings));
  }

  if (data.predictor_importance) {
    tables.push(buildPredictorImportance(data.predictor_importance));
    tables.push(buildPredictorWeights(data.predictor_importance));
    const weightExpansionTable = buildWeightExpansionDebug(data.predictor_importance);
    if (weightExpansionTable) {
      tables.push(weightExpansionTable);
    }
    const debugTable = buildRegressionFeatureImportanceDebug(data.predictor_importance);
    if (debugTable) {
      tables.push(debugTable);
    }
    const regressionBaseTable = buildRegressionFeatureImportanceBaseDebug(data.predictor_importance);
    if (regressionBaseTable) {
      tables.push(regressionBaseTable);
    }
  }

  if (data.predictor_space) {
    tables.push(buildPredictorSpaceSummary(data.predictor_space));
  }

  if (data.prediction_results?.rows?.length) {
    tables.push(buildPredictionResults(data.prediction_results));
  }

  if (data.classification_table) {
    tables.push(buildConfusionMatrix(data.classification_table));
    tables.push(buildMetrics(data.classification_table, data.error_summary));
  }

  if (data.nearest_neighbors?.focal_neighbor_sets?.length) {
    tables.push(buildNeighborDetails(data.nearest_neighbors));
  }

  return { tables };
}

function buildFeatureSelectionSummary(summary: any, steps: any[] = []): Table {
  return {
    key: "feature_selection_summary",
    title: "Feature Selection Summary",
    columnHeaders: [
      { header: "Property", key: "property" },
      { header: "Value", key: "value" },
    ],
    rows: [
      { rowHeader: ["Method"], value: "Forward Selection" },
      {
        rowHeader: ["Forced Entry Features"],
        value: formatList(summary.forced_features),
      },
      {
        rowHeader: ["Selected Features"],
        value: formatList(summary.selected_features),
      },
      {
        rowHeader: ["Removed Features"],
        value: formatList(summary.removed_features),
      },
      {
        rowHeader: ["Stopping Criterion"],
        value: formatStoppingMethod(summary.stopping_method),
      },
      {
        rowHeader: ["Evaluation Strategy"],
        value: titleCase(summary.evaluation_strategy),
      },
      {
        rowHeader: ["Final Error"],
        value: optionalNumber(summary.final_error),
      },
      {
        rowHeader: ["Stopping Reason"],
        value: formatReason(summary.stopping_reason),
      },
      {
        rowHeader: ["Selection Steps"],
        value: formatDisplayNumber(steps.length),
      },
    ],
  };
}

function buildKFeatureSelectionSummary(summaries: any[]): Table {
  return {
    key: "k_feature_selection_summary",
    title: "K and Feature Selection Summary",
    columnHeaders: [
      { header: "K", key: "k" },
      { header: "Selected Features", key: "selected_features" },
      { header: "Error", key: "error" },
      { header: "Stopping Reason", key: "stopping_reason" },
      { header: "Selected", key: "selected" },
    ],
    rows: summaries.map((summary) => ({
      rowHeader: [String(summary.k)],
      k: summary.k,
      selected_features: formatList(summary.selected_features),
      error: optionalNumber(summary.error),
      stopping_reason: formatReason(summary.stopping_reason),
      selected: summary.selected ? "Yes" : "",
    })),
  };
}

function buildCaseProcessingSummary(summary: any): Table {
  const trainingN = Number(summary.training?.n ?? 0);
  const holdoutN = Number(summary.holdout?.n ?? 0);
  const validN = trainingN + holdoutN;
  const excludedN = Number(summary.excluded?.n ?? 0);
  const totalN = validN + excludedN;

  return {
    key: "case_processing_summary",
    title: "Case Processing Summary",
    columnHeaders: [
      { header: "", key: "group" },
      { header: "", key: "label" },
      { header: "N", key: "n" },
      { header: "Percent", key: "percent" },
    ],
    rows: [
      {
        rowHeader: ["Sample", "Training"],
        n: formatDisplayNumber(trainingN),
        percent: percent(trainingN, validN),
      },
      {
        rowHeader: ["Sample", "Holdout"],
        n: formatDisplayNumber(holdoutN),
        percent: percent(holdoutN, validN),
      },
      {
        rowHeader: ["Valid"],
        n: formatDisplayNumber(validN),
        percent: "100.0%",
      },
      {
        rowHeader: ["Excluded"],
        n: formatDisplayNumber(excludedN),
        percent: totalN > 0 ? percent(excludedN, totalN) : "",
      },
      {
        rowHeader: ["Total"],
        n: formatDisplayNumber(totalN),
        percent: "",
      },
    ],
  };
}

function buildKSelectionChart(chart: any): Table {
  return {
    key: "k_selection_chart",
    title: "K Selection Chart",
    columnHeaders: [
      { header: "K", key: "k" },
      { header: "Average Error", key: "average_error" },
      { header: "Fold Errors", key: "fold_errors" },
      { header: "Fold N", key: "fold_n" },
      { header: "Fold Total Error", key: "fold_total_errors" },
      { header: "Selected", key: "selected" },
    ],
    rows: chart.candidates.map((candidate: any) => ({
      rowHeader: [String(candidate.k)],
      k: candidate.k,
      average_error: formatDisplayNumber(candidate.average_error),
      fold_errors: formatNumericList(candidate.fold_errors ?? candidate.foldErrors),
      fold_n: formatIndexList(candidate.fold_n ?? candidate.foldN),
      fold_total_errors: formatNumericList(
        candidate.fold_total_errors ?? candidate.foldTotalErrors,
      ),
      selected: candidate.selected ? "Yes" : "",
    })),
    note: `Metric: ${chart.metric_name ?? "validation_error"}; selected K = ${chart.selected_k}; best error = ${optionalNumber(chart.best_error ?? chart.bestError)}`,
  };
}

function buildKSelectionErrorLog(chart: any): Table {
  const rows = [];

  for (const candidate of chart.candidates ?? []) {
    const foldErrors = candidate.fold_errors ?? candidate.foldErrors ?? [];
    const foldN = candidate.fold_n ?? candidate.foldN ?? [];
    const foldTotalErrors =
      candidate.fold_total_errors ?? candidate.foldTotalErrors ?? [];

    for (let foldIndex = 0; foldIndex < foldErrors.length; foldIndex += 1) {
      rows.push({
        rowHeader: [String(candidate.k), String(foldIndex + 1)],
        k: candidate.k,
        fold: foldIndex + 1,
        fold_n: formatDisplayNumber(Number(foldN[foldIndex] ?? 0)),
        fold_error: optionalNumber(foldErrors[foldIndex]),
        fold_total_error: optionalNumber(foldTotalErrors[foldIndex]),
        average_error: optionalNumber(
          candidate.average_error ?? candidate.averageError,
        ),
        selected: candidate.selected ? "Yes" : "",
      });
    }
  }

  return {
    key: "k_selection_error_log",
    title: "K Selection Error Log",
    columnHeaders: [
      { header: "K", key: "k" },
      { header: "Fold", key: "fold" },
      { header: "Fold N", key: "fold_n" },
      { header: "Fold Error", key: "fold_error" },
      { header: "Fold Total Error", key: "fold_total_error" },
      { header: "Average Error", key: "average_error" },
      { header: "Selected", key: "selected" },
    ],
    rows,
    note: `Metric: ${chart.metric_name ?? "validation_error"}; selected K = ${chart.selected_k}; best error = ${optionalNumber(chart.best_error ?? chart.bestError)}`,
  };
}

function buildFeatureSelectionSteps(steps: any[]): Table {
  return {
    key: "feature_selection_steps",
    title: "Feature Selection Steps",
    columnHeaders: [
      { header: "Step", key: "step_number" },
      { header: "Selected Feature", key: "selected_feature" },
      { header: "Trial Error", key: "trial_error" },
      { header: "Improvement", key: "improvement" },
      { header: "Selected Features After Step", key: "selected_features_after_step" },
    ],
    rows: steps.map((step: any) => ({
      rowHeader: [String(step.step_number ?? "")],
      step_number: formatDisplayNumber(step.step_number),
      selected_feature: step.selected_feature ?? "",
      trial_error: optionalNumber(step.trial_error),
      improvement: optionalNumber(step.improvement),
      selected_features_after_step: formatList(step.selected_features_after_step),
    })),
    note: "Each step is evaluated on the training set only using the current selected subset plus one candidate feature.",
  };
}

function buildKSelectionCvDebug(chart: any): Table | null {
  const rows = [];

  for (const candidate of chart.candidates ?? []) {
    const foldDebug = candidate.cv_fold_debug ?? candidate.cvFoldDebug ?? [];

    for (const fold of foldDebug) {
      const validationCases =
        fold.validation_cases ?? fold.validationCases ?? [];

      for (const validationCase of validationCases) {
        rows.push({
          rowHeader: [
            String(candidate.k),
            String(fold.validation_fold_id ?? fold.validationFoldId ?? ""),
            String(
              validationCase.validation_case_id ??
                validationCase.validationCaseId ??
                "",
            ),
          ],
          k: candidate.k,
          validation_fold_id: fold.validation_fold_id ?? fold.validationFoldId,
          validation_case_ids: formatIndexList(
            fold.validation_case_ids ?? fold.validationCaseIds,
          ),
          cv_training_case_ids: formatIndexList(
            fold.cv_training_case_ids ?? fold.cvTrainingCaseIds,
          ),
          validation_case_id:
            validationCase.validation_case_id ??
            validationCase.validationCaseId,
          neighbor_candidate_ids: formatIndexList(
            validationCase.neighbor_candidate_ids ??
              validationCase.neighborCandidateIds,
          ),
          nearest_neighbor_ids: formatIndexList(
            validationCase.nearest_neighbor_ids ??
              validationCase.nearestNeighborIds,
          ),
          has_same_fold_neighbor: (
            validationCase.has_same_fold_neighbor ??
            validationCase.hasSameFoldNeighbor
          )
            ? "Yes"
            : "No",
          same_fold_neighbor_ids: formatIndexList(
            validationCase.same_fold_neighbor_ids ??
              validationCase.sameFoldNeighborIds,
          ),
        });
      }
    }
  }

  if (!rows.length) {
    return null;
  }

  return {
    key: "k_selection_cv_debug",
    title: "K Selection Cross-Validation Debug",
    columnHeaders: [
      { header: "K", key: "k" },
      { header: "Validation Fold", key: "validation_fold_id" },
      { header: "Validation Fold Case IDs", key: "validation_case_ids" },
      { header: "CV Training Case IDs", key: "cv_training_case_ids" },
      { header: "Validation Case ID", key: "validation_case_id" },
      { header: "Neighbor Candidate IDs", key: "neighbor_candidate_ids" },
      { header: "Nearest Neighbor IDs", key: "nearest_neighbor_ids" },
      { header: "Same-Fold Neighbor?", key: "has_same_fold_neighbor" },
      { header: "Same-Fold Neighbor IDs", key: "same_fold_neighbor_ids" },
    ],
    rows,
    note: "Candidate neighbors must come only from folds other than the validation fold.",
  };
}

function buildSystemSettings(settings: any): Table {
  return {
    key: "system_settings",
    title: "System Settings",
    columnHeaders: [
      { header: "Setting", key: "setting" },
      { header: "Value", key: "value" },
      { header: "Description", key: "description" },
    ],
    rows: settings.rng
      ? [
          {
            rowHeader: [settings.rng.keyword ?? "RNG"],
            setting: settings.rng.keyword ?? "RNG",
            value: settings.rng.setting ?? "",
            description: settings.rng.description ?? "",
          },
        ]
      : [],
  };
}

function buildPredictorImportance(importance: any): Table {
  const entries = Array.isArray(importance.entries) && importance.entries.length
    ? importance.entries
    : normalizePredictorImportanceEntries(importance.predictors);

  return {
    key: "predictor_importance",
    title: "Feature Importance",
    columnHeaders: [
      { header: "Rank", key: "rank" },
      { header: "Feature", key: "predictor" },
      { header: "Base Error", key: "base_error" },
      { header: "Error Without Feature", key: "error_without_feature" },
      { header: "Delta Error", key: "delta_error" },
      { header: "Raw Feature Importance", key: "raw_feature_importance" },
      { header: "Normalized Importance", key: "importance" },
    ],
    rows: entries.map((entry: any, index: number) => ({
      rowHeader: [String(entry.featureName ?? entry.feature_name ?? entry.name ?? index + 1)],
      rank: formatDisplayNumber(entry.rank ?? index + 1),
      predictor: entry.featureName ?? entry.feature_name ?? entry.name ?? "",
      base_error: optionalNumber(entry.baseError ?? entry.base_error),
      error_without_feature: optionalNumber(entry.errorWithoutFeature ?? entry.error_without_feature),
      delta_error: optionalNumber(entry.deltaError ?? entry.delta_error),
      raw_feature_importance: optionalNumber(
        entry.rawFeatureImportance ?? entry.raw_feature_importance ?? entry.rawImportance ?? entry.raw_importance,
      ),
      importance: optionalNumber(entry.normalizedImportance ?? entry.normalized_importance ?? entry.value),
    })),
    note: `Target: ${importance.target ?? ""}; K = ${importance.k ?? ""}`,
  };
}

function buildPredictorWeights(importance: any): Table {
  const entries = Array.isArray(importance.entries) && importance.entries.length
    ? importance.entries
    : normalizePredictorImportanceEntries(importance.predictors);

  return {
    key: "predictor_weights",
    title: "Predictor Weights",
    columnHeaders: [
      { header: "Rank", key: "rank" },
      { header: "Predictor", key: "predictor" },
      { header: "Weight", key: "weight" },
    ],
    rows: entries.map((entry: any, index: number) => ({
      rowHeader: [String(entry.featureName ?? entry.feature_name ?? entry.name ?? index + 1)],
      rank: formatDisplayNumber(entry.rank ?? index + 1),
      predictor: entry.featureName ?? entry.feature_name ?? entry.name ?? "",
      weight: optionalNumber(entry.normalizedImportance ?? entry.normalized_importance ?? entry.value),
    })),
    note: "Weights are normalized predictor-level feature importance values used in weighted distance.",
  };
}

function buildWeightExpansionDebug(importance: any): Table | null {
  const rows = [];
  const debugEntries = importance.weightExpansionDebug ?? importance.weight_expansion_debug ?? [];

  for (const entry of debugEntries) {
    rows.push({
      rowHeader: [String(entry.predictor ?? "")],
      predictor: entry.predictor ?? "",
      normalized_predictor_weight: optionalNumber(
        entry.normalizedPredictorWeight ?? entry.normalized_predictor_weight,
      ),
      encoded_columns: formatList(entry.encodedColumns ?? entry.encoded_columns),
      encoded_column_weights: formatFeatureWeights(
        entry.encodedColumnWeights ?? entry.encoded_column_weights,
      ),
    });
  }

  const finalVector = importance.finalExpandedFeatureWeights ?? importance.final_expanded_feature_weights ?? [];
  if (Array.isArray(finalVector) && finalVector.length) {
    rows.push({
      rowHeader: ["Final Expanded Vector"],
      predictor: "Final Expanded Vector",
      normalized_predictor_weight: "",
      encoded_columns: finalVector.map((entry: any) => entry.feature ?? entry.name ?? "").join(", "),
      encoded_column_weights: formatFeatureWeights(finalVector),
    });
  }

  if (!rows.length) {
    return null;
  }

  return {
    key: "weight_expansion_debug",
    title: "Weight Expansion Debug",
    columnHeaders: [
      { header: "Original Predictor", key: "predictor" },
      { header: "Normalized Predictor Weight", key: "normalized_predictor_weight" },
      { header: "Encoded Columns", key: "encoded_columns" },
      { header: "Encoded Column Weights", key: "encoded_column_weights" },
    ],
    rows,
    note: "Normalized predictor importance is expanded to encoded columns without re-normalizing or splitting categorical predictor weights.",
  };
}

function buildRegressionFeatureImportanceDebug(importance: any): Table | null {
  const entries = Array.isArray(importance.entries) ? importance.entries : [];
  const debugEntries = entries.filter((entry: any) =>
    Array.isArray(entry.removeIndices ?? entry.remove_indices) ||
    Array.isArray(entry.remainingIndices ?? entry.remaining_indices)
  );

  if (!debugEntries.length) {
    return null;
  }

  return {
    key: "feature_importance_leave_one_predictor_debug",
    title: "Feature Importance Leave-One-Predictor Debug",
    columnHeaders: [
      { header: "Predictor", key: "predictor" },
      { header: "Remove Indices", key: "remove_indices" },
      { header: "Remaining Indices", key: "remaining_indices" },
      { header: "Base Error", key: "base_error" },
      { header: "Error Without Predictor", key: "error_without_p" },
      { header: "Error Ratio", key: "error_ratio" },
      { header: "FI", key: "fi" },
      { header: "Normalized Weight", key: "normalized_weight" },
    ],
    rows: debugEntries.map((entry: any, index: number) => ({
      rowHeader: [String(entry.featureName ?? entry.feature_name ?? entry.name ?? index + 1)],
      predictor: entry.featureName ?? entry.feature_name ?? entry.name ?? "",
      remove_indices: formatIndexList(entry.removeIndices ?? entry.remove_indices),
      remaining_indices: formatIndexList(entry.remainingIndices ?? entry.remaining_indices),
      base_error: optionalNumber(entry.baseError ?? entry.base_error),
      error_without_p: optionalNumber(entry.errorWithoutFeature ?? entry.error_without_feature),
      error_ratio: optionalNumber(entry.errorRatio ?? entry.error_ratio),
      fi: optionalNumber(
        entry.rawFeatureImportance ?? entry.raw_feature_importance ?? entry.rawImportance ?? entry.raw_importance,
      ),
      normalized_weight: optionalNumber(entry.normalizedImportance ?? entry.normalized_importance ?? entry.value),
    })),
    note: "Debug values for weighted feature importance. Indices refer to final encoded model feature columns; remaining indices are the predictors kept for the without-p run.",
  };
}

function buildRegressionFeatureImportanceBaseDebug(importance: any): Table | null {
  const rows = importance.regressionBasePredictionDebug
    ?? importance.regression_base_prediction_debug
    ?? [];

  if (!Array.isArray(rows) || !rows.length) {
    return null;
  }

  return {
    key: "regression_feature_importance_base_prediction_debug",
    title: "Regression FI Base Prediction Debug",
    columnHeaders: [
      { header: "Case ID", key: "case_id" },
      { header: "Actual Y", key: "actual_y" },
      { header: "Yhat Unweighted Normal", key: "yhat_unweighted_normal" },
      { header: "Yhat FI Base", key: "yhat_feature_importance_base" },
      { header: "Squared Error", key: "squared_error" },
    ],
    rows: rows.map((row: any, index: number) => ({
      rowHeader: [String(row.caseId ?? row.case_id ?? index + 1)],
      case_id: row.caseId ?? row.case_id ?? "",
      actual_y: optionalNumber(row.actualY ?? row.actual_y),
      yhat_unweighted_normal: optionalNumber(
        row.yhatUnweightedNormal ?? row.yhat_unweighted_normal,
      ),
      yhat_feature_importance_base: optionalNumber(
        row.yhatFeatureImportanceBase ?? row.yhat_feature_importance_base,
      ),
      squared_error: optionalNumber(row.squaredError ?? row.squared_error),
    })),
    note: "Unweighted normal and feature-importance base predictions are both computed with unit feature weights before predictor weights are normalized.",
  };
}

function buildPredictorSpaceSummary(space: any): Table {
  const dimension = space.dimensions?.[0];
  return {
    key: "predictor_space",
    title: "Predictor Space",
    columnHeaders: [
      { header: "Property", key: "property" },
      { header: "Value", key: "value" },
    ],
    rows: [
      { rowHeader: ["K"], value: formatDisplayNumber(space.k_value) },
      {
        rowHeader: ["Model Predictors"],
        value: formatDisplayNumber(space.model_predictors),
      },
      {
        rowHeader: ["Actual Predictors"],
        value: formatDisplayNumber(space.actual_predictors ?? space.model_predictors),
      },
      { rowHeader: ["Displayed Space"], value: dimension?.name ?? "" },
      {
        rowHeader: ["Cases Plotted"],
        value: formatDisplayNumber(dimension?.points?.length ?? 0),
      },
    ],
    note: "Rendered as a scatter plot in the output viewer.",
  };
}

function buildPredictionResults(results: any): Table {
  const categorical = results.target_type === "categorical";
  return {
    key: "prediction_results",
    title: categorical ? "Classification Result" : "Prediction Result",
    columnHeaders: categorical
      ? [
          { header: "Case ID", key: "case_id" },
          { header: "Sample", key: "sample_type" },
          { header: "Actual", key: "actual" },
          { header: "Predicted", key: "predicted" },
          { header: "Correct?", key: "correct" },
          { header: "Probability", key: "probability" },
        ]
      : [
          { header: "Case ID", key: "case_id" },
          { header: "Sample", key: "sample_type" },
          { header: "Actual", key: "actual" },
          { header: "Predicted", key: "predicted" },
          { header: "Error", key: "error" },
          { header: "Squared Error", key: "squared_error" },
        ],
    rows: results.rows.map((row: any) => ({
      rowHeader: [String(row.case_id ?? row.row_index)],
      case_id: String(row.case_id ?? row.row_index),
      sample_type: row.sample_type,
      actual: formatValue(row.actual),
      predicted: formatValue(row.predicted),
      correct: row.correct === undefined || row.correct === null ? "" : row.correct ? "Yes" : "No",
      probability: optionalNumber(row.probability_predicted_class),
      error: optionalNumber(row.error),
      squared_error: optionalNumber(row.squared_error),
    })),
  };
}

function buildConfusionMatrix(table: any): Table {
  return {
    key: "confusion_matrix",
    title: "Confusion Matrix",
    columnHeaders: [
      { header: "Sample", key: "sample" },
      { header: "Class", key: "class" },
      { header: "Observed", key: "observed" },
      { header: "Predicted", key: "predicted" },
      { header: "Percent Correct", key: "percent_correct" },
    ],
    rows: [
      ...partitionRows("Training", table.training),
      ...partitionRows("Holdout", table.holdout),
    ],
  };
}

function buildMetrics(table: any, errorSummary: any): Table {
  const trainingTotal = sum(table.training?.observed);
  const holdoutTotal = sum(table.holdout?.observed);
  const trainingAccuracy = accuracy(table.training);
  const holdoutAccuracy = accuracy(table.holdout);

  return {
    key: "metrics",
    title: "Metrics",
    columnHeaders: [
      { header: "Sample", key: "sample" },
      { header: "N", key: "n" },
      { header: "Accuracy", key: "accuracy" },
      { header: "Error Rate", key: "error_rate" },
    ],
    rows: [
      {
        rowHeader: ["Training"],
        n: formatDisplayNumber(trainingTotal),
        accuracy: optionalNumber(trainingAccuracy),
        error_rate: optionalNumber(errorSummary?.training ?? invert(trainingAccuracy)),
      },
      {
        rowHeader: ["Holdout"],
        n: formatDisplayNumber(holdoutTotal),
        accuracy: optionalNumber(holdoutAccuracy),
        error_rate: optionalNumber(errorSummary?.holdout ?? invert(holdoutAccuracy)),
      },
    ],
  };
}

function buildNeighborDetails(nearest: any): Table {
  const rows = nearest.focal_neighbor_sets.flatMap((set: any) =>
    (set.neighbors ?? []).map((neighbor: any, index: number) => ({
      rowHeader: [String(set.focal_row_number ?? set.focal_record), String(index + 1)],
      query_case: String(set.focal_row_number ?? set.focal_record),
      neighbor_rank: formatDisplayNumber(index + 1),
      neighbor_case: String(neighbor.row_number ?? neighbor.id ?? ""),
      distance: optionalNumber(set.distances?.[index] ?? neighbor.distance),
    })),
  );

  return {
    key: "neighbor_details",
    title: "Neighbor Detail",
    columnHeaders: [
      { header: "Query Case", key: "query_case" },
      { header: "Neighbor Rank", key: "neighbor_rank" },
      { header: "Neighbor Case", key: "neighbor_case" },
      { header: "Distance", key: "distance" },
    ],
    rows,
  };
}

function partitionRows(sample: string, partition: any) {
  return (partition?.observed ?? []).map((observed: number, index: number) => ({
    rowHeader: [sample, String(index)],
    sample,
    class: String(index),
    observed: formatDisplayNumber(observed),
    predicted: formatDisplayNumber(partition.predicted?.[index] ?? 0),
    percent_correct: optionalNumber(partition.percent_correct?.[index]),
  }));
}

function accuracy(partition: any): number | null {
  const observed = partition?.observed ?? [];
  const percentCorrect = partition?.percent_correct ?? [];
  const total = sum(observed);
  if (total <= 0) return null;

  const correct = observed.reduce(
    (acc: number, count: number, index: number) =>
      acc + (count * Number(percentCorrect[index] ?? 0)) / 100,
    0,
  );
  return (correct / total) * 100;
}

function invert(value: number | null) {
  return value === null ? null : 100 - value;
}

function sum(values: any[] = []) {
  return values.reduce((acc, value) => acc + Number(value ?? 0), 0);
}

function percent(numerator: number, denominator: number) {
  if (denominator <= 0) return "";
  return `${formatDisplayNumber((numerator / denominator) * 100)}%`;
}

function optionalNumber(value: any) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "";
  return formatDisplayNumber(Number(value));
}

function formatValue(value: any) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return formatDisplayNumber(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if ("Number" in value) return formatDisplayNumber(value.Number);
    if ("Text" in value) return String(value.Text);
    if ("Boolean" in value) return value.Boolean ? "true" : "false";
  }
  return String(value);
}

function normalizePredictorImportanceEntries(predictors: any) {
  const rows = Array.isArray(predictors)
    ? predictors.map((entry: any) => ({
        name: entry.name,
        value: entry.value,
      }))
    : Object.entries(predictors ?? {}).map(([name, value]) => ({ name, value }));

  return rows
    .sort((left: any, right: any) => Number(right.value ?? 0) - Number(left.value ?? 0))
    .map((entry: any, index: number) => ({
      ...entry,
      rank: index + 1,
      normalizedImportance: Number(entry.value ?? 0),
    }));
}

function formatList(values: any[] | undefined) {
  if (!values?.length) return "(none)";
  return values.join(", ");
}

function formatIndexList(values: any[] | undefined) {
  if (!Array.isArray(values) || !values.length) return "(none)";
  return values.map((value) => String(value)).join(", ");
}

function formatNumericList(values: any[] | undefined) {
  if (!Array.isArray(values) || !values.length) return "(none)";
  return values.map((value) => optionalNumber(value)).join(", ");
}

function formatFeatureWeights(weights: any[] | undefined) {
  if (!Array.isArray(weights) || !weights.length) return "(none)";
  return weights
    .map((entry) => {
      const feature = entry.feature ?? entry.name ?? "";
      const weight = entry.weight ?? entry.value;
      return `${feature}=${optionalNumber(weight)}`;
    })
    .join(", ");
}

function formatStoppingMethod(value: string | undefined) {
  if (value === "fixed_number") return "Fixed Number";
  if (value === "minimum_change") return "Minimum Change";
  return titleCase(value);
}

function formatReason(value: string | undefined) {
  return titleCase(value?.replace(/_/g, " "));
}

function titleCase(value: string | undefined) {
  if (!value) return "";
  return value.replace(/\w\S*/g, (word) => (
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ));
}
