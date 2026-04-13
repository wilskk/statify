import { AnalysisSection } from "../types/ordinal";

export const createSection = (
  id: string,
  title: string,
  data: any,
  options?: {
    description?: string;
    note?: string;
  }
): AnalysisSection => {
  return {
    id,
    title,
    type: "table",
    data,
    description: options?.description,
    note: options?.note,
  };
};

// helper format angka
export const safeFixed = (val: number | undefined | null, digits = 3): string => {
  if (val === undefined || val === null || isNaN(val)) return ".";
  if (Math.abs(val) < 1e-9) return ".000";
  return val.toFixed(digits);
};

export const fmtSig = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return ".";
  return num < 0.001 ? "< .001" : num.toFixed(3);
};