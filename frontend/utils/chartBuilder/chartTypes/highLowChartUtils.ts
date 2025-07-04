import * as d3 from "d3";
// const d3Cloud = require("d3-cloud");
import { addChartTitle, generateAxisTicks } from "./chartUtils";

interface chartData {
  category: string;
  subcategory?: string;
  high: number;
  low: number;
  close: number;
}

export const createSimpleRangeBar = (
  data: chartData[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: any,
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
  // Filter data
  const filteredData = data.filter(
    (d) =>
      d.high != null &&
      d.low != null &&
      d.close != null &&
      !isNaN(d.high) &&
      !isNaN(d.low) &&
      !isNaN(d.close) &&
      d.category != " "
  );

  console.log("Creating simplerangebar with filtered data", filteredData);

  const marginTop = useAxis ? 80 : 0;
  const marginRight = useAxis ? 30 : 0;
  const marginBottom = useAxis ? 30 : 0;
  const marginLeft = useAxis ? 80 : 0;
  // Axis scale options
  let yMin = d3.min(filteredData, (d) => d.low) as number;
  let yMax = d3.max(filteredData, (d) => d.high) as number;
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
    .domain(filteredData.map((d) => d.category))
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

  svg
    .append("g")
    .selectAll("rect")
    .data(filteredData)
    .join("rect")
    .attr("x", (d) => x(d.category) || 0)
    .attr("y", (d) => y(d.high))
    .attr("height", (d) => y(d.low) - y(d.high))
    .attr("width", x.bandwidth())
    .attr("fill", (d, i) =>
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[i % chartColors.length]
        : "steelblue"
    );

  // Menambahkan close value
  svg
    .append("g")
    .attr("fill", "black")
    .selectAll("circle")
    .data(filteredData)
    .join("circle")
    .attr("cx", (d) => {
      const categoryX = x(d.category);
      return categoryX !== undefined ? categoryX + x.bandwidth() / 2 : 0;
    })
    .attr("cy", (d) => y(d.close))
    .attr("r", 3);

  if (useAxis) {
    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0, ${height - marginBottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    // Add X axis label if provided
    if (axisLabels?.x) {
      svg
        .append("text")
        .attr("x", (width + marginLeft - marginRight) / 2)
        .attr("y", height - marginBottom + 35)
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--foreground))")
        .style("font-size", "14px")
        .text(axisLabels.x);
    }

    // Y axis
    const yAxis = d3.axisLeft(y).tickFormat(d3.format(".2s"));
    if (majorIncrement && majorIncrement > 0) {
      const ticks = generateAxisTicks(yMin, yMax, majorIncrement);
      if (ticks) yAxis.tickValues(ticks);
    }
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft}, 0)`)
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

// export const createClusteredRangeBar = (
//   data: {
//     category: string;
//     subcategory: string;
//     low: number;
//     high: number;
//     close: number;
//   }[], // Add subcategory to data
//   width: number,
//   height: number,
//   useAxis: boolean = true
// ) => {
//   console.log("Creating Clusteredrangebar with data", data);
//   const marginTop = useAxis ? 30 : 0;
//   const marginRight = useAxis ? 30 : 0;
//   const marginBottom = useAxis ? 30 : 0;
//   const marginLeft = useAxis ? 30 : 0;

//   // Group data by category
//   const categories = Array.from(new Set(data.map((d) => d.category)));
//   const subcategories = Array.from(new Set(data.map((d) => d.subcategory)));

//   const color = d3
//     .scaleOrdinal()
//     .domain(subcategories)
//     .range(d3.schemeCategory10);

//   // Skala X untuk kategori utama (posisi bar cluster)
//   const x = d3
//     .scaleBand()
//     .domain(categories)
//     .range([marginLeft, width - marginRight])
//     .padding(0.1);

//   // Skala X untuk sub-kategori dalam kategori utama (klaster)
//   const xSub = d3
//     .scaleBand()
//     .domain(subcategories)
//     .range([0, x.bandwidth()])
//     .padding(0.05);

//   // Skala Y berdasarkan nilai
//   const y = d3
//     .scaleLinear()
//     .domain([
//       d3.min(data, (d) => d.low) as number,
//       d3.max(data, (d) => d.high) as number,
//     ])
//     .range([height - marginBottom, marginTop]);

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

//   // Grouping data by category and subcategory
//   const groupedData = d3.group(data, (d) => d.category);

//   // Create bars for each category and subcategory
//   const categoryGroup = svg
//     .append("g")
//     .selectAll("g")
//     .data(Array.from(groupedData))
//     .join("g")
//     .attr("transform", ([category]) => `translate(${x(category)}, 0)`);

//   categoryGroup
//     .selectAll("rect")
//     .data(([category, values]) => values)
//     .join("rect")
//     .attr("x", (d) => xSub(d.subcategory) ?? 0) // Position bars inside clusters
//     .attr("y", (d) => y(d.high))
//     .attr("height", (d) => y(d.low) - y(d.high))
//     .attr("width", xSub.bandwidth())
//     .attr("fill", (d) => color(d.subcategory) as string);

//   // Add the close value as a dot for each subcategory
//   svg
//     .append("g")
//     .attr("fill", "black")
//     .selectAll("circle")
//     .data(data)
//     .join("circle")
//     .attr("cx", (d) => {
//       const categoryX = x(d.category);
//       const subcategoryX = xSub(d.subcategory);

//       // Check if both categoryX and subcategoryX are defined, otherwise default to 0
//       return categoryX !== undefined && subcategoryX !== undefined
//         ? categoryX + subcategoryX + xSub.bandwidth() / 2
//         : 0; // Fallback value if either is undefined
//     })

//     .attr("cy", (d) => y(d.close))
//     .attr("r", 3);

//   // Add axes if needed
//   if (useAxis) {
//     svg
//       .append("g")
//       .attr("transform", `translate(0, ${height - marginBottom})`)
//       .call(d3.axisBottom(x).tickSizeOuter(0));

//     svg
//       .append("g")
//       .attr("transform", `translate(${marginLeft}, 0)`)
//       .call(d3.axisLeft(y).tickFormat((y) => (+y * 1).toFixed(0)))
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
//     // Tambahkan legenda
//     const legend = svg
//       .append("g")
//       .attr("font-family", "sans-serif")
//       .attr("font-size", 10)
//       .attr("text-anchor", "start")
//       .selectAll("g")
//       .data(subcategories)
//       .join("g")
//       .attr("transform", (d, i) => `translate(${width - 100},${i * 20})`);

//     const legendItemWidth = 19;
//     const legendItemHeight = 19;
//     const labelOffset = 5; // Offset to move text a little further right

//     legend
//       .append("rect")
//       .attr("width", legendItemWidth)
//       .attr("height", legendItemHeight)
//       .attr("fill", (d) => color(d) as string);

//     legend
//       .append("text")
//       .attr("x", legendItemWidth + labelOffset) // Move text to the right of the rectangle
//       .attr("y", legendItemHeight / 2)
//       .attr("dy", "0.35em") // Vertically center the text
//       .text((d) => d);
//   }

//   return svg.node();
// };

export const createClusteredRangeBar = (
  data: {
    category: string;
    subcategory: string;
    low: number;
    high: number;
    close: number;
  }[], // Add subcategory to data
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: any,
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
  // Filter out data where high, low, or close are null, undefined, empty string, or NaN
  const filteredData = data.filter(
    (d) =>
      d.high != null &&
      d.low != null &&
      d.close != null && // Check for null or undefined
      !isNaN(d.high) &&
      !isNaN(d.low) &&
      !isNaN(d.close) // Check for NaN
  );

  console.log("Creating Clusteredrangebar with filtered data", filteredData);

  // Margin dinamis berdasarkan title dan axis labels
  const marginTop = useAxis ? (titleOptions ? 80 : 30) : titleOptions ? 60 : 0;
  const marginRight = useAxis ? 30 : 0;
  const marginBottom = useAxis ? (axisLabels?.x ? 60 : 30) : 0;
  const marginLeft = useAxis ? (axisLabels?.y ? 60 : 30) : 0;

  // Group data by category
  const categories = Array.from(new Set(filteredData.map((d) => d.category)));
  const subcategories = Array.from(
    new Set(filteredData.map((d) => d.subcategory))
  );

  // Skala warna dengan opsi custom colors
  const color = d3
    .scaleOrdinal()
    .domain(subcategories)
    .range(
      chartColors && chartColors.length > 0 ? chartColors : d3.schemeCategory10
    );

  // Skala X untuk kategori utama
  const x = d3
    .scaleBand()
    .domain(categories)
    .range([marginLeft, width - marginRight])
    .padding(0.1);

  // Skala X untuk sub-kategori dalam kategori utama
  const xSub = d3
    .scaleBand()
    .domain(subcategories)
    .range([0, x.bandwidth()])
    .padding(0.05);

  // Skala Y berdasarkan nilai dengan axis scale options
  let yMin = d3.min(filteredData, (d) => d.low) as number;
  let yMax = d3.max(filteredData, (d) => d.high) as number;
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

  // Add title if provided
  if (titleOptions) {
    // Fungsi helper untuk menambahkan title (asumsi sudah ada di utils)
    svg
      .append("text")
      .attr("x", (width + marginLeft + marginRight) / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("font-size", titleOptions.titleFontSize || 16)
      .attr("font-weight", "bold")
      .attr("fill", titleOptions.titleColor || "black")
      .text(titleOptions.title || "");

    if (titleOptions.subtitle) {
      svg
        .append("text")
        .attr("x", (width + marginLeft + marginRight) / 2)
        .attr("y", 50)
        .attr("text-anchor", "middle")
        .attr("font-size", titleOptions.subtitleFontSize || 12)
        .attr("fill", titleOptions.subtitleColor || "gray")
        .text(titleOptions.subtitle);
    }
  }

  // Grouping data by category and subcategory
  const groupedData = d3.group(filteredData, (d) => d.category);

  // Create bars untuk setiap category dan subcategory
  const categoryGroup = svg
    .append("g")
    .selectAll("g")
    .data(Array.from(groupedData))
    .join("g")
    .attr("transform", ([category]) => `translate(${x(category)}, 0)`);

  categoryGroup
    .selectAll("rect")
    .data(([category, values]) => values)
    .join("rect")
    .attr("x", (d) => xSub(d.subcategory) ?? 0)
    .attr("y", (d) => y(d.high))
    .attr("height", (d) => y(d.low) - y(d.high))
    .attr("width", xSub.bandwidth())
    .attr("fill", (d) => color(d.subcategory) as string);

  // Add close value
  svg
    .append("g")
    .attr("fill", "black")
    .selectAll("circle")
    .data(filteredData)
    .join("circle")
    .attr("cx", (d) => {
      const categoryX = x(d.category);
      const subcategoryX = xSub(d.subcategory);

      return categoryX !== undefined && subcategoryX !== undefined
        ? categoryX + subcategoryX + xSub.bandwidth() / 2
        : 0;
    })
    .attr("cy", (d) => y(d.close))
    .attr("r", 3);

  // Menambahkan axis
  if (useAxis) {
    // X axis
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

    // Add X axis label if provided
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

    // Y axis
    const yAxis = d3.axisLeft(y).tickFormat(d3.format(".2s"));
    if (majorIncrement && majorIncrement > 0) {
      const ticks = [];
      for (let i = yMin; i <= yMax; i += majorIncrement) {
        ticks.push(i);
      }
      if (ticks.length > 0) yAxis.tickValues(ticks);
    }

    svg
      .append("g")
      .attr("transform", `translate(${marginLeft}, 0)`)
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
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x", -(height - marginTop - marginBottom) / 2 - marginTop)
        .attr("dy", "1em")
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--foreground))")
        .style("font-size", "14px")
        .text(axisLabels.y);
    }

    // Menambahkan legenda
    const legendItemWidth = 19;
    const legendItemHeight = 19;
    const labelOffset = 5;

    const legend = svg
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .selectAll("g")
      .data(subcategories)
      .join("g")
      .attr(
        "transform",
        (d, i) =>
          `translate(${i * (legendItemWidth + 80) + 20},${
            height - marginBottom + 50
          })`
      );

    legend
      .append("rect")
      .attr("width", legendItemWidth)
      .attr("height", legendItemHeight)
      .attr("fill", (d) => color(d) as string);

    legend
      .append("text")
      .attr("x", legendItemWidth + labelOffset)
      .attr("y", legendItemHeight / 2)
      .attr("dy", "0.35em")
      .attr("fill", "hsl(var(--foreground))")
      .text((d) => d);
  }

  return svg.node();
};

export const createHighLowCloseChart = (
  data: chartData[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: any,
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
  // Filter out data where high, low, or close are null, undefined, empty string, or NaN
  const filteredData = data.filter(
    (d) =>
      d.high != null &&
      d.low != null &&
      d.close != null &&
      !isNaN(d.high) &&
      !isNaN(d.low) &&
      !isNaN(d.close) &&
      d.category != " "
  );

  console.log("Creating highlowclose with filtered data", filteredData);

  // Margin dinamis berdasarkan title dan axis labels
  const marginTop = useAxis ? (titleOptions ? 80 : 30) : titleOptions ? 60 : 0;
  const marginRight = useAxis ? 30 : 0;
  const marginBottom = useAxis ? (axisLabels?.x ? 60 : 30) : 0;
  const marginLeft = useAxis ? (axisLabels?.y ? 60 : 30) : 0;

  const x = d3
    .scaleBand()
    .domain(filteredData.map((d) => d.category))
    .range([marginLeft, width - marginRight])
    .padding(0.2);

  // Axis scale options
  let yMin = d3.min(filteredData, (d) => d.low) as number;
  let yMax = d3.max(filteredData, (d) => d.high) as number;
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

  // Add title if provided
  if (titleOptions) {
    addChartTitle(svg, titleOptions);
  }

  // Menambahkan garis vertikal untuk high-low range
  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", (d, i) =>
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[i % chartColors.length]
        : "black"
    )
    .selectAll("line")
    .data(filteredData)
    .join("line")
    .attr("x1", (d) => {
      const categoryX = x(d.category);
      return categoryX !== undefined ? categoryX + x.bandwidth() / 2 : 0;
    })
    .attr("x2", (d) => {
      const categoryX = x(d.category);
      return categoryX !== undefined ? categoryX + x.bandwidth() / 2 : 0;
    })
    .attr("y1", (d) => y(d.high))
    .attr("y2", (d) => y(d.low))
    .attr("stroke-width", 2);

  // Menambahkan garis horizontal untuk high-low range atas
  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", (d, i) =>
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[i % chartColors.length]
        : "black"
    )
    .selectAll("line")
    .data(filteredData)
    .join("line")
    .attr("x1", (d) => {
      const categoryX = x(d.category);
      const range = y(d.high) - y(d.low); // Calculate dynamic range
      return categoryX !== undefined
        ? categoryX + x.bandwidth() / 2 - range / 10
        : 0; // Centering based on range
    })
    .attr("x2", (d) => {
      const categoryX = x(d.category);
      const range = y(d.high) - y(d.low); // Calculate dynamic range
      return categoryX !== undefined
        ? categoryX + x.bandwidth() / 2 + range / 10
        : 0; // Centering based on range
    })
    .attr("y1", (d) => y(d.high))
    .attr("y2", (d) => y(d.high))
    .attr("stroke-width", 2);

  // Menambahkan garis horizontal untuk high-low range bawah
  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", (d, i) =>
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[i % chartColors.length]
        : "black"
    )
    .selectAll("line")
    .data(filteredData)
    .join("line")
    .attr("x1", (d) => {
      const categoryX = x(d.category);
      const range = y(d.high) - y(d.low); // Calculate dynamic range
      return categoryX !== undefined
        ? categoryX + x.bandwidth() / 2 - range / 10
        : 0; // Centering based on range
    })
    .attr("x2", (d) => {
      const categoryX = x(d.category);
      const range = y(d.high) - y(d.low); // Calculate dynamic range
      return categoryX !== undefined
        ? categoryX + x.bandwidth() / 2 + range / 10
        : 0; // Centering based on range
    })
    .attr("y1", (d) => y(d.low))
    .attr("y2", (d) => y(d.low))
    .attr("stroke-width", 2);

  // Menambahkan titik untuk nilai close, tepat di atas kategori
  svg
    .append("g")
    .attr("fill", (d, i) =>
      Array.isArray(chartColors) && chartColors.length > 0
        ? chartColors[i % chartColors.length]
        : "black"
    )
    .selectAll("circle")
    .data(filteredData)
    .join("circle")
    .attr("cx", (d) => {
      const categoryX = x(d.category);
      return categoryX !== undefined ? categoryX + x.bandwidth() / 2 : 0; // Check if categoryX is defined
    })
    .attr("cy", (d) => y(d.close))
    .attr("r", 4); // Ukuran titik

  // Menambahkan label pada sumbu X dan Y
  if (useAxis) {
    // X-axis
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - marginBottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    // X-axis label
    if (axisLabels?.x) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height + marginBottom - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "var(--foreground)")
        .text(axisLabels.x);
    }

    // Y-axis with major increment support
    const yAxis = majorIncrement
      ? d3.axisLeft(y).ticks(Math.ceil((yMax - yMin) / majorIncrement))
      : d3.axisLeft(y);

    svg
      .append("g")
      .attr("transform", `translate(${marginLeft}, 0)`)
      .call(yAxis.tickFormat((y) => (+y * 1).toFixed(0)))
      .call((g: any) => g.select(".domain").remove());

    // Y-axis label
    if (axisLabels?.y) {
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 15)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "var(--foreground)")
        .text(axisLabels.y);
    }
  }

  return svg.node();
};

export const createDifferenceArea = (
  data: { category: string; value0: number; value1: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  titleOptions?: any,
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
  console.log("Creating differencearea with data", data);

  // Filter out invalid data (NaN, null, undefined) for value0 and value1
  const filteredData = data.filter(
    (d) =>
      d.value0 != null &&
      d.value1 != null &&
      !isNaN(d.value0) &&
      !isNaN(d.value1) &&
      d.category != " "
  );

  console.log("Filtered Data", filteredData);

  // Tambahkan uniqueId ke setiap data point untuk X axis
  const processedData = filteredData.map((d, i) => ({
    ...d,
    uniqueId: `${d.category}_${i}`,
    displayLabel: d.category,
  }));

  // Margin dinamis berdasarkan title dan axis labels
  const marginTop = useAxis ? (titleOptions ? 80 : 30) : titleOptions ? 60 : 0;
  const marginRight = useAxis ? 30 : 0;
  const marginBottom = useAxis ? (axisLabels?.x ? 60 : 50) : 0;
  const marginLeft = useAxis ? (axisLabels?.y ? 60 : 30) : 0;

  // Skala X: satu band per data point, urut sesuai data
  const x = d3
    .scaleBand()
    .domain(processedData.map((d) => d.uniqueId))
    .range([marginLeft, width - marginRight])
    .padding(0.1);

  // Skala Y dengan axis scale options
  let yMin = d3.min(processedData, (d) => Math.min(d.value0, d.value1)) ?? 0;
  let yMax = d3.max(processedData, (d) => Math.max(d.value0, d.value1)) ?? 100;

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

  // Warna area - gunakan custom colors jika ada
  const colors = {
    above: (chartColors && chartColors[0]) || "#1F77B4",
    below: (chartColors && chartColors[1]) || "#FF7F0E",
  };

  // SVG Container
  const svg = d3
    .create("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;")
    .datum(processedData);

  // Tambahkan title jika ada
  if (titleOptions) {
    if (titleOptions.title) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .style("font-size", `${titleOptions.titleFontSize || 16}px`)
        .style("font-weight", "bold")
        .style("fill", titleOptions.titleColor || "hsl(var(--foreground))")
        .text(titleOptions.title);
    }

    if (titleOptions.subtitle) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", 45)
        .attr("text-anchor", "middle")
        .style("font-size", `${titleOptions.subtitleFontSize || 12}px`)
        .style(
          "fill",
          titleOptions.subtitleColor || "hsl(var(--muted-foreground))"
        )
        .text(titleOptions.subtitle);
    }
  }

  // Tampilkan sumbu jika useAxis = true
  if (useAxis) {
    // Major increment untuk Y axis
    let yTicks: number[] | undefined;
    if (axisScaleOptions?.y?.majorIncrement) {
      const majorInc = Number(axisScaleOptions.y.majorIncrement);
      yTicks = [];
      for (let val = yMin; val <= yMax; val += majorInc) {
        yTicks.push(val);
      }
    }

    // Sumbu X: satu band per data point, label pakai nama kategori asli
    svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(
        d3.axisBottom(x).tickFormat((d) => {
          const dataPoint = processedData.find((item) => item.uniqueId === d);
          return dataPoint ? dataPoint.displayLabel : d;
        })
      )
      .call((g) => g.select(".domain").remove());

    // Sumbu Y
    const yAxisGen = yTicks
      ? d3.axisLeft(y).tickValues(yTicks)
      : d3.axisLeft(y);

    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxisGen)
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("x2", width - marginLeft - marginRight)
          .attr("stroke-opacity", 0.1)
      );

    // Add X axis label if provided
    if (axisLabels?.x) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
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
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--foreground))")
        .style("font-size", "14px")
        .text(axisLabels.y);
    }
  }

  // Area di atas garis tengah (value1 > value0)
  const areaAbove = d3
    .area<(typeof processedData)[0]>()
    .curve(d3.curveStep)
    .x((d) => (x(d.uniqueId) ?? 0) + x.bandwidth() / 2)
    .y0((d) => y(d.value0))
    .y1((d) => y(d.value1));

  // Area di bawah garis tengah (value0 > value1)
  const areaBelow = d3
    .area<(typeof processedData)[0]>()
    .curve(d3.curveStep)
    .x((d) => (x(d.uniqueId) ?? 0) + x.bandwidth() / 2)
    .y0((d) => y(d.value1))
    .y1((d) => y(d.value0));

  // Filter data agar area tidak tumpang tindih
  const dataAbove = processedData.map((d) =>
    d.value1 > d.value0
      ? { ...d, value0: d.value0, value1: d.value1 }
      : { ...d, value0: d.value1, value1: d.value1 }
  );

  const dataBelow = processedData.map((d) =>
    d.value0 > d.value1
      ? { ...d, value0: d.value0, value1: d.value1 }
      : { ...d, value0: d.value0, value1: d.value0 }
  );

  // Buat grup untuk area warna
  const areaGroup = svg.append("g");

  // Area biru (hanya untuk value1 > value0)
  areaGroup
    .append("path")
    .attr("fill", colors.above)
    .attr("fill-opacity", "0.7")
    .attr("d", areaAbove(dataAbove));

  // Area oranye (hanya untuk value0 > value1)
  areaGroup
    .append("path")
    .attr("fill", colors.below)
    .attr("fill-opacity", "0.7")
    .attr("d", areaBelow(dataBelow));

  // Garis tengah antara value0 dan value1
  svg
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr(
      "d",
      d3
        .line<(typeof processedData)[0]>()
        .curve(d3.curveStep)
        .x((d) => (x(d.uniqueId) ?? 0) + x.bandwidth() / 2)
        .y((d) => y(d.value0))(processedData)
    );

  if (useAxis) {
    // Tambahkan legenda
    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${width - marginRight - 100}, ${marginTop})`
      );

    const legendItems = [
      { color: colors.above, label: "Value1 > Value0" },
      { color: colors.below, label: "Value0 > Value1" },
    ];

    legendItems.forEach((item, index) => {
      const g = legend
        .append("g")
        .attr("transform", `translate(0, ${index * 20})`);

      g.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", item.color)
        .attr("fill-opacity", 0.7);

      g.append("text")
        .attr("x", 16)
        .attr("y", 6)
        .attr("dy", "0.35em")
        .text(item.label)
        .style("font", "10px sans-serif");
    });
  }

  return svg.node();
};

