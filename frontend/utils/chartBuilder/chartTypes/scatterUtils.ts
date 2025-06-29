import * as d3 from "d3";
import * as ss from "simple-statistics";
import {
  ChartTitleOptions,
  addChartTitle,
  generateAxisTicks,
} from "./chartUtils";

interface GroupedScatterPlotData {
  category: string;
  x: number;
  y: number;
}

export const createScatterPlot = (
  data: { x: number; y: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y?: string },
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
  },
  chartColors?: string[]
) => {
  const validData = data.filter(
    (d) =>
      d.x !== null &&
      d.y !== null &&
      d.x !== undefined &&
      d.y !== undefined &&
      !isNaN(d.x) &&
      !isNaN(d.y)
  );

  console.log("Creating scatter plot with valid data:", validData);

  if (validData.length === 0) {
    console.error("No valid data available for the scatter plot");
    return null;
  }

  const marginTop = useAxis ? (titleOptions ? 80 : 30) : titleOptions ? 40 : 0;
  const marginRight = useAxis ? 30 : 10;
  const marginBottom = useAxis ? (axisLabels?.x ? 40 : 30) : 10;
  const marginLeft = useAxis ? (axisLabels?.y ? 60 : 40) : 10;

  // Apply axis scale options if provided
  let xMin = d3.min(validData, (d) => d.x) as number;
  let xMax = d3.max(validData, (d) => d.x) as number;
  let yMin = d3.min(validData, (d) => d.y) as number;
  let yMax = d3.max(validData, (d) => d.y) as number;

  if (axisScaleOptions?.x) {
    if (axisScaleOptions.x.min !== undefined && axisScaleOptions.x.min !== "")
      xMin = Number(axisScaleOptions.x.min);
    if (axisScaleOptions.x.max !== undefined && axisScaleOptions.x.max !== "")
      xMax = Number(axisScaleOptions.x.max);
  }

  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  const x = d3
    .scaleLinear()
    .domain([xMin, xMax])
    .nice()
    .range([marginLeft, width - marginRight]);

  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - marginBottom, marginTop]);

  const svg = d3
    .create("svg")
    .attr("width", width + marginLeft + marginRight)
    .attr("height", height + marginTop + marginBottom)
    .attr("viewBox", [
      0,
      0,
      width + marginLeft + marginRight,
      height + marginTop + marginBottom,
    ])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  // Add title if provided
  if (titleOptions) {
    addChartTitle(svg, titleOptions);
  }

  svg
    .append("g")
    .call((g) =>
      g
        .append("g")
        .selectAll("line")
        .data(x.ticks())
        .join("line")
        .attr("x1", (d) => 0.5 + x(d))
        .attr("x2", (d) => 0.5 + x(d))
        .attr("y1", marginTop)
        .attr("y2", height - marginBottom)
    )
    .call((g) =>
      g
        .append("g")
        .selectAll("line")
        .data(y.ticks())
        .join("line")
        .attr("y1", (d) => 0.5 + y(d))
        .attr("y2", (d) => 0.5 + y(d))
        .attr("x1", marginLeft)
        .attr("x2", width - marginRight)
    );

  svg
    .append("g")
    .attr(
      "stroke",
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[0]
        : "steelblue"
    )
    .attr("stroke-width", 1.5)
    .attr("fill", "none")
    .selectAll("circle")
    .data(validData)
    .join("circle")
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y(d.y))
    .attr("r", 3);

  if (useAxis) {
    svg
      .append("g")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.1)
      .call((g) =>
        g
          .append("g")
          .selectAll("line")
          .data(x.ticks())
          .join("line")
          .attr("x1", (d) => 0.5 + x(d))
          .attr("x2", (d) => 0.5 + x(d))
          .attr("y1", marginTop)
          .attr("y2", height - marginBottom)
      );

    svg
      .append("g")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.1)
      .call((g) =>
        g
          .append("g")
          .selectAll("line")
          .data(y.ticks())
          .join("line")
          .attr("y1", (d) => 0.5 + y(d))
          .attr("y2", (d) => 0.5 + y(d))
          .attr("x1", marginLeft)
          .attr("x2", width - marginRight)
      );

    // Axis X
    let xAxis = d3.axisBottom(x).ticks(width / 80);
    if (
      axisScaleOptions?.x?.majorIncrement &&
      Number(axisScaleOptions.x.majorIncrement) > 0
    ) {
      const xMinTick = x.domain()[0];
      const xMaxTick = x.domain()[1];
      const majorInc = Number(axisScaleOptions.x.majorIncrement);
      const ticks = [];
      for (let v = xMinTick; v <= xMaxTick; v += majorInc) ticks.push(v);
      xAxis = xAxis.tickValues(ticks);
    }
    svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(xAxis)
      .call((g) => g.select(".domain").remove());

    // Tambahkan label X axis di tengah bawah
    if (axisLabels?.x) {
      svg
        .append("text")
        .attr("x", (width + marginLeft - marginRight) / 2)
        .attr("y", height - marginBottom + 40)
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--foreground))")
        .style("font-size", "14px")
        .text(axisLabels.x);
    }

    // Axis Y
    let yAxis = d3.axisLeft(y);
    if (
      axisScaleOptions?.y?.majorIncrement &&
      Number(axisScaleOptions.y.majorIncrement) > 0
    ) {
      const yMinTick = y.domain()[0];
      const yMaxTick = y.domain()[1];
      const majorInc = Number(axisScaleOptions.y.majorIncrement);
      const ticks = [];
      for (let v = yMinTick; v <= yMaxTick; v += majorInc) ticks.push(v);
      yAxis = yAxis.tickValues(ticks);
    }
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxis)
      .call((g) => g.select(".domain").remove());

    // Tambahkan label Y axis di tengah kiri, vertikal
    if (axisLabels?.y) {
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height + marginTop - marginBottom) / 2)
        .attr("y", marginLeft - 35)
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--foreground))")
        .style("font-size", "14px")
        .text(axisLabels.y);
    }
  }

  return svg.node();
};

