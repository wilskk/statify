import * as d3 from "d3";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { ChartTitleOptions, addChartTitle } from "./chartUtils";
import { getMajorTicks } from "../chartUtils";
import { filterDataByAxisRange } from "../dataFilter";
import { generateAxisTicks } from "./chartUtils";

// Definisikan interface untuk data chart
interface ChartData {
  category: string;
  subcategory: string;
  value: number;
}

// Definisikan interface untuk formattedData
interface FormattedData {
  category: string;
  [key: string]: number | string;
}

export const createVerticalBarChart2 = (
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
  // Filter data sesuai axis min/max
  const filteredData = filterDataByAxisRange(
    data,
    {
      x: { min: axisScaleOptions?.x?.min, max: axisScaleOptions?.x?.max },
      y: { min: axisScaleOptions?.y?.min, max: axisScaleOptions?.y?.max },
    },
    { x: "category", y: "value" }
  );
  console.log("Creating chart with filtered data:", filteredData);
  console.log("Creating chart with data:", axisLabels);

  const maxValue = d3.max(filteredData, (d) => d.value) as number;

  // Label X dinamis
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";
  const maxXLabelWidth =
    d3.max(filteredData, (d) => ctx.measureText(d.category).width) ?? 0;
  const yTicks = d3.scaleLinear().domain([0, maxValue]).ticks(5);
  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick.toFixed(0)).width)) ?? 0;

  const needRotateX = maxXLabelWidth > width / filteredData.length;

  // Margin
  const xLabelLength = axisLabels?.x ? axisLabels.x.length : 0;
  const yLabelLength = axisLabels?.y ? axisLabels.y.length : 0;
  const marginBottom = useAxis ? 10 : 0;
  const marginLeft = useAxis
    ? Math.max(maxYLabelWidth + (axisLabels?.y ? 60 : 20), 60, yLabelLength * 7)
    : 0;
  const marginTop = useAxis ? (titleOptions ? 80 : 30) : titleOptions ? 60 : 0;
  const marginRight = useAxis ? 30 : 0;

  // Y scale
  let yMin = 0;
  let yMax = maxValue;
  let majorIncrement = axisScaleOptions?.y?.majorIncrement
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
    .nice()
    .range([height - marginBottom, marginTop]);

  // X scale (band) - for completeness, but min/max rarely used for band
  const x = d3
    .scaleBand()
    .domain(filteredData.map((d) => d.category))
    .range([marginLeft, width - marginRight])
    .padding(0.1);

  const svg = d3
    .create("svg")
    .attr("width", width + marginLeft + marginRight)
    .attr("height", height + marginTop + marginBottom)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // Add title if provided
  if (titleOptions) {
    console.log("Adding title with options:", titleOptions);
    addChartTitle(svg, titleOptions);
  }

  svg
    .append("g")
    .selectAll("rect")
    .data(filteredData)
    .join("rect")
    .attr("x", (d) => x(d.category) || 0)
    .attr("y", (d) => y(d.value))
    .attr("height", (d) => (y(yMin) as number) - (y(d.value) as number))
    .attr("width", x.bandwidth())
    .attr("fill", (d, i) =>
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[i % chartColors.length]
        : "hsl(var(--primary))"
    );

  if (useAxis) {
    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0, ${height - marginBottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .call((g) =>
        g.selectAll(".domain, .tick line").attr("stroke", "hsl(var(--border))")
      )
      .call((g) =>
        g.selectAll("text").attr("fill", "hsl(var(--muted-foreground))")
      );

    if (needRotateX) {
      xAxis
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
    }

    // Add X axis label if provided
    if (axisLabels?.x) {
      svg
        .append("text")
        .attr("x", (width + marginLeft - marginRight) / 2)
        .attr("y", height - marginBottom + 35) // posisi lebih ke atas agar tidak keluar SVG
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--foreground))")
        .style("font-size", "14px")
        .text(axisLabels.x);
    }

    // Vertical Bar Chart axis Y
    const yAxis = d3.axisLeft(y).tickFormat(d3.format(".2s"));
    if (majorIncrement && majorIncrement > 0) {
      const ticks = generateAxisTicks(yMin, yMax, majorIncrement);
      if (ticks) yAxis.tickValues(ticks);
    }
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxis)
      .call((g) => g.select(".domain").remove());

    // Add Y axis label if provided
    if (axisLabels?.y) {
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height + marginTop - marginBottom) / 2)
        .attr("y", marginLeft - 50)
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--foreground))")
        .style("font-size", "14px")
        .text(axisLabels.y);
    }
  }

  return svg.node();
};

export const createHorizontalBarChart = (
  data: { category: string; value: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  barColor: string = "steelblue",
  threshold: number = 0.007,
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
  // Filter data sesuai axis min/max
  const filteredData = filterDataByAxisRange(
    data,
    {
      x: { min: axisScaleOptions?.x?.min, max: axisScaleOptions?.x?.max },
      y: { min: axisScaleOptions?.y?.min, max: axisScaleOptions?.y?.max },
    },
    { x: "category", y: "value" }
  );

  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif";

  const maxCategoryWidth =
    d3.max(filteredData.map((d) => ctx.measureText(d.category).width)) ?? 0;

  // Margin definitions (move up here)
  const xScaleTemp = d3
    .scaleLinear()
    .domain([0, d3.max(filteredData, (d) => d.value) ?? 0]);
  const xTicks = xScaleTemp.ticks(5).map((d) => d.toFixed(0) + "%");
  const maxTickWidth = d3.max(xTicks.map((t) => ctx.measureText(t).width)) ?? 0;

  const marginLeft = useAxis ? maxCategoryWidth + (axisLabels?.y ? 60 : 25) : 0;
  const marginRight = useAxis ? maxTickWidth + 30 : 0;
  const marginTop = useAxis
    ? titleOptions
      ? titleOptions.subtitle
        ? 100
        : 60
      : 25
    : titleOptions
    ? 40
    : 0;
  const marginBottom = useAxis ? 8 : 0; // Lebih kecil dari sebelumnya

  // X scale
  let xMin = 0;
  let xMax = d3.max(filteredData, (d) => d.value) as number;
  let majorIncrement = axisScaleOptions?.x?.majorIncrement
    ? Number(axisScaleOptions.x.majorIncrement)
    : undefined;
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

  // Y scale (band)
  const y = d3
    .scaleBand()
    .domain(filteredData.map((d) => d.category))
    .rangeRound([marginTop, height - marginBottom])
    .paddingInner(0.1)
    .paddingOuter(0.02); // Lebih rapat ke tepi

  const format = x.tickFormat(20, "%");

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

  // Bars
  svg
    .append("g")
    .attr("fill", (d, i) =>
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[i % chartColors.length]
        : barColor
    )
    .selectAll("rect")
    .data(filteredData)
    .join("rect")
    .attr("x", x(xMin))
    .attr("y", (d) => y(d.category) ?? 0)
    .attr("width", (d) => x(d.value) - x(xMin))
    .attr("height", y.bandwidth());

  // Axis
  if (useAxis) {
    // Horizontal Bar Chart axis X
    const xAxis = d3.axisTop(x);
    if (majorIncrement && majorIncrement > 0) {
      xAxis.tickValues(getMajorTicks(xMin, xMax, majorIncrement));
    }
    svg
      .append("g")
      .attr("transform", `translate(0,${marginTop})`)
      .call(xAxis)
      .call((g) => g.select(".domain").remove());

    // Horizontal Bar Chart axis Y (categorical)
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).tickFormat((d) => String(d)))
      .call((g) => g.select(".domain").remove());

    // Add X axis label if provided
    if (axisLabels?.x) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", marginTop - 30) // <- label x axis di atas sumbu X
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--foreground))")
        .style("font-size", "14px")
        .text(axisLabels.x);
    }

    // Add Y axis label if provided
    if (axisLabels?.y) {
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y", marginLeft - 40)
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--foreground))")
        .style("font-size", "14px")
        .text(axisLabels.y);
    }
  }

  return svg.node();
};

