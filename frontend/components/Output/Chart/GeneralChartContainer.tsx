import React, { useEffect, useRef, useState } from "react";
import { chartUtils } from "@/utils/chartBuilder/chartTypes/chartUtils";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, Image, FileType, View } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Define type untuk data chart
interface ChartData {
  chartType: string;
  chartData: any[];
  chartConfig: {
    width: number;
    height: number;
    useAxis?: boolean;
    axisLabels: {
      x: string;
      y: string;
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
    chartColor?: string[];
  };
  chartMetadata: {
    axisInfo: {
      category: string;
      value: string;
    };
    description: string;
    title?: string;
    subtitle?: string;
    titleFontSize?: number;
    subtitleFontSize?: number;
  };
}

interface GeneralChartContainerProps {
  data: string | { charts: ChartData[] }; // Bisa menerima string JSON atau object
}

const GeneralChartContainer: React.FC<GeneralChartContainerProps> = ({
  data,
}) => {
  const [copied, setCopied] = useState<{
    [key: string]: { svg?: boolean; png?: boolean };
  }>({});
  const [chartNodes, setChartNodes] = useState<
    {
      id: string;
      chartNode: HTMLElement | SVGElement | null;
      chartType: string;
      width: number;
      height: number;
    }[]
  >([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewChart, setPreviewChart] = useState<
    HTMLElement | SVGElement | null
  >(null);

  const [chartDimensions, setChartDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 800, // Default width
    height: 600, // Default height
  });

  const [actionsHidden, setActionsHidden] = useState<{
    [key: string]: boolean;
  }>({});
  const actionTimers = useRef<{
    [key: string]: NodeJS.Timeout | number | null;
  }>({});

  // Parse data jika berbentuk string
  const parsedData = typeof data === "string" ? JSON.parse(data) : data;

  const handleCopyChart = async (
    chartId: string,
    format: "svg" | "png" = "svg"
  ) => {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) return;

    const svgElement = chartElement.querySelector("svg");
    if (!svgElement) return;

    try {
      if (format === "svg") {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        await navigator.clipboard.writeText(svgData);
      } else {
        // Convert SVG to PNG
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img: HTMLImageElement = document.createElement("img");
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(svgBlob);

        await new Promise((resolve, reject) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            if (ctx) {
              ctx.fillStyle = "#fff";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
            }
            canvas.toBlob((blob) => {
              if (blob) {
                navigator.clipboard
                  .write([
                    new ClipboardItem({
                      "image/png": blob,
                    }),
                  ])
                  .then(resolve)
                  .catch(reject);
              } else {
                reject(new Error("Failed to create blob"));
              }
            }, "image/png");
          };
          img.onerror = reject;
          img.src = url;
        });
      }