export const createScatterPlotWithFitLine = (
  data: { x: number; y: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y?: string },
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
  },
  chartColors?: string[]
) => {
  // Menyaring data yang valid
  const validData = data.filter(
    (d) =>
      d.x !== null &&
      d.y !== null &&
      d.x !== undefined &&
      d.y !== undefined &&
      !isNaN(d.x) &&
      !isNaN(d.y)
  );

  console.log("Creating scatter plot with fit line and valid data:", validData);

  // Pesan eror jika tidak ada data valid
  if (validData.length === 0) {
    console.error("No valid data available for the scatter plot");
    return null;
  }

  const marginTop = useAxis ? (titleOptions ? 80 : 30) : titleOptions ? 40 : 0;
  const marginRight = useAxis ? 30 : 10;
  const marginBottom = useAxis ? (axisLabels?.x ? 40 : 30) : 10;
  const marginLeft = useAxis ? (axisLabels?.y ? 60 : 40) : 10;

  // Apply axis scale options if provided
  let xMin = d3.min(validData, (d) => d.x) as number;
  let xMax = d3.max(validData, (d) => d.x) as number;
  let yMin = d3.min(validData, (d) => d.y) as number;
  let yMax = d3.max(validData, (d) => d.y) as number;

  if (axisScaleOptions?.x) {
    if (axisScaleOptions.x.min !== undefined && axisScaleOptions.x.min !== "")
      xMin = Number(axisScaleOptions.x.min);
    if (axisScaleOptions.x.max !== undefined && axisScaleOptions.x.max !== "")
      xMax = Number(axisScaleOptions.x.max);
  }
  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  const x = d3
    .scaleLinear()
    .domain([xMin, xMax])
    .nice()
    .range([marginLeft, width - marginRight]);

  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - marginBottom, marginTop]);

  const svg = d3
    .create("svg")
    .attr("width", width + marginLeft + marginRight)
    .attr("height", height + marginTop + marginBottom)
    .attr("viewBox", [
      0,
      0,
      width + marginLeft + marginRight,
      height + marginTop + marginBottom,
    ])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  // Add title if provided
  if (titleOptions) {
    addChartTitle(svg, titleOptions);
  }

  if (useAxis) {
    // Tambahkan grid (X dan Y) setelah definisi skala
    svg
      .append("g")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.1)
      .call((g) =>
        g
          .append("g")
          .selectAll("line")
          .data(x.ticks())
          .join("line")
          .attr("x1", (d) => 0.5 + x(d))
          .attr("x2", (d) => 0.5 + x(d))
          .attr("y1", marginTop)
          .attr("y2", height - marginBottom)
      );

    svg
      .append("g")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.1)
      .call((g) =>
        g
          .append("g")
          .selectAll("line")
          .data(y.ticks())
          .join("line")
          .attr("y1", (d) => 0.5 + y(d))
          .attr("y2", (d) => 0.5 + y(d))
          .attr("x1", marginLeft)
          .attr("x2", width - marginRight)
      );
  }
  // Titik-titik scatter
  svg
    .append("g")
    .attr(
      "stroke",
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[0]
        : "steelblue"
    )
    .attr("stroke-width", 1.5)
    .attr("fill", "none")
    .selectAll("circle")
    .data(validData)
    .join("circle")
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y(d.y))
    .attr("r", 3);

  if (useAxis) {
    // Axis X
    let xAxis = d3.axisBottom(x).ticks(width / 80);
    if (
      axisScaleOptions?.x?.majorIncrement &&
      Number(axisScaleOptions.x.majorIncrement) > 0
    ) {
      const xMinTick = x.domain()[0];
      const xMaxTick = x.domain()[1];
      const majorInc = Number(axisScaleOptions.x.majorIncrement);
      const ticks = [];
      for (let v = xMinTick; v <= xMaxTick; v += majorInc) ticks.push(v);
      xAxis = xAxis.tickValues(ticks);
    }
    svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(xAxis)
      .call((g) => g.select(".domain").remove());

    // Tambahkan label X axis di tengah bawah
    if (axisLabels?.x) {
      svg
        .append("text")
        .attr("x", (width + marginLeft - marginRight) / 2)
        .attr("y", height - marginBottom + 40)
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--foreground))")
        .style("font-size", "14px")
        .text(axisLabels.x);
    }

    // Axis Y
    let yAxis = d3.axisLeft(y);
    if (
      axisScaleOptions?.y?.majorIncrement &&
      Number(axisScaleOptions.y.majorIncrement) > 0
    ) {
      const yMinTick = y.domain()[0];
      const yMaxTick = y.domain()[1];
      const majorInc = Number(axisScaleOptions.y.majorIncrement);
      const ticks = [];
      for (let v = yMinTick; v <= yMaxTick; v += majorInc) ticks.push(v);
      yAxis = yAxis.tickValues(ticks);
    }
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxis)
      .call((g) => g.select(".domain").remove());

    // Tambahkan label Y axis di tengah kiri, vertikal
    if (axisLabels?.y) {
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height + marginTop - marginBottom) / 2)
        .attr("y", marginLeft - 35)
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--foreground))")
        .style("font-size", "14px")
        .text(axisLabels.y);
    }
  }

  // Regresi linier
  const regression = ss.linearRegression(validData.map((d) => [d.x, d.y]));
  const slope = regression.m;
  const intercept = regression.b;

  // Titik untuk garis regresi
  const regXMin = x.domain()[0];
  const regXMax = x.domain()[1];
  const regressionData = [
    { x: regXMin, y: slope * regXMin + intercept },
    { x: regXMax, y: slope * regXMax + intercept },
  ];

  // Garis regresi
  const regressionLine = d3
    .line<{ x: number; y: number }>()
    .x((d) => x(d.x))
    .y((d) => y(d.y));

  svg
    .append("path")
    .datum(regressionData)
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("d", regressionLine);

  if (useAxis) {
    // Persamaan regresi
    svg
      .append("text")
      .attr("x", width + marginLeft - 10)
      .attr("y", marginTop + 10)
      .attr("fill", "black")
      .attr("text-anchor", "end")
      .attr("font-size", "12px")
      .text(`y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`);
  }

  return svg.node();
};