export const createVerticalStackedBarChart = (
  data: ChartData[],
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
  // Validasi data
  console.log("Creating stacked bar plot with data", data);
  const validData = data.filter(
    (d) =>
      typeof d.category === "string" &&
      typeof d.subcategory === "string" &&
      typeof d.value === "number" &&
      d.value >= 0
  );

  if (validData.length === 0) {
    console.error("No valid data available for the stacked bar chart");
    return null;
  }

  console.log("Creating stacked bar plot with valid data:", validData);

  // Definisi margin
  const marginTop = useAxis ? (titleOptions ? 60 : 30) : titleOptions ? 40 : 0;
  const marginRight = useAxis ? 20 : 0;
  const marginBottom = useAxis ? 100 : 0;
  const marginLeft = useAxis ? 50 : 0;

  // Kategori utama dan subkategori
  const categories = Array.from(new Set(validData.map((d) => d.category)));
  const subcategories = Array.from(
    new Set(validData.map((d) => d.subcategory))
  );

  // Format data untuk stack
  const formattedData: FormattedData[] = categories.map((category) => {
    const entry: FormattedData = { category };
    validData
      .filter((d) => d.category === category)
      .forEach((d) => {
        entry[d.subcategory] = d.value;
      });
    return entry;
  });

  // Membuat stack generator
  const stackGenerator = d3
    .stack<FormattedData>()
    .keys(subcategories as string[]);
  const series = stackGenerator(formattedData);

  // Skala untuk sumbu X dan Y
  const x = d3
    .scaleBand<string>()
    .domain(categories)
    .range([marginLeft, width - marginRight])
    .padding(0.1);

  // Y scale with axis options
  let yMin = 0;
  let yMax = d3.max(series, (s) => d3.max(s, (d) => d[1]))!;
  let majorIncrement = axisScaleOptions?.y?.majorIncrement
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
    .nice()
    .range([height - marginBottom, marginTop]);

  // Warna
  let colorScheme: readonly string[];
  if (subcategories.length <= 3) {
    colorScheme = d3.schemeBlues[3].slice().reverse();
  } else if (subcategories.length <= 9) {
    colorScheme = d3.schemeBlues[subcategories.length].slice().reverse();
  } else {
    colorScheme = d3.schemeBlues[9].slice().reverse();
  }

  const color = d3
    .scaleOrdinal<string>()
    .domain(subcategories)
    .range(chartColors || colorScheme);

  // Membuat elemen SVG
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
    .selectAll("g")
    .data(series)
    .join("g")
    .attr("fill", (d) => color(d.key) || "#ccc")
    .selectAll("rect")
    .data((d) =>
      d.map((item) => ({
        ...item,
        key: d.key,
      }))
    )
    .join("rect")
    .attr("x", (d) => x(String(d.data.category))!)
    .attr("y", (d) => {
      // Clamp bar top to yMin/yMax (visual clip)
      return y(Math.min(Math.max(d[1], yMin), yMax));
    })
    .attr("height", (d) => {
      // Height is from max(0, yMin) to min(d.value, yMax)
      const y0 = Math.min(Math.max(d[0], yMin), yMax);
      const y1 = Math.min(Math.max(d[1], yMin), yMax);
      return Math.max(0, y(y0) - y(y1));
    })
    .attr("width", x.bandwidth())
    .append("title")
    .text((d) => `${d.data.category}, ${d.key}: ${d[1] - d[0]}`);

  // Menambahkan sumbu jika `useAxis` true
  if (useAxis) {
    // Sumbu X
    svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .call((g) => g.select(".domain").remove());

    // Sumbu Y dengan majorIncrement support
    const yAxis = d3.axisLeft(y);
    if (
      majorIncrement &&
      typeof yMin === "number" &&
      typeof yMax === "number" &&
      !isNaN(majorIncrement) &&
      !isNaN(yMin) &&
      !isNaN(yMax)
    ) {
      const ticks = generateAxisTicks(yMin, yMax, majorIncrement);
      if (ticks) yAxis.tickValues(ticks);
    }
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxis)
      .call((g) => g.select(".domain").remove());

    // Menambahkan label sumbu X
    svg
      .append("text")
      .attr("x", (width - marginLeft - marginRight) / 2 + marginLeft)
      .attr("y", height - marginBottom + 40)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(axisLabels?.x || "Category");

    // Menambahkan label sumbu Y
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(marginTop + (height - marginBottom - marginTop) / 2))
      .attr("y", 16)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(axisLabels?.y || "Value");

    // Menambahkan legenda secara horizontal di bawah chart
    const legendGroup = svg
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .attr(
        "transform",
        `translate(${marginLeft}, ${height - marginBottom + 60})`
      );
    const legendItemWidth = 19;
    const legendItemHeight = 19;
    const labelOffset = 5;
    const legendSpacingX = 130;
    const legendSpacingY = 25;
    const legendMaxWidth = width - marginLeft - marginRight;
    const itemsPerRow = Math.floor(legendMaxWidth / legendSpacingX);

    subcategories.forEach((subcategory, index) => {
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
        .attr("fill", color(subcategory));

      // Menambahkan label teks
      legendGroup
        .append("text")
        .attr("x", xOffset + legendItemWidth + labelOffset)
        .attr("y", yOffset + legendItemHeight / 2)
        .attr("dy", "0.35em")
        .text(subcategory);
    });
  }

  return svg.node();
};

/**
 * Fungsi Horizontal Stacked Bar Chart
 *
 * @param data - Array dari objek ChartData
 * @param width - Lebar SVG
 * @param height - Tinggi SVG
 * @param useAxis - Boolean untuk menentukan apakah sumbu akan ditampilkan
 * @returns SVGElement atau null jika data tidak valid
 */
export const createHorizontalStackedBarChart = (
  data: ChartData[],
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
): SVGElement | null => {
  // Validasi data
  const validData = data.filter(
    (d) =>
      typeof d.category === "string" &&
      typeof d.subcategory === "string" &&
      typeof d.value === "number" &&
      d.value >= 0
  );

  if (validData.length === 0) {
    console.error(
      "No valid data available for the horizontal stacked bar chart"
    );
    return null;
  }

  // Definisi margin
  const marginTop = useAxis
    ? titleOptions
      ? 110
      : 30
    : titleOptions
    ? 100
    : 0;
  const marginRight = useAxis ? 20 : 0;
  const marginBottom = useAxis ? 100 : 0;
  const marginLeft = useAxis ? 50 : 0;

  // Kategori utama dan subkategori
  const categories = Array.from(new Set(validData.map((d) => d.category)));
  const subcategories = Array.from(
    new Set(validData.map((d) => d.subcategory))
  );

  // Format data untuk stack
  const formattedData: FormattedData[] = categories.map((category) => {
    const entry: FormattedData = { category };
    validData
      .filter((d) => d.category === category)
      .forEach((d) => {
        entry[d.subcategory] = d.value;
      });
    return entry;
  });

  // Membuat stack generator
  const stackGenerator = d3
    .stack<FormattedData>()
    .keys(subcategories)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);
  const series = stackGenerator(formattedData);

  // Skala untuk sumbu X dan Y
  // X scale with axis options
  let xMin = 0;
  let xMax = d3.max(series, (s) => d3.max(s, (d) => d[1]))!;
  let majorIncrement = axisScaleOptions?.x?.majorIncrement
    ? Number(axisScaleOptions.x.majorIncrement)
    : undefined;
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

  const y = d3
    .scaleBand<string>()
    .domain(categories)
    .range([marginTop, height - marginBottom])
    .padding(0.1);

  // Skala warna dengan d3.schemeBlues
  let colorScheme: readonly string[];
  if (subcategories.length <= 3) {
    colorScheme = d3.schemeBlues[3].slice().reverse();
  } else if (subcategories.length <= 9) {
    colorScheme = d3.schemeBlues[subcategories.length].slice().reverse();
  } else {
    colorScheme = d3.schemeBlues[9].slice().reverse();
  }

  const color = d3
    .scaleOrdinal<string>()
    .domain(subcategories)
    .range(chartColors || colorScheme)
    .unknown("#ccc");

  // Membuat elemen SVG
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

  // Append grup untuk setiap series
  svg
    .append("g")
    .selectAll("g")
    .data(series)
    .join("g")
    .attr("fill", (d) => color(d.key))
    .selectAll("rect")
    .data((d) => d.map((item) => ({ ...item, key: d.key })))
    .join("rect")
    .attr("y", (d) => y(d.data.category)!)
    .attr("x", (d) => x(Math.min(Math.max(d[0], xMin), xMax)))
    .attr("height", y.bandwidth())
    .attr("width", (d) => {
      const x0 = Math.min(Math.max(d[0], xMin), xMax);
      const x1 = Math.min(Math.max(d[1], xMin), xMax);
      return Math.max(0, x(x1) - x(x0));
    })
    .append("title")
    .text((d) => `${d.data.category}, ${d.key}: ${d[1] - d[0]}`);

  // Menambahkan sumbu dan legend jika `useAxis` true
  if (useAxis) {
    // Sumbu X dengan majorIncrement support
    const xAxis = d3.axisTop(x);
    if (
      majorIncrement &&
      typeof xMin === "number" &&
      typeof xMax === "number" &&
      !isNaN(majorIncrement) &&
      !isNaN(xMin) &&
      !isNaN(xMax)
    ) {
      const ticks = generateAxisTicks(xMin, xMax, majorIncrement);
      if (ticks) xAxis.tickValues(ticks);
    }
    svg
      .append("g")
      .attr("transform", `translate(0,${marginTop})`)
      .call(xAxis)
      .call((g) => g.selectAll(".domain").remove());

    // Sumbu Y
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).tickSizeOuter(0))
      .call((g) => g.selectAll(".domain").remove());

    // Menambahkan label sumbu X
    svg
      .append("text")
      .attr("x", (width - marginLeft - marginRight) / 2 + marginLeft)
      .attr("y", marginTop - 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(axisLabels?.x || "Category");

    // Menambahkan label sumbu Y
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(marginTop + (height - marginBottom - marginTop) / 2))
      .attr("y", marginLeft - 40)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(axisLabels?.y || "Value");

    // Menambahkan legenda
    const legendGroup = svg
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .attr(
        "transform",
        `translate(${marginLeft}, ${height - marginBottom + 30})`
      );

    const legendItemWidth = 19;
    const legendItemHeight = 19;
    const labelOffset = 5;
    const legendSpacingX = 130;
    const legendSpacingY = 25;
    const legendMaxWidth = width - marginLeft - marginRight;
    const itemsPerRow = Math.floor(legendMaxWidth / legendSpacingX);

    subcategories.forEach((subcategory, index) => {
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
        .attr("fill", color(subcategory));

      // Menambahkan label teks
      legendGroup
        .append("text")
        .attr("x", xOffset + legendItemWidth + labelOffset)
        .attr("y", yOffset + legendItemHeight / 2)
        .attr("dy", "0.35em")
        .text(subcategory);
    });
  }

  // Mengembalikan elemen SVG
  return svg.node();
};

