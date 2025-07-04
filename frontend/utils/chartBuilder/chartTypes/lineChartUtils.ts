import * as d3 from "d3";
import {
  ChartTitleOptions,
  addChartTitle,
  generateAxisTicks,
  addStandardAxes,
  formatAxisNumber,
  truncateText,
} from "./chartUtils";
import { getMajorTicks, createStandardSVG, addAxisLabels } from "../chartUtils";
import { filterDataByAxisRange } from "../dataFilter";
import { calculateResponsiveMargin } from "../responsiveMarginUtils";

const colorScheme = d3.schemeCategory10;

interface ChartData {
  category: string;
  subcategory: string;
  value: number;
}

// Fungsi untuk membuat line chart
// export const createLineChart = (
//   data: { category: string; value: number }[],
//   width: number,
//   height: number,
//   useAxis: boolean = true
// ) => {
//   console.log("Creating chart with data:", data);

//   // Menentukan margin hanya jika axis digunakan
//   const marginTop = useAxis ? 30 : 0;
//   const marginRight = useAxis ? 30 : 0;
//   const marginBottom = useAxis ? 30 : 0;
//   const marginLeft = useAxis ? 30 : 0;

//   // Menentukan skala untuk sumbu X dan Y
//   const x = d3
//     .scaleBand()
//     .domain(data.map((d) => d.category))
//     .range([marginLeft, width - marginRight])
//     .padding(0.1);

//   const y = d3
//     .scaleLinear()
//     // .domain([0, d3.max(data, (d) => d.value) as number])
//     .domain([d3.min(data, (d) => d.value)!, d3.max(data, (d) => d.value)!])
//     .range([height - marginBottom, marginTop]);

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
//     ])
//     .attr("style", "max-width: 100%; height: auto;");

//   // Mendeklarasikan generator garis
//   const line = d3
//     .line<{ category: string; value: number }>()
//     .x((d) => x(d.category)! + x.bandwidth() / 2)
//     .y((d) => y(d.value)!)
//     .curve(d3.curveLinear);

//   // Menambahkan path untuk garis
//   svg
//     .append("path")
//     .attr("fill", "none")
//     .attr("stroke", "steelblue")
//     .attr("stroke-width", 1.5)
//     .attr("d", line(data));

//   // Jika axis digunakan, tambahkan sumbu X dan Y
//   if (useAxis) {
//     // X-Axis (Horizontal)
//     svg
//       .append("g")
//       .attr("transform", `translate(0, ${height - marginBottom})`)
//       .call(d3.axisBottom(x).tickSizeOuter(0));

//     // Y-Axis (Vertical)
//     svg
//       .append("g")
//       .attr("transform", `translate(${marginLeft}, 0)`)
//       .call(d3.axisLeft(y).tickFormat((y) => (+y * 1).toFixed(2)))
//       .call((g: any) => g.select(".domain").remove())
//       .call((g: any) =>
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

export const createLineChart = (
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
  console.log("Creating chart with data:", data);

  // Filter data sesuai axis min/max
  const filteredData = filterDataByAxisRange(
    data,
    { y: { min: axisScaleOptions?.y?.min, max: axisScaleOptions?.y?.max } },
    { x: "category", y: "value" }
  );

  // Tambahkan uniqueId ke setiap data point
  const processedData = filteredData.map((d, i) => ({
    ...d,
    uniqueId: `${d.category}_${i}`,
    displayLabel: d.category,
  }));

  // Mengukur panjang label secara dinamis
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = "10px sans-serif"; // Pastikan font ini sesuai dengan font axis

  // Menghitung panjang label X secara dinamis
  const maxXLabelWidth =
    d3.max(processedData, (d) => ctx.measureText(d.displayLabel).width) ?? 0;
  const yTicks = d3
    .scaleLinear()
    .domain([0, d3.max(processedData, (d) => d.value)!])
    .ticks(5);
  const maxYLabelWidth =
    d3.max(yTicks.map((tick) => ctx.measureText(tick.toFixed(0)).width)) ?? 0;

  // Menentukan apakah rotasi diperlukan
  const needRotateX = maxXLabelWidth > width / processedData.length;

  // Use responsive margin utility for line chart
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    maxLabelWidth: Math.max(maxYLabelWidth, maxXLabelWidth),
  });

  // Adjust bottom margin for rotated X labels if needed
  let marginBottom = margin.bottom;
  if (needRotateX && useAxis) {
    const rotatedLabelSpace = maxXLabelWidth * 0.8 + 20;
    marginBottom = Math.max(marginBottom, rotatedLabelSpace);
  }

  const { top: marginTop, left: marginLeft, right: marginRight } = margin;

  // Skala X dan Y
  // X pakai uniqueId
  const x = d3
    .scaleBand()
    .domain(processedData.map((d) => d.uniqueId))
    .range([marginLeft, width - marginRight])
    .padding(0.1);

  // Y axis min/max/majorIncrement
  let yMin = d3.min(processedData, (d) => d.value) ?? 0;
  let yMax = d3.max(processedData, (d) => d.value) ?? 1;
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

  // Membuat elemen SVG
  const svg = createStandardSVG({
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  });

  // Tambahkan judul dan subtitle jika ada dengan margin-aware positioning
  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop,
      useResponsivePositioning: true,
    });
  }

  // Mendeklarasikan generator garis
  const line = d3
    .line<{ uniqueId: string; value: number }>()
    .x((d, i) => x(d.uniqueId)! + x.bandwidth() / 2)
    .y((d) => y(d.value)!)
    .curve(d3.curveLinear);

  // Menambahkan path untuk garis
  svg
    .append("path")
    .attr("fill", "none")
    .attr(
      "stroke",
      chartColors && chartColors.length > 0 ? chartColors[0] : "steelblue"
    )
    .attr("stroke-width", 1.5)
    .attr("d", line(processedData));

  if (useAxis) {
    // Use standardized axis functions for line chart
    const categories = processedData.map((d) => d.displayLabel);

    addStandardAxes(svg, {
      xScale: x,
      yScale: y,
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
      chartType: "vertical",
      data: processedData, // For display label lookup
      xAxisOptions: {
        maxLabelLength: 8,
        tickFormat: (d: any) => {
          // Custom formatter for line chart categories WITH truncation
          const dataPoint = processedData.find((item) => item.uniqueId === d);
          const displayLabel = dataPoint ? dataPoint.displayLabel : d;
          return truncateText(displayLabel, 8); // Apply maxLabelLength manually
        },
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: true,
        maxLabelLength: 6, // Control Y-axis number label length
      },
    });
  }

  return svg.node();
};