/**
 * Membuat Grouped Scatter Plot

 * @param data - Array dari objek GroupedScatterPlotData
 * @param width - Lebar SVG (default: 928)
 * @param height - Tinggi SVG (default: 600)
 * @param useAxis - Boolean untuk menentukan apakah sumbu dan grid lines akan ditampilkan (default: true)
 * @returns SVGSVGElement atau null jika data tidak valid
 */
export const createGroupedScatterPlot = (
  data: GroupedScatterPlotData[],
  width: number = 600,
  height: number = 400,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y?: string },
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
  },
  chartColors?: string[]
): SVGSVGElement | null => {
  const validData = data.filter(
    (d) =>
      d.category !== null &&
      d.x !== null &&
      d.y !== null &&
      d.category !== undefined &&
      d.x !== undefined &&
      d.y !== undefined &&
      !isNaN(d.x) &&
      !isNaN(d.y)
  );

  if (validData.length === 0) {
    console.error("No valid data available for the grouped scatter plot");
    return null;
  }

  const margin = {
    top: useAxis ? (titleOptions ? 70 : 30) : titleOptions ? 40 : 0,
    right: useAxis ? 30 : 10,
    bottom: useAxis ? 90 : 10,
    left: useAxis ? 50 : 10,
  };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const categories = Array.from(new Set(validData.map((d) => d.category)));

  // X Scale
  let xMin = d3.min(validData, (d) => d.x)!;
  let xMax = d3.max(validData, (d) => d.x)!;
  let xAxisMajorIncrement = axisScaleOptions?.x?.majorIncrement
    ? Number(axisScaleOptions.x.majorIncrement)
    : undefined;
  if (axisScaleOptions?.x) {
    if (axisScaleOptions.x.min !== undefined && axisScaleOptions.x.min !== "")
      xMin = Number(axisScaleOptions.x.min);
    if (axisScaleOptions.x.max !== undefined && axisScaleOptions.x.max !== "")
      xMax = Number(axisScaleOptions.x.max);
  }

  const xScale = d3
    .scaleLinear()
    .domain([xMin, xMax])
    .nice()
    .range([0, innerWidth]);

  // Y Scale
  let yMin = d3.min(validData, (d) => d.y)!;
  let yMax = d3.max(validData, (d) => d.y)!;
  let yAxisMajorIncrement = axisScaleOptions?.y?.majorIncrement
    ? Number(axisScaleOptions.y.majorIncrement)
    : undefined;
  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  const yScale = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([innerHeight, 0]);

  const colorScale = d3
    .scaleOrdinal<string>()
    .domain(categories)
    .range(chartColors || d3.schemeCategory10);

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  const chart = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  if (titleOptions) {
    addChartTitle(svg, titleOptions);
  }

  if (useAxis) {
    chart
      .append("g")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.1)
      .selectAll("line.horizontal")
      .data(yScale.ticks())
      .join("line")
      .attr("class", "horizontal")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d));

    chart
      .append("g")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.1)
      .selectAll("line.vertical")
      .data(xScale.ticks())
      .join("line")
      .attr("class", "vertical")
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d));

    const xAxis = d3.axisBottom(xScale);
    if (
      xAxisMajorIncrement &&
      typeof xMin === "number" &&
      typeof xMax === "number" &&
      !isNaN(xAxisMajorIncrement) &&
      !isNaN(xMin) &&
      !isNaN(xMax)
    ) {
      const ticks = generateAxisTicks(xMin, xMax, xAxisMajorIncrement);
      if (ticks) xAxis.tickValues(ticks);
    }
    chart
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis.ticks(width / 80))
      .call((g) => g.select(".domain").remove());

    svg
      .append("text")
      .attr("x", margin.left + innerWidth / 2)
      .attr("y", height - margin.bottom + 50)
      .attr("fill", "currentColor")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(axisLabels?.x || "X Axis");

    const yAxis = d3.axisLeft(yScale);
    if (
      yAxisMajorIncrement &&
      typeof yMin === "number" &&
      typeof yMax === "number" &&
      !isNaN(yAxisMajorIncrement) &&
      !isNaN(yMin) &&
      !isNaN(yMax)
    ) {
      const ticks = generateAxisTicks(yMin, yMax, yAxisMajorIncrement);
      if (ticks) yAxis.tickValues(ticks);
    }
    chart
      .append("g")
      .call(yAxis)
      .call((g) => g.select(".domain").remove());

    svg
      .append("text")
      .attr("transform", `rotate(-90)`)
      .attr("x", -(margin.top + innerHeight / 2))
      .attr("y", margin.left - 40)
      .attr("fill", "currentColor")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(axisLabels?.y || "Y Axis");

    // Menambahkan legenda secara horizontal di bawah chart
    const legendGroup = svg
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .attr(
        "transform",
        `translate(${margin.left}, ${height - margin.bottom + 60})`
      );
    const legendItemWidth = 19;
    const legendItemHeight = 19;
    const labelOffset = 5;
    const legendSpacingX = 130;
    const legendSpacingY = 25;
    const legendMaxWidth = width - margin.left - margin.right;
    const itemsPerRow = Math.floor(legendMaxWidth / legendSpacingX);

    categories.forEach((subcategory, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const xOffset = col * legendSpacingX;
      const yOffset = row * legendSpacingY;

      // Menambahkan swatch
      legendGroup
        .append("rect")
        .attr("x", xOffset)
        .attr("y", yOffset)
        .attr("width", legendItemWidth)
        .attr("height", legendItemHeight)
        .attr("fill", colorScale(subcategory));

      // Menambahkan teks label
      legendGroup
        .append("text")
        .attr("x", xOffset + legendItemWidth + labelOffset)
        .attr("y", yOffset + legendItemHeight / 2)
        .attr("dy", "0.35em")
        .text(subcategory);
    });
  }

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "#f9f9f9")
    .style("padding", "8px")
    .style("border", "1px solid #d3d3d3")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("font-size", "12px")
    .style("box-shadow", "0px 0px 6px #aaa");

  chart
    .append("g")
    .attr("stroke-width", 1.5)
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .selectAll("circle")
    .data(validData)
    .join("circle")
    .attr("cx", (d) => xScale(d.x))
    .attr("cy", (d) => yScale(d.y))
    .attr("r", 5)
    .attr("fill", (d) => colorScale(d.category) as string)
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(
          `
          <strong>Category:</strong> ${d.category}<br/>
          <strong>X Value:</strong> ${d.x}<br/>
          <strong>Y Value:</strong> ${d.y}
        `
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
    });

  return svg.node();
};

