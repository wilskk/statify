/**
 * formatter_summary.ts
 * Menangani "Case Processing Summary" dan "Dependent Variable Encoding".
 */

import { LogisticResult } from "../types/binary-logistic";
// Kita tidak butuh utils di sini karena logic-nya hardcoded string "100.0%" 
// sesuai snippet Anda, tapi kita import untuk jaga-jaga pengembangan nanti.
// import { fmtPct } from "./formatter_utils"; 

export const formatSummaryTables = (result: LogisticResult) => {
  const tables: any[] = [];
  const ct = result.classification_table;

  // ----------------------------------------------------------------------
  // 1. Hitung Total N dari Classification Table (sesuai logic formatter.ts asli)
  // ----------------------------------------------------------------------
  const obs0_pred0 = ct.observed_0_predicted_0 || 0;
  const obs0_pred1 = ct.observed_0_predicted_1 || 0;
  const obs1_pred0 = ct.observed_1_predicted_0 || 0;
  const obs1_pred1 = ct.observed_1_predicted_1 || 0;

  const count_0 = obs0_pred0 + obs0_pred1;
  const count_1 = obs1_pred0 + obs1_pred1;
  const totalN = count_0 + count_1;

  // ----------------------------------------------------------------------
  // 2. Table: Case Processing Summary
  // ----------------------------------------------------------------------
  tables.push({
    title: "Case Processing Summary",
    note: "a. If weight is in effect, see classification table for the total number of cases.",
    columnHeaders: [
      {
        header: "Unweighted Cases",
        children: [
          { header: "", key: "rh1" }, // Selected Cases / Unselected Cases / Total
          { header: "", key: "rh2" }, // Included / Missing / Total
        ],
      },
      { header: "N", key: "n", align: "right" },
      { header: "Percent", key: "percent", align: "right" },
    ],
    rows: [
      {
        rowHeader: ["Selected Cases", "Included in Analysis"],
        n: totalN.toString(),
        percent: "100.0%",
      },
      {
        rowHeader: ["Selected Cases", "Missing Cases"],
        n: "0",
        percent: ".0%",
      },
      {
        rowHeader: ["Selected Cases", "Total"],
        n: totalN.toString(),
        percent: "100.0%",
      },
      { 
        rowHeader: ["Unselected Cases", null], 
        n: "0", 
        percent: ".0%" 
      },
      { 
        rowHeader: ["Total", null], 
        n: totalN.toString(), 
        percent: "100.0%" 
      },
    ],
  });

  // ----------------------------------------------------------------------
  // 3. Table: Dependent Variable Encoding
  // ----------------------------------------------------------------------
  tables.push({
    title: "Dependent Variable Encoding",
    columnHeaders: [
      { header: "Original Value", key: "rowHeader" },
      { header: "Internal Value", key: "val" },
    ],
    rows: [
      { rowHeader: ["0"], val: "0" },
      { rowHeader: ["1"], val: "1" },
    ],
  });

  return { tables, totalN, counts: { count_0, count_1 } };
};