import * as d3 from "d3";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import * as echarts from "echarts";
import "echarts-gl";

// Helper function for improved scaling
const createImprovedScaling = (
  data: any[],
  xKey: string = "x",
  yKey: string = "y",
  zKey: string = "z"
) => {
  // Fixed grid size for consistency (tidak tergantung data)
  const FIXED_GRID_SIZE = 20;
  const CHART_AREA = 16; // Area chart dalam grid (80% dari grid)

  // Extract unique values for categorical data
  const xValues = Array.from(new Set(data.map((d) => d[xKey])));
  const zValues = Array.from(new Set(data.map((d) => d[zKey])));

  // Check if X and Z are categorical (strings) or numeric
  const xIsCategorical = typeof xValues[0] === "string";
  const zIsCategorical = typeof zValues[0] === "string";

  // Y is always numeric
  const yExtent = d3.extent(data, (d) => d[yKey]) as [number, number];
  const yMax = Math.max(Math.abs(yExtent[0]), Math.abs(yExtent[1]));

  let xScale, zScale;

  if (xIsCategorical) {
    // Categorical X scale
    xScale = d3
      .scaleBand()
      .domain(xValues)
      .range([-CHART_AREA / 2, CHART_AREA / 2])
      .padding(0.2);
  } else {
    // Numeric X scale
    const xExtent = d3.extent(data, (d) => d[xKey]) as [number, number];
    xScale = d3
      .scaleLinear()
      .domain(xExtent)
      .range([-CHART_AREA / 2, CHART_AREA / 2]);
  }

  if (zIsCategorical) {
    // Categorical Z scale
    zScale = d3
      .scaleBand()
      .domain(zValues)
      .range([-CHART_AREA / 2, CHART_AREA / 2])
      .padding(0.2);
  } else {
    // Numeric Z scale
    const zExtent = d3.extent(data, (d) => d[zKey]) as [number, number];
    zScale = d3
      .scaleLinear()
      .domain(zExtent)
      .range([-CHART_AREA / 2, CHART_AREA / 2]);
  }

  // Y scale - always from 0 to max height of 8 units
  const yScale = d3.scaleLinear().domain([0, yMax]).range([0, 8]);

  return {
    xScale,
    yScale,
    zScale,
    gridSize: FIXED_GRID_SIZE,
    chartArea: CHART_AREA,
    xIsCategorical,
    zIsCategorical,
    xValues,
    zValues,
  };
};