export const createDotPlot = (
  data: { category: string; value: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y?: string },
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
  },
  chartColors?: string[]
) => {
  console.log("Creating improved stacked dot plot with data:", data);

  const marginTop = useAxis ? (titleOptions ? 80 : 30) : titleOptions ? 40 : 0;
  const marginRight = useAxis ? 20 : 10;
  const marginBottom = useAxis ? (axisLabels?.x ? 40 : 20) : 10;
  const marginLeft = useAxis ? (axisLabels?.y ? 80 : 40) : 10;
  const dotRadius = 7;

  // Tambahkan uniqueId ke setiap data point
  const processedData = data.map((d, i) => ({
    ...d,
    uniqueId: `${d.category}_${i}`,
    displayLabel: d.category,
  }));

  // Skala X: satu band per data point, urut sesuai data
  const x = d3
    .scaleBand()
    .domain(processedData.map((d) => d.uniqueId))
    .range([marginLeft, width - marginRight])
    .padding(0.5);

  // Skala Y: Nilai dari data
  let yMin = 0;
  let yMax = d3.max(processedData, (d) => d.value) || 0;
  let yAxisMajorIncrement = axisScaleOptions?.y?.majorIncrement
    ? Number(axisScaleOptions.y.majorIncrement)
    : undefined;
  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .range([height - marginBottom, marginTop]);

  // Dynamic Y-axis
  const tickCount = yMax > 100 ? 10 : yMax > 50 ? 7 : 5;

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  // Add title if provided
  if (titleOptions) {
    addChartTitle(svg, titleOptions);
  }

  // Draw the dots (apa adanya, satu group per data point, urut sesuai input)
  const dotGroup = svg
    .append("g")
    .attr(
      "fill",
      chartColors && chartColors.length > 0 ? chartColors[0] : "steelblue"
    );

  processedData.forEach((d) => {
    const xBase = x(d.uniqueId)! + x.bandwidth() / 2;
    for (let i = 0; i < d.value; i++) {
      dotGroup
        .append("circle")
        .attr("cx", xBase)
        .attr("cy", y(i + 1))
        .attr("r", dotRadius);
    }
  });

  // Menambahkan axis
  if (useAxis) {
    // X axis: satu band per data point, label pakai nama kategori asli
    const xAxis = d3.axisBottom(x).tickFormat((d) => {
      const dataPoint = processedData.find((item) => item.uniqueId === d);
      return dataPoint ? dataPoint.displayLabel : d;
    });
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - marginBottom})`)
      .call(xAxis.tickSizeOuter(0));

    if (axisLabels?.x) {
      svg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height - marginBottom + 35)
        .style("font-size", "12px")
        .attr("fill", "hsl(var(--foreground))")
        .text(axisLabels.x);
    }

    const yAxis = d3.axisLeft(y);
    if (
      yAxisMajorIncrement &&
      typeof yMin === "number" &&
      typeof yMax === "number" &&
      !isNaN(yAxisMajorIncrement) &&
      !isNaN(yMin) &&
      !isNaN(yMax)
    ) {
      const ticks = generateAxisTicks(yMin, yMax, yAxisMajorIncrement);
      if (ticks) yAxis.tickValues(ticks);
    }
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft}, 0)`)
      .call(yAxis.ticks(tickCount))
      .call((g) => g.select(".domain").remove());

    if (axisLabels?.y) {
      svg
        .append("text")
        .attr("transform", `rotate(-90)`)
        .attr("x", -(height - marginBottom + marginTop) / 2)
        .attr("y", marginLeft / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .attr("fill", "hsl(var(--foreground))")
        .text(axisLabels.y);
    }
  }

  return svg.node();
};

