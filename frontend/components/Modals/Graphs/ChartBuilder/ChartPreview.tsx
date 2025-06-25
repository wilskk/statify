import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { chartUtils } from "@/utils/chartBuilder/chartTypes/chartUtils";
import * as d3 from "d3";
import { ChartType } from "@/components/Modals/Graphs/ChartTypes";
import { chartVariableConfig } from "./ChartVariableConfig";
import clsx from "clsx";
import { createVerticalBarChart2 } from "@/utils/chartBuilder/chartTypes/barChartUtils";
import { createHorizontalBarChart } from "@/utils/chartBuilder/chartTypes/barChartUtils";
import { createLineChart } from "@/utils/chartBuilder/chartTypes/lineChartUtils";

interface ChartPreviewProps {
  chartType: ChartType;
  width: number;
  height: number;
  useaxis: boolean;
  sideVariables: string[];
  side2Variables: string[];
  bottomVariables: string[];
  bottom2Variables: string[];
  colorVariables: string[];
  filterVariables: string[];
  lowVariables: string[];
  highVariables: string[];
  closeVariables: string[];
  onDropSide: (variables: string[]) => void;
  onDropSide2: (variables: string[]) => void;
  onDropBottom: (variables: string[]) => void;
  onDropBottom2: (variables: string[]) => void;
  onDropColor: (variables: string[]) => void;
  onDropFilter: (variables: string[]) => void;
  onDropLow: (variables: string[]) => void;
  onDropHigh: (variables: string[]) => void;
  onDropClose: (variables: string[]) => void;
  handleRemoveVariable: (
    type: "side" | "bottom" | "low" | "high" | "close" | "side2" | "bottom2",
    index: number
  ) => void;
  validateChartVariables: (
    chartType: ChartType,
    sideVariables: string[],
    bottomVariables: string[],
    lowVariables: string[],
    highVariables: string[],
    closeVariables: string[]
  ) => boolean;
  // Add new props for chart customization
  chartTitle?: string;
  chartSubtitle?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  // Tambahkan props baru untuk axis scale
  xAxisMin?: string;
  xAxisMax?: string;
  xAxisMajorIncrement?: string;
  xAxisOrigin?: string;
  yAxisMin?: string;
  yAxisMax?: string;
  yAxisMajorIncrement?: string;
  yAxisOrigin?: string;
  // Tambahkan prop chartColors
  chartColors?: string[];
  chartTitleFontSize?: number;
  chartSubtitleFontSize?: number;
}

// Definisi interface untuk data chart
interface ChartData {
  category: string;
  subcategory?: string;
  value: number;
  error?: number;
  x?: number;
  y?: number;
  color?: string | number;
  group?: string;
  [key: string]: any;
}