/**
 * Membuat Multiline Chart dengan Sumbu X Berbasis Kategori (Ordinal)
 *
 * @param data - Array dari objek ChartData
 * @param width - Lebar SVG
 * @param height - Tinggi SVG
 * @param useAxis - Boolean untuk menentukan apakah sumbu akan ditampilkan
 * @returns SVGElement atau null jika data tidak valid
 */
export const createMultilineChart = (
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
      d.category !== ""
  );

  if (validData.length === 0) {
    console.error("No valid data available for the multiline chart");
    return null;
  }

  // Use responsive margin utility for multiline chart with legend
  const margin = calculateResponsiveMargin({
    width,
    height,
    useAxis,
    titleOptions,
    axisLabels,
    hasLegend: true,
    legendPosition: "bottom",
  });

  const {
    top: marginTop,
    bottom: marginBottom,
    left: marginLeft,
    right: marginRight,
  } = margin;

  // Ekstrak seri dan kategori unik
  const subcategoryNames = Array.from(
    new Set(validData.map((d) => d.subcategory))
  );
  const categories = Array.from(new Set(validData.map((d) => d.category)));

  // Y scale with axis options
  let yMin = d3.min(validData, (d) => d.value)!;
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

  // Skala X dan Y
  const x = d3
    .scalePoint<string>()
    .domain(categories)
    .range([marginLeft, width - marginRight])
    .padding(0.5);
  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .range([height - marginBottom, marginTop]);

  // Membentuk data terstruktur per subkategori (jangan filter dengan yMin/yMax)
  const dataBySubcategory: {
    [key: string]: { category: string; value: number }[];
  } = {};
  subcategoryNames.forEach((subcategory) => {
    dataBySubcategory[subcategory] = validData.filter(
      (d) => d.subcategory === subcategory
    );
  });

  // Membuat skala untuk sumbu X dan Y
  const xScaleDomain = categories;

  // Skala warna
  const color = d3
    .scaleOrdinal<string>()
    .domain(subcategoryNames)
    .range(chartColors || d3.schemeCategory10)
    .unknown("#ccc");

  // Membuat elemen SVG menggunakan standardized utility
  const svg = createStandardSVG({
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  });

  // Tambahkan judul dan subjudul jika ada dengan margin-aware positioning
  if (titleOptions) {
    addChartTitle(svg, {
      ...titleOptions,
      marginTop,
      useResponsivePositioning: true,
    });
  }

  // Add axis using standardized functions
  if (useAxis) {
    addStandardAxes(svg, {
      xScale: x,
      yScale: y,
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
      chartType: "vertical",
      xAxisOptions: {
        maxLabelLength: 8, // Consistent dengan single line chart
      },
      yAxisOptions: {
        customFormat: formatAxisNumber,
        showGridLines: true,
        maxLabelLength: 6, // Control Y-axis number label length
      },
    });
  }

  // Membuat garis untuk setiap subkategori
  const line = d3
    .line<{ category: string; value: number }>()
    .x((d) => x(d.category)!)
    .y((d) => y(Math.max(yMin, Math.min(yMax, d.value))));

  svg
    .append("g")
    .selectAll("path")
    .data(subcategoryNames)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", (d) => color(d))
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", (d) => line(dataBySubcategory[d])!);

  // Tooltip
  // Membuat div untuk tooltip
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

  // Menambahkan titik-titik interaktif untuk tooltip
  subcategoryNames.forEach((subcategory) => {
    svg
      .append("g")
      .selectAll("circle")
      .data(
        dataBySubcategory[subcategory].filter(
          (d) => d.value >= yMin && d.value <= yMax
        )
      )
      .join("circle")
      .attr("cx", (d) => x(d.category)!)
      .attr("cy", (d) => y(d.value))
      .attr("r", 3)
      .attr("fill", color(subcategory))
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            `<strong>Subcategory:</strong> ${subcategory}<br><strong>Category:</strong> ${d.category}<br><strong>Value:</strong> ${d.value}`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      });
  });

  // Menambahkan legenda secara horizontal di bawah chart dengan label di samping swatches
  if (useAxis) {
    const legendGroup = svg
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .attr(
        "transform",
        `translate(${marginLeft}, ${height - marginBottom + 90})`
      );

    const legendItemWidth = 19;
    const legendItemHeight = 19;
    const labelOffset = 3;
    const legendSpacingX = 130;
    const legendSpacingY = 10;
    const legendMaxWidth = width - marginLeft - marginRight;
    const itemsPerRow = Math.floor(legendMaxWidth / legendSpacingX);

    subcategoryNames.forEach((subcategory, index) => {
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

export const createAreaChart = (
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
