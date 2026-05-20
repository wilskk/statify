// nearest-neighbor-analysis-output.ts
import type { KNNFinalResultType } from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor-worker";
import type { Table } from "@/types/Table";
import { useResultStore } from "@/stores/useResultStore";
import { ChartService } from "@/services/chart/ChartService";

export async function resultNearestNeighbor({
  formattedResult,
  rawResult,
}: KNNFinalResultType) {
  try {
    const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

    const findTable = (key: string) => {
      const foundTable = formattedResult.tables.find(
        (table: Table) => table.key === key,
      );
      return foundTable ? JSON.stringify({ tables: [foundTable] }) : null;
    };
    const findTableObject = (key: string) =>
      formattedResult.tables.find((table: Table) => table.key === key);

    const nearestNeighborAnalysisResult = async () => {
      const titleMessage = "Nearest Neighbor Analysis";
      const logId = await addLog({ log: titleMessage });

      await addAnalytic(logId, {
        title: `Nearest Neighbor Analysis Result`,
        note: "",
      });

      const systemSettings = findTable("system_settings");
      if (systemSettings) {
        const systemSettingsId = await addAnalytic(logId, {
          title: `System Settings`,
          note: "",
        });

        await addStatistic(systemSettingsId, {
          title: `System Settings`,
          description: `System Settings`,
          output_data: systemSettings,
          components: `System Settings`,
        });
      }

      const caseProcessingSummary = findTable("case_processing_summary");
      if (caseProcessingSummary) {
        const caseProcessingSummaryId = await addAnalytic(logId, {
          title: `Case Processing Summary`,
          note: "",
        });

        await addStatistic(caseProcessingSummaryId, {
          title: `Case Processing Summary`,
          description: `Case Processing Summary`,
          output_data: caseProcessingSummary,
          components: `Case Processing Summary`,
        });
      }

      const kAndPredictorSelectionChart = createKAndPredictorSelectionChart(rawResult);
      if (kAndPredictorSelectionChart) {
        const kAndPredictorSelectionId = await addAnalytic(logId, {
          title: `k and Predictor Selection`,
          note: "",
        });

        await addStatistic(kAndPredictorSelectionId, {
          title: `k and Predictor Selection`,
          description: `k and Predictor Selection`,
          output_data: JSON.stringify(kAndPredictorSelectionChart),
          components: `k and Predictor Selection`,
        });
      }

      const kSelectionErrorLogLineChart = createKSelectionErrorLogLineChart(
        rawResult?.k_selection_chart,
      );
      if (kSelectionErrorLogLineChart) {
        const kSelectionErrorLogId = await addAnalytic(logId, {
          title: `k Selection Error Log`,
          note: "",
        });

        await addStatistic(kSelectionErrorLogId, {
          title: `k Selection Error Log`,
          description: `k Selection Error Log`,
          output_data: JSON.stringify(kSelectionErrorLogLineChart),
          components: `k Selection Error Log`,
        });
      }

      const predictorImportance = findTable("predictor_importance");
      if (predictorImportance) {
        const predictorImportanceId = await addAnalytic(logId, {
          title: `Predictor Importance`,
          note: "",
        });

        await addStatistic(predictorImportanceId, {
          title: `Predictor Importance`,
          description: `Predictor Importance`,
          output_data: predictorImportance,
          components: `Predictor Importance`,
        });

        const predictorImportanceChart = createPredictorImportanceChart(
          findTableObject("predictor_importance"),
        );

        if (predictorImportanceChart) {
          await addStatistic(predictorImportanceId, {
            title: `Predictor Importance Chart`,
            description: `Predictor Importance Chart`,
            output_data: JSON.stringify(predictorImportanceChart),
            components: `Predictor Importance Chart`,
          });
        }
      }

      const confusionMatrix = findTable("confusion_matrix");
      if (confusionMatrix) {
        const confusionMatrixId = await addAnalytic(logId, {
          title: `Classification Table`,
          note: "",
        });

        await addStatistic(confusionMatrixId, {
          title: `Classification Tablee`,
          description: `Classification Tablee`,
          output_data: confusionMatrix,
          components: `Classification Tablee`,
        });
      }

      const errorSummary = findTable("error_summary");
      if (errorSummary) {
        const errorSummaryId = await addAnalytic(logId, {
          title: `Error Summary`,
          note: "",
        });

        await addStatistic(errorSummaryId, {
          title: `Error Summary`,
          description: `Error Summary`,
          output_data: errorSummary,
          components: `Error Summary`,
        });
      }

      const predictorSpace = findTable("predictor_space");
      if (predictorSpace) {
        const predictorSpaceId = await addAnalytic(logId, {
          title: `Predictor Space`,
          note: "",
        });

        await addStatistic(predictorSpaceId, {
          title: `Predictor Space`,
          description: `Predictor Space`,
          output_data: predictorSpace,
          components: `Predictor Space`,
        });

        const predictorSpaceChart = createPredictorSpaceChart(rawResult?.predictor_space);

        if (predictorSpaceChart) {
          await addStatistic(predictorSpaceId, {
            title: `Predictor Space Chart`,
            description: `Predictor Space Chart`,
            output_data: JSON.stringify(predictorSpaceChart),
            components: `Predictor Space Chart`,
          });
        }
      }
    };
    await nearestNeighborAnalysisResult();
  } catch (e) {
    console.error(e);
  }
}