/**
 * Fungsi Clustered Bar Chart
 *
 * @param data - Array dari objek ChartData
 * @param width - Lebar SVG
 * @param height - Tinggi SVG
 * @param useAxis - Boolean untuk menentukan apakah sumbu akan ditampilkan
 * @returns SVGElement atau null jika data tidak valid
 */

export const createClusteredBarChart = (
  data: ChartData[],
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
): SVGElement | null => {
  // Validasi data
  const validData = data.filter(
    (d) =>
      typeof d.category === "string" &&
      typeof d.subcategory === "string" &&
      typeof d.value === "number" &&
      d.value >= 0
  );

  if (validData.length === 0) {
    console.error("No valid data available for the grouped bar chart");
    return null;
  }

  // Definisi margin
  const marginTop = useAxis ? (titleOptions ? 100 : 20) : titleOptions ? 80 : 0;
  const marginRight = useAxis ? 20 : 0;
  const marginBottom = useAxis ? 100 : 0;
  const marginLeft = useAxis ? 50 : 0;

  // Kategori utama dan subkategori
  const categories = Array.from(new Set(validData.map((d) => d.category)));
  const subcategories = Array.from(
    new Set(validData.map((d) => d.subcategory))
  );

  // Format data untuk grouped bar
  const formattedData: FormattedData[] = categories.map((category) => {
    const entry: FormattedData = { category };
    validData
      .filter((d) => d.category === category)
      .forEach((d) => {
        entry[d.subcategory] = d.value;
      });
    return entry;
  });

  // Skala untuk sumbu X dan Y
  const x0 = d3
    .scaleBand<string>()
    .domain(categories)
    .range([marginLeft, width - marginRight])
    .paddingInner(0.1);

  const x1 = d3
    .scaleBand<string>()
    .domain(subcategories)
    .range([0, x0.bandwidth()])
    .padding(0.05);

  // Y scale with axis options
  let yMin = 0;
  let yMax = d3.max(validData, (d) => d.value)!;
  let majorIncrement = axisScaleOptions?.y?.majorIncrement
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
    .nice()
    .range([height - marginBottom, marginTop]);

  // Skala warna
  let colorScheme: readonly string[];
  if (subcategories.length <= 3) {
    colorScheme = d3.schemeBlues[3];
  } else if (subcategories.length <= 9) {
    colorScheme = d3.schemeBlues[subcategories.length];
  } else {
    colorScheme = d3.schemeBlues[9];
  }

  const color = d3
    .scaleOrdinal<string>()
    .domain(subcategories)
    .range(chartColors || colorScheme)
    .unknown("#ccc");

  // Membuat elemen SVG
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

  // Append grup untuk setiap kategori
  const barGroups = svg
    .append("g")
    .selectAll("g")
    .data(formattedData)
    .join("g")
    .attr("transform", (d) => `translate(${x0(d.category)},0)`);

  barGroups
    .selectAll("rect")
    .data((d) => subcategories.map((key) => ({ key, value: d[key] as number })))
    .join("rect")
    .attr("x", (d) => x1(d.key)!)
    .attr("y", (d) => y(Math.min(d.value, yMax)))
    .attr("height", (d) => y(yMin) - y(Math.min(d.value, yMax)))
    .attr("width", x1.bandwidth())
    .attr("fill", (d) => color(d.key))
    .append("title")
    .text((d) => `${d.key}: ${d.value}`);

  // // Add indicator for bars clipped at yMax
  // barGroups
  //   .selectAll("indicator")
  //   .data((d) => subcategories.map((key) => ({ key, value: d[key] as number })))
  //   .join("path")
  //   .filter((d) => d.value > yMax)
  //   .attr("d", d3.symbol().type(d3.symbolTriangle).size(60))
  //   .attr("fill", "red")
  //   .attr("transform", (d) => {
  //     const xPos = x1(d.key)! + x1.bandwidth() / 2;
  //     const yPos = y(yMax) - 6;
  //     return `translate(${xPos},${yPos})`;
  //   });

  // Menambahkan sumbu dan legend jika `useAxis` true
  if (useAxis) {
    // Sumbu X
    svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x0))
      .call((g) => g.selectAll(".domain").remove());

    // Sumbu Y dengan majorIncrement support
    const yAxis = d3.axisLeft(y);
    if (
      majorIncrement &&
      typeof yMin === "number" &&
      typeof yMax === "number" &&
      !isNaN(majorIncrement) &&
      !isNaN(yMin) &&
      !isNaN(yMax)
    ) {
      const ticks = generateAxisTicks(yMin, yMax, majorIncrement);
      if (ticks) yAxis.tickValues(ticks);
    }
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxis)
      .call((g: any) => g.select(".domain").remove())
      .call((g) =>
        g.selectAll(".tick line").attr("stroke", "hsl(var(--border))")
      )
      .call((g) =>
        g.selectAll("text").attr("fill", "hsl(var(--muted-foreground))")
      );

    // Menambahkan label sumbu X
    svg
      .append("text")
      .attr("x", (width - marginLeft - marginRight) / 2 + marginLeft)
      .attr("y", height - marginBottom + 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(axisLabels?.x || "Category");

    // Menambahkan label sumbu Y
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(marginTop + (height - marginBottom - marginTop) / 2))
      .attr("y", 16)
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--foreground))")
      .style("font-size", "14px")
      .text(axisLabels?.y || "Value");

    // Menambahkan legenda secara horizontal di bawah chart dengan label di samping swatches
    const legendGroup = svg
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .attr(
        "transform",
        `translate(${marginLeft}, ${height - marginBottom + 50})`
      );

    const legendItemWidth = 19;
    const legendItemHeight = 19;
    const labelOffset = 5;
    const legendSpacingX = 130;
    const legendSpacingY = 25;
    const legendMaxWidth = width - marginLeft - marginRight;
    const itemsPerRow = Math.floor(legendMaxWidth / legendSpacingX);

    subcategories.forEach((subcategory, index) => {
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
        .attr("fill", color(subcategory));

      // Menambahkan label teks
      legendGroup
        .append("text")
        .attr("x", xOffset + legendItemWidth + labelOffset)
        .attr("y", yOffset + legendItemHeight / 2)
        .attr("dy", "0.35em")
        .text(subcategory);
    });
  }

  // Mengembalikan elemen SVG
  return svg.node();
};

