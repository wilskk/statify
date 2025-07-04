import * as d3 from "d3";
import {
  addChartTitle,
  ChartTitleOptions,
  generateAxisTicks,
} from "./chartUtils";
import { createStandardSVG, addAxisLabels } from "../chartUtils";
import { calculateResponsiveMargin } from "../responsiveMarginUtils";

interface ChartData {
  category: string;
  subcategory: string;
  value: number;
}

interface StackedAreaChartInput {
  category: string;
  [key: string]: number | string;
}

// export const createAreaChart = (
//   data: { category: string; value: number }[], // Data dengan category sebagai string dan value sebagai angka
//   width: number,
//   height: number,
//   useAxis: boolean = true
// ) => {
//   console.log("Creating area chart with data:", data);

//   // Filter data untuk menghilangkan item dengan category atau value yang tidak valid
//   const validData = data.filter(
//     (d) =>
//       d.category &&
//       !Number.isNaN(d.value) &&
//       d.value !== null &&
//       d.value !== undefined
//   );

//   console.log("Filtered valid data:", validData);

//   // Menentukan margin hanya jika axis digunakan
//   const marginTop = useAxis ? 30 : 0;
//   const marginRight = useAxis ? 30 : 0;
//   const marginBottom = useAxis ? 30 : 0;
//   const marginLeft = useAxis ? 40 : 0;

//   // Menentukan skala untuk sumbu X dan Y
//   const x = d3
//     .scaleBand() // scaleBand untuk kategori
//     .domain(validData.map((d) => d.category))
//     .range([marginLeft, width - marginRight])
//     .padding(0.2);

//   const y = d3
//     .scaleLinear()
//     .domain([0, d3.max(validData, (d) => d.value) as number])
//     .range([height - marginBottom, marginTop]);

//   // Generator untuk area chart
//   const area = d3
//     .area<{ category: string; value: number }>()
//     .x((d) => x(d.category)! + x.bandwidth() / 2)
//     .y0(y(0))
//     .y1((d) => y(d.value));

//   // Membuat elemen SVG baru di dalam DOM
//   const svg = d3
//     .create("svg")
//     .attr("width", width + marginLeft + marginRight)
//     .attr("height", height + marginTop + marginBottom)
//     .attr("viewBox", [
//       0,
//       0,
//       width + marginLeft + marginRight,
//       height + marginTop + marginBottom,
//     ]) // ViewBox untuk responsif
//     .attr("style", "max-width: 100%; height: auto;");

//   // Menambahkan path untuk area chart
//   svg.append("path").datum(validData).attr("fill", "steelblue").attr("d", area);

//   // Jika axis digunakan, tambahkan sumbu X dan Y
//   if (useAxis) {
//     // X-Axis (Horizontal)
//     svg
//       .append("g")
//       .attr("transform", `translate(0, ${height - marginBottom})`)
//       .call(
//         d3
//           .axisBottom(x)
//           .ticks(width / 80)
//           .tickSizeOuter(0)
//       );

//     // Y-Axis (Vertical)
//     svg
//       .append("g")
//       .attr("transform", `translate(${marginLeft}, 0)`)
//       .call(d3.axisLeft(y).ticks(height / 40))
//       .call((g) => g.select(".domain").remove())
//       .call((g) =>
//         g
//           .selectAll(".tick line")
//           .clone()
//           .attr("x2", width - marginLeft - marginRight)
//           .attr("stroke-opacity", 0.1)
//       )
//       .call((g) =>
//         g
//           .append("text")
//           .attr("x", -marginLeft)
//           .attr("y", 10)
//           .attr("fill", "currentColor")
//           .attr("text-anchor", "start")
//           .text("↑ Value")
//       );
//   }

//   // Mengembalikan node SVG
//   return svg.node();
// };

