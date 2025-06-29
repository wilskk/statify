// Interface untuk input data processing
interface DataProcessingInput {
  // Required
  chartType: string;
  rawData: any[][]; // Raw data dari CSV/SPSS
  variables: Array<{ name: string; type?: string }>; // Variable definitions

  // Chart variables mapping
  chartVariables: {
    x?: string[]; // X-axis variables
    y?: string[]; // Y-axis variables
    z?: string[]; // Z-axis variables (3D)
    groupBy?: string[]; // Grouping variables
    low?: string[]; // Low values (range charts)
    high?: string[]; // High values (range charts)
    close?: string[]; // Close values (financial charts)
    y2?: string[]; // Secondary Y-axis
  };

  // Data processing options
  processingOptions?: {
    aggregation?: "sum" | "count" | "average" | "none";
    filterEmpty?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    limit?: number;
  };
}

// Konfigurasi aggregation support per chart type
const CHART_AGGREGATION_CONFIG: { [chartType: string]: string[] } = {
  // Charts dengan full aggregation support
  "Vertical Bar Chart": ["sum", "count", "average", "none"],
  "Horizontal Bar Chart": ["sum", "count", "average", "none"],
  "Line Chart": ["sum", "count", "average", "none"],
  "Area Chart": ["sum", "count", "average", "none"],
  "Pie Chart": ["sum", "count", "average", "none"],
  "Error Bar Chart": ["sum", "count", "average", "none"],
  "Frequency Polygon": ["sum", "count", "average", "none"],
  "Summary Point Plot": ["sum", "count", "average", "none"],

  // Charts dengan data mentah only
  Boxplot: ["none"],
  "Dot Plot": ["none"],
  "Violin Plot": ["none"],

  // Charts dengan limited aggregation
  "Vertical Stacked Bar Chart": ["sum", "none"],
  "Horizontal Stacked Bar Chart": ["sum", "none"],
  "Clustered Bar Chart": ["sum", "none"],
  "Multiple Line Chart": ["sum", "none"],
  "Stacked Area Chart": ["sum", "none"],
  "Population Pyramid": ["sum", "none"],
  "3D Bar Chart": ["sum", "none"],
  "3D Bar Chart2": ["sum", "none"],
  "Clustered 3D Bar Chart": ["sum", "none"],
  "Stacked 3D Bar Chart": ["sum", "none"],
  "Difference Area": ["sum", "none"],
  "Vertical Bar & Line Chart": ["sum", "none"],
  "Clustered Error Bar Chart": ["sum", "none"],

  // Charts dengan count only
  Histogram: ["count", "none"],
  "Stacked Histogram": ["count", "none"],

  // Charts dengan data individual only
  "Scatter Plot": ["none"],
  "Scatter Plot With Fit Line": ["none"],
  "3D Scatter Plot": ["none"],
  "Grouped Scatter Plot": ["none"],
  "Drop Line Chart": ["none"],
  "Simple Range Bar": ["none"],
  "High-Low-Close Chart": ["none"],
  "Clustered Range Bar": ["none"],
  "Dual Axes Scatter Plot": ["none"],
  "Grouped 3D Scatter Plot": ["none"],
  "Density Chart": ["none"],
  "Scatter Plot Matrix": ["none"],
  "Clustered Boxplot": ["none"],
  "1-D Boxplot": ["none"],
  "Stem And Leaf Plot": ["none"],
};

// Type definitions for processed data
interface SimpleChartData {
  category: string;
  value: number;
}

interface ScatterData {
  x: number;
  y: number;
}

interface StackedChartData {
  category: string;
  subcategory: string;
  value: number;
}

interface ThreeDData {
  x: number;
  y: number;
  z: number;
}

interface GroupedScatterData {
  category: string;
  x: number;
  y: number;
}

interface RangeChartData {
  category: string;
  low: number;
  high: number;
  close: number;
}

interface ClusteredRangeData {
  category: string;
  subcategory: string;
  low: number;
  high: number;
  close: number;
}

interface DifferenceAreaData {
  category: string;
  value0: number;
  value1: number;
}

interface BarLineData {
  category: string;
  barValue: number;
  lineValue: number;
}

interface DualAxesData {
  x: number;
  y1: number;
  y2: number;
}

interface Grouped3DScatterData {
  x: number;
  y: number;
  z: number;
  category: string;
}

interface HistogramData {
  value: number;
}

