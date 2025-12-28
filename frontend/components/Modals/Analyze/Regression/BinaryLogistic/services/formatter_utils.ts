/**
 * formatter_utils.ts
 * Shared utility functions for Binary Logistic Regression formatting.
 */

// Format angka desimal biasa (default 3 digit)
// Menangani null, undefined, NaN, dan angka sangat kecil
export const safeFixed = (val: number | undefined | null, digits = 3): string => {
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