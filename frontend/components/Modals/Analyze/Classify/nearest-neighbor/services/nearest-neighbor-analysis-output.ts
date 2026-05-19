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
      /*
       * 🎉 Title Result 🎉
       * */
      const titleMessage = "Nearest Neighbor Analysis";
      const logId = await addLog({ log: titleMessage });
      await addAnalytic(logId, {
        title: `Nearest Neighbor Analysis Result`,
        note: "",
      });

      /*
       * 📊 Case Processing Summary Result 📊
       * */
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

      /*
       * ⚙️ System Settings Result ⚙️
       * */
      const featureSelectionSummary = findTable("feature_selection_summary");
      if (featureSelectionSummary) {
        const featureSelectionSummaryId = await addAnalytic(logId, {
          title: `Feature Selection Summary`,
          note: "",
        });

        await addStatistic(featureSelectionSummaryId, {
          title: `Feature Selection Summary`,
          description: `Feature Selection Summary`,
          output_data: featureSelectionSummary,
          components: `Feature Selection Summary`,
        });

        const featureSelectionSteps = findTable("feature_selection_steps");
        if (featureSelectionSteps) {
          await addStatistic(featureSelectionSummaryId, {
            title: `Feature Selection Steps`,
            description: `Feature Selection Steps`,
            output_data: featureSelectionSteps,
            components: `Feature Selection Steps`,
          });
        }
      }

      const kFeatureSelectionSummary = findTable("k_feature_selection_summary");
      if (kFeatureSelectionSummary) {
        const kFeatureSelectionSummaryId = await addAnalytic(logId, {
          title: `K and Feature Selection Summary`,
          note: "",
        });

        await addStatistic(kFeatureSelectionSummaryId, {
          title: `K and Feature Selection Summary`,
          description: `K and Feature Selection Summary`,
          output_data: kFeatureSelectionSummary,
          components: `K and Feature Selection Summary`,
        });
      }

      const kSelectionChart = findTable("k_selection_chart");
      if (kSelectionChart) {
        const kSelectionChartId = await addAnalytic(logId, {
          title: `K Selection Chart`,
          note: "",
        });

        await addStatistic(kSelectionChartId, {
          title: `K Selection Chart`,
          description: `K Selection Chart`,
          output_data: kSelectionChart,
          components: `K Selection Chart`,
        });

        const kSelectionLineChart = createKSelectionChart(
          rawResult?.k_selection_chart,
        );

        if (kSelectionLineChart) {
          await addStatistic(kSelectionChartId, {
            title: `K Selection Chart Plot`,
            description: `K Selection Chart Plot`,
            output_data: JSON.stringify(kSelectionLineChart),
            components: `K Selection Chart Plot`,
          });
        }

        const kSelectionErrorLog = findTable("k_selection_error_log");
        if (kSelectionErrorLog) {
          await addStatistic(kSelectionChartId, {
            title: `K Selection Error Log`,
            description: `K Selection Error Log`,
            output_data: kSelectionErrorLog,
            components: `K Selection Error Log`,
          });
        }

        const kSelectionErrorLogChart = createKSelectionErrorLogChart(
          rawResult?.k_selection_chart,
        );

        if (kSelectionErrorLogChart) {
          await addStatistic(kSelectionChartId, {
            title: `K Selection Error Log Plot`,
            description: `K Selection Error Log Plot`,
            output_data: JSON.stringify(kSelectionErrorLogChart),
            components: `K Selection Error Log Plot`,
          });
        }

        const kSelectionCvDebug = findTable("k_selection_cv_debug");
        if (kSelectionCvDebug) {
          await addStatistic(kSelectionChartId, {
            title: `K Selection Cross-Validation Debug`,
            description: `K Selection Cross-Validation Debug`,
            output_data: kSelectionCvDebug,
            components: `K Selection Cross-Validation Debug`,
          });
        }
      }

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

      /*
       * 📈 Predictor Importance Result 📈
       * */
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

      /*
       * 🔍 Classification Table Result 🔍
       * */
      const predictorWeights = findTable("predictor_weights");
      if (predictorWeights) {
        const predictorWeightsId = await addAnalytic(logId, {
          title: `Predictor Weights`,
          note: "",
        });

        await addStatistic(predictorWeightsId, {
          title: `Predictor Weights`,
          description: `Predictor Weights`,
          output_data: predictorWeights,
          components: `Predictor Weights`,
        });
      }

      const classificationTable = findTable("classification_table");
      if (classificationTable) {
        const classificationTableId = await addAnalytic(logId, {
          title: `Classification Table`,
          note: "",
        });

        await addStatistic(classificationTableId, {
          title: `Classification Table`,
          description: `Classification Table`,
          output_data: classificationTable,
          components: `Classification Table`,
        });
      }

      /*
       * ❌ Error Summary Result ❌
       * */
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

      /*
       * 🔬 Predictor Space Result 🔬
       * */
      const predictionResults = findTable("prediction_results");
      if (predictionResults) {
        const predictionResultsId = await addAnalytic(logId, {
          title: `Classification / Prediction Result`,
          note: "",
        });

        await addStatistic(predictionResultsId, {
          title: `Classification / Prediction Result`,
          description: `Classification / Prediction Result`,
          output_data: predictionResults,
          components: `Classification / Prediction Result`,
        });
      }

      const confusionMatrix = findTable("confusion_matrix");
      const metrics = findTable("metrics");
      if (confusionMatrix || metrics) {
        const confusionMatrixId = await addAnalytic(logId, {
          title: `Confusion Matrix and Metrics`,
          note: "",
        });

        if (confusionMatrix) {
          await addStatistic(confusionMatrixId, {
            title: `Confusion Matrix`,
            description: `Confusion Matrix`,
            output_data: confusionMatrix,
            components: `Confusion Matrix`,
          });
        }

        if (metrics) {
          await addStatistic(confusionMatrixId, {
            title: `Metrics`,
            description: `Metrics`,
            output_data: metrics,
            components: `Metrics`,
          });
        }
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

      /*
       * 👥 Nearest Neighbors Result 👥
       * */
      const nearestNeighbors = findTable("neighbor_details");
      if (nearestNeighbors) {
        const nearestNeighborsId = await addAnalytic(logId, {
          title: `Neighbor Detail`,
          note: "",
        });

        await addStatistic(nearestNeighborsId, {
          title: `Neighbor Detail`,
          description: `Neighbor Detail`,
          output_data: nearestNeighbors,
          components: `Neighbor Detail`,
        });
      }

      /*
       * 📊 Peers Chart Data Result 📊
       * */
      const peersChart = findTable("peers_chart");
      if (peersChart) {
        const peersChartId = await addAnalytic(logId, {
          title: `Peers Chart Data`,
          note: "",
        });

        await addStatistic(peersChartId, {
          title: `Peers Chart Data`,
          description: `Peers Chart Data`,
          output_data: peersChart,
          components: `Peers Chart Data`,
        });

        const peerProfileChart =
          createPeerProfileChartFromRaw(rawResult?.peers_chart) ??
          createPeerProfileChart(findTableObject("peers_chart"));

        if (peerProfileChart) {
          await addStatistic(peersChartId, {
            title: `Peers Chart`,
            description: `Peers Chart`,
            output_data: JSON.stringify(peerProfileChart),
            components: `Peers Chart`,
          });
        }
      }

      /*
       * 🗺️ Quadrant Map Data Result 🗺️
       * */
      const quadrantMap = findTable("quadrant_map");
      if (quadrantMap) {
        const quadrantMapId = await addAnalytic(logId, {
          title: `Quadrant Map Data`,
          note: "",
        });

        await addStatistic(quadrantMapId, {
          title: `Quadrant Map Data`,
          description: `Quadrant Map Data`,
          output_data: quadrantMap,
          components: `Quadrant Map Data`,
        });

        const quadrantChart =
          createQuadrantMapChartFromRaw(rawResult?.quadrant_map) ??
          createQuadrantMapChart(findTableObject("quadrant_map"));

        if (quadrantChart) {
          await addStatistic(quadrantMapId, {
            title: `Quadrant Map`,
            description: `Quadrant Map`,
            output_data: JSON.stringify(quadrantChart),
            components: `Quadrant Map`,
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

function createKSelectionChart(chart?: any) {
  return createKSelectionErrorChart(chart, "K Selection Error");
}

function createKSelectionErrorLogChart(chart?: any) {
  return createKSelectionErrorChart(chart, "K Selection Error Log");
}

function createKSelectionErrorChart(chart: any, title: string) {
  const chartData = (chart?.candidates ?? [])
    .map((candidate: any) => ({
      x: Number(candidate.k),
      y: Number(candidate.average_error),
    }))
    .filter((candidate: any) => Number.isFinite(candidate.x) && Number.isFinite(candidate.y));

  if (!chartData.length) return null;

  const yLabel = isRegressionKSelectionMetric(chart?.metric_name)
    ? "Average SSE"
    : "Average Error Rate (%)";

  return ChartService.createChartJSON({
    chartType: "Line Chart",
    chartData,
    chartVariables: { x: ["Number of Neighbors (K)"], y: [yLabel] },
    chartMetadata: {
      title,
      description: "Cross-validation average error by number of neighbors",
    },
    chartConfig: {
      axisLabels: {
        x: "Number of Neighbors (K)",
        y: yLabel,
      },
      useLegend: false,
    },
  });
}

function isRegressionKSelectionMetric(metricName: unknown) {
  return String(metricName ?? "").toLowerCase().includes("sse");
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
      useLegend: false,
    },
  });
}

function createPeerProfileChart(table?: Table) {
  const chartData = table?.rows
    .map((row) => ({
      x: toNumber(row.record_id ?? row.rowHeader?.[1]),
      y: toNumber(row.value),
      category: String(row.feature ?? row.rowHeader?.[0] ?? ""),
    }))
    .filter((row) => Number.isFinite(row.x) && Number.isFinite(row.y) && row.category);

  if (!chartData?.length) return null;

  return ChartService.createChartJSON({
    chartType: "Grouped Scatter Plot",
    chartData,
    chartVariables: { x: ["Record ID"], y: ["Value"], groupBy: ["Feature"] },
    chartMetadata: {
      title: "Peers Chart",
      description: "Feature values across focal records and peers",
    },
    chartConfig: {
      axisLabels: {
        x: "Record ID",
        y: "Value",
      },
    },
  });
}

function createPeerProfileChartFromRaw(peersChart?: any) {
  const features = normalizeFeatureEntries(peersChart?.features);
  if (!features.length) return null;

  const chartData = features.flatMap((feature) =>
    feature.values.map((value, index) => ({
      x: index + 1,
      y: Number(value),
      category: feature.feature,
    })),
  ).filter((point) => Number.isFinite(point.y));

  if (!chartData.length) return null;

  return ChartService.createChartJSON({
    chartType: "Grouped Scatter Plot",
    chartData,
    chartVariables: { x: ["Record ID"], y: ["Value"], groupBy: ["Feature"] },
    chartMetadata: {
      title: "Peers Chart",
      description: "Feature values across focal records and peers",
    },
    chartConfig: {
      axisLabels: {
        x: "Record ID",
        y: "Value",
      },
    },
  });
}

function createQuadrantMapChart(table?: Table) {
  const firstRow = table?.rows.find(
    (row) => row.feature_x !== undefined && row.feature_y !== undefined,
  );

  if (!firstRow) return null;

  const featureX = String(firstRow.feature_x);
  const featureY = String(firstRow.feature_y);
  const chartData = table?.rows
    .filter((row) => row.feature_x === featureX && row.feature_y === featureY)
    .map((row) => ({
      x: toNumber(row.x_value),
      y: toNumber(row.y_value),
      category: row.is_focal === "Yes" ? "Focal" : "Peer",
    }))
    .filter((row) => Number.isFinite(row.x) && Number.isFinite(row.y));

  if (!chartData?.length) return null;

  return ChartService.createChartJSON({
    chartType: "Grouped Scatter Plot",
    chartData,
    chartVariables: { x: [featureX], y: [featureY], groupBy: ["Record Type"] },
    chartMetadata: {
      title: `Quadrant Map: ${featureX} vs ${featureY}`,
      description: "Pairwise predictor map for focal records and peers",
    },
    chartConfig: {
      axisLabels: {
        x: featureX,
        y: featureY,
      },
    },
  });
}

function createQuadrantMapChartFromRaw(quadrantMap?: any) {
  const features = normalizeFeatureEntries(quadrantMap?.features);
  if (features.length < 2) return null;

  const featureX = features[0];
  const featureY = features[1];
  const focalRecords = new Set(
    (quadrantMap?.focal_neighbor_sets ?? []).map((set: any) => Number(set.focal_record)),
  );
  const pointCount = Math.min(featureX.values.length, featureY.values.length);
  const chartData = Array.from({ length: pointCount }, (_, index) => {
    const recordId = index + 1;
    return {
      x: Number(featureX.values[index]),
      y: Number(featureY.values[index]),
      category: focalRecords.has(recordId) ? "Focal" : "Peer",
    };
  }).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

  if (!chartData.length) return null;

  return ChartService.createChartJSON({
    chartType: "Grouped Scatter Plot",
    chartData,
    chartVariables: { x: [featureX.feature], y: [featureY.feature], groupBy: ["Record Type"] },
    chartMetadata: {
      title: `Quadrant Map: ${featureX.feature} vs ${featureY.feature}`,
      description: "Pairwise predictor map for focal records and peers",
    },
    chartConfig: {
      axisLabels: {
        x: featureX.feature,
        y: featureY.feature,
      },
    },
  });
}

function normalizeFeatureEntries(features: any): Array<{ feature: string; values: any[] }> {
  if (Array.isArray(features)) {
    return features
      .map((feature: any) => ({
        feature: feature.feature ?? feature.name,
        values: feature.values,
      }))
      .filter((feature) => feature.feature && Array.isArray(feature.values));
  }

  return Object.entries(features ?? {})
    .map(([feature, values]) => ({
      feature,
      values: Array.isArray(values) ? values : [],
    }))
    .filter((feature) => feature.feature && feature.values.length > 0);
}

function splitDimensionName(name: string | undefined) {
  return String(name ?? "X vs Y").split(" vs ").filter(Boolean);
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return Number.NaN;

  return Number(value.replace(/,/g, "").replace("%", ""));
}
