import * as barChartUtils from "./barChartUtils";
import * as lineChartUtils from "./lineChartUtils";
import * as pieChartUtils from "./pieChartUtils";
import * as areaChartUtils from "./areaChartUtils";
import * as histogramUtils from "./histogramUtils";
import * as scatterUtils from "./scatterUtils";
import * as boxplotUtils from "./boxplotUtils";
import * as highLowChartUtils from "./highLowChartUtils";
import * as dualAxesChartUtils from "./dualAxesChartUtils";
import * as d3 from "d3";
import { addAxisLabels } from "../chartUtils";

export const chartUtils = {
  ...barChartUtils,
  ...lineChartUtils,
  ...pieChartUtils,
  ...areaChartUtils,
  ...histogramUtils,
  ...scatterUtils,
  ...boxplotUtils,
  ...highLowChartUtils,
  ...dualAxesChartUtils,
};

export interface ChartTitleOptions {
  title: string;
  subtitle?: string;
  titleColor?: string;
  subtitleColor?: string;
  titleFontSize?: number;
  subtitleFontSize?: number;
  titleFontFamily?: string;
  subtitleFontFamily?: string;
  titleY?: number;
  subtitleY?: number;
  // New: margin-aware positioning
  marginTop?: number;
  useResponsivePositioning?: boolean;
}

export const addChartTitle = (
  svg: d3.Selection<SVGSVGElement, any, null, undefined>,
  options: ChartTitleOptions
) => {
  console.log("addChartTitle called with options:", options);
  console.log("SVG selection:", svg);
  console.log("SVG node:", svg.node());

  const {
    title,
    subtitle,
    titleColor = "hsl(var(--foreground))",
    subtitleColor = "hsl(var(--muted-foreground))",
    titleFontSize = 16,
    subtitleFontSize = 12,
    titleFontFamily = "sans-serif",
    subtitleFontFamily = "sans-serif",
    titleY,
    subtitleY,
    marginTop = 0,
    useResponsivePositioning = true,
  } = options;

  // Calculate responsive positioning based on margin
  let calculatedTitleY: number;
  let calculatedSubtitleY: number;

  if (useResponsivePositioning && marginTop > 0) {
    // Position title within the margin area, leaving some padding
    const titlePadding = Math.max(8, marginTop * 0.1); // 10% of margin as padding, min 8px
    calculatedTitleY = titlePadding + titleFontSize;
    calculatedSubtitleY =
      calculatedTitleY + titleFontSize + Math.max(4, marginTop * 0.05); // Gap between title and subtitle
  } else {
    // Fall back to provided values or defaults
    calculatedTitleY = titleY || 30;
    calculatedSubtitleY = subtitleY || 50;
  }

  console.log("Adding main title:", title);
  console.log("Calculated titleY:", calculatedTitleY, "marginTop:", marginTop);

  // Add main title
  svg
    .append("text")
    .attr("x", "50%")
    .attr("y", calculatedTitleY)
    .attr("text-anchor", "middle")
    .attr("fill", titleColor)
    .style("font-size", `${titleFontSize}px`)
    .style("font-family", titleFontFamily)
    .style("font-weight", "bold")
    .text(title);

  // Add subtitle if provided
  if (subtitle) {
    console.log("Adding subtitle:", subtitle);
    console.log("Calculated subtitleY:", calculatedSubtitleY);
    svg
      .append("text")
      .attr("x", "50%")
      .attr("y", calculatedSubtitleY)
      .attr("text-anchor", "middle")
      .attr("fill", subtitleColor)
      .style("font-size", `${subtitleFontSize}px`)
      .style("font-family", subtitleFontFamily)
      .text(subtitle);
  }
};

