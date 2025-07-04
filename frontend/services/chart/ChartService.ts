import { DataProcessingService } from "./DataProcessingService";

// Default chart configurations
const DEFAULT_CONFIG = {
  width: 800,
  height: 600,
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
    y1: {
      min: "",
      max: "",
      majorIncrement: "",
      origin: "",
    },
    y2: {
      min: "",
      max: "",
      majorIncrement: "",
      origin: "",
    },
  },
};

// Helper function to detect dual axis charts
function isDualAxisChart(chartType: string): boolean {
  const dualAxisCharts = [
    "Vertical Bar & Line Chart",
    "Dual Axes Scatter Plot",
  ];
  return dualAxisCharts.includes(chartType);
}

/**
 * Generate axisInfo using DataProcessingService logic
 * Now uses smart variable name mapping instead of generic fallbacks
 * @param chartType - Type of chart to determine axis structure
 * @param chartVariables - Variables mapping from user selection
 * @param customAxisInfo - Custom axis info override (optional)
 * @returns Generated axis info with actual variable names
 */
function generateAxisInfo(
  chartType: string,
  chartVariables: any,
  customAxisInfo?: any
): Record<string, string> {
  // If custom axisInfo provided, use it directly
  if (customAxisInfo) return customAxisInfo;

  // Use DataProcessingService for smart variable name mapping
  // This gives us actual variable names instead of generic "Category", "Value"
  return DataProcessingService.generateAxisInfo(chartType, chartVariables);
}

// Function untuk generate chart colors berdasarkan chartType
/**
 * Generate final axis labels based on chart type (single vs dual axis)
 * @param chartType - Type of chart to determine axis structure
 * @param axisLabels - Raw axis labels input from user
 * @returns Formatted axis labels with appropriate structure for chart type
 */
function generateFinalAxisLabels(
  chartType: string,
  axisLabels: { x?: string; y?: string; y1?: string; y2?: string } = {}
): { x: string; y?: string; y1?: string; y2?: string } {
  const isDualAxis = isDualAxisChart(chartType);

  if (isDualAxis) {
    // For dual axis charts, use y1 and y2
    return {
      x: axisLabels.x || "X-axis",
      y1: axisLabels.y1 || axisLabels.y || "Y1-axis",
      y2: axisLabels.y2 || "Y2-axis",
    };
  } else {
    // For single axis charts, use y
    return {
      x: axisLabels.x || "X-axis",
      y: axisLabels.y || "Y-axis",
    };
  }
}

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
    statistic?: "mean" | "median" | "mode" | "min" | "max"; // For Summary Point Plot
    axisLabels?: {
      x?: string;
      y?: string;
      y1?: string; // For dual axis charts
      y2?: string; // For dual axis charts
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
      y1?: {
        min?: string;
        max?: string;
        majorIncrement?: string;
        origin?: string;
      };
      y2?: {
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
      axisInfo: any;
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
      statistic?: "mean" | "median" | "mode" | "min" | "max"; // For Summary Point Plot
      axisLabels: {
        x: string;
        y?: string;
        y1?: string;
        y2?: string;
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
      statistic,
      axisLabels = {},
      axisScaleOptions = DEFAULT_CONFIG.axisOptions,
    } = chartConfig;

    // Generate labels otomatis dengan fallback
    const autoTitle = title || `${chartType}`;
    const autoSubtitle = subtitle;
    const autoDescription = description || ``;

    // Generate axis labels based on chart type
    const finalAxisLabels = generateFinalAxisLabels(chartType, axisLabels);

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
            statistic: statistic,
            axisLabels: finalAxisLabels,
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