export const createScatterPlotMatrix = (
  data: { [key: string]: any }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y?: string },
  chartColors?: string[]
) => {
  const padding = useAxis ? 20 : 5;
  const columns: string[] = Object.keys(data[0]).filter(
    (d) => typeof data[0][d] === "number"
  );
  const n = columns.length;

  // --- Dynamic margin calculation ---
  // Create a canvas context for measuring text
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "12px sans-serif";

  // Estimate Y axis tick labels
  const yTicks = d3
    .scaleLinear()
    .domain([0, 100]) // dummy domain, will be replaced per cell
    .ticks(5)
    .map((tick) => tick.toString());
  // Use the longest possible label for Y axis
  const maxYTickWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick).width)) ?? 0;
  const yLabelWidth = axisLabels?.y ? ctx.measureText(axisLabels.y).width : 0;
  const marginLeft = useAxis
    ? Math.max(maxYTickWidth + (axisLabels?.y ? 30 : 10), 40, yLabelWidth + 10)
    : 10;

  // Estimate X axis tick labels
  const xTicks = d3
    .scaleLinear()
    .domain([0, 100]) // dummy domain, will be replaced per cell
    .ticks(5)
    .map((tick) => tick.toString());
  // Use the longest possible label for X axis
  const maxXTickHeight = 12; // font size, since X ticks are horizontal
  const xLabelHeight = axisLabels?.x ? 16 : 0;
  const marginBottom = useAxis
    ? Math.max(maxXTickHeight + (axisLabels?.x ? 8 : 5), 30, xLabelHeight + 8)
    : 10;

  // Estimate title/subtitle height
  let marginTop = 20;
  if (titleOptions) {
    ctx.font = "bold 18px sans-serif";
    marginTop += 24; // title
    if (titleOptions.subtitle) {
      ctx.font = "12px sans-serif";
      marginTop += 18; // subtitle
    }
  }

  const marginRight = 15;

  // --- End dynamic margin calculation ---

  const matrixWidth = width - marginLeft - marginRight;
  const matrixHeight = height - marginTop - marginBottom;
  const size =
    (Math.min(matrixWidth, matrixHeight) - (n + 1) * padding) / n + padding;
  const offsetX = marginLeft + (matrixWidth - size * n) / 2;
  const offsetY = marginTop + (matrixHeight - size * n) / 2;

  const color = d3
    .scaleOrdinal<string, string>()
    .domain(data.map((d) => d.species))
    .range(
      chartColors && chartColors.length > 0 ? chartColors : d3.schemeCategory10
    );

  const x: d3.ScaleLinear<number, number>[] = columns.map((c) =>
    d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d[c]) as [number, number])
      .rangeRound([padding / 2, size - padding / 2])
  );

  const y: d3.ScaleLinear<number, number>[] = x.map((xScale) =>
    xScale.copy().range([size - padding / 2, padding / 2])
  );

  const axisx = d3
    .axisBottom(d3.scaleLinear())
    .ticks(4)
    .tickSize(size * columns.length);

  const axisy = d3
    .axisLeft(d3.scaleLinear())
    .ticks(4)
    .tickSize(-size * columns.length);

  const xAxis = (g: d3.Selection<SVGGElement, any, null, undefined>) => {
    g.selectAll<SVGGElement, d3.ScaleLinear<number, number>>("g")
      .data(x)
      .join("g")
      .attr("transform", (d, i) => `translate(${i * size}, 0)`)
      .each(function (d) {
        d3.select(this as SVGGElement).call(axisx.scale(d));
      })
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd"));
  };

  const yAxis = (g: d3.Selection<SVGGElement, any, null, undefined>) => {
    g.selectAll<SVGGElement, d3.ScaleLinear<number, number>>("g")
      .data(y)
      .join("g")
      .attr("transform", (d, i) => `translate(0,${i * size})`)
      .each(function (d) {
        d3.select(this as SVGGElement).call(axisy.scale(d));
      })
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd"));
  };

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height]);

  if (titleOptions) {
    addChartTitle(svg, titleOptions);
  }

  // Matrix group di-offset sesuai margin dan di-center-kan di area matrix
  const matrixGroup = svg
    .append("g")
    .attr("transform", `translate(${offsetX},${offsetY})`);

  if (useAxis) {
    matrixGroup.append("g").call(xAxis);
    matrixGroup.append("g").call(yAxis);
  }

  const cell = matrixGroup
    .append("g")
    .selectAll("g")
    .data(d3.cross(d3.range(columns.length), d3.range(columns.length)))
    .join("g")
    .attr("transform", ([i, j]) => `translate(${i * size},${j * size})`);

  cell
    .append("rect")
    .attr("fill", "none")
    .attr("stroke", "#aaa")
    .attr("x", padding / 2 + 0.5)
    .attr("y", padding / 2 + 0.5)
    .attr("width", size - padding)
    .attr("height", size - padding);

  cell.each(function ([i, j]: [number, number]) {
    d3.select(this)
      .selectAll<SVGCircleElement, { [key: string]: number }>("circle")
      .data(data.filter((d) => !isNaN(d[columns[i]]) && !isNaN(d[columns[j]])))
      .join("circle")
      .attr("cx", (d) => x[i](d[columns[i]]))
      .attr("cy", (d) => y[j](d[columns[j]]))
      .attr("r", 3.5)
      .attr("fill-opacity", 0.7)
      .attr("fill", (d) => color(d.species));
  });

  if (useAxis) {
    for (let i = 0; i <= columns.length; i++) {
      const xPos = i * size;
      if (xPos <= size * columns.length) {
        matrixGroup
          .append("line")
          .attr("x1", xPos)
          .attr("x2", xPos)
          .attr("y1", 0)
          .attr("y2", size * columns.length)
          .attr("stroke", "#ddd");
      }
    }
    for (let j = 0; j <= columns.length; j++) {
      const yPos = j * size;
      if (yPos <= size * columns.length) {
        matrixGroup
          .append("line")
          .attr("x1", 0)
          .attr("x2", size * columns.length)
          .attr("y1", yPos)
          .attr("y2", yPos)
          .attr("stroke", "#ddd");
      }
    }
    columns.forEach((col, i) => {
      matrixGroup
        .append("text")
        .attr("x", i * size + 8)
        .attr("y", i * size + 22)
        .attr("text-anchor", "start")
        .attr("fill", "#222")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(col);
    });
  }

  return Object.assign(svg.node()!, { scales: { color } });
};

