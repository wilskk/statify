import { addChartTitle, ChartTitleOptions } from "./chartUtils";
import {
  addLegend,
  createStandardSVG,
  calculateLegendPosition,
  SVGCreationOptions,
  LegendOptions,
  LegendPositionOptions,
} from "../chartUtils";
import { calculateResponsiveMargin } from "../responsiveMarginUtils";
import * as d3 from "d3";

const colorScheme = [
  "#4e79a7",
  "#f28e2c",
  "#e15759",
  "#76b7b2",
  "#59a14f",
  "#edc949",
  "#af7aa1",
  "#ff9da7",
  "#9c755f",
  "#bab0ab",
];

export const createPieChart = (
  data: { category: string; value: number }[],
  width: number = 800,
  height: number = Math.min(width, 500),
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  chartColors?: string[]
) => {
  console.log("Creating pie chart with data:", data);

  const validData = data.filter(
    (d) =>
      typeof d.category === "string" &&
      typeof d.value === "number" &&
      d.value >= 0
  );

  if (validData.length === 0) {
    console.error("No valid data available for the pie chart");
    return null;
  }

  // Only use as many colors as there are categories
  const categories = validData.map((d) => d.category);
  const usedColors = (chartColors || colorScheme).slice(0, categories.length);

  const color = d3.scaleOrdinal<string>().domain(categories).range(usedColors);

  const pie = d3
    .pie<{ category: string; value: number }>()
    .sort(null)
    .value((d) => d.value);

  // Calculate label widths for margin calculation
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "12px sans-serif";
  const maxLabelWidth = Math.max(
    ...validData.map((d) => ctx.measureText(d.category).width)
  );

  // Calculate responsive margins with proper label consideration
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    hasLegend: true,
    legendPosition: "right",
    maxLabelWidth,
    categories: categories,
  });

  // Calculate dimensions with margins
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Make pie smaller by using a scale factor
  const scaleFactor = 1; // Slightly reduce pie size for better proportions
  const outerRadius = (Math.min(chartWidth, chartHeight) / 2) * scaleFactor;
  const labelRadius = outerRadius * 1.1;

  const arc = d3
    .arc<d3.PieArcDatum<{ category: string; value: number }>>()
    .innerRadius(0)
    .outerRadius(outerRadius);

  const outerArc = d3
    .arc<d3.PieArcDatum<{ category: string; value: number }>>()
    .innerRadius(labelRadius)
    .outerRadius(labelRadius);

  const arcs = pie(validData);

  // Create SVG with standard utility and adjusted margins
  const svg = createStandardSVG({
    width,
    height,
    marginTop: margin.top,
    marginRight: margin.right,
    marginBottom: margin.bottom,
    marginLeft: margin.left,
  } as SVGCreationOptions);

  // Add title if provided - now with proper margin-aware positioning
  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop: margin.top,
      useResponsivePositioning: true,
    });
  }

  // Draw pie slices
  const chartGroup = svg
    .append("g")
    .attr(
      "transform",
      `translate(${width / 2}, ${margin.top + chartHeight / 2})`
    );

  chartGroup
    .append("g")
    .attr("stroke", "white")
    .selectAll("path")
    .data(arcs)
    .join("path")
    .attr(
      "fill",
      (d: d3.PieArcDatum<{ category: string; value: number }>) =>
        color(d.data.category) as string
    )
    .attr("d", arc)
    .append("title")
    .text(
      (d: d3.PieArcDatum<{ category: string; value: number }>) =>
        `${d.data.category}`
    );

  if (useAxis) {
    // Add legend using the improved legend utility
    const legendPosition = calculateLegendPosition({
      width,
      height,
      marginLeft: margin.left,
      marginRight: margin.right,
      marginBottom: margin.bottom,
      marginTop: margin.top,
      legendPosition: "right",
      itemCount: categories.length,
    });

    addLegend({
      svg,
      colorScale: color,
      position: legendPosition,
      legendPosition: "right",
      domain: categories,
      itemWidth: 15,
      itemHeight: 15,
      fontSize: 12,
    });
  }

  return svg.node();
};

export const createDonutChart = (
  data: { category: string; value: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  chartColors?: string[]
) => {
  // ... existing code ...
  const color = d3
    .scaleOrdinal<string>()
    .domain(data.map((d) => d.category))
    .range(chartColors || colorScheme);
  // ... existing code ...
};
