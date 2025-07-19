import React, { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HexColorPicker } from "react-colorful";
import {
  Cross2Icon,
  Pencil2Icon,
  TextAlignLeftIcon,
  BarChartIcon,
  GearIcon,
} from "@radix-ui/react-icons";
import { d3ColorScales } from "@/utils/chartBuilder/defaultStyles/defaultColors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomizationPanelProps {
  onClose: () => void;
  chartType: string;
  chartConfigOptions: any;
  colorMode: "single" | "group" | "custom";
  setColorMode: (mode: "single" | "group" | "custom") => void;
  singleColor: string;
  setSingleColor: (color: string) => void;
  groupColors: string[];
  setGroupColors: (colors: string[]) => void;
  setChartColors: (colors: string[]) => void;
  // Chart title & subtitle
  chartTitle: string;
  setChartTitle: (title: string) => void;
  chartSubtitle: string;
  setChartSubtitle: (subtitle: string) => void;
  // Axis options
  xAxisOptions: any;
  setXAxisOptions: (options: any) => void;
  yAxisOptions: any;
  setYAxisOptions: (options: any) => void;
  y2AxisOptions: any;
  setY2AxisOptions: (options: any) => void;
  // Statistic selection
  selectedStatistic: "mean" | "median" | "mode" | "min" | "max";
  setSelectedStatistic: (
    stat: "mean" | "median" | "mode" | "min" | "max"
  ) => void;
  // Error bar options
  errorBarType?: "ci" | "se" | "sd";
  setErrorBarType?: (type: "ci" | "se" | "sd") => void;
  confidenceLevel?: number;
  setConfidenceLevel?: (level: number) => void;
  seMultiplier?: number;
  setSeMultiplier?: (multiplier: number) => void;
  sdMultiplier?: number;
  setSdMultiplier?: (multiplier: number) => void;
  // Normal curve options
  showNormalCurve?: boolean;
  setShowNormalCurve?: (show: boolean) => void;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  onClose,
  chartType,
  chartConfigOptions,
  colorMode,
  setColorMode,
  singleColor,
  setSingleColor,
  groupColors,
  setGroupColors,
  setChartColors,
  chartTitle,
  setChartTitle,
  chartSubtitle,
  setChartSubtitle,
  xAxisOptions,
  setXAxisOptions,
  yAxisOptions,
  setYAxisOptions,
  y2AxisOptions,
  setY2AxisOptions,
  selectedStatistic,
  setSelectedStatistic,
  errorBarType,
  setErrorBarType,
  confidenceLevel,
  setConfidenceLevel,
  seMultiplier,
  setSeMultiplier,
  sdMultiplier,
  setSdMultiplier,
  showNormalCurve,
  setShowNormalCurve,
}) => {
  const [selectedColorType, setSelectedColorType] = useState<
    "sequential" | "diverging" | "categorical"
  >("categorical");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(
    null
  );
  const [inputColor, setInputColor] = useState(singleColor);
  const [selectedSetting, setSelectedSetting] = useState<string>("title");
  const [showSingleCustom, setShowSingleCustom] = useState(false);
  const [pickerColor, setPickerColor] = useState(singleColor);
  const config = chartConfigOptions[chartType];

  const handleColorScaleSelect = (colors: string[]) => {
    if (colorMode === "single") {
      setSingleColor(colors[0]);
      setChartColors([colors[0]]);
    } else {
      setGroupColors(colors);
      setChartColors(colors);
    }
  };

  // Custom color gradient for the "custom" mode
  const customGradientColors = [
    "#4B0082", // Dark Purple
    "#663399", // Purple
    "#8B4513", // Light Purple
    "#BA55D3", // Lighter Purple
    "#DDA0DD", // Very Light Purple
  ];

  // Settings list for element customization
  const settingList = [
    {
      key: "title",
      label: "Title",
      icon: <Pencil2Icon className="w-4 h-4 mr-2" />,
      show: chartConfigOptions[chartType].title,
    },
    {
      key: "subtitle",
      label: "Subtitle",
      icon: <TextAlignLeftIcon className="w-4 h-4 mr-2" />,
      show: chartConfigOptions[chartType].subtitle,
    },
    {
      key: "statistic",
      label: "Statistic",
      icon: <GearIcon className="w-4 h-4 mr-2" />,
      show: chartConfigOptions[chartType].statistic || false,
    },
    {
      key: "normal-curve",
      label: "Normal Curve",
      icon: <BarChartIcon className="w-4 h-4 mr-2" />,
      show: chartConfigOptions[chartType].normalCurve || false,
    },
    {
      key: "x-axis",
      label: "X-Axis",
      icon: <BarChartIcon className="w-4 h-4 mr-2" />,
      show: !isAxisConfigAllFalse(chartConfigOptions[chartType].axis.x),
    },
    ...(hasDualYAxis(chartConfigOptions[chartType].axis)
      ? [
          {
            key: "y1-axis",
            label: "Y1-Axis",
            icon: <BarChartIcon className="w-4 h-4 mr-2 rotate-90" />,
            show: !isAxisConfigAllFalse(chartConfigOptions[chartType].axis.y1),
          },
          {
            key: "y2-axis",
            label: "Y2-Axis",
            icon: <BarChartIcon className="w-4 h-4 mr-2 rotate-90" />,
            show: !isAxisConfigAllFalse(chartConfigOptions[chartType].axis.y2),
          },
        ]
      : [
          {
            key: "y-axis",
            label: "Y-Axis",
            icon: <BarChartIcon className="w-4 h-4 mr-2 rotate-90" />,
            show: !isAxisConfigAllFalse(chartConfigOptions[chartType].axis.y),
          },
        ]),
    {
      key: "error-bar",
      label: "Error Bar",
      icon: <BarChartIcon className="w-4 h-4 mr-2" />,
      show: isErrorBarEnabled(chartConfigOptions[chartType].errorBar),
    },
  ].filter((item) => item.show);

  const scaleTypes: Array<"sequential" | "diverging" | "categorical"> = [
    "sequential",
    "diverging",
    "categorical",
  ];

  return (
    <div className="col-span-12 lg:col-span-3 flex flex-col h-full pl-3 lg:pl-6 border-l-0 lg:border-l-2 border-t-2 lg:border-t-0 border-gray-100 relative pt-4 lg:pt-0">
      <button
        className="absolute top-0 right-2 p-1 rounded hover:bg-gray-200 text-gray-600 z-10"
        onClick={onClose}
      >
        <Cross2Icon className="w-5 h-5" />
      </button>

      <Tabs defaultValue="element" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mt-6 text-xs lg:text-sm">
          <TabsTrigger value="element" className="text-xs lg:text-sm">
            Element
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs lg:text-sm">
            Appearance
          </TabsTrigger>
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
                        <SelectItem value="mean">Mean (Average)</SelectItem>
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
            {selectedSetting === "normal-curve" &&
              chartConfigOptions[chartType].normalCurve && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="showNormalCurve">
                      Normal Curve Display
                    </Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        id="showNormalCurve"
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        checked={showNormalCurve || false}
                        onChange={(e) => setShowNormalCurve?.(e.target.checked)}
                      />
                      <Label htmlFor="showNormalCurve" className="text-sm">
                        Show normal curve on histogram
                      </Label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Display a normal distribution curve overlaid on the
                      histogram bars
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
                    <Label htmlFor="xAxisMajorIncrement">Major Increment</Label>
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
            {selectedSetting === "y-axis" && !hasDualYAxis(config.axis) && (
              <div className="space-y-2">
                {(chartConfigOptions[chartType].axis as any).y.label && (
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
                    <Label htmlFor="yAxisMajorIncrement">Major Increment</Label>
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
                {(chartConfigOptions[chartType].axis as any).y.origin && (
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
            {selectedSetting === "y1-axis" && hasDualYAxis(config.axis) && (
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
            {selectedSetting === "y2-axis" && hasDualYAxis(config.axis) && (
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
            {selectedSetting === "error-bar" &&
              config.errorBar &&
              isErrorBarEnabled(config.errorBar) && (
                <div className="space-y-2">
                  <Label className="block text-sm font-medium text-gray-900">
                    Error Bars Represent
                  </Label>
                  <div className="space-y-4">
                    {/* Confidence Interval */}
                    {config.errorBar.ci?.confidenceLevel && (
                      <label className="flex items-start gap-2">
                        <input
                          type="radio"
                          name="error-bar-type"
                          value="ci"
                          checked={errorBarType === "ci"}
                          onChange={() => setErrorBarType?.("ci")}
                          className="mt-1"
                        />
                        <div className="flex flex-col">
                          <span>Confidence intervals</span>
                          <div className="mt-1 grid grid-cols-2 items-center">
                            <span className="text-xs text-gray-500">
                              Level (%)
                            </span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              className="w-20 justify-self-end p-1 border rounded disabled:bg-gray-300"
                              value={confidenceLevel}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (
                                  !isNaN(value) &&
                                  value >= 0 &&
                                  value <= 100
                                ) {
                                  setConfidenceLevel?.(value);
                                }
                              }}
                              disabled={errorBarType !== "ci"}
                              placeholder="Level (%)"
                            />
                          </div>
                        </div>
                      </label>
                    )}

                    {/* Standard Error */}
                    {config.errorBar.se?.multiplier && (
                      <label className="flex items-start gap-2">
                        <input
                          type="radio"
                          name="error-bar-type"
                          value="se"
                          checked={errorBarType === "se"}
                          onChange={() => setErrorBarType?.("se")}
                          className="mt-1"
                        />
                        <div className="flex flex-col">
                          <span>Standard error</span>
                          <div className="mt-1 grid grid-cols-2 items-center">
                            <span className="text-xs text-gray-500">
                              Multiplier
                            </span>
                            <input
                              type="number"
                              min="0.01"
                              step="1"
                              className="w-20 justify-self-end p-1 border rounded disabled:bg-gray-300"
                              value={
                                errorBarType === "se"
                                  ? seMultiplier
                                  : seMultiplier
                              }
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value) && value > 0) {
                                  if (errorBarType === "se") {
                                    setSeMultiplier?.(value);
                                  }
                                }
                              }}
                              disabled={errorBarType !== "se"}
                              placeholder="Multiplier"
                            />
                          </div>
                        </div>
                      </label>
                    )}

                    {/* Standard Deviation */}
                    {config.errorBar.sd?.multiplier && (
                      <label className="flex items-start gap-2">
                        <input
                          type="radio"
                          name="error-bar-type"
                          value="sd"
                          checked={errorBarType === "sd"}
                          onChange={() => setErrorBarType?.("sd")}
                          className="mt-1"
                        />
                        <div className="flex flex-col">
                          <span>Standard deviation</span>
                          <div className="mt-1 grid grid-cols-2 items-center">
                            <span className="text-xs text-gray-500">
                              Multiplier
                            </span>
                            <input
                              type="number"
                              min="0.01"
                              step="1"
                              className="w-20 justify-self-end p-1 border rounded disabled:bg-gray-300"
                              value={
                                errorBarType === "sd"
                                  ? sdMultiplier
                                  : sdMultiplier
                              }
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value) && value > 0) {
                                  if (errorBarType === "sd") {
                                    setSdMultiplier?.(value);
                                  }
                                }
                              }}
                              disabled={errorBarType !== "sd"}
                              placeholder="Multiplier"
                            />
                          </div>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              )}
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4 text-xs lg:text-sm">
          {chartConfigOptions[chartType].chartColors && (
            <div className="space-y-6 text-xs lg:text-sm">
              {/* Color Mode Selection */}
              <div className="flex flex-col items-center w-full">
                <Label className="text-xs lg:text-sm text-center w-full">
                  Color Mode
                </Label>
                <div className="flex gap-2 mt-2 justify-center w-full">
                  {["single", "group", "custom"].map((mode) => (
                    <button
                      key={mode}
                      className={`text-xs px-2 py-1 rounded-md font-medium border transition-colors duration-100
                        ${
                          colorMode === mode
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-blue-100 hover:text-blue-700"
                        }`}
                      onClick={() => {
                        if (mode === "custom") {
                          setColorMode("custom");
                          setGroupColors(customGradientColors);
                          setChartColors(customGradientColors);
                        } else {
                          setColorMode(mode as typeof colorMode);
                        }
                      }}
                      style={{ minWidth: 60 }}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {colorMode === "custom" && (
                <div>
                  <Label>Custom Gradient Colors</Label>
                  <div className="space-y-2 mt-2">
                    {groupColors.map((color, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 relative"
                      >
                        <span className="text-sm">Group {index + 1}</span>
                        <div
                          className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedGroupIndex(index)}
                        />
                        {selectedGroupIndex === index && (
                          <div className="absolute left-16 z-10 bg-white rounded-lg shadow-lg p-3 border flex flex-col items-center">
                            <HexColorPicker
                              color={color}
                              onChange={(newColor) => {
                                const newColors = [...groupColors];
                                newColors[index] = newColor;
                                setGroupColors(newColors);
                                setChartColors(newColors);
                              }}
                            />
                            <input
                              type="text"
                              className="w-24 p-1 border rounded text-center mt-2"
                              value={color}
                              onChange={(e) => {
                                const val = e.target.value;
                                const newColors = [...groupColors];
                                newColors[index] = val;
                                setGroupColors(newColors);
                                setChartColors(newColors);
                              }}
                              maxLength={9}
                              placeholder="#RRGGBB"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2 mt-4">
                      <button
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        onClick={() => {
                          const newColors = [...groupColors, "#000000"];
                          setGroupColors(newColors);
                          setChartColors(newColors);
                        }}
                      >
                        Add Color
                      </button>
                      {groupColors.length > 1 && (
                        <button
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                          onClick={() => {
                            const newColors = groupColors.slice(0, -1);
                            setGroupColors(newColors);
                            setChartColors(newColors);
                          }}
                        >
                          Remove Last
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {colorMode === "group" && (
                <>
                  {/* Color Scale Type Selection */}
                  <div className="flex flex-col items-center w-full">
                    <Label className="text-xs lg:text-sm text-center w-full">
                      Color Scale Type
                    </Label>
                    <div className="flex gap-2 mt-2 justify-center w-full">
                      {Object.keys(d3ColorScales).map((scaleType) => (
                        <button
                          key={scaleType}
                          className={`text-xs px-2 py-1 rounded-md font-medium border transition-colors duration-100
                            ${
                              selectedColorType === scaleType
                                ? "bg-blue-500 text-white border-blue-500"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-blue-100 hover:text-blue-700"
                            }`}
                          onClick={() => setSelectedColorType(scaleType as any)}
                          style={{ minWidth: 80 }}
                        >
                          {scaleType.charAt(0).toUpperCase() +
                            scaleType.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Color Scale Preview */}
                  <div className="space-y-4">
                    <Label className="text-xs lg:text-sm">Color Scales</Label>
                    <div className="grid grid-cols-1 gap-4 max-h-64 overflow-y-auto pr-2">
                      {d3ColorScales[selectedColorType].map((scale: any) => (
                        <div key={scale.name} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs lg:text-sm font-medium">
                              {scale.name}
                            </span>
                            <button
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              onClick={() =>
                                handleColorScaleSelect(scale.colors)
                              }
                            >
                              Apply
                            </button>
                          </div>
                          <div className="flex h-8 rounded overflow-hidden">
                            {scale.colors.map((color: string, i: number) => (
                              <div
                                key={i}
                                className="flex-1"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {colorMode === "single" && (
                <div>
                  <Label className="text-xs lg:text-sm">Pick Color</Label>
                  {/* Selected color preview */}
                  <div className="flex justify-center mb-2">
                    <div
                      className="w-12 h-12 rounded-full border-2 border-gray-400"
                      style={{ backgroundColor: singleColor }}
                      title={singleColor}
                    />
                  </div>
                  {/* Always visible hex input */}
                  <div className="flex justify-center mt-2 mb-2">
                    <input
                      type="text"
                      className="w-32 p-1 border rounded text-center"
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
                      placeholder="#RRGGBB"
                    />
                  </div>
                  {/* Grid preset warna */}
                  <div className="w-full flex justify-center my-2">
                    <div className="grid grid-cols-8 gap-2 w-full max-w-xs relative">
                      {/* Custom color button */}
                      <button
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${
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
                        <span className="text-lg font-bold text-white">+</span>
                      </button>
                      {/* Preset dari d3.schemeCategory10 dan popularColors */}
                      {[
                        ...d3ColorScales.categorical[0].colors,
                        ...[
                          "#000000",
                          "#757575",
                          "#BDBDBD",
                          "#FFFFFF",
                          "#F44336",
                          "#2196F3",
                          "#4CAF50",
                          "#FFEB3B",
                          "#FF9800",
                          "#9C27B0",
                        ],
                      ].map((color, idx) => (
                        <button
                          key={color + idx}
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${
                            singleColor === color && !showSingleCustom
                              ? "border-blue-500"
                              : "border-gray-300"
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
                  {/* Color scales for single mode (no Apply, pick one color)
                  <div className="space-y-2 mt-2">
                    {scaleTypes.map((scaleType) => (
                      <div key={scaleType} className="mb-1">
                        <div className="flex items-center mb-1">
                          <span className="text-xs font-medium mr-2">
                            {scaleType.charAt(0).toUpperCase() +
                              scaleType.slice(1)}
                          </span>
                        </div>
                        <div className="flex h-7 rounded overflow-hidden">
                          {(d3ColorScales[scaleType] as any[]).map(
                            (scale: any) =>
                              (scale.colors as string[]).map(
                                (color: string, i: number) => (
                                  <button
                                    key={scale.name + color + i}
                                    className={`flex-1 h-full border-2 ${
                                      singleColor === color
                                        ? "border-blue-500"
                                        : "border-transparent"
                                    }`}
                                    style={{
                                      backgroundColor: color,
                                      minWidth: 20,
                                    }}
                                    title={color}
                                    onClick={() => {
                                      setPickerColor(color);
                                      setInputColor(color);
                                      setSingleColor(color);
                                      setChartColors([color]);
                                      setShowSingleCustom(false);
                                    }}
                                  />
                                )
                              )
                          )}
                        </div>
                      </div>
                    ))}
                  </div> */}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper functions
const isAxisConfigAllFalse = (axisConfig: Record<string, boolean>) => {
  return Object.values(axisConfig).every((v) => v === false);
};

const hasDualYAxis = (axis: any): axis is { x: any; y1: any; y2: any } => {
  return "y1" in axis && "y2" in axis;
};

const isErrorBarEnabled = (errorBarConfig: any) => {
  if (!errorBarConfig) return false;
  return (
    errorBarConfig.ci?.confidenceLevel ||
    errorBarConfig.se?.multiplier ||
    errorBarConfig.sd?.multiplier
  );
};

export default CustomizationPanel;
