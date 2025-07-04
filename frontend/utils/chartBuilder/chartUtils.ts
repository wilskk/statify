import * as d3 from "d3";

// Utility: Major ticks generator
export function getMajorTicks(min: number, max: number, inc: number): number[] {
  const ticks = [];
  let v = min;
  while (v < max) {
    ticks.push(Number(v.toFixed(10))); // Hindari floating point error
    v += inc;
  }
  if (ticks.length === 0 || Math.abs(ticks[ticks.length - 1] - max) > 1e-8) {
    ticks.push(max);
  }
  return ticks;
}

export interface SVGCreationOptions {
  width: number;
  height: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  includeFont?: boolean;
  customViewBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Creates a standardized SVG element with consistent attributes
 * This function standardizes SVG creation across all chart utilities
 *
 * @param options - Configuration object for SVG creation
 * @returns D3 selection of the created SVG element
 */
export const createStandardSVG = (options: SVGCreationOptions) => {
  const {
    width,
    height,
    marginTop = 0,
    marginRight = 0,
    marginBottom = 0,
    marginLeft = 0,
    includeFont = false,
    customViewBox,
  } = options;

  const totalWidth = width + marginLeft + marginRight;
  const totalHeight = height + marginTop + marginBottom;

  // Determine viewBox - use custom if provided, otherwise use standard dimensions
  const viewBox = customViewBox
    ? [
        customViewBox.x,
        customViewBox.y,
        customViewBox.width,
        customViewBox.height,
      ]
    : [0, 0, width, height];

  // Base style
  let style = "max-width: 100%; height: auto;";
  if (includeFont) {
    style += " font: 10px sans-serif;";
  }

  return d3
    .create("svg")
    .attr("width", totalWidth)
    .attr("height", totalHeight)
    .attr("viewBox", viewBox)
    .attr("style", style);
};

export interface AxisLabelOptions {
  x?: string;
  y?: string;
  y1?: string; // For dual axis charts
  y2?: string; // For dual axis charts
}

export interface AxisLabelConfig {
  svg: d3.Selection<SVGSVGElement, any, null, undefined>;
  width: number;
  height: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  axisLabels?: AxisLabelOptions;
  chartType?:
    | "vertical"
    | "horizontal"
    | "scatter"
    | "line"
    | "pyramid"
    | "default";
}

/**
 * Adds X axis label to an SVG element
 * This function standardizes X axis label placement across all chart types
 */
export const addXAxisLabel = (config: AxisLabelConfig) => {
  const {
    svg,
    width,
    height,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    axisLabels,
    chartType = "default",
  } = config;

  if (!axisLabels?.x) return;

  let xPosition: number;
  let yPosition: number;

  // Calculate dynamic offset based on chart size and margin
  const calculateDynamicOffset = (margin: number, dimension: number) => {
    // Base offset that scales with chart size, with min/max bounds
    return Math.max(40, Math.min(60, margin * 0.6 + dimension * 0.02));
  };

  switch (chartType) {
    case "horizontal":
      // For horizontal bar charts, X label goes below the chart (bottom)
      xPosition = width / 2;
      yPosition =
        height - marginBottom + calculateDynamicOffset(marginBottom, height);
      break;
    case "pyramid":
      // For pyramid charts, X label goes below with adjusted positioning
      xPosition = (width + marginLeft - marginRight) / 2;
      yPosition =
        height -
        marginBottom +
        calculateDynamicOffset(marginBottom, 0.8 * height);
      break;
    case "vertical":
    case "line":
    case "scatter":
    case "default":
    default:
      // For vertical charts, X label goes below the chart (bottom axis)
      xPosition = (width + marginLeft - marginRight) / 2;
      yPosition =
        height - marginBottom + calculateDynamicOffset(marginBottom, height);
      break;
  }

  svg
    .append("text")
    .attr("x", xPosition)
    .attr("y", yPosition)
    .attr("text-anchor", "middle")
    .attr("fill", "hsl(var(--foreground))")
    .style("font-size", "14px")
    .text(axisLabels.x);
};

/**
 * Adds Y axis label to an SVG element
 * This function standardizes Y axis label placement across all chart types
 */
export const addYAxisLabel = (config: AxisLabelConfig) => {
  const {
    svg,
    width,
    height,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    axisLabels,
    chartType = "default",
  } = config;

  if (!axisLabels?.y) return;

  let xPosition: number;
  let yPosition: number;

  // Calculate dynamic offset based on chart size and margin (same as X axis for consistency)
  const calculateDynamicOffset = (margin: number, dimension: number) => {
    return Math.max(30, Math.min(50, margin * 0.5 + dimension * 0.02));
  };

  switch (chartType) {
    case "horizontal":
      // For horizontal bar charts
      xPosition = -(height / 2);
      yPosition = marginLeft - calculateDynamicOffset(marginLeft, width);
      break;
    case "vertical":
    case "line":
    case "scatter":
    case "default":
    default:
      // For vertical charts
      xPosition = -(height + marginTop - marginBottom) / 2;
      yPosition = marginLeft - calculateDynamicOffset(marginLeft, width);
      break;
  }

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", xPosition)
    .attr("y", yPosition)
    .attr("text-anchor", "middle")
    .attr("fill", "hsl(var(--foreground))")
    .style("font-size", "14px")
    .text(axisLabels.y);
};

/**
 * Adds both X and Y axis labels to an SVG element
 * This is a convenience function that calls both addXAxisLabel and addYAxisLabel
 */
export const addAxisLabels = (config: AxisLabelConfig) => {
  addXAxisLabel(config);
  addYAxisLabel(config);
};

/**
 * Adds dual Y axis labels for charts with two Y axes (left and right)
 * Used for dual-axis charts like bar-and-line combinations
 */
export const addDualYAxisLabels = (config: AxisLabelConfig) => {
  const {
    svg,
    height,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    axisLabels,
  } = config;

  // Left Y axis label (y1)
  if (axisLabels?.y1) {
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(height + marginTop - marginBottom) / 2)
      .attr("y", marginLeft - 40)
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--foreground))")
      .style("font-size", "14px")
      .text(axisLabels.y1);
  }

  // Right Y axis label (y2)
  if (axisLabels?.y2) {
    svg
      .append("text")
      .attr("transform", "rotate(90)")
      .attr("x", (height + marginTop - marginBottom) / 2)
      .attr("y", -marginRight + 20)
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--foreground))")
      .style("font-size", "14px")
      .text(axisLabels.y2);
  }
};

