import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { chartUtils } from "@/utils/chartBuilder/chartTypes/chartUtils";

import * as d3 from "d3";
import { ChartType } from "@/components/Modals/Graphs/ChartTypes";
import { chartVariableConfig } from "./ChartVariableConfig";
import clsx from "clsx";
import { ChartService, DataProcessingService } from "@/services/chart";
import GeneralChartContainer from "@/components/Output/Chart/GeneralChartContainer";
import { groupBy } from "lodash";
import { DataProcessingInput } from "@/services/chart/DataProcessingService";
import { type ErrorBarOptions } from "@/services/chart/DataProcessingService";

interface ChartPreviewProps {
  chartType: ChartType;
  width: number;
  height: number;
  useaxis: boolean;
  sideVariables: string[];
  side2Variables: string[];
  bottomVariables: string[];
  bottom2Variables: string[];
  colorVariables: string[];
  filterVariables: string[];
  lowVariables: string[];
  highVariables: string[];
  closeVariables: string[];
  onDropSide: (variables: string[]) => void;
  onDropSide2: (variables: string[]) => void;
  onDropBottom: (variables: string[]) => void;
  onDropBottom2: (variables: string[]) => void;
  onDropColor: (variables: string[]) => void;
  onDropFilter: (variables: string[]) => void;
  onDropLow: (variables: string[]) => void;
  onDropHigh: (variables: string[]) => void;
  onDropClose: (variables: string[]) => void;
  handleRemoveVariable: (
    type: "side" | "bottom" | "low" | "high" | "close" | "side2" | "bottom2",
    index: number
  ) => void;
  validateChartVariables: (
    chartType: ChartType,
    sideVariables: string[],
    bottomVariables: string[],
    lowVariables: string[],
    highVariables: string[],
    closeVariables: string[]
  ) => boolean;
  // Add new props for chart customization
  chartTitle?: string;
  chartSubtitle?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  // Tambahkan props baru untuk dual Y axis
  yLeftAxisLabel?: string;
  yRightAxisLabel?: string;
  // Tambahkan props baru untuk axis scale
  xAxisMin?: string;
  xAxisMax?: string;
  xAxisMajorIncrement?: string;
  xAxisOrigin?: string;
  yAxisMin?: string;
  yAxisMax?: string;
  yAxisMajorIncrement?: string;
  yAxisOrigin?: string;
  // Tambahkan props untuk Y axis kanan (dual axis)
  yRightAxisMin?: string;
  yRightAxisMax?: string;
  yRightAxisMajorIncrement?: string;
  yRightAxisOrigin?: string;
  // Tambahkan props untuk Z axis (3D charts)
  zAxisLabel?: string;
  zAxisMin?: string;
  zAxisMax?: string;
  zAxisMajorIncrement?: string;
  zAxisOrigin?: string;
  // Tambahkan prop chartColors
  chartColors?: string[];
  chartTitleFontSize?: number;
  chartSubtitleFontSize?: number;
  // Add prop for statistic selection (Summary Point Plot)
  selectedStatistic?: "mean" | "median" | "mode" | "min" | "max";
  errorBarOptions?: ErrorBarOptions;
}

// Definisi interface untuk data chart
interface ChartData {
  category: string;
  subcategory?: string;
  value: number;
  error?: number;
  x?: number;
  y?: number;
  color?: string | number | null;
  group?: string;
  [key: string]: any;
}

export interface ChartPreviewRef {
  getGeneratedChartJSON: () => any;
}