export const createErrorBarChart = (
  data: { category: string; value: number; error: number }[],
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
  const safeAxisLabels = axisLabels || {};
  console.log("Creating chart with data:", data);

  const marginTop = useAxis ? (titleOptions ? 60 : 30) : titleOptions ? 40 : 0;
  const marginRight = useAxis ? 10 : 0;
  const marginBottom = useAxis ? 30 : 0;
  const marginLeft = useAxis ? 60 : 0;

  // Y scale with axis options
  let yMin = 0;
  let yMax = d3.max(data, (d) => d.value + d.error) as number;
  let majorIncrement = axisScaleOptions?.y?.majorIncrement
    ? Number(axisScaleOptions.y.majorIncrement)
    : undefined;
  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }

  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.category))
    .range([marginLeft, width - marginRight])
    .padding(0.1);

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
    .attr("style", "max-width: 100%; height: auto;");

  // Add title if provided
  if (titleOptions) {
    addChartTitle(svg, titleOptions);
  }

  // Menambahkan error bars
  svg
    .append("g")
    .attr("stroke", "black")
    .selectAll("line")
    .data(data)
    .join("line")
    .attr(
      "x1",
      (d: { category: string; value: number; error: number }) =>
        x(d.category)! + x.bandwidth() / 2
    )
    .attr(
      "x2",
      (d: { category: string; value: number; error: number }) =>
        x(d.category)! + x.bandwidth() / 2
    )
    .attr("y1", (d: { value: number; error: number }) => y(d.value + d.error))
    .attr("y2", (d: { value: number; error: number }) => y(d.value - d.error))
    .attr("stroke-width", 2);

  // Menambahkan titik pada setiap kategori untuk menunjukkan nilai
  if (Array.isArray(chartColors) && chartColors.length > 0) {
    svg
      .append("g")
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr(
        "cx",
        (d: { category: string; value: number }) =>
          x(d.category)! + x.bandwidth() / 2
      )
      .attr("cy", (d: { value: number }) => y(d.value))
      .attr("r", 5)
      .attr("fill", (d, i) => chartColors[i % chartColors.length]);
  } else {
    svg
      .append("g")
      .attr("fill", "steelblue")
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr(
        "cx",
        (d: { category: string; value: number }) =>
          x(d.category)! + x.bandwidth() / 2
      )
      .attr("cy", (d: { value: number }) => y(d.value))
      .attr("r", 5);
  }

  // Menambahkan garis horizontal di ujung atas dan bawah error bar
  svg
    .append("g")
    .attr("stroke", "black")
    .selectAll(".error-cap-top")
    .data(data)
    .join("line")
    .attr(
      "x1",
      (d: { category: string; value: number; error: number }) =>
        x(d.category)! + x.bandwidth() / 2 - 5
    )
    .attr(
      "x2",
      (d: { category: string; value: number; error: number }) =>
        x(d.category)! + x.bandwidth() / 2 + 5
    )
    .attr("y1", (d: { value: number; error: number }) => y(d.value + d.error))
    .attr("y2", (d: { value: number; error: number }) => y(d.value + d.error))
    .attr("stroke-width", 2);

  svg
    .append("g")
    .attr("stroke", "black")
    .selectAll(".error-cap-bottom")
    .data(data)
    .join("line")
    .attr(
      "x1",
      (d: { category: string; value: number; error: number }) =>
        x(d.category)! + x.bandwidth() / 2 - 5
    )
    .attr(
      "x2",
      (d: { category: string; value: number; error: number }) =>
        x(d.category)! + x.bandwidth() / 2 + 5
    )
    .attr("y1", (d: { value: number; error: number }) => y(d.value - d.error))
    .attr("y2", (d: { value: number; error: number }) => y(d.value - d.error))
    .attr("stroke-width", 2);

  // Jika axis digunakan, tambahkan sumbu X dan Y
  if (useAxis) {
    // X-Axis (Horizontal)
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - marginBottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .call((g) =>
        g.selectAll(".domain, .tick line").attr("stroke", "hsl(var(--border))")
      )
      .call((g) =>
        g.selectAll("text").attr("fill", "hsl(var(--muted-foreground))")
      );

    // Y-Axis (Vertical) dengan majorIncrement support
    const yAxis = d3.axisLeft(y).tickFormat((y) => (+y * 1).toFixed(0));
    if (majorIncrement && majorIncrement > 0) {
      yAxis.tickValues(getMajorTicks(yMin, yMax, majorIncrement));
    }
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft}, 0)`)
      .call(yAxis)
      .call((g: any) => g.select(".domain").remove())
      .call((g) =>
        g.selectAll(".tick line").attr("stroke", "hsl(var(--border))")
      )
      .call((g) =>
        g.selectAll("text").attr("fill", "hsl(var(--muted-foreground))")
      );

    // Tambahkan label sumbu X di bawah axis
    svg
      .append("text")
      .attr("x", (width + marginLeft - marginRight) / 2)
      .attr("y", height - marginBottom + 35)
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--foreground))")
      .style("font-size", "14px")
      .text(safeAxisLabels.x || (axisLabels && axisLabels.x) || "Category");

    // Tambahkan label sumbu Y di samping kiri axis
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(height + marginTop - marginBottom) / 2)
      .attr("y", marginLeft - 30)
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--foreground))")
      .style("font-size", "14px")
      .text(safeAxisLabels.y || (axisLabels && axisLabels.y) || "Value");
  }

  return svg.node();
};

export const createClusteredErrorBarChart = (
  data: {
    category: string;
    subcategory: string;
    value: number;
    error: number;
  }[],
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
  const safeAxisLabels = axisLabels || {};
  // Margin dinamis
  const marginTop = useAxis ? (titleOptions ? 60 : 30) : titleOptions ? 40 : 0;
  const marginRight = useAxis ? 30 : 0;
  const marginBottom = useAxis ? (axisLabels?.x ? 30 : 30) : 0;
  const marginLeft = useAxis ? (axisLabels?.y ? 60 : 30) : 0;

  const categories = Array.from(new Set(data.map((d) => d.category)));
  const subcategories = Array.from(new Set(data.map((d) => d.subcategory)));

  // Skala warna
  let colorScheme: readonly string[];
  if (chartColors && chartColors.length > 0) {
    colorScheme = chartColors;
  } else if (subcategories.length <= 10) {
    colorScheme = d3.schemeCategory10;
  } else {
    colorScheme = d3.schemeCategory10;
  }
  const colorScale = d3
    .scaleOrdinal<string>()
    .domain(subcategories)
    .range(colorScheme);

  // Skala X
  const x = d3
    .scaleBand()
    .domain(categories)
    .range([marginLeft, width - marginRight])
    .padding(0.1);

  // Skala Y dengan axisScaleOptions
  let yMin = 0;
  let yMax = d3.max(data, (d) => d.value + d.error) as number;
  let majorIncrement = axisScaleOptions?.y?.majorIncrement
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
    .attr("style", "max-width: 100%; height: auto;");

  // Tambahkan judul/subjudul jika ada
  if (titleOptions) {
    addChartTitle(svg, titleOptions);
  }

  // Helper clamp
  function clampY(val: number) {
    return Math.max(yMin, Math.min(yMax, val));
  }

  // Error bars (clamped)
  svg
    .append("g")
    .attr("stroke", "black")
    .selectAll("line")
    .data(data)
    .join("line")
    .attr("x1", (d) => x(d.category)! + x.bandwidth() / 2)
    .attr("x2", (d) => x(d.category)! + x.bandwidth() / 2)
    .attr("y1", (d) => y(clampY(d.value + d.error)))
    .attr("y2", (d) => y(clampY(d.value - d.error)))
    .attr("stroke-width", 2)
    .attr("stroke", (d) => colorScale(d.subcategory));

  // Titik nilai (hanya jika di dalam range)
  svg
    .append("g")
    .selectAll("circle")
    .data(data.filter((d) => d.value >= yMin && d.value <= yMax))
    .join("circle")
    .attr("cx", (d) => x(d.category)! + x.bandwidth() / 2)
    .attr("cy", (d) => y(d.value))
    .attr("r", 5)
    .attr("fill", (d) => colorScale(d.subcategory));

  // Error bar caps (clamped)
  svg
    .append("g")
    .attr("stroke", "black")
    .selectAll(".error-cap-top")
    .data(data)
    .join("line")
    .attr("x1", (d) => x(d.category)! + x.bandwidth() / 2 - 5)
    .attr("x2", (d) => x(d.category)! + x.bandwidth() / 2 + 5)
    .attr("y1", (d) => y(clampY(d.value + d.error)))
    .attr("y2", (d) => y(clampY(d.value + d.error)))
    .attr("stroke-width", 2)
    .attr("stroke", (d) => colorScale(d.subcategory));

  svg
    .append("g")
    .attr("stroke", "black")
    .selectAll(".error-cap-bottom")
    .data(data)
    .join("line")
    .attr("x1", (d) => x(d.category)! + x.bandwidth() / 2 - 5)
    .attr("x2", (d) => x(d.category)! + x.bandwidth() / 2 + 5)
    .attr("y1", (d) => y(clampY(d.value - d.error)))
    .attr("y2", (d) => y(clampY(d.value - d.error)))
    .attr("stroke-width", 2)
    .attr("stroke", (d) => colorScale(d.subcategory));

  // Sumbu X dan Y
  if (useAxis) {
    // X-Axis
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - marginBottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .call((g) =>
        g.selectAll(".domain, .tick line").attr("stroke", "hsl(var(--border))")
      )
      .call((g) =>
        g.selectAll("text").attr("fill", "hsl(var(--muted-foreground))")
      );
    // Label X
    if (axisLabels?.x) {
      svg
        .append("text")
        .attr("x", marginLeft + width / 2)
        .attr("y", marginTop + height + marginBottom)
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--foreground))")
        .style("font-size", "14px")
        .text(axisLabels.x);
    }
    // Y-Axis
    const yAxis = d3.axisLeft(y).tickFormat((y) => (+y * 1).toFixed(2));
    if (majorIncrement && majorIncrement > 0) {
      const ticks = [];
      for (let v = yMin; v <= yMax; v += majorIncrement) {
        ticks.push(v);
      }
      yAxis.tickValues(ticks);
    }
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft}, 0)`)
      .call(yAxis)
      .call((g: any) => g.select(".domain").remove())
      .call((g) =>
        g.selectAll(".tick line").attr("stroke", "hsl(var(--border))")
      )
      .call((g) =>
        g.selectAll("text").attr("fill", "hsl(var(--muted-foreground))")
      );
    // Label Y
    if (axisLabels?.y) {
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(marginTop + height / 2))
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--foreground))")
        .style("font-size", "14px")
        .text(axisLabels.y);
    }
  }

  // Dynamic Legend
  const legendGroup = svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "start")
    .attr(
      "transform",
      `translate(${marginLeft}, ${height - marginBottom + 60})`
    );

  const legendItemWidth = 19;
  const legendItemHeight = 19;
  const labelOffset = 5;
  const legendSpacingX = 100;
  const legendSpacingY = 25;
  const legendMaxWidth = width - marginLeft - marginRight;
  const itemsPerRow = Math.floor(legendMaxWidth / legendSpacingX);

  subcategories.forEach((subcategory, index) => {
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

    // Menambahkan label teks
    legendGroup
      .append("text")
      .attr("x", xOffset + legendItemWidth + labelOffset)
      .attr("y", yOffset + legendItemHeight / 2)
      .attr("dy", "0.35em")
      .text(subcategory);
  });

  return svg.node();
};