/**
 * Creates a standardized legend/swatches for charts
 * Based on Observable's Swatches pattern: https://observablehq.com/@d3/color-legend
 */
export interface LegendOptions {
  svg: any; // Allow flexible SVG selection type
  colorScale: any; // Allow flexible color scale type
  position: {
    x: number;
    y: number;
  };
  itemWidth?: number;
  itemHeight?: number;
  itemSpacing?: number;
  fontSize?: number;
  maxItemsPerRow?: number;
  title?: string;
}

export function addLegend({
  svg,
  colorScale,
  position,
  itemWidth = 19,
  itemHeight = 19,
  itemSpacing = 120, // Reduced from 130 to 120 to fit more items
  fontSize = 10,
  maxItemsPerRow,
  title,
}: LegendOptions): void {
  const domain = colorScale.domain();

  // Auto-adaptive sizing based on number of items
  const itemCount = domain.length;
  let adaptiveItemWidth = itemWidth;
  let adaptiveItemHeight = itemHeight;
  let adaptiveSpacing = itemSpacing;
  let adaptiveFontSize = fontSize;

  // Scale down if too many items (>6)
  if (itemCount > 6) {
    const scaleFactor = Math.max(0.7, 6 / itemCount); // Min scale 70%
    adaptiveItemWidth = Math.round(itemWidth * scaleFactor);
    adaptiveItemHeight = Math.round(itemHeight * scaleFactor);
    adaptiveSpacing = Math.round(itemSpacing * scaleFactor);
    adaptiveFontSize = Math.max(8, Math.round(fontSize * scaleFactor)); // Min font size 8px
  }

  const legendGroup = svg
    .append("g")
    .attr("class", "chart-legend")
    .attr("font-family", "sans-serif")
    .attr("font-size", adaptiveFontSize)
    .attr("text-anchor", "start")
    .attr("transform", `translate(${position.x}, ${position.y})`);

  // Add title if provided
  if (title) {
    legendGroup
      .append("text")
      .attr("x", 0)
      .attr("y", -10)
      .attr("font-weight", "bold")
      .attr("fill", "hsl(var(--foreground))")
      .text(title);
  }

  // Calculate items per row based on available width or maxItemsPerRow
  // If maxItemsPerRow is provided, use it; otherwise show all items in one row
  const itemsPerRow = maxItemsPerRow || domain.length;

  domain.forEach((item: string, index: number) => {
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    const xOffset = col * adaptiveSpacing;
    const yOffset = row * (adaptiveItemHeight + 8); // 8px vertical spacing between rows

    // Create swatch rectangle
    legendGroup
      .append("rect")
      .attr("x", xOffset)
      .attr("y", yOffset)
      .attr("width", adaptiveItemWidth)
      .attr("height", adaptiveItemHeight)
      .attr("fill", colorScale(item))
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", 0.5);

    // Create label text with truncation for long names
    const maxLabelLength = adaptiveSpacing < 100 ? 8 : 12; // Shorter labels for smaller spacing
    const displayText =
      item.length > maxLabelLength
        ? item.substring(0, maxLabelLength) + "..."
        : item;

    legendGroup
      .append("text")
      .attr("x", xOffset + adaptiveItemWidth + 6) // 6px gap between swatch and text
      .attr("y", yOffset + adaptiveItemHeight / 2)
      .attr("dy", "0.35em")
      .attr("fill", "hsl(var(--foreground))")
      .text(displayText)
      .append("title") // Add tooltip for full text
      .text(item);
  });
}

