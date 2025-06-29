// Default chart configurations
const DEFAULT_CONFIG = {
  width: 680,
  height: 550,
  useaxis: true,
  //   chartColors: [
  //     "#1f77b4",
  //     "#ff7f0e",
  //     "#2ca02c",
  //     "#d62728",
  //     "#9467bd",
  //     "#8c564b",
  //     "#e377c2",
  //     "#7f7f7f",
  //     "#bcbd22",
  //     "#17becf",
  //   ],
  titleOptions: {
    titleColor: "hsl(var(--foreground))",
    subtitleColor: "hsl(var(--muted-foreground))",
    titleFontSize: 16,
    subtitleFontSize: 12,
  },
  axisOptions: {
    x: {
      min: "",
      max: "",
      majorIncrement: "",
      origin: "",
    },
    y: {
      min: "",
      max: "",
      majorIncrement: "",
      origin: "",
    },
  },
};

// Function untuk generate axisInfo berdasarkan chartType
function generateAxisInfo(
  chartType: string,
  chartVariables: any,
  customAxisInfo?: any
) {
  if (customAxisInfo) return customAxisInfo;

  switch (chartType) {
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
      return {
        category: chartVariables.x?.[0] || "Category",
        value: chartVariables.y?.[0] || "Value",
      };

    case "Scatter Plot":
    case "Scatter Plot With Fit Line":
      return {
        x: chartVariables.x?.[0] || "X-axis",
        y: chartVariables.y?.[0] || "Y-axis",
      };

    case "Vertical Stacked Bar Chart":
    case "Horizontal Stacked Bar Chart":
    case "Clustered Bar Chart":
    case "Multiple Line Chart":
    case "Stacked Area Chart":
    case "Population Pyramid":
      return {
        category: chartVariables.x?.[0] || "Category",
        subcategory: chartVariables.y || [],
      };

    case "3D Bar Chart":
    case "3D Bar Chart2":
    case "3D Scatter Plot":
    case "Clustered 3D Bar Chart":
    case "Stacked 3D Bar Chart":
      return {
        x: chartVariables.x?.[0] || "X-axis",
        y: chartVariables.y?.[0] || "Y-axis",
        z: chartVariables.z?.[0] || "Z-axis",
      };

    case "Grouped Scatter Plot":
    case "Drop Line Chart":
      return {
        x: chartVariables.x?.[0] || "X-axis",
        y: chartVariables.y?.[0] || "Y-axis",
        category: chartVariables.groupBy?.[0] || "Group",
      };

    case "Simple Range Bar":
    case "High-Low-Close Chart":
      return {
        category: chartVariables.x?.[0] || "Category",
        low: chartVariables.low?.[0] || "Low",
        high: chartVariables.high?.[0] || "High",
        close: chartVariables.close?.[0] || "Close",
      };

    case "Clustered Range Bar":
      return {
        category: chartVariables.x?.[0] || "Category",
        subcategory: chartVariables.groupBy?.[0] || "Group",
        low: chartVariables.low?.[0] || "Low",
        high: chartVariables.high?.[0] || "High",
        close: chartVariables.close?.[0] || "Close",
      };

    case "Difference Area":
      return {
        category: chartVariables.x?.[0] || "Category",
        value0: chartVariables.low?.[0] || "Value 0",
        value1: chartVariables.high?.[0] || "Value 1",
      };

    case "Vertical Bar & Line Chart":
      return {
        category: chartVariables.x?.[0] || "Category",
        barValue: chartVariables.y?.[0] || "Bar Value",
        lineValue: chartVariables.y2?.[0] || "Line Value",
      };

    case "Dual Axes Scatter Plot":
      return {
        x: chartVariables.x?.[0] || "X-axis",
        y1: chartVariables.y?.[0] || "Y1-axis",
        y2: chartVariables.y2?.[0] || "Y2-axis",
      };

    case "Grouped 3D Scatter Plot":
      return {
        x: chartVariables.x?.[0] || "X-axis",
        y: chartVariables.y?.[0] || "Y-axis",
        z: chartVariables.z?.[0] || "Z-axis",
        category: chartVariables.groupBy?.[0] || "Group",
      };

    case "Histogram":
    case "Density Chart":
    case "Stem And Leaf Plot":
      return {
        value: chartVariables.y?.[0] || "Value",
      };

    case "Stacked Histogram":
      return {
        category: chartVariables.groupBy?.[0] || "Category",
        value: chartVariables.x?.[0] || "Value",
      };

    case "Clustered Error Bar Chart":
      return {
        category: chartVariables.x?.[0] || "Category",
        value: chartVariables.y?.[0] || "Value",
      };

    case "Scatter Plot Matrix":
      return {
        category: chartVariables.x?.join(", ") || "Variables",
        value: "Values for each variable",
      };

    case "Clustered Boxplot":
      return {
        category: chartVariables.x?.[0] || "Category",
        value: chartVariables.y?.[0] || "Value",
      };

    case "1-D Boxplot":
      return {
        value: chartVariables.y?.[0] || "Value",
      };

    default:
      return {
        category: "Category",
        value: "Value",
      };
  }
}