export const create3DBarChart2 = (
  data: { x: number; y: number; z: number }[],
  width: number,
  height: number
) => {
  console.log("create 3d bar chart with data", data);

  const container = document.createElement("div");
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.position = "relative";
  container.style.overflow = "hidden";

  const scene = new THREE.Scene();

  // scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(20, 20, 30);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  scene.background = null;

  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(10, 20, 30);
  scene.add(pointLight);

  // Menentukan rentang data
  const xExtent = d3.extent(data, (d) => d.x)!;
  const yExtent = d3.extent(data, (d) => d.y)!;
  const zExtent = d3.extent(data, (d) => d.z)!;

  const xMax = Math.max(Math.abs(xExtent[0]!), Math.abs(xExtent[1]!));
  const yMax = Math.max(Math.abs(yExtent[0]!), Math.abs(yExtent[1]!));
  const zMax = Math.max(Math.abs(zExtent[0]!), Math.abs(zExtent[1]!));

  console.log("xMax", xMax);
  console.log("yMax", yMax);
  console.log("zMax", zMax);

  // Menentukan rentang koordinat
  const gridSizeX = 2 * xMax;
  const gridSizeZ = 2 * zMax;
  const gridSize = Math.max(gridSizeX, gridSizeZ);
  console.log("gridSize", gridSize);

  // Membuat GridHelper
  const gridHelper = new THREE.GridHelper(gridSize + 3, gridSize + 3);
  scene.add(gridHelper);

  const createAxisLine = (
    start: THREE.Vector3,
    end: THREE.Vector3,
    color: number
  ) => {
    const material = new THREE.LineDashedMaterial({
      color: color,
      dashSize: 1,
      gapSize: 0.5,
    });

    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();

    return line;
  };

  // Garis Sumbu X (Merah)
  scene.add(
    createAxisLine(
      new THREE.Vector3(-gridSize, 0, 0),
      new THREE.Vector3(gridSize, 0, 0),
      0xff0000
    )
  );

  // Garis Sumbu Y (Hijau)
  scene.add(
    createAxisLine(
      new THREE.Vector3(0, -gridSize, 0),
      new THREE.Vector3(0, gridSize, 0),
      0x00ff00
    )
  );

  // Garis Sumbu Z (Biru)
  scene.add(
    createAxisLine(
      new THREE.Vector3(0, 0, -gridSize),
      new THREE.Vector3(0, 0, gridSize),
      0x0000ff
    )
  );

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Skala yang disesuaikan
  const xScale = d3.scaleLinear().domain([-xMax, xMax]).range([-xMax, xMax]);

  const zScale = d3.scaleLinear().domain([-zMax, zMax]).range([-zMax, zMax]);

  const yScale = d3.scaleLinear().domain([-yMax, yMax]).range([-yMax, yMax]);

  // Fungsi untuk menambahkan teks label
  const addLabel = (text: string, position: THREE.Vector3) => {
    const loader = new FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        const textGeometry = new TextGeometry(text, {
          font: font,
          size: 0.5,
          depth: 0.05,
        });
        textGeometry.computeBoundingBox();
        textGeometry.center();

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        textMesh.position.set(position.x, position.y, position.z);
        scene.add(textMesh);
      }
    );
  };

  data.forEach((d) => {
    const geometry = new THREE.BoxGeometry(0.8, yScale(d.y), 0.8);
    const material = new THREE.MeshStandardMaterial({
      color: 0x007bff,
      metalness: 0.3,
      roughness: 0.7,
    });
    const bar = new THREE.Mesh(geometry, material);

    bar.position.set(xScale(d.x)!, yScale(d.y) / 2, zScale(d.z)!);
    scene.add(bar);

    addLabel(
      d.y.toString(),
      new THREE.Vector3(
        xScale(d.x),
        yScale(d.y) + (yScale(d.y) >= 0 ? 1 : -1),
        zScale(d.z)
      )
    );
  });

  addLabel("X", new THREE.Vector3(gridSize / 2 + 3, 0, 0));
  addLabel("Y", new THREE.Vector3(0, gridSize / 2 + 3, 0));
  addLabel("Z", new THREE.Vector3(0, 0, gridSize / 2 + 3));

  // Menambahkan koordinat sepanjang setiap sumbu
  // const step = 2; // Langkah interval untuk koordinat
  // for (let i = 0; i <= zMax; i += step) {
  //   addLabel(i.toString(), new THREE.Vector3(i, 0, gridSize / 2 + 1)); // X-axis ticks
  //   addLabel((-i).toString(), new THREE.Vector3(-i, 0, gridSize / 2 + 1)); // Negative X-axis ticks
  // }

  // for (let i = 0; i <= xMax; i += step) {
  //   addLabel(i.toString(), new THREE.Vector3(gridSize / 2 + 1, 0, i)); // Y-axis ticks
  //   addLabel((-i).toString(), new THREE.Vector3(gridSize / 2 + 1, 0, -i)); // Negative Y-axis ticks
  // }

  // for (let i = 0; i <= yMax; i += step) {
  //   addLabel(i.toString(), new THREE.Vector3(0, i, 0)); // Z-axis ticks
  //   addLabel((-i).toString(), new THREE.Vector3(0, -i, 0)); // Negative Z-axis ticks
  // }

  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  return container;
};

export const create3DScatterPlot = (
  data: { x: number; y: number; z: number }[],
  width: number,
  height: number
) => {
  console.log("create 3d scatter plot with data", data);
  // Fungsi untuk menambahkan teks label
  const addLabel = (text: string, position: THREE.Vector3) => {
    const loader = new FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        const textGeometry = new TextGeometry(text, {
          font: font,
          size: 0.5,
          depth: 0.05,
        });
        textGeometry.computeBoundingBox();
        textGeometry.center();

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        textMesh.position.set(position.x, position.y, position.z);
        scene.add(textMesh);
      }
    );
  };

  const container = document.createElement("div");
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.position = "relative";
  container.style.overflow = "hidden";

  const scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(20, 20, 30);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  scene.background = null;
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(10, 20, 30);
  scene.add(pointLight);

  // Menentukan rentang data
  const xExtent = d3.extent(data, (d) => d.x)!;
  const yExtent = d3.extent(data, (d) => d.y)!;
  const zExtent = d3.extent(data, (d) => d.z)!;

  const xMax = Math.max(Math.abs(xExtent[0]!), Math.abs(xExtent[1]!));
  const yMax = Math.max(Math.abs(yExtent[0]!), Math.abs(yExtent[1]!));
  const zMax = Math.max(Math.abs(zExtent[0]!), Math.abs(zExtent[1]!));

  console.log("xMax", xMax);
  console.log("yMax", yMax);
  console.log("zMax", zMax);

  // Menentukan rentang koordinat
  const gridSizeX = 2 * xMax;
  const gridSizeZ = 2 * zMax;
  const gridSize = Math.max(gridSizeX, gridSizeZ);
  console.log("gridSize", gridSize);

  // Membuat GridHelper
  const gridHelper = new THREE.GridHelper(gridSize + 3, gridSize + 3);
  scene.add(gridHelper);

  const createAxisLine = (
    start: THREE.Vector3,
    end: THREE.Vector3,
    color: number
  ) => {
    const material = new THREE.LineDashedMaterial({
      color: color,
      dashSize: 1,
      gapSize: 0.5,
    });

    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();

    return line;
  };

  //Garis Sumbu X (Merah)
  scene.add(
    createAxisLine(
      new THREE.Vector3(-gridSize, 0, 0),
      new THREE.Vector3(gridSize, 0, 0),
      0xff0000
    )
  );

  // Garis Sumbu Y (Hijau)
  scene.add(
    createAxisLine(
      new THREE.Vector3(0, -gridSize, 0),
      new THREE.Vector3(0, gridSize, 0),
      0x00ff00
    )
  );

  // Garis Sumbu Z (Biru)
  scene.add(
    createAxisLine(
      new THREE.Vector3(0, 0, -gridSize),
      new THREE.Vector3(0, 0, gridSize),
      0x0000ff
    )
  );

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Skala yang disesuaikan agar sesuai dengan rentang grid
  const xScale = d3.scaleLinear().domain([-xMax, xMax]).range([-xMax, xMax]);

  const yScale = d3.scaleLinear().domain([-yMax, yMax]).range([-yMax, yMax]);

  const zScale = d3.scaleLinear().domain([-zMax, zMax]).range([-zMax, zMax]);

  // Menambahkan titik-titik (scatter) pada plot 3D
  data.forEach((d) => {
    const geometry = new THREE.SphereGeometry(0.5, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0x007bff,
      metalness: 0.3,
      roughness: 0.7,
    });
    const point = new THREE.Mesh(geometry, material);

    // Posisi titik berdasarkan data dan skala
    point.position.set(xScale(d.x)!, yScale(d.y), zScale(d.z)!);
    scene.add(point);

    addLabel(
      ` ${d.y}`,
      new THREE.Vector3(
        xScale(d.x),
        yScale(d.y) + (yScale(d.y) >= 0 ? 1 : -1),
        zScale(d.z)
      )
    );
  });

  // Menambahkan label untuk sumbu
  addLabel("X", new THREE.Vector3(gridSize / 2 + 3, 0, 0));
  addLabel("Y", new THREE.Vector3(0, gridSize / 2 + 3, 0));
  addLabel("Z", new THREE.Vector3(0, 0, gridSize / 2 + 3));

  // Menambahkan koordinat sepanjang setiap sumbu
  // const step = 2;
  // for (let i = 0; i <= xMax; i += step) {
  //   addLabel(i.toString(), new THREE.Vector3(i, 0, gridSize / 2 + 1));
  //   addLabel((-i).toString(), new THREE.Vector3(-i, 0, gridSize / 2 + 1));
  // }

  // for (let i = 0; i <= yMax; i += step) {
  //   addLabel(i.toString(), new THREE.Vector3(gridSize / 2 + 1, 0, i));
  //   addLabel((-i).toString(), new THREE.Vector3(gridSize / 2 + 1, 0, -i));
  // }

  // for (let i = 0; i <= zMax; i += step) {
  //   addLabel(i.toString(), new THREE.Vector3(0, i, gridSize / 2 + 1));
  //   addLabel((-i).toString(), new THREE.Vector3(0, -i, gridSize / 2 + 1));
  // }

  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  return container;
};