/**
 * Calculate optimal legend positioning based on chart dimensions and legend type
 */
export interface LegendPositionOptions {
  width: number;
  height: number;
  marginLeft: number;
  marginRight: number;
  marginBottom: number;
  marginTop: number;
  legendPosition?: "bottom" | "right" | "top";
  itemCount: number;
  itemSpacing?: number;
}

export function calculateLegendPosition({
  width,
  height,
  marginLeft,
  marginRight,
  marginBottom,
  marginTop,
  legendPosition = "bottom",
  itemCount,
  itemSpacing = 120, // Reduced from 130 to 120 to fit more items
}: LegendPositionOptions): { x: number; y: number; maxItemsPerRow?: number } {
  switch (legendPosition) {
    case "bottom":
      const availableWidth = width - marginLeft - marginRight;

      // Auto-adaptive spacing calculation
      let adaptiveSpacing = itemSpacing;
      if (itemCount > 6) {
        const scaleFactor = Math.max(0.7, 6 / itemCount);
        adaptiveSpacing = Math.round(itemSpacing * scaleFactor);
      }

      const maxItemsPerRow = Math.max(
        1,
        Math.floor(availableWidth / adaptiveSpacing)
      );
      return {
        x: marginLeft,
        y: height - marginBottom + 50, // Increased spacing from 25 to 50
        maxItemsPerRow,
      };

    case "right":
      return {
        x: width - marginRight + 10,
        y: marginTop,
        maxItemsPerRow: 1, // Vertical layout
      };

    case "top":
      return {
        x: marginLeft,
        y: marginTop - 30,
        maxItemsPerRow: Math.max(
          1,
          Math.floor((width - marginLeft - marginRight) / itemSpacing)
        ),
      };

    default:
      return {
        x: marginLeft,
        y: height - marginBottom + 25,
        maxItemsPerRow: Math.max(
          1,
          Math.floor((width - marginLeft - marginRight) / itemSpacing)
        ),
      };
  }
}
