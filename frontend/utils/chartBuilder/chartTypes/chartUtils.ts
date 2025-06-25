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
    titleY = 30,
    subtitleY = 50,
  } = options;

  console.log("Adding main title:", title);
  // Add main title
  svg
    .append("text")
    .attr("x", "50%")
    .attr("y", titleY)
    .attr("text-anchor", "middle")
    .attr("fill", titleColor)
    .style("font-size", `${titleFontSize}px`)
    .style("font-family", titleFontFamily)
    .style("font-weight", "bold")
    .text(title);

  // Add subtitle if provided
  if (subtitle) {
    console.log("Adding subtitle:", subtitle);
    svg
      .append("text")
      .attr("x", "50%")
      .attr("y", subtitleY)
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