interface StackedHistogramData {
  value: number;
  category: string;
}

interface ClusteredErrorBarData {
  category: string;
  subcategory: string;
  value: number;
  error: number;
}

interface ScatterMatrixData {
  [key: string]: number;
}

interface ClusteredBoxplotData {
  category: string;
  subcategory: string;
  value: number;
}

interface OneDBoxplotData {
  value: number;
}

export class DataProcessingService {
  /**
   * Process raw data menjadi struktur yang dibutuhkan chart
   * Return: processed data array yang siap untuk ChartService.createChartJSON()
   */
  static processDataForChart(input: DataProcessingInput): any[] {
    const {
      chartType,
      rawData,
      variables,
      chartVariables,
      processingOptions = {},
    } = input;

    // Validate input
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      throw new Error("rawData is required and must be a non-empty array");
    }

    if (!variables || !Array.isArray(variables) || variables.length === 0) {
      throw new Error("variables is required and must be a non-empty array");
    }

    // Validate aggregation support for chart type
    this.validateAggregationSupport(chartType, processingOptions.aggregation);

    // Map variable indices
    const indices = this.mapVariableIndices(variables, chartVariables);

    // Process berdasarkan chart type
    switch (chartType) {
      //OK
      case "Vertical Bar Chart":
      case "Horizontal Bar Chart":
      case "Line Chart":
      case "Area Chart":
      case "Pie Chart":
      case "Boxplot":
      case "Error Bar Chart":
      case "Dot Plot":
      case "Frequency Polygon":
      case "Summary Point Plot":
      case "Violin Plot":
        return this.processSimpleChartData(
          rawData,
          indices,
          processingOptions,
          chartType
        );

      //OK
      case "Scatter Plot":
      case "Scatter Plot With Fit Line":
        return this.processScatterData(rawData, indices, processingOptions);

      //OK
      case "Vertical Stacked Bar Chart":
      case "Horizontal Stacked Bar Chart":
      case "Clustered Bar Chart":
      case "Multiple Line Chart":
      case "Stacked Area Chart":
      case "Population Pyramid":
        return this.processStackedChartData(
          rawData,
          indices,
          processingOptions
        );

      //Belum di test
      case "3D Bar Chart":
      case "3D Bar Chart2":
      case "3D Scatter Plot":
      case "Clustered 3D Bar Chart":
      case "Stacked 3D Bar Chart":
        return this.process3DChartData(rawData, indices, processingOptions);

      //OK
      case "Grouped Scatter Plot":
      case "Drop Line Chart":
        return this.processGroupedScatterData(
          rawData,
          indices,
          processingOptions
        );

      //OK
      case "Simple Range Bar":
      case "High-Low-Close Chart":
        return this.processRangeChartData(rawData, indices, processingOptions);

      //OK
      case "Clustered Range Bar":
        return this.processClusteredRangeData(
          rawData,
          indices,
          processingOptions
        );

      //OK
      case "Difference Area":
        return this.processDifferenceAreaData(
          rawData,
          indices,
          processingOptions
        );

      //OK
      case "Vertical Bar & Line Chart":
        return this.processBarLineData(rawData, indices, processingOptions);

      //OK
      case "Dual Axes Scatter Plot":
        return this.processDualAxesData(rawData, indices, processingOptions);

      //OK
      case "Grouped 3D Scatter Plot":
        return this.processGrouped3DScatterData(
          rawData,
          indices,
          processingOptions
        );

      //OK
      case "Histogram":
      case "Density Chart":
        return this.processHistogramData(rawData, indices, processingOptions);
      //OK
      case "Stacked Histogram":
        return this.processStackedHistogramData(
          rawData,
          indices,
          processingOptions
        );
      //OK
      case "Clustered Error Bar Chart":
        return this.processClusteredErrorBarData(
          rawData,
          indices,
          processingOptions
        );

      //OK
      case "Scatter Plot Matrix":
        return this.processScatterMatrixData(
          rawData,
          indices,
          processingOptions,
          variables
        );

      //OK
      case "Clustered Boxplot":
        return this.processClusteredBoxplotData(
          rawData,
          indices,
          processingOptions
        );
      //OK
      case "1-D Boxplot":
        return this.process1DBoxplotData(rawData, indices, processingOptions);

      //OK
      case "Stem And Leaf Plot":
        return this.processStemAndLeafData(rawData, indices, processingOptions);

      default:
        return this.processSimpleChartData(
          rawData,
          indices,
          processingOptions,
          chartType
        );
    }
  }

  // Helper methods
  private static mapVariableIndices(variables: any[], chartVariables: any) {
    const indices: any = {};

    if (chartVariables.x) {
      indices.x = chartVariables.x.map((v: string) =>
        variables.findIndex((varObj) => varObj.name === v)
      );
      indices.xVariableName = chartVariables.x[0];
    }

    if (chartVariables.y) {
      indices.y = chartVariables.y.map((v: string) =>
        variables.findIndex((varObj) => varObj.name === v)
      );
      indices.yVariableNames = chartVariables.y;
    }

    if (chartVariables.z) {
      indices.z = chartVariables.z.map((v: string) =>
        variables.findIndex((varObj) => varObj.name === v)
      );
    }

    if (chartVariables.groupBy) {
      indices.groupBy = chartVariables.groupBy.map((v: string) =>
        variables.findIndex((varObj) => varObj.name === v)
      );
    }

    if (chartVariables.low) {
      indices.low = chartVariables.low.map((v: string) =>
        variables.findIndex((varObj) => varObj.name === v)
      );
    }

    if (chartVariables.high) {
      indices.high = chartVariables.high.map((v: string) =>
        variables.findIndex((varObj) => varObj.name === v)
      );
    }

    if (chartVariables.close) {
      indices.close = chartVariables.close.map((v: string) =>
        variables.findIndex((varObj) => varObj.name === v)
      );
    }

    if (chartVariables.y2) {
      indices.y2 = chartVariables.y2.map((v: string) =>
        variables.findIndex((varObj) => varObj.name === v)
      );
    }

    // Validate indices
    Object.entries(indices).forEach(([key, value]) => {
      if (Array.isArray(value) && value.includes(-1)) {
        const missingVars = chartVariables[key]?.filter(
          (v: string, i: number) => value[i] === -1
        );
        throw new Error(
          `Variable ${key} (${missingVars?.join(
            ", "
          )}) tidak ditemukan dalam dataset`
        );
      }
    });

    return indices;
  }

  private static processSimpleChartData(
    rawData: any[][],
    indices: any,
    options: any,
    chartType?: string
  ): SimpleChartData[] {
    const { aggregation = "none", filterEmpty = true } = options;

    // Get allowed aggregations for this chart type
    const allowedAggregations = chartType
      ? CHART_AGGREGATION_CONFIG[chartType]
      : ["sum", "count", "average", "none"];

    // If chart only supports "none", force it regardless of input
    if (allowedAggregations.length === 1 && allowedAggregations[0] === "none") {
      return this.processRawData(rawData, indices, filterEmpty);
    }

    // If aggregation is not allowed, use first allowed option
    const effectiveAggregation = allowedAggregations.includes(aggregation)
      ? aggregation
      : allowedAggregations[0];

    // Handle "none" aggregation - return data as-is without grouping
    if (effectiveAggregation === "none") {
      return this.processRawData(rawData, indices, filterEmpty);
    }

    const frequencyMap: {
      [key: string]: number | { sum: number; count: number };
    } = rawData.reduce((acc, row) => {
      const xKey = row[indices.x[0]];
      const yValue = parseFloat(row[indices.y[0]]);

      if (filterEmpty && (xKey === null || xKey === undefined || xKey === "")) {
        return acc;
      }

      if (!isNaN(yValue)) {
        if (effectiveAggregation === "sum") {
          acc[xKey] = ((acc[xKey] as number) || 0) + yValue;
        } else if (effectiveAggregation === "count") {
          acc[xKey] = ((acc[xKey] as number) || 0) + 1;
        } else if (effectiveAggregation === "average") {
          if (!acc[xKey]) acc[xKey] = { sum: 0, count: 0 };
          (acc[xKey] as { sum: number; count: number }).sum += yValue;
          (acc[xKey] as { sum: number; count: number }).count += 1;
        }
      }

      return acc;
    }, {} as { [key: string]: number | { sum: number; count: number } });

    // Convert to array format
    return Object.keys(frequencyMap).map((key) => {
      const value =
        effectiveAggregation === "average"
          ? (frequencyMap[key] as { sum: number; count: number }).sum /
            (frequencyMap[key] as { sum: number; count: number }).count
          : (frequencyMap[key] as number);

      return {
        category: key,
        value: value,
      };
    });
  }

  private static processRawData(
    rawData: any[][],
    indices: any,
    filterEmpty: boolean
  ): SimpleChartData[] {
    return rawData
      .map((row) => {
        const xKey = row[indices.x[0]];
        const yValue = parseFloat(row[indices.y[0]]);

        if (
          filterEmpty &&
          (xKey === null || xKey === undefined || xKey === "" || isNaN(yValue))
        ) {
          return null;
        }

        return {
          category: xKey,
          value: yValue,
        };
      })
      .filter((item): item is SimpleChartData => item !== null);
  }

  private static processScatterData(
    rawData: any[][],
    indices: any,
    options: any
  ): ScatterData[] {
    const { filterEmpty = true } = options;

    return rawData
      .map((row) => {
        const xValue = parseFloat(row[indices.x[0]]);
        const yValue = parseFloat(row[indices.y[0]]);

        if (filterEmpty && (isNaN(xValue) || isNaN(yValue))) {
          return null;
        }

        return {
          x: xValue,
          y: yValue,
        };
      })
      .filter((item): item is ScatterData => item !== null);
  }

  private static processStackedChartData(
    rawData: any[][],
    indices: any,
    options: any
  ): StackedChartData[] {
    const { aggregation = "sum", filterEmpty = true } = options;

    const frequencyMap: {
      [key: string]: Array<{ subcategory: string; value: number }>;
    } = rawData.reduce((acc, row) => {
      const xKey = row[indices.x[0]];
      if (filterEmpty && (xKey === null || xKey === undefined || xKey === ""))
        return acc;

      indices.y.forEach((yIndex: number, i: number) => {
        const yValue = parseFloat(row[yIndex]);
        if (!isNaN(yValue)) {
          if (!acc[xKey]) acc[xKey] = [];
          acc[xKey].push({
            subcategory: indices.yVariableNames[i],
            value: yValue,
          });
        }
      });
      return acc;
    }, {} as { [key: string]: Array<{ subcategory: string; value: number }> });

    // Output persis seperti DefaultChartPrep.js
    return Object.keys(frequencyMap)
      .map((key) =>
        frequencyMap[key].map((entry) => ({
          category: key,
          subcategory: entry.subcategory,
          value: entry.value,
        }))
      )
      .flat();
  }

  private static process3DChartData(
    rawData: any[][],
    indices: any,
    options: any
  ): ThreeDData[] {
    const { aggregation = "sum", filterEmpty = true } = options;

    const reducedData: { [key: string]: ThreeDData } = rawData.reduce(
      (acc, row) => {
        const x = parseFloat(row[indices.x[0]]);
        const y = parseFloat(row[indices.y[0]]);
        const z = parseFloat(row[indices.z[0]]);

        if (filterEmpty && (isNaN(x) || isNaN(y) || isNaN(z))) {
          return acc;
        }

        // Create unique key based on x and z combination
        const key = `${x}-${z}`;

        if (!acc[key]) {
          acc[key] = { x, z, y: 0 };
        }

        acc[key].y += y;

        return acc;
      },
      {} as { [key: string]: ThreeDData }
    );

    return Object.values(reducedData);
  }

  private static processGroupedScatterData(
    rawData: any[][],
    indices: any,
    options: any
  ): GroupedScatterData[] {
    const { filterEmpty = true } = options;

    return rawData
      .map((row) => {
        const group = row[indices.groupBy[0]];
        const xValue = parseFloat(row[indices.x[0]]);
        const yValue = parseFloat(row[indices.y[0]]);

        if (filterEmpty && (isNaN(xValue) || isNaN(yValue))) {
          return null;
        }

        return {
          category: group,
          x: xValue,
          y: yValue,
        };
      })
      .filter((item): item is GroupedScatterData => item !== null);
  }

  private static processRangeChartData(
    rawData: any[][],
    indices: any,
    options: any
  ): RangeChartData[] {
    const { filterEmpty = true } = options;

    return rawData
      .map((row) => {
        const category = row[indices.x[0]];
        const lowValue = parseFloat(row[indices.low[0]]);
        const highValue = parseFloat(row[indices.high[0]]);
        const closeValue = parseFloat(row[indices.close[0]]);

        if (
          filterEmpty &&
          (isNaN(lowValue) || isNaN(highValue) || isNaN(closeValue))
        ) {
          return null;
        }

        return {
          category: category,
          low: lowValue,
          high: highValue,
          close: closeValue,
        };
      })
      .filter((item): item is RangeChartData => item !== null);
  }

  private static processClusteredRangeData(
    rawData: any[][],
    indices: any,
    options: any
  ): ClusteredRangeData[] {
    const { filterEmpty = true } = options;

    return rawData
      .map((row) => {
        const category = row[indices.x[0]];
        const subcategory = row[indices.groupBy[0]];
        const lowValue = parseFloat(row[indices.low[0]]);
        const highValue = parseFloat(row[indices.high[0]]);
        const closeValue = parseFloat(row[indices.close[0]]);

        if (
          filterEmpty &&
          (isNaN(lowValue) || isNaN(highValue) || isNaN(closeValue))
        ) {
          return null;
        }

        return {
          category: category,
          subcategory: subcategory,
          low: lowValue,
          high: highValue,
          close: closeValue,
        };
      })
      .filter((item): item is ClusteredRangeData => item !== null);
  }

  private static processDifferenceAreaData(
    rawData: any[][],
    indices: any,
    options: any
  ): DifferenceAreaData[] {
    const { filterEmpty = true } = options;

    return rawData
      .map((row) => {
        const category = row[indices.x[0]];
        const value0 = parseFloat(row[indices.low[0]]);
        const value1 = parseFloat(row[indices.high[0]]);

        if (filterEmpty && (isNaN(value0) || isNaN(value1))) {
          return null;
        }

        return {
          category: category,
          value0: value0,
          value1: value1,
        };
      })
      .filter((item): item is DifferenceAreaData => item !== null);
  }

  private static processBarLineData(
    rawData: any[][],
    indices: any,
    options: any
  ): BarLineData[] {
    const { aggregation = "sum", filterEmpty = true } = options;

    const frequencyMap: {
      [key: string]: { barValue: number; lineValue: number };
    } = rawData.reduce((acc, row) => {
      const category = row[indices.x[0]];
      const barValue = parseFloat(row[indices.y[0]]);
      const lineValue = parseFloat(row[indices.y2[0]]);

      if (
        filterEmpty &&
        (category === null || category === undefined || category === "")
      ) {
        return acc;
      }

      if (!isNaN(barValue) && !isNaN(lineValue)) {
        acc[category] = {
          barValue: barValue,
          lineValue: lineValue,
        };
      }

      return acc;
    }, {} as { [key: string]: { barValue: number; lineValue: number } });

    return Object.keys(frequencyMap).map((key) => ({
      category: key,
      barValue: frequencyMap[key].barValue,
      lineValue: frequencyMap[key].lineValue,
    }));
  }

  private static processDualAxesData(
    rawData: any[][],
    indices: any,
    options: any
  ): DualAxesData[] {
    const { filterEmpty = true } = options;

    return rawData
      .map((row) => {
        const xValue = parseFloat(row[indices.x[0]]);
        const y1Value = parseFloat(row[indices.y[0]]);
        const y2Value = parseFloat(row[indices.y2[0]]);

        if (
          filterEmpty &&
          (isNaN(xValue) || isNaN(y1Value) || isNaN(y2Value))
        ) {
          return null;
        }

        return {
          x: xValue,
          y1: y1Value,
          y2: y2Value,
        };
      })
      .filter((item): item is DualAxesData => item !== null);
  }

  private static processGrouped3DScatterData(
    rawData: any[][],
    indices: any,
    options: any
  ): Grouped3DScatterData[] {
    const { filterEmpty = true } = options;

    return rawData
      .map((row) => {
        const x = parseFloat(row[indices.x[0]]);
        const y = parseFloat(row[indices.y[0]]);
        const z = parseFloat(row[indices.z[0]]);
        const category = row[indices.groupBy[0]];

        if (filterEmpty && (isNaN(x) || isNaN(y) || isNaN(z))) {
          return null;
        }

        return { x, y, z, category };
      })
      .filter((item): item is Grouped3DScatterData => item !== null);
  }

  private static processHistogramData(
    rawData: any[][],
    indices: any,
    options: any
  ): number[] {
    const { filterEmpty = true } = options;

    return rawData
      .map((row) => {
        const value = parseFloat(row[indices.y[0]]);

        if (filterEmpty && isNaN(value)) {
          return null;
        }

        return value;
      })
      .filter((item): item is number => item !== null);
  }

  private static processStackedHistogramData(
    rawData: any[][],
    indices: any,
    options: any
  ): StackedHistogramData[] {
    const { filterEmpty = true } = options;

    return rawData
      .map((row) => {
        const value = parseFloat(row[indices.x[0]]);
        const category = row[indices.groupBy[0]];

        if (filterEmpty && isNaN(value)) {
          return null;
        }

        return {
          value: value,
          category: category,
        };
      })
      .filter((item): item is StackedHistogramData => item !== null);
  }

  private static processClusteredErrorBarData(
    rawData: any[][],
    indices: any,
    options: any
  ): ClusteredErrorBarData[] {
    const { filterEmpty = true } = options;

    return rawData
      .map((row) => {
        const category = row[indices.x[0]];
        const subcategory = row[indices.groupBy[0]];
        const value = parseFloat(row[indices.y[0]]);

        if (filterEmpty && isNaN(value)) {
          return null;
        }

        // Placeholder error calculation - bisa disesuaikan
        const error = 2;

        return {
          category: category,
          subcategory: subcategory,
          value: value,
          error: error,
        };
      })
      .filter((item): item is ClusteredErrorBarData => item !== null);
  }

  private static processScatterMatrixData(
    rawData: any[][],
    indices: any,
    options: any,
    variables: Array<{ name: string }>
  ): ScatterMatrixData[] {
    const { filterEmpty = true } = options;

    return rawData
      .map((row) => {
        const entry: ScatterMatrixData = {};

        indices.x.forEach((xIndex: number, i: number) => {
          const value = parseFloat(row[xIndex]);
          if (!isNaN(value)) {
            entry[variables[xIndex].name] = value;
          }
        });

        // Only return if all variables have valid values
        return Object.keys(entry).length === indices.x.length ? entry : null;
      })
      .filter((item): item is ScatterMatrixData => item !== null);
  }

  private static processClusteredBoxplotData(
    rawData: any[][],
    indices: any,
    options: any
  ): ClusteredBoxplotData[] {
    const { filterEmpty = true } = options;

    return rawData
      .map((row) => {
        const category = row[indices.x[0]];
        const subcategory = row[indices.groupBy[0]];
        const value = parseFloat(row[indices.y[0]]);

        if (filterEmpty && isNaN(value)) {
          return null;
        }

        return {
          category: category,
          subcategory: String(subcategory),
          value: value,
        };
      })
      .filter((item): item is ClusteredBoxplotData => item !== null);
  }

  private static process1DBoxplotData(
    rawData: any[][],
    indices: any,
    options: any
  ): OneDBoxplotData[] {
    const { filterEmpty = true } = options;

    return rawData
      .map((row) => {
        const value = parseFloat(row[indices.y[0]]);

        if (filterEmpty && isNaN(value)) {
          return null;
        }

        return { value: value };
      })
      .filter((item): item is OneDBoxplotData => item !== null);
  }

  private static processStemAndLeafData(
    rawData: any[][],
    indices: any,
    options: any
  ): Array<{ stem: string; leaves: number[] }> {
    const { filterEmpty = true } = options;

    // Ambil semua nilai valid
    const values = rawData
      .map((row) => parseFloat(row[indices.y[0]]))
      .filter((v) => !isNaN(v));

    // Kelompokkan ke stem-leaf
    const stemMap: { [stem: string]: number[] } = {};
    values.forEach((val) => {
      const stem = Math.floor(val / 10).toString();
      const leaf = Math.floor(val % 10);
      if (!stemMap[stem]) stemMap[stem] = [];
      stemMap[stem].push(leaf);
    });

    // Konversi ke array of object dan urutkan leaves
    return Object.keys(stemMap).map((stem) => ({
      stem,
      leaves: stemMap[stem].sort((a, b) => a - b),
    }));
  }

  private static validateAggregationSupport(
    chartType: string,
    aggregation?: string
  ) {
    if (!aggregation) return; // No aggregation specified, use default

    const allowedAggregations = CHART_AGGREGATION_CONFIG[chartType];
    if (!allowedAggregations) {
      console.warn(
        `No aggregation configuration found for chart type: ${chartType}`
      );
      return;
    }

    if (!allowedAggregations.includes(aggregation)) {
      throw new Error(
        `Aggregation "${aggregation}" is not supported for chart type "${chartType}". ` +
          `Supported aggregations: ${allowedAggregations.join(", ")}`
      );
    }
  }
}