export const createDropLineChart = (
  data: { x: string; y: number; category: string }[],
  width: number,
  height: number,
  useAxis: boolean = true
) => {
  const validData = data.filter(
    (d) =>
      d.x !== null &&
      d.y !== null &&
      d.category !== null &&
      d.x !== undefined &&
      d.y !== undefined &&
      d.category !== undefined &&
      !isNaN(d.y)
  );

  console.log("Creating drop-line chart with valid data:", validData);

  if (validData.length === 0) {
    console.error("No valid data available for the drop-line chart");
    return null;
  }

  const marginTop = useAxis ? 30 : 10;
  const marginRight = useAxis ? 30 : 10;
  const marginBottom = useAxis ? 40 : 10;
  const marginLeft = useAxis ? 40 : 10;

  const x = d3
    .scaleBand()
    .domain(validData.map((d) => d.x))
    .range([marginLeft, width - marginRight])
    .padding(0.1);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(validData, (d) => d.y) as number])
    .nice()
    .range([height - marginBottom, marginTop]);

  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  if (useAxis) {
    svg
      .append("g")
      .attr("stroke", "#ddd")
      .attr("stroke-width", 0.5)
      .call((g) =>
        g
          .append("g")
          .selectAll("line")
          .data(x.domain())
          .join("line")
          .attr("x1", (d) => x(d)!)
          .attr("x2", (d) => x(d)!)
          .attr("y1", marginTop)
          .attr("y2", height - marginBottom)
      );
  }

  if (useAxis) {
    svg
      .append("g")
      .attr("stroke", "#ddd")
      .attr("stroke-width", 0.8)
      .call((g) =>
        g
          .append("g")
          .selectAll("line")
          .data(y.ticks())
          .join("line")
          .attr("y1", (d) => y(d))
          .attr("y2", (d) => y(d))
          .attr("x1", marginLeft)
          .attr("x2", width - marginRight)
      );
  }

  const groupedData = d3.groups(validData, (d) => d.x);

  svg
    .append("g")
    .selectAll("line")
    .data(groupedData)
    .join("line")
    .attr("x1", (d) => x(d[0])! + x.bandwidth() / 2)
    .attr("x2", (d) => x(d[0])! + x.bandwidth() / 2)
    .attr("y1", (d) => y(d[1][0]?.y || 0))
    .attr("y2", (d) => y(d[1][d[1].length - 1]?.y || 0))
    .attr("stroke", "black")
    .attr("stroke-width", 1.5);

  groupedData.forEach((categoryData) => {
    svg
      .append("g")
      .selectAll("line")
      .data(categoryData[1].slice(1))
      .join("line")
      .attr("x1", (d, i) => x(d.x)! + x.bandwidth() / 2)
      .attr("x2", (d, i) => x(categoryData[1][i].x)! + x.bandwidth() / 2)
      .attr("y1", (d) => y(d.y))
      .attr("y2", (d, i) => y(categoryData[1][i].y))
      .attr("stroke", "black")
      .attr("stroke-width", 1.5);
  });

  svg
    .append("g")
    .selectAll("circle")
    .data(validData)
    .join("circle")
    .attr("cx", (d) => x(d.x)! + x.bandwidth() / 2)
    .attr("cy", (d) => y(d.y))
    .attr("r", 6)
    .attr("fill", (d) => color(d.category));

  if (useAxis) {
    svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .append("text")
          .attr("x", width)
          .attr("y", marginBottom - 4)
          .attr("fill", "currentColor")
          .attr("text-anchor", "end")
          .text("→ Kategori")
      );

    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .append("text")
          .attr("x", -marginLeft)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text("↑ Nilai")
      );
  }

  return svg.node();
};

