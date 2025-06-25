import * as d3 from "d3";
import { ChartTitleOptions, addChartTitle } from "./chartUtils";

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

interface AxisLabels {
  x?: string;
  y?: string;
}

interface AxisScaleOptions {
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
}

const getMajorTicks = (
  min: number,
  max: number,
  increment: number
): number[] => {
  const ticks: number[] = [];
  for (let i = min; i <= max; i += increment) {
    ticks.push(i);
  }
  return ticks;
};

export const createHistogram = (
  data: number[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: AxisLabels,
  axisScaleOptions?: AxisScaleOptions,
  chartColors?: string[]
) => {
  console.log("Creating histogram with data:", data);

  // Menentukan margin
  const marginTop = useAxis ? (titleOptions ? 60 : 30) : titleOptions ? 40 : 0;
  const marginRight = useAxis ? 30 : 0;
  const marginBottom = useAxis ? (axisLabels?.x ? 50 : 30) : 0;
  const marginLeft = useAxis ? (axisLabels?.y ? 60 : 30) : 0;

  // Filter data
  const validData = data.filter(
    (d) => d !== null && d !== undefined && !Number.isNaN(d) && d !== 0
  );

  console.log("Creating histogram with valid data:", validData);

  // Menentukan jumlah bins
  const thresholds = Math.ceil(1 + 3.3 * Math.log10(validData.length));

  // Membuat bins dari data yang valid
  const bins = d3
    .bin()
    .thresholds(thresholds)
    .value((d: any) => d)(validData);

  // Pastikan x0 dan x1 memiliki nilai fallback jika undefined
  const x0 =
    bins.length > 0 && bins[0].x0 !== undefined
      ? bins[0].x0
      : d3.min(validData) || 0;
  const x1 =
    bins.length > 0 && bins[bins.length - 1].x1 !== undefined
      ? bins[bins.length - 1].x1
      : d3.max(validData);

  // Pastikan x0 dan x1 adalah tipe number
  let x0Value: number = typeof x0 === "number" ? x0 : 0;
  let x1Value: number =
    typeof x1 === "number" ? x1 : Math.max(d3.max(validData) as number, 10);

  // Apply axis scale options if provided
  if (axisScaleOptions?.x) {
    if (axisScaleOptions.x.min !== undefined && axisScaleOptions.x.min !== "")
      x0Value = Number(axisScaleOptions.x.min);
    if (axisScaleOptions.x.max !== undefined && axisScaleOptions.x.max !== "")
      x1Value = Number(axisScaleOptions.x.max);
  }

  // Menentukan skala untuk sumbu X
  const x = d3
    .scaleLinear()
    .domain([x0Value, x1Value])
    .range([marginLeft, width - marginRight]);

  // Menentukan skala untuk sumbu Y
  let yMin = 0;
  let yMax = d3.max(bins, (d) => d.length) || 0;
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

  // Membuat elemen SVG baru di dalam DOM
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

  // Menambahkan rectangle untuk setiap bin
  svg
    .append("g")
    .attr(
      "fill",
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[0]
        : "steelblue"
    )
    .selectAll("rect")
    .data(bins)
    .join("rect")
    .attr("x", (d) => x(d.x0 || 0) + 1)
    .attr("width", (d) => x(d.x1 || 0) - x(d.x0 || 0) - 2)
    .attr("y", (d) => y(d.length))
    .attr("height", (d) => y(0) - y(d.length));

  // Menambahkan X axis
  if (useAxis) {
    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(width / 80)
          .tickSizeOuter(0)
      )
      .call((g) =>
        g.selectAll(".domain, .tick line").attr("stroke", "hsl(var(--border))")
      )
      .call((g) =>
        g.selectAll("text").attr("fill", "hsl(var(--muted-foreground))")
      );

    // Add X axis label if provided
    if (axisLabels?.x) {
      svg
        .append("text")
        .attr("x", marginLeft + width / 2)
        .attr("y", marginTop + height + marginBottom - 10)
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--foreground))")
        .style("font-size", "14px")
        .text(axisLabels.x);
    }
  }

  // Menambahkan Y axis
  if (useAxis) {
    const yAxis = d3.axisLeft(y).tickFormat(d3.format(".2s"));
    if (majorIncrement && majorIncrement > 0) {
      yAxis.tickValues(getMajorTicks(yMin, yMax, majorIncrement));
    }

    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxis)
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g.selectAll(".tick line").attr("stroke", "hsl(var(--border))")
      )
      .call((g) =>
        g.selectAll("text").attr("fill", "hsl(var(--muted-foreground))")
      );

    // Add Y axis label if provided
    if (axisLabels?.y) {
      svg
        .append("text")
        .attr("transform", `rotate(-90)`)
        .attr("x", -(height + marginTop - marginBottom) / 2)
        .attr("y", marginLeft - 50)
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--foreground))")
        .style("font-size", "14px")
        .text(axisLabels.y);
    }
  }

  // Mengembalikan node SVG
  return svg.node();
};

