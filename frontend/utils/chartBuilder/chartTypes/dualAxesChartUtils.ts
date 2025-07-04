import * as d3 from "d3";
import {
  ChartTitleOptions,
  addChartTitle,
  generateAxisTicks,
} from "./chartUtils";

export const createBarAndLineChart = (
  data: { category: string; barValue: number; lineValue: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y1?: string; y2?: string },
  axisScaleOptions?: {
    x?: {
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
  },
  chartColors?: string[]
) => {
  console.log("Creating combined chart with data:", data);

  // Filter data
  const filteredData = data.filter(
    (d) =>
      d.barValue != null &&
      d.lineValue != null &&
      !isNaN(d.barValue) &&
      !isNaN(d.lineValue) &&
      d.category != " "
  );

  // Margin dinamis berdasarkan title dan axis labels
  const marginTop = useAxis ? (titleOptions ? 80 : 30) : titleOptions ? 60 : 0;
  const marginRight = useAxis ? (axisLabels?.y2 ? 60 : 30) : 0;
  const marginBottom = useAxis ? (axisLabels?.x ? 60 : 30) : 0;
  const marginLeft = useAxis ? (axisLabels?.y1 ? 60 : 30) : 0;

  // Definisi X axis
  const x = d3
    .scaleBand()
    .domain(filteredData.map((d) => d.category))
    .range([marginLeft, width - marginRight])
    .padding(0.1);

  // Definisi Y1 axis (untuk Bar) dengan axis scale options
  let y1Min = 0;
  let y1Max = Math.max(d3.max(filteredData, (d) => d.barValue) as number);
  if (axisScaleOptions?.y1) {
    if (axisScaleOptions.y1.min !== undefined && axisScaleOptions.y1.min !== "")
      y1Min = Number(axisScaleOptions.y1.min);
    if (axisScaleOptions.y1.max !== undefined && axisScaleOptions.y1.max !== "")
      y1Max = Number(axisScaleOptions.y1.max);
  }

  const y = d3
    .scaleLinear()
    .domain([y1Min, y1Max])
    .nice()
    .range([height - marginBottom, marginTop]);

  // Definisi Y2 axis (untuk Line) - independent domain
  let y2Min = 0;
  let y2Max = Math.max(d3.max(filteredData, (d) => d.lineValue) as number);
  if (axisScaleOptions?.y2) {
    if (axisScaleOptions.y2.min !== undefined && axisScaleOptions.y2.min !== "")
      y2Min = Number(axisScaleOptions.y2.min);
    if (axisScaleOptions.y2.max !== undefined && axisScaleOptions.y2.max !== "")
      y2Max = Number(axisScaleOptions.y2.max);
  }

  const y2 = d3
    .scaleLinear()
    .domain([y2Min, y2Max])
    .nice()
    .range([height - marginBottom, marginTop]);

  // Membuat SVG element
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // Add title if provided
  if (titleOptions) {
    addChartTitle(svg, titleOptions);
  }

  // Bar chart
  svg
    .append("g")
    .attr("fill", (d, i) =>
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[0]
        : "steelblue"
    )
    .selectAll("rect")
    .data(filteredData)
    .join("rect")
    .attr("x", (d: { category: string }) => x(d.category) || 0)
    .attr("y", (d: { barValue: number }) => y(d.barValue))
    .attr(
      "height",
      (d: { barValue: number }) =>
        (y(y1Min) as number) - (y(d.barValue) as number)
    )
    .attr("width", x.bandwidth());

  // Line chart
  const line = d3
    .line<{ category: string; lineValue: number }>()
    .x((d) => x(d.category)! + x.bandwidth() / 2)
    .y((d) => y2(d.lineValue)!);

  svg
    .append("path")
    .datum(filteredData)
    .attr("fill", "none")
    .attr(
      "stroke",
      Array.isArray(chartColors) && chartColors.length > 1
        ? chartColors[1]
        : "red"
    )
    .attr("stroke-width", 1.5)
    .attr("d", line);

  // Points for the line
  svg
    .selectAll(".dot")
    .data(filteredData)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", (d) => x(d.category)! + x.bandwidth() / 2)
    .attr("cy", (d) => y2(d.lineValue)!)
    .attr("r", 3)
    .attr(
      "fill",
      Array.isArray(chartColors) && chartColors.length > 1
        ? chartColors[1]
        : "red"
    );

  // Menambahkan axis
  if (useAxis) {
    // X-Axis (Horizontal)
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - marginBottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    // Y-Axis (Left - untuk Bar) with major increment support
    const y1Axis = d3.axisLeft(y).tickFormat((v) => (+v * 1).toFixed(0));
    const y1MajorIncrement = axisScaleOptions?.y1?.majorIncrement
      ? Number(axisScaleOptions.y1.majorIncrement)
      : undefined;
    if (y1MajorIncrement && y1MajorIncrement > 0) {
      const ticks = generateAxisTicks(y1Min, y1Max, y1MajorIncrement);
      if (ticks) y1Axis.tickValues(ticks);
    }
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft}, 0)`)
      .call(y1Axis)
      .call((g: any) => g.select(".domain").remove());

    // Y2-Axis (Right - untuk Line) with major increment support
    const y2Axis = d3.axisRight(y2).tickFormat((v) => (+v * 1).toFixed(0));
    const y2MajorIncrement = axisScaleOptions?.y2?.majorIncrement
      ? Number(axisScaleOptions.y2.majorIncrement)
      : undefined;
    if (y2MajorIncrement && y2MajorIncrement > 0) {
      const ticks = generateAxisTicks(y2Min, y2Max, y2MajorIncrement);
      if (ticks) y2Axis.tickValues(ticks);
    }
    const y2AxisGroup = svg
      .append("g")
      .attr("transform", `translate(${width - marginRight}, 0)`)
      .call(y2Axis)
      .call((g: any) => g.select(".domain").remove());

    // Custom Y2 axis color
    y2AxisGroup
      .selectAll(".tick text")
      .attr(
        "fill",
        Array.isArray(chartColors) && chartColors.length > 1
          ? chartColors[1]
          : "red"
      );
    y2AxisGroup
      .select(".domain")
      .attr(
        "stroke",
        Array.isArray(chartColors) && chartColors.length > 1
          ? chartColors[1]
          : "red"
      );

    // Add axis labels if provided
    if (axisLabels?.x) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "var(--foreground)")
        .text(axisLabels.x);
    }

    // Left Y axis label (for Bar)
    if (axisLabels?.y1) {
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "var(--foreground)")
        .text(axisLabels.y1);
    }

    // Right Y axis label (for Line)
    if (axisLabels?.y2) {
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", width - 15)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style(
          "fill",
          Array.isArray(chartColors) && chartColors.length > 1
            ? chartColors[1]
            : "red"
        )
        .text(axisLabels.y2);
    }
  }

  return svg.node();
};

export const createDualAxesScatterPlot = (
  data: { x: number; y1: number; y2: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y1?: string; y2?: string },
  axisScaleOptions?: {
    x?: {
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
  },
  chartColors?: string[]
) => {
  const validData = data.filter(
    (d) =>
      d.x !== null &&
      d.y1 !== null &&
      d.y2 !== null &&
      d.x !== undefined &&
      d.y1 !== undefined &&
      d.y2 !== undefined &&
      !isNaN(d.x) &&
      !isNaN(d.y1) &&
      !isNaN(d.y2)
  );

  console.log("Creating dual axis scatter plot with valid data:", validData);

  if (validData.length === 0) {
    console.error("No valid data available for the scatter plot");
    return null;
  }

  // Margin dinamis berdasarkan title dan axis labels
  const marginTop = useAxis ? (titleOptions ? 80 : 30) : titleOptions ? 60 : 0;
  const marginRight = useAxis ? (axisLabels?.y2 ? 60 : 30) : 0;
  const marginBottom = useAxis ? (axisLabels?.x ? 60 : 30) : 0;
  const marginLeft = useAxis ? (axisLabels?.y1 ? 60 : 30) : 0;

  // Skala untuk sumbu X dengan axis scale options
  let xMin = d3.min(validData, (d) => d.x) as number;
  let xMax = d3.max(validData, (d) => d.x) as number;
  if (axisScaleOptions?.x) {
    if (axisScaleOptions.x.min !== undefined && axisScaleOptions.x.min !== "")
      xMin = Number(axisScaleOptions.x.min);
    if (axisScaleOptions.x.max !== undefined && axisScaleOptions.x.max !== "")
      xMax = Number(axisScaleOptions.x.max);
  }

  const x = d3
    .scaleLinear()
    .domain([xMin, xMax])
    .nice()
    .range([marginLeft, width - marginRight]);

  // Skala untuk sumbu Y1 dengan axis scale options
  let y1Min = d3.min(validData, (d) => d.y1) as number;
  let y1Max = d3.max(validData, (d) => d.y1) as number;
  if (axisScaleOptions?.y1) {
    if (axisScaleOptions.y1.min !== undefined && axisScaleOptions.y1.min !== "")
      y1Min = Number(axisScaleOptions.y1.min);
    if (axisScaleOptions.y1.max !== undefined && axisScaleOptions.y1.max !== "")
      y1Max = Number(axisScaleOptions.y1.max);
  }

  const y1 = d3
    .scaleLinear()
    .domain([y1Min, y1Max])
    .nice()
    .range([height - marginBottom, marginTop]);

  // Skala untuk sumbu Y2 dengan axis scale options
  let y2Min = d3.min(validData, (d) => d.y2) as number;
  let y2Max = d3.max(validData, (d) => d.y2) as number;
  if (axisScaleOptions?.y2) {
    if (axisScaleOptions.y2.min !== undefined && axisScaleOptions.y2.min !== "")
      y2Min = Number(axisScaleOptions.y2.min);
    if (axisScaleOptions.y2.max !== undefined && axisScaleOptions.y2.max !== "")
      y2Max = Number(axisScaleOptions.y2.max);
  }

  const y2 = d3
    .scaleLinear()
    .domain([y2Min, y2Max])
    .nice()
    .range([height - marginBottom, marginTop]);

  // Membuat SVG
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  // Add title if provided
  if (titleOptions) {
    addChartTitle(svg, titleOptions);
  }

  if (useAxis) {
    // Menambahkan gridline untuk sumbu X
    svg
      .append("g")
      .attr("stroke", "#ddd")
      .attr("stroke-width", 0.5)
      .call((g) =>
        g
          .append("g")
          .selectAll("line")
          .data(x.ticks())
          .join("line")
          .attr("x1", (d) => x(d))
          .attr("x2", (d) => x(d))
          .attr("y1", marginTop)
          .attr("y2", height - marginBottom)
      );
  }

  if (useAxis) {
    // Menambahkan gridline untuk sumbu Y pertama
    svg
      .append("g")
      .attr("stroke", "#ddd")
      .attr("stroke-width", 0.8)
      .call((g) =>
        g
          .append("g")
          .selectAll("line")
          .data(y1.ticks())
          .join("line")
          .attr("y1", (d) => y1(d))
          .attr("y2", (d) => y1(d))
          .attr("x1", marginLeft)
          .attr("x2", width - marginRight)
      );
  }

  // Menambahkan titik untuk sumbu Y1
  svg
    .append("g")
    .attr(
      "stroke",
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[0]
        : "blue"
    )
    .attr("stroke-width", 1.5)
    .attr("fill", "none")
    .selectAll("circle")
    .data(validData)
    .join("circle")
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y1(d.y1))
    .attr("r", 3);

  if (useAxis) {
    // Menambahkan gridline untuk sumbu Y kedua
    svg
      .append("g")
      .attr("stroke", "#ddd")
      .attr("stroke-width", 0.8)
      .call((g) =>
        g
          .append("g")
          .selectAll("line")
          .data(y2.ticks())
          .join("line")
          .attr("y1", (d) => y2(d))
          .attr("y2", (d) => y2(d))
          .attr("x1", marginLeft)
          .attr("x2", width - marginRight)
      );
  }

  // Menambahkan titik untuk sumbu Y2
  svg
    .append("g")
    .attr(
      "stroke",
      Array.isArray(chartColors) && chartColors.length > 1
        ? chartColors[1]
        : "red"
    )
    .attr("stroke-width", 1.5)
    .attr("fill", "none")
    .selectAll("circle")
    .data(validData)
    .join("circle")
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y2(d.y2))
    .attr("r", 3);

  if (useAxis) {
    // Menambahkan sumbu X with major increment support
    const xAxis = d3.axisBottom(x).ticks(width / 80);
    const xMajorIncrement = axisScaleOptions?.x?.majorIncrement
      ? Number(axisScaleOptions.x.majorIncrement)
      : undefined;
    if (xMajorIncrement && xMajorIncrement > 0) {
      const ticks = generateAxisTicks(xMin, xMax, xMajorIncrement);
      if (ticks) xAxis.tickValues(ticks);
    }
    svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(xAxis)
      .call((g) => g.select(".domain").remove());

    // X-axis label
    if (axisLabels?.x) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(axisLabels.x);
    }

    // Menambahkan sumbu Y1 (kiri) with major increment support
    const y1Axis = d3.axisLeft(y1);
    const y1MajorIncrement = axisScaleOptions?.y1?.majorIncrement
      ? Number(axisScaleOptions.y1.majorIncrement)
      : undefined;
    if (y1MajorIncrement && y1MajorIncrement > 0) {
      const ticks = generateAxisTicks(y1Min, y1Max, y1MajorIncrement);
      if (ticks) y1Axis.tickValues(ticks);
    }
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(y1Axis)
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick text")
          .attr(
            "fill",
            Array.isArray(chartColors) && chartColors.length > 0
              ? chartColors[0]
              : "blue"
          )
      );

    // Y1-axis label
    if (axisLabels?.y1) {
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y", 20)
        .attr(
          "fill",
          Array.isArray(chartColors) && chartColors.length > 0
            ? chartColors[0]
            : "blue"
        )
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(axisLabels.y1);
    }

    // Menambahkan sumbu Y2 (kanan) with major increment support
    const y2Axis = d3.axisRight(y2);
    const y2MajorIncrement = axisScaleOptions?.y2?.majorIncrement
      ? Number(axisScaleOptions.y2.majorIncrement)
      : undefined;
    if (y2MajorIncrement && y2MajorIncrement > 0) {
      const ticks = generateAxisTicks(y2Min, y2Max, y2MajorIncrement);
      if (ticks) y2Axis.tickValues(ticks);
    }
    svg
      .append("g")
      .attr("transform", `translate(${width - marginRight},0)`)
      .call(y2Axis)
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick text")
          .attr(
            "fill",
            Array.isArray(chartColors) && chartColors.length > 1
              ? chartColors[1]
              : "red"
          )
      );

    // Y2-axis label
    if (axisLabels?.y2) {
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y", width - 10)
        .attr(
          "fill",
          Array.isArray(chartColors) && chartColors.length > 1
            ? chartColors[1]
            : "red"
        )
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(axisLabels.y2);
    }
  }

  return svg.node();
};