export const createSummaryPointPlot = (
  data: { category: string; value: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  statistic: "mean" | "median" | "mode" | "min" | "max" = "mean" // Pilihan statistik
) => {
  // Mengelompokkan data berdasarkan category dan menghitung statistik per kategori
  const categoryValues = Array.from(
    d3.group(data, (d) => d.category),
    ([key, value]) => ({
      category: key,
      value: calculateStat(value, statistic),
    })
  );

  console.log(
    `Creating summary point plot with ${statistic} values:`,
    categoryValues
  );

  if (categoryValues.length === 0) {
    console.error("No valid data available for the summary point plot");
    return null;
  }

  const marginTop = useAxis ? 30 : 10;
  const marginRight = useAxis ? 30 : 10;
  const marginBottom = useAxis ? 70 : 10;
  const marginLeft = useAxis ? 40 : 10;

  // Skala untuk sumbu X (category)
  const x = d3
    .scaleBand()
    .domain(categoryValues.map((d) => d.category))
    .range([marginLeft, width - marginRight])
    .padding(0.1);

  // Skala untuk sumbu Y (statistik nilai)
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(categoryValues, (d) => d.value) as number])
    .nice()
    .range([height - marginBottom, marginTop]);

  // Membuat SVG
  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  // Warna titik (default warna abu-abu untuk semua titik)
  const color = "#4682B4";

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
          .data(x.domain())
          .join("line")
          .attr("x1", (d) => x(d)!)
          .attr("x2", (d) => x(d)!)
          .attr("y1", marginTop)
          .attr("y2", height - marginBottom)
      );
  }

  if (useAxis) {
    // Menambahkan gridline untuk sumbu Y
    svg
      .append("g")
      .attr("stroke", "#ddd")
      .attr("stroke-width", 0.8)
      .call((g) =>
        g
          .append("g")
          .selectAll("line")
          .data(y.ticks())
          .join("line")
          .attr("y1", (d) => y(d))
          .attr("y2", (d) => y(d))
          .attr("x1", marginLeft)
          .attr("x2", width - marginRight)
      );
  }

  // Menambahkan titik data untuk setiap kategori berdasarkan statistik yang dihitung
  svg
    .append("g")
    .selectAll("circle")
    .data(categoryValues)
    .join("circle")
    .attr("cx", (d) => x(d.category)! + x.bandwidth() / 2)
    .attr("cy", (d) => y(d.value))
    .attr("r", 6)
    .attr("fill", color);

  // Menambahkan teks informasi statistik di bawah grafik
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - marginBottom + 40)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .text(
      `Statistik: ${statistic.charAt(0).toUpperCase() + statistic.slice(1)}`
    );

  if (useAxis) {
    // Menambahkan sumbu X
    svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .append("text")
          .attr("x", width)
          .attr("y", marginBottom - 4)
          .attr("fill", "currentColor")
          .attr("text-anchor", "end")
          .text("→ Kategori")
      );

    // Menambahkan sumbu Y
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .append("text")
          .attr("x", -marginLeft)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text("↑ Nilai")
      );
  }

  return svg.node();
};

// Fungsi untuk menghitung statistik berdasarkan pilihan
function calculateStat(
  data: { value: number }[],
  statistic: "mean" | "median" | "mode" | "min" | "max"
): number {
  switch (statistic) {
    case "mean":
      return d3.mean(data, (d) => d.value) as number;
    case "median":
      return d3.median(data, (d) => d.value) as number;
    case "mode":
      return mode(data);
    case "min":
      return d3.min(data, (d) => d.value) as number;
    case "max":
      return d3.max(data, (d) => d.value) as number;
    default:
      return 0;
  }
}

// Fungsi untuk menghitung mode
function mode(data: { value: number }[]): number {
  const frequency: { [key: number]: number } = {};
  let maxFreq = 0;
  let modeValue = 0;
  data.forEach((d) => {
    frequency[d.value] = (frequency[d.value] || 0) + 1;
    if (frequency[d.value] > maxFreq) {
      maxFreq = frequency[d.value];
      modeValue = d.value;
    }
  });
  return modeValue;
}