function createPredictorSpaceChart(predictorSpace?: any) {
  const dimension = predictorSpace?.dimensions?.find(
    (item: any) => Array.isArray(item.points) && item.points.length > 0,
  );

  if (!dimension) return null;

  const labels = splitDimensionName(dimension.name);
  const axes = Array.isArray(dimension.axes) ? dimension.axes : [];
  const displayedAxisCount = axes.length > 0 ? axes.length : labels.length;
  const displayedDimensions = Math.max(1, Math.min(3, displayedAxisCount));
  const hasZ =
    displayedDimensions >= 3 &&
    Boolean(labels[2]) &&
    dimension.points.some((point: any) => Number.isFinite(Number(point.z)));
  const chartData = dimension.points
    .map((point: any) => ({
      id: point.id,
      label: point.label ?? point.id,
      x: Number(point.x),
      y: Number(point.y),
      z: Number(point.z),
      type: point.point_type,
      target: point.target_label || String(point.target_value),
      targetNumber: Number.isFinite(Number(point.target_number))
        ? Number(point.target_number)
        : null,
      observed: point.target_label || String(point.target_value),
      focal: Boolean(point.focal),
      neighbors: Array.isArray(point.neighbors) ? point.neighbors : [],
    }))
    .filter((point: any) => Number.isFinite(point.x) && Number.isFinite(point.y));

  if (!chartData.length) return null;

  return {
    charts: [
      {
        chartType: "KNN Predictor Space",
        chartMetadata: {
          axisInfo: {},
          title: "Predictor Space",
          subtitle: `Built Model: ${predictorSpace.model_predictors ?? chartData.length} selected predictors, K = ${predictorSpace.k_value ?? ""}`,
          description: "Select points to use as focal records",
          titleFontSize: 16,
          subtitleFontSize: 12,
        },
        chartData,
        chartConfig: {
          width: 900,
          height: 640,
          chartColor: [],
          useAxis: true,
          useLegend: true,
          axisLabels: {
            x: labels[0] ?? "X",
            y: labels[1] ?? "Y",
            z: hasZ ? labels[2] : "",
          },
          axisInfo: {
            x: axes[0] ?? { name: labels[0] ?? "X", measure: "", categories: [], ticks: [] },
            y: axes[1] ?? { name: labels[1] ?? "Y", measure: "", categories: [], ticks: [] },
            z: hasZ
              ? axes[2] ?? { name: labels[2] ?? "Z", measure: "", categories: [], ticks: [] }
              : undefined,
          },
          predictorSpace: {
            selectedK: Number(predictorSpace.k_value ?? 1),
            modelPredictors: Number(predictorSpace.model_predictors ?? 0),
            actualPredictors: Number(
              predictorSpace.actual_predictors ?? predictorSpace.model_predictors ?? 0,
            ),
            targetVariable: predictorSpace.target_variable ?? "Target",
            targetMeasure: predictorSpace.target_measure ?? "",
            hasFocalCaseIdentifier: Boolean(predictorSpace.has_focal_case_identifier),
            displayedDimensions,
            instruction: "Select points to use as focal records",
          },
        },
      },
    ],
  };
}