export const create3DBarChart2 = (
  data: { x: any; y: number; z: any }[], // x dan z bisa string atau number
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

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(25, 25, 25);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  scene.background = null;

  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(15, 20, 15);
  scene.add(pointLight);

  // Use improved scaling
  const {
    xScale,
    yScale,
    zScale,
    gridSize,
    xIsCategorical,
    zIsCategorical,
    xValues,
    zValues,
  } = createImprovedScaling(data, "x", "y", "z");

  // Fixed size grid helper
  const gridHelper = new THREE.GridHelper(gridSize, 20);
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

  const axisLength = gridSize / 2;

  // Garis Sumbu X (Merah)
  scene.add(
    createAxisLine(
      new THREE.Vector3(-axisLength, 0, 0),
      new THREE.Vector3(axisLength, 0, 0),
      0xff0000
    )
  );

  // Garis Sumbu Y (Hijau)
  scene.add(
    createAxisLine(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 12, 0),
      0x00ff00
    )
  );

  // Garis Sumbu Z (Biru)
  scene.add(
    createAxisLine(
      new THREE.Vector3(0, 0, -axisLength),
      new THREE.Vector3(0, 0, axisLength),
      0x0000ff
    )
  );

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

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

  // Render bars
  data.forEach((d) => {
    const barHeight = yScale(d.y);
    const barWidth = xIsCategorical ? (xScale as any).bandwidth() * 0.8 : 1.2;
    const barDepth = zIsCategorical ? (zScale as any).bandwidth() * 0.8 : 1.2;

    const geometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
    const material = new THREE.MeshStandardMaterial({
      color: 0x007bff,
      metalness: 0.3,
      roughness: 0.7,
    });
    const bar = new THREE.Mesh(geometry, material);

    const xPos = xIsCategorical
      ? (xScale as any)(d.x) + (xScale as any).bandwidth() / 2
      : xScale(d.x);
    const zPos = zIsCategorical
      ? (zScale as any)(d.z) + (zScale as any).bandwidth() / 2
      : zScale(d.z);

    bar.position.set(xPos, barHeight / 2, zPos);
    scene.add(bar);

    // Add value label above bar
    addLabel(d.y.toString(), new THREE.Vector3(xPos, barHeight + 1, zPos));
  });

  // Add axis labels
  addLabel("X", new THREE.Vector3(axisLength + 2, 0, 0));
  addLabel("Y", new THREE.Vector3(0, 14, 0));
  addLabel("Z", new THREE.Vector3(0, 0, axisLength + 2));

  // Add axis tick labels for categorical data
  if (xIsCategorical) {
    xValues.forEach((value: any) => {
      const pos = (xScale as any)(value) + (xScale as any).bandwidth() / 2;
      addLabel(value.toString(), new THREE.Vector3(pos, -1, axisLength + 1));
    });
  }

  if (zIsCategorical) {
    zValues.forEach((value: any) => {
      const pos = (zScale as any)(value) + (zScale as any).bandwidth() / 2;
      addLabel(value.toString(), new THREE.Vector3(axisLength + 1, -1, pos));
    });
  }

  let animationId: number;
  const animate = () => {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  // Add cleanup function to container
  (container as any).cleanup = () => {
    // Cancel animation
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    // Dispose controls
    controls.dispose();

    // Dispose renderer and WebGL context
    renderer.dispose();
    renderer.forceContextLoss();

    // Clear scene
    while (scene.children.length > 0) {
      const object = scene.children[0];
      if (object.type === "Mesh") {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => material.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
      scene.remove(object);
    }

    // Remove canvas from container
    if (container.children.length > 0) {
      container.removeChild(container.children[0]);
    }
  };

  return container;
};

export const create3DScatterPlot = (
  data: { x: any; y: number; z: any }[], // x dan z bisa string atau number
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

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(25, 25, 25);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  scene.background = null;
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(15, 20, 15);
  scene.add(pointLight);

  // Use improved scaling
  const {
    xScale,
    yScale,
    zScale,
    gridSize,
    xIsCategorical,
    zIsCategorical,
    xValues,
    zValues,
  } = createImprovedScaling(data, "x", "y", "z");

  // Fixed size grid helper
  const gridHelper = new THREE.GridHelper(gridSize, 20);
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

  const axisLength = gridSize / 2;

  //Garis Sumbu X (Merah)
  scene.add(
    createAxisLine(
      new THREE.Vector3(-axisLength, 0, 0),
      new THREE.Vector3(axisLength, 0, 0),
      0xff0000
    )
  );

  // Garis Sumbu Y (Hijau)
  scene.add(
    createAxisLine(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 12, 0),
      0x00ff00
    )
  );

  // Garis Sumbu Z (Biru)
  scene.add(
    createAxisLine(
      new THREE.Vector3(0, 0, -axisLength),
      new THREE.Vector3(0, 0, axisLength),
      0x0000ff
    )
  );

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Menambahkan titik-titik (scatter) pada plot 3D
  data.forEach((d) => {
    const geometry = new THREE.SphereGeometry(0.5, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0x007bff,
      metalness: 0.3,
      roughness: 0.7,
    });
    const point = new THREE.Mesh(geometry, material);

    const xPos = xIsCategorical
      ? (xScale as any)(d.x) + (xScale as any).bandwidth() / 2
      : xScale(d.x);
    const zPos = zIsCategorical
      ? (zScale as any)(d.z) + (zScale as any).bandwidth() / 2
      : zScale(d.z);

    // Posisi titik berdasarkan data dan skala
    point.position.set(xPos, yScale(d.y), zPos);
    scene.add(point);

    addLabel(` ${d.y}`, new THREE.Vector3(xPos, yScale(d.y) + 1, zPos));
  });

  // Add axis labels
  addLabel("X", new THREE.Vector3(axisLength + 2, 0, 0));
  addLabel("Y", new THREE.Vector3(0, 14, 0));
  addLabel("Z", new THREE.Vector3(0, 0, axisLength + 2));

  // Add axis tick labels for categorical data
  if (xIsCategorical) {
    xValues.forEach((value: any) => {
      const pos = (xScale as any)(value) + (xScale as any).bandwidth() / 2;
      addLabel(value.toString(), new THREE.Vector3(pos, -1, axisLength + 1));
    });
  }

  if (zIsCategorical) {
    zValues.forEach((value: any) => {
      const pos = (zScale as any)(value) + (zScale as any).bandwidth() / 2;
      addLabel(value.toString(), new THREE.Vector3(axisLength + 1, -1, pos));
    });
  }

  let animationId: number;
  const animate = () => {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  // Add cleanup function to container
  (container as any).cleanup = () => {
    // Cancel animation
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    // Dispose controls
    controls.dispose();

    // Dispose renderer and WebGL context
    renderer.dispose();
    renderer.forceContextLoss();

    // Clear scene
    while (scene.children.length > 0) {
      const object = scene.children[0];
      if (object.type === "Mesh") {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => material.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
      scene.remove(object);
    }

    // Remove canvas from container
    if (container.children.length > 0) {
      container.removeChild(container.children[0]);
    }
  };

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

  let animationId: number;
  const animate = () => {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  // Add cleanup function to container
  (container as any).cleanup = () => {
    // Cancel animation
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    // Dispose controls
    controls.dispose();

    // Dispose renderer and WebGL context
    renderer.dispose();
    renderer.forceContextLoss();

    // Clear scene
    while (scene.children.length > 0) {
      const object = scene.children[0];
      if (object.type === "Mesh") {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => material.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
      scene.remove(object);
    }

    // Remove canvas from container
    if (container.children.length > 0) {
      container.removeChild(container.children[0]);
    }
  };

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

  let animationId: number;
  const animate = () => {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  // Add cleanup function to container
  (container as any).cleanup = () => {
    // Cancel animation
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    // Dispose controls
    controls.dispose();

    // Dispose renderer and WebGL context
    renderer.dispose();
    renderer.forceContextLoss();

    // Clear scene
    while (scene.children.length > 0) {
      const object = scene.children[0];
      if (object.type === "Mesh") {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => material.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
      scene.remove(object);
    }

    // Remove canvas from container
    if (container.children.length > 0) {
      container.removeChild(container.children[0]);
    }
  };

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

  let animationId: number;
  const animate = () => {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  // Add cleanup function to container
  (container as any).cleanup = () => {
    // Cancel animation
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    // Dispose controls
    controls.dispose();

    // Dispose renderer and WebGL context
    renderer.dispose();
    renderer.forceContextLoss();

    // Clear scene
    while (scene.children.length > 0) {
      const object = scene.children[0];
      if (object.type === "Mesh") {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => material.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
      scene.remove(object);
    }

    // Remove canvas from container
    if (container.children.length > 0) {
      container.removeChild(container.children[0]);
    }
  };

  return container;
};

// Test data examples for improved 3D charts
export const getTest3DData = () => {
  // Test data with string categories
  const stringCategoriesData = [
    { x: "Jan", y: 25, z: "North" },
    { x: "Jan", y: 30, z: "South" },
    { x: "Feb", y: 35, z: "North" },
    { x: "Feb", y: 28, z: "South" },
    { x: "Mar", y: 40, z: "North" },
    { x: "Mar", y: 32, z: "South" },
    { x: "Apr", y: 45, z: "North" },
    { x: "Apr", y: 38, z: "South" },
  ];

  // Test data with numeric coordinates
  const numericData = [
    { x: 1, y: 25, z: 1 },
    { x: 2, y: 30, z: 1 },
    { x: 3, y: 35, z: 1 },
    { x: 1, y: 28, z: 2 },
    { x: 2, y: 32, z: 2 },
    { x: 3, y: 38, z: 2 },
  ];

  // Mixed data - strings for X, numbers for Z
  const mixedData = [
    { x: "Product A", y: 100, z: 2023 },
    { x: "Product B", y: 150, z: 2023 },
    { x: "Product C", y: 120, z: 2023 },
    { x: "Product A", y: 110, z: 2024 },
    { x: "Product B", y: 160, z: 2024 },
    { x: "Product C", y: 140, z: 2024 },
  ];

  return {
    stringCategoriesData,
    numericData,
    mixedData,
  };
};

// --- ECharts 3D Bar Chart ---
/**
 * Membuat 3D Bar Chart menggunakan Apache ECharts (echarts + echarts-gl)
 * @param data Array<{ x: string|number, y: number, z: string|number }>
 * @param width Lebar chart (px)
 * @param height Tinggi chart (px)
 * @returns HTMLDivElement yang sudah terisi chart
 */
export function createECharts3DBarChart(
  data: Array<{ x: string | number; y: number; z: string | number }>,
  width: number = 600,
  height: number = 400
): HTMLDivElement {
  // Siapkan container
  const container = document.createElement("div");
  container.style.width = width + "px";
  container.style.height = height + "px";

  // Siapkan data unik untuk sumbu
  const xCategories = Array.from(new Set(data.map((d) => d.x)));
  const zCategories = Array.from(new Set(data.map((d) => d.z)));

  // Siapkan data untuk series
  const seriesData = data.map((d) => [
    typeof d.x === "number" ? d.x : xCategories.indexOf(d.x),
    typeof d.z === "number" ? d.z : zCategories.indexOf(d.z),
    d.y,
  ]);

  // Option ECharts 3D Bar
  const option = {
    tooltip: {},
    visualMap: {
      max: Math.max(...data.map((d) => d.y)),
      inRange: {
        color: ["#87aa66", "#eba438", "#d94d4c"],
      },
    },
    xAxis3D: {
      type: "category",
      data: xCategories,
      name: "X",
      nameGap: 20,
    },
    yAxis3D: {
      type: "value",
      name: "Y",
      nameGap: 20,
    },
    zAxis3D: {
      type: "category",
      data: zCategories,
      name: "Z",
      nameGap: 20,
    },
    grid3D: {
      boxWidth: 100,
      boxDepth: 80,
      viewControl: {
        // autoRotate: true,
        projection: "perspective",
      },
      light: {
        main: {
          intensity: 1.2,
          shadow: true,
        },
        ambient: {
          intensity: 0.3,
        },
      },
    },
    series: [
      {
        type: "bar3D",
        data: seriesData,
        shading: "color",
        label: {
          show: false,
          fontSize: 12,
          borderWidth: 1,
        },
        emphasis: {
          label: {
            fontSize: 16,
            color: "#900",
          },
          itemStyle: {
            color: "#f00",
          },
        },
      },
    ],
  };

  // Inisialisasi ECharts
  const chart = echarts.init(container);
  chart.setOption(option);

  // Cleanup: destroy chart instance saat container dihapus
  (container as any).cleanup = () => {
    chart.dispose();
  };

  return container;
}
