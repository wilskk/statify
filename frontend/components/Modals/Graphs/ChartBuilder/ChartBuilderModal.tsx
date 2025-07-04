// src/components/ChartBuilderModal.tsx

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useVariableStore } from "@/stores/useVariableStore";
import { useResultStore } from "@/stores/useResultStore";
import { useDataStore } from "@/stores/useDataStore"; // Import useDataStore
import ChartPreview, { ChartPreviewRef } from "./ChartPreview";
import VariableSelection from "./VariableSelection";
import ChartSelection from "./ChartSelection";
import { chartTypes, ChartType } from "@/components/Modals/Graphs/ChartTypes";
import ResultOutput from "@/app/dashboard/result/components/ResultOutput";
import { chartVariableConfig } from "./ChartVariableConfig";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Pencil2Icon,
  TextAlignLeftIcon,
  BarChartIcon,
  Cross2Icon,
  GearIcon,
} from "@radix-ui/react-icons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HexColorPicker } from "react-colorful";
import { chartConfigOptions } from "./ChartConfigOptions";

interface ChartBuilderModalProps {
  onClose: () => void;
}

const ChartBuilderModal: React.FC<ChartBuilderModalProps> = ({ onClose }) => {
  const [chartType, setChartType] = useState<ChartType>("Vertical Bar Chart");
  const [sideVariables, setSideVariables] = useState<string[]>([]);
  const [side2Variables, setSide2Variables] = useState<string[]>([]);
  const [bottomVariables, setBottomVariables] = useState<string[]>([]);
  const [bottom2Variables, setBottom2Variables] = useState<string[]>([]);
  const [colorVariables, setColorVariables] = useState<string[]>([]);
  const [filterVariables, setFilterVariables] = useState<string[]>([]);
  const [lowVariables, setLowVariables] = useState<string[]>([]);
  const [highVariables, setHighVariables] = useState<string[]>([]);
  const [closeVariables, setCloseVariables] = useState<string[]>([]);

  // Add ref to access ChartPreview
  const chartPreviewRef = useRef<ChartPreviewRef>(null);

  // Add new state variables for chart customization
  const [chartTitle, setChartTitle] = useState<string>("");
  const [chartSubtitle, setChartSubtitle] = useState<string>("");
  // const [titleFontSize, setTitleFontSize] = useState<string>("16");
  // const [subtitleFontSize, setSubtitleFontSize] = useState<string>("14");
  // const [titleColor, setTitleColor] = useState<string>("#000000");
  // const [subtitleColor, setSubtitleColor] = useState<string>("#666666");
  const [xAxisOptions, setXAxisOptions] = useState({
    label: "",
    min: "",
    max: "",
    majorIncrement: "",
    origin: "",
  });
  const [yAxisOptions, setYAxisOptions] = useState({
    label: "",
    min: "",
    max: "",
    majorIncrement: "",
    origin: "",
  });

  // Add state for Y2 axis (dual axis charts)
  const [y2AxisOptions, setY2AxisOptions] = useState({
    label: "",
    min: "",
    max: "",
    majorIncrement: "",
    origin: "",
  });

  // Add state for chart colors
  const [chartColors, setChartColors] = useState<string[]>([
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
  ]);

  // Add state for statistic selection (for Summary Point Plot)
  const [selectedStatistic, setSelectedStatistic] = useState<
    "mean" | "median" | "mode" | "min" | "max"
  >("mean");

  const [isCalculating, setIsCalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { addStatistic, addLog, addAnalytic } = useResultStore();
  const [showResult, setShowResult] = useState(false);

  const variables = useVariableStore.getState().variables;
  const data = useDataStore((state) => state.data);

  // Utility function to check if all axis config values are false
  function isAxisConfigAllFalse(axisConfig: Record<string, boolean>) {
    return Object.values(axisConfig).every((v) => v === false);
  }

  const config = chartConfigOptions[chartType];

  // Helper function to check if config has dual Y axis
  const hasDualYAxis = (axis: any): axis is { x: any; y1: any; y2: any } => {
    return "y1" in axis && "y2" in axis;
  };

  const settingList = [
    {
      key: "title",
      label: "Title",
      icon: <Pencil2Icon className="w-4 h-4 mr-2" />,
      show: config.title,
    },
    {
      key: "subtitle",
      label: "Subtitle",
      icon: <TextAlignLeftIcon className="w-4 h-4 mr-2" />,
      show: config.subtitle,
    },
    {
      key: "statistic",
      label: "Statistic",
      icon: <GearIcon className="w-4 h-4 mr-2" />,
      show: config.statistic || false,
    },
    {
      key: "x-axis",
      label: "X-Axis",
      icon: <BarChartIcon className="w-4 h-4 mr-2" />,
      show: !isAxisConfigAllFalse(config.axis.x),
    },
    // Conditional Y axis settings based on whether chart has dual Y axis
    ...(hasDualYAxis(config.axis)
      ? [
          {
            key: "y1-axis",
            label: "Y1-Axis",
            icon: <BarChartIcon className="w-4 h-4 mr-2 rotate-90" />,
            show: !isAxisConfigAllFalse(config.axis.y1),
          },
          {
            key: "y2-axis",
            label: "Y2-Axis",
            icon: <BarChartIcon className="w-4 h-4 mr-2 rotate-90" />,
            show: !isAxisConfigAllFalse(config.axis.y2),
          },
        ]
      : [
          {
            key: "y-axis",
            label: "Y-Axis",
            icon: <BarChartIcon className="w-4 h-4 mr-2 rotate-90" />,
            show: !isAxisConfigAllFalse((config.axis as any).y),
          },
        ]),
  ].filter((item) => item.show);
  const [selectedSetting, setSelectedSetting] = useState<string>("title");

  const [showCustomizationPanel, setShowCustomizationPanel] = useState(true);

  // Add color presets
  const basicColors = [
    { name: "Red", value: "#ff0000" },
    { name: "Blue", value: "#0000ff" },
    { name: "Green", value: "#00ff00" },
    { name: "Yellow", value: "#ffff00" },
    { name: "Purple", value: "#800080" },
    { name: "Orange", value: "#ffa500" },
    { name: "Pink", value: "#ffc0cb" },
    { name: "Brown", value: "#a52a2a" },
    { name: "Black", value: "#000000" },
    { name: "White", value: "#ffffff" },
  ];

  const gradientPresets = [
    {
      name: "Blue Gradient",
      colors: ["#1a237e", "#0d47a1", "#1976d2", "#2196f3", "#64b5f6"],
    },
    {
      name: "Green Gradient",
      colors: ["#1b5e20", "#2e7d32", "#388e3c", "#4caf50", "#81c784"],
    },
    {
      name: "Red Gradient",
      colors: ["#b71c1c", "#c62828", "#d32f2f", "#e53935", "#ef5350"],
    },
    {
      name: "Purple Gradient",
      colors: ["#4a148c", "#6a1b9a", "#7b1fa2", "#8e24aa", "#ba68c8"],
    },
    {
      name: "Orange Gradient",
      colors: ["#e65100", "#ef6c00", "#f57c00", "#fb8c00", "#ffb74d"],
    },
  ];

  const colorSchemes = [
    {
      name: "Tableau",
      colors: [
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
      ],
    },
    {
      name: "Material",
      colors: [
        "#f44336",
        "#e91e63",
        "#9c27b0",
        "#673ab7",
        "#3f51b5",
        "#2196f3",
        "#03a9f4",
        "#00bcd4",
        "#009688",
        "#4caf50",
      ],
    },
    {
      name: "Pastel",
      colors: [
        "#ffb3ba",
        "#baffc9",
        "#bae1ff",
        "#ffffba",
        "#ffdfba",
        "#ffb3ff",
        "#e6b3ff",
        "#b3d9ff",
        "#b3ffd9",
        "#ffffb3",
      ],
    },
    {
      name: "Vibrant",
      colors: [
        "#ff0000",
        "#00ff00",
        "#0000ff",
        "#ffff00",
        "#ff00ff",
        "#00ffff",
        "#ff8000",
        "#8000ff",
        "#008000",
        "#800000",
      ],
    },
  ];

  // Add new state variables for color selection
  const [selectedColorType, setSelectedColorType] = useState<
    "basic" | "gradient" | "custom"
  >("basic");
  const [selectedGradient, setSelectedGradient] = useState<string>("");
  const [selectedColorScheme, setSelectedColorScheme] = useState<string>("");

  // State for color mode
  const [colorMode, setColorMode] = useState<"single" | "group">("single");
  const [singleColor, setSingleColor] = useState<string>("#1f77b4");
  const [inputColor, setInputColor] = useState<string>("#1f77b4");
  const [pickerColor, setPickerColor] = useState<string>("#1f77b4");
  const [groupColors, setGroupColors] = useState<string[]>([
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
  ]);

  // Array of popular preset colors
  const popularColors = [
    "#000000",
    "#424242",
    "#757575",
    "#BDBDBD",
    "#FFFFFF",
    "#D32F2F",
    "#F44336",
    "#FFCDD2",
    "#E57373",
    "#FF5252",
    "#C2185B",
    "#E040FB",
    "#9C27B0",
    "#7B1FA2",
    "#512DA8",
    "#1976D2",
    "#2196F3",
    "#64B5F6",
    "#03A9F4",
    "#00BCD4",
    "#388E3C",
    "#4CAF50",
    "#81C784",
    "#8BC34A",
    "#CDDC39",
    "#FBC02D",
    "#FFEB3B",
    "#FFD600",
    "#FF9800",
    "#FF5722",
  ];

  // State for showing custom picker
  const singleCustomRef = useRef<HTMLButtonElement | null>(null);
  const [showSingleCustom, setShowSingleCustom] = useState(false);
  const [showGroupCustom, setShowGroupCustom] = useState<number | null>(null);

  const customPresets = [
    "#E69F00",
    "#56B4E9",
    "#009E73",
    "#F0E442",
    "#0072B2",
    "#D55E00",
    "#CC79A7",
    "#000000",
  ];

  useEffect(() => {
    console.log("Updated Side Variables:", sideVariables);
  }, [sideVariables]);

  useEffect(() => {
    console.log("Updated Bottom Variables:", bottomVariables);
  }, [bottomVariables]);

  useEffect(() => {
    if (colorMode === "single") {
      setChartColors([singleColor]);
    } else {
      setChartColors(groupColors);
    }
    // eslint-disable-next-line
  }, [colorMode, singleColor, groupColors]);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    variableName: string
  ) => {
    e.dataTransfer.setData("text/plain", variableName);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleChartTypeChange = (value: ChartType) => {
    setChartType(value);
  };

  const handleDropSide = (newSideVariables: string[]) => {
    setSideVariables(newSideVariables);
    console.log("Updated Side Variables:", newSideVariables);
  };

  const handleDropSide2 = (newSide2Variables: string[]) => {
    setSide2Variables(newSide2Variables);
    console.log("Updated Side2 Variables:", newSide2Variables);
  };

  const handleDropBottom = (newBottomVariables: string[]) => {
    setBottomVariables(newBottomVariables);
    console.log("Updated Bottom Variables:", newBottomVariables);
  };

  const handleDropBottom2 = (newBottom2Variables: string[]) => {
    setBottom2Variables(newBottom2Variables);
    console.log("Updated Bottom2 Variables:", newBottom2Variables);
  };

  const handleDropColor = (newColorVariables: string[]) => {
    setColorVariables(newColorVariables);
    console.log("Updated Color Variables:", newColorVariables);
  };

  const handleDropFilter = (newFilterVariables: string[]) => {
    setFilterVariables(newFilterVariables);
    console.log("Updated Bottom Variables:", newFilterVariables);
  };

  const handleDropLow = (newLowVariables: string[]) => {
    setLowVariables(newLowVariables);
    console.log("Updated Low Variables:", newLowVariables);
  };

  const handleDropHigh = (newHighVariables: string[]) => {
    setHighVariables(newHighVariables);
    console.log("Updated High Variables:", newHighVariables);
  };

  const handleDropClose = (newCloseVariables: string[]) => {
    setCloseVariables(newCloseVariables);
    console.log("Updated Close Variables:", newCloseVariables);
  };

  const handleRemoveVariable = (
    type: "side" | "bottom" | "low" | "high" | "close" | "side2" | "bottom2",
    index: number
  ) => {
    if (type === "side") {
      setSideVariables((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "bottom") {
      setBottomVariables((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "low") {
      setLowVariables((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "high") {
      setHighVariables((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "close") {
      setCloseVariables((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "side2") {
      setSide2Variables((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "bottom2") {
      setBottom2Variables((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleResetVariables = () => {
    setSideVariables([]);
    setSide2Variables([]);
    setBottomVariables([]);
    setColorVariables([]);
    setFilterVariables([]);
    setLowVariables([]);
    setHighVariables([]);
    setCloseVariables([]);
    setBottom2Variables([]);
    setXAxisOptions({
      label: "",
      min: "",
      max: "",
      majorIncrement: "",
      origin: "",
    });
    setYAxisOptions({
      label: "",
      min: "",
      max: "",
      majorIncrement: "",
      origin: "",
    });
    setY2AxisOptions({
      label: "",
      min: "",
      max: "",
      majorIncrement: "",
      origin: "",
    });
    setChartTitle("");
    setChartSubtitle("");
    setSelectedStatistic("mean");
  };

  const handleGenerateChart = async () => {
    // Validasi Input
    if (
      !validateChartVariables(
        chartType,
        sideVariables,
        bottomVariables,
        lowVariables,
        highVariables,
        closeVariables
      )
    ) {
      return;
    }

    setIsCalculating(true);
    setErrorMsg(null);

    try {
      // Get the pre-generated JSON from ChartPreview using ref
      const chartJSON = chartPreviewRef.current?.getGeneratedChartJSON();

      if (!chartJSON) {
        setErrorMsg(
          "Chart JSON tidak tersedia. Pastikan data dan variabel sudah dipilih."
        );
        setIsCalculating(false);
        return;
      }

      // 1. Tambahkan Log
      const logMsg = `GENERATE CHART TYPE ${chartType} WITH VARIABLES Y: ${sideVariables.join(
        ", "
      )} X: ${bottomVariables.join(", ")}`;

      // Add log first and get the ID
      const logId = await addLog({ log: logMsg });

      // Add analytic with log_id
      const analyticId = await addAnalytic(logId, {
        title: "Chart Builder",
        note: "",
      });

      // Add statistic with analytic_id using the pre-generated JSON
      await addStatistic(analyticId, {
        title: chartType,
        output_data: chartJSON,
        components: chartType,
        description: "",
      });

      setIsCalculating(false);
      onClose(); // Tutup modal
      setShowResult(true);
    } catch (error) {
      console.error("Error during chart generation:", error);
      setErrorMsg("Terjadi kesalahan saat menyimpan hasil.");
      setIsCalculating(false);
    }
  };

  const validateChartVariables = (
    chartType: ChartType,
    sideVariables: string[],
    bottomVariables: string[],
    lowVariables: string[],
    highVariables: string[],
    closeVariables: string[]
  ) => {
    const chartConfig = chartVariableConfig[chartType];

    // Validasi untuk side (sumbu Y)
    if (
      sideVariables.length < chartConfig.side.min ||
      sideVariables.length > chartConfig.side.max
    ) {
      alert(
        `Jumlah variabel untuk sumbu Y (side) harus antara ${chartConfig.side.min} dan ${chartConfig.side.max}.`
      );
      return false;
    }

    // Validasi untuk bottom (sumbu X)
    if (
      bottomVariables.length < chartConfig.bottom.min ||
      bottomVariables.length > chartConfig.bottom.max
    ) {
      alert(
        `Jumlah variabel untuk sumbu X (bottom) harus antara ${chartConfig.bottom.min} dan ${chartConfig.bottom.max}.`
      );
      return false;
    }

    if (
      chartConfig.low &&
      (lowVariables.length < chartConfig.low.min ||
        lowVariables.length > chartConfig.low.max)
    ) {
      alert(
        `Jumlah variabel untuk sumbu low harus antara ${chartConfig.low.min} dan ${chartConfig.low.max}.`
      );
      return false;
    }

    if (
      chartConfig.high &&
      (highVariables.length < chartConfig.high.min ||
        highVariables.length > chartConfig.high.max)
    ) {
      alert(
        `Jumlah variabel untuk sumbu high harus antara ${chartConfig.high.min} dan ${chartConfig.high.max}.`
      );
      return false;
    }

    if (
      chartConfig.close &&
      (closeVariables.length < chartConfig.close.min ||
        closeVariables.length > chartConfig.close.max)
    ) {
      alert(
        `Jumlah variabel untuk sumbu close harus antara ${chartConfig.close.min} dan ${chartConfig.close.max}.`
      );
      return false;
    }

    return true; // Jika semua validasi lolos
  };

  if (showResult) {
    return <ResultOutput />;
  }

  return (
    <DialogContent className="sm:max-h-[90%] max-w-[90%] overflow-auto">
      <DialogHeader className="p-2 m-0 flex flex-row justify-between items-center">
        <DialogTitle className="text-lg font-semibold m-0">
          Chart Builder
        </DialogTitle>
        {!showCustomizationPanel && (
          <button
            className="ml-2 p-2 rounded hover:bg-gray-200 text-gray-600"
            title="Show Customization"
            onClick={() => setShowCustomizationPanel(true)}
          >
            <GearIcon className="w-5 h-5" />
          </button>
        )}
      </DialogHeader>

      <div className="grid grid-cols-12 gap-6 py-4">
        {/* Kolom Kiri - Pilih Variabel dan Jenis Chart */}
        <div
          className={
            showCustomizationPanel
              ? "col-span-3 space-y-6 pr-6 border-r-2 border-gray-100"
              : "col-span-4 space-y-6 pr-6 border-r-2 border-gray-100"
          }
        >
          <VariableSelection
            variables={variables}
            onDragStart={handleDragStart}
          />
          {/* Chart Type Selection tetap di sini */}
          <TooltipProvider>
            <div className="border p-4 rounded-lg shadow-sm h-[300px] mt-4">
              <div className="mb-2">
                <Label>Choose Graph</Label>
              </div>
              <div className="overflow-y-auto max-h-[220px]">
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {chartTypes.map((type, index) => (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <div
                          className={`relative cursor-pointer p-4 border-2 rounded-lg text-center flex flex-col items-center justify-center h-[150px] w-full ${
                            chartType === type
                              ? "bg-gray-300 text-black"
                              : "bg-gray-100"
                          }`}
                          onClick={() => handleChartTypeChange(type)}
                        >
                          <div className="flex justify-center items-center overflow-hidden mb-2">
                            <ChartSelection
                              chartType={type}
                              width={80}
                              height={80}
                              useaxis={false}
                            />
                          </div>
                          <span className="font-semibold text-xs block">
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {type.charAt(0).toUpperCase() + type.slice(1)} Chart
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          </TooltipProvider>
        </div>

        {/* Kolom Tengah - Preview Chart */}
        <div
          className={
            showCustomizationPanel
              ? "col-span-6 flex justify-center items-center"
              : "col-span-8 flex justify-center items-center"
          }
        >
          <ChartPreview
            chartType={chartType}
            width={480}
            height={270}
            useaxis={true}
            sideVariables={sideVariables}
            side2Variables={side2Variables}
            bottomVariables={bottomVariables}
            bottom2Variables={bottom2Variables}
            colorVariables={colorVariables}
            filterVariables={filterVariables}
            lowVariables={lowVariables}
            highVariables={highVariables}
            closeVariables={closeVariables}
            onDropSide={handleDropSide}
            onDropSide2={handleDropSide2}
            onDropBottom={handleDropBottom}
            onDropBottom2={handleDropBottom2}
            onDropColor={handleDropColor}
            onDropFilter={handleDropFilter}
            onDropLow={handleDropLow}
            onDropHigh={handleDropHigh}
            onDropClose={handleDropClose}
            handleRemoveVariable={handleRemoveVariable}
            validateChartVariables={validateChartVariables}
            chartTitle={chartTitle}
            chartSubtitle={chartSubtitle}
            xAxisLabel={xAxisOptions.label}
            yAxisLabel={yAxisOptions.label}
            yLeftAxisLabel={yAxisOptions.label}
            yRightAxisLabel={y2AxisOptions.label}
            xAxisMin={xAxisOptions.min}
            xAxisMax={xAxisOptions.max}
            xAxisMajorIncrement={xAxisOptions.majorIncrement}
            xAxisOrigin={xAxisOptions.origin}
            yAxisMin={yAxisOptions.min}
            yAxisMax={yAxisOptions.max}
            yAxisMajorIncrement={yAxisOptions.majorIncrement}
            yAxisOrigin={yAxisOptions.origin}
            yRightAxisMin={y2AxisOptions.min}
            yRightAxisMax={y2AxisOptions.max}
            yRightAxisMajorIncrement={y2AxisOptions.majorIncrement}
            yRightAxisOrigin={y2AxisOptions.origin}
            chartColors={chartColors}
            selectedStatistic={selectedStatistic}
            ref={chartPreviewRef}
          />
        </div>

        {/* Kolom Kanan - Panel Customisasi (Sidebar + Form) */}
        {showCustomizationPanel && (
          <div className="col-span-3 flex flex-col h-full pl-6 border-l-2 border-gray-100 relative">
            {/* Tombol X di pojok kanan atas panel */}
            <button
              className="absolute top-2 right-2 p-1 rounded hover:bg-gray-200 text-gray-600 z-10"
              title="Close Customization Panel"
              onClick={() => setShowCustomizationPanel(false)}
            >
              <Cross2Icon className="w-5 h-5" />
            </button>

            <Tabs defaultValue="element" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="element">Element</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
              </TabsList>

              <TabsContent value="element" className="mt-4">
                {/* Sidebar List */}
                <div className="flex flex-col gap-1 overflow-y-auto max-h-48 mb-4">
                  {settingList.map((item) => (
                    <button
                      key={item.key}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left ${
                        selectedSetting === item.key
                          ? "bg-blue-100 text-blue-700 font-semibold"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                      onClick={() => setSelectedSetting(item.key)}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
                {/* Form Pengaturan Detail */}
                <div className="flex-1 border rounded-lg p-4 bg-white shadow-sm">
                  {selectedSetting === "title" &&
                    chartConfigOptions[chartType].title && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="chartTitle">Title</Label>
                          <input
                            id="chartTitle"
                            type="text"
                            className="w-full p-2 border rounded-md"
                            value={chartTitle}
                            onChange={(e) => setChartTitle(e.target.value)}
                            placeholder="Enter chart title"
                          />
                        </div>
                        {/* {chartConfigOptions[chartType].titleFontSize && (
                          <div>
                            <Label htmlFor="titleFontSize">Font Size</Label>
                            <input
                              id="titleFontSize"
                              type="number"
                              className="w-full p-2 border rounded-md"
                              value={titleFontSize}
                              onChange={(e) => setTitleFontSize(e.target.value)}
                              placeholder="Enter font size"
                              min="8"
                              max="72"
                            />
                          </div>
                        )}
                        {chartConfigOptions[chartType].titleColor && (
                          <div>
                            <Label htmlFor="titleColor">Color</Label>
                            <div className="flex items-center gap-2">
                              <input
                                id="titleColor"
                                type="color"
                                className="w-10 h-10 p-1 border rounded-md"
                                value={titleColor}
                                onChange={(e) => setTitleColor(e.target.value)}
                              />
                              <input
                                type="text"
                                className="flex-1 p-2 border rounded-md"
                                value={titleColor}
                                onChange={(e) => setTitleColor(e.target.value)}
                                placeholder="Enter color code"
                              />
                            </div>
                          </div>
                        )} */}
                      </div>
                    )}
                  {selectedSetting === "subtitle" &&
                    chartConfigOptions[chartType].subtitle && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="chartSubtitle">Subtitle</Label>
                          <input
                            id="chartSubtitle"
                            type="text"
                            className="w-full p-2 border rounded-md"
                            value={chartSubtitle}
                            onChange={(e) => setChartSubtitle(e.target.value)}
                            placeholder="Enter chart subtitle"
                          />
                        </div>
                        {/* {chartConfigOptions[chartType].subtitleFontSize && (
                          <div>
                            <Label htmlFor="subtitleFontSize">Font Size</Label>
                            <input
                              id="subtitleFontSize"
                              type="number"
                              className="w-full p-2 border rounded-md"
                              value={subtitleFontSize}
                              onChange={(e) =>
                                setSubtitleFontSize(e.target.value)
                              }
                              placeholder="Enter font size"
                              min="8"
                              max="72"
                            />
                          </div>
                        )}
                        {chartConfigOptions[chartType].subtitleColor && (
                          <div>
                            <Label htmlFor="subtitleColor">Color</Label>
                            <div className="flex items-center gap-2">
                              <input
                                id="subtitleColor"
                                type="color"
                                className="w-10 h-10 p-1 border rounded-md"
                                value={subtitleColor}
                                onChange={(e) =>
                                  setSubtitleColor(e.target.value)
                                }
                              />
                              <input
                                type="text"
                                className="flex-1 p-2 border rounded-md"
                                value={subtitleColor}
                                onChange={(e) =>
                                  setSubtitleColor(e.target.value)
                                }
                                placeholder="Enter color code"
                              />
                            </div>
                          </div>
                        )} */}
                      </div>
                    )}
                  {selectedSetting === "statistic" &&
                    chartConfigOptions[chartType].statistic && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="selectedStatistic">
                            Statistical Function
                          </Label>
                          <Select
                            value={selectedStatistic}
                            onValueChange={(value: any) =>
                              setSelectedStatistic(value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select statistic" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mean">
                                Mean (Average)
                              </SelectItem>
                              <SelectItem value="median">Median</SelectItem>
                              <SelectItem value="mode">Mode</SelectItem>
                              <SelectItem value="min">Minimum</SelectItem>
                              <SelectItem value="max">Maximum</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">
                            Choose which statistical measure to display for each
                            category
                          </p>
                        </div>
                      </div>
                    )}
                  {selectedSetting === "x-axis" && (
                    <div className="space-y-2">
                      {chartConfigOptions[chartType].axis.x.label && (
                        <>
                          <Label htmlFor="xAxisLabel">Label</Label>
                          <input
                            id="xAxisLabel"
                            type="text"
                            className="w-full p-2 border rounded-md"
                            value={xAxisOptions.label}
                            onChange={(e) =>
                              setXAxisOptions({
                                ...xAxisOptions,
                                label: e.target.value,
                              })
                            }
                            placeholder="Enter X-axis label"
                          />
                        </>
                      )}
                      {chartConfigOptions[chartType].axis.x.min && (
                        <>
                          <Label htmlFor="xAxisMin">Minimum</Label>
                          <input
                            id="xAxisMin"
                            type="number"
                            className="w-full p-2 border rounded-md"
                            value={xAxisOptions.min}
                            onChange={(e) =>
                              setXAxisOptions({
                                ...xAxisOptions,
                                min: e.target.value,
                              })
                            }
                            placeholder="Min value"
                          />
                        </>
                      )}
                      {chartConfigOptions[chartType].axis.x.max && (
                        <>
                          <Label htmlFor="xAxisMax">Maximum</Label>
                          <input
                            id="xAxisMax"
                            type="number"
                            className="w-full p-2 border rounded-md"
                            value={xAxisOptions.max}
                            onChange={(e) =>
                              setXAxisOptions({
                                ...xAxisOptions,
                                max: e.target.value,
                              })
                            }
                            placeholder="Max value"
                          />
                        </>
                      )}
                      {chartConfigOptions[chartType].axis.x.majorIncrement && (
                        <>
                          <Label htmlFor="xAxisMajorIncrement">
                            Major Increment
                          </Label>
                          <input
                            id="xAxisMajorIncrement"
                            type="number"
                            className="w-full p-2 border rounded-md"
                            value={xAxisOptions.majorIncrement}
                            onChange={(e) =>
                              setXAxisOptions({
                                ...xAxisOptions,
                                majorIncrement: e.target.value,
                              })
                            }
                            placeholder="Major increment"
                          />
                        </>
                      )}
                      {chartConfigOptions[chartType].axis.x.origin && (
                        <>
                          <Label htmlFor="xAxisOrigin">Origin</Label>
                          <input
                            id="xAxisOrigin"
                            type="number"
                            className="w-full p-2 border rounded-md"
                            value={xAxisOptions.origin}
                            onChange={(e) =>
                              setXAxisOptions({
                                ...xAxisOptions,
                                origin: e.target.value,
                              })
                            }
                            placeholder="Origin value"
                          />
                        </>
                      )}
                    </div>
                  )}
                  {selectedSetting === "y-axis" &&
                    !hasDualYAxis(config.axis) && (
                      <div className="space-y-2">
                        {(chartConfigOptions[chartType].axis as any).y
                          .label && (
                          <>
                            <Label htmlFor="yAxisLabel">Label</Label>
                            <input
                              id="yAxisLabel"
                              type="text"
                              className="w-full p-2 border rounded-md"
                              value={yAxisOptions.label}
                              onChange={(e) =>
                                setYAxisOptions({
                                  ...yAxisOptions,
                                  label: e.target.value,
                                })
                              }
                              placeholder="Enter Y-axis label"
                            />
                          </>
                        )}
                        {(chartConfigOptions[chartType].axis as any).y.min && (
                          <>
                            <Label htmlFor="yAxisMin">Minimum</Label>
                            <input
                              id="yAxisMin"
                              type="number"
                              className="w-full p-2 border rounded-md"
                              value={yAxisOptions.min}
                              onChange={(e) =>
                                setYAxisOptions({
                                  ...yAxisOptions,
                                  min: e.target.value,
                                })
                              }
                              placeholder="Min value"
                            />
                          </>
                        )}
                        {(chartConfigOptions[chartType].axis as any).y.max && (
                          <>
                            <Label htmlFor="yAxisMax">Maximum</Label>
                            <input
                              id="yAxisMax"
                              type="number"
                              className="w-full p-2 border rounded-md"
                              value={yAxisOptions.max}
                              onChange={(e) =>
                                setYAxisOptions({
                                  ...yAxisOptions,
                                  max: e.target.value,
                                })
                              }
                              placeholder="Max value"
                            />
                          </>
                        )}
                        {(chartConfigOptions[chartType].axis as any).y
                          .majorIncrement && (
                          <>
                            <Label htmlFor="yAxisMajorIncrement">
                              Major Increment
                            </Label>
                            <input
                              id="yAxisMajorIncrement"
                              type="number"
                              className="w-full p-2 border rounded-md"
                              value={yAxisOptions.majorIncrement}
                              onChange={(e) =>
                                setYAxisOptions({
                                  ...yAxisOptions,
                                  majorIncrement: e.target.value,
                                })
                              }
                              placeholder="Major increment"
                            />
                          </>
                        )}
                        {(chartConfigOptions[chartType].axis as any).y
                          .origin && (
                          <>
                            <Label htmlFor="yAxisOrigin">Origin</Label>
                            <input
                              id="yAxisOrigin"
                              type="number"
                              className="w-full p-2 border rounded-md"
                              value={yAxisOptions.origin}
                              onChange={(e) =>
                                setYAxisOptions({
                                  ...yAxisOptions,
                                  origin: e.target.value,
                                })
                              }
                              placeholder="Origin value"
                            />
                          </>
                        )}
                      </div>
                    )}
                  {selectedSetting === "y1-axis" &&
                    hasDualYAxis(config.axis) && (
                      <div className="space-y-2">
                        {config.axis.y1.label && (
                          <>
                            <Label htmlFor="y1AxisLabel">Y1-Axis Label</Label>
                            <input
                              id="y1AxisLabel"
                              type="text"
                              className="w-full p-2 border rounded-md"
                              value={yAxisOptions.label}
                              onChange={(e) =>
                                setYAxisOptions({
                                  ...yAxisOptions,
                                  label: e.target.value,
                                })
                              }
                              placeholder="Enter Y1-axis label"
                            />
                          </>
                        )}
                        {config.axis.y1.min && (
                          <>
                            <Label htmlFor="y1AxisMin">Minimum</Label>
                            <input
                              id="y1AxisMin"
                              type="number"
                              className="w-full p-2 border rounded-md"
                              value={yAxisOptions.min}
                              onChange={(e) =>
                                setYAxisOptions({
                                  ...yAxisOptions,
                                  min: e.target.value,
                                })
                              }
                              placeholder="Min value"
                            />
                          </>
                        )}
                        {config.axis.y1.max && (
                          <>
                            <Label htmlFor="y1AxisMax">Maximum</Label>
                            <input
                              id="y1AxisMax"
                              type="number"
                              className="w-full p-2 border rounded-md"
                              value={yAxisOptions.max}
                              onChange={(e) =>
                                setYAxisOptions({
                                  ...yAxisOptions,
                                  max: e.target.value,
                                })
                              }
                              placeholder="Max value"
                            />
                          </>
                        )}
                        {config.axis.y1.majorIncrement && (
                          <>
                            <Label htmlFor="y1AxisMajorIncrement">
                              Major Increment
                            </Label>
                            <input
                              id="y1AxisMajorIncrement"
                              type="number"
                              className="w-full p-2 border rounded-md"
                              value={yAxisOptions.majorIncrement}
                              onChange={(e) =>
                                setYAxisOptions({
                                  ...yAxisOptions,
                                  majorIncrement: e.target.value,
                                })
                              }
                              placeholder="Major increment"
                            />
                          </>
                        )}
                        {config.axis.y1.origin && (
                          <>
                            <Label htmlFor="y1AxisOrigin">Origin</Label>
                            <input
                              id="y1AxisOrigin"
                              type="number"
                              className="w-full p-2 border rounded-md"
                              value={yAxisOptions.origin}
                              onChange={(e) =>
                                setYAxisOptions({
                                  ...yAxisOptions,
                                  origin: e.target.value,
                                })
                              }
                              placeholder="Origin value"
                            />
                          </>
                        )}
                      </div>
                    )}
                  {selectedSetting === "y2-axis" &&
                    hasDualYAxis(config.axis) && (
                      <div className="space-y-2">
                        {config.axis.y2.label && (
                          <>
                            <Label htmlFor="y2AxisLabel">Y2-Axis Label</Label>
                            <input
                              id="y2AxisLabel"
                              type="text"
                              className="w-full p-2 border rounded-md"
                              value={y2AxisOptions.label}
                              onChange={(e) =>
                                setY2AxisOptions({
                                  ...y2AxisOptions,
                                  label: e.target.value,
                                })
                              }
                              placeholder="Enter Y2-axis label"
                            />
                          </>
                        )}
                        {config.axis.y2.min && (
                          <>
                            <Label htmlFor="y2AxisMin">Minimum</Label>
                            <input
                              id="y2AxisMin"
                              type="number"
                              className="w-full p-2 border rounded-md"
                              value={y2AxisOptions.min}
                              onChange={(e) =>
                                setY2AxisOptions({
                                  ...y2AxisOptions,
                                  min: e.target.value,
                                })
                              }
                              placeholder="Min value"
                            />
                          </>
                        )}
                        {config.axis.y2.max && (
                          <>
                            <Label htmlFor="y2AxisMax">Maximum</Label>
                            <input
                              id="y2AxisMax"
                              type="number"
                              className="w-full p-2 border rounded-md"
                              value={y2AxisOptions.max}
                              onChange={(e) =>
                                setY2AxisOptions({
                                  ...y2AxisOptions,
                                  max: e.target.value,
                                })
                              }
                              placeholder="Max value"
                            />
                          </>
                        )}
                        {config.axis.y2.majorIncrement && (
                          <>
                            <Label htmlFor="y2AxisMajorIncrement">
                              Major Increment
                            </Label>
                            <input
                              id="y2AxisMajorIncrement"
                              type="number"
                              className="w-full p-2 border rounded-md"
                              value={y2AxisOptions.majorIncrement}
                              onChange={(e) =>
                                setY2AxisOptions({
                                  ...y2AxisOptions,
                                  majorIncrement: e.target.value,
                                })
                              }
                              placeholder="Major increment"
                            />
                          </>
                        )}
                        {config.axis.y2.origin && (
                          <>
                            <Label htmlFor="y2AxisOrigin">Origin</Label>
                            <input
                              id="y2AxisOrigin"
                              type="number"
                              className="w-full p-2 border rounded-md"
                              value={y2AxisOptions.origin}
                              onChange={(e) =>
                                setY2AxisOptions({
                                  ...y2AxisOptions,
                                  origin: e.target.value,
                                })
                              }
                              placeholder="Origin value"
                            />
                          </>
                        )}
                      </div>
                    )}
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="mt-4">
                {chartConfigOptions[chartType].chartColors && (
                  <div className="space-y-6">
                    <div>
                      <Label>Color Mode</Label>
                      <div className="flex gap-2 mt-2">
                        <button
                          className={`px-4 py-2 rounded border ${
                            colorMode === "single"
                              ? "bg-blue-500 text-white"
                              : "bg-white border-gray-300"
                          }`}
                          onClick={() => setColorMode("single")}
                        >
                          Single
                        </button>
                        <button
                          className={`px-4 py-2 rounded border ${
                            colorMode === "group"
                              ? "bg-blue-500 text-white"
                              : "bg-white border-gray-300"
                          }`}
                          onClick={() => setColorMode("group")}
                        >
                          Group
                        </button>
                      </div>
                    </div>
                    {colorMode === "single" && (
                      <div>
                        <Label>Pick Color</Label>
                        {/* Preview warna yang sedang dipilih */}
                        <div className="flex flex-col items-center my-4">
                          <div
                            className="w-14 h-14 rounded-full border-2 border-gray-300 mb-2"
                            style={{ backgroundColor: pickerColor }}
                          />
                          <span className="font-mono text-base">
                            {pickerColor}
                          </span>
                        </div>
                        {/* Grid preset warna */}
                        <div className="w-full flex justify-center">
                          <div className="grid grid-cols-7 gap-2 w-full max-w-xs relative">
                            <button
                              ref={singleCustomRef}
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                showSingleCustom
                                  ? "border-blue-500"
                                  : "border-gray-300"
                              }`}
                              onClick={() => setShowSingleCustom((v) => !v)}
                              title="Custom color"
                              style={{
                                background:
                                  "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
                              }}
                            >
                              <span className="text-lg font-bold text-white">
                                +
                              </span>
                            </button>
                            {popularColors.map((color) => (
                              <button
                                key={color}
                                className={`w-8 h-8 rounded-full border-2 ${
                                  pickerColor === color && !showSingleCustom
                                    ? "border-blue-500"
                                    : "border-transparent"
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                  setPickerColor(color);
                                  setInputColor(color);
                                  setSingleColor(color);
                                  setChartColors([color]);
                                  setShowSingleCustom(false);
                                }}
                                title={color}
                              />
                            ))}
                            {/* Popover custom color picker */}
                            {showSingleCustom && (
                              <div
                                className="absolute left-0 top-12 z-20 bg-white rounded-lg shadow-lg p-4 flex flex-col items-center border"
                                style={{ minWidth: 220 }}
                              >
                                <button
                                  className="absolute top-1 right-1 text-gray-400 hover:text-gray-700"
                                  onClick={() => setShowSingleCustom(false)}
                                  title="Close"
                                >
                                  ×
                                </button>
                                <HexColorPicker
                                  color={pickerColor}
                                  onChange={(c) => {
                                    setPickerColor(c);
                                    setInputColor(c);
                                    setSingleColor(c);
                                    setChartColors([c]);
                                  }}
                                />
                                <input
                                  type="text"
                                  className="w-28 p-1 border rounded text-center mt-2"
                                  value={inputColor}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setInputColor(val);
                                    if (/^#[0-9A-Fa-f]{3,8}$/.test(val)) {
                                      setPickerColor(val);
                                      setSingleColor(val);
                                      setChartColors([val]);
                                    }
                                  }}
                                  maxLength={9}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {colorMode === "group" && (
                      <div>
                        <Label>Pick Colors for Each Group</Label>
                        <div className="space-y-3 mt-2">
                          {groupColors.map((color, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 relative"
                            >
                              <span className="text-xs w-14">
                                Group {idx + 1}
                              </span>
                              <button
                                className="w-7 h-7 rounded-full border-2"
                                style={{ backgroundColor: color }}
                                onClick={() => setShowGroupCustom(idx)}
                              />
                              {showGroupCustom === idx && (
                                <div
                                  className="absolute left-16 z-20 bg-white rounded-lg shadow-lg p-3 border flex flex-col items-center"
                                  tabIndex={0}
                                  onBlur={(e) => {
                                    if (
                                      !e.currentTarget.contains(e.relatedTarget)
                                    )
                                      setShowGroupCustom(null);
                                  }}
                                >
                                  <div className="flex gap-1 mb-2">
                                    {customPresets.map((preset) => (
                                      <button
                                        key={preset}
                                        className={`w-6 h-6 rounded-full border-2 ${
                                          color === preset
                                            ? "border-blue-500"
                                            : "border-gray-300"
                                        }`}
                                        style={{ backgroundColor: preset }}
                                        onClick={() => {
                                          const newColors = [...groupColors];
                                          newColors[idx] = preset;
                                          setGroupColors(newColors);
                                          setShowGroupCustom(null);
                                        }}
                                        title={preset}
                                      />
                                    ))}
                                  </div>
                                  <HexColorPicker
                                    color={color}
                                    onChange={(c) => {
                                      const newColors = [...groupColors];
                                      newColors[idx] = c;
                                      setGroupColors(newColors);
                                    }}
                                  />
                                  <input
                                    type="text"
                                    className="w-24 p-1 border rounded text-center mt-2"
                                    value={color}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const newColors = [...groupColors];
                                      newColors[idx] = val;
                                      setGroupColors(newColors);
                                    }}
                                    maxLength={9}
                                    placeholder="#RRGGBB"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="flex gap-2 mt-2">
                            <button
                              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-xs"
                              onClick={() =>
                                setGroupColors([...groupColors, "#000000"])
                              }
                            >
                              + Add Group Color
                            </button>
                            {groupColors.length > 1 && (
                              <button
                                className="px-3 py-1 rounded bg-red-200 hover:bg-red-300 text-xs"
                                onClick={() =>
                                  setGroupColors(groupColors.slice(0, -1))
                                }
                              >
                                - Remove Last
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && <div className="text-red-500 text-sm mb-2">{errorMsg}</div>}

      <DialogFooter>
        <Button variant="outline" onClick={handleResetVariables}>
          Reset
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleGenerateChart}
          disabled={isCalculating || data.length === 0}
        >
          {isCalculating ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-gray-900 rounded-full"
                viewBox="0 0 24 24"
              ></svg>
              Generating...
            </>
          ) : (
            "Generate Chart"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ChartBuilderModal;