// export const createWordCloud = (
//   words: string[], // Data berupa array kata
//   width: number, // Lebar SVG
//   height: number, // Tinggi SVG
//   options: {
//     size?: (group: string[]) => number; // Fungsi untuk menentukan ukuran kata
//     word?: (d: string) => string; // Fungsi untuk menentukan teks
//     marginTop?: number; // Margin atas
//     marginRight?: number; // Margin kanan
//     marginBottom?: number; // Margin bawah
//     marginLeft?: number; // Margin kiri
//     maxWords?: number; // Jumlah kata maksimal yang ditampilkan
//     fontFamily?: string; // Keluarga font
//     fontScale?: number; // Skala ukuran font
//     fill?: string | ((d: string) => string); // Warna font
//     padding?: number; // Padding antar kata
//     rotate?: number | ((d: string) => number); // Rotasi kata
//     invalidation?: Promise<any>; // Saat promise ini selesai, hentikan simulasi
//   } = {}
// ) => {
//   const {
//     size = (group) => group.length, // default size berdasarkan jumlah kata
//     word = (d) => d, // default kata langsung dari input
//     marginTop = 10, // default margin top 10px
//     marginRight = 10, // default margin right 10px
//     marginBottom = 10, // default margin bottom 10px
//     marginLeft = 10, // default margin left 10px
//     maxWords = 1000, // maksimal kata yang ditampilkan 100
//     fontFamily = "sans-serif", // font default sans-serif
//     fontScale = 8, // ukuran font default 20
//     fill = "black", // warna font default hitam
//     padding = 5, // padding antar kata default 5px
//     rotate = 0, // rotasi default 0
//     invalidation,
//   } = options;