      setCopied((prev) => ({
        ...prev,
        [chartId]: {
          ...prev[chartId],
          [format]: true,
        },
      }));
      setTimeout(() => {
        setCopied((prev) => ({
          ...prev,
          [chartId]: {
            ...prev[chartId],
            [format]: false,
          },
        }));
      }, 500);
    } catch (err) {
      // Error saat copy chart, tidak perlu aksi toast
    }
  };

  const handleDownloadChart = async (
    chartId: string,
    format: "svg" | "png"
  ) => {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) return;

    const svgElement = chartElement.querySelector("svg");
    if (!svgElement) return;

    try {
      if (format === "svg") {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${chartId}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img: HTMLImageElement = document.createElement("img");
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          if (ctx) {
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          }
          const pngUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = pngUrl;
          link.download = `${chartId}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        };
        img.src = url;
      }
    } catch (err) {
      // Error saat download chart, tidak perlu aksi toast
    }
  };

  useEffect(() => {
    console.log("data di kontainer", parsedData);
    if (parsedData && parsedData.charts && Array.isArray(parsedData.charts)) {
      const nodes = parsedData.charts.map(
        (chartData: ChartData, index: number) => {
          const {
            chartType,
            chartData: chartDataPoints,
            chartConfig,
            chartMetadata,
          } = chartData;
          const width = chartConfig?.width || chartDimensions.width;
          const height = chartConfig?.height || chartDimensions.height;
          const useAxis = chartConfig?.useAxis ?? true;
          let chartNode: HTMLElement | SVGElement | null = null;
          switch (chartType) {
            case "Vertical Bar Chart":
              chartNode = chartUtils.createVerticalBarChart2(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Vertical Bar Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Horizontal Bar Chart":
              chartNode = chartUtils.createHorizontalBarChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                chartConfig?.chartColor?.[0] || "hsl(var(--primary))",
                0.007,
                {
                  title: chartMetadata?.title || "Horizontal Bar Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions
              );
              break;
            case "Pie Chart":
              chartNode = chartUtils.createPieChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Pie Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.chartColor
              );
              break;
            case "Scatter Plot":
              chartNode = chartUtils.createScatterPlot(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Scatter Plot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Scatter Plot With Fit Line":
              chartNode = chartUtils.createScatterPlotWithFitLine(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Scatter Plot With Fit Line",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Line Chart":
              chartNode = chartUtils.createLineChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Line Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Area Chart":
              chartNode = chartUtils.createAreaChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Area Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Vertical Stacked Bar Chart":
              chartNode = chartUtils.createVerticalStackedBarChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Vertical Stacked Bar Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Horizontal Stacked Bar Chart":
              chartNode = chartUtils.createHorizontalStackedBarChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Horizontal Stacked Bar Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Clustered Bar Chart":
              chartNode = chartUtils.createClusteredBarChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Clustered Bar Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Multiple Line Chart":
              chartNode = chartUtils.createMultilineChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Multiple Line Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Boxplot":
              chartNode = chartUtils.createBoxplot(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Boxplot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Histogram":
              chartNode = chartUtils.createHistogram(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Histogram",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Error Bar Chart":
              chartNode = chartUtils.createErrorBarChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Error Bar Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Stacked Area Chart":
              chartNode = chartUtils.createStackedAreaChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Stacked Area Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Grouped Scatter Plot":
              chartNode = chartUtils.createGroupedScatterPlot(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Grouped Scatter Plot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Dot Plot":
              chartNode = chartUtils.createDotPlot(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Dot Plot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Frequency Polygon":
              chartNode = chartUtils.createFrequencyPolygon(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Frequency Polygon",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Population Pyramid":
              chartNode = chartUtils.createPopulationPyramid(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Population Pyramid",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Clustered Error Bar Chart":
              chartNode = chartUtils.createClusteredErrorBarChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Clustered Error Bar Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Stacked Histogram":
              chartNode = chartUtils.createStackedHistogram(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Clustered Error Bar Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.chartColor
              );
              break;
            case "Scatter Plot Matrix":
              chartNode = chartUtils.createScatterPlotMatrix(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Scatter Plot Matrix",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.chartColor
              );
              break;
            case "Clustered Boxplot":
              chartNode = chartUtils.createClusteredBoxplot(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Clustered Boxplot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "1-D Boxplot":
              chartNode = chartUtils.create1DBoxplot(
                chartDataPoints,
                width,
                height,
                useAxis
              );
              break;
            case "Simple Range Bar":
              chartNode = chartUtils.createSimpleRangeBar(
                chartDataPoints,
                width,
                height,
                useAxis
              );
              break;
            case "Clustered Range Bar":
              chartNode = chartUtils.createClusteredRangeBar(
                chartDataPoints,
                width,
                height,
                useAxis
              );
              break;
            case "High-Low-Close Chart":
              chartNode = chartUtils.createHighLowCloseChart(
                chartDataPoints,
                width,
                height,
                useAxis
              );
              break;
            case "Difference Area":
              chartNode = chartUtils.createDifferenceArea(
                chartDataPoints,
                width,
                height,
                useAxis
              );
              break;
            case "Drop Line Chart":
              chartNode = chartUtils.createDropLineChart(
                chartDataPoints,
                width,
                height,
                useAxis
              );
              break;
            case "Summary Point Plot":
              chartNode = chartUtils.createSummaryPointPlot(
                chartDataPoints,
                width,
                height,
                useAxis
              );
              break;
            case "Vertical Bar & Line Chart":
              chartNode = chartUtils.createBarAndLineChart(
                chartDataPoints,
                width,
                height,
                useAxis
              );
              break;
            case "Vertical Bar & Line Chart2":
              chartNode = chartUtils.createBarAndLineChart2(
                chartDataPoints,
                width,
                height,
                useAxis
              );
              break;
            case "Dual Axes Scatter Plot":
              chartNode = chartUtils.createDualAxesScatterPlot(
                chartDataPoints,
                width,
                height,
                useAxis
              );
              break;
            case "3D Bar Chart2":
              chartNode = chartUtils.create3DBarChart2(
                chartDataPoints,
                width,
                height
              );
              break;
            case "Clustered 3D Bar Chart":
              chartNode = chartUtils.createClustered3DBarChart(
                chartDataPoints,
                width,
                height
              );
              break;
            case "Stacked 3D Bar Chart":
              chartNode = chartUtils.createStacked3DBarChart(
                chartDataPoints,
                width,
                height
              );
              break;
            case "3D Scatter Plot":
              chartNode = chartUtils.create3DScatterPlot(
                chartDataPoints,
                width,
                height
              );
              break;
            case "Grouped 3D Scatter Plot":
              chartNode = chartUtils.createGrouped3DScatterPlot(
                chartDataPoints,
                width,
                height
              );
              break;
            case "Density Chart":
              chartNode = chartUtils.createDensityChart(
                chartDataPoints,
                width,
                height,
                useAxis
              );
              break;
            case "Violin Plot":
              chartNode = chartUtils.createViolinPlot(
                chartDataPoints,
                width,
                height,
                useAxis
              );
              break;
            case "Stem And Leaf Plot":
              chartNode = chartUtils.createStemAndLeafPlot(
                chartDataPoints as unknown as { [stem: string]: number[] },
                width,
                height,
                useAxis
              );
              break;
            default:
              console.warn(`Unsupported chart type: ${chartType}`);
          }
          const uniqueId = `chart-${Date.now()}-${index}`;
          return { id: uniqueId, chartNode, chartType, width, height };
        }
      );
      setChartNodes(nodes);
    }
  }, [data, chartDimensions]);

  // Menentukan ukuran kontainer berdasarkan dimensi chart
  const containerStyle = {
    width: `${chartDimensions.width}px`,
    height: `${chartDimensions.height}px`,
    position: "relative" as const,
  };

  return (
    <div>
      {chartNodes.map(({ id, chartNode, chartType, width, height }, idx) => (
        <div
          key={id}
          className="relative group mb-8"
          style={{ minHeight: 400 }}
          onMouseEnter={() => {
            if (actionTimers.current[id])
              clearTimeout(actionTimers.current[id]!);
            actionTimers.current[id] = setTimeout(() => {
              setActionsHidden((prev) => ({ ...prev, [id]: true }));
            }, 3000);
          }}
          onMouseLeave={() => {
            if (actionTimers.current[id])
              clearTimeout(actionTimers.current[id]!);
            setActionsHidden((prev) => ({ ...prev, [id]: false }));
          }}
        >
          <div
            className={
              "flex justify-end gap-2 mb-2 transition-opacity chart-actions " +
              (actionsHidden[id]
                ? "opacity-0"
                : "opacity-0 group-hover:opacity-100 pointer-events-auto")
            }
            onMouseEnter={() => {
              if (actionTimers.current[id])
                clearTimeout(actionTimers.current[id]!);
              setActionsHidden((prev) => ({ ...prev, [id]: false }));
            }}
            onMouseLeave={() => {
              actionTimers.current[id] = setTimeout(() => {
                setActionsHidden((prev) => ({ ...prev, [id]: true }));
              }, 3000);
            }}
          >
            <button
              className={`p-2 bg-white rounded-md shadow-sm hover:bg-gray-100 ${
                copied[id]?.svg ? "text-green-600" : ""
              } ${
                actionsHidden[id] ? "pointer-events-none cursor-default" : ""
              }`}
              onClick={() => handleCopyChart(id, "svg")}
              title="Copy as SVG"
            >
              {copied[id]?.svg ? (
                <Check className="w-4 h-4 inline-block mr-1" />
              ) : (
                <Copy className="w-4 h-4 inline-block mr-1" />
              )}
              <FileType className="w-4 h-4 inline-block mr-1" />
              <span className="text-xs">SVG</span>
            </button>
            <button
              className={`p-2 bg-white rounded-md shadow-sm hover:bg-gray-100 ${
                copied[id]?.png ? "text-green-600" : ""
              } ${
                actionsHidden[id] ? "pointer-events-none cursor-default" : ""
              }`}
              onClick={() => handleCopyChart(id, "png")}
              title="Copy as PNG"
            >
              {copied[id]?.png ? (
                <Check className="w-4 h-4 inline-block mr-1" />
              ) : (
                <Copy className="w-4 h-4 inline-block mr-1" />
              )}
              <Image className="w-4 h-4 inline-block mr-1" />
              <span className="text-xs">PNG</span>
            </button>
            <button
              className={`p-2 bg-white rounded-md shadow-sm hover:bg-gray-100 ${
                actionsHidden[id] ? "pointer-events-none cursor-default" : ""
              }`}
              onClick={() => handleDownloadChart(id, "svg")}
              title="Download as SVG"
            >
              <Download className="w-4 h-4 inline-block mr-1" />
              <FileType className="w-4 h-4 inline-block mr-1" />
              <span className="text-xs">SVG</span>
            </button>
            <button
              className={`p-2 bg-white rounded-md shadow-sm hover:bg-gray-100 ${
                actionsHidden[id] ? "pointer-events-none cursor-default" : ""
              }`}
              onClick={() => handleDownloadChart(id, "png")}
              title="Download as PNG"
            >
              <Download className="w-4 h-4 inline-block mr-1" />
              <Image className="w-4 h-4 inline-block mr-1" />
              <span className="text-xs">PNG</span>
            </button>
            {/* <button
              className={`p-2 bg-white rounded-md shadow-sm hover:bg-gray-100 ${
                actionsHidden[id] ? "pointer-events-none cursor-default" : ""
              }`}
              onClick={() => {
                setPreviewChart(
                  chartNode
                    ? (chartNode.cloneNode(true) as HTMLElement | SVGElement)
                    : null
                );
                setPreviewOpen(true);
              }}
              title="Preview Chart"
            >
              <View className="w-4 h-4" />
            </button> */}
          </div>
          <div className="w-full h-full flex items-center justify-center">
            <div
              id={id}
              style={{
                width: width,
                height: height,
              }}
            >
              {/* Render chartNode as HTML */}
              {chartNode && (
                <div
                  ref={(el) => {
                    if (el && chartNode) {
                      el.innerHTML = "";
                      el.appendChild(chartNode);
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      ))}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex flex-col items-center justify-center max-w-4xl w-full h-[80vh]">
          {previewChart && (
            <div className="overflow-auto w-full h-full flex items-center justify-center">
              <div
                ref={(el) => {
                  if (el && previewChart) {
                    el.innerHTML = "";
                    el.appendChild(previewChart);
                  }
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default React.memo(
  GeneralChartContainer,
  (prevProps, nextProps) =>
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
);