export const createAreaChart = (
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
  console.log("Creating area chart with data:", data);

  // Filter data
  const validData = data.filter(
    (d) =>
      d.category &&
      !Number.isNaN(d.value) &&
      d.value !== null &&
      d.value !== undefined
  );

  console.log("Filtered valid data:", validData);

  // Tambahkan uniqueId ke setiap data point
  const processedData = validData.map((d, i) => ({
    ...d,
    uniqueId: `${d.category}_${i}`,
    displayLabel: d.category,
  }));

  // Calculate max values for Y scale and X axis rotation logic
  const maxYValue = d3.max(processedData, (d) => d.value) ?? 0;
  const maxCategoryLength =
    d3.max(processedData, (d) => d.displayLabel.length) ?? 0;

  // Use responsive margin utility
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
  });

  const {
    top: marginTop,
    bottom: marginBottom,
    left: marginLeft,
    right: marginRight,
  } = margin;

  // Skala X dan Y
  // X pakai uniqueId
  const x = d3
    .scaleBand()
    .domain(processedData.map((d) => d.uniqueId))
    .range([marginLeft, width - marginRight])
    .padding(0.2);

  // Y axis min/max/majorIncrement
  let yMin = 0;
  let yMax = maxYValue * 1.1;
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

  // Area generator
  const area = d3
    .area<{ uniqueId: string; value: number }>()
    .x((d, i) => x(d.uniqueId)! + x.bandwidth() / 2)
    .y0(y(yMin))
    .y1((d) => y(d.value));

  // SVG using standard utility with custom viewBox
  const svg = createStandardSVG({
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  });

  // Tambahkan judul dan subtitle jika ada
  if (titleOptions) {
    addChartTitle(svg, titleOptions);
  }

  // Area path
  svg
    .append("path")
    .datum(processedData)
    .attr(
      "fill",
      chartColors && chartColors.length > 0 ? chartColors[0] : "steelblue"
    )
    .attr("d", area);

  // Axis
  if (useAxis) {
    // X Axis pakai uniqueId, label pakai displayLabel
    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0, ${height - marginBottom})`)
      .call(
        d3.axisBottom(x).tickFormat((d) => {
          const dataPoint = processedData.find((item) => item.uniqueId === d);
          return dataPoint ? dataPoint.displayLabel : d;
        })
      );

    if (maxCategoryLength > 10 || processedData.length > 10) {
      xAxis
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em")
        .attr("transform", "rotate(-40)");
    }

    // Y Axis
    let yAxisGen = d3.axisLeft(y).ticks(height / 40);
    if (majorIncrement && majorIncrement > 0) {
      const tickVals = Array.from(
        { length: Math.floor((yMax - yMin) / majorIncrement) + 1 },
        (_, i) => yMin + i * majorIncrement
      );
      yAxisGen = yAxisGen.tickValues(tickVals);
    }
    const yAxis = svg
      .append("g")
      .attr("transform", `translate(${marginLeft}, 0)`)
      .call(yAxisGen)
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("x2", width - marginLeft - marginRight)
          .attr("stroke-opacity", 0.1)
      );

    // Add axis labels using utility function
    addAxisLabels({
      svg,
      width,
      height,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      axisLabels,
      chartType: "default",
    });
  }

  return svg.node();
};

/**
 * Membuat Stacked Area Chart dengan Struktur Data Umum.
 *
 * @param data - Array dari objek ChartData
 * @param width - Lebar SVG (default: 928)
 * @param height - Tinggi SVG (default: 500)
 * @param useAxis - Boolean untuk menentukan apakah sumbu akan ditampilkan (default: true)
 * @returns SVGElement atau null jika data tidak valid
 */
export const createStackedAreaChart = (
  data: ChartData[],
  width: number = 928,
  height: number = 500,
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
  if (!data || data.length === 0) {
    console.error("No data provided for the stacked area chart.");
    return null;
  }
  console.log("Data", data);

  // Definisi margin
  const margin = {
    top: useAxis ? (titleOptions ? 60 : 30) : titleOptions ? 40 : 0,
    right: useAxis ? 20 : 0,
    bottom: useAxis ? 60 : 0, // Lebih banyak ruang untuk label X yang diputar dan legenda
    left: useAxis ? 80 : 0, // Cukup ruang untuk label Y
  };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Ekstrak kategori unik dan subkategori unik
  const categories = Array.from(new Set(data.map((d) => d.category))).sort(
    d3.ascending
  );
  const subcategories = Array.from(new Set(data.map((d) => d.subcategory)));

  // Membentuk data terstruktur per kategori
  const dataByCategory: { [key: string]: { [key: string]: number } } = {};
  data.forEach((d) => {
    if (!dataByCategory[d.category]) {
      dataByCategory[d.category] = {};
    }
    dataByCategory[d.category][d.subcategory] = d.value;
  });

  // Membentuk data untuk d3.stack
  const stackData: StackedAreaChartInput[] = categories.map((category) => ({
    category,
    ...dataByCategory[category],
  }));

  // Type assertion untuk memastikan tipe data benar
  const typedStackData = stackData as Array<
    { category: string } & Record<string, number>
  >;

  // Membuat stack generator
  const stackedData = d3
    .stack<{ category: string } & Record<string, number>>()
    .keys(subcategories)
    .value((d, key) => d[key] || 0)(typedStackData);

  // Skala X: scalePoint untuk kategori berbasis string
  const x = d3
    .scalePoint<string>()
    .domain(categories)
    .range([0, innerWidth])
    .padding(0.5);

  // Skala Y
  let yMin = 0;
  let yMax = d3.max(stackedData, (layer) => d3.max(layer, (d) => d[1]))!;
  let majorIncrement = axisScaleOptions?.y?.majorIncrement
    ? Number(axisScaleOptions.y.majorIncrement)
    : undefined;
  if (axisScaleOptions?.y) {
    if (axisScaleOptions.y.min !== undefined && axisScaleOptions.y.min !== "")
      yMin = Number(axisScaleOptions.y.min);
    if (axisScaleOptions.y.max !== undefined && axisScaleOptions.y.max !== "")
      yMax = Number(axisScaleOptions.y.max);
  }
  const y = d3.scaleLinear().domain([yMin, yMax]).range([innerHeight, 0]);

  // Skala Warna
  const color = d3
    .scaleOrdinal<string>()
    .domain(subcategories)
    .range(chartColors || d3.schemeTableau10);

  // Area Generator
  const area = d3
    .area<d3.SeriesPoint<{ category: string } & Record<string, number>>>()
    .x((d) => x(d.data.category)!)
    .y0((d) => y(Math.max(y.domain()[0], Math.min(y.domain()[1], d[0]))))
    .y1((d) => y(Math.max(y.domain()[0], Math.min(y.domain()[1], d[1]))))
    .curve(d3.curveLinear);
  // .curve(d3.curveMonotoneX); //alternatif

  // Membuat SVG
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("style", "max-width: 100%; height: auto;");

  const chart = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Add title if provided
  if (titleOptions) {
    addChartTitle(svg, titleOptions);
  }

  // Tambahkan Y-axis dan grid lines jika useAxis adalah true
  if (useAxis) {
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

    chart
      .append("g")
      .call(yAxis)
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("x2", innerWidth)
          .attr("stroke-opacity", 0.1)
      );
  }

  // Append areas
  chart
    .selectAll("path")
    .data(stackedData)
    .join("path")
    .attr("fill", (d) => color(d.key)!)
    .attr("d", area)
    .append("title")
    .text((d) => d.key as string);

  // Tambahkan X-axis jika useAxis adalah true
  if (useAxis) {
    const xAxis = d3.axisBottom(x).tickSizeOuter(0);
    chart
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((g) => {
        g.selectAll("text")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end");
      });

    // Menambahkan label sumbu X
    svg
      .append("text")
      .attr("x", margin.left + innerWidth / 2)
      .attr("y", height - margin.bottom + 35)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(axisLabels?.x || "Category");
  }

  // Tambahkan legenda
  if (useAxis) {
    // Menambahkan legenda
    const legend = svg
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .attr(
        "transform",
        `translate(${margin.left}, ${height - margin.bottom + 50})`
      );

    const legendItemSize = 15;
    const legendSpacing = 4;

    subcategories.forEach((sub, i) => {
      const legendRow = legend
        .append("g")
        .attr(
          "transform",
          `translate(${(i % 5) * (legendItemSize + 100)}, ${
            Math.floor(i / 5) * (legendItemSize + legendSpacing)
          })`
        );

      legendRow
        .append("rect")
        .attr("width", legendItemSize)
        .attr("height", legendItemSize)
        .attr("fill", color(sub));

      legendRow
        .append("text")
        .attr("x", legendItemSize + legendSpacing)
        .attr("y", legendItemSize / 2)
        .attr("dy", "0.35em")
        .text(sub);
    });

    // Tambahkan tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "#f9f9f9")
      .style("padding", "5px")
      .style("border", "1px solid #d3d3d3")
      .style("border-radius", "4px")
      .style("pointer-events", "none");
  }

  // Mengembalikan elemen SVG
  return svg.node();
};
