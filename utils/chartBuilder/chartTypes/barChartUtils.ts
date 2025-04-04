import * as d3 from "d3";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

// import * as echarts from "echarts/core";
// import { BarChart } from "echarts/charts";
// import { CanvasRenderer } from "echarts/renderers";
// import { Bar3DChart } from "echarts-gl/charts";
// import { Grid3DComponent } from "echarts-gl/components";
// import {
//   TooltipComponent,
//   GridComponent,
//   VisualMapComponent,
// } from "echarts/components";
// import {
//   TitleComponent, // 🔥 Tambahkan ini!
// } from "echarts/components";

// Registrasi komponen ke ECharts
// echarts.use([
//   Grid3DComponent,
//   Bar3DChart,
//   TitleComponent, // 🔥 Jangan lupa register ini juga!
//   CanvasRenderer,
//   BarChart,
//   TooltipComponent,
//   GridComponent,
//   VisualMapComponent,
// ]);

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
  data: { category: string; value: number }[], // Data berupa array objek { category: string; value: number }
  width: number,
  height: number,
  useAxis: boolean = true
) => {
  console.log("Creating chart with data:", data);

  // Menentukan margin hanya jika axis digunakan
  const marginTop = useAxis ? 30 : 0;
  const marginRight = useAxis ? 30 : 0;
  const marginBottom = useAxis ? 30 : 0;
  const marginLeft = useAxis ? 30 : 0;

  // Menentukan skala untuk sumbu X dan Y
  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.category))
    .range([marginLeft, width - marginRight])
    .padding(0.1);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) as number])
    .range([height - marginBottom, marginTop]);

  // Membuat elemen SVG baru di dalam DOM
  const svg = d3
    .create("svg") // Membuat SVG baru
    .attr("width", width + marginLeft + marginRight)
    .attr("height", height + marginTop + marginBottom)
    .attr("viewBox", [
      0,
      0,
      width + marginLeft + marginRight,
      height + marginTop + marginBottom,
    ])
    .attr("style", "max-width: 100%; height: auto;");

  // Menambahkan rectangle untuk setiap bar
  svg
    .append("g")
    .attr("fill", "steelblue")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", (d: { category: string; value: number }) => x(d.category) || 0)
    .attr("y", (d: { category: string; value: number }) => y(d.value))
    .attr(
      "height",
      (d: { category: string; value: number }) =>
        (y(0) as number) - (y(d.value) as number)
    )
    .attr("width", x.bandwidth());

  // Jika axis digunakan, tambahkan sumbu X dan Y
  if (useAxis) {
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - marginBottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    // Y-Axis (Vertical)
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft}, 0)`)
      .call(d3.axisLeft(y).tickFormat((y) => (+y * 1).toFixed(0)))
      .call((g: any) => g.select(".domain").remove())
      .call((g: any) =>
        g
          .append("text")
          .attr("x", -marginLeft)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text("↑ Value")
      );
  }

  // Mengembalikan node SVG
  return svg.node();
};

export const createHorizontalBarChart = (
  data: { category: string; value: number }[],
  width: number,
  height: number,
  useAxis: boolean = true,
  barColor: string = "steelblue",
  threshold: number = 0.007
) => {
  // Menentukan margin
  const marginTop = useAxis ? 30 : 0;
  const marginRight = useAxis ? 30 : 0;
  const marginBottom = useAxis ? 30 : 0;
  const marginLeft = useAxis ? 30 : 0;

  // Skala untuk sumbu X (horizontal) dan Y (vertikal)
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) as number])
    .range([marginLeft, width - marginRight]);

  const y = d3
    .scaleBand()
    .domain(data.map((d) => d.category)) //
    .rangeRound([marginTop, height - marginBottom])
    .padding(0.1);

  // Format untuk nilai yang ditampilkan pada bar
  const format = x.tickFormat(20, "%");

  // Membuat elemen SVG baru
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  // Menambahkan rect (bar) untuk setiap data
  svg
    .append("g")
    .attr("fill", barColor)
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", x(0))
    .attr("y", (d) => y(d.category) || 0)
    .attr("width", (d) => x(d.value) - x(0))
    .attr("height", y.bandwidth());

  // Menambahkan label pada bar
  // svg
  //   .append("g")
  //   .attr("fill", "white")
  //   .attr("text-anchor", "end")
  //   .selectAll("text")
  //   .data(data)
  //   .join("text")
  //   .attr("x", (d) => x(d.value)) // Posisi horizontal teks di akhir bar
  //   .attr("y", (d) => {
  //     // Pastikan kategori ada dalam domain y
  //     const yPosition = y(d.category);
  //     return yPosition ? yPosition + y.bandwidth() / 2 : 0; // Jika y(d.category) undefined, fallback ke 0
  //   }) // Posisi vertikal di tengah bar
  //   .attr("dy", "0.35em")
  //   .attr("dx", -4)
  //   .text((d) => format(d.value)) // Menampilkan nilai bar
  //   .call(
  //     (text) =>
  //       text
  //         .filter((d) => x(d.value) - x(0) < threshold) // Untuk bar yang pendek
  //         .attr("dx", +4) // Menggeser teks ke kanan jika bar sangat pendek
  //         .attr("fill", "black") // Warna teks hitam
  //         .attr("text-anchor", "start") // Teks disusun ke kiri
  //   );

  // Menambahkan sumbu X jika useAxis true
  if (useAxis) {
    // Sumbu X (Horizontal)
    svg
      .append("g")
      .attr("transform", `translate(0,${marginTop})`)
      .call(d3.axisTop(x).ticks(width / 80))
      .call((g) => g.select(".domain").remove());

    // Sumbu Y (Vertical)
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).tickSizeOuter(0));
  }

  // Mengembalikan elemen SVG
  return svg.node(); // Mengembalikan node SVG untuk ditambahkan ke DOM
};

// export const createVerticalBarChart = (
//   svg: any,
//   data: number[],
//   width: number,
//   height: number
// ) => {
//   svg
//     .attr("width", width)
//     .attr("height", height)
//     .selectAll("rect")
//     .data(data)
//     .enter()
//     .append("rect")
//     .attr("x", (d: number, i: number) => i * (width / data.length))
//     .attr("y", (d: number) => height - d)
//     .attr("width", width / data.length - 5)
//     .attr("height", (d: number) => d)
//     .attr("fill", "#69b3a2");
// };

export const createVerticalStackedBarChart = (
  data: ChartData[],
  width: number,
  height: number,
  useAxis: boolean = true
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
  const marginTop = useAxis ? 20 : 0;
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

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(series, (s) => d3.max(s, (d) => d[1]))!])
    .nice()
    .range([height - marginBottom, marginTop]);

  // Warna
  let colorScheme: readonly string[];
  if (subcategories.length <= 3) {
    // Gunakan skema minimum 3 warna jika subcategories <= 3 (dibalik)
    colorScheme = d3.schemeBlues[3].slice().reverse();
  } else if (subcategories.length <= 9) {
    // Gunakan skema yang sesuai dengan jumlah subcategories (dibalik)
    colorScheme = d3.schemeBlues[subcategories.length].slice().reverse();
  } else {
    // Jika lebih dari 9, gunakan skema maksimum dan dibalik
    colorScheme = d3.schemeBlues[9].slice().reverse();
  }

  const color = d3
    .scaleOrdinal<string>()
    .domain(subcategories)
    .range(colorScheme);

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
    .attr("y", (d) => y(d[1]))
    .attr("height", (d) => y(d[0]) - y(d[1]))
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

    // Sumbu Y
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(null, "s"))
      .call((g) => g.select(".domain").remove());

    // Menambahkan label sumbu X (opsional)
    svg
      .append("text")
      .attr("x", (width - marginLeft - marginRight) / 2 + marginLeft)
      .attr("y", height - marginBottom + 40)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Category");

    // Menambahkan label sumbu Y (opsional)
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(marginTop + (height - marginBottom - marginTop) / 2))
      .attr("y", marginLeft - 40)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Value");

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
  useAxis: boolean = true
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

  console.log(
    "Creating horizontal stacked bar chart with valid data:",
    validData
  );

  // Definisi margin
  const marginTop = useAxis ? 20 : 0;
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
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(series, (s) => d3.max(s, (d) => d[1]))!])
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
    // Gunakan skema minimum 3 warna jika subcategories <= 3 (dibalik)
    colorScheme = d3.schemeBlues[3].slice().reverse();
  } else if (subcategories.length <= 9) {
    // Gunakan skema yang sesuai dengan jumlah subcategories (dibalik)
    colorScheme = d3.schemeBlues[subcategories.length].slice().reverse();
  } else {
    // Jika lebih dari 9, gunakan skema maksimum dan dibalik
    colorScheme = d3.schemeBlues[9].slice().reverse();
  }

  const color = d3
    .scaleOrdinal<string>()
    .domain(subcategories)
    .range(colorScheme)
    .unknown("#ccc");

  // Membuat elemen SVG
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

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
    .attr("x", (d) => x(d[0]))
    .attr("height", y.bandwidth())
    .attr("width", (d) => x(d[1]) - x(d[0]))
    .append("title")
    .text((d) => `${d.data.category}, ${d.key}: ${d[1] - d[0]}`);

  // Menambahkan sumbu dan legend jika `useAxis` true
  if (useAxis) {
    // Sumbu X
    svg
      .append("g")
      .attr("transform", `translate(0,${marginTop})`)
      .call(d3.axisTop(x).ticks(width / 80, "s"))
      .call((g) => g.selectAll(".domain").remove());

    // Sumbu Y
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).tickSizeOuter(0))
      .call((g) => g.selectAll(".domain").remove());

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
 * Fungsi Grouped Bar Chart
 *
 * @param data - Array dari objek ChartData
 * @param width - Lebar SVG
 * @param height - Tinggi SVG
 * @param useAxis - Boolean untuk menentukan apakah sumbu akan ditampilkan
 * @returns SVGElement atau null jika data tidak valid
 */

export const createGroupedBarChart = (
  data: ChartData[],
  width: number,
  height: number,
  useAxis: boolean = true
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

  console.log("Creating grouped bar chart with valid data:", validData);

  // Definisi margin
  const marginTop = useAxis ? 20 : 0;
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

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(validData, (d) => d.value)!])
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
    .range(colorScheme)
    .unknown("#ccc");

  // Membuat elemen SVG
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  // Append grup untuk setiap kategori
  svg
    .append("g")
    .selectAll("g")
    .data(formattedData)
    .join("g")
    .attr("transform", (d) => `translate(${x0(d.category)},0)`)
    .selectAll("rect")
    .data((d) => subcategories.map((key) => ({ key, value: d[key] as number })))
    .join("rect")
    .attr("x", (d) => x1(d.key)!)
    .attr("y", (d) => y(d.value))
    .attr("width", x1.bandwidth())
    .attr("height", (d) => y(0) - y(d.value))
    .attr("fill", (d) => color(d.key))
    .append("title")
    .text((d) => `${d.key}: ${d.value}`);

  // Menambahkan sumbu dan legend jika `useAxis` true
  if (useAxis) {
    // Sumbu X
    svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x0))
      .call((g) => g.selectAll(".domain").remove());

    // Sumbu Y
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(null, "s"))
      .call((g) => g.selectAll(".domain").remove());

    // Menambahkan label sumbu X (opsional)
    svg
      .append("text")
      .attr("x", (width - marginLeft - marginRight) / 2 + marginLeft)
      .attr("y", height - marginBottom + 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Category");

    // Menambahkan label sumbu Y (opsional)
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(marginTop + (height - marginBottom - marginTop) / 2))
      .attr("y", marginLeft - 50)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Value");

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
  useAxis: boolean = true
) => {
  console.log("Creating chart with data:", data);

  const marginTop = useAxis ? 30 : 0;
  const marginRight = useAxis ? 30 : 0;
  const marginBottom = useAxis ? 30 : 0;
  const marginLeft = useAxis ? 30 : 0;

  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.category))
    .range([marginLeft, width - marginRight])
    .padding(0.1);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value + d.error) as number])
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
        x(d.category)! + x.bandwidth() / 2 - 5 // Panjang garis horizontal
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
      .call(d3.axisBottom(x).tickSizeOuter(0));

    // Y-Axis (Vertical)
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft}, 0)`)
      .call(d3.axisLeft(y).tickFormat((y) => (+y * 1).toFixed(0)))
      .call((g: any) => g.select(".domain").remove())
      .call((g: any) =>
        g
          .append("text")
          .attr("x", -marginLeft)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text("↑ Value")
      );
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
  useAxis: boolean = true
) => {
  console.log("Creating chart with data:", data);

  const marginTop = useAxis ? 30 : 0;
  const marginRight = useAxis ? 30 : 0;
  const marginBottom = useAxis ? 30 : 0;
  const marginLeft = useAxis ? 30 : 0;

  const categories = Array.from(new Set(data.map((d) => d.category)));
  const subcategories = Array.from(new Set(data.map((d) => d.subcategory)));

  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.category))
    .range([marginLeft, width - marginRight])
    .padding(0.1);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value + d.error) as number])
    .range([height - marginBottom, marginTop]);

  // Define a color scale for the subcategories
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

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

  // Menambahkan error bars dengan warna berdasarkan subkategori
  svg
    .append("g")
    .attr("stroke", "black")
    .selectAll("line")
    .data(data)
    .join("line")
    .attr(
      "x1",
      (d: {
        category: string;
        subcategory: string;
        value: number;
        error: number;
      }) => x(d.category)! + x.bandwidth() / 2
    )
    .attr(
      "x2",
      (d: {
        category: string;
        subcategory: string;
        value: number;
        error: number;
      }) => x(d.category)! + x.bandwidth() / 2
    )
    .attr("y1", (d: { value: number; error: number }) => y(d.value + d.error))
    .attr("y2", (d: { value: number; error: number }) => y(d.value - d.error))
    .attr("stroke-width", 2)
    .attr("stroke", (d: { subcategory: string }) => colorScale(d.subcategory));

  // Menambahkan titik pada setiap kategori untuk menunjukkan nilai dengan warna berdasarkan subkategori
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
    .attr("fill", (d: { subcategory: string }) => colorScale(d.subcategory));

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
    .attr("stroke-width", 2)
    .attr("stroke", (d: { subcategory: string }) => colorScale(d.subcategory));

  svg
    .append("g")
    .attr("stroke", "black")
    .selectAll(".error-cap-bottom")
    .data(data)
    .join("line")
    .attr(
      "x1",
      (d: { category: string; value: number; error: number }) =>
        x(d.category)! + x.bandwidth() / 2 - 5 // Panjang garis horizontal
    )
    .attr(
      "x2",
      (d: { category: string; value: number; error: number }) =>
        x(d.category)! + x.bandwidth() / 2 + 5
    )
    .attr("y1", (d: { value: number; error: number }) => y(d.value - d.error))
    .attr("y2", (d: { value: number; error: number }) => y(d.value - d.error))
    .attr("stroke-width", 2)
    .attr("stroke", (d: { subcategory: string }) => colorScale(d.subcategory));

  // Jika axis digunakan, tambahkan sumbu X dan Y
  if (useAxis) {
    // X-Axis (Horizontal)
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - marginBottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    // Y-Axis (Vertical)
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft}, 0)`)
      .call(d3.axisLeft(y).tickFormat((y) => (+y * 1).toFixed(0)))
      .call((g: any) => g.select(".domain").remove())
      .call((g: any) =>
        g
          .append("text")
          .attr("x", -marginLeft)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text("↑ Value")
      );
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

// export const create3DBarChart = (
//   data: { x: string; y: string; z: number }[],
//   width: number,
//   height: number,
//   useAxis: boolean = true
// ) => {
//   // Bikin container div
//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;

//   console.log("✅ Container dibuat:", container); // Debugging

//   if (!container) {
//     console.error("❌ Container tidak ada!");
//     return null; // Hindari error lebih lanjut
//   }

//   const chart = echarts.init(container, undefined, { width, height });

//   const getUniqueValues = (arr: string[]) => {
//     return arr.filter((value, index, self) => self.indexOf(value) === index);
//   };

//   const option = {
//     title: { text: "3D Bar Chart", left: "center" },
//     grid3D: { boxWidth: 100, boxDepth: 80 },
//     xAxis3D: useAxis
//       ? {
//           type: "category",
//           name: "X",
//           data: getUniqueValues(data.map((d) => d.x)),
//         }
//       : undefined,
//     yAxis3D: useAxis
//       ? {
//           type: "category",
//           name: "Y",
//           data: getUniqueValues(data.map((d) => d.y)),
//         }
//       : undefined,
//     zAxis3D: useAxis
//       ? {
//           type: "value",
//           name: "Z",
//         }
//       : undefined,
//     series: [
//       {
//         type: "bar3D",
//         data: data.map((d) => [d.x, d.y, d.z]),
//         shading: "lambert",
//         label: { show: true, formatter: "{c}" },
//       },
//     ],
//   };

//   chart.setOption(option);

//   console.log("chartOption", option);

//   // Return div container-nya, jadi sama kayak D3
//   return container;
// };

// export const create3DBarChart = (
//   containerId: string,
//   data: { x: string; y: string; z: number }[],
//   useAxis: boolean = true
// ) => {
//   const container = document.getElementById(containerId);

//   if (!container) {
//     console.error("❌ Container tidak ditemukan!");
//     return null;
//   }

//   // Bersihkan kontainer sebelum inisialisasi ulang
//   container.innerHTML = "";

//   const chart = echarts.init(container);

//   const getUniqueValues = (arr: string[]) => {
//     return arr.filter((value, index, self) => self.indexOf(value) === index);
//   };

//   const option = {
//     title: { text: "3D Bar Chart", left: "center" },
//     grid3D: { boxWidth: 100, boxDepth: 80 },
//     xAxis3D: useAxis
//       ? {
//           type: "category",
//           name: "X",
//           data: getUniqueValues(data.map((d) => d.x)),
//         }
//       : undefined,
//     yAxis3D: useAxis
//       ? {
//           type: "category",
//           name: "Y",
//           data: getUniqueValues(data.map((d) => d.y)),
//         }
//       : undefined,
//     zAxis3D: useAxis
//       ? {
//           type: "value",
//           name: "Z",
//         }
//       : undefined,
//     series: [
//       {
//         type: "bar3D",
//         data: data.map((d) => [d.x, d.y, d.z]),
//         shading: "lambert",
//         label: { show: true, formatter: "{c}" },
//       },
//     ],
//   };

//   chart.setOption(option);
//   console.log("chartOption", JSON.stringify(option, null, 2));

//   console.log("✅ Chart berhasil dirender di", container);
//   return chart;
// };

// export const createBarChart = (
//   data: { category: string; value: number }[], // Data untuk bar chart
//   width: number,
//   height: number
// ) => {
//   // Membuat elemen container
//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;

//   // Inisialisasi chart dengan container
//   const chart = echarts.init(container, undefined, {
//     width,
//     height,
//   });

//   // Definisi konfigurasi chart
//   const option = {
//     title: {
//       text: "Bar Chart",
//       left: "center",
//     },
//     tooltip: {
//       trigger: "axis",
//     },
//     xAxis: {
//       type: "category",
//       data: data.map((item) => item.category), // Menentukan kategori pada sumbu X
//     },
//     yAxis: {
//       type: "value",
//     },
//     series: [
//       {
//         type: "bar", // Jenis chart: bar
//         data: data.map((item) => item.value), // Data yang akan digambarkan sebagai bar
//         label: {
//           show: true,
//           position: "top", // Menampilkan nilai pada bagian atas bar
//         },
//       },
//     ],
//   };

//   // Set konfigurasi chart
//   chart.setOption(option);

//   // Kembalikan container chart
//   return container;
// };

// export const create3DBarChart2 = (
//   data: { x: string; y: string; z: number }[],
//   width: number,
//   height: number
// ) => {
//   // Buat container div
//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;
//   container.style.position = "relative";
//   container.style.overflow = "hidden";

//   // Scene & Camera
//   const scene = new THREE.Scene();
//   scene.background = new THREE.Color(0xffffff); // 🔥 Ubah background jadi putih

//   const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
//   camera.position.set(10, 15, 30);
//   camera.lookAt(new THREE.Vector3(0, 5, 0)); // 🔥 Pastikan menghadap sedikit ke atas

//   // Renderer
//   const renderer = new THREE.WebGLRenderer({ antialias: true });
//   renderer.setSize(width, height);
//   container.appendChild(renderer.domElement);

//   // Cahaya
//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // 🔥 Tambah ambient light
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//   pointLight.position.set(10, 20, 30);
//   scene.add(pointLight);

//   // Tambahkan Grid Helper
//   const gridHelper = new THREE.GridHelper(20, 20);
//   scene.add(gridHelper);

//   // Orbit Controls
//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;

//   // Skala sumbu menggunakan D3.js
//   const xScale = d3
//     .scaleBand()
//     .domain(data.map((d) => d.x))
//     .range([-10, 10])
//     .padding(0.2);

//   const zScale = d3
//     .scaleBand()
//     .domain(data.map((d) => d.y))
//     .range([-10, 10])
//     .padding(0.2);

//   const yScale = d3
//     .scaleLinear()
//     .domain([0, d3.max(data, (d) => d.z)!])
//     .range([0, 10]);

//   // Buat batang 3D
//   data.forEach((d) => {
//     const geometry = new THREE.BoxGeometry(1.5, yScale(d.z), 1.5); // 🔥 Lebar batang sedikit dikurangi
//     const material = new THREE.MeshStandardMaterial({
//       color: 0x007bff, // 🔥 Warna lebih kontras
//       metalness: 0.3,
//       roughness: 0.7,
//     });
//     const bar = new THREE.Mesh(geometry, material);

//     bar.position.set(xScale(d.x)!, yScale(d.z) / 2, zScale(d.y)!);
//     scene.add(bar);
//   });

//   // Render loop
//   const animate = () => {
//     requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
//   };
//   animate();

//   return container;
// };

// export const create3DBarChart2 = (
//   data: { x: string; y: string; z: number }[],
//   width: number,
//   height: number
// ) => {
//   // Buat container div
//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;
//   container.style.position = "relative";
//   container.style.overflow = "hidden";

//   // Scene & Camera
//   const scene = new THREE.Scene();
//   scene.background = new THREE.Color(0xf0f0f0); // 🔥 Ubah latar belakang jadi putih

//   const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
//   camera.position.set(15, 20, 30);
//   camera.lookAt(new THREE.Vector3(0, 0, 0));

//   // Renderer untuk objek 3D
//   const renderer = new THREE.WebGLRenderer({ antialias: true });
//   renderer.setSize(width, height);
//   container.appendChild(renderer.domElement);

//   // Renderer untuk label teks
//   const labelRenderer = new CSS2DRenderer();
//   labelRenderer.setSize(width, height);
//   labelRenderer.domElement.style.position = "absolute";
//   labelRenderer.domElement.style.top = "0px";
//   labelRenderer.domElement.style.pointerEvents = "none";
//   container.appendChild(labelRenderer.domElement);

//   // Cahaya
//   const ambientLight = new THREE.AmbientLight(0xffffff, 1); // 🔥 Tambahkan cahaya global
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//   pointLight.position.set(10, 20, 30);
//   scene.add(pointLight);

//   // Tambahkan Grid Helper
//   const gridHelper = new THREE.GridHelper(20, 20);
//   scene.add(gridHelper);

//   // Tambahkan AxesHelper
//   const axesHelper = new THREE.AxesHelper(10);
//   scene.add(axesHelper);

//   // Tambahkan Orbit Controls agar bisa digeser
//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;
//   controls.dampingFactor = 0.05;
//   controls.screenSpacePanning = false;
//   controls.minDistance = 5;
//   controls.maxDistance = 100;

//   // Skala sumbu menggunakan D3.js
//   const xScale = d3
//     .scaleBand()
//     .domain(data.map((d) => d.x))
//     .range([-10, 10])
//     .padding(0.2);
//   const zScale = d3
//     .scaleBand()
//     .domain(data.map((d) => d.y))
//     .range([-10, 10])
//     .padding(0.2);
//   const yScale = d3
//     .scaleLinear()
//     .domain([0, d3.max(data, (d) => d.z)!])
//     .range([0, 10]);

//   // Fungsi untuk membuat label teks
//   const createLabel = (text: string, position: THREE.Vector3) => {
//     const div = document.createElement("div");
//     div.className = "label";
//     div.textContent = text;
//     div.style.color = "black";
//     div.style.fontSize = "14px";
//     div.style.fontWeight = "bold";

//     const label = new CSS2DObject(div);
//     label.position.copy(position);
//     scene.add(label);
//   };

//   // Tambahkan label di sumbu X, Y, Z
//   createLabel("X", new THREE.Vector3(12, 0, 0)); // X
//   createLabel("Y", new THREE.Vector3(0, 12, 0)); // Y
//   createLabel("Z", new THREE.Vector3(0, 0, 12)); // Z

//   // Buat batang 3D
//   data.forEach((d) => {
//     const geometry = new THREE.BoxGeometry(2, yScale(d.z), 2);
//     const material = new THREE.MeshStandardMaterial({ color: "steelblue" });
//     const bar = new THREE.Mesh(geometry, material);

//     bar.position.set(xScale(d.x)!, yScale(d.z) / 2, zScale(d.y)!);
//     scene.add(bar);
//   });

//   // Render loop
//   const animate = () => {
//     requestAnimationFrame(animate);
//     controls.update(); // 🔥 Pastikan OrbitControls tetap diupdate
//     renderer.render(scene, camera);
//     labelRenderer.render(scene, camera);
//   };
//   animate();

//   return container;
// };

// export const create3DBarChart2 = (
//   data: { x: string; y: string; z: number }[],
//   width: number,
//   height: number
// ) => {
//   // Container
//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;
//   container.style.position = "relative";
//   container.style.overflow = "hidden";

//   // Scene
//   const scene = new THREE.Scene();
//   scene.background = new THREE.Color(0xf0f0f0);

//   // Camera
//   const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
//   camera.position.set(15, 20, 30);
//   camera.lookAt(new THREE.Vector3(0, 0, 0));

//   // Renderer
//   const renderer = new THREE.WebGLRenderer({ antialias: true });
//   renderer.setSize(width, height);
//   container.appendChild(renderer.domElement);

//   // Label Renderer
//   const labelRenderer = new CSS2DRenderer();
//   labelRenderer.setSize(width, height);
//   labelRenderer.domElement.style.position = "absolute";
//   labelRenderer.domElement.style.top = "0px";
//   labelRenderer.domElement.style.pointerEvents = "none";
//   container.appendChild(labelRenderer.domElement);

//   // Cahaya
//   const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//   pointLight.position.set(10, 20, 30);
//   scene.add(pointLight);

//   // Orbit Controls
//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;
//   controls.dampingFactor = 0.05;
//   controls.screenSpacePanning = false;
//   controls.minDistance = 5;
//   controls.maxDistance = 100;

//   // Skala sumbu menggunakan D3.js
//   const xScale = d3
//     .scaleBand()
//     .domain(data.map((d) => d.x))
//     .range([-10, 10])
//     .padding(0.2);
//   const zScale = d3
//     .scaleBand()
//     .domain(data.map((d) => d.y))
//     .range([-10, 10])
//     .padding(0.2);
//   const yScale = d3
//     .scaleLinear()
//     .domain([0, d3.max(data, (d) => d.z)!])
//     .range([0, 10]);

//   // Fungsi untuk membuat label teks
//   const createLabel = (text: string, position: THREE.Vector3) => {
//     const div = document.createElement("div");
//     div.className = "label";
//     div.textContent = text;
//     div.style.color = "black";
//     div.style.fontSize = "14px";
//     div.style.fontWeight = "bold";

//     const label = new CSS2DObject(div);
//     label.position.copy(position);
//     scene.add(label);
//   };

//   // Tambahkan GridHelper
//   const gridHelper = new THREE.GridHelper(20, 20);
//   scene.add(gridHelper);

//   // Tambahkan Label untuk Axis
//   createLabel("X", new THREE.Vector3(12, -1, 0));
//   createLabel("Y", new THREE.Vector3(0, 12, 0));
//   createLabel("Z", new THREE.Vector3(0, -1, 12));

//   // Tambahkan label kategori pada sumbu X & Z
//   data.forEach((d) => {
//     createLabel(d.x, new THREE.Vector3(xScale(d.x)!, -1, -11));
//     createLabel(d.y, new THREE.Vector3(-11, -1, zScale(d.y)!));
//   });

//   // Tambahkan angka pada sumbu Y
//   for (let i = 0; i <= 10; i += 2) {
//     createLabel(`${i * 10}`, new THREE.Vector3(-12, i, 0));
//   }

//   // Buat batang 3D
//   data.forEach((d) => {
//     const geometry = new THREE.BoxGeometry(2, yScale(d.z), 2);
//     const material = new THREE.MeshStandardMaterial({ color: "orange" });
//     const bar = new THREE.Mesh(geometry, material);

//     bar.position.set(xScale(d.x)!, yScale(d.z) / 2, zScale(d.y)!);
//     scene.add(bar);
//   });

//   // Render loop
//   const animate = () => {
//     requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
//     labelRenderer.render(scene, camera);
//   };
//   animate();

//   return container;
// };

// export const create3DBarChart2 = (
//   data: { x: string; y: string; z: number }[],
//   width: number,
//   height: number
// ) => {
//   // Buat container div
//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;
//   container.style.position = "relative";
//   container.style.overflow = "hidden";

//   // Scene & Camera
//   const scene = new THREE.Scene();
//   scene.background = new THREE.Color(0xffffff); // 🔥 Ubah background jadi putih

//   const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
//   camera.position.set(10, 15, 30);
//   camera.lookAt(new THREE.Vector3(0, 5, 0)); // 🔥 Pastikan menghadap sedikit ke atas

//   // Renderer
//   const renderer = new THREE.WebGLRenderer({ antialias: true });
//   renderer.setSize(width, height);
//   container.appendChild(renderer.domElement);

//   // Cahaya
//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // 🔥 Tambah ambient light
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//   pointLight.position.set(10, 20, 30);
//   scene.add(pointLight);

//   // Tambahkan Grid Helper
//   const gridHelper = new THREE.GridHelper(20, 20);
//   scene.add(gridHelper);

//   // Orbit Controls
//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;

//   // Skala sumbu menggunakan D3.js
//   const xScale = d3
//     .scaleBand()
//     .domain(data.map((d) => d.x))
//     .range([-10, 10])
//     .padding(0.2);

//   const yScale = d3
//     .scaleBand()
//     .domain(data.map((d) => d.y))
//     .range([-10, 10])
//     .padding(0.2);

//   const zScale = d3
//     .scaleLinear()
//     .domain([0, d3.max(data, (d) => d.z)!])
//     .range([0, 10]);

//   // Buat batang 3D
//   data.forEach((d) => {
//     const geometry = new THREE.BoxGeometry(1.5, zScale(d.z), 1.5); // 🔥 Tinggi batang diambil dari z
//     const material = new THREE.MeshStandardMaterial({
//       color: 0x007bff, // 🔥 Warna lebih kontras
//       metalness: 0.3,
//       roughness: 0.7,
//     });
//     const bar = new THREE.Mesh(geometry, material);

//     bar.position.set(xScale(d.x)!, zScale(d.z) / 2, yScale(d.y)!);
//     scene.add(bar);
//   });

//   // Render loop
//   const animate = () => {
//     requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
//   };
//   animate();

//   return container;
// };

// export const create3DBarChart2 = (
//   data: { x: string; y: string; z: number }[],
//   width: number,
//   height: number
// ) => {
//   // Buat container div
//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;
//   container.style.position = "relative";
//   container.style.overflow = "hidden";

//   // Scene & Camera
//   const scene = new THREE.Scene();
//   scene.background = new THREE.Color(0xffffff);

//   const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
//   camera.position.set(10, 15, 30);
//   camera.lookAt(new THREE.Vector3(0, 5, 0));

//   // Renderer
//   const renderer = new THREE.WebGLRenderer({ antialias: true });
//   renderer.setSize(width, height);
//   container.appendChild(renderer.domElement);

//   // Cahaya
//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//   pointLight.position.set(10, 20, 30);
//   scene.add(pointLight);

//   // Grid Helper
//   const gridHelper = new THREE.GridHelper(20, 20);
//   scene.add(gridHelper);

//   // Orbit Controls
//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;

//   // Skala sumbu menggunakan D3.js
//   const xScale = d3
//     .scaleBand()
//     .domain(data.map((d) => d.x))
//     .range([-10, 10])
//     .padding(0.2);

//   const yScale = d3
//     .scaleBand()
//     .domain(data.map((d) => d.y))
//     .range([-10, 10])
//     .padding(0.2);

//   const zScale = d3
//     .scaleLinear()
//     .domain([0, d3.max(data, (d) => d.z)!])
//     .range([0, 10]);

//   // Buat batang 3D
//   data.forEach((d) => {
//     const geometry = new THREE.BoxGeometry(1.5, zScale(d.z), 1.5);
//     const material = new THREE.MeshStandardMaterial({
//       color: 0x007bff,
//       metalness: 0.3,
//       roughness: 0.7,
//     });
//     const bar = new THREE.Mesh(geometry, material);
//     bar.position.set(xScale(d.x)!, zScale(d.z) / 2, yScale(d.y)!);
//     scene.add(bar);
//   });

//   // Tambahkan label sumbu
//   const createLabel = (
//     text: string,
//     position: { x: number; y: number; z: number }
//   ) => {
//     const loader = new FontLoader();
//     loader.load(
//       "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
//       (font) => {
//         const geometry = new TextGeometry(text, {
//           font: font,
//           size: 1,
//           depth: 0.1, // ✅ Gunakan 'depth' sebagai pengganti 'height'
//         });

//         const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
//         const label = new THREE.Mesh(geometry, material);
//         label.position.set(position.x, position.y, position.z);
//         scene.add(label);
//       }
//     );
//   };

//   createLabel("X Axis", { x: 10, y: 0, z: 0 });
//   createLabel("Y Axis", { x: 0, y: 0, z: 10 });
//   createLabel("Z Axis", { x: 0, y: 10, z: 0 });

//   // Render loop
//   const animate = () => {
//     requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
//   };
//   animate();

//   return container;
// };

// export const create3DBarChart2 = (
//   data: { x: string; y: string; z: number }[],
//   width: number,
//   height: number
// ) => {
//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;
//   container.style.position = "relative";
//   container.style.overflow = "hidden";

//   const scene = new THREE.Scene();
//   scene.background = new THREE.Color(0xffffff);

//   const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
//   camera.position.set(10, 15, 30);
//   camera.lookAt(new THREE.Vector3(0, 5, 0));

//   const renderer = new THREE.WebGLRenderer({ antialias: true });
//   renderer.setSize(width, height);
//   container.appendChild(renderer.domElement);

//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//   pointLight.position.set(10, 20, 30);
//   scene.add(pointLight);

//   const gridHelper = new THREE.GridHelper(20, 20);
//   scene.add(gridHelper);

//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;

//   const xDomain = data.map((d) => d.x);
//   const yDomain = data.map((d) => d.y);

//   const xScale = d3.scalePoint().domain(xDomain).range([-10, 10]);
//   const yScale = d3.scalePoint().domain(yDomain).range([-10, 10]);
//   const zScale = d3
//     .scaleLinear()
//     .domain([0, d3.max(data, (d) => d.z)!])
//     .range([0, 10]);

//   data.forEach((d) => {
//     const geometry = new THREE.BoxGeometry(1.5, zScale(d.z), 1.5);
//     const material = new THREE.MeshStandardMaterial({
//       color: 0x007bff,
//       metalness: 0.3,
//       roughness: 0.7,
//     });
//     const bar = new THREE.Mesh(geometry, material);

//     bar.position.set(xScale(d.x)!, zScale(d.z) / 2, yScale(d.y)!);
//     scene.add(bar);
//   });

//   const fontLoader = new FontLoader();
//   fontLoader.load(
//     "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
//     (font) => {
//       data.forEach((d) => {
//         const textGeo = new TextGeometry(d.z.toString(), {
//           font: font,
//           size: 0.8,
//           depth: 0.1,
//         });
//         const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
//         const textMesh = new THREE.Mesh(textGeo, textMaterial);
//         textMesh.position.set(xScale(d.x)!, zScale(d.z) + 0.5, yScale(d.y)!);
//         textMesh.lookAt(camera.position);
//         scene.add(textMesh);
//       });

//       ["X", "Y", "Z"].forEach((label) => {
//         const axisTextGeo = new TextGeometry(label, {
//           font: font,
//           size: 1,
//           depth: 0.1,
//         });
//         const axisTextMaterial = new THREE.MeshBasicMaterial({
//           color: 0xff0000,
//         });
//         const axisTextMesh = new THREE.Mesh(axisTextGeo, axisTextMaterial);

//         if (label === "X") axisTextMesh.position.set(11, 0, 0);
//         if (label === "Y") axisTextMesh.position.set(0, 0, 11);
//         if (label === "Z") axisTextMesh.position.set(0, 11, 0);

//         axisTextMesh.lookAt(camera.position);
//         scene.add(axisTextMesh);
//       });

//       data.forEach((d) => {
//         const coordTextGeoX = new TextGeometry(d.x, {
//           font: font,
//           size: 0.5,
//           depth: 0.1,
//         });
//         const coordTextMaterial = new THREE.MeshBasicMaterial({
//           color: 0x000000,
//         });
//         const xText = new THREE.Mesh(coordTextGeoX, coordTextMaterial);
//         xText.position.set(xScale(d.x)!, 0, -11);
//         xText.lookAt(camera.position);
//         scene.add(xText);

//         const coordTextGeoY = new TextGeometry(d.y, {
//           font: font,
//           size: 0.5,
//           depth: 0.1,
//         });
//         const yText = new THREE.Mesh(coordTextGeoY, coordTextMaterial);
//         yText.position.set(-11, 0, yScale(d.y)!);
//         yText.lookAt(camera.position);
//         scene.add(yText);
//       });
//     }
//   );

//   const animate = () => {
//     requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
//   };
//   animate();

//   return container;
// };

//y vertikal
// export const create3DBarChart2 = (
//   data: { x: string; y: number; z: string }[],
//   width: number,
//   height: number
// ) => {
//   // Buat container div
//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;
//   container.style.position = "relative";
//   container.style.overflow = "hidden";

//   // Scene & Camera
//   const scene = new THREE.Scene();
//   scene.background = new THREE.Color(0xffffff);

//   const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
//   camera.position.set(10, 15, 30);
//   camera.lookAt(new THREE.Vector3(0, 5, 0));

//   // Renderer
//   const renderer = new THREE.WebGLRenderer({ antialias: true });
//   renderer.setSize(width, height);
//   container.appendChild(renderer.domElement);

//   // Cahaya
//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//   pointLight.position.set(10, 20, 30);
//   scene.add(pointLight);

//   // Grid Helper
//   const gridHelper = new THREE.GridHelper(20, 20);
//   scene.add(gridHelper);

//   // Orbit Controls
//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;

//   // Skala sumbu menggunakan D3.js
//   const xScale = d3
//     .scaleBand()
//     .domain(data.map((d) => d.x))
//     .range([-10, 10])
//     .padding(0.2);

//   const zScale = d3
//     .scaleBand()
//     .domain(data.map((d) => d.z))
//     .range([-10, 10])
//     .padding(0.2);

//   const yScale = d3
//     .scaleLinear()
//     .domain([0, d3.max(data, (d) => d.y)!])
//     .range([0, 10]);

//   // Buat batang 3D
//   data.forEach((d) => {
//     const geometry = new THREE.BoxGeometry(1.5, yScale(d.y), 1.5);
//     const material = new THREE.MeshStandardMaterial({
//       color: 0x007bff,
//       metalness: 0.3,
//       roughness: 0.7,
//     });
//     const bar = new THREE.Mesh(geometry, material);

//     bar.position.set(xScale(d.x)!, yScale(d.y) / 2, zScale(d.z)!);
//     scene.add(bar);
//   });

//   // Render loop
//   const animate = () => {
//     requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
//   };
//   animate();

//   return container;
// };

// export const create3DBarChart2 = (
//   data: { x: string; y: number; z: string }[],
//   width: number,
//   height: number
// ) => {
//   // Fungsi untuk menambahkan teks label
//   const addLabel = (text: string, position: THREE.Vector3) => {
//     // Load font untuk label sumbu
//     const loader = new FontLoader();
//     loader.load(
//       "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
//       (font) => {
//         const textGeometry = new TextGeometry(text, {
//           font: font,
//           size: 1,
//           depth: 0.1,
//         });
//         const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
//         const textMesh = new THREE.Mesh(textGeometry, textMaterial);
//         textMesh.position.set(position.x, position.y, position.z); // Posisi label sumbu
//         scene.add(textMesh);
//       }
//     );
//   };

//   // Buat container div
//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;
//   container.style.position = "relative";
//   container.style.overflow = "hidden";

//   // Scene & Camera
//   const scene = new THREE.Scene();
//   scene.background = new THREE.Color(0xffffff);

//   const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
//   camera.position.set(30, 30, 30); // Mengatur posisi kamera agar sesuai dengan orientasi
//   camera.lookAt(new THREE.Vector3(0, 0, 0)); // Menyasar pusat scene

//   // Renderer
//   const renderer = new THREE.WebGLRenderer({ antialias: true });
//   renderer.setSize(width, height);
//   container.appendChild(renderer.domElement);

//   // Cahaya
//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//   pointLight.position.set(10, 20, 30);
//   scene.add(pointLight);

//   // Grid Helper (Sumbu X dan Y tetap datar)
//   const gridHelper = new THREE.GridHelper(20, 20);
//   scene.add(gridHelper);

//   // Orbit Controls
//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;

//   // Skala sumbu menggunakan D3.js
//   const xScale = d3
//     .scaleBand()
//     .domain(data.map((d) => d.x))
//     .range([-10, 10])
//     .padding(0.2);

//   const zScale = d3
//     .scaleBand()
//     .domain(data.map((d) => d.z))
//     .range([-10, 10])
//     .padding(0.2);

//   const yScale = d3
//     .scaleLinear()
//     .domain([0, d3.max(data, (d) => d.y)!])
//     .range([0, 10]);

//   // Buat batang 3D
//   data.forEach((d) => {
//     const geometry = new THREE.BoxGeometry(1.5, yScale(d.y), 1.5);
//     const material = new THREE.MeshStandardMaterial({
//       color: 0x007bff,
//       metalness: 0.3,
//       roughness: 0.7,
//     });
//     const bar = new THREE.Mesh(geometry, material);

//     // Posisi batang dan rotasi agar sumbu Z vertikal
//     bar.position.set(xScale(d.x)!, yScale(d.y) / 2, zScale(d.z)!);
//     scene.add(bar);

//     // Tambahkan label untuk tinggi batang berdasarkan nilai z
//     addLabel(
//       d.z,
//       new THREE.Vector3(xScale(d.x)!, yScale(d.y) + 1, zScale(d.z)!)
//     ); // Label nilai Z
//   });

//   // Menambahkan label sumbu X, Y, dan Z
//   addLabel("X", new THREE.Vector3(10, 0, 0)); // Label untuk sumbu X
//   addLabel("Y", new THREE.Vector3(0, 0, 10)); // Label untuk sumbu Y
//   addLabel("Z", new THREE.Vector3(0, 15, 0)); // Label untuk sumbu Z

//   // Render loop
//   const animate = () => {
//     requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
//   };
//   animate();

//   return container;
// };

//FIX AXIS
// export const create3DBarChart2 = (
//   data: { x: number; y: number; z: number }[],
//   width: number,
//   height: number
// ) => {
//   // Fungsi untuk menambahkan teks label
//   const addLabel = (text: string, position: THREE.Vector3) => {
//     const loader = new FontLoader();
//     loader.load(
//       "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
//       (font) => {
//         const textGeometry = new TextGeometry(text, {
//           font: font,
//           size: 1,
//           depth: 0.1,
//         });
//         const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
//         const textMesh = new THREE.Mesh(textGeometry, textMaterial);
//         textMesh.position.set(position.x, position.y, position.z);
//         scene.add(textMesh);
//       }
//     );
//   };

//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;
//   container.style.position = "relative";
//   container.style.overflow = "hidden";

//   const scene = new THREE.Scene();
//   scene.background = new THREE.Color(0xffffff);

//   const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
//   camera.position.set(20, 20, 30);
//   camera.lookAt(new THREE.Vector3(0, 0, 0));

//   const renderer = new THREE.WebGLRenderer({ antialias: true });
//   renderer.setSize(width, height);
//   container.appendChild(renderer.domElement);

//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//   pointLight.position.set(10, 20, 30);
//   scene.add(pointLight);

//   // Menentukan rentang data
//   const xMax = d3.max(data, (d) => d.y)!;
//   const yMax = d3.max(data, (d) => d.z)!;
//   const zMax = d3.max(data, (d) => d.x)!;

//   console.log("xmax", xMax);
//   console.log("ymax", yMax);
//   console.log("zmax", zMax);

//   // Menentukan rentang koordinat
//   const gridSizeX = 2.5 * yMax; // Rentang dari -xMax ke xMax
//   const gridSizeZ = 2.5 * xMax; // Rentang dari -xMax ke xMax
//   const gridSize = Math.max(gridSizeX, gridSizeZ);
//   console.log("gridsize", gridSize);

//   // Menentukan jumlah garis pada sumbu X dan Z
//   const numLinesX = gridSizeX; // Setiap garis mewakili 1 unit
//   const numLinesZ = gridSizeZ; // Setiap garis mewakili 1 unit

//   // Membuat GridHelper dengan ukuran dan jumlah garis
//   const gridHelper = new THREE.GridHelper(
//     gridSize,
//     Math.max(numLinesX, numLinesZ)
//   );
//   scene.add(gridHelper);

//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;

//   // Skala yang disesuaikan agar sesuai dengan rentang grid
//   const xScale = d3
//     .scaleLinear()
//     .domain([-zMax, zMax]) // Rentang dari -xMax ke xMax
//     .range([-zMax, zMax]);

//   const zScale = d3
//     .scaleLinear()
//     .domain([-yMax, yMax]) // Rentang dari -zMax ke zMax
//     .range([-yMax, yMax]);

//   const yScale = d3.scaleLinear().domain([-zMax, zMax]).range([-zMax, zMax]);

//   data.forEach((d) => {
//     const geometry = new THREE.BoxGeometry(1.5, yScale(d.z), 1.5);
//     const material = new THREE.MeshStandardMaterial({
//       color: 0x007bff,
//       metalness: 0.3,
//       roughness: 0.7,
//     });
//     const bar = new THREE.Mesh(geometry, material);

//     bar.position.set(xScale(d.y)!, yScale(d.z) / 2, zScale(d.x)!);
//     scene.add(bar);

//     addLabel(
//       d.z.toString(),
//       new THREE.Vector3(
//         xScale(d.y),
//         yScale(d.z) + (yScale(d.z) >= 0 ? 1 : -1), // Menambahkan penyesuaian untuk nilai negatif
//         zScale(d.x)
//       )
//     );
//   });

//   addLabel("X", new THREE.Vector3(0, 0, gridSize / 2 + 3));
//   addLabel("Y", new THREE.Vector3(gridSize / 2 + 3, 0, 0));
//   addLabel("Z", new THREE.Vector3(0, yMax + 2, 0));

//   // Menambahkan koordinat sepanjang setiap sumbu
//   // const step = 2; // Langkah interval untuk koordinat
//   // for (let i = 0; i <= zMax; i += step) {
//   //   addLabel(i.toString(), new THREE.Vector3(i, 0, gridSize / 2 + 1)); // X-axis ticks
//   //   addLabel((-i).toString(), new THREE.Vector3(-i, 0, gridSize / 2 + 1)); // Negative X-axis ticks
//   // }

//   // for (let i = 0; i <= xMax; i += step) {
//   //   addLabel(i.toString(), new THREE.Vector3(gridSize / 2 + 1, 0, i)); // Y-axis ticks
//   //   addLabel((-i).toString(), new THREE.Vector3(gridSize / 2 + 1, 0, -i)); // Negative Y-axis ticks
//   // }

//   // for (let i = 0; i <= yMax; i += step) {
//   //   addLabel(i.toString(), new THREE.Vector3(0, i, 0)); // Z-axis ticks
//   //   addLabel((-i).toString(), new THREE.Vector3(0, -i, 0)); // Negative Z-axis ticks
//   // }

//   const animate = () => {
//     requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
//   };
//   animate();

//   return container;
// };

// RIGHT-HAND RULE
export const create3DBarChart2 = (
  data: { x: number; y: number; z: number }[],
  width: number,
  height: number
) => {
  console.log("create 3d bar chart with data", data);
  // Fungsi untuk menambahkan teks label
  const addLabel = (text: string, position: THREE.Vector3) => {
    const loader = new FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        const textGeometry = new TextGeometry(text, {
          font: font,
          size: 0.5, // Ukuran lebih kecil agar proporsional
          depth: 0.05,
        });
        textGeometry.computeBoundingBox();
        textGeometry.center(); // Pusatkan teks secara horizontal

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
  const gridSizeX = 2 * xMax; // Rentang dari -xMax ke xMax
  const gridSizeZ = 2 * zMax; // Rentang dari -xMax ke xMax
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
      dashSize: 1, // Panjang garis putus-putus
      gapSize: 0.5, // Jarak antar garis putus-putus
    });

    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances(); // Penting agar efek putus-putus berfungsi

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

  // Skala yang disesuaikan agar sesuai dengan rentang grid
  const xScale = d3
    .scaleLinear()
    .domain([-xMax, xMax]) // Rentang dari -xMax ke xMax
    .range([-xMax, xMax]);

  const zScale = d3
    .scaleLinear()
    .domain([-zMax, zMax]) // Rentang dari -zMax ke zMax
    .range([-zMax, zMax]);

  const yScale = d3.scaleLinear().domain([-yMax, yMax]).range([-yMax, yMax]);

  data.forEach((d) => {
    const geometry = new THREE.BoxGeometry(1, yScale(d.y), 1);
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
        yScale(d.y) + (yScale(d.y) >= 0 ? 1 : -1), // Menambahkan penyesuaian untuk nilai negatif
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
          size: 0.5, // Ukuran lebih kecil agar proporsional
          depth: 0.05,
        });
        textGeometry.computeBoundingBox();
        textGeometry.center(); // Pusatkan teks secara horizontal

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
  const gridSizeX = 2 * xMax; // Rentang dari -xMax ke xMax
  const gridSizeZ = 2 * zMax; // Rentang dari -xMax ke xMax
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
      dashSize: 1, // Panjang garis putus-putus
      gapSize: 0.5, // Jarak antar garis putus-putus
    });

    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances(); // Penting agar efek putus-putus berfungsi

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
  const xScale = d3
    .scaleLinear()
    .domain([-xMax, xMax]) // Rentang dari -xMax ke xMax
    .range([-xMax, xMax]);

  const yScale = d3
    .scaleLinear()
    .domain([-yMax, yMax]) // Rentang dari -yMax ke yMax
    .range([-yMax, yMax]);

  const zScale = d3
    .scaleLinear()
    .domain([-zMax, zMax]) // Rentang dari -zMax ke zMax
    .range([-zMax, zMax]);

  // Menambahkan titik-titik (scatter) pada plot 3D
  data.forEach((d) => {
    const geometry = new THREE.SphereGeometry(0.5, 8, 8); // Membuat bola kecil untuk setiap titik
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

// export const createGrouped3DScatterPlot = (
//   data: { x: number; y: number; z: number; group: string }[], // Tambahkan properti 'group' untuk kategori
//   width: number,
//   height: number
// ) => {
//   // Fungsi untuk menambahkan teks label
//   const addLabel = (text: string, position: THREE.Vector3) => {
//     const loader = new FontLoader();
//     loader.load(
//       "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
//       (font) => {
//         const textGeometry = new TextGeometry(text, {
//           font: font,
//           size: 1,
//           depth: 0.1,
//         });
//         const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
//         const textMesh = new THREE.Mesh(textGeometry, textMaterial);
//         textMesh.position.set(position.x, position.y, position.z);
//         scene.add(textMesh);
//       }
//     );
//   };

//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;
//   container.style.position = "relative";
//   container.style.overflow = "hidden";

//   const scene = new THREE.Scene();
//   scene.background = new THREE.Color(0xffffff);

//   const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
//   camera.position.set(20, 20, 30);
//   camera.lookAt(new THREE.Vector3(0, 0, 0));

//   const renderer = new THREE.WebGLRenderer({ antialias: true });
//   renderer.setSize(width, height);
//   container.appendChild(renderer.domElement);

//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//   pointLight.position.set(10, 20, 30);
//   scene.add(pointLight);

//   // Menentukan rentang data
//   const xExtent = d3.extent(data, (d) => d.x)!;
//   const yExtent = d3.extent(data, (d) => d.y)!;
//   const zExtent = d3.extent(data, (d) => d.z)!;

//   const xMax = Math.max(Math.abs(xExtent[0]!), Math.abs(xExtent[1]!));
//   const yMax = Math.max(Math.abs(yExtent[0]!), Math.abs(yExtent[1]!));
//   const zMax = Math.max(Math.abs(zExtent[0]!), Math.abs(zExtent[1]!));

//   console.log("xMax", xMax);
//   console.log("yMax", yMax);
//   console.log("zMax", zMax);

//   // Menentukan rentang koordinat
//   const gridSizeX = 2 * xMax; // Rentang dari -xMax ke xMax
//   const gridSizeZ = 2 * zMax; // Rentang dari -xMax ke xMax
//   const gridSize = Math.max(gridSizeX, gridSizeZ);
//   console.log("gridSize", gridSize);

//   // Membuat GridHelper
//   const gridHelper = new THREE.GridHelper(gridSize + 3, gridSize + 3);
//   scene.add(gridHelper);

//   const createAxisLine = (
//     start: THREE.Vector3,
//     end: THREE.Vector3,
//     color: number
//   ) => {
//     const material = new THREE.LineDashedMaterial({
//       color: color,
//       dashSize: 1, // Panjang garis putus-putus
//       gapSize: 0.5, // Jarak antar garis putus-putus
//     });

//     const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
//     const line = new THREE.Line(geometry, material);
//     line.computeLineDistances(); // Penting agar efek putus-putus berfungsi

//     return line;
//   };

//   //Garis Sumbu X (Merah)
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(-gridSize, 0, 0),
//       new THREE.Vector3(gridSize, 0, 0),
//       0xff0000
//     )
//   );

//   // Garis Sumbu Y (Hijau)
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(0, -gridSize, 0),
//       new THREE.Vector3(0, gridSize, 0),
//       0x00ff00
//     )
//   );

//   // Garis Sumbu Z (Biru)
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(0, 0, -gridSize),
//       new THREE.Vector3(0, 0, gridSize),
//       0x0000ff
//     )
//   );

//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;

//   // Skala yang disesuaikan agar sesuai dengan rentang grid
//   const xScale = d3.scaleLinear().domain([-xMax, xMax]).range([-xMax, xMax]);

//   const yScale = d3.scaleLinear().domain([-yMax, yMax]).range([-yMax, yMax]);

//   const zScale = d3.scaleLinear().domain([-zMax, zMax]).range([-zMax, zMax]);

//   // Kelompokkan data berdasarkan kategori 'group'
//   const groupedData = d3.group(data, (d) => d.group);

//   // Daftar warna untuk setiap grup
//   const colors = d3.scaleOrdinal(d3.schemeCategory10);

//   // Menambahkan titik untuk setiap grup
//   groupedData.forEach((group, groupName) => {
//     const color = colors(groupName); // Ambil warna berdasarkan grup

//     group.forEach((d) => {
//       const geometry = new THREE.SphereGeometry(0.5, 8, 8); // Bola untuk titik
//       const material = new THREE.MeshStandardMaterial({
//         color: color, // Gunakan warna grup
//         metalness: 0.3,
//         roughness: 0.7,
//       });
//       const point = new THREE.Mesh(geometry, material);

//       // Posisi titik berdasarkan data dan skala
//       point.position.set(xScale(d.x)!, yScale(d.y)!, zScale(d.z)!);
//       scene.add(point);

//       // Posisi titik berdasarkan data dan skala
//       point.position.set(xScale(d.x)!, yScale(d.y), zScale(d.z)!);
//       scene.add(point);

//       addLabel(
//         ` ${d.y}`,
//         new THREE.Vector3(
//           xScale(d.x),
//           yScale(d.y) + (yScale(d.y) >= 0 ? 1 : -1),
//           zScale(d.z)
//         )
//       );
//     });

//     // Tambahkan label untuk grup di posisi rata-rata titik
//     const averagePosition = group.reduce(
//       (acc, d) => {
//         acc.x += d.x;
//         acc.y += d.y;
//         acc.z += d.z;
//         return acc;
//       },
//       { x: 0, y: 0, z: 0 }
//     );
//     // addLabel(
//     //   groupName, // Nama grup sebagai label
//     //   new THREE.Vector3(
//     //     xScale(averagePosition.x / group.length),
//     //     yScale(averagePosition.y / group.length),
//     //     zScale(averagePosition.z / group.length)
//     //   )
//     // );
//   });

//   // Menambahkan label untuk sumbu
//   addLabel("X", new THREE.Vector3(gridSize / 2 + 3, 0, 0));
//   addLabel("Y", new THREE.Vector3(0, gridSize / 2 + 3, 0));
//   addLabel("Z", new THREE.Vector3(0, 0, gridSize / 2 + 3));

//   const animate = () => {
//     requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
//   };
//   animate();

//   return container;
// };

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
    const key = `${d.x},${d.y},${d.z}`; // Pakai xyz agar lebih akurat
    pointMap.set(key, (pointMap.get(key) || 0) + 1);
  });

  // Skala ukuran titik berdasarkan jumlah titik di satu koordinat (x, z)
  const sizeScale = d3.scaleLinear().domain([1, 5]).range([0.5, 0.2]);

  const groupedData = d3.group(data, (d) => `${d.x},${d.y},${d.z}`);

  groupedData.forEach((group, key) => {
    const numPoints = group.length;
    const baseSize = sizeScale(Math.min(numPoints, 5)); // Ukuran berdasarkan jumlah titik

    group.forEach((d, index) => {
      const size = baseSize;
      const color = new THREE.Color(colorScale(d.category) as string);
      const geometry = new THREE.SphereGeometry(size, 8, 8);
      const material = new THREE.MeshStandardMaterial({
        color: color,
        // transparent: true,
        // opacity: 0.8, // Bisa dikombinasikan dengan transparansi
        metalness: 0.3,
        roughness: 0.7,
      });

      const point = new THREE.Mesh(geometry, material);

      // Offset posisi agar titik dalam satu (x, z) tidak tumpang tindih
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
// export const createClustered3DBarChart = (
//   data: { x: number; y: number; z: number; group: string }[],
//   width: number,
//   height: number
// ) => {
//   // Fungsi untuk menambahkan teks label
//   const addLabel = (text: string, position: THREE.Vector3) => {
//     const loader = new FontLoader();
//     loader.load(
//       "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
//       (font) => {
//         const textGeometry = new TextGeometry(text, {
//           font: font,
//           size: 1,
//           depth: 0.1,
//         });
//         const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
//         const textMesh = new THREE.Mesh(textGeometry, textMaterial);
//         textMesh.position.set(position.x, position.y, position.z);
//         scene.add(textMesh);
//       }
//     );
//   };

//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;
//   container.style.position = "relative";
//   container.style.overflow = "hidden";

//   const scene = new THREE.Scene();
//   scene.background = new THREE.Color(0xffffff);

//   const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
//   camera.position.set(20, 20, 30);
//   camera.lookAt(new THREE.Vector3(0, 0, 0));

//   const renderer = new THREE.WebGLRenderer({ antialias: true });
//   renderer.setSize(width, height);
//   container.appendChild(renderer.domElement);

//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//   pointLight.position.set(10, 20, 30);
//   scene.add(pointLight);

//   // Menentukan rentang koordinat
//   const xExtent = d3.extent(data, (d) => d.x)!;
//   const yExtent = d3.extent(data, (d) => d.y)!;
//   const zExtent = d3.extent(data, (d) => d.z)!;

//   const xMax = Math.max(Math.abs(xExtent[0]!), Math.abs(xExtent[1]!));
//   const yMax = Math.max(Math.abs(yExtent[0]!), Math.abs(yExtent[1]!));
//   const zMax = Math.max(Math.abs(zExtent[0]!), Math.abs(zExtent[1]!));

//   console.log("xMax", xMax);
//   console.log("yMax", yMax);
//   console.log("zMax", zMax);

//   // Menentukan rentang koordinat
//   const gridSizeX = 2 * xMax; // Rentang dari -xMax ke xMax
//   const gridSizeZ = 2 * zMax; // Rentang dari -xMax ke xMax
//   const gridSize = Math.max(gridSizeX, gridSizeZ);
//   console.log("gridSize", gridSize);

//   // Membuat GridHelper
//   const gridHelper = new THREE.GridHelper(gridSize + 3, gridSize + 3);
//   scene.add(gridHelper);

//   const createAxisLine = (
//     start: THREE.Vector3,
//     end: THREE.Vector3,
//     color: number
//   ) => {
//     const material = new THREE.LineDashedMaterial({
//       color: color,
//       dashSize: 1, // Panjang garis putus-putus
//       gapSize: 0.5, // Jarak antar garis putus-putus
//     });

//     const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
//     const line = new THREE.Line(geometry, material);
//     line.computeLineDistances(); // Penting agar efek putus-putus berfungsi

//     return line;
//   };

//   //Garis Sumbu X (Merah)
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(-gridSize, 0, 0),
//       new THREE.Vector3(gridSize, 0, 0),
//       0xff0000
//     )
//   );

//   // Garis Sumbu Y (Hijau)
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(0, -gridSize, 0),
//       new THREE.Vector3(0, gridSize, 0),
//       0x00ff00
//     )
//   );

//   // Garis Sumbu Z (Biru)
//   scene.add(
//     createAxisLine(
//       new THREE.Vector3(0, 0, -gridSize),
//       new THREE.Vector3(0, 0, gridSize),
//       0x0000ff
//     )
//   );

//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;

//   // Skala yang disesuaikan agar sesuai dengan rentang grid
//   const xScale = d3.scaleLinear().domain([-xMax, xMax]).range([-xMax, xMax]);

//   const yScale = d3.scaleLinear().domain([0, yMax]).range([0, yMax]);

//   const zScale = d3.scaleLinear().domain([-zMax, zMax]).range([-zMax, zMax]);

//   // Kelompokkan data berdasarkan kategori 'group'
//   const groupedData = d3.group(data, (d) => d.group);

//   // Daftar warna untuk setiap grup
//   const colors = d3.scaleOrdinal(d3.schemeCategory10);

//   const barWidth = 1; // Lebar batang
//   const barSpacing = 2; // Spasi antara batang dalam cluster

//   // Menambahkan batang (bars) untuk setiap grup
//   groupedData.forEach((group, groupName) => {
//     const color = colors(groupName); // Ambil warna berdasarkan grup

//     group.forEach((d, index) => {
//       const geometry = new THREE.BoxGeometry(barWidth, yScale(d.y), barWidth); // Batang 3D
//       const material = new THREE.MeshStandardMaterial({
//         color: color, // Gunakan warna grup
//         metalness: 0.3,
//         roughness: 0.7,
//       });
//       const bar = new THREE.Mesh(geometry, material);

//       // Tentukan posisi batang, dengan sedikit pergeseran untuk setiap grup
//       const xPos = xScale(d.x); // Posisi X disesuaikan
//       const yPos = yScale(d.y) / 2;
//       const zPos = zScale(d.z);

//       bar.position.set(xPos, yPos, zPos);
//       scene.add(bar);
//     });

//     // Tambahkan label untuk grup di posisi rata-rata titik
//     const averagePosition = group.reduce(
//       (acc, d) => {
//         acc.x += d.x;
//         acc.y += d.y;
//         acc.z += d.z;
//         return acc;
//       },
//       { x: 0, y: 0, z: 0 }
//     );
//     // addLabel(
//     //   groupName, // Nama grup sebagai label
//     //   new THREE.Vector3(
//     //     xScale(averagePosition.x / group.length),
//     //     yScale(averagePosition.y / group.length),
//     //     zScale(averagePosition.z / group.length)
//     //   )
//     // );
//   });

//   const animate = () => {
//     requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
//   };
//   animate();

//   return container;
// };

// export const createClustered3DBarChart = (
//   data: { x: number; z: number; y: number; category: string }[],
//   width: number,
//   height: number
// ) => {
//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;
//   container.style.position = "relative";
//   container.style.overflow = "hidden";

//   const scene = new THREE.Scene();
//   scene.background = new THREE.Color(0xffffff);

//   const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
//   camera.position.set(20, 20, 30);
//   camera.lookAt(new THREE.Vector3(0, 0, 0));

//   const renderer = new THREE.WebGLRenderer({ antialias: true });
//   renderer.setSize(width, height);
//   container.appendChild(renderer.domElement);

//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//   pointLight.position.set(10, 20, 30);
//   scene.add(pointLight);

//   // Menentukan rentang koordinat
//   const xExtent = d3.extent(data, (d) => d.x) as [number, number];
//   const yExtent = d3.extent(data, (d) => d.y) as [number, number];
//   const zExtent = d3.extent(data, (d) => d.z) as [number, number];

//   const xMax = Math.max(Math.abs(xExtent[0]), Math.abs(xExtent[1]));
//   const yMax = Math.max(Math.abs(yExtent[0]), Math.abs(yExtent[1]));
//   const zMax = Math.max(Math.abs(zExtent[0]), Math.abs(zExtent[1]));

//   const gridSize = Math.max(2 * xMax, 2 * zMax);

//   // Membuat GridHelper
//   const gridHelper = new THREE.GridHelper(gridSize + 3, gridSize + 3);
//   scene.add(gridHelper);

//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;

//   // Skala koordinat
//   const xScale = d3.scaleLinear().domain([-xMax, xMax]).range([-xMax, xMax]);
//   const yScale = d3.scaleLinear().domain([0, yMax]).range([0, yMax]);
//   const zScale = d3.scaleLinear().domain([-zMax, zMax]).range([-zMax, zMax]);

//   // Kelompokkan berdasarkan koordinat (x, z)
//   const groupedData = d3.group(data, (d) => `${d.x},${d.z}`);

//   const colors = d3.scaleOrdinal(d3.schemeCategory10);

//   groupedData.forEach((group, key) => {
//     const numBars = group.length; // Jumlah kategori dalam satu (x, z)
//     const barSpacing = 0.05; // Jarak antar batang dalam cluster
//     const maxBarWidth = 1 - numBars * barSpacing; // Lebar maksimum per koordinat (bisa disesuaikan)
//     const barWidth = Math.min(0.95, maxBarWidth / numBars); // Lebar batang tergantung jumlah kategori

//     group.forEach((d, index) => {
//       const geometry = new THREE.BoxGeometry(barWidth, yScale(d.y), barWidth);
//       const material = new THREE.MeshStandardMaterial({
//         color: colors(d.category),
//         metalness: 0.3,
//         roughness: 0.7,
//       });
//       const bar = new THREE.Mesh(geometry, material);

//       // Posisi batang dalam satu (x, z) agar tetap dalam area yang sama
//       const xOffset = (index - (numBars - 1) / 2) * (barWidth + barSpacing);
//       const xPos = xScale(d.x) + xOffset;
//       const yPos = yScale(d.y) / 2;
//       const zPos = zScale(d.z);

//       bar.position.set(xPos, yPos, zPos);
//       scene.add(bar);
//     });
//   });

//   const animate = () => {
//     requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
//   };
//   animate();

//   return container;
// };

// export const createClustered3DBarChart = (
//   data: { x: number; z: number; y: number; category: string }[],
//   width: number,
//   height: number
// ) => {
//   const container = document.createElement("div");
//   container.style.width = `${width}px`;
//   container.style.height = `${height}px`;
//   container.style.position = "relative";
//   container.style.overflow = "hidden";

//   const scene = new THREE.Scene();
//   scene.background = new THREE.Color(0xffffff);

//   const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
//   camera.position.set(20, 20, 30);
//   camera.lookAt(new THREE.Vector3(0, 0, 0));

//   const renderer = new THREE.WebGLRenderer({ antialias: true });
//   renderer.setSize(width, height);
//   container.appendChild(renderer.domElement);

//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//   pointLight.position.set(10, 20, 30);
//   scene.add(pointLight);

//   // Menentukan rentang koordinat
//   const xExtent = d3.extent(data, (d) => d.x) as [number, number];
//   const yExtent = d3.extent(data, (d) => d.y) as [number, number];
//   const zExtent = d3.extent(data, (d) => d.z) as [number, number];

//   const xMax = Math.max(Math.abs(xExtent[0]), Math.abs(xExtent[1]));
//   const yMax = Math.max(Math.abs(yExtent[0]), Math.abs(yExtent[1]));
//   const zMax = Math.max(Math.abs(zExtent[0]), Math.abs(zExtent[1]));

//   const gridSize = Math.max(2 * xMax, 2 * zMax);

//   // Membuat GridHelper
//   const gridHelper = new THREE.GridHelper(gridSize + 3, gridSize + 3);
//   scene.add(gridHelper);

//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;

//   // Skala koordinat
//   const xScale = d3.scaleLinear().domain([-xMax, xMax]).range([-xMax, xMax]);
//   const yScale = d3.scaleLinear().domain([0, yMax]).range([0, yMax]);
//   const zScale = d3.scaleLinear().domain([-zMax, zMax]).range([-zMax, zMax]);

//   // Kelompokkan berdasarkan koordinat (x, z)
//   const groupedData = d3.group(data, (d) => `${d.x},${d.z}`);

//   const colors = d3.scaleOrdinal(d3.schemeCategory10);

//   groupedData.forEach((group, key) => {
//     const numBars = group.length; // Jumlah kategori dalam satu (x, z)

//     // Hitung jumlah kolom & baris agar tetap menutup 1x1
//     const numCols = Math.ceil(Math.sqrt(numBars));
//     const numRows = Math.ceil(numBars / numCols);

//     const barSpacing = 0.05; // Jarak antar batang dalam cluster
//     const maxBarWidth = 1 - barSpacing * (numCols - 1); // Pastikan tetap dalam 1 unit
//     const barWidth = maxBarWidth / numCols; // Lebar batang agar tetap rapi
//     const barDepth = maxBarWidth / numRows; // Kedalaman batang agar tetap rapi

//     group.forEach((d, index) => {
//       const row = Math.floor(index / numCols); // Baris ke-berapa
//       const col = index % numCols; // Kolom ke-berapa

//       const geometry = new THREE.BoxGeometry(barWidth, yScale(d.y), barDepth);
//       const material = new THREE.MeshStandardMaterial({
//         color: colors(d.category),
//         metalness: 0.3,
//         roughness: 0.7,
//       });
//       const bar = new THREE.Mesh(geometry, material);

//       // Hitung offset dalam grid 1x1
//       const xOffset = (col - (numCols - 1) / 2) * (barWidth + barSpacing);
//       const zOffset = (row - (numRows - 1) / 2) * (barDepth + barSpacing);

//       const xPos = xScale(d.x) + xOffset;
//       const yPos = yScale(d.y) / 2;
//       const zPos = zScale(d.z) + zOffset;

//       bar.position.set(xPos, yPos, zPos);
//       scene.add(bar);
//     });
//   });

//   const animate = () => {
//     requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
//   };
//   animate();

//   return container;
// };

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
      dashSize: 1, // Panjang garis putus-putus
      gapSize: 0.5, // Jarak antar garis putus-putus
    });

    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances(); // Penting agar efek putus-putus berfungsi

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
    const numBars = group.length; // Jumlah kategori dalam satu (x, z)

    const barSpacing = 0.005; // Jarak antar batang dalam cluster
    const maxBarWidth = 0.95 - barSpacing * (numBars - 1); // Total area yang bisa dipakai dalam 1 unit
    const barWidth = Math.min(0.95, maxBarWidth / numBars); // Lebar batang agar tetap dalam area 1 unit

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
      const zPos = zScale(d.z); // Tetap di tengah grid

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
          size: 0.5, // Ukuran lebih kecil agar proporsional
          depth: 0.05,
        });
        textGeometry.computeBoundingBox();
        textGeometry.center(); // Pusatkan teks secara horizontal

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
      dashSize: 1, // Panjang garis putus-putus
      gapSize: 0.5, // Jarak antar garis putus-putus
    });

    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances(); // Penting agar efek putus-putus berfungsi

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
    let accumulatedHeight = 0; // Untuk menumpuk batang dalam sumbu Y
    let totalHeight = d3.sum(group, (d) => yScale(d.y)); // Total tinggi semua kategori

    group.forEach((d) => {
      const barWidth = 1; // Satu unit penuh
      const barHeight = yScale(d.y);

      const geometry = new THREE.BoxGeometry(barWidth, barHeight, barWidth);
      const material = new THREE.MeshStandardMaterial({
        color: colors(d.category),
        metalness: 0.3,
        roughness: 0.7,
      });
      const bar = new THREE.Mesh(geometry, material);

      const xPos = xScale(d.x);
      const yPos = accumulatedHeight + barHeight / 2; // Posisi di atas batang sebelumnya
      const zPos = zScale(d.z);

      bar.position.set(xPos, yPos, zPos);
      scene.add(bar);

      accumulatedHeight += barHeight; // Tambahkan tinggi untuk kategori berikutnya
    });

    // Tambahkan label total tinggi di atas batang terakhir
    addLabel(
      totalHeight.toFixed(1), // Tampilkan angka total tinggi
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