export const createPopulationPyramid = (
  data: ChartData[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: AxisLabels,
  axisScaleOptions?: AxisScaleOptions,
  chartColors?: string[]
) => {
  // Margin dinamis
  const marginTop = useAxis ? (titleOptions ? 60 : 30) : titleOptions ? 40 : 0;
  const marginRight = useAxis ? 50 : 10;
  const marginBottom = useAxis ? (axisLabels?.x ? 50 : 40) : 10;
  const marginLeft = useAxis ? (axisLabels?.y ? 70 : 50) : 10;

  const svgWidth = width + marginLeft + marginRight;
  const svgHeight = height + marginTop + marginBottom;

  // Skala untuk sumbu X (populasi)
  let maxPopulation = d3.max(data, (d: ChartData) => d.value) || 0;
  let xMin = -maxPopulation;
  let xMax = maxPopulation;
  let majorIncrement = axisScaleOptions?.x?.majorIncrement
    ? Number(axisScaleOptions.x.majorIncrement)
    : undefined;
  if (axisScaleOptions?.x) {
    if (axisScaleOptions.x.min !== undefined && axisScaleOptions.x.min !== "")
      xMin = Number(axisScaleOptions.x.min);
    if (axisScaleOptions.x.max !== undefined && axisScaleOptions.x.max !== "")
      xMax = Number(axisScaleOptions.x.max);
  }
  const x = d3.scaleLinear().domain([xMin, xMax]).range([0, width]);

  // Skala untuk sumbu Y (kategori usia)
  const y = d3
    .scaleBand()
    .domain(data.map((d) => d.category))
    .range([height, 0])
    .padding(0.1);

  // Membuat elemen SVG
  const svg = d3
    .create("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .attr("viewBox", [0, 0, svgWidth, svgHeight])
    .attr("style", "max-width: 100%; height: auto;");

  // Tambahkan judul & subjudul jika ada
  if (titleOptions) {
    addChartTitle(svg, titleOptions);
  }

  const g = svg
    .append("g")
    .attr("transform", `translate(${marginLeft},${marginTop})`);

  // Warna bar default atau dari chartColors
  let maleColor = "#3498db";
  let femaleColor = "#e74c3c";
  if (chartColors && chartColors.length === 1) {
    maleColor = chartColors[0];
    femaleColor = chartColors[0];
  } else if (chartColors && chartColors.length > 1) {
    maleColor = chartColors[0];
    femaleColor = chartColors[1];
  }

  // Bar pria
  g.selectAll(".bar-male")
    .data(data.filter((d) => d.subcategory === "M"))
    .join("rect")
    .attr("class", "bar-male")
    .attr("x", (d) => x(Math.min(0, -d.value)))
    .attr("y", (d) => y(d.category) || 0)
    .attr("width", (d) => Math.abs(x(-d.value) - x(0)))
    .attr("height", y.bandwidth())
    .attr("fill", maleColor);

  // Bar wanita
  g.selectAll(".bar-female")
    .data(data.filter((d) => d.subcategory === "F"))
    .join("rect")
    .attr("class", "bar-female")
    .attr("x", x(0))
    .attr("y", (d) => y(d.category) || 0)
    .attr("width", (d) => Math.abs(x(d.value) - x(0)))
    .attr("height", y.bandwidth())
    .attr("fill", femaleColor);

  // Sumbu X
  if (useAxis) {
    const xAxis = d3
      .axisBottom(x)
      .ticks(5)
      .tickFormat((d) => Math.abs(Number(d)) + "");
    if (majorIncrement && !isNaN(majorIncrement)) {
      const ticks = [];
      for (let v = xMin; v <= xMax; v += majorIncrement) {
        ticks.push(v);
      }
      xAxis.tickValues(ticks);
    }
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .call((g) => g.select(".domain").remove());
  }

  // Label sumbu X (selalu di bawah chart, bukan di bawah judul)
  if (useAxis && axisLabels?.x) {
    svg
      .append("text")
      .attr("x", marginLeft + width / 2)
      .attr("y", marginTop + height + 40)
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--foreground))")
      .style("font-size", "14px")
      .text(axisLabels.x);
  }

  // Sumbu Y
  if (useAxis) {
    g.append("g")
      .call(d3.axisLeft(y))
      .call((g) => g.select(".domain").remove());
    // Label sumbu Y
    if (axisLabels?.y) {
      g.append("text")
        .attr("transform", `rotate(-90)`)
        .attr("x", -height / 2)
        .attr("y", -marginLeft + 15)
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--foreground))")
        .style("font-size", "14px")
        .text(axisLabels.y);
    }
  }

  return svg.node();
};

