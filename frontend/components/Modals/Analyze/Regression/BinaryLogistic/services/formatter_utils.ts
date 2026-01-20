import { AnalysisSection, TableResultContent } from "../types/binary-logistic";

// Helper factory untuk membuat Section standard
export const createSection = (
  id: string,
  title: string,
  data: any, // Menggunakan any sementara karena struktur tabel handsontable kompleks
  options?: {
    description?: string;
    note?: string;
  }
): AnalysisSection => {
  return {
    id,
    title,
    type: "table",
    data: data as TableResultContent,
    description: options?.description,
    note: options?.note,
  };
};

// Format angka desimal biasa (default 3 digit)
// Menangani null, undefined, NaN, dan angka sangat kecil
export const safeFixed = (
  val: number | undefined | null,
  digits = 3
): string => {
  if (val === undefined || val === null || isNaN(val)) return ".";
  if (val === 0) return ".000";
  // Jika angka sangat kecil (misal 1e-10), anggap 0
  if (Math.abs(val) < 1e-9) return ".000";
  return val.toFixed(digits);
};

// Format p-value / Significance
// Jika < 0.001, tampilkan "< .001"
export const fmtSig = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return ".";
  return num < 0.001 ? "< .001" : num.toFixed(3);
};

// Format persentase (1 digit desimal)
export const fmtPct = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return ".";
  return num.toFixed(1);
};

// Helper opsional untuk memformat angka integer dengan pemisah ribuan (jika diperlukan)
export const fmtInt = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return ".";
  return num.toString();
};

// ============================================================================
// DESCRIPTION GENERATORS (SPSS Style - English)
// ============================================================================

/**
 * Menghasilkan deskripsi untuk Omnibus Tests of Model Coefficients.
 */
export const generateOmnibusDescription = (
  chiSquare: number,
  df: number,
  sig: number
): string => {
  const pVal = sig < 0.001 ? "< .001" : `= ${sig.toFixed(3)}`;
  const significanceText =
    sig < 0.05 ? "statistically significant" : "not statistically significant";

  return `The logistic regression model was ${significanceText}, χ²(${df}) = ${chiSquare.toFixed(
    3
  )}, p ${pVal}. The model creates a significantly better fit than the null model.`;
};

/**
 * Menghasilkan deskripsi untuk Model Summary (Nagelkerke R Square).
 */
export const generateModelSummaryDescription = (
  nagelkerke: number | undefined
): string => {
  if (nagelkerke === undefined) return "";
  const pct = (nagelkerke * 100).toFixed(1);
  return `The model explained ${pct}% (Nagelkerke R Square) of the variance in the dependent variable.`;
};

/**
 * Menghasilkan deskripsi untuk Classification Table.
 */
export const generateClassificationDescription = (
  overallPct: number | undefined
): string => {
  if (overallPct === undefined) return "";
  return `The model correctly classified ${overallPct.toFixed(
    1
  )}% of cases overall.`;
};

/**
 * Menghasilkan deskripsi untuk Hosmer and Lemeshow Test.
 * Note: P > 0.05 indicates good fit.
 */
export const generateHosmerDescription = (sig: number): string => {
  const pVal = sig < 0.001 ? "< .001" : `= ${sig.toFixed(3)}`;
  const fitText =
    sig > 0.05
      ? "indicated a good fit to the data"
      : "indicated a poor fit to the data";
  const interpretation =
    sig > 0.05
      ? "meaning the observed and expected probabilities match well."
      : "suggesting significant differences between observed and predicted values.";

  return `The Hosmer and Lemeshow test ${fitText} (p ${pVal}), ${interpretation}`;
};

/**
 * Menghasilkan deskripsi singkat untuk Variables in the Equation.
 * Fokus pada variabel yang signifikan (p < 0.05).
 */
export const generateVarsInEquationDescription = (
  vars: { label: string; sig: number; exp_b: number }[]
): string => {
  const significantVars = vars.filter(
    (v) => v.sig < 0.05 && v.label !== "Constant"
  );

  if (significantVars.length === 0) {
    return "None of the predictor variables were statistically significant in the equation (p > .05).";
  }

  const varNames = significantVars.map((v) => v.label).join(", ");
  return `Of the predictors entered, the following were statistically significant: ${varNames}.`;
};