export function generateAxisTicks(
  min: number,
  max: number,
  majorIncrement: number
): number[] | undefined {
  if (
    typeof min !== "number" ||
    typeof max !== "number" ||
    typeof majorIncrement !== "number" ||
    isNaN(min) ||
    isNaN(max) ||
    isNaN(majorIncrement) ||
    majorIncrement <= 0
  ) {
    return undefined; // fallback ke d3 default
  }
  const ticks = [];
  for (let v = min; v < max; v += majorIncrement) {
    ticks.push(v);
  }
  if (ticks.length === 0 || ticks[ticks.length - 1] !== max) {
    ticks.push(max);
  }
  return ticks;
}

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 */
export const formatAxisNumber = (value: number): string => {
  if (Math.abs(value) >= 1e9) {
    return (value / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (Math.abs(value) >= 1e6) {
    return (value / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (Math.abs(value) >= 1e3) {
    return (value / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return value.toString();
};

/**
 * Truncate text with ellipsis if too long
 */
export const truncateText = (text: any, maxLength: number = 12): string => {
  // Convert to string and handle null/undefined safely
  const stringText = text?.toString() || "";
  if (stringText.length <= maxLength) return stringText;
  return stringText.substring(0, maxLength - 3) + "...";
};

/**
 * Calculate optimal rotation angle for X-axis labels based on text length
 */
export const calculateXAxisRotation = (
  categories: string[],
  chartWidth: number,
  marginLeft: number,
  marginRight: number
): { rotation: number; needsRotation: boolean; maxLabelWidth: number } => {
  const availableWidth = chartWidth - marginLeft - marginRight;
  const avgLabelWidth = Math.max(...categories.map((cat) => cat.length)) * 8; // approximate 8px per character
  const categoryWidth = availableWidth / categories.length;

  if (avgLabelWidth <= categoryWidth) {
    return { rotation: 0, needsRotation: false, maxLabelWidth: avgLabelWidth };
  }

  // For moderate overlap, use 30 degrees
  const diagonal30 = avgLabelWidth * Math.cos(Math.PI / 6); // 30 degrees
  if (diagonal30 <= categoryWidth * 1.5) {
    return { rotation: -30, needsRotation: true, maxLabelWidth: avgLabelWidth };
  }

  // For significant overlap, use 45 degrees
  const diagonal45 = avgLabelWidth * Math.cos(Math.PI / 4);
  if (diagonal45 <= categoryWidth * 1.2) {
    return { rotation: -45, needsRotation: true, maxLabelWidth: avgLabelWidth };
  }

  // For extreme cases, use 60 degrees instead of 90
  return { rotation: -60, needsRotation: true, maxLabelWidth: avgLabelWidth };
};

/**
 * Standard X-axis creation with automatic label handling
 */
export const addStandardXAxis = (
  svg: d3.Selection<SVGSVGElement, any, null, undefined>,
  xScale: any,
  height: number,
  marginBottom: number,
  categories: string[],
  width: number,
  marginLeft: number,
  marginRight: number,
  options: {
    showTicks?: boolean;
    tickFormat?: (d: any) => string;
    maxLabelLength?: number;
  } = {}
) => {
  const { showTicks = true, tickFormat, maxLabelLength = 12 } = options;

  const rotationInfo = calculateXAxisRotation(
    categories,
    width,
    marginLeft,
    marginRight
  );

  const xAxis = svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(
      d3
        .axisBottom(xScale)
        .tickSizeOuter(0)
        .tickFormat(tickFormat || ((d: any) => d))
    );

  if (!showTicks) {
    xAxis.call((g) => g.select(".domain").remove());
  }

  // Apply rotation and truncation if needed
  if (rotationInfo.needsRotation) {
    xAxis
      .selectAll("text")
      .attr("dy", ".35em") // Reset the default dy
      .attr("y", 0) // Reset the y position
      .attr("x", 9) // Move text slightly right from the tick
      .attr("transform", (d, i, nodes) => {
        const node = nodes[i] as SVGTextElement;
        // Calculate offset based on rotation angle
        const yOffset = Math.abs(rotationInfo.rotation) <= 30 ? 8 : 12;
        return `translate(0,${yOffset}) rotate(${rotationInfo.rotation})`;
      })
      .style("text-anchor", "end")
      .text((d: any) => {
        const originalText = tickFormat ? tickFormat(d) : d;
        // Adjust maxLength based on rotation angle
        const adjustedMaxLength = Math.floor(
          maxLabelLength * (1 + Math.abs(rotationInfo.rotation) / 90)
        );
        return truncateText(originalText, adjustedMaxLength);
      });
  } else {
    xAxis.selectAll("text").text((d: any) => {
      const originalText = tickFormat ? tickFormat(d) : d;
      return truncateText(originalText, maxLabelLength);
    });
  }

  return { xAxis, rotationInfo };
};

/**
 * Standard Y-axis creation with automatic category label handling for horizontal charts
 */
export const addStandardYAxisForHorizontal = (
  svg: d3.Selection<SVGSVGElement, any, null, undefined>,
  yScale: any,
  marginLeft: number,
  categories: string[],
  data: any[],
  options: {
    showTicks?: boolean;
    tickFormat?: (d: any) => string;
    maxLabelLength?: number;
  } = {}
) => {
  const { showTicks = true, tickFormat, maxLabelLength = 3 } = options;

  const yAxis = d3.axisLeft(yScale).tickFormat(
    tickFormat ||
      ((d: any) => {
        // For horizontal charts, find the display label for the category
        const dataPoint = data.find((item: any) => item.uniqueId === d);
        return dataPoint
          ? truncateText(dataPoint.displayLabel, maxLabelLength)
          : truncateText(d, maxLabelLength);
      })
  );

  const yAxisGroup = svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(yAxis);

  if (!showTicks) {
    yAxisGroup.call((g) => g.select(".domain").remove());
  }

  // Style the axis
  yAxisGroup
    .call((g) => g.selectAll(".tick line").attr("stroke", "hsl(var(--border))"))
    .call((g) =>
      g.selectAll("text").attr("fill", "hsl(var(--muted-foreground))")
    );

  return yAxisGroup;
};

/**
 * Standard X-axis creation for horizontal charts (numeric values)
 */
export const addStandardXAxisForHorizontal = (
  svg: d3.Selection<SVGSVGElement, any, null, undefined>,
  xScale: any,
  marginTop: number,
  options: {
    showTicks?: boolean;
    showGridLines?: boolean;
    height?: number;
    marginBottom?: number;
    tickValues?: number[];
    customFormat?: (d: any) => string;
    axisPosition?: "top" | "bottom";
  } = {}
) => {
  const {
    showTicks = true,
    showGridLines = true,
    height,
    marginBottom,
    tickValues,
    customFormat,
    axisPosition = "top",
  } = options;

  const xAxis =
    axisPosition === "top" ? d3.axisTop(xScale) : d3.axisBottom(xScale);

  xAxis.tickFormat(customFormat || ((d: any) => formatAxisNumber(Number(d))));

  if (tickValues) {
    xAxis.tickValues(tickValues);
  }

  const yPos = axisPosition === "top" ? marginTop : height! - marginBottom!;

  const xAxisGroup = svg
    .append("g")
    .attr("transform", `translate(0,${yPos})`)
    .call(xAxis);

  if (!showTicks) {
    xAxisGroup.call((g) => g.select(".domain").remove());
  }

  // Add grid lines if requested (vertical lines for horizontal chart)
  if (showGridLines && height && marginBottom) {
    xAxisGroup.call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("y2", height - marginTop - marginBottom)
        .attr("stroke-opacity", 0.1)
        .attr("stroke", "hsl(var(--border))")
    );
  }

  // Style the axis
  xAxisGroup
    .call((g) => g.selectAll(".tick line").attr("stroke", "hsl(var(--border))"))
    .call((g) =>
      g.selectAll("text").attr("fill", "hsl(var(--muted-foreground))")
    );

  return xAxisGroup;
};

/**
 * Standard Y-axis creation with automatic number formatting
 */
export const addStandardYAxis = (
  svg: d3.Selection<SVGSVGElement, any, null, undefined>,
  yScale: any,
  marginLeft: number,
  options: {
    showTicks?: boolean;
    showGridLines?: boolean;
    width?: number;
    marginRight?: number;
    tickValues?: number[];
    customFormat?: (d: any) => string;
  } = {}
) => {
  const {
    showTicks = true,
    showGridLines = true,
    width,
    marginRight,
    tickValues,
    customFormat,
  } = options;

  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat(customFormat || ((d: any) => formatAxisNumber(Number(d))));

  if (tickValues) {
    yAxis.tickValues(tickValues);
  }

  const yAxisGroup = svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(yAxis);

  if (!showTicks) {
    yAxisGroup.call((g) => g.select(".domain").remove());
  }

  // Add grid lines if requested
  if (showGridLines && width && marginRight) {
    yAxisGroup.call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("x2", width - marginLeft - marginRight)
        .attr("stroke-opacity", 0.1)
        .attr("stroke", "hsl(var(--border))")
    );
  }

  // Style the axis
  yAxisGroup
    .call((g) => g.selectAll(".tick line").attr("stroke", "hsl(var(--border))"))
    .call((g) =>
      g.selectAll("text").attr("fill", "hsl(var(--muted-foreground))")
    );

  return yAxisGroup;
};

/**
 * Enhanced comprehensive axis setup for both vertical and horizontal charts
 */
export const addStandardAxes = (
  svg: d3.Selection<SVGSVGElement, any, null, undefined>,
  config: {
    xScale: any;
    yScale: any;
    width: number;
    height: number;
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
    categories: string[];
    axisLabels?: { x?: string; y?: string };
    majorIncrement?: number;
    yMin?: number;
    yMax?: number;
    xMin?: number;
    xMax?: number;
    chartType?: "vertical" | "horizontal";
    data?: any[]; // For horizontal charts to find display labels
    xAxisOptions?: {
      showTicks?: boolean;
      tickFormat?: (d: any) => string;
      maxLabelLength?: number;
      axisPosition?: "top" | "bottom";
      tickValues?: number[];
      customFormat?: (d: any) => string;
    };
    yAxisOptions?: {
      showTicks?: boolean;
      showGridLines?: boolean;
      tickValues?: number[];
      customFormat?: (d: any) => string;
      maxLabelLength?: number;
    };
  }
) => {
  const {
    xScale,
    yScale,
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    categories,
    axisLabels,
    majorIncrement,
    yMin,
    yMax,
    xMin,
    xMax,
    chartType = "vertical",
    data = [],
    xAxisOptions = {},
    yAxisOptions = {},
  } = config;

  let tickValues: number[] | undefined;
  let rotationInfo: any = {};

  if (chartType === "horizontal") {
    // For horizontal charts: X = numeric values, Y = categories

    // Generate tick values for X-axis (numeric) if majorIncrement is provided
    if (
      majorIncrement &&
      typeof xMin === "number" &&
      typeof xMax === "number"
    ) {
      tickValues = generateAxisTicks(xMin, xMax, majorIncrement);
    }

    // Add X-axis (numeric values) - usually on top for horizontal charts
    addStandardXAxisForHorizontal(svg, xScale, marginTop, {
      ...xAxisOptions,
      showGridLines: true,
      height,
      marginBottom,
      tickValues: tickValues || xAxisOptions.tickValues,
      customFormat: xAxisOptions.customFormat || formatAxisNumber,
    });

    // Add Y-axis (categories) - handle long category names
    addStandardYAxisForHorizontal(svg, yScale, marginLeft, categories, data, {
      ...yAxisOptions,
      maxLabelLength: yAxisOptions.maxLabelLength || 15,
    });
  } else {
    // For vertical charts: X = categories, Y = numeric values

    // Generate tick values for Y-axis (numeric) if majorIncrement is provided
    if (
      majorIncrement &&
      typeof yMin === "number" &&
      typeof yMax === "number"
    ) {
      tickValues = generateAxisTicks(yMin, yMax, majorIncrement);
    }

    // Add X-axis (categories) with rotation handling
    const axisResult = addStandardXAxis(
      svg,
      xScale,
      height,
      marginBottom,
      categories,
      width,
      marginLeft,
      marginRight,
      xAxisOptions
    );
    rotationInfo = axisResult.rotationInfo;

    // Add Y-axis (numeric values) with grid lines
    addStandardYAxis(svg, yScale, marginLeft, {
      ...yAxisOptions,
      showGridLines: true,
      width,
      marginRight,
      tickValues: tickValues || yAxisOptions.tickValues,
      customFormat: yAxisOptions.customFormat || formatAxisNumber,
    });
  }

  // Calculate additional margin needed for rotated labels (only for vertical charts)
  const additionalBottomMargin =
    chartType === "vertical" && rotationInfo.needsRotation
      ? rotationInfo.rotation === -90
        ? rotationInfo.maxLabelWidth
        : rotationInfo.maxLabelWidth *
          Math.sin((Math.abs(rotationInfo.rotation) * Math.PI) / 180)
      : 0;

  // Add axis labels using existing utility function
  addAxisLabels({
    svg,
    width,
    height,
    marginTop,
    marginRight,
    marginBottom: marginBottom + additionalBottomMargin,
    marginLeft,
    axisLabels,
    chartType,
  });

  return {
    rotationInfo,
    additionalBottomMargin,
    tickValues,
  };
};
