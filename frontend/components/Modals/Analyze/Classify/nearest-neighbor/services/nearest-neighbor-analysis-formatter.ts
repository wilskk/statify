import { formatDisplayNumber } from "@/hooks/useFormatter";
import type { ResultJson, Row, Table } from "@/types/Table";

export function transformNearestNeighborResult(data: any): ResultJson {
  const tables: Table[] = [];

  if (data.system_settings) {
    tables.push(buildSystemSettings(data.system_settings));
  }

  if (data.case_processing_summary) {
    tables.push(buildCaseProcessingSummary(data.case_processing_summary));
  }

  if (data.predictor_importance) {
    tables.push(buildPredictorImportance(data.predictor_importance));
  }

  if (data.predictor_space) {
    tables.push(buildPredictorSpaceSummary(data.predictor_space));
  }

  if (data.classification_table) {
    tables.push(buildConfusionMatrix(data.classification_table));
  }

  if (data.error_summary) {
    tables.push(buildErrorSummary(data.error_summary));
  }

  return { tables };
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

function buildConfusionMatrix(table: any): Table {
  const categories = normalizeCategories(table);
  const predictedColumns = categories.map((category, index) => ({
    header: category,
    key: predictedColumnKey(index),
  }));

  return {
    key: "confusion_matrix",
    title: "Classification Tablee",
    columnHeaders: [
      { header: "Partition", key: "partition" },
      { header: "Observed", key: "observed" },
      {
        header: "Predicted",
        children: [
          ...predictedColumns,
          { header: "Percent Correct", key: "percent_correct" },
        ],
      },
    ],
    rows: [
      ...partitionRows("Training", table.training, categories),
      ...partitionRows("Holdout", table.holdout, categories),
    ],
  };
}

function buildErrorSummary(summary: any): Table {
  return {
    key: "error_summary",
    title: "Error Summary",
    columnHeaders: [
      { header: "Partition", key: "partition" },
      {
        header: "Percent of Records in Incorrectly Classified",
        key: "percent_incorrectly_classified",
      },
    ],
    rows: [
      {
        rowHeader: ["Training"],
        partition: "Training",
        percent_incorrectly_classified: optionalPercent(summary.training),
      },
      {
        rowHeader: ["Holdout"],
        partition: "Holdout",
        percent_incorrectly_classified: optionalPercent(summary.holdout),
      },
    ],
  };
}

function partitionRows(partitionName: string, partition: any, categories: string[]): Row[] {
  const categoryRows: Row[] = categories.map((category, rowIndex) => {
    const row: Row = {
      rowHeader: [partitionName, category],
      percent_correct: optionalPercent(partition?.percent_correct?.[rowIndex]),
    };

    categories.forEach((_, columnIndex) => {
      row[predictedColumnKey(columnIndex)] = String(
        formatDisplayNumber(
          Number(partition?.confusion_matrix?.[rowIndex]?.[columnIndex] ?? 0),
        ),
      );
    });

    return row;
  });

  const overallPercentRow: Row = {
    rowHeader: [partitionName, "Overall Percent"],
    percent_correct: "",
  };

  categories.forEach((_, index) => {
    overallPercentRow[predictedColumnKey(index)] = optionalPercent(
      partition?.overall_percent?.[index],
    );
  });

  return [...categoryRows, overallPercentRow];
}

function normalizeCategories(table: any): string[] {
  const categories = Array.isArray(table?.categories) ? table.categories : [];
  const fallbackLength = Math.max(
    Number(table?.training?.observed?.length ?? 0),
    Number(table?.holdout?.observed?.length ?? 0),
  );

  const labels = categories.length
    ? categories
    : Array.from({ length: fallbackLength }, (_, index) => String(index));

  return labels.map((category: unknown) => String(category));
}

function predictedColumnKey(index: number) {
  return `predicted_${index}`;
}

function percent(numerator: number, denominator: number) {
  if (denominator <= 0) return "";
  return `${formatDisplayNumber((numerator / denominator) * 100)}%`;
}

function optionalNumber(value: any) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "";
  return formatDisplayNumber(Number(value));
}

function optionalPercent(value: any) {
  const formatted = optionalNumber(value);
  return formatted ? `${formatted}%` : "";
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

