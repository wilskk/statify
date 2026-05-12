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
      const nearestNeighbors = findTable("nearest_neighbors");
      if (nearestNeighbors) {
        const nearestNeighborsId = await addAnalytic(logId, {
          title: `k Nearest Neighbors and Distances`,
          note: "",
        });

        await addStatistic(nearestNeighborsId, {
          title: `k Nearest Neighbors and Distances`,
          description: `k Nearest Neighbors and Distances`,
          output_data: nearestNeighbors,
          components: `k Nearest Neighbors and Distances`,
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
  const hasZ = dimension.points.some((point: any) => Number.isFinite(Number(point.z)) && Number(point.z) !== 0);
  const chartData = dimension.points
    .map((point: any) => ({
      x: Number(point.x),
      y: Number(point.y),
      z: Number(point.z),
      group: point.focal
        ? "Focal"
        : point.target_value
          ? `${point.point_type} - Target true`
          : `${point.point_type} - Target false`,
      category: point.focal
        ? "Focal"
        : point.target_value
          ? `${point.point_type} - Target true`
          : `${point.point_type} - Target false`,
    }))
    .filter((point: any) => Number.isFinite(point.x) && Number.isFinite(point.y));

  if (!chartData.length) return null;

  if (hasZ) {
    return ChartService.createChartJSON({
      chartType: "Grouped 3D Scatter Plot (ECharts)",
      chartData,
      chartVariables: { x: [labels.x], y: [labels.y], z: [labels.z], groupBy: ["Point Type"] },
      chartMetadata: {
        title: `Predictor Space: ${dimension.name}`,
        description: "KNN predictor space by partition, target, and focal status",
      },
      chartConfig: {
        axisLabels: {
          x: labels.x,
          y: labels.y,
          z: labels.z,
        },
      },
    });
  }

  return ChartService.createChartJSON({
    chartType: "Grouped Scatter Plot",
    chartData,
    chartVariables: { x: [labels.x], y: [labels.y], groupBy: ["Point Type"] },
    chartMetadata: {
      title: `Predictor Space: ${dimension.name}`,
      description: "KNN predictor space by partition, target, and focal status",
    },
    chartConfig: {
      axisLabels: {
        x: labels.x,
        y: labels.y,
      },
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
  const labels = String(name ?? "X vs Y").split(" vs ");
  return {
    x: labels[0] ?? "X",
    y: labels[1] ?? "Y",
    z: labels[2] ?? "Z",
  };
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return Number.NaN;

  return Number(value.replace(/,/g, "").replace("%", ""));
}