//   // Menghitung frekuensi kata dan menyiapkan data untuk word cloud
//   const data = d3
//     .rollups(words, size, (w) => w)
//     .sort(([, a], [, b]) => d3.descending(a, b))
//     .slice(0, maxWords)
//     .map(([key, size]) => ({ text: word(key), size }));

//   // Membuat SVG dengan ukuran dan styling sesuai parameter
//   const svg = d3
//     .create("svg")
//     .attr("viewBox", [0, 0, width, height])
//     .attr("width", width)
//     .attr("font-family", fontFamily)
//     .attr("text-anchor", "middle")
//     .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

//   const g = svg
//     .append("g")
//     .attr("transform", `translate(${marginLeft},${marginTop})`);

//   // Membuat cloud menggunakan d3Cloud
//   const cloud = d3Cloud() // Now calling d3Cloud correctly
//     .size([width - marginLeft - marginRight, height - marginTop - marginBottom])
//     .words(data)
//     .padding(padding)
//     .rotate(rotate)
//     .font(fontFamily)
//     .fontSize((d: { size: number }) => Math.sqrt(d.size) * fontScale) // Memperbaiki tipe d
//     .on(
//       "word",
//       ({
//         size,
//         x,
//         y,
//         rotate,
//         text,
//       }: {
//         size: number;
//         x: number;
//         y: number;
//         rotate: number;
//         text: string;
//       }) => {
//         // Tipe eksplisit untuk parameter
//         g.append("text")
//           .datum(text)
//           .attr("font-size", size)
//           .attr("fill", typeof fill === "function" ? fill(text) : fill) // Handle fill properly
//           .attr("transform", `translate(${x},${y}) rotate(${rotate})`)
//           .text(text);
//       }
//     );

//   cloud.start();

//   // Handle invalidation
//   if (invalidation) {
//     invalidation.then(() => cloud.stop());
//   }

//   return svg.node();
// };
