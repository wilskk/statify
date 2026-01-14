import {
  LogisticResult,
  AnalysisSection,
} from "../types/binary-logistic";
import { createSection, safeFixed, fmtSig } from "./formatter_utils";

export const formatHosmerLemeshow = (
  result: LogisticResult,
  dependentName: string
): { sections: AnalysisSection[] } => {
  const sections: AnalysisSection[] = [];

  // 1. Cek Data Hosmer-Lemeshow (Prioritas: Final Result -> Step Terakhir)
  let hlResult = result.hosmer_lemeshow;
  if (!hlResult && result.steps_detail && result.steps_detail.length > 0) {
    const lastStep = result.steps_detail[result.steps_detail.length - 1];
    hlResult = lastStep.hosmer_lemeshow;
  }

  // Jika data tidak ada (opsi tidak dicentang), return kosong
  if (!hlResult) {
    return { sections: [] };
  }

  // 2. Persiapan Label (Agar "Observed" sesuai label asli, misal "No/Yes")
  const modelInfo = (result as any).model_info || {};
  const yMap = modelInfo.y_encoding || {};
  
  // Buat lookup table: value (0/1) -> Label Asli (misal "Tidak"/"Ya")
  const labelLookup: Record<number, string> = Object.entries(yMap).reduce(
    (acc, [key, val]) => {
      acc[val as number] = key;
      return acc;
    },
    {} as Record<number, string>
  );

  const getLabel = (val: number): string => {
    return labelLookup[val] !== undefined ? labelLookup[val] : val.toString();
  };

  const label0 = getLabel(0); // Label untuk kelompok 0
  const label1 = getLabel(1); // Label untuk kelompok 1

  // ======================================================================
  // TABEL 1: Hosmer and Lemeshow Test (Summary)
  // ======================================================================
  const summaryData = {
    columnHeaders: [
      { header: "Step", key: "step" },
      { header: "Chi-square", key: "chi" },
      { header: "df", key: "df" },
      { header: "Sig.", key: "sig" },
    ],
    rows: [
      {
        rowHeader: [], 
        step: "1", // SPSS selalu menampilkan ini di Step 1 untuk metode Enter
        chi: safeFixed(hlResult.chi_square),
        df: hlResult.df.toString(),
        sig: fmtSig(hlResult.sig),
      },
    ],
  };

  sections.push(
    createSection(
      "hosmer_summary",
      "Hosmer and Lemeshow Test",
      summaryData,
      {
        description: "Uji goodness-of-fit untuk menilai kelayakan model.",
        note: "H0: Model sesuai dengan data (fit). Jika Sig > 0.05, model dianggap fit.",
      }
    )
  );

  // ======================================================================
  // TABEL 2: Contingency Table for Hosmer and Lemeshow Test
  // ======================================================================
  const contingencyData = {
    columnHeaders: [
      {
        header: "",
        children: [{ header: "", key: "rh1" }], // Tempat nomor step (1..10)
      },
      // Grouping untuk Y = 0 (Label Asli)
      {
        header: `${dependentName} = ${label0}`,
        children: [
          { header: "Observed", key: "obs0" },
          { header: "Expected", key: "exp0" },
        ],
      },
      // Grouping untuk Y = 1 (Label Asli)
      {
        header: `${dependentName} = ${label1}`,
        children: [
          { header: "Observed", key: "obs1" },
          { header: "Expected", key: "exp1" },
        ],
      },
      { header: "Total", key: "total" },
    ],
    rows: hlResult.contingency_table.map((row) => ({
      rowHeader: [row.group.toString()], // Desil 1 sampai 10
      obs0: row.observed_0.toString(),
      exp0: safeFixed(row.expected_0),
      obs1: row.observed_1.toString(),
      exp1: safeFixed(row.expected_1),
      total: row.total_observed.toString(),
    })),
  };

  sections.push(
    createSection(
      "hosmer_contingency",
      "Contingency Table for Hosmer and Lemeshow Test",
      contingencyData,
      {
        description: "Detail observasi vs ekspektasi per kelompok desil.",
      }
    )
  );

  return { sections };
};