function createKSelectionErrorLogLineChart(chart?: any) {
  const chartData = (chart?.candidates ?? [])
    .map((candidate: any) => ({
      category: String(candidate.k),
      value: Number(candidate.average_error ?? candidate.averageError),
    }))
    .filter((candidate: any) => (
      candidate.category && Number.isFinite(candidate.value)
    ));

  if (!chartData.length) return null;

  return ChartService.createChartJSON({
    chartType: "Line Chart",
    chartData,
    chartVariables: { x: ["K"], y: ["Error Rate"] },
    chartMetadata: {
      title: "k Selection Error Log",
      description: "Cross-validation error rate by number of neighbors",
    },
    chartConfig: {
      axisLabels: {
        x: "K",
        y: "Error Rate",
      },
      showValueTooltip: true,
      useLegend: false,
    },
  });
}

function createPredictorImportanceChart(table?: Table) {
  const chartData = table?.rows
    .map((row) => ({
      category: String(row.predictor ?? row.rowHeader?.[0] ?? ""),
      value: toNumber(row.importance),
    }))
    .filter((row) => row.category && Number.isFinite(row.value));

  if (!chartData?.length) return null;

  return ChartService.createChartJSON({
    chartType: "Horizontal Bar Chart",
    chartData,
    chartVariables: { x: ["Importance"], y: ["Predictor"] },
    chartMetadata: {
      title: "Predictor Importance",
      description: "Relative importance of each predictor in the KNN model",
    },
    chartConfig: {
      axisLabels: {
        x: "Importance",
        y: "Predictor",
      },
      axisScaleOptions: {
        x: {
          min: "0",
          max: "1",
          majorIncrement: "0.2",
        },
      },
      showValueTooltip: true,
      useLegend: false,
    },
  });
}

function createKAndPredictorSelectionChart(rawResult?: any) {
  const steps = rawResult?.feature_selection_steps;

  if (!Array.isArray(steps) || !steps.length) return null;

  const chartData = steps
    .map((step: any) => ({
      category:
        step.selected_feature ??
        step.selectedFeature ??
        `Step ${step.step_number ?? step.stepNumber ?? ""}`,
      value: toNumber(step.trial_error ?? step.trialError),
    }))
    .filter((row: any) => row.category && Number.isFinite(row.value));

  if (!chartData.length) return null;

  const selectedK = (rawResult?.k_feature_selection_summary ?? []).find(
    (summary: any) => summary.selected,
  )?.k;

  if (selectedK === null || selectedK === undefined) return null;

  return ChartService.createChartJSON({
    chartType: "Line Chart",
    chartData,
    chartVariables: { x: ["Selected Predictor"], y: ["Error"] },
    chartMetadata: {
      title: "k and Predictor Selection",
      subtitle: `k = ${selectedK}`,
      description: "Feature selection error by selected predictor",
    },
    chartConfig: {
      axisLabels: {
        x: "Selected Predictor",
        y: "Error",
      },
      showValueTooltip: true,
      useLegend: false,
    },
  });
}

function splitDimensionName(name: string | undefined) {
  return String(name ?? "X vs Y").split(" vs ").filter(Boolean);
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return Number.NaN;

  return Number(value.replace(/,/g, "").replace("%", ""));
}