export const createGrouped3DScatterPlot = (
  data: { x: number; y: number; z: number; category: string }[],
  width: number,
  height: number
) => {
  console.log("create 3d grouped scatter with data", data);

  const container = document.createElement("div");
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.position = "relative";
  container.style.overflow = "hidden";

  const scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(20, 20, 30);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  scene.background = null;
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(10, 20, 30);
  scene.add(pointLight);

  // Dapatkan kategori unik
  const uniqueCategories = Array.from(new Set(data.map((d) => d.category)));

  // Skema warna kategori
  const colorScale = d3
    .scaleOrdinal(d3.schemeCategory10)
    .domain(uniqueCategories);

  // Menentukan rentang data
  const xExtent = d3.extent(data, (d) => d.x)!;
  const yExtent = d3.extent(data, (d) => d.y)!;
  const zExtent = d3.extent(data, (d) => d.z)!;

  const xMax = Math.max(Math.abs(xExtent[0]!), Math.abs(xExtent[1]!));
  const yMax = Math.max(Math.abs(yExtent[0]!), Math.abs(yExtent[1]!));
  const zMax = Math.max(Math.abs(zExtent[0]!), Math.abs(zExtent[1]!));

  const gridSizeX = 2 * xMax;
  const gridSizeZ = 2 * zMax;
  const gridSize = Math.max(gridSizeX, gridSizeZ);

  // Membuat GridHelper
  const gridHelper = new THREE.GridHelper(gridSize + 3, gridSize + 3);
  scene.add(gridHelper);

  const createAxisLine = (
    start: THREE.Vector3,
    end: THREE.Vector3,
    color: number
  ) => {
    const material = new THREE.LineDashedMaterial({
      color: color,
      dashSize: 1,
      gapSize: 0.5,
    });

    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();

    return line;
  };

  // Garis sumbu
  scene.add(
    createAxisLine(
      new THREE.Vector3(-gridSize, 0, 0),
      new THREE.Vector3(gridSize, 0, 0),
      0xff0000
    )
  );
  scene.add(
    createAxisLine(
      new THREE.Vector3(0, -gridSize, 0),
      new THREE.Vector3(0, gridSize, 0),
      0x00ff00
    )
  );
  scene.add(
    createAxisLine(
      new THREE.Vector3(0, 0, -gridSize),
      new THREE.Vector3(0, 0, gridSize),
      0x0000ff
    )
  );

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Skala data
  const xScale = d3.scaleLinear().domain([-xMax, xMax]).range([-xMax, xMax]);
  const yScale = d3.scaleLinear().domain([-yMax, yMax]).range([-yMax, yMax]);
  const zScale = d3.scaleLinear().domain([-zMax, zMax]).range([-zMax, zMax]);

  // Fungsi menambahkan label teks
  const addLabel = (text: string, position: THREE.Vector3) => {
    const loader = new FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        const textGeometry = new TextGeometry(text, {
          font: font,
          size: 0.5,
          depth: 0.05,
        });
        textGeometry.computeBoundingBox();
        textGeometry.center();

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(position.x, position.y, position.z);
        scene.add(textMesh);
      }
    );
  };

  // Menambahkan titik berdasarkan kategori
  // Hitung jumlah titik di setiap posisi (x, z)
  const pointMap = new Map<string, number>();
  data.forEach((d) => {
    const key = `${d.x},${d.y},${d.z}`;
    pointMap.set(key, (pointMap.get(key) || 0) + 1);
  });

  // Skala ukuran titik berdasarkan jumlah titik di satu koordinat (x, z)
  const sizeScale = d3.scaleLinear().domain([1, 5]).range([0.5, 0.2]);

  const groupedData = d3.group(data, (d) => `${d.x},${d.y},${d.z}`);

  groupedData.forEach((group, key) => {
    const numPoints = group.length;
    const baseSize = sizeScale(Math.min(numPoints, 5));

    group.forEach((d, index) => {
      const size = baseSize;
      const color = new THREE.Color(colorScale(d.category) as string);
      const geometry = new THREE.SphereGeometry(size, 8, 8);
      const material = new THREE.MeshStandardMaterial({
        color: color,
        // transparent: true,
        // opacity: 0.8,
        metalness: 0.3,
        roughness: 0.7,
      });

      const point = new THREE.Mesh(geometry, material);

      // Offset posisi
      const xOffset = (index - (numPoints - 1) / 2) * (size * 0.8);
      const zOffset = (index % 2 === 0 ? 1 : -1) * (size * 0.8);

      const xPos = xScale(d.x)! + xOffset;
      const yPos = yScale(d.y);
      const zPos = zScale(d.z)! + zOffset;

      point.position.set(xPos, yPos, zPos);
      scene.add(point);
    });
  });

  // Menambahkan label untuk sumbu
  addLabel("X", new THREE.Vector3(gridSize / 2 + 3, 0, 0));
  addLabel("Y", new THREE.Vector3(0, gridSize / 2 + 3, 0));
  addLabel("Z", new THREE.Vector3(0, 0, gridSize / 2 + 3));

  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  return container;
};

export const createClustered3DBarChart = (
  data: { x: number; z: number; y: number; category: string }[],
  width: number,
  height: number
) => {
  console.log("create clustered 3d bar chart with data", data);
  // Fungsi untuk menambahkan teks label
  const addLabel = (text: string, position: THREE.Vector3) => {
    const loader = new FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        const textGeometry = new TextGeometry(text, {
          font: font,
          size: 1,
          depth: 0.1,
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(position.x, position.y, position.z);
        scene.add(textMesh);
      }
    );
  };

  const container = document.createElement("div");
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.position = "relative";
  container.style.overflow = "hidden";

  const scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(20, 20, 30);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  scene.background = null;
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(10, 20, 30);
  scene.add(pointLight);

  // Menentukan rentang koordinat
  const xExtent = d3.extent(data, (d) => d.x) as [number, number];
  const yExtent = d3.extent(data, (d) => d.y) as [number, number];
  const zExtent = d3.extent(data, (d) => d.z) as [number, number];

  const xMax = Math.max(Math.abs(xExtent[0]), Math.abs(xExtent[1]));
  const yMax = Math.max(Math.abs(yExtent[0]), Math.abs(yExtent[1]));
  const zMax = Math.max(Math.abs(zExtent[0]), Math.abs(zExtent[1]));

  const gridSize = Math.max(2 * xMax, 2 * zMax);

  // Membuat GridHelper
  const gridHelper = new THREE.GridHelper(gridSize + 3, gridSize + 3);
  scene.add(gridHelper);

  const createAxisLine = (
    start: THREE.Vector3,
    end: THREE.Vector3,
    color: number
  ) => {
    const material = new THREE.LineDashedMaterial({
      color: color,
      dashSize: 1,
      gapSize: 0.5,
    });

    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();

    return line;
  };

  //Garis Sumbu X (Merah)
  scene.add(
    createAxisLine(
      new THREE.Vector3(-gridSize, 0, 0),
      new THREE.Vector3(gridSize, 0, 0),
      0xff0000
    )
  );

  // Garis Sumbu Y (Hijau)
  scene.add(
    createAxisLine(
      new THREE.Vector3(0, -gridSize, 0),
      new THREE.Vector3(0, gridSize, 0),
      0x00ff00
    )
  );

  // Garis Sumbu Z (Biru)
  scene.add(
    createAxisLine(
      new THREE.Vector3(0, 0, -gridSize),
      new THREE.Vector3(0, 0, gridSize),
      0x0000ff
    )
  );

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Skala koordinat
  const xScale = d3.scaleLinear().domain([-xMax, xMax]).range([-xMax, xMax]);
  const yScale = d3.scaleLinear().domain([0, yMax]).range([0, yMax]);
  const zScale = d3.scaleLinear().domain([-zMax, zMax]).range([-zMax, zMax]);

  // Kelompokkan berdasarkan koordinat (x, z)
  const groupedData = d3.group(data, (d) => `${d.x},${d.z}`);

  const colors = d3.scaleOrdinal(d3.schemeCategory10);

  groupedData.forEach((group, key) => {
    const numBars = group.length;

    const barSpacing = 0.005; // Jarak antar batang dalam cluster
    const maxBarWidth = 0.95 - barSpacing * (numBars - 1);
    const barWidth = Math.min(0.95, maxBarWidth / numBars);

    group.forEach((d, index) => {
      const geometry = new THREE.BoxGeometry(barWidth, yScale(d.y), 0.95);
      const material = new THREE.MeshStandardMaterial({
        color: colors(d.category),
        metalness: 0.3,
        roughness: 0.7,
      });
      const bar = new THREE.Mesh(geometry, material);

      // Hitung posisi X agar sejajar dalam satu garis horizontal
      const xOffset = (index - (numBars - 1) / 2) * (barWidth + barSpacing);
      const xPos = xScale(d.x) + xOffset;
      const yPos = yScale(d.y) / 2;
      const zPos = zScale(d.z);

      bar.position.set(xPos, yPos, zPos);
      scene.add(bar);
    });
  });

  // Menambahkan label untuk sumbu
  addLabel("X", new THREE.Vector3(gridSize / 2 + 3, 0, 0));
  addLabel("Y", new THREE.Vector3(0, gridSize / 2 + 3, 0));
  addLabel("Z", new THREE.Vector3(0, 0, gridSize / 2 + 3));

  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  return container;
};