const ChartPreview: React.FC<ChartPreviewProps> = ({
  chartType,
  width,
  height,
  useaxis,
  sideVariables,
  side2Variables,
  bottomVariables,
  bottom2Variables,
  colorVariables,
  filterVariables,
  lowVariables,
  highVariables,
  closeVariables,
  onDropSide,
  onDropSide2,
  onDropBottom,
  onDropBottom2,
  onDropColor,
  onDropFilter,
  onDropLow,
  onDropHigh,
  onDropClose,
  handleRemoveVariable,
  validateChartVariables,
  chartTitle,
  chartSubtitle,
  xAxisLabel,
  yAxisLabel,
  xAxisMin,
  xAxisMax,
  xAxisMajorIncrement,
  xAxisOrigin,
  yAxisMin,
  yAxisMax,
  yAxisMajorIncrement,
  yAxisOrigin,
  chartColors,
  chartTitleFontSize,
  chartSubtitleFontSize,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    "side" | "bottom" | "low" | "high" | "close" | "side2" | "bottom2"
  >("side");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const variables = useVariableStore.getState().variables;
  const data = useDataStore((state) => state.data);

  const [modalState, setModalState] = useState<{
    type: string | null;
    isOpen: boolean;
  }>({
    type: null,
    isOpen: false,
  });
  const variablesToShow =
    modalState.type === "side"
      ? sideVariables
      : modalState.type === "side2"
      ? side2Variables
      : modalState.type === "bottom"
      ? bottomVariables
      : modalState.type === "bottom2"
      ? bottom2Variables
      : modalState.type === "color"
      ? colorVariables
      : modalState.type === "filter"
      ? filterVariables
      : modalState.type === "low"
      ? lowVariables
      : modalState.type === "high"
      ? highVariables
      : modalState.type === "close"
      ? closeVariables
      : [];

  // Fungsi untuk membuka modal
  const handleOpenModal = (
    type:
      | "side"
      | "bottom"
      | "low"
      | "high"
      | "close"
      | "side2"
      | "bottom2"
      | "color"
      | "filter"
  ) => {
    setModalState({ type, isOpen: true });
  };

  // Fungsi untuk menutup modal
  const handleCloseModal = () => {
    setModalState({ type: null, isOpen: false });
  };

  // Memuat data dan variabel ketika komponen pertama kali dimuat
  // useEffect(() => {
  //   loadData(); // Memuat data dari useDataStore
  //   loadVariables(); // Updated: removed parameter as it's not needed in current implementation
  // }, [loadData, loadVariables]);

  // Fungsi untuk menangani drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Mengizinkan drop
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    dropZone:
      | "side"
      | "bottom"
      | "color"
      | "filter"
      | "high"
      | "low"
      | "close"
      | "side2"
      | "bottom2"
  ) => {
    e.preventDefault();
    const variableName = e.dataTransfer.getData("text/plain");

    if (!variableName) {
      console.warn("No variable detected in drag event");
      return;
    }

    // Ambil konfigurasi chartType saat ini
    const config = chartVariableConfig[chartType];

    if (dropZone === "side" && config.side.max > 0) {
      if (sideVariables.length >= config.side.max) {
        // Jika sudah mencapai maksimum, ganti variabel pertama
        const updatedSideVariables = [variableName];
        onDropSide(updatedSideVariables);
        console.log(`Replacing side variables with: ${updatedSideVariables}`);
      } else {
        // Tambahkan variabel jika belum penuh
        const updatedSideVariables = [...sideVariables, variableName];
        onDropSide(updatedSideVariables);
        console.log(`Added to side variables: ${updatedSideVariables}`);
      }
    } else if (dropZone === "bottom" && config.bottom.max > 0) {
      if (bottomVariables.length >= config.bottom.max) {
        // Jika sudah mencapai maksimum, ganti variabel pertama
        const updatedBottomVariables = [variableName];
        onDropBottom(updatedBottomVariables);
        console.log(
          `Replacing bottom variables with: ${updatedBottomVariables}`
        );
      } else {
        // Tambahkan variabel jika belum penuh
        const updatedBottomVariables = [...bottomVariables, variableName];
        onDropBottom(updatedBottomVariables);
        console.log(`Added to bottom variables: ${updatedBottomVariables}`);
      }
    } else if (dropZone === "color" && config.color && config.color.max > 0) {
      if (colorVariables.length >= config.color?.max) {
        const updatedColorVariables = [variableName];
        onDropColor(updatedColorVariables);
        console.log(`Replacing color variables with: ${updatedColorVariables}`);
      } else {
        const updatedColorVariables = [...colorVariables, variableName];
        onDropColor(updatedColorVariables);
        console.log(`Added to color variables: ${updatedColorVariables}`);
      }
    } else if (
      dropZone === "filter" &&
      config.filter &&
      config.filter.max > 0
    ) {
      if (filterVariables.length >= config.filter?.max) {
        const updatedFilterVariables = [variableName];
        onDropFilter(updatedFilterVariables);
        console.log(
          `Replacing filter variables with: ${updatedFilterVariables}`
        );
      } else {
        const updatedFilterVariables = [...filterVariables, variableName];
        onDropFilter(updatedFilterVariables);
        console.log(`Added to filter variables: ${updatedFilterVariables}`);
      }
    } else if (dropZone === "low" && config.low && config.low.max > 0) {
      if (lowVariables.length >= config.low.max) {
        const updatedLowVariables = [variableName];
        onDropLow(updatedLowVariables);
        console.log(`Replacing low variables with: ${updatedLowVariables}`);
      } else {
        const updatedLowVariables = [...lowVariables, variableName];
        onDropLow(updatedLowVariables);
        console.log(`Added to low variables: ${updatedLowVariables}`);
      }
    } else if (dropZone === "high" && config.high && config.high.max > 0) {
      if (highVariables.length >= config.high.max) {
        const updatedHighVariables = [variableName];
        onDropHigh(updatedHighVariables);
        console.log(`Replacing high variables with: ${updatedHighVariables}`);
      } else {
        const updatedHighVariables = [...highVariables, variableName];
        onDropHigh(updatedHighVariables);
        console.log(`Added to high variables: ${updatedHighVariables}`);
      }
    } else if (dropZone === "close" && config.close && config.close.max > 0) {
      if (closeVariables.length >= config.close.max) {
        const updatedCloseVariables = [variableName];
        onDropClose(updatedCloseVariables);
        console.log(`Replacing close variables with: ${updatedCloseVariables}`);
      } else {
        const updatedCloseVariables = [...closeVariables, variableName];
        onDropClose(updatedCloseVariables);
        console.log(`Added to close variables: ${updatedCloseVariables}`);
      }
    } else if (dropZone === "side2" && config.side2 && config.side2.max > 0) {
      if (side2Variables.length >= config.side2.max) {
        const updatedSide2Variables = [variableName];
        onDropSide2(updatedSide2Variables);
        console.log(`Replacing side2 variables with: ${updatedSide2Variables}`);
      } else {
        const updatedSide2Variables = [...side2Variables, variableName];
        onDropSide2(updatedSide2Variables);
        console.log(`Added to side2 variables: ${updatedSide2Variables}`);
      }
    } else if (
      dropZone === "bottom2" &&
      config.bottom2 &&
      config.bottom2.max > 0
    ) {
      if (bottom2Variables.length >= config.bottom2.max) {
        const updatedBottom2Variables = [variableName];
        onDropBottom2(updatedBottom2Variables);
        console.log(
          `Replacing bottom2 variables with: ${updatedBottom2Variables}`
        );
      } else {
        const updatedBottom2Variables = [...bottom2Variables, variableName];
        onDropBottom2(updatedBottom2Variables);
        console.log(`Added to bottom2 variables: ${updatedBottom2Variables}`);
      }
    } else {
      console.log(`Penambahan ${dropZone} tidak diizinkan`);
    }
  };

  // Fungsi untuk mengambil data chart
  // const getDataForChart = (): ChartData[] => {
  //   const bottomIndex = variables.findIndex(
  //     (variable) => variable.name === bottomVariables[0]
  //   );

  //   const sideIndices = sideVariables.map((varName) =>
  //     variables.findIndex((variable) => variable.name === varName)
  //   );

  //   const colorIndex = colorVariables.length
  //     ? variables.findIndex((variable) => variable.name === colorVariables[0])
  //     : -1;

  //   const filterIndices = filterVariables.map((varName) =>
  //     variables.findIndex((variable) => variable.name === varName)
  //   );

  //   // Cek apakah tidak ada variabel bottom, side, atau color yang valid
  //   if (
  //     bottomIndex === -1 &&
  //     sideIndices.every((index) => index === -1) &&
  //     colorIndex === -1
  //   ) {
  //     return [];
  //   }

  //   // **Cek jika hanya colorVariables yang valid**
  //   if (
  //     colorIndex !== -1 &&
  //     bottomIndex === -1 &&
  //     sideIndices.every((index) => index === -1)
  //   ) {
  //     return data.map((row) => ({
  //       category: "Unknown", // Karena tidak ada bottomVariable, kategori diisi default
  //       value: 0, // Tidak ada nilai terkait karena hanya color yang digunakan
  //       color: row[colorIndex], // Tambahkan warna
  //     }));
  //   }

  //   // Jika hanya ada variabel bottom yang valid
  //   if (bottomIndex !== -1 && sideIndices.every((index) => index === -1)) {
  //     return data.map((row) => ({
  //       category: row[bottomIndex],
  //       value: 0, // Set nilai default jika sideVariables kosong
  //       ...(colorIndex !== -1 ? { color: row[colorIndex] } : {}),
  //     }));
  //   }

  //   // Jika ada variabel side yang valid tetapi tidak ada variabel bottom
  //   if (sideIndices.some((index) => index !== -1) && bottomIndex === -1) {
  //     const results: ChartData[] = [];

  //     data.forEach((row) => {
  //       sideIndices.forEach((index, i) => {
  //         if (index !== -1) {
  //           results.push({
  //             category: "Unknown",
  //             subcategory: sideVariables[i] || "",
  //             value: parseFloat(row[index] || "0"),
  //             ...(colorIndex !== -1 ? { color: row[colorIndex] } : {}),
  //           });
  //         }
  //       });
  //     });

  //     console.log("Hasil akhir (results):", results);
  //     return results;
  //   }

  //   // Jika variabel side dan bottom valid
  //   // Filter indeks variabel side yang valid
  //   const validSideIndices = sideIndices.filter((index) => index !== -1);

  //   if (validSideIndices.length === 1) {
  //     // Kasus satu variabel side
  //     const sideIndex = validSideIndices[0];
  //     const sideVariableName = sideVariables[sideIndices.indexOf(sideIndex)];
  //     return data.map((row) => ({
  //       category: row[bottomIndex],
  //       subcategory: sideVariableName,
  //       value: parseFloat(row[sideIndex] || "0"),
  //       ...(colorIndex !== -1 ? { color: row[colorIndex] } : {}),
  //     }));
  //   } else {
  //     // Kasus lebih dari satu variabel side
  //     const results: ChartData[] = [];

  //     data.forEach((row) => {
  //       sideIndices.forEach((index, i) => {
  //         if (index !== -1) {
  //           results.push({
  //             category: row[bottomIndex],
  //             subcategory: sideVariables[i],
  //             value: parseFloat(row[index] || "0"),
  //             ...(colorIndex !== -1 ? { color: row[colorIndex] } : {}),
  //           });
  //         }
  //       });
  //     });

  //     return results;
  //   }
  // };

  // const getDataForChart = (): ChartData[] => {
  //   const bottomIndices = bottomVariables.map((varName) =>
  //     variables.findIndex((variable) => variable.name === varName)
  //   );

  //   const sideIndices = sideVariables.map((varName) =>
  //     variables.findIndex((variable) => variable.name === varName)
  //   );

  //   const lowIndices = lowVariables.map((varName) =>
  //     variables.findIndex((variable) => variable.name === varName)
  //   );

  //   const highIndices = highVariables.map((varName) =>
  //     variables.findIndex((variable) => variable.name === varName)
  //   );

  //   const closeIndices = closeVariables.map((varName) =>
  //     variables.findIndex((variable) => variable.name === varName)
  //   );

  //   const colorIndex = colorVariables.length
  //     ? variables.findIndex((variable) => variable.name === colorVariables[0])
  //     : -1;

  //   const filterIndices = filterVariables.map((varName) =>
  //     variables.findIndex((variable) => variable.name === varName)
  //   );

  //   // Cek apakah tidak ada variabel bottom, side, atau color yang valid
  //   if (
  //     bottomIndices.every((index) => index === -1) &&
  //     sideIndices.every((index) => index === -1) &&
  //     colorIndex === -1
  //   ) {
  //     return [];
  //   }

  //   // **Cek jika hanya colorVariables yang valid**
  //   if (
  //     colorIndex !== -1 &&
  //     bottomIndices.every((index) => index === -1) &&
  //     sideIndices.every((index) => index === -1)
  //   ) {
  //     return data.map((row) => ({
  //       category: "Unknown", // Karena tidak ada bottomVariable, kategori diisi default
  //       value: 0, // Tidak ada nilai terkait karena hanya color yang digunakan
  //       color: row[colorIndex], // Tambahkan warna
  //     }));
  //   }

  //   // Jika hanya ada variabel bottom yang valid (bisa lebih dari 1 variabel bottom)
  //   if (
  //     bottomIndices.some((index) => index !== -1) &&
  //     sideIndices.every((index) => index === -1)
  //   ) {
  //     return data.map((row) => {
  //       const result: ChartData = { category: "", value: 0 }; // Set nilai default jika sideVariables kosong

  //       // Iterasi untuk mengembalikan semua kategori bottom yang valid
  //       bottomIndices.forEach((index, i) => {
  //         if (index !== -1) {
  //           result[`bottom_${i}`] = row[index]; // Menyimpan nilai bottom dengan key yang berbeda
  //         }
  //       });

  //       // Jika colorIndex valid, tambahkan warna
  //       if (colorIndex !== -1) {
  //         result.color = row[colorIndex];
  //       }

  //       return result;
  //     });
  //   }

  //   // Jika ada variabel side yang valid tetapi tidak ada variabel bottom
  //   if (
  //     sideIndices.some((index) => index !== -1) &&
  //     bottomIndices.every((index) => index === -1)
  //   ) {
  //     const results: ChartData[] = [];

  //     data.forEach((row) => {
  //       sideIndices.forEach((index, i) => {
  //         if (index !== -1) {
  //           const result: ChartData = {
  //             category: "Unknown", // Diisi dengan nilai default
  //             value: parseFloat(row[index] || "0"),
  //             subcategory: sideVariables[i] || "",
  //           };

  //           if (colorIndex !== -1) {
  //             result.color = row[colorIndex];
  //           }

  //           results.push(result);
  //         }
  //       });
  //     });

  //     console.log("Hasil akhir (results):", results);
  //     return results;
  //   }

  //   // Jika variabel side dan bottom valid
  //   const validSideIndices = sideIndices.filter((index) => index !== -1);

  //   if (validSideIndices.length === 1) {
  //     // Kasus satu variabel side
  //     const sideIndex = validSideIndices[0];
  //     const sideVariableName = sideVariables[sideIndices.indexOf(sideIndex)];
  //     return data.map((row) => ({
  //       category: row[bottomIndices[0]], // Menggunakan index bottom pertama
  //       subcategory: sideVariableName,
  //       value: parseFloat(row[sideIndex] || "0"),
  //       ...(colorIndex !== -1 ? { color: row[colorIndex] } : {}),
  //     }));
  //   } else {
  //     // Kasus lebih dari satu variabel side
  //     const results: ChartData[] = [];

  //     data.forEach((row) => {
  //       sideIndices.forEach((index, i) => {
  //         if (index !== -1) {
  //           const result: ChartData = {
  //             category: row[bottomIndices[0]], // Menggunakan index bottom pertama
  //             subcategory: sideVariables[i],
  //             value: parseFloat(row[index] || "0"),
  //           };

  //           if (colorIndex !== -1) {
  //             result.color = row[colorIndex];
  //           }

  //           results.push(result);
  //         }
  //       });
  //     });

  //     return results;
  //   }
  // };

  const getDataForChart = useCallback((): ChartData[] => {
    const bottomIndices = bottomVariables.map((varName) =>
      variables.findIndex((variable) => variable.name === varName)
    );

    const bottom2Indices = bottom2Variables.map((varName) =>
      variables.findIndex((variable) => variable.name === varName)
    );

    const sideIndices = sideVariables.map((varName) =>
      variables.findIndex((variable) => variable.name === varName)
    );

    const side2Indices = side2Variables.map((varName) =>
      variables.findIndex((variable) => variable.name === varName)
    );

    const lowIndices = lowVariables.map((varName) =>
      variables.findIndex((variable) => variable.name === varName)
    );

    const highIndices = highVariables.map((varName) =>
      variables.findIndex((variable) => variable.name === varName)
    );

    const closeIndices = closeVariables.map((varName) =>
      variables.findIndex((variable) => variable.name === varName)
    );

    const colorIndex = colorVariables.length
      ? variables.findIndex((variable) => variable.name === colorVariables[0])
      : -1;

    const filterIndices = filterVariables.map((varName) =>
      variables.findIndex((variable) => variable.name === varName)
    );

    // **Ensure that low, high, or close can still be processed even if no bottom or side variables are valid**
    if (
      lowIndices.every((index) => index === -1) &&
      highIndices.every((index) => index === -1) &&
      closeIndices.every((index) => index === -1) &&
      bottomIndices.every((index) => index === -1) &&
      sideIndices.every((index) => index === -1) &&
      bottom2Indices.every((index) => index === -1)
    ) {
      return [];
    }

    // **Cek jika hanya colorVariables yang valid**
    if (
      colorIndex !== -1 &&
      bottomIndices.every((index) => index === -1) &&
      sideIndices.every((index) => index === -1)
    ) {
      return data.map((row) => ({
        category: "Unknown", // Karena tidak ada bottomVariable, kategori diisi default
        value: 0, // Tidak ada nilai terkait karena hanya color yang digunakan
        color: row[colorIndex], // Tambahkan warna
      }));
    }

    // **Handle only low, high, or close variables**
    if (
      lowIndices.some((index) => index !== -1) &&
      highIndices.every((index) => index === -1) &&
      closeIndices.every((index) => index === -1)
    ) {
      return data.map((row) => {
        const result: ChartData = { category: "Unknown", value: 0 }; // Ensure category and value are present

        lowIndices.forEach((index, i) => {
          if (index !== -1) {
            result[`low_${i}`] = row[index];
          }
        });

        if (colorIndex !== -1) {
          result.color = row[colorIndex];
        }

        return result;
      });
    }

    if (
      highIndices.some((index) => index !== -1) &&
      lowIndices.every((index) => index === -1) &&
      closeIndices.every((index) => index === -1)
    ) {
      return data.map((row) => {
        const result: ChartData = { category: "Unknown", value: 0 }; // Ensure category and value are present

        highIndices.forEach((index, i) => {
          if (index !== -1) {
            result[`high_${i}`] = row[index];
          }
        });

        if (colorIndex !== -1) {
          result.color = row[colorIndex];
        }

        return result;
      });
    }

    if (
      closeIndices.some((index) => index !== -1) &&
      lowIndices.every((index) => index === -1) &&
      highIndices.every((index) => index === -1)
    ) {
      return data.map((row) => {
        const result: ChartData = { category: "Unknown", value: 0 }; // Ensure category and value are present

        closeIndices.forEach((index, i) => {
          if (index !== -1) {
            result[`close_${i}`] = row[index];
          }
        });

        if (colorIndex !== -1) {
          result.color = row[colorIndex];
        }

        return result;
      });
    }

    // Jika hanya ada variabel bottom yang valid (bisa lebih dari 1 variabel bottom)
    if (
      bottomIndices.some((index) => index !== -1) &&
      sideIndices.every((index) => index === -1)
    ) {
      return data.map((row) => {
        const result: ChartData = { category: "", value: 0 }; // Set nilai default jika sideVariables kosong

        // Iterasi untuk mengembalikan semua kategori bottom yang valid
        bottomIndices.forEach((index, i) => {
          if (index !== -1) {
            result[`bottom_${i}`] = row[index]; // Menyimpan nilai bottom dengan key yang berbeda
          }
        });

        bottom2Indices.forEach((index, i) => {
          if (index !== -1) {
            result[`bottom2_${i}`] = row[index]; // Menyimpan nilai bottom dengan key yang berbeda
          }
        });

        // Jika colorIndex valid, tambahkan warna
        if (colorIndex !== -1) {
          result.color = row[colorIndex];
        }

        // Handle low, high, close variables
        lowIndices.forEach((index, i) => {
          if (index !== -1) {
            result[`low_${i}`] = row[index];
          }
        });

        highIndices.forEach((index, i) => {
          if (index !== -1) {
            result[`high_${i}`] = row[index];
          }
        });

        closeIndices.forEach((index, i) => {
          if (index !== -1) {
            result[`close_${i}`] = row[index];
          }
        });

        return result;
      });
    }

    // Jika hanya ada variabel bottom yang valid (bisa lebih dari 1 variabel bottom)
    if (
      bottom2Indices.some((index) => index !== -1) &&
      side2Indices.every((index) => index === -1) &&
      bottomIndices.every((index) => index === -1)
    ) {
      return data.map((row) => {
        const result: ChartData = { category: "", value: 0 }; // Set nilai default jika sideVariables kosong

        // Iterasi untuk mengembalikan semua kategori bottom yang valid
        bottom2Indices.forEach((index, i) => {
          if (index !== -1) {
            result[`bottom2_${i}`] = row[index]; // Menyimpan nilai bottom dengan key yang berbeda
          }
        });

        // Jika colorIndex valid, tambahkan warna
        if (colorIndex !== -1) {
          result.color = row[colorIndex];
        }

        return result;
      });
    }

    // Jika ada variabel side yang valid tetapi tidak ada variabel bottom
    if (
      sideIndices.some((index) => index !== -1) &&
      bottomIndices.every((index) => index === -1)
    ) {
      const results: ChartData[] = [];

      data.forEach((row) => {
        sideIndices.forEach((index, i) => {
          if (index !== -1) {
            const result: ChartData = {
              category: "Unknown", // Diisi dengan nilai default
              value: parseFloat(String(row[index] ?? "0")),
              subcategory: sideVariables[i] || "",
            };

            if (colorIndex !== -1) {
              result.color = row[colorIndex];
            }

            // Handle low, high, close variables
            lowIndices.forEach((index, i) => {
              if (index !== -1) {
                result[`low_${i}`] = row[index];
              }
            });

            highIndices.forEach((index, i) => {
              if (index !== -1) {
                result[`high_${i}`] = parseFloat(String(row[index] ?? "0"));
              }
            });

            closeIndices.forEach((index, i) => {
              if (index !== -1) {
                result[`close_${i}`] = parseFloat(String(row[index] ?? "0"));
              }
            });

            results.push(result);
          }
        });
      });

      console.log("Hasil akhir (results):", results);
      return results;
    }

    // Jika variabel side dan bottom valid
    const validSideIndices = sideIndices.filter((index) => index !== -1);

    if (validSideIndices.length === 1) {
      // Kasus satu variabel side
      const sideIndex = validSideIndices[0];
      const sideVariableName = sideVariables[sideIndices.indexOf(sideIndex)];

      return data.map((row) => {
        const result: ChartData = {
          category: String(row[bottomIndices[0]]), // Menggunakan index bottom pertama
          subcategory: sideVariableName,
          value: parseFloat(String(row[sideIndex] || "0")),
          ...(colorIndex !== -1 ? { color: row[colorIndex] } : {}),
        };
        // Handle low, high, close variables
        if (side2Indices[0] !== -1) {
          result.side2 = parseFloat(String(row[side2Indices[0]]) || "0");
        }
        // Handle low, high, close variables
        if (lowIndices[0] !== -1) {
          result.low_0 = parseFloat(String(row[lowIndices[0]]) || "0");
        }
        if (highIndices[0] !== -1) {
          result.high_0 = parseFloat(String(row[highIndices[0]]) || "0");
        }
        if (closeIndices[0] !== -1) {
          result.close_0 = parseFloat(String(row[closeIndices[0]]) || "0");
        }
        if (bottom2Indices[0] !== -1) {
          result.bottom2_0 = parseFloat(String(row[bottom2Indices[0]]) || "0");
        }

        return result;
      });
    } else {
      // Kasus lebih dari satu variabel side
      const results: ChartData[] = [];

      data.forEach((row) => {
        sideIndices.forEach((index, i) => {
          if (index !== -1) {
            const result: ChartData = {
              category: String(row[bottomIndices[0]]), // Menggunakan index bottom pertama
              subcategory: sideVariables[i],
              value: parseFloat(String(row[index] || "0")),
            };

            if (colorIndex !== -1) {
              result.color = row[colorIndex];
            }

            // Handle low, high, close variables
            if (lowIndices[i] !== -1) {
              result[`low_${i}`] = parseFloat(
                String(row[lowIndices[i]]) || "0"
              );
            }
            if (highIndices[i] !== -1) {
              result[`high_${i}`] = parseFloat(
                String(row[highIndices[i]]) || "0"
              );
            }
            if (closeIndices[i] !== -1) {
              result[`close_${i}`] = parseFloat(
                String(row[closeIndices[i]]) || "0"
              );
            }
            if (bottom2Indices[i] !== -1) {
              result[`bottom2_${i}`] = parseFloat(
                String(row[bottom2Indices[i]]) || "0"
              );
            }

            results.push(result);
          }
        });
      });

      return results;
    }
  }, [
    data,
    bottomVariables,
    bottom2Variables,
    sideVariables,
    side2Variables,
    highVariables,
    lowVariables,
    filterVariables,
    closeVariables,
    colorVariables,
    variables,
  ]);

  // const getDataForChart = (): ChartData[] => {
  //   const bottomIndices = bottomVariables.map((varName) =>
  //     variables.findIndex((variable) => variable.name === varName)
  //   );

  //   const sideIndices = sideVariables.map((varName) =>
  //     variables.findIndex((variable) => variable.name === varName)
  //   );

  //   const lowIndices = lowVariables.map((varName) =>
  //     variables.findIndex((variable) => variable.name === varName)
  //   );

  //   const highIndices = highVariables.map((varName) =>
  //     variables.findIndex((variable) => variable.name === varName)
  //   );

  //   const closeIndices = closeVariables.map((varName) =>
  //     variables.findIndex((variable) => variable.name === varName)
  //   );

  //   const colorIndex = colorVariables.length
  //     ? variables.findIndex((variable) => variable.name === colorVariables[0])
  //     : -1;

  //   const filterIndices = filterVariables.map((varName) =>
  //     variables.findIndex((variable) => variable.name === varName)
  //   );

  //   // **Ensure that low, high, or close can still be processed even if no bottom or side variables are valid**
  //   if (
  //     lowIndices.every((index) => index === -1) &&
  //     highIndices.every((index) => index === -1) &&
  //     closeIndices.every((index) => index === -1) &&
  //     bottomIndices.every((index) => index === -1) &&
  //     sideIndices.every((index) => index === -1)
  //   ) {
  //     return [];
  //   }

  //   // **Handle only low, high, or close variables**
  //   if (
  //     lowIndices.some((index) => index !== -1) &&
  //     highIndices.every((index) => index === -1) &&
  //     closeIndices.every((index) => index === -1)
  //   ) {
  //     return data.map((row) => {
  //       const result: ChartData = { category: "Unknown", value: 0 }; // Ensure category and value are present

  //       lowIndices.forEach((index, i) => {
  //         if (index !== -1) {
  //           result[`low_${i}`] = row[index];
  //         }
  //       });

  //       if (colorIndex !== -1) {
  //         result.color = row[colorIndex];
  //       }

  //       return result;
  //     });
  //   }

  //   if (
  //     highIndices.some((index) => index !== -1) &&
  //     lowIndices.every((index) => index === -1) &&
  //     closeIndices.every((index) => index === -1)
  //   ) {
  //     return data.map((row) => {
  //       const result: ChartData = { category: "Unknown", value: 0 }; // Ensure category and value are present

  //       highIndices.forEach((index, i) => {
  //         if (index !== -1) {
  //           result[`high_${i}`] = row[index];
  //         }
  //       });

  //       if (colorIndex !== -1) {
  //         result.color = row[colorIndex];
  //       }

  //       return result;
  //     });
  //   }

  //   if (
  //     closeIndices.some((index) => index !== -1) &&
  //     lowIndices.every((index) => index === -1) &&
  //     highIndices.every((index) => index === -1)
  //   ) {
  //     return data.map((row) => {
  //       const result: ChartData = { category: "Unknown", value: 0 }; // Ensure category and value are present

  //       closeIndices.forEach((index, i) => {
  //         if (index !== -1) {
  //           result[`close_${i}`] = row[index];
  //         }
  //       });

  //       if (colorIndex !== -1) {
  //         result.color = row[colorIndex];
  //       }

  //       return result;
  //     });
  //   }

  //   // Handle cases when low, high, or close are mixed with other variables (like bottom or side)
  //   const results: ChartData[] = [];

  //   data.forEach((row) => {
  //     const result: ChartData = { category: "Unknown", value: 0 }; // Ensure category and value are present

  //     // Handle bottom and side variables as before
  //     bottomIndices.forEach((index, i) => {
  //       if (index !== -1) {
  //         result[`bottom_${i}`] = row[index];
  //       }
  //     });

  //     sideIndices.forEach((index, i) => {
  //       if (index !== -1) {
  //         result[`side_${i}`] = row[index];
  //       }
  //     });

  //     // Handle low, high, close variables
  //     lowIndices.forEach((index, i) => {
  //       if (index !== -1) {
  //         result[`low_${i}`] = row[index];
  //       }
  //     });

  //     highIndices.forEach((index, i) => {
  //       if (index !== -1) {
  //         result[`high_${i}`] = row[index];
  //       }
  //     });

  //     closeIndices.forEach((index, i) => {
  //       if (index !== -1) {
  //         result[`close_${i}`] = row[index];
  //       }
  //     });

  //     // Add color if present
  //     if (colorIndex !== -1) {
  //       result.color = row[colorIndex];
  //     }

  //     results.push(result);
  //   });

  //   return results;
  // };

  const getLowVariableData = (chartData: ChartData[]): ChartData[] => {
    const lowIndices = lowVariables.map((varName) =>
      variables.findIndex((variable) => variable.name === varName)
    );
    return chartData.map((row) => {
      const updatedRow = { ...row }; // Make a copy of the row to modify

      // Add low value if the index is valid
      lowIndices.forEach((index) => {
        if (index !== -1) {
          updatedRow.low = parseFloat(row[index] || "0"); // Add low value to the row
        }
      });

      return updatedRow; // Return the updated row
    });
  };

  const getHighVariableData = (chartData: ChartData[]): ChartData[] => {
    // Find indices for high variables in the data
    const highIndices = highVariables.map((varName) =>
      variables.findIndex((variable) => variable.name === varName)
    );
    console.log("highIndices", highIndices);

    return chartData.map((row) => {
      const updatedRow = { ...row }; // Copy row to modify
      console.log("update row", updatedRow);
      console.log("row:", row); // Debug untuk melihat struktur row

      // Add high value if the index is valid
      highIndices.forEach((index) => {
        if (index !== -1) {
          const variableName = variables[index].name;
          const value = row[index];
          console.log(`Value for ${variableName}:`, value); // Debugging untuk melihat nilai yang diambil
          updatedRow.high = parseFloat(value || "0");
        }
      });

      return updatedRow; // Return the updated row with high value
    });
  };

  // Process close values
  const getCloseVariableData = (chartData: ChartData[]): ChartData[] => {
    const closeIndices = closeVariables.map((varName) =>
      variables.findIndex((variable) => variable.name === varName)
    );
    return chartData.map((row) => {
      const updatedRow = { ...row }; // Copy row to modify

      // Add close value if the index is valid
      closeIndices.forEach((index) => {
        if (index !== -1) {
          updatedRow.close = parseFloat(row[index] || "0"); // Add close value to the row
        }
      });

      return updatedRow; // Return the updated row with close value
    });
  };

  const getChartData = async () => {
    try {
      const response = await fetch("/api/chart-data");
      if (!response.ok) {
        throw new Error("Failed to fetch chart data");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching chart data:", error);
      return null;
    }
  };

  useEffect(() => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove(); // Menghapus chart sebelumnya

      // Ambil data untuk chart, jika variabel tidak ada gunakan data default
      const chartData = getDataForChart();

      // Switch case untuk memilih jenis chart berdasarkan chartType
      let chartNode = null;

      switch (chartType) {
        case "Vertical Bar Chart":
          chartNode =
            chartData.length === 0
              ? chartUtils.createVerticalBarChart2(
                  [
                    { category: "A", value: 30 },
                    { category: "B", value: 80 },
                    { category: "C", value: 45 },
                    { category: "D", value: 60 },
                    { category: "E", value: 20 },
                    { category: "F", value: 90 },
                  ],
                  width,
                  height,
                  useaxis,
                  {
                    title: chartTitle || "Vertical Bar Chart",
                    subtitle: chartSubtitle || "Sample Data",
                    titleColor: "hsl(var(--foreground))",
                    subtitleColor: "hsl(var(--muted-foreground))",
                    titleFontSize: 16,
                    subtitleFontSize: 12,
                  },
                  {
                    x: xAxisLabel || "Category",
                    y: yAxisLabel || "Value",
                  },
                  {
                    x: {
                      min: xAxisMin,
                      max: xAxisMax,
                      majorIncrement: xAxisMajorIncrement,
                      origin: xAxisOrigin,
                    },
                    y: {
                      min: yAxisMin,
                      max: yAxisMax,
                      majorIncrement: yAxisMajorIncrement,
                      origin: yAxisOrigin,
                    },
                  },
                  chartColors
                )
              : chartUtils.createVerticalBarChart2(
                  chartData.filter(
                    (d) => d.category !== "" && d.value != null && d.value !== 0
                  ),
                  width,
                  height,
                  useaxis,
                  {
                    title:
                      chartTitle ||
                      `Vertical Bar Chart: ${bottomVariables[0] || ""} vs ${
                        sideVariables[0] || ""
                      }`,
                    subtitle:
                      chartSubtitle ||
                      `Showing distribution of ${
                        sideVariables[0] || ""
                      } across ${bottomVariables[0] || ""} categories`,
                    titleColor: "hsl(var(--foreground))",
                    subtitleColor: "hsl(var(--muted-foreground))",
                    titleFontSize: 16,
                    subtitleFontSize: 12,
                  },
                  {
                    x: xAxisLabel || bottomVariables[0] || "Category",
                    y: yAxisLabel || sideVariables[0] || "Value",
                  },
                  {
                    x: {
                      min: xAxisMin,
                      max: xAxisMax,
                      majorIncrement: xAxisMajorIncrement,
                      origin: xAxisOrigin,
                    },
                    y: {
                      min: yAxisMin,
                      max: yAxisMax,
                      majorIncrement: yAxisMajorIncrement,
                      origin: yAxisOrigin,
                    },
                  },
                  chartColors
                );
          break;

        case "Horizontal Bar Chart":
          chartNode =
            chartData.length === 0
              ? chartUtils.createHorizontalBarChart(
                  [
                    { category: "A", value: 30 },
                    { category: "B", value: 80 },
                    { category: "C", value: 45 },
                    { category: "D", value: 60 },
                    { category: "E", value: 20 },
                    { category: "F", value: 90 },
                  ],
                  width,
                  height,
                  useaxis,
                  undefined,
                  undefined,
                  {
                    title: chartTitle || "Horizontal Bar Chart",
                    subtitle: chartSubtitle || "Sample Data",
                    titleColor: "hsl(var(--foreground))",
                    subtitleColor: "hsl(var(--muted-foreground))",
                    titleFontSize: 16,
                    subtitleFontSize: 12,
                  },
                  {
                    x: xAxisLabel || "Category",
                    y: yAxisLabel || "Value",
                  },
                  {
                    x: {
                      min: xAxisMin,
                      max: xAxisMax,
                      majorIncrement: xAxisMajorIncrement,
                      origin: xAxisOrigin,
                    },
                    y: {
                      min: yAxisMin,
                      max: yAxisMax,
                      majorIncrement: yAxisMajorIncrement,
                      origin: yAxisOrigin,
                    },
                  },
                  chartColors
                )
              : chartUtils.createHorizontalBarChart(
                  chartData,
                  width,
                  height,
                  useaxis,
                  undefined,
                  undefined,
                  {
                    title:
                      chartTitle ||
                      `Horizontal Bar Chart: ${bottomVariables[0] || ""} vs ${
                        sideVariables[0] || ""
                      }`,
                    subtitle:
                      chartSubtitle ||
                      `Showing distribution of ${
                        sideVariables[0] || ""
                      } across ${bottomVariables[0] || ""} categories`,
                    titleColor: "hsl(var(--foreground))",
                    subtitleColor: "hsl(var(--muted-foreground))",
                    titleFontSize: 16,
                    subtitleFontSize: 12,
                  },
                  {
                    x: xAxisLabel || bottomVariables[0] || "Category",
                    y: yAxisLabel || sideVariables[0] || "Value",
                  },
                  {
                    x: {
                      min: xAxisMin,
                      max: xAxisMax,
                      majorIncrement: xAxisMajorIncrement,
                      origin: xAxisOrigin,
                    },
                    y: {
                      min: yAxisMin,
                      max: yAxisMax,
                      majorIncrement: yAxisMajorIncrement,
                      origin: yAxisOrigin,
                    },
                  },
                  chartColors
                );
          break;

        case "Vertical Stacked Bar Chart": {
          const formattedData =
            chartData.length === 0
              ? [
                  { category: "male", subcategory: "blue", value: 30 },
                  { category: "male", subcategory: "white", value: 20 },
                  { category: "male", subcategory: "green", value: 10 },
                  { category: "female", subcategory: "blue", value: 25 },
                  { category: "female", subcategory: "white", value: 15 },
                  { category: "female", subcategory: "green", value: 10 },
                ]
              : chartData
                  .filter(
                    (d) =>
                      d.category &&
                      d.category.trim() !== "" &&
                      d.value != null &&
                      d.value !== 0
                  )
                  .map((d) => ({
                    category: d.category,
                    subcategory: d.subcategory || "",
                    value: d.value,
                  }));

          const formatLimitedList = (
            items: string[],
            limit: number = 3
          ): string => {
            const limited = items.slice(0, limit);
            const remaining = items.length - limit;
            if (remaining > 0) {
              return `${limited.join(", ")} and ${remaining} more`;
            }
            return limited.join(", ");
          };

          chartNode = chartUtils.createVerticalStackedBarChart(
            formattedData,
            width,
            height,
            useaxis,
            {
              title: chartTitle || `Vertical Stacked Bar Chart`,
              subtitle:
                chartSubtitle ||
                (bottomVariables.length > 0 && sideVariables.length > 0
                  ? `Showing distribution of ${formatLimitedList(
                      sideVariables
                    )} across ${bottomVariables[0]} categories`
                  : `Sample Data`),

              titleColor: "hsl(var(--foreground))",
              subtitleColor: "hsl(var(--muted-foreground))",
              titleFontSize: 16,
              subtitleFontSize: 12,
            },
            {
              x: xAxisLabel || bottomVariables[0] || "Category",
              y:
                yAxisLabel ||
                (sideVariables.length > 0
                  ? formatLimitedList(sideVariables)
                  : "Value"),
            },
            {
              x: {
                min: xAxisMin,
                max: xAxisMax,
                majorIncrement: xAxisMajorIncrement,
                origin: xAxisOrigin,
              },
              y: {
                min: yAxisMin,
                max: yAxisMax,
                majorIncrement: yAxisMajorIncrement,
                origin: yAxisOrigin,
              },
            },
            chartColors
          );
          break;
        }

        case "Horizontal Stacked Bar Chart": {
          const formattedData =
            chartData.length === 0
              ? [
                  { category: "male", subcategory: "blue", value: 30 },
                  { category: "male", subcategory: "white", value: 20 },
                  { category: "male", subcategory: "green", value: 10 },
                  { category: "female", subcategory: "blue", value: 25 },
                  { category: "female", subcategory: "white", value: 15 },
                  { category: "female", subcategory: "green", value: 10 },
                ]
              : chartData
                  .filter(
                    (d) =>
                      d.category &&
                      d.category.trim() !== "" &&
                      d.value != null &&
                      d.value !== 0
                  )
                  .map((d) => ({
                    category: d.category,
                    subcategory: d.subcategory || "",
                    value: d.value,
                  }));

          const formatLimitedList = (
            items: string[],
            limit: number = 3
          ): string => {
            const limited = items.slice(0, limit);
            const remaining = items.length - limit;
            if (remaining > 0) {
              return `${limited.join(", ")} and ${remaining} more`;
            }
            return limited.join(", ");
          };

          chartNode = chartUtils.createHorizontalStackedBarChart(
            formattedData,
            width,
            height,
            useaxis,
            {
              title: chartTitle || `Horizontal Stacked Bar Chart`,
              subtitle:
                chartSubtitle ||
                (bottomVariables.length > 0 && sideVariables.length > 0
                  ? `Showing distribution of ${formatLimitedList(
                      sideVariables
                    )} across ${bottomVariables[0]} categories`
                  : `Sample Data`),
              titleColor: "hsl(var(--foreground))",
              subtitleColor: "hsl(var(--muted-foreground))",
              titleFontSize: 16,
              subtitleFontSize: 12,
            },
            {
              x: xAxisLabel || bottomVariables[0] || "Category",
              y:
                yAxisLabel ||
                (sideVariables.length > 0
                  ? formatLimitedList(sideVariables)
                  : "Value"),
            },
            {
              x: {
                min: xAxisMin,
                max: xAxisMax,
                majorIncrement: xAxisMajorIncrement,
                origin: xAxisOrigin,
              },
              y: {
                min: yAxisMin,
                max: yAxisMax,
                majorIncrement: yAxisMajorIncrement,
                origin: yAxisOrigin,
              },
            },
            chartColors
          );
          break;
        }

        case "Clustered Bar Chart": {
          const formattedData =
            chartData.length === 0
              ? [
                  { category: "male", subcategory: "blue", value: 30 },
                  { category: "male", subcategory: "white", value: 20 },
                  { category: "male", subcategory: "green", value: 10 },
                  { category: "female", subcategory: "blue", value: 25 },
                  { category: "female", subcategory: "white", value: 15 },
                  { category: "female", subcategory: "green", value: 10 },
                ]
              : chartData
                  .filter(
                    (d) =>
                      d.category &&
                      d.category.trim() !== "" &&
                      d.value != null &&
                      d.value !== 0
                  )
                  .map((d) => ({
                    category: d.category,
                    subcategory: d.subcategory || "",
                    value: d.value,
                  }));

          const formatLimitedList = (
            items: string[],
            limit: number = 3
          ): string => {
            const limited = items.slice(0, limit);
            const remaining = items.length - limit;
            if (remaining > 0) {
              return `${limited.join(", ")} and ${remaining} more`;
            }
            return limited.join(", ");
          };

          chartNode = chartUtils.createClusteredBarChart(
            formattedData,
            width,
            height,
            useaxis,
            {
              title: chartTitle || `Clustered Bar Chart`,
              subtitle:
                chartSubtitle ||
                (bottomVariables.length > 0 && sideVariables.length > 0
                  ? `Showing distribution of ${formatLimitedList(
                      sideVariables
                    )} across ${bottomVariables[0]} categories`
                  : `Sample Data`),
              titleColor: "hsl(var(--foreground))",
              subtitleColor: "hsl(var(--muted-foreground))",
              titleFontSize: 16,
              subtitleFontSize: 12,
            },
            {
              x: xAxisLabel || bottomVariables[0] || "Category",
              y:
                yAxisLabel ||
                (sideVariables.length > 0
                  ? formatLimitedList(sideVariables)
                  : "Value"),
            },
            {
              x: {
                min: xAxisMin,
                max: xAxisMax,
                majorIncrement: xAxisMajorIncrement,
                origin: xAxisOrigin,
              },
              y: {
                min: yAxisMin,
                max: yAxisMax,
                majorIncrement: yAxisMajorIncrement,
                origin: yAxisOrigin,
              },
            },
            chartColors
          );
          break;
        }

        case "Line Chart":
          chartNode =
            chartData.length === 0
              ? chartUtils.createLineChart(
                  [
                    { category: "Jan", value: 10 },
                    { category: "Feb", value: 30 },
                    { category: "Mar", value: 55 },
                    { category: "Apr", value: 60 },
                    { category: "Mei", value: 70 },
                    { category: "Jun", value: 90 },
                    { category: "Jul", value: 55 },
                    { category: "Agu", value: 30 },
                    { category: "Sep", value: 50 },
                    { category: "Okt", value: 20 },
                    { category: "Nov", value: 25 },
                    { category: "Des", value: 5 },
                  ],
                  width,
                  height,
                  useaxis,
                  {
                    title: "Line Chart",
                    subtitle: "Sample Data",
                    titleColor: "hsl(var(--foreground))",
                    subtitleColor: "hsl(var(--muted-foreground))",
                    titleFontSize: 16,
                    subtitleFontSize: 12,
                  },
                  {
                    x: "Category",
                    y: "Value",
                  },
                  {
                    x: {
                      min: xAxisMin,
                      max: xAxisMax,
                      majorIncrement: xAxisMajorIncrement,
                      origin: xAxisOrigin,
                    },
                    y: {
                      min: yAxisMin,
                      max: yAxisMax,
                      majorIncrement: yAxisMajorIncrement,
                      origin: yAxisOrigin,
                    },
                  },
                  chartColors
                )
              : chartUtils.createLineChart(
                  chartData.filter(
                    (d) => d.category !== "" && d.value != null && d.value !== 0
                  ),
                  width,
                  height,
                  useaxis,
                  {
                    title:
                      chartTitle ||
                      `Line Chart: ${bottomVariables[0] || ""} vs ${
                        sideVariables[0] || ""
                      }`,
                    subtitle:
                      chartSubtitle ||
                      `Showing trend of ${sideVariables[0] || ""} over ${
                        bottomVariables[0] || ""
                      } categories`,
                    titleColor: "hsl(var(--foreground))",
                    subtitleColor: "hsl(var(--muted-foreground))",
                    titleFontSize: 16,
                    subtitleFontSize: 12,
                  },
                  {
                    x: xAxisLabel || bottomVariables[0] || "Category",
                    y: yAxisLabel || sideVariables[0] || "Value",
                  },
                  {
                    x: {
                      min: xAxisMin,
                      max: xAxisMax,
                      majorIncrement: xAxisMajorIncrement,
                      origin: xAxisOrigin,
                    },
                    y: {
                      min: yAxisMin,
                      max: yAxisMax,
                      majorIncrement: yAxisMajorIncrement,
                      origin: yAxisOrigin,
                    },
                  },
                  chartColors
                );
          break;

        case "Multiple Line Chart": {
          const formattedData =
            chartData.length === 0
              ? [
                  {
                    category: "Product A",
                    subcategory: "Division 1",
                    value: 30,
                  },
                  {
                    category: "Product A",
                    subcategory: "Division 2",
                    value: 20,
                  },
                  {
                    category: "Product B",
                    subcategory: "Division 1",
                    value: 25,
                  },
                  {
                    category: "Product B",
                    subcategory: "Division 2",
                    value: 15,
                  },
                  {
                    category: "Product C",
                    subcategory: "Division 1",
                    value: 40,
                  },
                  {
                    category: "Product C",
                    subcategory: "Division 2",
                    value: 10,
                  },
                ]
              : chartData
                  .filter(
                    (d) =>
                      d.category &&
                      d.category.trim() !== "" &&
                      d.value != null &&
                      d.value !== 0
                  )
                  .map((d) => ({
                    category: d.category,
                    subcategory: d.subcategory || "",
                    value: d.value,
                  }));

          const formatLimitedList = (
            items: string[],
            limit: number = 3
          ): string => {
            const limited = items.slice(0, limit);
            const remaining = items.length - limit;
            if (remaining > 0) {
              return `${limited.join(", ")} and ${remaining} more`;
            }
            return limited.join(", ");
          };

          chartNode = chartUtils.createMultilineChart(
            formattedData,
            width,
            height,
            useaxis,
            {
              title: chartTitle || `Multiple Line Chart`,
              subtitle:
                chartSubtitle ||
                (bottomVariables.length > 0 && sideVariables.length > 0
                  ? `Showing trends of ${formatLimitedList(
                      sideVariables
                    )} across ${bottomVariables[0]} categories`
                  : `Sample Data`),
              titleColor: "hsl(var(--foreground))",
              subtitleColor: "hsl(var(--muted-foreground))",
              titleFontSize: 16,
              subtitleFontSize: 12,
            },
            {
              x: xAxisLabel || bottomVariables[0] || "Category",
              y:
                yAxisLabel ||
                (sideVariables.length > 0
                  ? formatLimitedList(sideVariables)
                  : "Value"),
            },
            {
              x: {
                min: xAxisMin,
                max: xAxisMax,
                majorIncrement: xAxisMajorIncrement,
                origin: xAxisOrigin,
              },
              y: {
                min: yAxisMin,
                max: yAxisMax,
                majorIncrement: yAxisMajorIncrement,
                origin: yAxisOrigin,
              },
            },
            chartColors
          );
          break;
        }

        case "Pie Chart":
          chartNode =
            chartData.length === 0
              ? chartUtils.createPieChart(
                  [
                    { category: "A", value: 30 },
                    { category: "B", value: 80 },
                    { category: "C", value: 45 },
                    { category: "D", value: 60 },
                    { category: "E", value: 20 },
                    { category: "F", value: 90 },
                  ],
                  width,
                  height,
                  useaxis,
                  {
                    title: chartTitle || "Pie Chart",
                    subtitle: chartSubtitle || "Sample Data",
                    titleColor: "hsl(var(--foreground))",
                    subtitleColor: "hsl(var(--muted-foreground))",
                    titleFontSize: 16,
                    subtitleFontSize: 12,
                  },
                  chartColors
                )
              : chartUtils.createPieChart(
                  chartData,
                  width,
                  height,
                  useaxis,
                  {
                    title: chartTitle || "Pie Chart",
                    subtitle: chartSubtitle || "",
                    titleColor: "hsl(var(--foreground))",
                    subtitleColor: "hsl(var(--muted-foreground))",
                    titleFontSize: 16,
                    subtitleFontSize: 12,
                  },
                  chartColors
                );
          break;

        case "Area Chart":
          chartNode =
            chartData.length === 0
              ? chartUtils.createAreaChart(
                  [
                    { category: "Jan", value: 10 },
                    { category: "Feb", value: 30 },
                    { category: "Mar", value: 55 },
                    { category: "Apr", value: 60 },
                    { category: "Mei", value: 70 },
                    { category: "Jun", value: 90 },
                    { category: "Jul", value: 55 },
                    { category: "Agu", value: 30 },
                    { category: "Sep", value: 50 },
                    { category: "Okt", value: 20 },
                    { category: "Nov", value: 25 },
                    { category: "Des", value: 5 },
                  ],
                  width,
                  height,
                  useaxis,
                  {
                    title: chartTitle || "Area Chart",
                    subtitle: chartSubtitle || "Sample Data",
                    titleColor: "hsl(var(--foreground))",
                    subtitleColor: "hsl(var(--muted-foreground))",
                    titleFontSize: 16,
                    subtitleFontSize: 12,
                  },
                  {
                    x: xAxisLabel || "Category",
                    y: yAxisLabel || "Value",
                  },
                  {
                    x: {
                      min: xAxisMin,
                      max: xAxisMax,
                      majorIncrement: xAxisMajorIncrement,
                      origin: xAxisOrigin,
                    },
                    y: {
                      min: yAxisMin,
                      max: yAxisMax,
                      majorIncrement: yAxisMajorIncrement,
                      origin: yAxisOrigin,
                    },
                  },
                  chartColors
                )
              : chartUtils.createAreaChart(
                  chartData,
                  width,
                  height,
                  useaxis,
                  {
                    title:
                      chartTitle ||
                      `Area Chart: ${bottomVariables[0] || ""} vs ${
                        sideVariables[0] || ""
                      }`,
                    subtitle:
                      chartSubtitle ||
                      `Showing distribution of ${
                        sideVariables[0] || ""
                      } across ${bottomVariables[0] || ""} categories`,
                    titleColor: "hsl(var(--foreground))",
                    subtitleColor: "hsl(var(--muted-foreground))",
                    titleFontSize: 16,
                    subtitleFontSize: 12,
                  },
                  {
                    x: xAxisLabel || bottomVariables[0] || "Category",
                    y: yAxisLabel || sideVariables[0] || "Value",
                  },
                  {
                    x: {
                      min: xAxisMin,
                      max: xAxisMax,
                      majorIncrement: xAxisMajorIncrement,
                      origin: xAxisOrigin,
                    },
                    y: {
                      min: yAxisMin,
                      max: yAxisMax,
                      majorIncrement: yAxisMajorIncrement,
                      origin: yAxisOrigin,
                    },
                  },
                  chartColors
                );
          break;

        case "Histogram": // Menambahkan case baru untuk Histogram
          // Mengambil hanya nilai 'value' dari chartData
          const histogramData =
            chartData.length === 0
              ? [5, 8, 9, 7, 3, 6, 3, 7, 3, 2, 9, 1, 4, 2, 5]
              : chartData.map((d) => d.value); // Mengambil hanya nilai dari chartData

          chartNode = chartUtils.createHistogram(
            histogramData, // Pastikan ini hanya array angka
            width,
            height,
            useaxis,
            {
              title: chartTitle || "Histogram",
              subtitle: chartSubtitle || "Sample Data",
              titleFontSize: 16,
              subtitleFontSize: 12,
            },
            {
              x: xAxisLabel || bottomVariables[0] || "Class",
              y: yAxisLabel || sideVariables[0] || "Frequency",
            },
            {
              x: {
                min: xAxisMin,
                max: xAxisMax,
                majorIncrement: xAxisMajorIncrement,
                origin: xAxisOrigin,
              },
              y: {
                min: yAxisMin,
                max: yAxisMax,
                majorIncrement: yAxisMajorIncrement,
                origin: yAxisOrigin,
              },
            },
            chartColors
          );
          break;

        case "Scatter Plot": // Menambahkan case baru untuk Scatter plot
          // Ambil data scatter jika tidak ada data default
          const scatterData =
            chartData.length === 0
              ? [
                  { x: 15, y: 50 },
                  { x: 20, y: 200 },
                  { x: 60, y: 100 },
                  { x: 200, y: 325 },
                  { x: 80, y: 150 },
                  { x: 130, y: 275 },
                  { x: 50, y: 220 },
                  { x: 170, y: 300 },
                  { x: 100, y: 30 },
                  { x: 170, y: 125 },
                  { x: 150, y: 80 },
                  { x: 100, y: 190 },
                  { x: 95, y: 75 },
                ]
              : chartData.map((d) => ({
                  x: parseFloat(d.category), // Parse category as number safely
                  y: d.value, // Tetap gunakan value sebagai y
                }));

          chartNode = chartUtils.createScatterPlot(
            scatterData, // Data untuk Scatter plot
            width,
            height,
            useaxis,
            {
              title: chartTitle || `${chartType}`,
              subtitle:
                chartSubtitle ||
                (bottomVariables.length > 0 && sideVariables.length > 0
                  ? `Showing relationship between ${bottomVariables[0]} and ${sideVariables[0]}`
                  : "Sample Data"),
              titleColor: "hsl(var(--foreground))",
              subtitleColor: "hsl(var(--muted-foreground))",
              titleFontSize: 16,
              subtitleFontSize: 12,
            },
            {
              x: xAxisLabel || bottomVariables[0] || "X Axis",
              y: yAxisLabel || sideVariables[0] || "Y Axis",
            },
            {
              x: {
                min: xAxisMin,
                max: xAxisMax,
                majorIncrement: xAxisMajorIncrement,
                origin: xAxisOrigin,
              },
              y: {
                min: yAxisMin,
                max: yAxisMax,
                majorIncrement: yAxisMajorIncrement,
                origin: yAxisOrigin,
              },
            },
            chartColors
          );
          break;

        case "Scatter Plot With Fit Line": // Menambahkan case baru untuk Scatter plot dengan Fit Line
          // Ambil data scatter dengan fit line jika tidak ada data default
          const scatterWithFitLineData =
            chartData.length === 0
              ? [
                  { x: 15, y: 50 },
                  { x: 20, y: 200 },
                  { x: 60, y: 100 },
                  { x: 200, y: 325 },
                  { x: 80, y: 150 },
                  { x: 130, y: 275 },
                  { x: 50, y: 220 },
                  { x: 170, y: 300 },
                  { x: 100, y: 30 },
                  { x: 170, y: 125 },
                  { x: 150, y: 80 },
                  { x: 100, y: 190 },
                  { x: 95, y: 75 },
                ]
              : chartData.map((d) => ({
                  x: parseFloat(d.category), // Parse category as number safely
                  y: d.value, // Tetap gunakan value sebagai y
                }));

          chartNode = chartUtils.createScatterPlotWithFitLine(
            scatterWithFitLineData, // Data untuk Scatter plot dengan Fit Line
            width,
            height,
            useaxis,
            {
              title: chartTitle || `${chartType}`,
              subtitle:
                chartSubtitle ||
                (bottomVariables.length > 0 && sideVariables.length > 0
                  ? `Showing relationship between ${bottomVariables[0]} and ${sideVariables[0]}`
                  : "Sample Data"),
              titleColor: "hsl(var(--foreground))",
              subtitleColor: "hsl(var(--muted-foreground))",
              titleFontSize: 16,
              subtitleFontSize: 12,
            },
            {
              x: xAxisLabel || bottomVariables[0] || "X Axis",
              y: yAxisLabel || sideVariables[0] || "Y Axis",
            },
            {
              x: {
                min: xAxisMin,
                max: xAxisMax,
                majorIncrement: xAxisMajorIncrement,
                origin: xAxisOrigin,
              },
              y: {
                min: yAxisMin,
                max: yAxisMax,
                majorIncrement: yAxisMajorIncrement,
                origin: yAxisOrigin,
              },
            },
            chartColors
          );
          break;

        case "Boxplot": // Menambahkan case baru untuk BoxPlot
          // Ambil data box plot jika tidak ada data default
          const boxPlotData =
            chartData.length === 0
              ? [
                  { category: "A", value: 20 },
                  { category: "A", value: 40 },
                  { category: "A", value: 60 },
                  { category: "A", value: 80 },
                  { category: "B", value: 30 },
                  { category: "B", value: 50 },
                  { category: "B", value: 70 },
                  { category: "B", value: 90 },
                ]
              : chartData
                  .filter((d) => d.category !== "")
                  .map((d) => ({
                    category: d.category,
                    value: d.value,
                  }));

          // Memanggil fungsi untuk membuat BoxPlot
          chartNode = chartUtils.createBoxplot(
            boxPlotData,
            width,
            height,
            useaxis,
            {
              title: chartTitle || "Boxplot",
              subtitle: chartSubtitle || "Sample Data",
              titleFontSize: 16,
              subtitleFontSize: 12,
            },
            {
              x: xAxisLabel || bottomVariables[0] || "X Axis",
              y: yAxisLabel || sideVariables[0] || "Y Axis",
            },
            {
              x: {
                min: xAxisMin,
                max: xAxisMax,
                majorIncrement: xAxisMajorIncrement,
                origin: xAxisOrigin,
              },
              y: {
                min: yAxisMin,
                max: yAxisMax,
                majorIncrement: yAxisMajorIncrement,
                origin: yAxisOrigin,
              },
            },
            chartColors
          );
          break;

        case "Error Bar Chart":
          // Fungsi deviasi standar
          const calculateError = (values: number[]): number => {
            if (values.length <= 1) return 0;

            const mean =
              values.reduce((sum: number, v: number) => sum + v, 0) /
              values.length;
            const variance =
              values.reduce(
                (sum: number, v: number) => sum + Math.pow(v - mean, 2),
                0
              ) /
              (values.length - 1);
            return Math.sqrt(variance);
          };

          // Kalau chartData kosong, pakai default
          const errorBardata =
            chartData.length === 0
              ? [
                  { category: "A", value: 30, error: 5 },
                  { category: "B", value: 80, error: 10 },
                  { category: "C", value: 45, error: 4 },
                  { category: "D", value: 60, error: 6 },
                  { category: "E", value: 20, error: 3 },
                  { category: "F", value: 90, error: 7 },
                ]
              : (() => {
                  // Ambil semua value
                  const values = chartData.map((d) => d.value);
                  // Hitung deviasi standar
                  const error = calculateError(values);
                  // Map data dengan error deviasi
                  return chartData.map((d) => ({
                    category: d.category,
                    value: d.value,
                    error: error,
                  }));
                })();

          // Memanggil fungsi untuk membuat Error Bar Chart
          chartNode = chartUtils.createErrorBarChart(
            errorBardata,
            width,
            height,
            useaxis,
            {
              title: chartTitle || "Error Bar Chart",
              subtitle: chartSubtitle || "Sample Data",
              titleFontSize: chartTitleFontSize || 16,
              subtitleFontSize: chartSubtitleFontSize || 12,
            },
            {
              x: xAxisLabel || bottomVariables[0] || "X Axis",
              y: yAxisLabel || sideVariables[0] || "Y Axis",
            },
            {
              x: {
                min: xAxisMin,
                max: xAxisMax,
                majorIncrement: xAxisMajorIncrement,
                origin: xAxisOrigin,
              },
              y: {
                min: yAxisMin,
                max: yAxisMax,
                majorIncrement: yAxisMajorIncrement,
                origin: yAxisOrigin,
              },
            },
            chartColors
          );
          break;

        case "Stacked Area Chart":
          const stackedAreaData =
            chartData.length === 0
              ? [
                  { category: "Sun", subcategory: "Product 1", value: 30 },
                  { category: "Sun", subcategory: "Product 2", value: 20 },
                  { category: "Sun", subcategory: "Product 3", value: 25 },
                  { category: "Mon", subcategory: "Product 1", value: 15 },
                  { category: "Mon", subcategory: "Product 2", value: 40 },
                  { category: "Mon", subcategory: "Product 3", value: 10 },
                  { category: "Tue", subcategory: "Product 1", value: 20 },
                  { category: "Tue", subcategory: "Product 2", value: 30 },
                  { category: "Tue", subcategory: "Product 3", value: 15 },
                  { category: "Wed", subcategory: "Product 1", value: 10 },
                  { category: "Wed", subcategory: "Product 2", value: 25 },
                  { category: "Wed", subcategory: "Product 3", value: 40 },
                ]
              : chartData
                  .filter((d) => d.category !== "")
                  .map((d) => ({
                    category: d.category,
                    subcategory: d.subcategory || "",
                    value: d.value,
                  }));

          chartNode = chartUtils.createStackedAreaChart(
            stackedAreaData,
            width,
            height,
            useaxis,
            {
              title: chartTitle || "Stacked Area Chart",
              subtitle: chartSubtitle || "Sample Data",
              titleFontSize: chartTitleFontSize || 16,
              subtitleFontSize: chartSubtitleFontSize || 12,
            },
            {
              x: xAxisLabel || bottomVariables[0] || "X Axis",
              y: yAxisLabel || sideVariables[0] || "Y Axis",
            },
            {
              x: {
                min: xAxisMin,
                max: xAxisMax,
                majorIncrement: xAxisMajorIncrement,
                origin: xAxisOrigin,
              },
              y: {
                min: yAxisMin,
                max: yAxisMax,
                majorIncrement: yAxisMajorIncrement,
                origin: yAxisOrigin,
              },
            },
            chartColors
          );
          break;

        case "Grouped Scatter Plot":
          const groupedScatterData =
            chartData.length === 0
              ? [
                  { category: "A", x: 5.1, y: 3.5 },
                  { category: "B", x: 4.9, y: 3.0 },
                  { category: "A", x: 4.7, y: 3.2 },
                  { category: "C", x: 4.6, y: 3.1 },
                  { category: "B", x: 5.0, y: 3.6 },
                  { category: "C", x: 5.4, y: 3.9 },
                  { category: "A", x: 4.6, y: 3.4 },
                  { category: "B", x: 5.0, y: 3.4 },
                  { category: "C", x: 4.4, y: 2.9 },
                  { category: "A", x: 4.9, y: 3.1 },
                  { category: "B", x: 5.4, y: 3.7 },
                  { category: "C", x: 4.8, y: 3.4 },
                  { category: "A", x: 4.8, y: 3.0 },
                  { category: "B", x: 4.3, y: 3.0 },
                  { category: "C", x: 5.8, y: 4.0 },
                  { category: "A", x: 5.7, y: 4.4 },
                  { category: "B", x: 5.4, y: 3.9 },
                  { category: "C", x: 5.1, y: 3.5 },
                  { category: "A", x: 5.1, y: 3.8 },
                  { category: "B", x: 5.0, y: 3.3 },
                ]
              : chartData

                  .filter((d) => d.category !== "")
                  .map((d) => ({
                    x: Number(d.category) || 0, // Gunakan nilai default jika undefined
                    y: Number(d.value) || 0,
                    category: String(d.color || d.subcategory || "unknown"),
                  }));
          console.log("Data scatter", groupedScatterData);
          chartNode = chartUtils.createGroupedScatterPlot(
            groupedScatterData,
            width,
            height,
            useaxis,
            {
              title: chartTitle || `${chartType}`,
              subtitle:
                chartSubtitle ||
                (bottomVariables.length > 0 && sideVariables.length > 0
                  ? `Showing relationship between ${bottomVariables[0]} and ${sideVariables[0]}`
                  : "Sample Data"),
              titleFontSize: 16,
              subtitleFontSize: 12,
            },
            {
              x: xAxisLabel || bottomVariables[0] || "X Axis",
              y: yAxisLabel || sideVariables[0] || "Y Axis",
            },
            {
              x: {
                min: xAxisMin,
                max: xAxisMax,
                majorIncrement: xAxisMajorIncrement,
                origin: xAxisOrigin,
              },
              y: {
                min: yAxisMin,
                max: yAxisMax,
                majorIncrement: yAxisMajorIncrement,
                origin: yAxisOrigin,
              },
            },
            chartColors
          );
          break;

        case "Dot Plot":
          const dotPlotData =
            chartData.length === 0
              ? [
                  { category: "A", value: 10 },
                  { category: "B", value: 40 },
                  { category: "C", value: 45 },
                  { category: "D", value: 55 },
                  { category: "E", value: 70 },
                  { category: "F", value: 75 },
                ]
              : chartData
                  .filter((d) => d.category !== "")
                  .map((d) => ({
                    category: d.category,
                    value: d.value,
                  }));
          chartNode = chartUtils.createDotPlot(
            dotPlotData,
            width,
            height,
            useaxis,
            {
              title: chartTitle || "Dot Plot",
              subtitle: chartSubtitle || "Sample Data",
              titleFontSize: 16,
              subtitleFontSize: 12,
            },
            {
              x: xAxisLabel || bottomVariables[0] || "Category",
              y: yAxisLabel || sideVariables[0] || "Value",
            },
            {
              x: {
                min: xAxisMin,
                max: xAxisMax,
                majorIncrement: xAxisMajorIncrement,
                origin: xAxisOrigin,
              },
              y: {
                min: yAxisMin,
                max: yAxisMax,
                majorIncrement: yAxisMajorIncrement,
                origin: yAxisOrigin,
              },
            },
            chartColors
          );
          break;

        case "Population Pyramid": {
          const formattedData =
            chartData.length === 0
              ? [
                  { category: "0-4", subcategory: "M", value: 9736305 },
                  { category: "0-4", subcategory: "F", value: 10031835 },
                  { category: "5-9", subcategory: "M", value: 10117913 },
                  { category: "5-9", subcategory: "F", value: 10411857 },
                  { category: "10-14", subcategory: "M", value: 10470147 },
                  { category: "10-14", subcategory: "F", value: 11027820 },
                  { category: "15-19", subcategory: "M", value: 10561873 },
                  { category: "15-19", subcategory: "F", value: 11094262 },
                  { category: "20-24", subcategory: "M", value: 11576412 },
                  { category: "20-24", subcategory: "F", value: 10889596 },
                  { category: "25-29", subcategory: "M", value: 10625791 },
                  { category: "25-29", subcategory: "F", value: 9889569 },
                  { category: "30-34", subcategory: "M", value: 9899569 },
                  { category: "30-34", subcategory: "F", value: 10330988 },
                  { category: "35-39", subcategory: "M", value: 10330988 },
                  { category: "35-39", subcategory: "F", value: 10571884 },
                  { category: "40-44", subcategory: "M", value: 10571884 },
                  { category: "40-44", subcategory: "F", value: 11051409 },
                  { category: "45-49", subcategory: "M", value: 10173646 },
                  { category: "45-49", subcategory: "F", value: 8824852 },
                  { category: "50-54", subcategory: "M", value: 8824852 },
                  { category: "50-54", subcategory: "F", value: 6876271 },
                  { category: "55-59", subcategory: "M", value: 6876271 },
                  { category: "55-59", subcategory: "F", value: 4867513 },
                  { category: "60-64", subcategory: "M", value: 4867513 },
                  { category: "60-64", subcategory: "F", value: 3416432 },
                  { category: "65-69", subcategory: "M", value: 3416432 },
                  { category: "65-69", subcategory: "F", value: 2378691 },
                  { category: "70-74", subcategory: "M", value: 2378691 },
                  { category: "70-74", subcategory: "F", value: 2000771 },
                  { category: "75-79", subcategory: "M", value: 2000771 },
                  { category: "75-79", subcategory: "F", value: 4313687 },
                  { category: "80-84", subcategory: "M", value: 4313687 },
                  { category: "80-84", subcategory: "F", value: 3432738 },
                ]
              : chartData.map((d) => ({
                  category: d.category,
                  subcategory: d.subcategory || "",
                  value: d.value,
                }));

          chartNode = chartUtils.createPopulationPyramid(
            formattedData,
            width,
            height,
            useaxis,
            {
              title: chartTitle || "Population Pyramid",
              subtitle: chartSubtitle || "Sample Data",
              titleColor: "hsl(var(--foreground))",
              subtitleColor: "hsl(var(--muted-foreground))",
              titleFontSize: chartTitleFontSize || 16,
              subtitleFontSize: chartSubtitleFontSize || 12,
            },
            {
              x: xAxisLabel || "Population",
              y: yAxisLabel || "Age Group",
            },
            {
              x: {
                min: xAxisMin,
                max: xAxisMax,
                majorIncrement: xAxisMajorIncrement,
                origin: xAxisOrigin,
              },
              y: {
                min: yAxisMin,
                max: yAxisMax,
                majorIncrement: yAxisMajorIncrement,
                origin: yAxisOrigin,
              },
            },
            chartColors
          );
          break;
        }

        case "Frequency Polygon": {
          const formattedData =
            chartData.length === 0
              ? [
                  { category: "-0", value: 0 },
                  { category: "0-10", value: 5 },
                  { category: "10-20", value: 15 },
                  { category: "20-30", value: 25 },
                  { category: "30-40", value: 30 },
                  { category: "40-50", value: 20 },
                  { category: "50-60", value: 10 },
                  { category: "60-70", value: 5 },
                  { category: "80+", value: 0 },
                ]
              : chartData.map((d) => ({
                  category: d.category,
                  value: d.value,
                }));

          chartNode = chartUtils.createFrequencyPolygon(
            formattedData,
            width,
            height,
            useaxis,
            {
              title: chartTitle || "Frequency Polygon",
              subtitle: chartSubtitle || "Sample Data",
              titleColor: "hsl(var(--foreground))",
              subtitleColor: "hsl(var(--muted-foreground))",
              titleFontSize: chartTitleFontSize || 16,
              subtitleFontSize: chartSubtitleFontSize || 12,
            },
            {
              x: xAxisLabel || "Category",
              y: yAxisLabel || "Frequency",
            },
            {
              x: {
                min: xAxisMin,
                max: xAxisMax,
                majorIncrement: xAxisMajorIncrement,
                origin: xAxisOrigin,
              },
              y: {
                min: yAxisMin,
                max: yAxisMax,
                majorIncrement: yAxisMajorIncrement,
                origin: yAxisOrigin,
              },
            },
            chartColors
          );
          break;
        }

        case "Clustered Error Bar Chart": // Menambahkan case baru untuk BoxPlot
          // Ambil data box plot jika tidak ada data default
          const clusteredErrorBardata =
            chartData.length === 0
              ? [
                  { category: "A", subcategory: "A1", value: 20, error: 2 },
                  { category: "A", subcategory: "A2", value: 30, error: 3 },
                  { category: "A", subcategory: "A3", value: 50, error: 1 },
                  { category: "B", subcategory: "A1", value: 25, error: 2 },
                  { category: "B", subcategory: "A2", value: 35, error: 3 },
                  { category: "B", subcategory: "A3", value: 53, error: 1 },
                  { category: "C", subcategory: "A1", value: 22, error: 2 },
                  { category: "C", subcategory: "A2", value: 40, error: 1 },
                  { category: "C", subcategory: "A3", value: 49, error: 3 },
                ]
              : chartData
                  .filter((d) => d.category !== "")
                  .map((d) => ({
                    category: d.category, // Gunakan category untuk mengganti x
                    subcategory: String(d.color || ""),
                    value: d.value, // Gunakan value untuk mengganti y
                    error: 2,
                  }));

          // Memanggil fungsi untuk membuat BoxPlot
          chartNode = chartUtils.createClusteredErrorBarChart(
            clusteredErrorBardata, // Data untuk Box Plot
            width,
            height,
            useaxis,
            {
              title: chartTitle || "Clustered Error Bar Chart",
              subtitle: chartSubtitle || "Sample Data",
              titleColor: "hsl(var(--foreground))",
              subtitleColor: "hsl(var(--muted-foreground))",
              titleFontSize: chartTitleFontSize || 16,
              subtitleFontSize: chartSubtitleFontSize || 12,
            },
            {
              x: xAxisLabel || "Category",
              y: yAxisLabel || "Value",
            },
            {
              x: {
                min: xAxisMin,
                max: xAxisMax,
                majorIncrement: xAxisMajorIncrement,
                origin: xAxisOrigin,
              },
              y: {
                min: yAxisMin,
                max: yAxisMax,
                majorIncrement: yAxisMajorIncrement,
                origin: yAxisOrigin,
              },
            },
            chartColors
          );
          break;

        case "Scatter Plot Matrix":
          const scatterPlotMatrixData =
            chartData.length === 0
              ? [
                  { A: 15, B: 50, C: 20 },
                  { A: 20, B: 200, C: 30 },
                  { A: 60, B: 100, C: 70 },
                  { A: 200, B: 325, C: 180 },
                  { A: 80, B: 150, C: 60 },
                  { A: 130, B: 275, C: 110 },
                ]
              : chartData.map((d) => {
                  // Dinamis: Ambil semua nilai bottom yang ada
                  const transformedData: { [key: string]: any } = {};

                  // Memetakan variabel bottom ke dalam format A, B, C, dst.
                  bottomVariables.forEach((variable, i) => {
                    transformedData[`bottom_${i}`] =
                      Number(d[`bottom_${i}`]) || 0;
                  });

                  return transformedData;
                });

          chartNode = chartUtils.createScatterPlotMatrix(
            scatterPlotMatrixData, // Data untuk Scatter Plot Matrix
            width,
            height + 100,
            useaxis,
            {
              title: chartTitle || "Scatter Plot Matrix",
              subtitle: chartSubtitle || "Sample Data",
              titleColor: "hsl(var(--foreground))",
              subtitleColor: "hsl(var(--muted-foreground))",
              titleFontSize: chartTitleFontSize || 16,
              subtitleFontSize: chartSubtitleFontSize || 12,
            },
            {
              x: xAxisLabel || "X",
              y: yAxisLabel || "Y",
            },
            chartColors
          );
          break;

        case "Stacked Histogram":
          const stackedHistogramData =
            chartData.length === 0
              ? [
                  { value: 10, category: "A" },
                  { value: 12, category: "B" },
                  { value: 15, category: "A" },
                  { value: 18, category: "C" },
                  { value: 20, category: "B" },
                  { value: 25, category: "C" },
                  { value: 30, category: "A" },
                  { value: 10, category: "B" },
                  { value: 12, category: "C" },
                  { value: 15, category: "A" },
                  { value: 22, category: "B" },
                  { value: 28, category: "C" },
                  { value: 32, category: "A" },
                  { value: 35, category: "B" },
                  { value: 38, category: "C" },
                ]
              : chartData.map((d) => ({
                  category: String(d.color || "unknown"), // Gunakan category untuk mengganti x
                  // subcategory: d.color || "",
                  value: Number(d.bottom_0), // Gunakan value untuk mengganti y
                  // error: 2,
                }));

          chartNode = chartUtils.createStackedHistogram(
            stackedHistogramData, // Data untuk Scatter Plot Matrix
            width,
            height,
            useaxis,
            {
              title: chartTitle || "Stacked Histogram",
              subtitle: chartSubtitle || "Sample Data",
              titleColor: "hsl(var(--foreground))",
              subtitleColor: "hsl(var(--muted-foreground))",
              titleFontSize: chartTitleFontSize || 16,
              subtitleFontSize: chartSubtitleFontSize || 12,
            },
            {
              x: xAxisLabel || "Category",
              y: yAxisLabel || "Count",
            },
            chartColors
          );
          break;

        case "Frequency Polygon":
          const frequencyPolygonData =
            chartData.length === 0
              ? [
                  { category: "-0", value: 0 },
                  { category: "0-10", value: 5 },
                  { category: "10-20", value: 15 },
                  { category: "20-30", value: 25 },
                  { category: "30-40", value: 30 },
                  { category: "40-50", value: 20 },
                  { category: "50-60", value: 10 },
                  { category: "60-70", value: 5 },
                  { category: "80+", value: 0 },
                ]
              : [];

          chartNode = chartUtils.createFrequencyPolygon(
            frequencyPolygonData, // Data untuk Scatter Plot Matrix
            width,
            height
          );
          break;

        case "Clustered Boxplot":
          const clusteredBoxplotData =
            chartData.length === 0
              ? [
                  { category: "A", subcategory: "X", value: 10 },
                  { category: "A", subcategory: "X", value: 12 },
                  { category: "A", subcategory: "Y", value: 15 },
                  { category: "A", subcategory: "Y", value: 18 },
                  { category: "B", subcategory: "X", value: 20 },
                  { category: "B", subcategory: "X", value: 25 },
                  { category: "B", subcategory: "Y", value: 30 },
                  { category: "B", subcategory: "Y", value: 35 },
                ]
              : chartData.map((d) => ({
                  category: d.category,
                  subcategory: String(d.color || ""),
                  value: d.value,
                }));

          chartNode = chartUtils.createClusteredBoxplot(
            clusteredBoxplotData,
            width,
            height,
            useaxis,
            {
              title: chartTitle || "Clustered Boxplot",
              subtitle: chartSubtitle || "Sample Data",
              titleFontSize: chartTitleFontSize || 16,
              subtitleFontSize: chartSubtitleFontSize || 12,
            },
            {
              x: xAxisLabel || bottomVariables[0] || "Category",
              y: yAxisLabel || sideVariables[0] || "Value",
            },
            {
              x: {
                min: xAxisMin,
                max: xAxisMax,
                majorIncrement: xAxisMajorIncrement,
                origin: xAxisOrigin,
              },
              y: {
                min: yAxisMin,
                max: yAxisMax,
                majorIncrement: yAxisMajorIncrement,
                origin: yAxisOrigin,
              },
            },
            chartColors
          );
          break;

        case "1-D Boxplot": // Menambahkan case baru untuk BoxPlot
          // Ambil data box plot jika tidak ada data default
          const oneDBoxPlotData =
            chartData.length === 0
              ? [
                  { value: 20 },
                  { value: 40 },
                  { value: 60 },
                  { value: 80 },
                  { value: 30 },
                  { value: 50 },
                  { value: 70 },
                  { value: 90 },
                ]
              : chartData.map((d) => ({
                  value: d.value, // Gunakan value untuk mengganti y
                }));

          // Memanggil fungsi untuk membuat BoxPlot
          chartNode = chartUtils.create1DBoxplot(
            oneDBoxPlotData, // Data untuk Box Plot
            width,
            height,
            useaxis // Pilihan untuk menampilkan sumbu
          );
          break;

        case "Simple Range Bar": // Menambahkan case baru untuk BoxPlot
          // Ambil data box plot jika tidak ada data default
          const simpleRangeBarData =
            chartData.length === 0
              ? [
                  { category: "Jan", high: 100, low: 50, close: 75 },
                  { category: "Feb", high: 110, low: 60, close: 80 },
                  { category: "Mar", high: 120, low: 70, close: 95 },
                  { category: "Apr", high: 130, low: 80, close: 100 },
                  { category: "May", high: 125, low: 75, close: 110 },
                  { category: "Jun", high: 140, low: 90, close: 120 },
                  { category: "Jul", high: 150, low: 100, close: 130 },
                  { category: "Aug", high: 145, low: 95, close: 125 },
                  { category: "Sep", high: 135, low: 85, close: 115 },
                  { category: "Oct", high: 125, low: 75, close: 105 },
                  { category: "Nov", high: 115, low: 65, close: 95 },
                  { category: "Dec", high: 105, low: 55, close: 85 },
                ]
              : chartData
                  .filter((d) => d.bottom_0 !== "")
                  .map((d) => ({
                    category: d.bottom_0,
                    high: d.high_0 || null,
                    low: d.low_0 || null,
                    close: d.close_0 || null,
                  }));
          // Memanggil fungsi untuk membuat BoxPlot
          chartNode = chartUtils.createSimpleRangeBar(
            simpleRangeBarData, // Data untuk Box Plot
            width,
            height,
            useaxis // Pilihan untuk menampilkan sumbu
          );
          break;

        case "Clustered Range Bar": // Menambahkan case baru untuk BoxPlot
          // Ambil data box plot jika tidak ada data default
          const clusteredRangeBarData =
            chartData.length === 0
              ? [
                  {
                    category: "A",
                    subcategory: "X",
                    low: 20,
                    high: 50,
                    close: 35,
                  },
                  {
                    category: "A",
                    subcategory: "Y",
                    low: 25,
                    high: 55,
                    close: 40,
                  },
                  {
                    category: "B",
                    subcategory: "X",
                    low: 15,
                    high: 45,
                    close: 30,
                  },
                  {
                    category: "B",
                    subcategory: "Y",
                    low: 18,
                    high: 48,
                    close: 33,
                  },
                  {
                    category: "C",
                    subcategory: "X",
                    low: 22,
                    high: 60,
                    close: 42,
                  },
                  {
                    category: "C",
                    subcategory: "Y",
                    low: 27,
                    high: 65,
                    close: 46,
                  },
                  {
                    category: "D",
                    subcategory: "X",
                    low: 12,
                    high: 40,
                    close: 28,
                  },
                  {
                    category: "D",
                    subcategory: "Y",
                    low: 14,
                    high: 42,
                    close: 30,
                  },
                  {
                    category: "E",
                    subcategory: "X",
                    low: 30,
                    high: 70,
                    close: 50,
                  },
                  {
                    category: "E",
                    subcategory: "Y",
                    low: 35,
                    high: 75,
                    close: 55,
                  },
                ]
              : chartData
                  .filter((d) => d.bottom_0 !== "")
                  .map((d) => ({
                    category: d.bottom_0 || "unknown",
                    subcategory: String(d.color || "unknown"),
                    high: d.high_0 || 0,
                    low: d.low_0 || 0,
                    close: d.close_0 || 0,
                  }));
          // Memanggil fungsi untuk membuat BoxPlot
          chartNode = chartUtils.createClusteredRangeBar(
            clusteredRangeBarData, // Data untuk Box Plot
            width,
            height,
            useaxis // Pilihan untuk menampilkan sumbu
          );
          break;

        case "High-Low-Close Chart": // Menambahkan case baru untuk BoxPlot
          // Ambil data box plot jika tidak ada data default
          const highLowCloseBarData =
            chartData.length === 0
              ? [
                  { category: "Jan", high: 100, low: 50, close: 75 },
                  { category: "Feb", high: 110, low: 60, close: 80 },
                  { category: "Mar", high: 120, low: 70, close: 95 },
                  { category: "Apr", high: 130, low: 80, close: 100 },
                  { category: "May", high: 125, low: 75, close: 110 },
                  { category: "Jun", high: 140, low: 90, close: 120 },
                  { category: "Jul", high: 150, low: 100, close: 130 },
                  { category: "Aug", high: 145, low: 95, close: 125 },
                  { category: "Sep", high: 135, low: 85, close: 115 },
                  { category: "Oct", high: 125, low: 75, close: 105 },
                  { category: "Nov", high: 115, low: 65, close: 95 },
                  { category: "Dec", high: 105, low: 55, close: 85 },
                ]
              : chartData
                  .filter((d) => d.bottom_0 !== "")
                  .map((d) => ({
                    category: d.bottom_0 || "unknown",
                    high: d.high_0 || 0,
                    low: d.low_0 || 0,
                    close: d.close_0 || 0,
                  }));
          // Memanggil fungsi untuk membuat BoxPlot
          chartNode = chartUtils.createHighLowCloseChart(
            highLowCloseBarData, // Data untuk Box Plot
            width,
            height,
            useaxis // Pilihan untuk menampilkan sumbu
          );
          break;

        case "Difference Area": // Menambahkan case baru untuk BoxPlot
          // Ambil data box plot jika tidak ada data default
          const differencedAreaData =
            chartData.length === 0
              ? [
                  { category: "A", value0: 62.7, value1: 63.4 },
                  { category: "B", value0: 59.9, value1: 58 },
                  { category: "C", value0: 59.1, value1: 53.3 },
                  { category: "D", value0: 58.8, value1: 55.7 },
                  { category: "E", value0: 58.7, value1: 64.2 },
                  { category: "F", value0: 57, value1: 58.8 },
                  { category: "G", value0: 56.7, value1: 57.9 },
                  { category: "H", value0: 56.8, value1: 61.8 },
                  { category: "I", value0: 56.7, value1: 69.3 },
                  { category: "J", value0: 60.1, value1: 71.2 },
                  { category: "K", value0: 61.1, value1: 68.7 },
                  { category: "L", value0: 61.5, value1: 61.8 },
                  { category: "M", value0: 64.3, value1: 63 },
                  { category: "N", value0: 67.1, value1: 66.9 },
                  { category: "O", value0: 64.6, value1: 61.7 },
                  { category: "P", value0: 61.6, value1: 61.8 },
                  { category: "Q", value0: 61.1, value1: 62.8 },
                  { category: "R", value0: 59.2, value1: 60.8 },
                  { category: "S", value0: 58.9, value1: 62.1 },
                  { category: "T", value0: 57.2, value1: 65.1 },
                ]
              : chartData.map((d) => ({
                  category: d.bottom_0 || "unknown",
                  value0: d.low_0 || null,
                  value1: d.high_0 || null,
                }));
          // Memanggil fungsi untuk membuat BoxPlot
          chartNode = chartUtils.createDifferenceArea(
            differencedAreaData, // Data untuk Box Plot
            width,
            height
            // useaxis // Pilihan untuk menampilkan sumbu
          );
          // console.log(y.range(), y.domain());
          console.log(d3.select("#above").node());
          console.log(d3.select("#below").node());
          break;

        case "Vertical Bar & Line Chart":
          const barAndLineData =
            chartData.length === 0
              ? [
                  { category: "A", barValue: 20, lineValue: 30 },
                  { category: "B", barValue: 40, lineValue: 50 },
                  { category: "C", barValue: 60, lineValue: 70 },
                  { category: "D", barValue: 40, lineValue: 30 },
                  { category: "E", barValue: 30, lineValue: 30 },
                  { category: "F", barValue: 70, lineValue: 80 },
                ]
              : chartData.map((d) => ({
                  category: d.category || "unknown",
                  barValue: Number(d.value),
                  lineValue: Number(d.side2),
                }));

          chartNode = chartUtils.createBarAndLineChart(
            barAndLineData,
            width,
            height,
            useaxis
          );
          break;

        case "Vertical Bar & Line Chart2":
          const barAndLine2Data =
            chartData.length === 0
              ? [
                  {
                    category: "Aceh",
                    bars: { nilaiA: 60 },
                    lines: { nilaiB1: 40, nilaiB2: 110 },
                  },
                  {
                    category: "Sumatera Utara",
                    bars: { nilaiA: 45 },
                    lines: { nilaiB1: 50, nilaiB2: 120 },
                  },
                  {
                    category: "Sumatera Barat",
                    bars: { nilaiA: 70 },
                    lines: { nilaiB1: 30, nilaiB2: 105 },
                  },
                  {
                    category: "Riau",
                    bars: { nilaiA: 35 },
                    lines: { nilaiB1: 60, nilaiB2: 100 },
                  },
                  {
                    category: "Jambi",
                    bars: { nilaiA: 55 },
                    lines: { nilaiB1: 45, nilaiB2: 115 },
                  },
                  {
                    category: "Sumatera Selatan",
                    bars: { nilaiA: 80 },
                    lines: { nilaiB1: 20, nilaiB2: 130 },
                  },
                  {
                    category: "Bengkulu",
                    bars: { nilaiA: 30 },
                    lines: { nilaiB1: 10, nilaiB2: 95 },
                  },
                  {
                    category: "Lampung",
                    bars: { nilaiA: 65 },
                    lines: { nilaiB1: 50, nilaiB2: 140 },
                  },
                  {
                    category: "BaBel",
                    bars: { nilaiA: 25 },
                    lines: { nilaiB1: 35, nilaiB2: 130 },
                  },
                  {
                    category: "Kepulauan Riau",
                    bars: { nilaiA: 70 },
                    lines: { nilaiB1: 60, nilaiB2: 120 },
                  },
                  {
                    category: "DKI Jakarta",
                    bars: { nilaiA: 75 },
                    lines: { nilaiB1: 65, nilaiB2: 145 },
                  },
                  {
                    category: "Jawa Barat",
                    bars: { nilaiA: 60 },
                    lines: { nilaiB1: 55, nilaiB2: 135 },
                  },
                  {
                    category: "Jateng",
                    bars: { nilaiA: 50 },
                    lines: { nilaiB1: 40, nilaiB2: 100 },
                  },
                  {
                    category: "DI Yogyakarta",
                    bars: { nilaiA: 80 },
                    lines: { nilaiB1: 70, nilaiB2: 110 },
                  },
                  {
                    category: "Jawa Timur",
                    bars: { nilaiA: 90 },
                    lines: { nilaiB1: 50, nilaiB2: 150 },
                  },
                  {
                    category: "Banten",
                    bars: { nilaiA: 60 },
                    lines: { nilaiB1: 40, nilaiB2: 125 },
                  },
                  {
                    category: "Bali",
                    bars: { nilaiA: 50 },
                    lines: { nilaiB1: 45, nilaiB2: 115 },
                  },
                  // {
                  //   category: "NTB",
                  //   bars: { nilaiA: 35 },
                  //   lines: { nilaiB1: 30, nilaiB2: 105 },
                  // },
                  // {
                  //   category: "NTT",
                  //   bars: { nilaiA: 40 },
                  //   lines: { nilaiB1: 35, nilaiB2: 120 },
                  // },
                  // {
                  //   category: "Kalimantan Barat",
                  //   bars: { nilaiA: 70 },
                  //   lines: { nilaiB1: 65, nilaiB2: 140 },
                  // },
                  // {
                  //   category: "Kalteng",
                  //   bars: { nilaiA: 55 },
                  //   lines: { nilaiB1: 45, nilaiB2: 100 },
                  // },
                  // {
                  //   category: "Kalimantan Selatan",
                  //   bars: { nilaiA: 60 },
                  //   lines: { nilaiB1: 50, nilaiB2: 125 },
                  // },
                  // {
                  //   category: "Kalimantan Timur",
                  //   bars: { nilaiA: 75 },
                  //   lines: { nilaiB1: 55, nilaiB2: 130 },
                  // },
                  // {
                  //   category: "Kalimantan Utara",
                  //   bars: { nilaiA: 65 },
                  //   lines: { nilaiB1: 40, nilaiB2: 110 },
                  // },
                  // {
                  //   category: "Sulut",
                  //   bars: { nilaiA: 30 },
                  //   lines: { nilaiB1: 20, nilaiB2: 90 },
                  // },
                  // {
                  //   category: "Sulawesi Tengah",
                  //   bars: { nilaiA: 45 },
                  //   lines: { nilaiB1: 35, nilaiB2: 115 },
                  // },
                  // {
                  //   category: "Sulawesi Selatan",
                  //   bars: { nilaiA: 70 },
                  //   lines: { nilaiB1: 60, nilaiB2: 135 },
                  // },
                  // {
                  //   category: "Sulawesi Tenggara",
                  //   bars: { nilaiA: 55 },
                  //   lines: { nilaiB1: 45, nilaiB2: 120 },
                  // },
                  // {
                  //   category: "Gorontalo",
                  //   bars: { nilaiA: 25 },
                  //   lines: { nilaiB1: 30, nilaiB2: 100 },
                  // },
                  // {
                  //   category: "Sulawesi Barat",
                  //   bars: { nilaiA: 35 },
                  //   lines: { nilaiB1: 25, nilaiB2: 105 },
                  // },
                  // {
                  //   category: "Maluku",
                  //   bars: { nilaiA: 40 },
                  //   lines: { nilaiB1: 50, nilaiB2: 115 },
                  // },
                  // {
                  //   category: "Maluku Utara",
                  //   bars: { nilaiA: 60 },
                  //   lines: { nilaiB1: 45, nilaiB2: 120 },
                  // },
                  // {
                  //   category: "Papua",
                  //   bars: { nilaiA: 65 },
                  //   lines: { nilaiB1: 35, nilaiB2: 130 },
                  // },
                  // {
                  //   category: "Papua Barat",
                  //   bars: { nilaiA: 70 },
                  //   lines: { nilaiB1: 30, nilaiB2: 135 },
                  // },
                ]
              : [];

          chartNode = chartUtils.createBarAndLineChart2(
            barAndLine2Data,
            width,
            height,
            useaxis,
            "stacked"
          );
          break;

        case "Dual Axes Scatter Plot":
          const dualAxesScatterPlotData =
            chartData.length === 0
              ? [
                  { x: 6, y1: 22, y2: 75 }, // Data pertama
                  { x: 8, y1: 25, y2: 78 },
                  { x: 10, y1: 28, y2: 80 },
                  { x: 12, y1: 30, y2: 82 },
                  { x: 14, y1: 26, y2: 79 },
                  { x: 16, y1: 24, y2: 74 },
                  { x: 18, y1: 27, y2: 76 },
                  { x: 20, y1: 25, y2: 70 },
                ]
              : chartData.map((d) => ({
                  x: Number(d.category),
                  y1: Number(d.value),
                  y2: Number(d.side2),
                }));

          chartNode = chartUtils.createDualAxesScatterPlot(
            dualAxesScatterPlotData,
            width,
            height,
            useaxis
          );
          break;

        case "Drop Line Chart":
          const dropLineChartData =
            chartData.length === 0
              ? [
                  { x: "A", y: 70, category: "1" },
                  { x: "A", y: 15, category: "2" },
                  { x: "A", y: 25, category: "3" },
                  { x: "B", y: 25, category: "1" },
                  { x: "B", y: 45, category: "3" },
                  { x: "C", y: 40, category: "1" },
                  { x: "D", y: 25, category: "1" },
                  { x: "D", y: 60, category: "2" },
                  { x: "E", y: 20, category: "1" },
                  { x: "E", y: 65, category: "2" },
                  { x: "E", y: 80, category: "3" },
                ]
              : chartData.map((d) => ({
                  x: d.category,
                  y: Number(d.value),
                  category: String(d.color || "unknown"),
                }));

          chartNode = chartUtils.createDropLineChart(
            dropLineChartData,
            width,
            height,
            useaxis
          );
          break;

        case "Summary Point Plot":
          const statistics = "mean";
          chartNode =
            chartData.length === 0
              ? chartUtils.createSummaryPointPlot(
                  [
                    { category: "A", value: 25 },
                    { category: "A", value: 30 },
                    { category: "A", value: 10 },
                    { category: "B", value: 28 },
                    { category: "B", value: 22 },
                    { category: "C", value: 29 },
                    { category: "C", value: 32 },
                    { category: "D", value: 33 },
                  ],
                  width,
                  height,
                  useaxis,
                  statistics
                )
              : chartUtils.createSummaryPointPlot(
                  chartData,
                  width,
                  height,
                  useaxis
                );
          break;

        case "Stem And Leaf Plot":
          const stemLeafData =
            chartData.length === 0
              ? {
                  "1": [2, 5],
                  "2": [1, 2, 4],
                  "3": [1, 5, 6, 7],
                  "4": [2, 6, 7, 8, 9],
                  "5": [2, 3, 4, 5, 6, 7, 11],
                  "6": [1, 1, 1, 8, 9],
                }
              : chartData.reduce((acc: Record<string, number[]>, d) => {
                  const value = Number(d.value);
                  if (isNaN(value)) return acc;

                  const stem = Math.floor(value / 10).toString();
                  const leaf = value % 10;

                  if (!acc[stem]) acc[stem] = [];
                  acc[stem].push(leaf);

                  return acc;
                }, {});

          chartNode = chartUtils.createStemAndLeafPlot(
            stemLeafData,
            width,
            height,
            useaxis
          );
          break;

        case "Violin Plot":
          chartNode =
            chartData.length === 0
              ? chartUtils.createViolinPlot(
                  [
                    { category: "A", value: 10 },
                    { category: "A", value: 15 },
                    { category: "A", value: 20 },
                    { category: "A", value: 18 },
                    { category: "A", value: 12 },
                    { category: "B", value: 5 },
                    { category: "B", value: 8 },
                    { category: "B", value: 6 },
                    { category: "B", value: 9 },
                    { category: "B", value: 4 },
                    { category: "C", value: 22 },
                    { category: "C", value: 25 },
                    { category: "C", value: 24 },
                    { category: "C", value: 23 },
                    { category: "C", value: 26 },
                  ],
                  width,
                  height
                )
              : chartUtils.createViolinPlot(
                  chartData.filter(
                    (d) => d.category !== "" && d.value != null && d.value !== 0
                  ),
                  width,
                  height
                );
          break;

        case "Density Chart":
          chartNode =
            chartData.length === 0
              ? chartUtils.createDensityChart(
                  Array.from({ length: 100 }, () =>
                    Math.round(d3.randomNormal(500, 100)())
                  ),
                  width,
                  height
                )
              : chartUtils.createDensityChart(
                  chartData.map((d) => d.value).filter((v) => !isNaN(v)), // 👈 filter NaN
                  width,
                  height
                );

          break;

        // case "Word Cloud": // Menambahkan case baru untuk WordCloud
        //   // Ambil data Word Cloud jika tidak ada data default
        //   const WordCloudData =
        //     chartData.length === 0
        //       ? [
        //           "freedom",
        //           "justice",
        //           "hope",
        //           "equality",
        //           "peace",
        //           "love",
        //           "future",
        //           "strength",
        //           "courage",
        //           "change",
        //           "believe",
        //           "together",
        //           "unity",
        //           "progress",
        //           "rights",
        //           "voice",
        //           "inspire",
        //           "power",
        //           "action",
        //           "liberty",
        //           "truth",
        //           "vision",
        //           "solidarity",
        //           "respect",
        //           "opportunity",
        //           "compassion",
        //           "dignity",
        //           "empower",
        //           "diversity",
        //           "inclusion",
        //           "harmony",
        //           "bravery",
        //           "dream",
        //           "empowerment",
        //           "respect",
        //           "transformation",
        //           "justice",
        //           "courageous",
        //           "success",
        //           "tolerance",
        //           "love",
        //           "equality",
        //           "togetherness",
        //           "sustainability",
        //           "strength",
        //           "freedom",
        //           "grace",
        //           "compassion",
        //           "positivity",
        //           "honor",
        //           "equality",
        //           "hopeful",
        //           "change",
        //           "belonging",
        //           "resilience",
        //           "opportunity",
        //           "solidarity",
        //           "endurance",
        //           "achieve",
        //           "perseverance",
        //           "justice",
        //           "unity",
        //           "growth",
        //           "excellence",
        //           "balance",
        //           "progress",
        //           "healing",
        //           "visionary",
        //           "potential",
        //           "action",
        //           "purpose",
        //           "liberation",
        //           "peaceful",
        //           "dignified",
        //           "openness",
        //           "knowledge",
        //           "wisdom",
        //           "contribution",
        //           "forward",
        //           "enlightenment",
        //           "optimism",
        //           "legacy",
        //           "respectful",
        //           "development",
        //           "inspiration",
        //           "leadership",
        //           "positivity",
        //           "sacrifice",
        //           "honesty",
        //           "wellbeing",
        //           "together",
        //           "unity",
        //         ].flatMap((word) => Array(25).fill(word))
        //       : []; // If chartData is available, use it as the data source.

        //   // Memanggil fungsi untuk membuat Word Cloud
        //   chartNode = chartUtils.createWordCloud(
        //     WordCloudData, // Data untuk Word Cloud
        //     width,
        //     height,
        //     {
        //       size: (group) => group.length, // Calculate the size based on the frequency of each word
        //       word: (d) => d, // The word itself
        //       marginTop: 10, // Margin for top
        //       marginRight: 10, // Margin for right
        //       marginBottom: 10, // Margin for bottom
        //       marginLeft: 10, // Margin for left
        //       // maxWords: 100, // Maximum number of words in the Word Cloud
        //       fontFamily: "sans-serif", // Font family
        //       fontScale: 5, // Font scaling factor
        //       fill: "black", // Word color
        //       padding: 5, // Padding between words
        //       rotate: 0, // Rotation for words (can be dynamic if needed)
        //     }
        //   );
        //   break;

        default:
          console.error("Unknown chart type:", chartType);
          break;
      }

      // Jika chartNode valid, append ke svgRef
      if (chartNode && svgRef.current) {
        console.log("chartContainerRef.current:", svgRef.current);
        svgRef.current.appendChild(chartNode); // Menambahkan node hasil dari fungsi ke dalam svgRef
        console.log("chartContainerRef.current:", svgRef.current);
        console.log("chart:", chartNode);
      }
    }
    if (chartContainerRef.current) {
      chartContainerRef.current.innerHTML = ""; // Bersihkan kontainer dulu
      chartContainerRef.current.id = "chart-container"; // Pastikan ada ID

      const chartData = getDataForChart();
      let chartNode = null;

      switch (chartType) {
        // case "3D Bar Chart":
        //   chartUtils.create3DBarChart(
        //     "chart-container", // Pakai ID container
        //     chartData.length === 0
        //       ? [
        //           { x: "A", y: "D", z: 50 },
        //           { x: "B", y: "E", z: 100 },
        //           { x: "C", y: "G", z: 180 },
        //           { x: "D", y: "M", z: 60 },
        //           { x: "E", y: "O", z: 30 },
        //           { x: "F", y: "G", z: 50 },
        //         ]
        //       : [],
        //     useaxis
        //   );
        //   console.log(
        //     "ECharts GL status:",
        //     echarts.getInstanceByDom(chartContainerRef.current)
        //   );

        //   break;

        case "3D Bar Chart2":
          // Buat elemen chart
          const d3BarChartData =
            chartData.length === 0
              ? [
                  { x: -5, y: 2, z: -5 }, // Kuadran (-, +, -)
                  { x: -4, y: 3, z: 6 }, // Kuadran (-, +, +)
                  { x: -3, y: 5, z: 4 }, // Kuadran (-, +, +)
                  { x: -2, y: 7, z: -6 }, // Kuadran (-, +, -)
                  { x: 0, y: 0, z: 0 }, // Sumbu (y positif)
                  { x: 2, y: 2, z: -6 }, // Kuadran (+, +, -)
                  { x: 2, y: 4, z: 7 }, // Kuadran (+, +, +)
                  { x: 3, y: 6, z: -5 }, // Kuadran (+, +, -)
                  { x: 4, y: 3, z: 2 }, // Kuadran (+, +, +)
                  { x: 5, y: 5, z: -9 }, // Kuadran (+, +, -)
                  { x: 6, y: 4, z: -2 }, // Kuadran (+, +, -)
                  { x: 7, y: 3, z: 5 }, // Kuadran (+, +, +)
                  { x: -7, y: 2, z: -6 }, // Kuadran (-, +, -)
                  { x: -6, y: 4, z: -2 }, // Kuadran (-, +, -)
                  { x: -5, y: 5, z: 5 }, // Kuadran (-, +, +)
                ]
              : chartData.map((d) => ({
                  x:
                    d.category && Number(d.category) !== 0
                      ? Number(d.category)
                      : Number(d.bottom_0) || 0,

                  y: Number(d.value) || 0,
                  z: Number(d.bottom2_0) || 0,
                }));

          chartNode = chartUtils.create3DBarChart2(
            d3BarChartData,
            width,
            height
          );

          // Tambahkan chart ke dalam container
          chartContainerRef.current.innerHTML = ""; // Bersihkan kontainer dulu
          chartContainerRef.current.appendChild(chartNode);
          console.log("chartNode:", chartNode);
          console.log("chartContainerRef.current:", chartContainerRef.current);

          break;

        case "3D Scatter Plot":
          // Buat elemen chart
          const d3ScatterPlotData =
            chartData.length === 0
              ? [
                  { x: -5, y: 2, z: -5 }, // Kuadran (-, +, -)
                  { x: -4, y: 3, z: 6 }, // Kuadran (-, +, +)
                  { x: -3, y: 5, z: 4 }, // Kuadran (-, +, +)
                  { x: -2, y: 7, z: -6 }, // Kuadran (-, +, -)
                  { x: 0, y: 0, z: 0 }, // Sumbu (y positif)
                  { x: 2, y: 2, z: -6 }, // Kuadran (+, +, -)
                  { x: 2, y: 4, z: 7 }, // Kuadran (+, +, +)
                  { x: 3, y: 6, z: -5 }, // Kuadran (+, +, -)
                  { x: 4, y: 3, z: 2 }, // Kuadran (+, +, +)
                  { x: 5, y: 5, z: -9 }, // Kuadran (+, +, -)
                  { x: 6, y: 4, z: -2 }, // Kuadran (+, +, -)
                  { x: 7, y: 3, z: 5 }, // Kuadran (+, +, +)
                  { x: -7, y: 2, z: -6 }, // Kuadran (-, +, -)
                  { x: -6, y: 4, z: -2 }, // Kuadran (-, +, -)
                  { x: -5, y: 5, z: 5 }, // Kuadran (-, +, +)
                ]
              : chartData.map((d) => ({
                  x:
                    d.category && Number(d.category) !== 0
                      ? Number(d.category)
                      : Number(d.bottom_0) || 0,

                  y: Number(d.value) || 0,
                  z: Number(d.bottom2_0) || 0,
                }));

          chartNode = chartUtils.create3DScatterPlot(
            d3ScatterPlotData,
            width,
            height
          );

          // Tambahkan chart ke dalam container
          chartContainerRef.current.innerHTML = ""; // Bersihkan kontainer dulu
          chartContainerRef.current.appendChild(chartNode);
          console.log("chartNode:", chartNode);
          console.log("chartContainerRef.current:", chartContainerRef.current);

          break;

        case "Grouped 3D Scatter Plot":
          // Buat elemen chart
          const d3GroupedScatterPlotData =
            chartData.length === 0
              ? [
                  { x: 1, y: 2, z: 3, category: "A" },
                  { x: 1, y: 2, z: 3, category: "B" },
                  { x: 1, y: 2, z: 3, category: "C" },
                  { x: 1, y: 4, z: 3, category: "D" },
                  { x: 2, y: 4, z: 1, category: "A" },
                  { x: 3, y: 1, z: 2, category: "B" },
                  { x: 4, y: 3, z: 4, category: "B" },
                  { x: 5, y: 2, z: 5, category: "C" },
                  { x: 6, y: 5, z: 3, category: "C" },
                  { x: 7, y: 3, z: 2, category: "D" },
                  { x: 8, y: 4, z: 1, category: "D" },
                ]
              : chartData
                  .filter((d) => d.color !== "" && d.color != undefined) // Hanya ambil data yang memiliki color
                  .map((d) => ({
                    x:
                      d.category && Number(d.category) !== 0
                        ? Number(d.category)
                        : Number(d.bottom_0) || 0,

                    y: Number(d.value) || 0,
                    z: Number(d.bottom2_0) || 0,
                    category: String(d.color || "unknown"),
                  }));

          chartNode = chartUtils.createGrouped3DScatterPlot(
            d3GroupedScatterPlotData,
            width,
            height
          );

          // Tambahkan chart ke dalam container
          chartContainerRef.current.innerHTML = ""; // Bersihkan kontainer dulu
          chartContainerRef.current.appendChild(chartNode);
          console.log("chartNode:", chartNode);
          console.log("chartContainerRef.current:", chartContainerRef.current);

          break;

        case "Clustered 3D Bar Chart":
          // Buat elemen chart
          const d3ClusteredBarChartData =
            chartData.length === 0
              ? [
                  { x: 1, z: 1, y: 6, category: "A" },

                  { x: 2, z: 1, y: 7, category: "A" },
                  { x: 2, z: 1, y: 6, category: "B" },
                  { x: 2, z: 1, y: 5, category: "C" },
                  { x: 2, z: 1, y: 6, category: "D" },

                  { x: 6, z: 4, y: 7, category: "A" },
                  { x: 6, z: 4, y: 6, category: "B" },
                  { x: 6, z: 4, y: 5, category: "C" },
                  { x: 6, z: 4, y: 6, category: "D" },

                  { x: 4, z: 7, y: 5, category: "A" },

                  { x: -4, z: 6, y: 3, category: "A" },
                  { x: -4, z: 6, y: 6, category: "B" },
                  { x: -4, z: 6, y: 7, category: "C" },
                  { x: -4, z: 6, y: 1, category: "D" },
                  { x: -4, z: 6, y: 4, category: "E" },

                  { x: -9, z: 8, y: 4, category: "A" },
                  { x: -9, z: 8, y: 6, category: "B" },
                  { x: -9, z: 8, y: 2, category: "E" },

                  { x: 8, z: -6, y: 3, category: "A" },
                  { x: 8, z: -6, y: 4, category: "B" },
                  { x: 8, z: -6, y: 9, category: "C" },
                  { x: 8, z: -6, y: 2, category: "D" },
                  { x: 8, z: -6, y: 5, category: "E" },

                  { x: -8, z: -2, y: 3, category: "A" },
                  { x: -8, z: -2, y: 6, category: "B" },
                  { x: -8, z: -2, y: 3, category: "C" },
                  { x: -8, z: -2, y: 1, category: "D" },
                  { x: -8, z: -2, y: 4, category: "E" },
                ]
              : chartData
                  .filter((d) => d.color !== "" && d.color != undefined) // Hanya ambil data yang memiliki color
                  .map((d) => ({
                    x:
                      d.category && Number(d.category) !== 0
                        ? Number(d.category)
                        : Number(d.bottom_0) || 0,

                    y: Number(d.value) || 0,
                    z: Number(d.bottom2_0) || 0,
                    category: String(d.color || "unknown"),
                  }));

          chartNode = chartUtils.createClustered3DBarChart(
            d3ClusteredBarChartData,
            width,
            height
          );

          // Tambahkan chart ke dalam container
          chartContainerRef.current.innerHTML = ""; // Bersihkan kontainer dulu
          chartContainerRef.current.appendChild(chartNode);
          console.log("chartNode:", chartNode);
          console.log("chartContainerRef.current:", chartContainerRef.current);

          break;

        case "Stacked 3D Bar Chart":
          // Buat elemen chart
          const d3StackedBarChartData =
            chartData.length === 0
              ? [
                  { x: 1, z: 1, y: 6, category: "A" },

                  { x: 2, z: 6, y: 2, category: "A" },
                  { x: 2, z: 6, y: 3, category: "B" },
                  { x: 2, z: 6, y: 2, category: "C" },
                  { x: 2, z: 6, y: 1, category: "D" },

                  { x: 5, z: 4, y: 1, category: "A" },
                  { x: 5, z: 4, y: 2, category: "B" },
                  { x: 5, z: 4, y: 3, category: "C" },
                  { x: 5, z: 4, y: 1, category: "D" },

                  { x: 9, z: 7, y: 7, category: "A" },

                  { x: -4, z: 6, y: 3, category: "A" },
                  { x: -4, z: 6, y: 1, category: "B" },
                  { x: -4, z: 6, y: 2, category: "C" },
                  { x: -4, z: 6, y: 2, category: "D" },
                  { x: -4, z: 6, y: 1, category: "E" },

                  { x: -9, z: 8, y: 1, category: "A" },
                  { x: -9, z: 8, y: 2, category: "B" },
                  { x: -9, z: 8, y: 2, category: "E" },

                  { x: 8, z: -6, y: 3, category: "A" },
                  { x: 8, z: -6, y: 2, category: "B" },
                  { x: 8, z: -6, y: 1, category: "C" },
                  { x: 8, z: -6, y: 2, category: "D" },
                  { x: 8, z: -6, y: 2, category: "E" },

                  { x: -8, z: -2, y: 3, category: "A" },
                  { x: -8, z: -2, y: 2, category: "B" },
                  { x: -8, z: -2, y: 3, category: "C" },
                  { x: -8, z: -2, y: 1, category: "D" },
                  { x: -8, z: -2, y: 1, category: "E" },
                ]
              : chartData
                  .filter((d) => d.color !== "" && d.color != undefined) // Hanya ambil data yang memiliki color
                  .map((d) => ({
                    x:
                      d.category && Number(d.category) !== 0
                        ? Number(d.category)
                        : Number(d.bottom_0) || 0,

                    y: Number(d.value) || 0,
                    z: Number(d.bottom2_0) || 0,
                    category: String(d.color || "unknown"),
                  }));

          chartNode = chartUtils.createStacked3DBarChart(
            d3StackedBarChartData,
            width,
            height
          );

          // Tambahkan chart ke dalam container
          chartContainerRef.current.innerHTML = ""; // Bersihkan kontainer dulu
          chartContainerRef.current.appendChild(chartNode);
          console.log("chartNode:", chartNode);
          console.log("chartContainerRef.current:", chartContainerRef.current);

          break;

        // case "Bar2":
        //   chartUtils.createBarChart(
        //     "chart-container",
        //     chartData.length === 0
        //       ? [
        //           { category: "A", value: 30 },
        //           { category: "B", value: 80 },
        //           { category: "C", value: 45 },
        //           { category: "D", value: 60 },
        //           { category: "E", value: 20 },
        //           { category: "F", value: 90 },
        //         ]
        //       : chartData
        //   );
        //   break;
      }

      // setTimeout(() => {
      //   const chart = echarts.init(
      //     document.getElementById("chart-container")!,
      //     undefined,
      //     {
      //       width,
      //       height,
      //     }
      //   );
      //   chart.resize(); // 🔥 Paksa resize setelah render
      // }, 100);

      // window.addEventListener("resize", handleResize);
      // return () => {
      //   window.removeEventListener("resize", handleResize);
      //   const instance = echarts.getInstanceByDom(chartContainerRef.current);
      //   if (instance) {
      //     instance.dispose();
      //   }
      // };
    }
  }, [
    chartType,
    sideVariables,
    side2Variables,
    bottomVariables,
    bottom2Variables,
    colorVariables,
    filterVariables,
    lowVariables,
    highVariables,
    closeVariables,
    data,
    useaxis,
    width,
    height,
    variables,
    getDataForChart,
    chartTitle,
    chartSubtitle,
    xAxisLabel,
    yAxisLabel,
    xAxisMin,
    xAxisMax,
    xAxisMajorIncrement,
    xAxisOrigin,
    yAxisMin,
    yAxisMax,
    yAxisMajorIncrement,
    yAxisOrigin,
    chartColors,
  ]);

  return (
    <div className="flex flex-col p-5 border-2 border-gray-200 rounded-lg pb-24">
      {/* Label Chart Preview di tengah atas kotak putih */}
      <div
        className="flex justify-center items-center w-full"
        style={{ marginTop: "10px", marginBottom: "0px" }}
      >
        <span
          className="text-lg font-semibold text-gray-500 uppercase tracking-widest px-6 py-1 rounded border border-gray-200 shadow-sm"
          style={{ letterSpacing: "0.18em" }}
        >
          <span role="img" aria-label="component" className="mr-2">
            🧩
          </span>{" "}
          Chart Preview{" "}
          <span role="img" aria-label="component" className="mr-2">
            🧩
          </span>
        </span>
      </div>
      {/* Wrapper agar kotak abu-abu tetap center dan tidak melebar */}
      <div className="w-full flex justify-center relative">
        {/* Semua drop area di luar kotak abu-abu */}
        {/* Side (kiri) */}
        {chartVariableConfig[chartType]?.side &&
          (chartVariableConfig[chartType].side?.min !== 0 ||
            chartVariableConfig[chartType].side?.max !== 0) && (
            <div className="absolute left-[-70px] top-1/2 -translate-y-1/2 z-10">
              {/* ...side drop area JSX... */}
              {/* Copy dari JSX lama untuk side */}
              <div
                className={clsx(
                  "rotate-90 flex flex-wrap space-x-1 w-[200px] justify-center items-center border border-gray-400 rounded-md p-1 cursor-pointer",
                  (chartType === "3D Bar Chart2" ||
                    chartType === "3D Scatter Plot" ||
                    chartType === "Grouped 3D Scatter Plot" ||
                    chartType === "Clustered 3D Bar Chart" ||
                    chartType === "Stacked 3D Bar Chart") &&
                    "border-3 border-green-500"
                )}
                onDrop={(e) => handleDrop(e, "side")}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => handleOpenModal("side")}
              >
                {sideVariables.length === 0 ? (
                  <div className="bg-gray-300 text-gray-500 p-2 rounded-md text-sm shadow-md w-full text-center">
                    {chartType === "3D Bar Chart2" ||
                    chartType === "3D Scatter Plot" ||
                    chartType === "Grouped 3D Scatter Plot" ||
                    chartType === "Clustered 3D Bar Chart" ||
                    chartType === "Stacked 3D Bar Chart"
                      ? "Y axis"
                      : "No variables selected"}
                  </div>
                ) : (
                  (() => {
                    const maxWidth = 100;
                    let totalWidth = 0;
                    let displayedVars = [];
                    const spaceBetween = 4;
                    let hiddenCount = 0;
                    const estimateButtonWidth = (text: string) =>
                      Math.max(40, text.length * 8);
                    for (let i = 0; i < sideVariables.length; i++) {
                      let btnWidth = estimateButtonWidth(sideVariables[i]);
                      if (totalWidth + btnWidth + spaceBetween <= maxWidth) {
                        displayedVars.push(sideVariables[i]);
                        totalWidth += btnWidth + spaceBetween;
                      } else {
                        hiddenCount = sideVariables.length - i;
                        break;
                      }
                    }
                    return (
                      <div className="flex flex-wrap space-x-1 justify-center w-full">
                        {displayedVars.map((variable, index) => (
                          <div
                            key={index}
                            className="bg-blue-500 text-white p-2 rounded-md text-sm shadow-md text-center"
                            style={{ minWidth: "40px" }}
                          >
                            {variable}
                          </div>
                        ))}
                        {hiddenCount > 0 && (
                          <div className="bg-gray-500 text-white p-2 rounded-md text-sm shadow-md text-center">
                            +{hiddenCount} more
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}
        {/* Side2 (kanan) */}
        {chartVariableConfig[chartType]?.side2 &&
          (chartVariableConfig[chartType].side2?.min !== 0 ||
            chartVariableConfig[chartType].side2?.max !== 0) && (
            <div className="absolute right-[-70px] top-1/2 -translate-y-1/2 z-10">
              {/* ...side2 drop area JSX... */}
              {/* Copy dari JSX lama untuk side2 */}
              <div
                className="rotate-90 flex flex-wrap space-x-1 w-[200px] justify-center items-center border border-gray-400 rounded-md p-1 cursor-pointer"
                onDrop={(e) => handleDrop(e, "side2")}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => handleOpenModal("side2")}
              >
                {side2Variables.length === 0 ? (
                  <div className="bg-gray-300 text-gray-500 p-2 rounded-md text-sm shadow-md w-full text-center">
                    No variables selected
                  </div>
                ) : (
                  (() => {
                    const maxWidth = 100;
                    let totalWidth = 0;
                    let displayedVars = [];
                    const spaceBetween = 4;
                    let hiddenCount = 0;
                    const estimateButtonWidth = (text: string) =>
                      Math.max(40, text.length * 8);
                    for (let i = 0; i < side2Variables.length; i++) {
                      let btnWidth = estimateButtonWidth(side2Variables[i]);
                      if (totalWidth + btnWidth + spaceBetween <= maxWidth) {
                        displayedVars.push(side2Variables[i]);
                        totalWidth += btnWidth + spaceBetween;
                      } else {
                        hiddenCount = side2Variables.length - i;
                        break;
                      }
                    }
                    return (
                      <div className="flex flex-wrap space-x-1 justify-center w-full">
                        {displayedVars.map((variable, index) => (
                          <div
                            key={index}
                            className="bg-blue-500 text-white p-2 rounded-md text-sm shadow-md text-center"
                            style={{ minWidth: "40px" }}
                          >
                            {variable}
                          </div>
                        ))}
                        {hiddenCount > 0 && (
                          <div className="bg-gray-500 text-white p-2 rounded-md text-sm shadow-md text-center">
                            +{hiddenCount} more
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}
        {/* Bottom (bawah tengah) */}
        {chartVariableConfig[chartType]?.bottom &&
          (chartVariableConfig[chartType].bottom?.min !== 0 ||
            chartVariableConfig[chartType].bottom?.max !== 0) && (
            <div
              className="absolute left-1/2 bottom-4 -translate-x-1/2 z-10"
              style={{ bottom: "-60px" }}
            >
              {/* ...bottom drop area JSX... */}
              {/* Copy dari JSX lama untuk bottom */}
              <div
                className="flex justify-center items-center space-x-1 w-[200px] border border-gray-400 rounded-md p-1 cursor-pointer"
                onDrop={(e) => handleDrop(e, "bottom")}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => handleOpenModal("bottom")}
              >
                {bottomVariables.length === 0 ? (
                  <div className="bg-gray-300 text-gray-500 p-2 rounded-md text-sm shadow-md w-full text-center">
                    {chartType === "3D Bar Chart2" ||
                    chartType === "3D Scatter Plot" ||
                    chartType === "Grouped 3D Scatter Plot" ||
                    chartType === "Clustered 3D Bar Chart" ||
                    chartType === "Stacked 3D Bar Chart"
                      ? "X axis"
                      : "No variables selected"}
                  </div>
                ) : (
                  (() => {
                    const maxWidth = 100;
                    let totalWidth = 0;
                    let displayedVars = [];
                    const spaceBetween = 4;
                    let hiddenCount = 0;
                    const estimateButtonWidth = (text: string) =>
                      Math.max(40, text.length * 8);
                    for (let i = 0; i < bottomVariables.length; i++) {
                      let btnWidth = estimateButtonWidth(bottomVariables[i]);
                      if (totalWidth + btnWidth + spaceBetween <= maxWidth) {
                        displayedVars.push(bottomVariables[i]);
                        totalWidth += btnWidth + spaceBetween;
                      } else {
                        hiddenCount = bottomVariables.length - i;
                        break;
                      }
                    }
                    return (
                      <div className="flex flex-wrap space-x-1 justify-center w-full">
                        {displayedVars.map((variable, index) => (
                          <div
                            key={index}
                            className="bg-blue-500 text-white p-2 rounded-md text-sm shadow-md text-center"
                            style={{ minWidth: "40px" }}
                          >
                            {variable}
                          </div>
                        ))}
                        {hiddenCount > 0 && (
                          <div className="bg-gray-500 text-white p-2 rounded-md text-sm shadow-md text-center">
                            +{hiddenCount} more
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}
        {/* Bottom2 (bawah kanan) */}
        {chartVariableConfig[chartType]?.bottom2 &&
          (chartVariableConfig[chartType].bottom2?.min !== 0 ||
            chartVariableConfig[chartType].bottom2?.max !== 0) && (
            <div
              className="absolute right-4 bottom-4 z-10"
              style={{ bottom: "-60px" }}
            >
              {/* ...bottom2 drop area JSX... */}
              {/* Copy dari JSX lama untuk bottom2 */}
              <div
                className="flex justify-center items-center space-x-1 w-[200px] border border-gray-400 rounded-md p-1 cursor-pointer"
                onDrop={(e) => handleDrop(e, "bottom2")}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => handleOpenModal("bottom2")}
              >
                {bottom2Variables.length === 0 ? (
                  <div className="bg-gray-300 text-gray-500 p-2 rounded-md text-sm shadow-md w-full text-center">
                    {chartType === "3D Bar Chart2" ||
                    chartType === "3D Scatter Plot" ||
                    chartType === "Grouped 3D Scatter Plot" ||
                    chartType === "Clustered 3D Bar Chart" ||
                    chartType === "Stacked 3D Bar Chart"
                      ? "Z axis"
                      : "No variables selected"}
                  </div>
                ) : (
                  (() => {
                    const maxWidth = 100;
                    let totalWidth = 0;
                    let displayedVars = [];
                    const spaceBetween = 4;
                    let hiddenCount = 0;
                    const estimateButtonWidth = (text: string) =>
                      Math.max(40, text.length * 8);
                    for (let i = 0; i < bottom2Variables.length; i++) {
                      let btnWidth = estimateButtonWidth(bottom2Variables[i]);
                      if (totalWidth + btnWidth + spaceBetween <= maxWidth) {
                        displayedVars.push(bottom2Variables[i]);
                        totalWidth += btnWidth + spaceBetween;
                      } else {
                        hiddenCount = bottom2Variables.length - i;
                        break;
                      }
                    }
                    return (
                      <div className="flex flex-wrap space-x-1 justify-center w-full">
                        {displayedVars.map((variable, index) => (
                          <div
                            key={index}
                            className="bg-blue-500 text-white p-2 rounded-md text-sm shadow-md text-center"
                            style={{ minWidth: "40px" }}
                          >
                            {variable}
                          </div>
                        ))}
                        {hiddenCount > 0 && (
                          <div className="bg-gray-500 text-white p-2 rounded-md text-sm shadow-md text-center">
                            +{hiddenCount} more
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}
        {/* Color/Group (pojok kanan atas kotak putih) */}
        {chartVariableConfig[chartType]?.color &&
          (chartVariableConfig[chartType].color?.min !== 0 ||
            chartVariableConfig[chartType].color?.max !== 0) && (
            <div className="absolute top-[-20px] right-[-10px] z-10">
              {/* ...color drop area JSX... */}
              <div
                className="p-2 border border-dashed border-gray-400 rounded-lg text-gray-500"
                onDrop={(e) => handleDrop(e, "color")}
                onDragOver={handleDragOver}
                onClick={() => handleOpenModal("color")}
              >
                {colorVariables.length === 0 ? (
                  <div className="bg-gray-300 text-gray-500 p-2 rounded-md text-sm shadow-md">
                    Group by
                  </div>
                ) : (
                  colorVariables.map((variable, index) => (
                    <div
                      key={index}
                      className="bg-blue-500 text-white p-2 rounded-md text-sm shadow-md"
                    >
                      {variable}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        {/* Filter (kanan tengah kotak putih, mirip side2) */}
        {chartVariableConfig[chartType]?.filter &&
          (chartVariableConfig[chartType].filter?.min !== 0 ||
            chartVariableConfig[chartType].filter?.max !== 0) && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
              {/* ...filter drop area JSX... */}
              <div
                className="bg-gray-300 text-gray-500 p-2 rounded-md text-sm shadow-md rotate-90 w-full text-center"
                onDrop={(e) => handleDrop(e, "filter")}
                onDragOver={handleDragOver}
                onClick={() => handleOpenModal("filter")}
              >
                {filterVariables.length === 0
                  ? "Filter?"
                  : filterVariables.map((variable, index) => (
                      <div
                        key={index}
                        className="bg-green-500 text-white p-2 rounded-md text-sm shadow-md rotate-90 w-full text-center"
                      >
                        {variable}
                      </div>
                    ))}
              </div>
            </div>
          )}
        {/* Low (kiri bawah) */}
        {chartVariableConfig[chartType]?.low &&
          (chartVariableConfig[chartType].low?.min !== 0 ||
            chartVariableConfig[chartType].low?.max !== 0) && (
            <div className="absolute left-[-70px] bottom-10 z-10">
              {/* ...low drop area JSX... */}
              <div
                className="bg-gray-300 text-gray-500 p-2 rounded-md text-sm shadow-md"
                onDrop={(e) => handleDrop(e, "low")}
                onDragOver={handleDragOver}
                onClick={() => handleOpenModal("low")}
              >
                {lowVariables.length === 0
                  ? "Low Variable?"
                  : lowVariables.join(", ")}
              </div>
            </div>
          )}
        {/* High (kiri atas) */}
        {chartVariableConfig[chartType]?.high &&
          (chartVariableConfig[chartType].high?.min !== 0 ||
            chartVariableConfig[chartType].high?.max !== 0) && (
            <div className="absolute left-[-70px] top-10 z-10">
              {/* ...high drop area JSX... */}
              <div
                className="bg-gray-300 text-gray-500 p-2 rounded-md text-sm shadow-md"
                onDrop={(e) => handleDrop(e, "high")}
                onDragOver={handleDragOver}
                onClick={() => handleOpenModal("high")}
              >
                {highVariables.length === 0
                  ? "High Variable?"
                  : highVariables.join(", ")}
              </div>
            </div>
          )}
        {/* Close (bawah kiri) */}
        {chartVariableConfig[chartType]?.close &&
          (chartVariableConfig[chartType].close?.min !== 0 ||
            chartVariableConfig[chartType].close?.max !== 0) && (
            <div className="absolute left-10 bottom-[-60px] z-10">
              {/* ...close drop area JSX... */}
              <div
                className="bg-gray-300 text-gray-500 p-2 rounded-md text-sm shadow-md"
                onDrop={(e) => handleDrop(e, "close")}
                onDragOver={handleDragOver}
                onClick={() => handleOpenModal("close")}
              >
                {closeVariables.length === 0
                  ? "Close Variable?"
                  : closeVariables.join(", ")}
              </div>
            </div>
          )}

        {/* Modal untuk semua variabel */}
        {/* {modalState.isOpen && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex justify-center items-center rounded-lg z-[9999]">
            <div className="bg-white p-4 rounded-lg shadow-lg w-64">
              <h2 className="text-lg font-bold mb-2 text-center">
                All{" "}
                {modalState.type === "side"
                  ? "Side"
                  : modalState.type === "side2"
                  ? "Side2"
                  : modalState.type === "bottom"
                  ? "Bottom"
                  : modalState.type === "bottom2"
                  ? "Bottom2"
                  : modalState.type === "color"
                  ? "Color"
                  : modalState.type === "filter"
                  ? "Filter"
                  : modalState.type === "low"
                  ? "Low"
                  : modalState.type === "high"
                  ? "High"
                  : modalState.type === "close"
                  ? "Close"
                  : "Undefined"}{" "}
                Variables
              </h2>
              <ul className="space-y-1">
                {variablesToShow.map((variable: string, index: number) => (
                  <li
                    key={index}
                    className="p-1 bg-gray-200 rounded text-sm flex justify-between items-center"
                  >
                    <span>{variable}</span>
                    <button
                      className="text-red-500 font-bold text-xs"
                      onClick={() =>
                        handleRemoveVariable(
                          modalState.type as
                            | "side"
                            | "bottom"
                            | "low"
                            | "high"
                            | "close"
                            | "side2"
                            | "bottom2",
                          index
                        )
                      }
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <button
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded w-full"
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        )} */}

        {/* Kotak chart preview, hanya chart */}
        <div className="relative bg-gray-100 border-2 border-gray-300 rounded-lg p-2 w-[650px] max-w-full h-[550px] flex flex-col justify-between mt-8">
          {/* Modal untuk semua variabel */}
          {modalState.isOpen && (
            <div className="absolute inset-0 bg-black bg-opacity-30 flex justify-center items-center rounded-lg z-[9999]">
              <div className="bg-white p-4 rounded-lg shadow-lg w-64">
                <h2 className="text-lg font-bold mb-2 text-center">
                  All{" "}
                  {modalState.type === "side"
                    ? "Side"
                    : modalState.type === "side2"
                    ? "Side2"
                    : modalState.type === "bottom"
                    ? "Bottom"
                    : modalState.type === "bottom2"
                    ? "Bottom2"
                    : modalState.type === "color"
                    ? "Color"
                    : modalState.type === "filter"
                    ? "Filter"
                    : modalState.type === "low"
                    ? "Low"
                    : modalState.type === "high"
                    ? "High"
                    : modalState.type === "close"
                    ? "Close"
                    : "Undefined"}{" "}
                  Variables
                </h2>
                <ul className="space-y-1">
                  {variablesToShow.map((variable: string, index: number) => (
                    <li
                      key={index}
                      className="p-1 bg-gray-200 rounded text-sm flex justify-between items-center"
                    >
                      <span>{variable}</span>
                      <button
                        className="text-red-500 font-bold text-xs"
                        onClick={() =>
                          handleRemoveVariable(
                            modalState.type as
                              | "side"
                              | "bottom"
                              | "low"
                              | "high"
                              | "close"
                              | "side2"
                              | "bottom2",
                            index
                          )
                        }
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded w-full"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          )}
          {/* Chart content saja */}
          {chartType === "3D Bar Chart2" ||
          chartType === "Clustered 3D Bar Chart" ||
          chartType === "Stacked 3D Bar Chart" ||
          chartType === "3D Scatter Plot" ||
          chartType === "Grouped 3D Scatter Plot" ? (
            <div className="w-full h-full flex justify-center items-center pb-10">
              <div
                id="chart-container"
                ref={chartContainerRef}
                className="min-w-[600px] min-h-[480px] max-w-full max-h-full"
              />
            </div>
          ) : (
            <div
              className="chart-svg-center-container flex justify-center bg-white items-center"
              style={{
                position: "absolute",
                top: "24px",
                left: "24px",
                right: "24px",
                bottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}
            >
              <svg
                ref={svgRef}
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
                viewBox="0 0 680 550"
                style={{
                  width: "100%",
                  height: "100%",
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartPreview;