// Function untuk generate chart colors berdasarkan chartType
function generateChartColors(
  chartType: string,
  chartVariables: any,
  chartData?: any[],
  customColors?: string[]
): string[] {
  if (customColors) return customColors;

  const defaultColors = [
    "#000000",
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
    "#bcbd22",
    "#17becf",
  ];

  switch (chartType) {
    // Single color charts
    case "Vertical Bar Chart":
    case "Horizontal Bar Chart":
    case "Line Chart":
    case "Area Chart":
    case "Pie Chart":
    case "Scatter Plot":
    case "Scatter Plot With Fit Line":
    case "Histogram":
    case "Boxplot":
    case "Error Bar Chart":
    case "Dot Plot":
    case "Frequency Polygon":
    case "Summary Point Plot":
    case "Violin Plot":
    case "Density Chart":
    case "Stem And Leaf Plot":
      return [defaultColors[0]]; // Single color

    // Multi-color charts (berdasarkan jumlah subcategory)
    case "Vertical Stacked Bar Chart":
    case "Horizontal Stacked Bar Chart":
    case "Clustered Bar Chart":
    case "Multiple Line Chart":
    case "Stacked Area Chart":
      const subcategoryCount = chartVariables.y?.length || 1;
      return defaultColors.slice(0, subcategoryCount);

    // Special cases
    case "Population Pyramid":
      return ["#4682B4", "#e74c3c"]; // 2 specific colors

    case "3D Bar Chart":
    case "3D Bar Chart2":
    case "3D Scatter Plot":
    case "Clustered 3D Bar Chart":
    case "Stacked 3D Bar Chart":
      return [defaultColors[0]]; // Single color untuk 3D

    case "Grouped Scatter Plot":
    case "Drop Line Chart":
      if (Array.isArray(chartData)) {
        // Ambil semua nilai unik dari field 'category'
        const uniqueCategories = Array.from(
          new Set(chartData.map((d: any) => d.category))
        );
        const filteredCategories = uniqueCategories.filter(
          (v) => v !== undefined && v !== null && v !== ""
        );
        return defaultColors.slice(0, filteredCategories.length);
      }
      return defaultColors.slice(0, 1);

    case "Grouped 3D Scatter Plot":
      const groupCount3D = chartVariables.groupBy?.length || 1;
      return defaultColors.slice(0, groupCount3D);

    // Range charts - single color
    case "Simple Range Bar":
    case "Clustered Range Bar":
    case "High-Low-Close Chart":
    case "Difference Area":
      return [defaultColors[0]];

    // Dual axes - bisa 2 colors
    case "Vertical Bar & Line Chart":
    case "Dual Axes Scatter Plot":
      return [defaultColors[0], defaultColors[1]];

    // Matrix - multiple colors
    case "Scatter Plot Matrix":
      const variableCount = chartVariables.x?.length || 1;
      return defaultColors.slice(0, variableCount);

    // Clustered charts - berdasarkan jumlah subcategory
    case "Clustered Error Bar Chart":
    case "Clustered Boxplot":
      const clusteredCount = chartVariables.groupBy?.length || 1;
      return defaultColors.slice(0, clusteredCount);

    // Stacked histogram - berdasarkan jumlah group
    case "Stacked Histogram":
      const stackedHistCount = chartVariables.groupBy?.length || 1;
      return defaultColors.slice(0, stackedHistCount);

    // 1D Boxplot - single color
    case "1-D Boxplot":
      return [defaultColors[0]];

    default:
      return [defaultColors[0]];
  }
}

// Interface untuk input data - CLEAN GROUPED STRUCTURE
interface ChartInput {
  // Required
  chartType: string;
  chartData: any[];

  // Optional - grouped like output JSON
  chartVariables?: {
    x?: string[];
    y?: string[];
    z?: string[];
    groupBy?: string[];
    low?: string[];
    high?: string[];
    close?: string[];
    y2?: string[];
  };

  chartMetadata?: {
    title?: string;
    subtitle?: string;
    description?: string;
    notes?: string;
    titleFontSize?: number;
    subtitleFontSize?: number;
    axisInfo?: any; // Flexible axisInfo
  };