export const createStacked3DBarChart = (
  data: { x: number; z: number; y: number; category: string }[],
  width: number,
  height: number
) => {
  console.log("create stacked 3d bar chart with data", data);
  // Fungsi untuk menambahkan teks label
  const addLabel = (text: string, position: THREE.Vector3) => {
    const loader = new FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        const textGeometry = new TextGeometry(text, {
          font: font,
          size: 0.5,
          depth: 0.05,
        });
        textGeometry.computeBoundingBox();
        textGeometry.center();
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        textMesh.position.set(position.x, position.y, position.z);
        scene.add(textMesh);
      }
    );
  };

  const container = document.createElement("div");
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.position = "relative";
  container.style.overflow = "hidden";

  const scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(20, 20, 30);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  scene.background = null;
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(10, 20, 30);
  scene.add(pointLight);

  // Menentukan rentang koordinat
  const xExtent = d3.extent(data, (d) => d.x) as [number, number];
  const yExtent = d3.extent(data, (d) => d.y) as [number, number];
  const zExtent = d3.extent(data, (d) => d.z) as [number, number];

  const xMax = Math.max(Math.abs(xExtent[0]), Math.abs(xExtent[1]));
  const yMax = Math.max(Math.abs(yExtent[0]), Math.abs(yExtent[1]));
  const zMax = Math.max(Math.abs(zExtent[0]), Math.abs(zExtent[1]));

  const gridSize = Math.max(2 * xMax, 2 * zMax);

  // Membuat GridHelper
  const gridHelper = new THREE.GridHelper(gridSize + 3, gridSize + 3);
  scene.add(gridHelper);

  const createAxisLine = (
    start: THREE.Vector3,
    end: THREE.Vector3,
    color: number
  ) => {
    const material = new THREE.LineDashedMaterial({
      color: color,
      dashSize: 1,
      gapSize: 0.5,
    });

    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();

    return line;
  };

  //Garis Sumbu X (Merah)
  scene.add(
    createAxisLine(
      new THREE.Vector3(-gridSize, 0, 0),
      new THREE.Vector3(gridSize, 0, 0),
      0xff0000
    )
  );

  // Garis Sumbu Y (Hijau)
  scene.add(
    createAxisLine(
      new THREE.Vector3(0, -gridSize, 0),
      new THREE.Vector3(0, gridSize, 0),
      0x00ff00
    )
  );

  // Garis Sumbu Z (Biru)
  scene.add(
    createAxisLine(
      new THREE.Vector3(0, 0, -gridSize),
      new THREE.Vector3(0, 0, gridSize),
      0x0000ff
    )
  );

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Skala koordinat
  const xScale = d3.scaleLinear().domain([-xMax, xMax]).range([-xMax, xMax]);
  const yScale = d3.scaleLinear().domain([0, yMax]).range([0, yMax]);
  const zScale = d3.scaleLinear().domain([-zMax, zMax]).range([-zMax, zMax]);

  // Kelompokkan berdasarkan koordinat (x, z)
  const groupedData = d3.group(data, (d) => `${d.x},${d.z}`);

  const colors = d3.scaleOrdinal(d3.schemeCategory10);

  groupedData.forEach((group, key) => {
    let accumulatedHeight = 0;
    let totalHeight = d3.sum(group, (d) => yScale(d.y));

    group.forEach((d) => {
      const barWidth = 1;
      const barHeight = yScale(d.y);

      const geometry = new THREE.BoxGeometry(barWidth, barHeight, barWidth);
      const material = new THREE.MeshStandardMaterial({
        color: colors(d.category),
        metalness: 0.3,
        roughness: 0.7,
      });
      const bar = new THREE.Mesh(geometry, material);

      const xPos = xScale(d.x);
      const yPos = accumulatedHeight + barHeight / 2;
      const zPos = zScale(d.z);

      bar.position.set(xPos, yPos, zPos);
      scene.add(bar);

      accumulatedHeight += barHeight;
    });

    // Tambahkan label total tinggi di atas batang terakhir
    addLabel(
      totalHeight.toFixed(1),
      new THREE.Vector3(
        xScale(group[0].x),
        totalHeight + 0.5,
        zScale(group[0].z)
      )
    );
  });

  // Menambahkan label untuk sumbu
  addLabel("X", new THREE.Vector3(gridSize / 2 + 3, 0, 0));
  addLabel("Y", new THREE.Vector3(0, gridSize / 2 + 3, 0));
  addLabel("Z", new THREE.Vector3(0, 0, gridSize / 2 + 3));

  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  return container;
};

type ChartData2 = {
  category: string;
  bars: { [seriesName: string]: number };
  lines: { [seriesName: string]: number };
};

export const createBarAndLineChart2 = (
  data: ChartData2[],
  width: number,
  height: number,
  useAxis: boolean = true,
  barMode: "grouped" | "stacked" = "grouped"
) => {
  const marginTop = useAxis ? 30 : 0;
  const marginRight = useAxis ? 30 : 0;
  const marginBottom = useAxis ? 30 : 0;
  const marginLeft = useAxis ? 40 : 0;

  const barKeys = Object.keys(data[0].bars);
  const lineKeys = Object.keys(data[0].lines);

  const allBarValues = data.flatMap((d) => Object.values(d.bars));
  const allLineValues = data.flatMap((d) => Object.values(d.lines));

  let stackedBarSums: number[] = [];
  if (barMode === "stacked") {
    stackedBarSums = data.map((d) => d3.sum(Object.values(d.bars)));
  }

  const allValues =
    barMode === "stacked"
      ? [...stackedBarSums, ...allLineValues]
      : [...allBarValues, ...allLineValues];

  const minY = Math.min(0, ...allValues);
  const maxY = Math.max(...allValues);

  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.category))
    .range([marginLeft, width - marginRight])
    .padding(0.1);

  const y = d3
    .scaleLinear()
    .domain([minY, maxY])
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
    .attr("style", "max-width: 100%; height: auto;");

  const colorBar = d3
    .scaleOrdinal<string>()
    .domain(barKeys)
    .range(d3.schemeCategory10);

  if (barMode === "grouped") {
    const x1 = d3
      .scaleBand()
      .domain(barKeys)
      .range([0, x.bandwidth()])
      .padding(0.05);

    svg
      .append("g")
      .selectAll("g")
      .data(data)
      .join("g")
      .attr("transform", (d) => `translate(${x(d.category)},0)`)
      .selectAll("rect")
      .data((d) => barKeys.map((key) => ({ key, value: d.bars[key] })))
      .join("rect")
      .attr("x", (d) => x1(d.key)!)
      .attr("y", (d) => (d.value >= 0 ? y(d.value) : y(0)))
      .attr("width", x1.bandwidth())
      .attr("height", (d) => Math.abs(y(d.value) - y(0)))
      .attr("fill", (d) => colorBar(d.key)!)
      .attr("opacity", 0.7);
  } else {
    const stack = d3
      .stack<ChartData2>()
      .keys(barKeys)
      .value((d, key) => d.bars[key]);

    const series = stack(data);

    svg
      .append("g")
      .selectAll("g")
      .data(series)
      .join("g")
      .attr("fill", (d) => colorBar(d.key)!)
      .attr("opacity", 0.7)
      .selectAll("rect")
      .data((d) => d)
      .join("rect")
      .attr("x", (d) => x(d.data.category)!)
      .attr("y", (d) => y(Math.max(d[0], d[1])))
      .attr("height", (d) => Math.abs(y(d[0]) - y(d[1])))

      .attr("width", x.bandwidth());
  }

  const colorLine = d3
    .scaleOrdinal<string>()
    .domain(lineKeys)
    .range(d3.schemeTableau10);

  lineKeys.forEach((key) => {
    const line = d3
      .line<ChartData2>()
      .x((d) => x(d.category)! + x.bandwidth() / 2)
      .y((d) => y(d.lines[key]));

    // Path Line
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", colorLine(key)!)
      .attr("stroke-width", 3)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line);

    // Dots di titik Line
    svg
      .selectAll(`.dot-${key}`)
      .data(data)
      .join("circle")
      .attr("cx", (d) => x(d.category)! + x.bandwidth() / 2)
      .attr("cy", (d) => y(d.lines[key]))
      .attr("r", 3.5)
      .attr("fill", colorLine(key))
      .attr("stroke", "white")
      .attr("stroke-width", 1.5);
  });

  if (useAxis) {
    const maxXTicks = 10;

    svg
      .append("g")
      .attr("transform", `translate(0, ${y(0)})`)
      .call(
        d3
          .axisBottom(x)
          .tickSizeOuter(0)
          .tickValues(
            x
              .domain()
              .filter(
                (d, i) => i % Math.ceil(x.domain().length / maxXTicks) === 0
              )
          )
      );

    svg
      .append("g")
      .attr("transform", `translate(${marginLeft}, 0)`)
      .call(d3.axisLeft(y).tickFormat((v) => (+v).toFixed(2)));
    // .call((g) => g.select(".domain").remove());

    // const y2Axis = svg
    //   .append("g")
    //   .attr("transform", `translate(${width - marginRight}, 0)`)
    //   .call(d3.axisRight(y).tickFormat((v) => (+v).toFixed(2)))
    //   .call((g) => g.select(".domain").remove());

    // y2Axis.selectAll(".tick text").attr("fill", "red");
    // y2Axis.select(".domain").attr("stroke", "red");
  }

  return svg.node();
};

