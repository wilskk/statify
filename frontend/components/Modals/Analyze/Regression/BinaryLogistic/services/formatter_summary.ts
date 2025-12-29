import { LogisticResult, AnalysisSection } from "../types/binary-logistic";
import { createSection } from "./formatter_utils";

export const formatSummaryTables = (
  result: LogisticResult
): {
  sections: AnalysisSection[];
  totalN: number;
  counts: { count_0: number; count_1: number };
} => {
  const sections: AnalysisSection[] = [];
  const ct = result.classification_table;

  // ----------------------------------------------------------------------
  // 1. Hitung Total N dari Classification Table
  // ----------------------------------------------------------------------
  const obs0_pred0 = ct.observed_0_predicted_0 || 0;
  const obs0_pred1 = ct.observed_0_predicted_1 || 0;
  const obs1_pred0 = ct.observed_1_predicted_0 || 0;
  const obs1_pred1 = ct.observed_1_predicted_1 || 0;

  const count_0 = obs0_pred0 + obs0_pred1;
  const count_1 = obs1_pred0 + obs1_pred1;
  const totalN = count_0 + count_1;

  // ----------------------------------------------------------------------
  // 2. Section: Case Processing Summary
  // ----------------------------------------------------------------------
  const caseProcessingData = {
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
        percent: ".0%",
      },
      {
        rowHeader: ["Total", null],
        n: totalN.toString(),
        percent: "100.0%",
      },
    ],
  };

  sections.push(
    createSection(
      "summary_case_processing",
      "Case Processing Summary",
      caseProcessingData,
      {
        description:
          "Ringkasan jumlah sampel yang dianalisis dan missing values.",
        note: "a. If weight is in effect, see classification table for the total number of cases.",
      }
    )
  );

  // ----------------------------------------------------------------------
  // 3. Section: Dependent Variable Encoding
  // ----------------------------------------------------------------------
  const encodingData = {
    columnHeaders: [
      { header: "Original Value", key: "rowHeader" },
      { header: "Internal Value", key: "val" },
    ],
    rows: [
      { rowHeader: ["0"], val: "0" },
      { rowHeader: ["1"], val: "1" },
    ],
  };

  sections.push(
    createSection(
      "summary_encoding",
      "Dependent Variable Encoding",
      encodingData,
      {
        description:
          "Mapping nilai asli variabel dependen ke nilai internal (0/1).",
      }
    )
  );

  return { sections, totalN, counts: { count_0, count_1 } };
};