const ChartPreview = forwardRef<ChartPreviewRef, ChartPreviewProps>(
  (
    {
      chartType,
      width,
      height,
      useaxis,
      sideVariables,
      side2Variables,
      bottomVariables,
      bottom2Variables,
      colorVariables,
      filterVariables,
      lowVariables,
      highVariables,
      closeVariables,
      onDropSide,
      onDropSide2,
      onDropBottom,
      onDropBottom2,
      onDropColor,
      onDropFilter,
      onDropLow,
      onDropHigh,
      onDropClose,
      handleRemoveVariable,
      validateChartVariables,
      chartTitle,
      chartSubtitle,
      xAxisLabel,
      yAxisLabel,
      yLeftAxisLabel,
      yRightAxisLabel,
      xAxisMin,
      xAxisMax,
      xAxisMajorIncrement,
      xAxisOrigin,
      yAxisMin,
      yAxisMax,
      yAxisMajorIncrement,
      yAxisOrigin,
      yRightAxisMin,
      yRightAxisMax,
      yRightAxisMajorIncrement,
      yRightAxisOrigin,
      zAxisLabel,
      zAxisMin,
      zAxisMax,
      zAxisMajorIncrement,
      zAxisOrigin,
      chartColors,
      chartTitleFontSize,
      chartSubtitleFontSize,
      selectedStatistic,
      errorBarOptions,
    },
    ref
  ) => {
    // Debug: Log received props
    console.log("🎭 ChartPreview props received:", {
      chartType,
      selectedStatistic,
      hasStatistic: selectedStatistic !== undefined,
    });

    const [modalType, setModalType] = useState<
      | "side"
      | "bottom"
      | "low"
      | "high"
      | "close"
      | "side2"
      | "bottom2"
      | "color"
      | "filter"
    >("side");
    const [chartServiceOutput, setChartServiceOutput] = useState<any>(null);
    const [showChartServiceTest, setShowChartServiceTest] = useState(false);

    // Tambahkan state untuk menyimpan hasil DataProcessingService
    const [processedResult, setProcessedResult] = useState<{
      data: any[];
      axisInfo: Record<string, string>;
    }>({
      data: [],
      axisInfo: {},
    });

    // Add state to store the generated JSON for ChartBuilderModal
    const [generatedChartJSON, setGeneratedChartJSON] = useState<any>(null);

    // Tambahkan state untuk menyimpan hasil DataProcessingService
    const data = useDataStore((state) => state.data);

    const variables = useVariableStore.getState().variables;

    // Function to generate chart JSON using DataProcessingService + ChartService
    const generateChartJSON = useCallback(() => {
      // Check if we have basic data
      if (data.length === 0) {
        console.log("⚠️ No data available");
        setGeneratedChartJSON(null);
        return;
      }

      console.log("🔍 Data available:", data.length, "rows");
      console.log("🔍 Variables available:", variables.length, "variables");

      // Smart validation based on chart type requirements
      const hasValidVariables = validateChartVariablesForType(
        chartType,
        sideVariables,
        bottomVariables,
        lowVariables,
        highVariables,
        closeVariables,
        side2Variables,
        bottom2Variables,
        colorVariables
      );

      if (!hasValidVariables) {
        console.log("⚠️ Invalid variables for chart type:", chartType);
        setGeneratedChartJSON(null);
        return;
      }

      console.log("✅ Variables validation passed");

      try {
        // Use the already processed data from state
        if (processedResult.data.length > 0) {
          // Create chart variables object
          const chartVariables = {
            x: bottomVariables,
            y: chartType.includes("3D") ? bottomVariables : sideVariables,
            groupBy: colorVariables,
            low: lowVariables,
            high: highVariables,
            close: closeVariables,
            z: chartType.includes("3D") ? sideVariables : bottom2Variables,
            y2: side2Variables,
          };

          // Step 2: Create chart JSON menggunakan ChartService (reuse processed data)
          const chartJSON = ChartService.createChartJSON({
            chartType: chartType,
            chartData: processedResult.data,
            chartVariables: chartVariables,
            chartMetadata: {
              title: chartTitle || `${chartType}`,
              subtitle:
                chartSubtitle ||
                `Showing distribution of ${sideVariables[0] || ""} across ${
                  bottomVariables[0] || ""
                } categories`,
              description: `${chartType} showing data distribution`,
              titleFontSize: chartTitleFontSize || 24,
              subtitleFontSize: chartSubtitleFontSize || 14,
              axisInfo: processedResult.axisInfo,
            },
            chartConfig: {
              chartColor: chartColors,
              width: chartType === "Scatter Plot Matrix" ? 1000 : 800,
              height: chartType === "Scatter Plot Matrix" ? 750 : 600,
              useAxis: useaxis,
              useLegend: true,
              statistic: selectedStatistic,
              axisLabels: {
                x: xAxisLabel || bottomVariables[0] || "Category",
                y: yAxisLabel || sideVariables[0] || "Value",
                y1: yLeftAxisLabel || sideVariables[0] || "Y1-axis",
                y2: yRightAxisLabel || side2Variables[0] || "Y2-axis",
                z: chartType.includes("3D")
                  ? zAxisLabel || bottom2Variables[0] || "Z-axis"
                  : undefined,
              },
              axisScaleOptions: {
                x: {
                  min: xAxisMin,
                  max: xAxisMax,
                  majorIncrement: xAxisMajorIncrement,
                  origin: xAxisOrigin,
                },
                y: {
                  min: yAxisMin,
                  max: yAxisMax,
                  majorIncrement: yAxisMajorIncrement,
                  origin: yAxisOrigin,
                },
                y1: {
                  min: yAxisMin,
                  max: yAxisMax,
                  majorIncrement: yAxisMajorIncrement,
                  origin: yAxisOrigin,
                },
                y2: {
                  min: yRightAxisMin,
                  max: yRightAxisMax,
                  majorIncrement: yRightAxisMajorIncrement,
                  origin: yRightAxisOrigin,
                },
                z: chartType.includes("3D")
                  ? {
                      min: zAxisMin,
                      max: zAxisMax,
                      majorIncrement: zAxisMajorIncrement,
                      origin: zAxisOrigin,
                    }
                  : undefined,
              },
            },
          });

          // Store the generated JSON for ChartBuilderModal to use
          setGeneratedChartJSON(chartJSON);
          console.log("✅ Chart JSON generated and stored:", chartJSON);
        } else {
          setGeneratedChartJSON(null);
          console.log("⚠️ No processed data available");
        }
      } catch (error) {
        console.error("❌ Error generating chart JSON:", error);
        setGeneratedChartJSON(null);
      }
    }, [
      data,
      variables,
      chartType,
      bottomVariables,
      sideVariables,
      colorVariables,
      lowVariables,
      highVariables,
      closeVariables,
      bottom2Variables,
      side2Variables,
      processedResult,
      chartTitle,
      chartSubtitle,
      chartTitleFontSize,
      chartSubtitleFontSize,
      xAxisLabel,
      yAxisLabel,
      yLeftAxisLabel,
      yRightAxisLabel,
      zAxisLabel,
      xAxisMin,
      xAxisMax,
      xAxisMajorIncrement,
      xAxisOrigin,
      yAxisMin,
      yAxisMax,
      yAxisMajorIncrement,
      yAxisOrigin,
      yRightAxisMin,
      yRightAxisMax,
      yRightAxisMajorIncrement,
      yRightAxisOrigin,
      zAxisMin,
      zAxisMax,
      zAxisMajorIncrement,
      zAxisOrigin,
      selectedStatistic,
      chartColors,
      useaxis,
    ]);

    // Smart validation function for different chart types
    const validateChartVariablesForType = (
      chartType: string,
      sideVariables: string[],
      bottomVariables: string[],
      lowVariables: string[],
      highVariables: string[],
      closeVariables: string[],
      side2Variables: string[],
      bottom2Variables: string[],
      colorVariables: string[]
    ): boolean => {
      // Chart type specific validation rules
      switch (chartType) {
        case "Vertical Bar Chart":
        case "Horizontal Bar Chart":
        case "Line Chart":
        case "Area Chart":
          // Need at least X-axis (bottom) OR Y-axis (side)
          return bottomVariables.length > 0 || sideVariables.length > 0;

        case "Scatter Plot":
          // Need both X and Y variables
          return bottomVariables.length > 0 && sideVariables.length > 0;

        case "Bubble Chart":
          // Need X, Y, and size (could be side2 or color)
          return (
            bottomVariables.length > 0 &&
            sideVariables.length > 0 &&
            (side2Variables.length > 0 || colorVariables.length > 0)
          );

        case "3D Scatter Plot":
          // Need X, Y, and Z
          return (
            bottomVariables.length > 0 &&
            sideVariables.length > 0 &&
            bottom2Variables.length > 0
          );

        default:
          // Default: need at least one variable
          return (
            sideVariables.length > 0 ||
            bottomVariables.length > 0 ||
            lowVariables.length > 0 ||
            highVariables.length > 0 ||
            closeVariables.length > 0
          );
      }
    };

    // Generate chart JSON whenever relevant props change
    useEffect(() => {
      generateChartJSON();
    }, [generateChartJSON]);

    // const [errorMsg, setErrorMsg] = useState<string | null>(null);
    // const [isCalculating, setIsCalculating] = useState(false);
    // const svgRef = useRef<SVGSVGElement | null>(null);
    const chartContainerRef = useRef<HTMLDivElement | null>(null);

    const [modalState, setModalState] = useState<{
      type: string | null;
      isOpen: boolean;
    }>({
      type: null,
      isOpen: false,
    });
    const variablesToShow =
      modalState.type === "side"
        ? sideVariables
        : modalState.type === "side2"
        ? side2Variables
        : modalState.type === "bottom"
        ? bottomVariables
        : modalState.type === "bottom2"
        ? bottom2Variables
        : modalState.type === "color"
        ? colorVariables
        : modalState.type === "filter"
        ? filterVariables
        : modalState.type === "low"
        ? lowVariables
        : modalState.type === "high"
        ? highVariables
        : modalState.type === "close"
        ? closeVariables
        : [];

    // Fungsi untuk membuka modal
    const handleOpenModal = (
      type:
        | "side"
        | "bottom"
        | "low"
        | "high"
        | "close"
        | "side2"
        | "bottom2"
        | "color"
        | "filter"
    ) => {
      setModalState({ type, isOpen: true });
    };

    // Fungsi untuk menutup modal
    const handleCloseModal = () => {
      setModalState({ type: null, isOpen: false });
    };

    // Fungsi untuk menangani drag over
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault(); // Mengizinkan drop
    };

    const handleDrop = (
      e: React.DragEvent<HTMLDivElement>,
      dropZone:
        | "side"
        | "bottom"
        | "color"
        | "filter"
        | "high"
        | "low"
        | "close"
        | "side2"
        | "bottom2"
    ) => {
      e.preventDefault();
      const variableName = e.dataTransfer.getData("text/plain");

      if (!variableName) {
        console.warn("No variable detected in drag event");
        return;
      }

      // Ambil konfigurasi chartType saat ini
      const config = chartVariableConfig[chartType];

      if (dropZone === "side" && config.side.max > 0) {
        if (sideVariables.length >= config.side.max) {
          // Jika sudah mencapai maksimum, ganti variabel pertama
          const updatedSideVariables = [variableName];
          onDropSide(updatedSideVariables);
          console.log(`Replacing side variables with: ${updatedSideVariables}`);
        } else {
          // Tambahkan variabel jika belum penuh
          const updatedSideVariables = [...sideVariables, variableName];
          onDropSide(updatedSideVariables);
          console.log(`Added to side variables: ${updatedSideVariables}`);
        }
      } else if (dropZone === "bottom" && config.bottom.max > 0) {
        if (bottomVariables.length >= config.bottom.max) {
          // Jika sudah mencapai maksimum, ganti variabel pertama
          const updatedBottomVariables = [variableName];
          onDropBottom(updatedBottomVariables);
          console.log(
            `Replacing bottom variables with: ${updatedBottomVariables}`
          );
        } else {
          // Tambahkan variabel jika belum penuh
          const updatedBottomVariables = [...bottomVariables, variableName];
          onDropBottom(updatedBottomVariables);
          console.log(`Added to bottom variables: ${updatedBottomVariables}`);
        }
      } else if (dropZone === "color" && config.color && config.color.max > 0) {
        if (colorVariables.length >= config.color?.max) {
          const updatedColorVariables = [variableName];
          onDropColor(updatedColorVariables);
          console.log(
            `Replacing color variables with: ${updatedColorVariables}`
          );
        } else {
          const updatedColorVariables = [...colorVariables, variableName];
          onDropColor(updatedColorVariables);
          console.log(`Added to color variables: ${updatedColorVariables}`);
        }
      } else if (
        dropZone === "filter" &&
        config.filter &&
        config.filter.max > 0
      ) {
        if (filterVariables.length >= config.filter?.max) {
          const updatedFilterVariables = [variableName];
          onDropFilter(updatedFilterVariables);
          console.log(
            `Replacing filter variables with: ${updatedFilterVariables}`
          );
        } else {
          const updatedFilterVariables = [...filterVariables, variableName];
          onDropFilter(updatedFilterVariables);
          console.log(`Added to filter variables: ${updatedFilterVariables}`);
        }
      } else if (dropZone === "low" && config.low && config.low.max > 0) {
        if (lowVariables.length >= config.low.max) {
          const updatedLowVariables = [variableName];
          onDropLow(updatedLowVariables);
          console.log(`Replacing low variables with: ${updatedLowVariables}`);
        } else {
          const updatedLowVariables = [...lowVariables, variableName];
          onDropLow(updatedLowVariables);
          console.log(`Added to low variables: ${updatedLowVariables}`);
        }
      } else if (dropZone === "high" && config.high && config.high.max > 0) {
        if (highVariables.length >= config.high.max) {
          const updatedHighVariables = [variableName];
          onDropHigh(updatedHighVariables);
          console.log(`Replacing high variables with: ${updatedHighVariables}`);
        } else {
          const updatedHighVariables = [...highVariables, variableName];
          onDropHigh(updatedHighVariables);
          console.log(`Added to high variables: ${updatedHighVariables}`);
        }
      } else if (dropZone === "close" && config.close && config.close.max > 0) {
        if (closeVariables.length >= config.close.max) {
          const updatedCloseVariables = [variableName];
          onDropClose(updatedCloseVariables);
          console.log(
            `Replacing close variables with: ${updatedCloseVariables}`
          );
        } else {
          const updatedCloseVariables = [...closeVariables, variableName];
          onDropClose(updatedCloseVariables);
          console.log(`Added to close variables: ${updatedCloseVariables}`);
        }
      } else if (dropZone === "side2" && config.side2 && config.side2.max > 0) {
        if (side2Variables.length >= config.side2.max) {
          const updatedSide2Variables = [variableName];
          onDropSide2(updatedSide2Variables);
          console.log(
            `Replacing side2 variables with: ${updatedSide2Variables}`
          );
        } else {
          const updatedSide2Variables = [...side2Variables, variableName];
          onDropSide2(updatedSide2Variables);
          console.log(`Added to side2 variables: ${updatedSide2Variables}`);
        }
      } else if (
        dropZone === "bottom2" &&
        config.bottom2 &&
        config.bottom2.max > 0
      ) {
        if (bottom2Variables.length >= config.bottom2.max) {
          const updatedBottom2Variables = [variableName];
          onDropBottom2(updatedBottom2Variables);
          console.log(
            `Replacing bottom2 variables with: ${updatedBottom2Variables}`
          );
        } else {
          const updatedBottom2Variables = [...bottom2Variables, variableName];
          onDropBottom2(updatedBottom2Variables);
          console.log(`Added to bottom2 variables: ${updatedBottom2Variables}`);
        }
      } else {
        console.log(`Penambahan ${dropZone} tidak diizinkan`);
      }
    };

    // Helper function untuk membuat chart configuration
    const createChartConfig = useCallback(
      (chartType: string, isDefault: boolean = false) => {
        const simpleChartData = [
          { category: "A", value: 30 },
          { category: "B", value: 80 },
          { category: "C", value: 45 },
          { category: "D", value: 60 },
          { category: "E", value: 20 },
          { category: "F", value: 90 },
        ];

        const stackedChartData = [
          { category: "male", subcategory: "blue", value: 30 },
          { category: "male", subcategory: "white", value: 20 },
          { category: "male", subcategory: "green", value: 10 },
          { category: "female", subcategory: "blue", value: 25 },
          { category: "female", subcategory: "white", value: 15 },
          { category: "female", subcategory: "green", value: 10 },
        ];

        const lineChartData = [
          { category: "Jan", value: 10 },
          { category: "Feb", value: 30 },
          { category: "Mar", value: 55 },
          { category: "Apr", value: 60 },
          { category: "Mei", value: 70 },
          { category: "Jun", value: 90 },
          { category: "Jul", value: 55 },
          { category: "Agu", value: 30 },
          { category: "Sep", value: 50 },
          { category: "Okt", value: 20 },
          { category: "Nov", value: 25 },
          { category: "Des", value: 25 },
        ];

        const multipleLineChartData = [
          { category: "Product A", subcategory: "Division 1", value: 30 },
          { category: "Product A", subcategory: "Division 2", value: 20 },
          { category: "Product B", subcategory: "Division 1", value: 25 },
          { category: "Product B", subcategory: "Division 2", value: 15 },
          { category: "Product C", subcategory: "Division 1", value: 40 },
          { category: "Product C", subcategory: "Division 2", value: 10 },
        ];

        const histogramData = [5, 8, 9, 7, 3, 6, 3, 7, 3, 2, 9, 1, 4, 2, 5];

        const scatterPlotData = [
          { x: 15, y: 50 },
          { x: 20, y: 200 },
          { x: 60, y: 100 },
          { x: 200, y: 325 },
          { x: 80, y: 150 },
          { x: 130, y: 275 },
          { x: 50, y: 220 },
          { x: 170, y: 300 },
          { x: 100, y: 30 },
          { x: 170, y: 125 },
          { x: 150, y: 80 },
          { x: 100, y: 190 },
          { x: 95, y: 75 },
        ];

        const boxplotData = [
          { category: "A", value: 20 },
          { category: "A", value: 40 },
          { category: "A", value: 60 },
          { category: "A", value: 80 },
          { category: "B", value: 30 },
          { category: "B", value: 50 },
          { category: "B", value: 70 },
          { category: "B", value: 90 },
        ];

        const scatterPlotMatrixData = [
          { A: 15, B: 50, C: 20 },
          { A: 20, B: 200, C: 30 },
          { A: 60, B: 100, C: 70 },
          { A: 200, B: 325, C: 180 },
          { A: 80, B: 150, C: 60 },
          { A: 130, B: 275, C: 110 },
        ];

        const defaultData: Record<string, any[]> = {
          "Vertical Bar Chart": simpleChartData,
          "Horizontal Bar Chart": simpleChartData,
          "Vertical Stacked Bar Chart": stackedChartData,
          "Horizontal Stacked Bar Chart": stackedChartData,
          "Clustered Bar Chart": stackedChartData,
          "Line Chart": lineChartData,
          "Multiple Line Chart": multipleLineChartData,
          "Pie Chart": simpleChartData,
          "Area Chart": lineChartData,
          Histogram: histogramData,
          "Scatter Plot": scatterPlotData,
          "Scatter Plot With Fit Line": scatterPlotData,
          Boxplot: boxplotData,
          "Scatter Plot Matrix": scatterPlotMatrixData,
          "Error Bar Chart": [
            {
              category: "Group A",
              subcategory: "Control",
              value: 25,
              error: 5,
            },
            {
              category: "Group A",
              subcategory: "Treatment",
              value: 30,
              error: 3,
            },
            {
              category: "Group B",
              subcategory: "Control",
              value: 20,
              error: 4,
            },
            {
              category: "Group B",
              subcategory: "Treatment",
              value: 35,
              error: 6,
            },
            {
              category: "Group C",
              subcategory: "Control",
              value: 28,
              error: 2,
            },
            {
              category: "Group C",
              subcategory: "Treatment",
              value: 32,
              error: 4,
            },
          ],
          "Stacked Area Chart": [
            { category: "Sun", subcategory: "Product 1", value: 30 },
            { category: "Sun", subcategory: "Product 2", value: 20 },
            { category: "Sun", subcategory: "Product 3", value: 25 },
            { category: "Mon", subcategory: "Product 1", value: 15 },
            { category: "Mon", subcategory: "Product 2", value: 40 },
            { category: "Mon", subcategory: "Product 3", value: 10 },
            { category: "Tue", subcategory: "Product 1", value: 20 },
            { category: "Tue", subcategory: "Product 2", value: 30 },
            { category: "Tue", subcategory: "Product 3", value: 15 },
            { category: "Wed", subcategory: "Product 1", value: 10 },
            { category: "Wed", subcategory: "Product 2", value: 25 },
            { category: "Wed", subcategory: "Product 3", value: 40 },
          ],
          "Grouped Scatter Plot": [
            { category: "A", x: 5.1, y: 3.5 },
            { category: "B", x: 4.9, y: 3.0 },
            { category: "A", x: 4.7, y: 3.2 },
            { category: "C", x: 4.6, y: 3.1 },
            { category: "B", x: 5.0, y: 3.6 },
            { category: "C", x: 5.4, y: 3.9 },
            { category: "A", x: 4.6, y: 3.4 },
            { category: "B", x: 5.0, y: 3.4 },
            { category: "C", x: 4.4, y: 2.9 },
            { category: "A", x: 4.9, y: 3.1 },
            { category: "B", x: 5.4, y: 3.7 },
            { category: "C", x: 4.8, y: 3.4 },
            { category: "A", x: 4.8, y: 3.0 },
            { category: "B", x: 4.3, y: 3.0 },
            { category: "C", x: 5.8, y: 4.0 },
            { category: "A", x: 5.7, y: 4.4 },
            { category: "B", x: 5.4, y: 3.9 },
            { category: "C", x: 5.1, y: 3.5 },
            { category: "A", x: 5.1, y: 3.8 },
            { category: "B", x: 5.0, y: 3.3 },
          ],
          "Dot Plot": [
            { category: "A", value: 10 },
            { category: "B", value: 40 },
            { category: "C", value: 45 },
            { category: "D", value: 55 },
            { category: "E", value: 60 },
            { category: "F", value: 70 },
            { category: "G", value: 80 },
            { category: "H", value: 90 },
          ],
          "Population Pyramid": [
            { category: "0-4", subcategory: "M", value: 9736305 },
            { category: "0-4", subcategory: "F", value: 10031835 },
            { category: "5-9", subcategory: "M", value: 10117913 },
            { category: "5-9", subcategory: "F", value: 10411857 },
            { category: "10-14", subcategory: "M", value: 10470147 },
            { category: "10-14", subcategory: "F", value: 11027820 },
            { category: "15-19", subcategory: "M", value: 10561873 },
            { category: "15-19", subcategory: "F", value: 11094262 },
            { category: "20-24", subcategory: "M", value: 11576412 },
            { category: "20-24", subcategory: "F", value: 10889596 },
            { category: "25-29", subcategory: "M", value: 10625791 },
            { category: "25-29", subcategory: "F", value: 9889569 },
            { category: "30-34", subcategory: "M", value: 9899569 },
            { category: "30-34", subcategory: "F", value: 10330988 },
            { category: "35-39", subcategory: "M", value: 10330988 },
            { category: "35-39", subcategory: "F", value: 10571884 },
            { category: "40-44", subcategory: "M", value: 10571884 },
            { category: "40-44", subcategory: "F", value: 11051409 },
            { category: "45-49", subcategory: "M", value: 10173646 },
            { category: "45-49", subcategory: "F", value: 8824852 },
            { category: "50-54", subcategory: "M", value: 8824852 },
            { category: "50-54", subcategory: "F", value: 6876271 },
            { category: "55-59", subcategory: "M", value: 6876271 },
            { category: "55-59", subcategory: "F", value: 4867513 },
            { category: "60-64", subcategory: "M", value: 4867513 },
            { category: "60-64", subcategory: "F", value: 3416432 },
            { category: "65-69", subcategory: "M", value: 3416432 },
            { category: "65-69", subcategory: "F", value: 2378691 },
            { category: "70-74", subcategory: "M", value: 2378691 },
            { category: "70-74", subcategory: "F", value: 2000771 },
            { category: "75-79", subcategory: "M", value: 2000771 },
            { category: "75-79", subcategory: "F", value: 4313687 },
            { category: "80-84", subcategory: "M", value: 4313687 },
            { category: "80-84", subcategory: "F", value: 3432738 },
          ],
          "Frequency Polygon": histogramData,
          "Clustered Error Bar Chart": [
            { category: "A", subcategory: "A1", value: 20, error: 2 },
            { category: "A", subcategory: "A2", value: 30, error: 3 },
            { category: "A", subcategory: "A3", value: 50, error: 1 },
            { category: "B", subcategory: "A1", value: 25, error: 2 },
            { category: "B", subcategory: "A2", value: 35, error: 3 },
            { category: "B", subcategory: "A3", value: 53, error: 1 },
            { category: "C", subcategory: "A1", value: 22, error: 2 },
            { category: "C", subcategory: "A2", value: 40, error: 1 },
            { category: "C", subcategory: "A3", value: 49, error: 3 },
          ],

          "Stacked Histogram": [
            { value: 10, category: "A" },
            { value: 12, category: "B" },
            { value: 15, category: "A" },
            { value: 18, category: "C" },
            { value: 20, category: "B" },
            { value: 25, category: "C" },
            { value: 30, category: "A" },
            { value: 10, category: "B" },
            { value: 12, category: "C" },
            { value: 15, category: "A" },
            { value: 22, category: "B" },
            { value: 28, category: "C" },
            { value: 32, category: "A" },
            { value: 35, category: "B" },
            { value: 38, category: "C" },
          ],
          "Clustered Boxplot": [
            { category: "A", subcategory: "X", value: 10 },
            { category: "A", subcategory: "X", value: 12 },
            { category: "A", subcategory: "Y", value: 15 },
            { category: "A", subcategory: "Y", value: 18 },
            { category: "B", subcategory: "X", value: 20 },
            { category: "B", subcategory: "X", value: 25 },
            { category: "B", subcategory: "Y", value: 30 },
            { category: "B", subcategory: "Y", value: 35 },
          ],
          "1-D Boxplot": [
            { value: 20 },
            { value: 40 },
            { value: 60 },
            { value: 80 },
            { value: 30 },
            { value: 50 },
            { value: 70 },
            { value: 90 },
          ],
          "Simple Range Bar": [
            { category: "Jan", high: 100, low: 50, close: 75 },
            { category: "Feb", high: 110, low: 60, close: 80 },
            { category: "Mar", high: 120, low: 70, close: 95 },
            { category: "Apr", high: 130, low: 80, close: 100 },
            { category: "May", high: 125, low: 75, close: 110 },
            { category: "Jun", high: 140, low: 90, close: 120 },
            { category: "Jul", high: 150, low: 100, close: 130 },
            { category: "Aug", high: 145, low: 95, close: 125 },
            { category: "Sep", high: 135, low: 85, close: 115 },
            { category: "Oct", high: 125, low: 75, close: 105 },
            { category: "Nov", high: 115, low: 65, close: 95 },
            { category: "Dec", high: 105, low: 55, close: 85 },
          ],
          "Clustered Range Bar": [
            { category: "A", subcategory: "X", low: 20, high: 50, close: 35 },
            { category: "A", subcategory: "Y", low: 25, high: 55, close: 40 },
            { category: "B", subcategory: "X", low: 15, high: 45, close: 30 },
            { category: "B", subcategory: "Y", low: 18, high: 48, close: 33 },
            { category: "C", subcategory: "X", low: 22, high: 60, close: 42 },
            { category: "C", subcategory: "Y", low: 27, high: 65, close: 46 },
            { category: "D", subcategory: "X", low: 12, high: 40, close: 28 },
            { category: "D", subcategory: "Y", low: 14, high: 42, close: 30 },
            { category: "E", subcategory: "X", low: 30, high: 70, close: 50 },
            { category: "E", subcategory: "Y", low: 35, high: 75, close: 55 },
          ],
          "High-Low-Close Chart": [
            { category: "Jan", high: 100, low: 50, close: 75 },
            { category: "Feb", high: 110, low: 60, close: 80 },
            { category: "Mar", high: 120, low: 70, close: 95 },
            { category: "Apr", high: 130, low: 80, close: 100 },
            { category: "May", high: 125, low: 75, close: 110 },
            { category: "Jun", high: 140, low: 90, close: 120 },
            { category: "Jul", high: 150, low: 100, close: 130 },
            { category: "Aug", high: 145, low: 95, close: 125 },
            { category: "Sep", high: 135, low: 85, close: 115 },
            { category: "Oct", high: 125, low: 75, close: 105 },
            { category: "Nov", high: 115, low: 65, close: 95 },
            { category: "Dec", high: 105, low: 55, close: 85 },
          ],
          "Difference Area": [
            { category: "A", value0: 62.7, value1: 63.4 },
            { category: "B", value0: 59.9, value1: 58 },
            { category: "C", value0: 59.1, value1: 53.3 },
            { category: "D", value0: 58.8, value1: 55.7 },
            { category: "E", value0: 58.7, value1: 64.2 },
            { category: "F", value0: 57, value1: 58.8 },
            { category: "G", value0: 56.7, value1: 57.9 },
            { category: "H", value0: 56.8, value1: 61.8 },
            { category: "I", value0: 56.7, value1: 69.3 },
            { category: "J", value0: 60.1, value1: 71.2 },
            { category: "K", value0: 61.1, value1: 68.7 },
            { category: "L", value0: 61.5, value1: 61.8 },
            { category: "M", value0: 64.3, value1: 63 },
            { category: "N", value0: 67.1, value1: 66.9 },
            { category: "O", value0: 64.6, value1: 61.7 },
            { category: "P", value0: 61.6, value1: 61.8 },
            { category: "Q", value0: 61.1, value1: 62.8 },
            { category: "R", value0: 59.2, value1: 60.8 },
            { category: "S", value0: 58.9, value1: 62.1 },
            { category: "T", value0: 57.2, value1: 65.1 },
          ],
          "Vertical Bar & Line Chart": [
            { category: "A", barValue: 20, lineValue: 30 },
            { category: "B", barValue: 40, lineValue: 50 },
            { category: "C", barValue: 60, lineValue: 70 },
            { category: "D", barValue: 40, lineValue: 30 },
            { category: "E", barValue: 30, lineValue: 30 },
            { category: "F", barValue: 70, lineValue: 80 },
          ],
          "Vertical Bar & Line Chart2": [
            {
              category: "AcehHHHHHHHHHHHHHHHHHHHHHHH",
              bars: { nilaiA: 60 },
              lines: { nilaiB1: 40, nilaiB2: 110 },
            },
            {
              category: "Sumatera UtaraAAAAAAAAAAAAAAAA",
              bars: { nilaiA: 45 },
              lines: { nilaiB1: 50, nilaiB2: 120 },
            },
            {
              category: "Sumatera Barat",
              bars: { nilaiA: 70 },
              lines: { nilaiB1: 30, nilaiB2: 105 },
            },
            {
              category: "Riau",
              bars: { nilaiA: 35 },
              lines: { nilaiB1: 60, nilaiB2: 100 },
            },
            {
              category: "Jambi",
              bars: { nilaiA: 55 },
              lines: { nilaiB1: 45, nilaiB2: 115 },
            },
            {
              category: "Sumatera Selatan",
              bars: { nilaiA: 80 },
              lines: { nilaiB1: 20, nilaiB2: 130 },
            },
          ],
          "Drop Line Chart": [
            { x: "A", y: 70, category: "1" },
            { x: "A", y: 15, category: "2" },
            { x: "A", y: 25, category: "3" },
            { x: "B", y: 25, category: "1" },
            { x: "B", y: 45, category: "3" },
            { x: "C", y: 40, category: "1" },
            { x: "D", y: 25, category: "1" },
            { x: "D", y: 60, category: "2" },
            { x: "E", y: 20, category: "1" },
            { x: "E", y: 65, category: "2" },
            { x: "E", y: 80, category: "3" },
          ],
          "Summary Point Plot": [
            { category: "A", value: 25 },
            { category: "A", value: 30 },
            { category: "A", value: 10 },
            { category: "B", value: 28 },
            { category: "B", value: 22 },
            { category: "C", value: 29 },
            { category: "C", value: 32 },
            { category: "D", value: 33 },
          ],
          "Violin Plot": [
            { category: "A", value: 10 },
            { category: "A", value: 15 },
            { category: "A", value: 20 },
            { category: "A", value: 18 },
            { category: "A", value: 12 },
            { category: "A", value: 16 },
            { category: "A", value: 14 },
            { category: "A", value: 22 },
            { category: "B", value: 5 },
            { category: "B", value: 8 },
            { category: "B", value: 6 },
            { category: "B", value: 9 },
            { category: "B", value: 4 },
            { category: "B", value: 7 },
            { category: "B", value: 3 },
            { category: "B", value: 11 },
            { category: "C", value: 22 },
            { category: "C", value: 25 },
            { category: "C", value: 24 },
            { category: "C", value: 23 },
            { category: "C", value: 26 },
            { category: "C", value: 28 },
            { category: "C", value: 21 },
            { category: "C", value: 27 },
          ],
          "Density Chart": Array.from({ length: 100 }, () =>
            Math.round(d3.randomNormal(500, 100)())
          ),
          "Stem And Leaf Plot": [
            { stem: "1", leaves: [2, 5] },
            { stem: "2", leaves: [1, 2, 4] },
            { stem: "3", leaves: [1, 5, 6, 7] },
            { stem: "4", leaves: [2, 6, 7, 8, 9] },
            { stem: "5", leaves: [2, 3, 4, 5, 6, 7, 11] },
            { stem: "6", leaves: [1, 1, 1, 8, 9] },
          ],
        };

        const data = isDefault
          ? defaultData[chartType] || []
          : processedResult.data;

        const title = chartTitle || (isDefault ? chartType : `${chartType}`);
        const subtitle =
          chartSubtitle ||
          (isDefault
            ? "Sample Data"
            : `Showing distribution of ${sideVariables[0] || ""} across ${
                bottomVariables[0] || ""
              } categories`);

        const xLabel =
          xAxisLabel ||
          (isDefault ? "Category" : bottomVariables[0] || "Category");
        const yLabel =
          yAxisLabel || (isDefault ? "Value" : sideVariables[0] || "Value");

        return {
          data,
          title,
          subtitle,
          xLabel,
          yLabel,
          titleConfig: {
            title,
            subtitle,
            titleColor: "hsl(var(--foreground))",
            subtitleColor: "hsl(var(--muted-foreground))",
            titleFontSize: 18,
            subtitleFontSize: 10,
          },
          axisConfig: {
            x: xLabel,
            y: yLabel,
          },
          scaleConfig: {
            x: {
              min: xAxisMin,
              max: xAxisMax,
              majorIncrement: xAxisMajorIncrement,
              origin: xAxisOrigin,
            },
            y: {
              min: yAxisMin,
              max: yAxisMax,
              majorIncrement: yAxisMajorIncrement,
              origin: yAxisOrigin,
            },
          },
        };
      },
      [
        bottomVariables,
        chartSubtitle,
        chartTitle,
        processedResult.data,
        sideVariables,
        xAxisLabel,
        xAxisMajorIncrement,
        xAxisMax,
        xAxisMin,
        xAxisOrigin,
        yAxisLabel,
        yAxisMajorIncrement,
        yAxisMax,
        yAxisMin,
        yAxisOrigin,
      ]
    ); // No dependencies needed as it's a pure function

    const createStackedChartConfig = useCallback(
      (chartType: string, isDefault: boolean = false) => {
        const config = createChartConfig(chartType, isDefault);

        if (
          !isDefault &&
          bottomVariables.length > 0 &&
          sideVariables.length > 0
        ) {
          config.subtitle = `Showing distribution of ${formatLimitedList(
            sideVariables
          )} across ${bottomVariables[0]} categories`;
          config.yLabel = formatLimitedList(sideVariables);
        }

        return config;
      },
      [bottomVariables, createChartConfig, sideVariables]
    ); // No dependencies needed as it's a pure function

    const createDualAxisChartConfig = useCallback(
      (chartType: string, isDefault: boolean = false) => {
        const config = createChartConfig(chartType, isDefault);

        // Chart-specific dual Y axis config
        let leftLabel, rightLabel;

        if (chartType === "Vertical Bar & Line Chart") {
          leftLabel = yLeftAxisLabel || config.axisConfig.y + " (Bar)";
          rightLabel = yRightAxisLabel || config.axisConfig.y + " (Line)";
        } else if (chartType === "Dual Axes Scatter Plot") {
          leftLabel = yLeftAxisLabel || config.axisConfig.y + " (Y1)";
          rightLabel = yRightAxisLabel || config.axisConfig.y + " (Y2)";
        } else {
          // Fallback for other dual axis charts
          leftLabel = yLeftAxisLabel || config.axisConfig.y + " (Left)";
          rightLabel = yRightAxisLabel || config.axisConfig.y + " (Right)";
        }

        const dualAxisConfig = {
          x: config.axisConfig.x,
          y1: leftLabel,
          y2: rightLabel,
        };

        // Separate scale configs for y1 and y2 axis
        const dualScaleConfig = {
          x: config.scaleConfig.x,
          y1: {
            min: yAxisMin,
            max: yAxisMax,
            majorIncrement: yAxisMajorIncrement,
            origin: yAxisOrigin,
          },
          y2: {
            min: yRightAxisMin,
            max: yRightAxisMax,
            majorIncrement: yRightAxisMajorIncrement,
            origin: yRightAxisOrigin,
          },
        };

        return {
          ...config,
          axisConfig: dualAxisConfig,
          scaleConfig: dualScaleConfig,
        };
      },
      [
        createChartConfig,
        yAxisMin,
        yAxisMax,
        yAxisMajorIncrement,
        yAxisOrigin,
        yRightAxisMin,
        yRightAxisMax,
        yRightAxisMajorIncrement,
        yRightAxisOrigin,
        yLeftAxisLabel,
        yRightAxisLabel,
      ]
    ); // No dependencies needed as it's a pure function
    const createErrorBarChartConfig = useCallback(
      (chartType: ChartType, isDefault: boolean) => {
        const config = createChartConfig(chartType, isDefault);

        if (!isDefault) {
          config.data = processedResult.data;
        }

        return config;
      },
      [createChartConfig, processedResult.data]
    );

    const createClusteredErrorBarChartConfig = useCallback(
      (chartType: ChartType, isDefault: boolean) => {
        const config = createChartConfig(chartType, isDefault);

        if (!isDefault) {
          config.data = processedResult.data;
        }

        return config;
      },
      [createChartConfig, processedResult.data]
    );

    // Helper to build axis scale config with only valid numbers
    function buildAxisScaleConfig(
      minStr?: string,
      maxStr?: string,
      majorStr?: string
    ) {
      const config: any = {};
      if (minStr !== undefined && minStr !== "" && !isNaN(Number(minStr)))
        config.min = parseFloat(minStr);
      if (maxStr !== undefined && maxStr !== "" && !isNaN(Number(maxStr)))
        config.max = parseFloat(maxStr);
      if (majorStr !== undefined && majorStr !== "" && !isNaN(Number(majorStr)))
        config.majorIncrement = parseFloat(majorStr);
      // Only return if min and max are both present (required by type)
      if (typeof config.min === "number" && typeof config.max === "number") {
        return config;
      }
      return undefined;
    }

    // This is a refactored version of the chart rendering logic
    // Combining two separate switch statements into one unified switch statement

    useEffect(() => {
      console.log("🎨 Chart rendering useEffect triggered:", {
        chartType,
        selectedStatistic,
        variablesChanged: JSON.stringify({
          side: sideVariables,
          bottom: bottomVariables,
          color: colorVariables,
        }),
      });

      if (chartContainerRef.current) {
        // Cleanup any existing 3D charts first
        const existingContainer = chartContainerRef.current.firstChild as any;
        if (
          existingContainer &&
          typeof existingContainer.cleanup === "function"
        ) {
          existingContainer.cleanup();
        }

        chartContainerRef.current.innerHTML = "";
        chartContainerRef.current.innerHTML = ""; // Bersihkan kontainer dulu
        chartContainerRef.current.id = "chart-container"; // Pastikan ada ID
        let chartNode = null;
        const svg = d3.select(chartContainerRef.current);
        svg.selectAll("*").remove();

        // UNIFIED SWITCH STATEMENT - All chart types in one place
        switch (chartType) {
          // === REGULAR 2D CHARTS ===
          case "Vertical Bar Chart": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);

            chartNode = chartUtils.createVerticalBarChart2(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Horizontal Bar Chart": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);

            chartNode = chartUtils.createHorizontalBarChart(
              config.data,
              width,
              height,
              useaxis,
              undefined,
              undefined,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Vertical Stacked Bar Chart": {
            const isDefault = processedResult.data.length === 0;
            const config = createStackedChartConfig(chartType, isDefault);

            chartNode = chartUtils.createVerticalStackedBarChart(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Horizontal Stacked Bar Chart": {
            const isDefault = processedResult.data.length === 0;
            const config = createStackedChartConfig(chartType, isDefault);

            chartNode = chartUtils.createHorizontalStackedBarChart(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Clustered Bar Chart": {
            const isDefault = processedResult.data.length === 0;
            const config = createStackedChartConfig(chartType, isDefault);

            chartNode = chartUtils.createClusteredBarChart(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Line Chart": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);

            chartNode = chartUtils.createLineChart(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Multiple Line Chart": {
            const isDefault = processedResult.data.length === 0;
            const config = createStackedChartConfig(chartType, isDefault);

            chartNode = chartUtils.createMultipleLineChart(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Pie Chart": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);
            chartNode = chartUtils.createPieChart(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              chartColors
            );
            break;
          }

          case "Area Chart": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);
            chartNode = chartUtils.createAreaChart(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Stacked Area Chart": {
            const isDefault = processedResult.data.length === 0;
            const config = createStackedChartConfig(chartType, isDefault);

            chartNode = chartUtils.createStackedAreaChart(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          // === SCATTER PLOTS ===
          case "Scatter Plot": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);
            chartNode = chartUtils.createScatterPlot(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Scatter Plot With Fit Line": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);
            chartNode = chartUtils.createScatterPlotWithFitLine(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Grouped Scatter Plot": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);

            chartNode = chartUtils.createGroupedScatterPlot(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Scatter Plot Matrix": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);
            chartNode = chartUtils.createScatterPlotMatrix(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              chartColors
            );
            break;
          }

          // === STATISTICAL CHARTS ===
          case "Histogram": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);
            chartNode = chartUtils.createHistogram(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Stacked Histogram": {
            const isDefault = processedResult.data.length === 0;
            const config = createStackedChartConfig(chartType, isDefault);

            chartNode = chartUtils.createStackedHistogram(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              chartColors
            );
            break;
          }

          case "Boxplot": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);
            chartNode = chartUtils.createBoxplot(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Clustered Boxplot": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);
            chartNode = chartUtils.createClusteredBoxplot(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "1-D Boxplot": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);
            chartNode = chartUtils.create1DBoxplot(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Violin Plot": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);
            chartNode = chartUtils.createViolinPlot(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          // === ERROR BAR CHARTS ===
          case "Error Bar Chart": {
            const isDefault = processedResult.data.length === 0;
            const config = createErrorBarChartConfig(chartType, isDefault);

            chartNode = chartUtils.createErrorBarChart(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Clustered Error Bar Chart": {
            const isDefault = processedResult.data.length === 0;
            const config = createClusteredErrorBarChartConfig(
              chartType,
              isDefault
            );

            console.log("config.data", config.data);

            chartNode = chartUtils.createClusteredErrorBarChart(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          // === SPECIALIZED CHARTS ===
          case "Dot Plot": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);

            chartNode = chartUtils.createDotPlot(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Population Pyramid": {
            const isDefault = processedResult.data.length === 0;
            const config = createStackedChartConfig(chartType, isDefault);

            chartNode = chartUtils.createPopulationPyramid(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Frequency Polygon": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);
            chartNode = chartUtils.createFrequencyPolygon(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Drop Line Chart": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);

            chartNode = chartUtils.createDropLineChart(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Summary Point Plot": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);
            const statistics = selectedStatistic || "mean";

            console.log("🔄 Summary Point Plot rendering:", {
              selectedStatistic,
              statistics,
              isDefault,
              dataLength: config.data.length,
              data: config.data,
            });

            chartNode = chartUtils.createSummaryPointPlot(
              config.data,
              width,
              height,
              useaxis,
              statistics,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Stem And Leaf Plot": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);

            chartNode = chartUtils.createStemAndLeafPlot(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Density Chart": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);

            // Convert config.data to array of numbers for density chart
            const densityData =
              Array.isArray(config.data) && config.data.length > 0
                ? config.data
                    .map((d) => (typeof d === "number" ? d : d.value))
                    .filter((v) => !isNaN(v))
                : config.data;

            chartNode = chartUtils.createDensityChart(
              densityData,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          // === RANGE CHARTS ===
          case "Simple Range Bar": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);
            chartNode = chartUtils.createSimpleRangeBar(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Clustered Range Bar": {
            const isDefault = processedResult.data.length === 0;
            const config = createStackedChartConfig(chartType, isDefault);

            chartNode = chartUtils.createClusteredRangeBar(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "High-Low-Close Chart": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);

            chartNode = chartUtils.createHighLowCloseChart(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Difference Area": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);

            chartNode = chartUtils.createDifferenceArea(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          // === DUAL AXIS CHARTS ===
          case "Vertical Bar & Line Chart": {
            const isDefault = processedResult.data.length === 0;
            const config = createDualAxisChartConfig(chartType, isDefault);

            chartNode = chartUtils.createBarAndLineChart(
              config.data,
              width,
              height,
              useaxis,
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Vertical Bar & Line Chart2": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);

            chartNode = chartUtils.createBarAndLineChart2(
              config.data,
              width,
              height,
              useaxis,
              "stacked",
              config.titleConfig,
              config.axisConfig,
              config.scaleConfig,
              chartColors
            );
            break;
          }

          case "Dual Axes Scatter Plot": {
            const dualAxisScatterConfig = createDualAxisChartConfig(chartType);
            const dualAxesScatterPlotData =
              processedResult.data.length === 0
                ? [
                    { x: 6, y1: 22, y2: 75 },
                    { x: 8, y1: 25, y2: 78 },
                    { x: 10, y1: 28, y2: 80 },
                    { x: 12, y1: 30, y2: 82 },
                    { x: 14, y1: 26, y2: 79 },
                    { x: 16, y1: 24, y2: 74 },
                    { x: 18, y1: 27, y2: 76 },
                    { x: 20, y1: 25, y2: 70 },
                  ]
                : processedResult.data;

            chartNode = chartUtils.createDualAxesScatterPlot(
              dualAxesScatterPlotData,
              width,
              height,
              useaxis,
              dualAxisScatterConfig.titleConfig,
              dualAxisScatterConfig.axisConfig,
              dualAxisScatterConfig.scaleConfig,
              chartColors
            );
            break;
          }

          // === 3D CHARTS ===
          case "3D Bar Chart (ECharts)": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);

            // Data untuk ECharts
            const echartBarData =
              config.data.length === 0
                ? [
                    { x: 5, y: 2, z: 5 },
                    { x: 4, y: 3, z: 6 },
                    { x: 3, y: 5, z: 4 },
                    { x: 2, y: 7, z: 6 },
                    { x: 0, y: 0, z: 0 },
                    { x: 2, y: 2, z: 6 },
                    { x: 2, y: 4, z: 7 },
                    { x: 3, y: 6, z: 5 },
                    { x: 6, y: 4, z: 2 },
                    { x: 7, y: 3, z: 5 },
                    { x: 7, y: 2, z: 6 },
                    { x: 5, y: 5, z: 5 },
                    { x: 1, y: 1, z: 3 },
                    { x: 4, y: 1, z: 2 },
                    { x: 6, y: 6, z: 8 },
                    { x: 1, y: 5, z: 4 },
                    { x: 0, y: 3, z: 7 },
                    { x: 3, y: 1, z: 2 },
                    { x: 5, y: 1, z: 4 },
                    { x: 6, y: 2, z: 5 },
                    { x: 1, y: 3, z: 4 },
                    { x: 4, y: 6, z: 5 },
                  ]
                : processedResult.data; // Langsung gunakan data yang sudah diproses

            // Log data untuk debugging
            console.log("Processed data for ECharts:", processedResult.data);
            console.log("Final echarts data:", echartBarData);

            // Prepare configuration objects
            const titleConfig = {
              title: chartTitle || "3D Bar Chart",
              subtitle: chartSubtitle || "Sample Data",
              titleFontSize: chartTitleFontSize || 16,
              subtitleFontSize: chartSubtitleFontSize || 12,
            };

            const axisLabels = {
              x: xAxisLabel,
              y: yAxisLabel,
              z: chartType.includes("3D") ? zAxisLabel : undefined,
            };

            const axisScaleOptions = {
              x: buildAxisScaleConfig(xAxisMin, xAxisMax, xAxisMajorIncrement),
              y: buildAxisScaleConfig(yAxisMin, yAxisMax, yAxisMajorIncrement),
              z: buildAxisScaleConfig(zAxisMin, zAxisMax, zAxisMajorIncrement),
            };

            console.log("echartBarData", echartBarData);

            chartNode = chartUtils.createECharts3DBarChart(
              echartBarData,
              width,
              height,
              useaxis,
              titleConfig,
              axisLabels,
              axisScaleOptions,
              chartColors
            );
            break;
          }

          case "3D Scatter Plot (ECharts)": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);
            console.log("Menyiapkan config", config);

            // Data untuk ECharts 3D Scatter Plot
            const echartScatterData =
              config.data.length === 0
                ? [
                    { x: -5, y: 2, z: -5 },
                    { x: -4, y: 3, z: 6 },
                    { x: -3, y: 5, z: 4 },
                    { x: -2, y: 7, z: -6 },
                    { x: 0, y: 0, z: 0 },
                    { x: 2, y: 2, z: -6 },
                    { x: 2, y: 4, z: 7 },
                    { x: 3, y: 6, z: -5 },
                    { x: 4, y: 3, z: 2 },
                    { x: 5, y: 5, z: -9 },
                    { x: 6, y: 4, z: -2 },
                    { x: 7, y: 3, z: 5 },
                    { x: -7, y: 2, z: -6 },
                    { x: -6, y: 4, z: -2 },
                    { x: -5, y: 5, z: 5 },
                  ]
                : processedResult.data; // Langsung gunakan data yang sudah diproses

            // Log data untuk debugging
            console.log(
              "Processed data for ECharts 3D Scatter:",
              processedResult.data
            );
            console.log("Final echarts scatter data:", echartScatterData);

            // Prepare configuration objects
            const titleConfig = {
              title: chartTitle || "3D Scatter Plot",
              subtitle: chartSubtitle || "Sample Data",
              titleFontSize: chartTitleFontSize || 16,
              subtitleFontSize: chartSubtitleFontSize || 12,
            };

            const axisLabels = {
              x: xAxisLabel,
              y: yAxisLabel,
              z: zAxisLabel,
            };

            const axisScaleOptions = {
              x: {
                min: xAxisMin,
                max: xAxisMax,
                majorIncrement: xAxisMajorIncrement,
                origin: xAxisOrigin,
              },
              y: {
                min: yAxisMin,
                max: yAxisMax,
                majorIncrement: yAxisMajorIncrement,
                origin: yAxisOrigin,
              },
              z: {
                min: zAxisMin,
                max: zAxisMax,
                majorIncrement: zAxisMajorIncrement,
                origin: zAxisOrigin,
              },
            };

            chartNode = chartUtils.createECharts3DScatterPlot(
              echartScatterData,
              width,
              height,
              useaxis,
              titleConfig,
              axisLabels,
              axisScaleOptions,
              chartColors
            );
            break;
          }

          case "3D Bar Chart2": {
            // Buat elemen chart
            const d3BarChartData =
              processedResult.data.length === 0
                ? [
                    { x: -5, y: 2, z: -5 }, // Kuadran (-, +, -)
                    { x: -4, y: 3, z: 6 }, // Kuadran (-, +, +)
                    { x: -3, y: 5, z: 4 }, // Kuadran (-, +, +)
                    { x: -2, y: 7, z: -6 }, // Kuadran (-, +, -)
                    { x: 0, y: 0, z: 0 }, // Sumbu (y positif)
                    { x: 2, y: 2, z: -6 }, // Kuadran (+, +, -)
                    { x: 2, y: 4, z: 7 }, // Kuadran (+, +, +)
                    { x: 3, y: 6, z: -5 }, // Kuadran (+, +, -)
                    { x: 4, y: 3, z: 2 }, // Kuadran (+, +, +)
                    { x: 5, y: 5, z: -9 }, // Kuadran (+, +, -)
                    { x: 6, y: 4, z: -2 }, // Kuadran (+, +, -)
                    { x: 7, y: 3, z: 5 }, // Kuadran (+, +, +)
                    { x: -7, y: 2, z: -6 }, // Kuadran (-, +, -)
                    { x: -6, y: 4, z: -2 }, // Kuadran (-, +, -)
                    { x: -5, y: 5, z: 5 }, // Kuadran (-, +, +)
                  ]
                : processedResult.data;

            chartNode = chartUtils.create3DBarChart2(
              d3BarChartData,
              width,
              height
            );
            break;
          }

          case "3D Scatter Plot": {
            // Buat elemen chart
            const d3ScatterPlotData =
              processedResult.data.length === 0
                ? [
                    { x: -5, y: 2, z: -5 }, // Kuadran (-, +, -)
                    { x: -4, y: 3, z: 6 }, // Kuadran (-, +, +)
                    { x: -3, y: 5, z: 4 }, // Kuadran (-, +, +)
                    { x: -2, y: 7, z: -6 }, // Kuadran (-, +, -)
                    { x: 0, y: 0, z: 0 }, // Sumbu (y positif)
                    { x: 2, y: 2, z: -6 }, // Kuadran (+, +, -)
                    { x: 2, y: 4, z: 7 }, // Kuadran (+, +, +)
                    { x: 3, y: 6, z: -5 }, // Kuadran (+, +, -)
                    { x: 4, y: 3, z: 2 }, // Kuadran (+, +, +)
                    { x: 5, y: 5, z: -9 }, // Kuadran (+, +, -)
                    { x: 6, y: 4, z: -2 }, // Kuadran (+, +, -)
                    { x: 7, y: 3, z: 5 }, // Kuadran (+, +, +)
                    { x: -7, y: 2, z: -6 }, // Kuadran (-, +, -)
                    { x: -6, y: 4, z: -2 }, // Kuadran (-, +, -)
                    { x: -5, y: 5, z: 5 }, // Kuadran (-, +, +)
                  ]
                : processedResult.data.map((d) => ({
                    x:
                      d.category && Number(d.category) !== 0
                        ? Number(d.category)
                        : Number(d.bottom_0) || 0,
                    y: Number(d.value) || 0,
                    z: Number(d.bottom2_0) || 0,
                  }));

            chartNode = chartUtils.create3DScatterPlot(
              d3ScatterPlotData,
              width,
              height
            );
            break;
          }

          case "Grouped 3D Scatter Plot": {
            // Buat elemen chart
            const d3GroupedScatterPlotData =
              processedResult.data.length === 0
                ? [
                    { x: 1, y: 2, z: 3, category: "A" },
                    { x: 1, y: 2, z: 3, category: "B" },
                    { x: 1, y: 2, z: 3, category: "C" },
                    { x: 1, y: 4, z: 3, category: "D" },
                    { x: 2, y: 4, z: 1, category: "A" },
                    { x: 3, y: 1, z: 2, category: "B" },
                    { x: 4, y: 3, z: 4, category: "B" },
                    { x: 5, y: 2, z: 5, category: "C" },
                    { x: 6, y: 5, z: 3, category: "C" },
                    { x: 7, y: 3, z: 2, category: "D" },
                    { x: 8, y: 4, z: 1, category: "D" },
                  ]
                : processedResult.data
                    .filter((d) => d.color !== "" && d.color != undefined) // Hanya ambil data yang memiliki color
                    .map((d) => ({
                      x:
                        d.category && Number(d.category) !== 0
                          ? Number(d.category)
                          : Number(d.bottom_0) || 0,
                      y: Number(d.value) || 0,
                      z: Number(d.bottom2_0) || 0,
                      category: String(d.color || "unknown"),
                    }));

            chartNode = chartUtils.createGrouped3DScatterPlot(
              d3GroupedScatterPlotData,
              width,
              height
            );
            break;
          }

          case "Clustered 3D Bar Chart": {
            // Buat elemen chart
            const d3ClusteredBarChartData =
              processedResult.data.length === 0
                ? [
                    { x: 1, z: 1, y: 6, category: "A" },
                    { x: 2, z: 1, y: 7, category: "A" },
                    { x: 2, z: 1, y: 6, category: "B" },
                    { x: 2, z: 1, y: 5, category: "C" },
                    { x: 2, z: 1, y: 6, category: "D" },
                    { x: 6, z: 4, y: 7, category: "A" },
                    { x: 6, z: 4, y: 6, category: "B" },
                    { x: 6, z: 4, y: 5, category: "C" },
                    { x: 6, z: 4, y: 6, category: "D" },
                    { x: 4, z: 7, y: 5, category: "A" },
                    { x: -4, z: 6, y: 3, category: "A" },
                    { x: -4, z: 6, y: 6, category: "B" },
                    { x: -4, z: 6, y: 7, category: "C" },
                    { x: -4, z: 6, y: 1, category: "D" },
                    { x: -4, z: 6, y: 4, category: "E" },
                    { x: -9, z: 8, y: 4, category: "A" },
                    { x: -9, z: 8, y: 6, category: "B" },
                    { x: -9, z: 8, y: 2, category: "E" },
                    { x: 8, z: -6, y: 3, category: "A" },
                    { x: 8, z: -6, y: 4, category: "B" },
                    { x: 8, z: -6, y: 9, category: "C" },
                    { x: 8, z: -6, y: 2, category: "D" },
                    { x: 8, z: -6, y: 5, category: "E" },
                    { x: -8, z: -2, y: 3, category: "A" },
                    { x: -8, z: -2, y: 6, category: "B" },
                    { x: -8, z: -2, y: 3, category: "C" },
                    { x: -8, z: -2, y: 1, category: "D" },
                    { x: -8, z: -2, y: 4, category: "E" },
                  ]
                : processedResult.data
                    .filter((d) => d.color !== "" && d.color != undefined) // Hanya ambil data yang memiliki color
                    .map((d) => ({
                      x:
                        d.category && Number(d.category) !== 0
                          ? Number(d.category)
                          : Number(d.bottom_0) || 0,
                      y: Number(d.value) || 0,
                      z: Number(d.bottom2_0) || 0,
                      category: String(d.color || "unknown"),
                    }));

            chartNode = chartUtils.createClustered3DBarChart(
              d3ClusteredBarChartData,
              width,
              height
            );
            break;
          }

          case "Stacked 3D Bar Chart": {
            // Buat elemen chart
            const d3StackedBarChartData =
              processedResult.data.length === 0
                ? [
                    { x: 1, z: 1, y: 6, category: "A" },
                    { x: 2, z: 6, y: 2, category: "A" },
                    { x: 2, z: 6, y: 3, category: "B" },
                    { x: 2, z: 6, y: 2, category: "C" },
                    { x: 2, z: 6, y: 1, category: "D" },
                    { x: 5, z: 4, y: 1, category: "A" },
                    { x: 5, z: 4, y: 2, category: "B" },
                    { x: 5, z: 4, y: 3, category: "C" },
                    { x: 5, z: 4, y: 1, category: "D" },
                    { x: 9, z: 7, y: 7, category: "A" },
                    { x: -4, z: 6, y: 3, category: "A" },
                    { x: -4, z: 6, y: 1, category: "B" },
                    { x: -4, z: 6, y: 2, category: "C" },
                    { x: -4, z: 6, y: 2, category: "D" },
                    { x: -4, z: 6, y: 1, category: "E" },
                    { x: -9, z: 8, y: 1, category: "A" },
                    { x: -9, z: 8, y: 2, category: "B" },
                    { x: -9, z: 8, y: 2, category: "E" },
                    { x: 8, z: -6, y: 3, category: "A" },
                    { x: 8, z: -6, y: 2, category: "B" },
                    { x: 8, z: -6, y: 1, category: "C" },
                    { x: 8, z: -6, y: 2, category: "D" },
                    { x: 8, z: -6, y: 2, category: "E" },
                    { x: -8, z: -2, y: 3, category: "A" },
                    { x: -8, z: -2, y: 2, category: "B" },
                    { x: -8, z: -2, y: 3, category: "C" },
                    { x: -8, z: -2, y: 1, category: "D" },
                    { x: -8, z: -2, y: 1, category: "E" },
                  ]
                : processedResult.data
                    .filter((d) => d.color !== "" && d.color != undefined) // Hanya ambil data yang memiliki color
                    .map((d) => ({
                      x:
                        d.category && Number(d.category) !== 0
                          ? Number(d.category)
                          : Number(d.bottom_0) || 0,
                      y: Number(d.value) || 0,
                      z: Number(d.bottom2_0) || 0,
                      category: String(d.color || "unknown"),
                    }));

            chartNode = chartUtils.createStacked3DBarChart(
              d3StackedBarChartData,
              width,
              height
            );
            break;
          }

          case "Stacked 3D Bar Chart (ECharts)": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);

            const echartStackedBarData =
              config.data.length === 0
                ? [
                    { x: 1, y: 6, z: 1, group: "A" },
                    { x: 2, y: 2, z: 6, group: "A" },
                    { x: 2, y: 3, z: 6, group: "B" },
                    { x: 2, y: 2, z: 6, group: "C" },
                    { x: 2, y: 1, z: 6, group: "D" },
                    { x: 5, y: 1, z: 4, group: "A" },
                    { x: 5, y: 2, z: 4, group: "B" },
                    { x: 5, y: 3, z: 4, group: "C" },
                    { x: 5, y: 1, z: 4, group: "D" },
                    { x: 9, y: 7, z: 7, group: "A" },
                    { x: -4, y: 3, z: 6, group: "A" },
                    { x: -4, y: 1, z: 6, group: "B" },
                    { x: -4, y: 2, z: 6, group: "C" },
                    { x: -4, y: 2, z: 6, group: "D" },
                    { x: -4, y: 1, z: 6, group: "E" },
                    { x: -9, y: 1, z: 8, group: "A" },
                    { x: -9, y: 2, z: 8, group: "B" },
                    { x: -9, y: 2, z: 8, group: "E" },
                    { x: 8, y: 3, z: 6, group: "A" },
                    { x: 8, y: 2, z: 6, group: "B" },
                    { x: 8, y: 1, z: 6, group: "C" },
                    { x: 8, y: 2, z: 6, group: "D" },
                    { x: 8, y: 2, z: 6, group: "E" },
                    { x: -8, y: 3, z: 2, group: "A" },
                    { x: -8, y: 6, z: 2, group: "B" },
                    { x: -8, y: 3, z: 2, group: "C" },
                    { x: -8, y: 1, z: 2, group: "D" },
                    { x: -8, y: 1, z: 2, group: "E" },
                  ]
                : processedResult.data.map((d) => ({
                    x: d.x ?? d.bottom_0 ?? d.category ?? 0,
                    y: d.y ?? d.value ?? 0,
                    z: d.z ?? d.bottom2_0 ?? 0,
                    group: d.color || d.group || "unknown",
                  }));

            const titleConfig = {
              title: chartTitle || "Stacked 3D Bar Chart",
              subtitle: chartSubtitle || "Sample Data",
              titleFontSize: chartTitleFontSize || 16,
              subtitleFontSize: chartSubtitleFontSize || 12,
            };

            const axisLabels = {
              x: xAxisLabel,
              y: yAxisLabel,
              z: chartType.includes("3D") ? zAxisLabel : undefined,
            };

            const axisScaleOptions = {
              x: {
                min: xAxisMin,
                max: xAxisMax,
                majorIncrement: xAxisMajorIncrement,
                origin: xAxisOrigin,
              },
              y: {
                min: yAxisMin,
                max: yAxisMax,
                majorIncrement: yAxisMajorIncrement,
                origin: yAxisOrigin,
              },
              z: chartType.includes("3D")
                ? {
                    min: zAxisMin,
                    max: zAxisMax,
                    majorIncrement: zAxisMajorIncrement,
                    origin: zAxisOrigin,
                  }
                : undefined,
            };

            chartNode = chartUtils.createEChartsStacked3DBarChart(
              echartStackedBarData,
              width,
              height,
              useaxis,
              titleConfig,
              axisLabels,
              axisScaleOptions,
              chartColors
            );
            break;
          }

          case "Grouped 3D Scatter Plot (ECharts)": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);

            const echartGroupedScatterData =
              config.data.length === 0
                ? [
                    { x: 1, y: 6, z: 1, group: "A" },
                    { x: 2, y: 2, z: 6, group: "A" },
                    { x: 2, y: 3, z: 6, group: "B" },
                    { x: 2, y: 2, z: 6, group: "C" },
                    { x: 2, y: 1, z: 6, group: "D" },
                    { x: 5, y: 1, z: 4, group: "A" },
                    { x: 5, y: 2, z: 4, group: "B" },
                    { x: 5, y: 3, z: 4, group: "C" },
                    { x: 5, y: 1, z: 4, group: "D" },
                    { x: 9, y: 7, z: 7, group: "A" },
                    { x: -4, y: 3, z: 6, group: "A" },
                    { x: -4, y: 1, z: 6, group: "B" },
                    { x: -4, y: 2, z: 6, group: "C" },
                    { x: -4, y: 2, z: 6, group: "D" },
                    { x: -4, y: 1, z: 6, group: "E" },
                    { x: -9, y: 1, z: 8, group: "A" },
                    { x: -9, y: 2, z: 8, group: "B" },
                    { x: -9, y: 2, z: 8, group: "E" },
                    { x: 8, y: 3, z: 6, group: "A" },
                    { x: 8, y: 2, z: 6, group: "B" },
                    { x: 8, y: 1, z: 6, group: "C" },
                    { x: 8, y: 2, z: 6, group: "D" },
                    { x: 8, y: 2, z: 6, group: "E" },
                    { x: -8, y: 3, z: 2, group: "A" },
                    { x: -8, y: 6, z: 2, group: "B" },
                    { x: -8, y: 3, z: 2, group: "C" },
                    { x: -8, y: 1, z: 2, group: "D" },
                    { x: -8, y: 1, z: 2, group: "E" },
                  ]
                : processedResult.data.map((d) => ({
                    x: typeof d.x === "number" ? d.x : parseFloat(d.x) || 0,
                    y: typeof d.y === "number" ? d.y : parseFloat(d.y) || 0,
                    z: typeof d.z === "number" ? d.z : parseFloat(d.z) || 0,
                    group: String(d.group || "Unknown"),
                  }));

            const titleConfig = {
              title: chartTitle || "Grouped 3D Scatter Plot",
              subtitle: chartSubtitle || "ECharts 3D Scatter Plot",
              titleFontSize: chartTitleFontSize || 16,
              subtitleFontSize: chartSubtitleFontSize || 12,
            };

            const axisLabels = {
              x: xAxisLabel,
              y: yAxisLabel,
              z: zAxisLabel,
            };

            const axisScaleOptions = {
              x: buildAxisScaleConfig(xAxisMin, xAxisMax, xAxisMajorIncrement),
              y: buildAxisScaleConfig(yAxisMin, yAxisMax, yAxisMajorIncrement),
              z: buildAxisScaleConfig(zAxisMin, zAxisMax, zAxisMajorIncrement),
            };

            chartNode = chartUtils.createEChartsGrouped3DScatterPlot(
              echartGroupedScatterData,
              width,
              height,
              useaxis,
              titleConfig,
              axisLabels,
              axisScaleOptions,
              chartColors
            );
            break;
          }

          case "Clustered 3D Bar Chart (ECharts)": {
            const isDefault = processedResult.data.length === 0;
            const config = createChartConfig(chartType, isDefault);

            const echartClusteredBarData =
              config.data.length === 0
                ? [
                    { x: 1, y: 6, z: 1, group: "A" },
                    { x: 2, y: 2, z: 6, group: "A" },
                    { x: 2, y: 3, z: 6, group: "B" },
                    { x: 2, y: 2, z: 6, group: "C" },
                    { x: 2, y: 1, z: 6, group: "D" },
                    { x: 5, y: 1, z: 4, group: "A" },
                    { x: 5, y: 2, z: 4, group: "B" },
                    { x: 5, y: 3, z: 4, group: "C" },
                    { x: 5, y: 1, z: 4, group: "D" },
                    { x: 9, y: 7, z: 7, group: "A" },
                    { x: -4, y: 3, z: 6, group: "A" },
                    { x: -4, y: 1, z: 6, group: "B" },
                    { x: -4, y: 2, z: 6, group: "C" },
                    { x: -4, y: 2, z: 6, group: "D" },
                    { x: -4, y: 1, z: 6, group: "E" },
                    { x: -9, y: 1, z: 8, group: "A" },
                    { x: -9, y: 2, z: 8, group: "B" },
                    { x: -9, y: 2, z: 8, group: "E" },
                    { x: 8, y: 3, z: 6, group: "A" },
                    { x: 8, y: 2, z: 6, group: "B" },
                    { x: 8, y: 1, z: 6, group: "C" },
                    { x: 8, y: 2, z: 6, group: "D" },
                    { x: 8, y: 2, z: 6, group: "E" },
                    { x: -8, y: 3, z: 2, group: "A" },
                    { x: -8, y: 6, z: 2, group: "B" },
                    { x: -8, y: 3, z: 2, group: "C" },
                    { x: -8, y: 1, z: 2, group: "D" },
                    { x: -8, y: 1, z: 2, group: "E" },
                  ]
                : processedResult.data.map((d) => ({
                    x: typeof d.x === "number" ? d.x : parseFloat(d.x) || 0,
                    y: typeof d.y === "number" ? d.y : parseFloat(d.y) || 0,
                    z: typeof d.z === "number" ? d.z : parseFloat(d.z) || 0,
                    group: String(d.group || "Unknown"),
                  }));

            const titleConfig = {
              title: chartTitle || "Clustered 3D Bar Chart",
              subtitle: chartSubtitle || "ECharts 3D Bar Chart",
              titleFontSize: chartTitleFontSize || 16,
              subtitleFontSize: chartSubtitleFontSize || 12,
            };

            const axisLabels = {
              x: xAxisLabel,
              y: yAxisLabel,
              z: zAxisLabel,
            };

            const axisScaleOptions = {
              x: buildAxisScaleConfig(xAxisMin, xAxisMax, xAxisMajorIncrement),
              y: buildAxisScaleConfig(yAxisMin, yAxisMax, yAxisMajorIncrement),
              z: buildAxisScaleConfig(zAxisMin, zAxisMax, zAxisMajorIncrement),
            };

            chartNode = chartUtils.createEChartsClustered3DBarChart(
              echartClusteredBarData,
              width,
              height,
              useaxis,
              titleConfig,
              axisLabels,
              axisScaleOptions,
              chartColors
            );
            break;
          }

          // === DEFAULT CASE ===
          default:
            console.error("Unknown chart type:", chartType);
            break;
        }

        // Jika chartNode valid, append ke svgRef
        if (chartNode && chartContainerRef.current) {
          console.log("chartContainerRef.current:", chartContainerRef.current);
          chartContainerRef.current.appendChild(chartNode); // Menambahkan node hasil dari fungsi ke dalam svgRef
          console.log("chartContainerRef.current:", chartContainerRef.current);
          console.log("chart:", chartNode);
        }
      }
    }, [
      // Dependencies array remains the same
      chartType,
      sideVariables,
      side2Variables,
      bottomVariables,
      bottom2Variables,
      colorVariables,
      filterVariables,
      lowVariables,
      highVariables,
      closeVariables,
      data,
      useaxis,
      width,
      height,
      variables,
      chartTitle,
      chartSubtitle,
      chartTitleFontSize,
      chartSubtitleFontSize,
      xAxisLabel,
      yAxisLabel,
      yLeftAxisLabel,
      yRightAxisLabel,
      zAxisLabel,
      xAxisMin,
      xAxisMax,
      xAxisMajorIncrement,
      xAxisOrigin,
      yAxisMin,
      yAxisMax,
      yAxisMajorIncrement,
      yAxisOrigin,
      yRightAxisMin,
      yRightAxisMax,
      yRightAxisMajorIncrement,
      yRightAxisOrigin,
      zAxisMin,
      zAxisMax,
      zAxisMajorIncrement,
      zAxisOrigin,
      chartColors,
      processedResult,
      selectedStatistic,
      createChartConfig,
      createClusteredErrorBarChartConfig,
      createDualAxisChartConfig,
      createErrorBarChartConfig,
      createStackedChartConfig,
    ]);

    // Process data when variables or options change
    useEffect(() => {
      // Only process if we have data and variables
      if (data.length === 0 || variables.length === 0) {
        setProcessedResult({ data: [], axisInfo: {} });
        return;
      }

      function normalizeRawData(
        rawData: any[][],
        variables: { name: string; type?: string }[]
      ): any[][] {
        return rawData.map((row, rowIdx) => {
          if (row.length !== variables.length) {
            console.warn(
              `[normalizeRawData] ⚠️ Jumlah kolom tidak sesuai pada baris ${rowIdx}:`,
              `data columns = ${row.length}, variables = ${variables.length}`
            );
          }

          return row.map((cell, colIdx) => {
            const varMeta = variables[colIdx];
            const varName = varMeta?.name ?? `kolom${colIdx}`;
            const type = varMeta?.type ?? "string";

            let casted: any = cell;

            if (type === "numeric") {
              const num = parseFloat(cell);
              casted = isNaN(num) ? null : num;
            }

            console.log(
              `[normalizeRawData] row ${rowIdx}, col ${colIdx} (${varName}) →`,
              `type: ${type}, value:`,
              cell,
              `→ casted:`,
              casted
            );

            return casted;
          });
        });
      }

      try {
        console.log("🔄 Processing data with options:", {
          chartType,
          variables: variables.length,
          errorBarOptions,
        });

        const isErrorBarChart =
          chartType === "Error Bar Chart" ||
          chartType === "Clustered Error Bar Chart";

        const processingOptions = {
          aggregation: isErrorBarChart
            ? ("average" as const)
            : ("none" as const),
          filterEmpty: true,
          sortBy: undefined,
          sortOrder: "asc" as const,
          limit: undefined,
          ...(isErrorBarChart && {
            errorBar: errorBarOptions,
          }),
        };

        const chartVariables = {
          x: bottomVariables,
          y: chartType.includes("3D") ? bottom2Variables : sideVariables,
          groupBy: colorVariables,
          low: lowVariables,
          high: highVariables,
          close: closeVariables,
          z: chartType.includes("3D") ? sideVariables : bottom2Variables,
          y2: side2Variables,
        };

        const result = DataProcessingService.processDataForChart({
          chartType,
          rawData: normalizeRawData(data, variables),
          variables,
          chartVariables,
          processingOptions,
        });

        console.log("✅ Data processed:", result);
        setProcessedResult(result);
      } catch (error) {
        console.error("❌ Error processing data:", error);
        setProcessedResult({ data: [], axisInfo: {} });
      }
    }, [
      data,
      variables,
      chartType,
      bottomVariables,
      sideVariables,
      colorVariables,
      lowVariables,
      highVariables,
      closeVariables,
      bottom2Variables,
      side2Variables,
      errorBarOptions,
    ]);

    // Add a function to get the generated JSON (for ChartBuilderModal)
    const getGeneratedChartJSON = useCallback(() => {
      return generatedChartJSON;
    }, [generatedChartJSON]);

    // Expose the function to parent component
    useEffect(() => {
      if (typeof window !== "undefined") {
        (window as any).getChartPreviewJSON = getGeneratedChartJSON;
      }
    }, [getGeneratedChartJSON]);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      getGeneratedChartJSON: () => generatedChartJSON,
    }));

    // Helper function untuk format limited list
    const formatLimitedList = (items: string[], limit: number = 3): string => {
      const limited = items.slice(0, limit);
      const remaining = items.length - limit;
      if (remaining > 0) {
        return `${limited.join(", ")} and ${remaining} more`;
      }
      return limited.join(", ");
    };

    // Add useEffect to generate chart JSON when processed data changes
    useEffect(() => {
      if (processedResult.data.length > 0) {
        generateChartJSON();
      }
    }, [processedResult, generateChartJSON]);

    return (
      <div className="flex flex-col p-5 border-2 border-gray-200 rounded-lg pb-24">
        {/* Label Chart Preview di tengah atas kotak putih */}
        <div
          className="flex justify-center items-center w-full"
          style={{ marginTop: "10px", marginBottom: "0px" }}
        >
          <span
            className="text-lg font-semibold text-gray-500 uppercase tracking-widest px-6 py-1 rounded border border-gray-200 shadow-sm"
            style={{ letterSpacing: "0.18em" }}
          >
            <span role="img" aria-label="component" className="mr-2">
              🧩
            </span>{" "}
            Chart Preview{" "}
            <span role="img" aria-label="component" className="mr-2">
              🧩
            </span>
          </span>
        </div>
        {/* Wrapper dengan padding untuk drop areas */}
        <div className="w-full flex justify-center relative px-16 py-2">
          {/* Side (kiri) */}
          {chartVariableConfig[chartType]?.side &&
            (chartVariableConfig[chartType].side?.min !== 0 ||
              chartVariableConfig[chartType].side?.max !== 0) && (
              <div className="absolute left-[-70px] top-1/2 -translate-y-1/2 z-10">
                {/* ...side drop area JSX... */}
                {/* Copy dari JSX lama untuk side */}
                <div
                  className={clsx(
                    "rotate-90 flex flex-wrap space-x-1 w-[200px] justify-center items-center border border-gray-400 rounded-md p-1 cursor-pointer",
                    (chartType === "3D Bar Chart2" ||
                      chartType === "3D Scatter Plot" ||
                      chartType === "Grouped 3D Scatter Plot" ||
                      chartType === "Clustered 3D Bar Chart" ||
                      chartType === "Stacked 3D Bar Chart") &&
                      "border-3 border-green-500"
                  )}
                  onDrop={(e) => handleDrop(e, "side")}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => handleOpenModal("side")}
                >
                  {sideVariables.length === 0 ? (
                    <div className="bg-gray-300 text-gray-500 p-2 rounded-md text-sm shadow-md w-full text-center">
                      {chartType === "3D Bar Chart2" ||
                      chartType === "3D Scatter Plot" ||
                      chartType === "Grouped 3D Scatter Plot" ||
                      chartType === "Clustered 3D Bar Chart" ||
                      chartType === "Stacked 3D Bar Chart"
                        ? "Y axis"
                        : "No variables selected"}
                    </div>
                  ) : (
                    (() => {
                      const maxWidth = 100;
                      let totalWidth = 0;
                      let displayedVars = [];
                      const spaceBetween = 4;
                      let hiddenCount = 0;
                      const estimateButtonWidth = (text: string) =>
                        Math.max(40, text.length * 8);
                      for (let i = 0; i < sideVariables.length; i++) {
                        let btnWidth = estimateButtonWidth(sideVariables[i]);
                        if (totalWidth + btnWidth + spaceBetween <= maxWidth) {
                          displayedVars.push(sideVariables[i]);
                          totalWidth += btnWidth + spaceBetween;
                        } else {
                          hiddenCount = sideVariables.length - i;
                          break;
                        }
                      }
                      return (
                        <div className="flex flex-wrap space-x-1 justify-center w-full">
                          {displayedVars.map((variable, index) => (
                            <div
                              key={index}
                              className="bg-blue-500 text-white p-2 rounded-md text-sm shadow-md text-center"
                              style={{ minWidth: "40px" }}
                            >
                              {variable}
                            </div>
                          ))}
                          {hiddenCount > 0 && (
                            <div className="bg-gray-500 text-white p-2 rounded-md text-sm shadow-md text-center">
                              +{hiddenCount} more
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            )}
          {/* Side2 (kanan) */}
          {chartVariableConfig[chartType]?.side2 &&
            (chartVariableConfig[chartType].side2?.min !== 0 ||
              chartVariableConfig[chartType].side2?.max !== 0) && (
              <div className="absolute right-[-70px] top-1/2 -translate-y-1/2 z-10">
                {/* ...side2 drop area JSX... */}
                {/* Copy dari JSX lama untuk side2 */}
                <div
                  className="rotate-90 flex flex-wrap space-x-1 w-[200px] justify-center items-center border border-gray-400 rounded-md p-1 cursor-pointer"
                  onDrop={(e) => handleDrop(e, "side2")}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => handleOpenModal("side2")}
                >
                  {side2Variables.length === 0 ? (
                    <div className="bg-gray-300 text-gray-500 p-2 rounded-md text-sm shadow-md w-full text-center">
                      No variables selected
                    </div>
                  ) : (
                    (() => {
                      const maxWidth = 100;
                      let totalWidth = 0;
                      let displayedVars = [];
                      const spaceBetween = 4;
                      let hiddenCount = 0;
                      const estimateButtonWidth = (text: string) =>
                        Math.max(40, text.length * 8);
                      for (let i = 0; i < side2Variables.length; i++) {
                        let btnWidth = estimateButtonWidth(side2Variables[i]);
                        if (totalWidth + btnWidth + spaceBetween <= maxWidth) {
                          displayedVars.push(side2Variables[i]);
                          totalWidth += btnWidth + spaceBetween;
                        } else {
                          hiddenCount = side2Variables.length - i;
                          break;
                        }
                      }
                      return (
                        <div className="flex flex-wrap space-x-1 justify-center w-full">
                          {displayedVars.map((variable, index) => (
                            <div
                              key={index}
                              className="bg-blue-500 text-white p-2 rounded-md text-sm shadow-md text-center"
                              style={{ minWidth: "40px" }}
                            >
                              {variable}
                            </div>
                          ))}
                          {hiddenCount > 0 && (
                            <div className="bg-gray-500 text-white p-2 rounded-md text-sm shadow-md text-center">
                              +{hiddenCount} more
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            )}
          {/* Bottom (bawah tengah) */}
          {chartVariableConfig[chartType]?.bottom &&
            (chartVariableConfig[chartType].bottom?.min !== 0 ||
              chartVariableConfig[chartType].bottom?.max !== 0) && (
              <div
                className="absolute left-1/2 -translate-x-1/2 z-10"
                style={{ bottom: "-50px" }}
              >
                {/* ...bottom drop area JSX... */}
                {/* Copy dari JSX lama untuk bottom */}
                <div
                  className="flex justify-center items-center space-x-1 w-[200px] border border-gray-400 rounded-md p-1 cursor-pointer"
                  onDrop={(e) => handleDrop(e, "bottom")}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => handleOpenModal("bottom")}
                >
                  {bottomVariables.length === 0 ? (
                    <div className="bg-gray-300 text-gray-500 p-2 rounded-md text-sm shadow-md w-full text-center">
                      {chartType === "3D Bar Chart2" ||
                      chartType === "3D Scatter Plot" ||
                      chartType === "Grouped 3D Scatter Plot" ||
                      chartType === "Clustered 3D Bar Chart" ||
                      chartType === "Stacked 3D Bar Chart"
                        ? "X axis"
                        : "No variables selected"}
                    </div>
                  ) : (
                    (() => {
                      const maxWidth = 100;
                      let totalWidth = 0;
                      let displayedVars = [];
                      const spaceBetween = 4;
                      let hiddenCount = 0;
                      const estimateButtonWidth = (text: string) =>
                        Math.max(40, text.length * 8);
                      for (let i = 0; i < bottomVariables.length; i++) {
                        let btnWidth = estimateButtonWidth(bottomVariables[i]);
                        if (totalWidth + btnWidth + spaceBetween <= maxWidth) {
                          displayedVars.push(bottomVariables[i]);
                          totalWidth += btnWidth + spaceBetween;
                        } else {
                          hiddenCount = bottomVariables.length - i;
                          break;
                        }
                      }
                      return (
                        <div className="flex flex-wrap space-x-1 justify-center w-full">
                          {displayedVars.map((variable, index) => (
                            <div
                              key={index}
                              className="bg-blue-500 text-white p-2 rounded-md text-sm shadow-md text-center"
                              style={{ minWidth: "40px" }}
                            >
                              {variable}
                            </div>
                          ))}
                          {hiddenCount > 0 && (
                            <div className="bg-gray-500 text-white p-2 rounded-md text-sm shadow-md text-center">
                              +{hiddenCount} more
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            )}
          {/* Bottom2 (bawah kanan) */}
          {chartVariableConfig[chartType]?.bottom2 &&
            (chartVariableConfig[chartType].bottom2?.min !== 0 ||
              chartVariableConfig[chartType].bottom2?.max !== 0) && (
              <div
                className="absolute z-10"
                style={{ bottom: "-50px", right: "150px" }}
              >
                {/* ...bottom2 drop area JSX... */}
                {/* Copy dari JSX lama untuk bottom2 */}
                <div
                  className="flex justify-center items-center space-x-1 w-[200px] border border-gray-400 rounded-md p-1 cursor-pointer"
                  onDrop={(e) => handleDrop(e, "bottom2")}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => handleOpenModal("bottom2")}
                >
                  {bottom2Variables.length === 0 ? (
                    <div className="bg-gray-300 text-gray-500 p-2 rounded-md text-sm shadow-md w-full text-center">
                      {chartType === "3D Bar Chart2" ||
                      chartType === "3D Scatter Plot" ||
                      chartType === "Grouped 3D Scatter Plot" ||
                      chartType === "Clustered 3D Bar Chart" ||
                      chartType === "Stacked 3D Bar Chart"
                        ? "Z axis"
                        : "No variables selected"}
                    </div>
                  ) : (
                    (() => {
                      const maxWidth = 100;
                      let totalWidth = 0;
                      let displayedVars = [];
                      const spaceBetween = 4;
                      let hiddenCount = 0;
                      const estimateButtonWidth = (text: string) =>
                        Math.max(40, text.length * 8);
                      for (let i = 0; i < bottom2Variables.length; i++) {
                        let btnWidth = estimateButtonWidth(bottom2Variables[i]);
                        if (totalWidth + btnWidth + spaceBetween <= maxWidth) {
                          displayedVars.push(bottom2Variables[i]);
                          totalWidth += btnWidth + spaceBetween;
                        } else {
                          hiddenCount = bottom2Variables.length - i;
                          break;
                        }
                      }
                      return (
                        <div className="flex flex-wrap space-x-1 justify-center w-full">
                          {displayedVars.map((variable, index) => (
                            <div
                              key={index}
                              className="bg-blue-500 text-white p-2 rounded-md text-sm shadow-md text-center"
                              style={{ minWidth: "40px" }}
                            >
                              {variable}
                            </div>
                          ))}
                          {hiddenCount > 0 && (
                            <div className="bg-gray-500 text-white p-2 rounded-md text-sm shadow-md text-center">
                              +{hiddenCount} more
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            )}
          {/* Color/Group (pojok kanan atas kotak putih) */}
          {chartVariableConfig[chartType]?.color &&
            (chartVariableConfig[chartType].color?.min !== 0 ||
              chartVariableConfig[chartType].color?.max !== 0) && (
              <div className="absolute top-[-20px] right-[-10px] z-10">
                {/* ...color drop area JSX... */}
                <div
                  className="p-2 border border-dashed border-gray-400 rounded-lg text-gray-500"
                  onDrop={(e) => handleDrop(e, "color")}
                  onDragOver={handleDragOver}
                  onClick={() => handleOpenModal("color")}
                >
                  {colorVariables.length === 0 ? (
                    <div className="bg-gray-300 text-gray-500 p-2 rounded-md text-sm shadow-md">
                      Group by
                    </div>
                  ) : (
                    colorVariables.map((variable, index) => (
                      <div
                        key={index}
                        className="bg-blue-500 text-white p-2 rounded-md text-sm shadow-md"
                      >
                        {variable}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          {/* Filter (kanan tengah kotak putih, mirip side2) */}
          {chartVariableConfig[chartType]?.filter &&
            (chartVariableConfig[chartType].filter?.min !== 0 ||
              chartVariableConfig[chartType].filter?.max !== 0) && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2 z-10">
                {/* ...filter drop area JSX... */}
                <div
                  className="bg-gray-300 text-gray-500 p-2 rounded-md text-sm shadow-md rotate-90 w-full text-center"
                  onDrop={(e) => handleDrop(e, "filter")}
                  onDragOver={handleDragOver}
                  onClick={() => handleOpenModal("filter")}
                >
                  {filterVariables.length === 0
                    ? "Filter?"
                    : filterVariables.map((variable, index) => (
                        <div
                          key={index}
                          className="bg-green-500 text-white p-2 rounded-md text-sm shadow-md rotate-90 w-full text-center"
                        >
                          {variable}
                        </div>
                      ))}
                </div>
              </div>
            )}
          {/* Label "High", "Low", "Close" - Vertikal dan Rapi */}
          {(() => {
            const variables = [];

            if (
              (chartVariableConfig[chartType]?.high?.min ?? 0) >= 1 ||
              (chartVariableConfig[chartType]?.high?.max ?? 0) >= 1
            ) {
              variables.push("High Variable?");
            }
            if (
              (chartVariableConfig[chartType]?.low?.min ?? 0) >= 1 ||
              (chartVariableConfig[chartType]?.low?.max ?? 0) >= 1
            ) {
              variables.push("Low Variable?");
            }
            if (
              (chartVariableConfig[chartType]?.close?.min ?? 0) >= 1 ||
              (chartVariableConfig[chartType]?.close?.max ?? 0) >= 1
            ) {
              variables.push("Close Variable?");
            }

            if (variables.length === 0) return null;

            const containerWidth = 400; // Lebar maksimum kontainer
            const itemWidth = `${(containerWidth - 20) / variables.length}px`; // Lebar tiap item berdasarkan jumlah

            return (
              <div className="absolute top-1/2 left-[-170px] transform -translate-y-1/2 rotate-90 flex flex-row justify-center items-center h-[200px] gap-2 cursor-pointer">
                {variables.map((label, index) => {
                  // Create the simplified drop zone for handleDrop (e.g. "high", "low", "close")
                  const dropZone = label
                    .toLowerCase()
                    .replace(" variable?", "") as "high" | "low" | "close";

                  return (
                    <div
                      key={index}
                      className={`${
                        dropZone === "high" && highVariables.length > 0
                          ? "bg-blue-500 text-white border-blue-500"
                          : dropZone === "low" && lowVariables.length > 0
                          ? "bg-blue-500 text-white border-blue-500"
                          : dropZone === "close" && closeVariables.length > 0
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-gray-300 text-gray-500 border-gray-500"
                      } p-2 rounded-md text-sm shadow-md text-center border border-dashed`}
                      style={{ width: itemWidth }} // Set width based on number of elements
                      onDrop={(e) => handleDrop(e, dropZone)} // Pass simplified drop zone (e.g. "high", "low", "close")
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => handleOpenModal(dropZone)} // Klik bisa di mana saja
                    >
                      {/* Menampilkan variabel yang sudah di-drop atau label default */}
                      {
                        dropZone === "high" && highVariables.length > 0
                          ? highVariables.join(", ") // Jika ada variabel, tampilkan
                          : dropZone === "low" && lowVariables.length > 0
                          ? lowVariables.join(", ") // Jika ada variabel, tampilkan
                          : dropZone === "close" && closeVariables.length > 0
                          ? closeVariables.join(", ") // Jika ada variabel, tampilkan
                          : label // Jika tidak ada variabel, tampilkan label default
                      }
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Modal untuk semua variabel */}
          {modalState.isOpen && (
            <div className="absolute inset-0 bg-black bg-opacity-30 flex justify-center items-center rounded-lg z-[9999]">
              <div className="bg-white p-4 rounded-lg shadow-lg w-64">
                <h2 className="text-lg font-bold mb-2 text-center">
                  All{" "}
                  {modalState.type === "side"
                    ? "Side"
                    : modalState.type === "side2"
                    ? "Side2"
                    : modalState.type === "bottom"
                    ? "Bottom"
                    : modalState.type === "bottom2"
                    ? "Bottom2"
                    : modalState.type === "color"
                    ? "Color"
                    : modalState.type === "filter"
                    ? "Filter"
                    : modalState.type === "low"
                    ? "Low"
                    : modalState.type === "high"
                    ? "High"
                    : modalState.type === "close"
                    ? "Close"
                    : "Undefined"}{" "}
                  Variables
                </h2>
                <ul className="space-y-1">
                  {variablesToShow.map((variable: string, index: number) => (
                    <li
                      key={index}
                      className="p-1 bg-gray-200 rounded text-sm flex justify-between items-center"
                    >
                      <span>{variable}</span>
                      <button
                        className="text-red-500 font-bold text-xs"
                        onClick={() =>
                          handleRemoveVariable(
                            modalState.type as
                              | "side"
                              | "bottom"
                              | "low"
                              | "high"
                              | "close"
                              | "side2"
                              | "bottom2",
                            index
                          )
                        }
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded w-full"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Kotak chart preview, hanya chart */}
          <div className="relative bg-gray-100 border-2 border-gray-300 rounded-lg p-2 w-[700px] max-w-full h-[450px] flex items-center justify-center mt-8">
            <div className="bg-white rounded-lg shadow w-full h-full flex items-center justify-center overflow-hidden">
              <div
                id="chart-container"
                ref={chartContainerRef}
                className="w-[90%] h-[90%] max-w-[600px] max-h-[400px] bg-white overflow-hidden"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            </div>
          </div>
        </div>
        {/* ChartService Test Output */}
        {showChartServiceTest && chartServiceOutput && (
          <div className="mt-6 p-4 border-2 border-green-500 rounded-lg bg-green-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-green-800">
                🧪 ChartService Test Output
              </h3>
              <button
                onClick={() => setShowChartServiceTest(false)}
                className="text-green-600 hover:text-green-800 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="bg-white p-4 rounded border">
              <GeneralChartContainer data={chartServiceOutput} />
            </div>
          </div>
        )}
      </div>
    );
  }
);

ChartPreview.displayName = "ChartPreview";

export default ChartPreview;