// export const createPopulationPyramid = (
//   data: { ageGroup: string; male: number; female: number }[], // Data harus memiliki tipe eksplisit
//   width: number,
//   height: number
// ) => {
//   const margin = { top: 20, right: 50, bottom: 30, left: 50 };
//   const svgWidth = width + margin.left + margin.right;
//   const svgHeight = height + margin.top + margin.bottom;

//   // Skala untuk sumbu X (populasi)
//   const x = d3
//     .scaleLinear()
//     .domain([
//       0,
//       d3.max(data, (d: { male: number; female: number }) =>
//         Math.max(d.male, d.female)
//       ) || 0,
//     ])
//     .range([0, width / 2]);

//   // Skala untuk sumbu Y (kategori usia)
//   const y = d3
//     .scaleBand()
//     .domain(data.map((d: { ageGroup: string }) => d.ageGroup))
//     .range([height, 0])
//     .padding(0.1);

//   // Membuat elemen SVG
//   const svg = d3
//     .create("svg")
//     .attr("width", svgWidth)
//     .attr("height", svgHeight)
//     .attr("viewBox", [0, 0, svgWidth, svgHeight])
//     .attr("style", "max-width: 100%; height: auto;");

//   const g = svg
//     .append("g")
//     .attr("transform", `translate(${margin.left},${margin.top})`);

//   // Menambahkan bar untuk pria (male) di sisi kiri
//   g.selectAll(".bar-male")
//     .data(data)
//     .join("rect")
//     .attr("class", "bar-male")
//     .attr("x", (d) => width / 2 - x(d.male))
//     .attr("y", (d) => y(d.ageGroup) || 0)
//     .attr("width", (d) => x(d.male))
//     .attr("height", y.bandwidth())
//     .attr("fill", "#3498db"); // Warna biru untuk pria

//   // Menambahkan bar untuk wanita (female) di sisi kanan
//   g.selectAll(".bar-female")
//     .data(data)
//     .join("rect")
//     .attr("class", "bar-female")
//     .attr("x", width / 2)
//     .attr("y", (d) => y(d.ageGroup) || 0)
//     .attr("width", (d) => x(d.female))
//     .attr("height", y.bandwidth())
//     .attr("fill", "#e74c3c"); // Warna merah untuk wanita

//   // Menambahkan sumbu X untuk pria di kiri
//   g.append("g")
//     .attr("transform", `translate(${width / 2},${height})`)
//     .call(
//       d3
//         .axisBottom(x)
//         .ticks(5)
//         .tickFormat((d) => d + "M")
//     )
//     .call((g) => g.select(".domain").remove());

//   // Menambahkan sumbu X untuk wanita di kanan
//   g.append("g")
//     .attr("transform", `translate(${width / 2},${height})`)
//     .call(
//       d3
//         .axisBottom(x)
//         .ticks(5)
//         .tickFormat((d) => d + "M")
//     )
//     .call((g) => g.select(".domain").remove());

//   // Menambahkan sumbu Y (kelompok usia)
//   g.append("g")
//     .call(d3.axisLeft(y))
//     .call((g) => g.select(".domain").remove());

//   return svg.node();
// };