  chartConfig?: {
    width?: number;
    height?: number;
    chartColor?: string[];
    useAxis?: boolean;
    useLegend?: boolean;
    axisLabels?: {
      x?: string;
      y?: string;
    };
    axisScaleOptions?: {
      x?: {
        min?: string;
        max?: string;
        majorIncrement?: string;
        origin?: string;
      };
      y?: {
        min?: string;
        max?: string;
        majorIncrement?: string;
        origin?: string;
      };
    };
  };
}

// Interface untuk chart JSON output (sesuai format sistem yang ada)
interface ChartJSON {
  charts: Array<{
    chartType: string;
    chartMetadata: {
      axisInfo: any; // Flexible - bisa berbagai struktur
      description: string;
      notes?: string;
      title?: string;
      subtitle?: string;
      titleFontSize?: number;
      subtitleFontSize?: number;
    };
    chartData: any[];
    chartConfig: {
      width: number;
      height: number;
      chartColor?: string[];
      useAxis?: boolean;
      useLegend?: boolean;
      axisLabels: {
        x: string;
        y: string;
      };
      axisScaleOptions?: any;
    };
  }>;
}

export class ChartService {
  /**
   * Membuat chart JSON dengan struktur parameter yang clean dan grouped
   * Parameter mengikuti struktur output: chartType, chartData, chartMetadata, chartConfig
   */
  static createChartJSON(input: ChartInput): ChartJSON {
    const {
      chartType,
      chartData,
      chartVariables = {},
      chartMetadata = {},
      chartConfig = {},
    } = input;

    // ⚠️ Validate data - no fallback, throw error if invalid
    if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
      throw new Error(
        "chartData is required and must be a non-empty array. Check the document for the correct format."
      );
    }

    // Destructure with defaults - Metadata
    const {
      title,
      subtitle,
      description,
      notes,
      titleFontSize = DEFAULT_CONFIG.titleOptions.titleFontSize,
      subtitleFontSize = DEFAULT_CONFIG.titleOptions.subtitleFontSize,
      axisInfo,
    } = chartMetadata;

    // Destructure with defaults - Config
    const {
      width = DEFAULT_CONFIG.width,
      height = DEFAULT_CONFIG.height,
      chartColor,
      useAxis = DEFAULT_CONFIG.useaxis,
      useLegend = true,
      axisLabels = {},
      axisScaleOptions = DEFAULT_CONFIG.axisOptions,
    } = chartConfig;

    // Generate labels otomatis dengan fallback
    const autoTitle = title || `${chartType}`;
    const autoSubtitle = subtitle || `Showing ${chartData.length} data points`;
    const autoDescription =
      description || `${chartType} showing data distribution`;
    const autoXLabel = axisLabels.x || "X-axis";
    const autoYLabel = axisLabels.y || "Y-axis";

    // Generate dynamic axisInfo berdasarkan chartType
    const finalAxisInfo = generateAxisInfo(chartType, chartVariables, axisInfo);

    // Generate dynamic chart colors berdasarkan chartType
    const finalChartColors = generateChartColors(
      chartType,
      chartVariables,
      chartData,
      chartColor
    );

    const chartJSON: ChartJSON = {
      charts: [
        {
          chartType: chartType,
          chartMetadata: {
            axisInfo: finalAxisInfo,
            description: autoDescription,
            notes: notes,
            title: autoTitle,
            subtitle: autoSubtitle,
            titleFontSize: titleFontSize,
            subtitleFontSize: subtitleFontSize,
          },
          chartData: chartData,
          chartConfig: {
            width,
            height,
            chartColor: finalChartColors,
            useAxis: useAxis,
            useLegend: useLegend,
            axisLabels: {
              x: autoXLabel,
              y: autoYLabel,
            },
            axisScaleOptions: axisScaleOptions,
          },
        },
      ],
    };

    return chartJSON;
  }

  /**
   * Utility: Membuat chart simple dengan data yang sudah benar format
   * ASSUME: data sudah format [{category: "", value: number}]
   */
  static quickChart(
    chartData: any[],
    chartType: string = "Vertical Bar Chart"
  ): ChartJSON {
    return this.createChartJSON({
      chartType,
      chartData,
    });
  }

  /**
   * Utility: Membuat multiple charts sekaligus dari data yang sama
   */
  static createMultipleCharts(
    input: ChartInput,
    chartTypes: string[]
  ): ChartJSON[] {
    return chartTypes.map((chartType) =>
      this.createChartJSON({
        ...input,
        chartType,
      })
    );
  }
}

// Export default instance
const chartService = new ChartService();
export default chartService;