export const createStemAndLeafPlot = (
  data: { [stem: string]: number[] },
  width: number,
  height: number,
  useaxis: boolean = true
) => {
  const margin = useaxis
    ? { top: 40, right: 40, bottom: 50, left: 40 }
    : { top: 20, right: 20, bottom: 20, left: 20 };

  const titleFontSize = useaxis
    ? Math.max(16, Math.min(24, width / 20))
    : Math.max(12, Math.min(16, width / 30));

  const bodyFontSize = useaxis
    ? Math.max(12, Math.min(18, width / 30))
    : Math.max(10, Math.min(14, width / 35));

  const keyFontSize = useaxis ? Math.max(10, Math.min(16, width / 35)) : 0;

  const lineHeight = bodyFontSize + (useaxis ? 12 : 8);
  const startX = margin.left;
  let y = margin.top;

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr(
      "style",
      `max-width: 100%; height: auto; font-family: 'Courier New', monospace;`
    );

  const sortedKeys = Object.keys(data)
    .map(Number)
    .sort((a, b) => a - b)
    .map((n) => n.toString());

  if (useaxis) {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", titleFontSize)
      .attr("text-anchor", "middle")
      .style("font-size", `${titleFontSize}px`)
      .style("font-weight", "bold")
      .text("Stem and Leaf Plot");

    y += titleFontSize + 10;
  }

  const rowGroup = svg
    .append("g")
    .attr("transform", `translate(${startX}, ${y})`);

  sortedKeys.forEach((stem, i) => {
    const leaves = data[stem].slice().sort((a, b) => a - b);
    const leafText = leaves.map((v) => v.toString()).join(" ");

    const group = rowGroup
      .append("g")
      .attr("transform", `translate(0, ${i * lineHeight})`);

    // Stem column
    group
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 50)
      .attr("height", lineHeight - 4)
      .attr("fill", "#5c2d91")
      .attr("rx", 4);

    group
      .append("text")
      .attr("x", 25)
      .attr("y", (lineHeight - 4) / 2)
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("font-size", `${bodyFontSize}px`)
      .style("font-weight", "bold")
      .text(stem);

    // Leaf area
    group
      .append("rect")
      .attr("x", 60)
      .attr("y", 0)
      .attr("width", width - margin.left - margin.right - 60)
      .attr("height", lineHeight - 4)
      .attr("fill", "#f0f0f0")
      .attr("rx", 4);

    group
      .append("text")
      .attr("x", 70)
      .attr("y", (lineHeight - 4) / 2)
      .attr("dominant-baseline", "middle")
      .style("font-size", `${bodyFontSize}px`)
      .style("fill", "#333")
      .text(leafText);
  });

  if (useaxis && sortedKeys.length > 0 && data[sortedKeys[1]]?.length > 0) {
    const firstStem = sortedKeys[1];
    const firstLeaf = data[firstStem][0];
    const defaultKeyText = `Key: ${firstStem} | ${firstLeaf} = ${firstStem}${firstLeaf}`;

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", y + sortedKeys.length * lineHeight + 25)
      .attr("text-anchor", "middle")
      .style("font-size", `${keyFontSize}px`)
      .style("font-style", "italic")
      .style("fill", "#555")
      .text(defaultKeyText);
  }

  return svg.node();
};

export const createViolinPlot = (
  data: { category: string; value: number }[],
  width: number,
  height: number,
  useAxis: boolean = true // parameter tambahan
) => {
  // Margin dinamis tergantung axis
  const margin = useAxis
    ? { top: 20, right: 30, bottom: 40, left: 50 }
    : { top: 0, right: 0, bottom: 0, left: 0 };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("style", "max-width: 100%; height: auto;");

  const chartArea = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const categories = Array.from(new Set(data.map((d) => d.category)));

  const x = d3
    .scaleBand()
    .domain(categories)
    .range([0, innerWidth])
    .padding(0.05);

  const y = d3
    .scaleLinear()
    .domain([
      d3.min(data, (d) => d.value) ?? 0,
      d3.max(data, (d) => d.value) ?? 0,
    ])
    .nice()
    .range([innerHeight, 0]);

  const histogram = d3
    .histogram()
    .domain(y.domain() as [number, number])
    .thresholds(y.ticks(20));

  const sumstat = categories.map((category) => {
    const values = data
      .filter((d) => d.category === category)
      .map((d) => d.value);
    const bins = histogram(values);
    return { category, bins };
  });

  const maxNum =
    d3.max(sumstat.flatMap((s) => s.bins.map((b) => b.length))) ?? 0;

  const xNum = d3
    .scaleLinear()
    .range([0, x.bandwidth()])
    .domain([-maxNum, maxNum]);

  chartArea
    .selectAll("myViolin")
    .data(sumstat)
    .enter()
    .append("g")
    .attr("transform", (d) => `translate(${x(d.category)},0)`)
    .append("path")
    .datum((d) => d.bins)
    .style("fill", "#69b3a2")
    .style("stroke", "none")
    .attr(
      "d",
      d3
        .area<d3.Bin<number, number>>()
        .x0((d) => xNum(-d.length))
        .x1((d) => xNum(d.length))
        .y((d) => y(d.x0 ?? 0))
        .curve(d3.curveCatmullRom)
    );

  if (useAxis) {
    chartArea
      .append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x));

    chartArea.append("g").call(d3.axisLeft(y));
  }

  return svg.node();
};

export const createDensityChart = (
  data: number[],
  width: number,
  height: number,
  useAxis: boolean = true
) => {
  // Filter data yang valid (bukan NaN)
  const filteredData = data.filter((d) => !isNaN(d));

  console.log("di density", filteredData);

  const margin = useAxis
    ? { top: 20, right: 30, bottom: 40, left: 50 }
    : { top: 0, right: 0, bottom: 0, left: 0 };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("style", "max-width: 100%; height: auto;");

  const chartArea = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // X scale (value range)
  const x = d3
    .scaleLinear()
    .domain(d3.extent(filteredData) as [number, number])
    .nice()
    .range([0, innerWidth]);

  // Kernel Density Estimation
  const kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(40));
  const density = kde(filteredData);

  // Y scale (density value)
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(density, (d) => d[1]) ?? 0])
    .nice()
    .range([innerHeight, 0]);

  // Menutup area dengan baseline (y = 0)
  const area = d3
    .area<[number, number]>()
    .curve(d3.curveBasis)
    .x((d) => x(d[0]))
    .y0(innerHeight)
    .y1((d) => y(d[1]));

  chartArea
    .append("path")
    .datum(density as [number, number][])
    .attr("fill", "#69b3a2")
    .attr("opacity", 0.8)
    .attr("stroke", "#000")
    .attr("stroke-width", 1)
    .attr("stroke-linejoin", "round")
    .attr("d", area(density as [number, number][])!);

  // Add axes if needed
  if (useAxis) {
    chartArea
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x));

    chartArea.append("g").call(d3.axisLeft(y));
  }

  return svg.node();
};

// Kernel density estimator
function kernelDensityEstimator(kernel: (v: number) => number, X: number[]) {
  return function (V: number[]) {
    return X.map(function (x) {
      return [x, d3.mean(V, (v) => kernel(x - v)) ?? 0];
    });
  };
}

function kernelEpanechnikov(k: number) {
  return function (v: number) {
    v /= k;
    return Math.abs(v) <= 1 ? (0.75 * (1 - v * v)) / k : 0;
  };
}