export const createFrequencyPolygon = (
  data: { category: string; value: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: AxisLabels,
  axisScaleOptions?: AxisScaleOptions,
  chartColors?: string[]
) => {
  console.log("Creating frequency polygon with data:", data);

  // Filter data
  const validData = data.filter(
    (d) =>
      d.category &&
      d.value !== undefined &&
      d.value !== null &&
      !Number.isNaN(d.value)
  );

  if (validData.length === 0) {
    console.warn("No valid data available for creating the chart.");
    return null;
  }

  // Extend data with zero values to create boundary points
  const firstCategory = validData[0].category || "No Category";
  const lastCategory =
    validData[validData.length - 1].category || "No Category";
  const extendedData = [
    { category: "start", value: 0 },
    ...validData,
    { category: "end", value: 0 },
  ];

  // Set margins based on whether axes are enabled
  const marginTop = useAxis ? (titleOptions ? 60 : 30) : titleOptions ? 40 : 0;
  const marginRight = useAxis ? 30 : 0;
  const marginBottom = useAxis ? (axisLabels?.x ? 10 : 0) : 0;
  const marginLeft = useAxis ? (axisLabels?.y ? 60 : 40) : 0;

  // Set scales for X and Y axes
  const x = d3
    .scalePoint()
    .domain(extendedData.map((d) => d.category))
    .range([marginLeft, width - marginRight]);

  // Set domain Y dari axisScaleOptions jika ada
  let yMin = 0;
  let yMax = d3.max(extendedData, (d) => d.value) as number;
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
    .range([height - marginBottom, marginTop]);

  // Warna garis/titik
  const mainColor =
    chartColors && chartColors[0] ? chartColors[0] : "steelblue";

  // Create SVG element
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

  // Append frequency polygon line to the SVG
  svg
    .append("path")
    .datum(extendedData)
    .attr("fill", "none")
    .attr("stroke", mainColor)
    .attr("stroke-width", 2)
    .attr(
      "d",
      d3
        .line<{ category: string; value: number }>()
        .x((d) => x(d.category)!)
        .y((d) => y(Math.max(yMin, Math.min(yMax, d.value))))
        .curve(d3.curveMonotoneX)
    );

  // Append data points to the SVG
  svg
    .append("g")
    .selectAll("circle")
    .data(extendedData)
    .join("circle")
    .attr("cx", (d) => x(d.category)!)
    .attr("cy", (d) => y(Math.max(yMin, Math.min(yMax, d.value))))
    .attr("r", 4)
    .attr("fill", mainColor);

  // If axis is enabled, append X and Y axes
  if (useAxis) {
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - marginBottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    let yAxis = d3.axisLeft(y);
    if (majorIncrement && majorIncrement > 0) {
      // Generate ticks sesuai majorIncrement
      const ticks = [];
      for (let v = yMin; v <= yMax; v += majorIncrement) {
        ticks.push(v);
      }
      yAxis = yAxis.tickValues(ticks);
    } else {
      yAxis = yAxis.ticks(height / 40);
    }
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft}, 0)`)
      .call(yAxis)
      .call((g) => g.select(".domain").remove());
  }

  // Label sumbu X (selalu di bawah chart, bukan di bawah judul)
  if (useAxis && axisLabels?.x) {
    svg
      .append("text")
      .attr("x", marginLeft + width / 2)
      .attr("y", marginTop + height + marginBottom - 20)
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--foreground))")
      .style("font-size", "14px")
      .text(axisLabels.x);
  }

  // Label sumbu Y
  if (useAxis && axisLabels?.y) {
    svg
      .append("text")
      .attr("transform", `rotate(-90)`)
      .attr("x", -(marginTop + height / 2))
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--foreground))")
      .style("font-size", "14px")
      .text(axisLabels.y);
  }

  // Return the SVG node
  return svg.node();
};

export const createStackedHistogram = (
  data: { value: number; category: string }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: ChartTitleOptions,
  axisLabels?: { x?: string; y?: string },
  chartColors?: string[]
) => {
  console.log("Creating stacked histogram with data:", data);

  const marginTop = useAxis ? (titleOptions ? 60 : 30) : titleOptions ? 40 : 0;
  const marginRight = useAxis ? 30 : 0;
  const marginBottom = useAxis ? (axisLabels?.x ? 30 : 10) : 0;
  const marginLeft = useAxis ? (axisLabels?.y ? 60 : 30) : 0;

  // Filter data untuk menghilangkan nilai yang tidak valid
  const validData = data.filter(
    (d) =>
      d.value !== null &&
      d.value !== undefined &&
      !Number.isNaN(d.value) &&
      d.value !== 0
  );

  // Kelompokkan data berdasarkan kategori
  const categories = Array.from(new Set(validData.map((d) => d.category)));

  // Menentukan bins
  const thresholds = Math.max(5, Math.ceil(validData.length / 5));
  const binGenerator = d3
    .bin<{ value: number; category: string }, number>()
    .thresholds(thresholds)
    .value((d) => d.value);

  const bins = binGenerator(validData);

  // Pastikan x0 dan x1 selalu bertipe number
  const x0Value: number = bins[0]?.x0 ?? 0;
  const x1Value: number =
    bins[bins.length - 1]?.x1 ?? d3.max(validData.map((d) => d.value)) ?? 10;

  // Buat struktur data untuk d3.stack()
  const stackedData = bins.map((bin) => {
    const counts: { [key: string]: number } = {};
    categories.forEach((category) => (counts[category] = 0));
    bin.forEach((d) => counts[d.category]++);
    return { x0: bin.x0 ?? 0, x1: bin.x1 ?? 0, ...counts };
  });

  // Skala X
  const x = d3
    .scaleLinear()
    .domain([x0Value, x1Value])
    .range([marginLeft, width - marginRight]);

  // Skala Y
  const y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(stackedData, (d) => d3.sum(categories, (c) => (d as any)[c])) ?? 0,
    ])
    .range([height - marginBottom, marginTop]);

  // Skala warna untuk kategori
  const color = d3
    .scaleOrdinal()
    .domain(categories)
    .range(
      chartColors && chartColors.length >= categories.length
        ? chartColors
        : d3.schemeCategory10
    );

  // Data untuk d3.stack()
  const stack = d3.stack<{ [key: string]: number }>().keys(categories);
  const series = stack(stackedData);

  // Buat elemen SVG
  const legendHeight = 40;
  const svgWidth = width + marginLeft + marginRight;
  const svgHeight = height + marginTop + marginBottom + legendHeight;

  const svg = d3
    .create("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .attr("viewBox", [0, 0, svgWidth, svgHeight])
    .attr("style", "max-width: 100%; height: auto;");

  // Tambahkan judul & subjudul jika ada
  if (titleOptions) {
    addChartTitle(svg, titleOptions);
  }

  // Buat kelompok bar
  const groups = svg
    .append("g")
    .attr("transform", `translate(${marginLeft},${marginTop})`)
    .selectAll("g")
    .data(series)
    .join("g")
    .attr("fill", (d) => color(d.key) as string);

  // Tambahkan rect untuk setiap kategori dalam bin
  groups
    .selectAll("rect")
    .data((d) => d)
    .join("rect")
    .attr("x", (d) => x(d.data.x0))
    .attr("width", (d) => Math.max(1, x(d.data.x1) - x(d.data.x0) - 2))
    .attr("y", (d) => y(d[1]))
    .attr("height", (d) => Math.max(0, y(d[0]) - y(d[1])));

  // Tambahkan sumbu X
  if (useAxis) {
    svg
      .append("g")
      .attr(
        "transform",
        `translate(${marginLeft},${height + marginTop - marginBottom})`
      )
      .call(
        d3
          .axisBottom(x)
          .ticks(width / 80)
          .tickSizeOuter(0)
      );

    // Label sumbu X
    if (axisLabels?.x) {
      svg
        .append("text")
        .attr("x", marginLeft + width / 2)
        .attr("y", marginTop + height + marginBottom - 10)
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--foreground))")
        .style("font-size", "14px")
        .text(axisLabels.x);
    }
  }

  // Tambahkan sumbu Y
  if (useAxis) {
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},${marginTop})`)
      .call(d3.axisLeft(y).ticks(height / 40))
      .call((g) => g.select(".domain").remove());

    // Label sumbu Y
    if (axisLabels?.y) {
      svg
        .append("text")
        .attr("transform", `rotate(-90)`)
        .attr("x", -(marginTop + height / 2))
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--foreground))")
        .style("font-size", "14px")
        .text(axisLabels.y);
    }
  }

  // Tambahkan legenda di bawah chart, rata tengah
  if (useAxis) {
    const legendItemWidth = 80;
    const legendItemHeight = 19;
    const labelOffset = 5;
    const totalLegendWidth = categories.length * legendItemWidth;
    const legendStartX = (svgWidth - totalLegendWidth) / 2;
    const legendY = marginTop + height + marginBottom + 10;

    const legend = svg
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 12)
      .attr("text-anchor", "start")
      .selectAll("g")
      .data(categories)
      .join("g")
      .attr(
        "transform",
        (d, i) => `translate(${legendStartX + i * legendItemWidth},${legendY})`
      );

    legend
      .append("rect")
      .attr("width", 19)
      .attr("height", legendItemHeight)
      .attr("fill", (d: string) => String(color(d)));

    legend
      .append("text")
      .attr("x", 19 + labelOffset)
      .attr("y", legendItemHeight / 2)
      .attr("dy", "0.35em")
      .text((d) => d);
  }

  // Kembalikan node SVG
  return svg.node();
};
