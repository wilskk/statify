// frontend/components/Modals/Analyze/Regression/BinaryLogistic/services/formatter.ts

interface LogisticResult {
  model_summary: {
    log_likelihood: number;
    cox_snell_r2: number;
    nagelkerke_r2: number;
  };
  classification_table: {
    predicted_0_observed_0: number;
    predicted_1_observed_0: number;
    predicted_0_observed_1: number;
    predicted_1_observed_1: number;
    overall_percentage: number;
  };
  variables_in_equation: Array<{
    label: string;
    b: number;
    se: number;
    wald: number;
    df: number;
    sig: number;
    exp_b: number;
  }>;
  omni_tests: {
    chi_square: number;
    df: number;
    sig: number;
  };
}

// Helper formats
const fmt = (num: number, digits = 3) => num?.toFixed(digits) || ".000";
const fmtSig = (num: number) => (num < 0.001 ? "< .001" : num.toFixed(3));
const fmtPct = (num: number) => (num * 100).toFixed(1) + "%";

export const formatBinaryLogisticResult = (
  result: LogisticResult,
  dependentName: string
) => {
  // ----------------------------------------------------------------------
  // 1. PRE-CALCULATION DATA PROCESSING
  // ----------------------------------------------------------------------

  // Hitung Totals dari Block 1 Classification Table (karena ini data asli)
  const obs0 =
    result.classification_table.predicted_0_observed_0 +
    result.classification_table.predicted_1_observed_0;
  const obs1 =
    result.classification_table.predicted_0_observed_1 +
    result.classification_table.predicted_1_observed_1;
  const nTotal = obs0 + obs1;
  const nMissing = 0; // Rust saat ini asumsikan data bersih

  // --- LOGIKA BLOCK 0 (Beginning Block) ---
  // Di Block 0, model hanya menebak kategori mayoritas untuk SEMUA data.
  const majorityIs1 = obs1 >= obs0;

  // Prediksi Block 0
  const b0_pred0_obs0 = majorityIs1 ? 0 : obs0; // Jika mayoritas 1, prediksi 0 untuk obs0 salah semua (0 benar)
  const b0_pred1_obs0 = majorityIs1 ? obs0 : 0; // Jika mayoritas 1, prediksi 1 untuk obs0 (semua salah)

  const b0_pred0_obs1 = majorityIs1 ? 0 : obs1; // Jika mayoritas 1, prediksi 0 untuk obs1 (0)
  const b0_pred1_obs1 = majorityIs1 ? obs1 : 0; // Jika mayoritas 1, prediksi 1 untuk obs1 (semua benar)

  const b0_correct = majorityIs1 ? obs1 : obs0;
  const b0_overall_pct = (b0_correct / nTotal) * 100;

  // Hitung Konstanta Awal (B) untuk Block 0
  // B = ln(prob(1) / prob(0)) = ln(obs1 / obs0)
  const b0_constant = Math.log(obs1 / obs0);
  const b0_expB = Math.exp(b0_constant);

  return {
    tables: [
      // ============================================================
      // SUMMARY DATASET
      // ============================================================
      {
        title: "Case Processing Summary",
        note: "a. If weight is in effect, see classification table for the total number of cases.",
        columnHeaders: [
          { header: "Unweighted Cases", key: "rowHeader" },
          { header: "N", key: "n" },
          { header: "Percent", key: "percent" },
        ],
        rows: [
          {
            rowHeader: ["Selected Cases", "Included in Analysis"],
            n: nTotal,
            percent: fmtPct(1.0), // Asumsi 100% included krn Rust clean data
          },
          {
            rowHeader: ["Selected Cases", "Missing Cases"],
            n: nMissing,
            percent: fmtPct(0.0),
          },
          {
            rowHeader: ["Selected Cases", "Total"],
            n: nTotal,
            percent: fmtPct(1.0),
          },
          {
            rowHeader: ["Unselected Cases", null],
            n: 0,
            percent: ".0%",
          },
          {
            rowHeader: ["Total", null],
            n: nTotal,
            percent: fmtPct(1.0),
          },
        ],
      },
      {
        title: "Dependent Variable Encoding",
        columnHeaders: [
          { header: "Original Value", key: "rowHeader" },
          { header: "Internal Value", key: "val" },
        ],
        rows: [
          { rowHeader: ["0"], val: "0" },
          { rowHeader: ["1"], val: "1" },
        ],
      },

      // ============================================================
      // BLOCK 0: Beginning Block
      // ============================================================
      {
        title: "Classification Table",
        note: "a. Constant is included in the model.\nb. The cut value is .500\nBlock 0: Beginning Block",
        columnHeaders: [
          {
            header: "Observed",
            children: [
              { header: "", key: "rh1" },
              { header: "", key: "rh2" },
            ],
          },
          {
            header: "Predicted",
            children: [
              {
                header: dependentName,
                children: [
                  { header: "0", key: "pred_0" },
                  { header: "1", key: "pred_1" },
                ],
              },
              { header: "Percentage Correct", key: "pct" },
            ],
          },
        ],
        rows: [
          {
            rowHeader: [dependentName, "0"],
            pred_0: b0_pred0_obs0,
            pred_1: b0_pred1_obs0,
            pct:
              obs0 === 0 ? ".0" : fmtPct(b0_pred0_obs0 / obs0).replace("%", ""),
          },
          {
            rowHeader: [dependentName, "1"],
            pred_0: b0_pred0_obs1,
            pred_1: b0_pred1_obs1,
            pct:
              obs1 === 0 ? ".0" : fmtPct(b0_pred1_obs1 / obs1).replace("%", ""),
          },
          {
            rowHeader: ["Overall Percentage", null],
            pred_0: "",
            pred_1: "",
            pct: fmt(b0_overall_pct, 1),
          },
        ],
      },
      {
        title: "Variables in the Equation",
        note: "Block 0: Beginning Block",
        columnHeaders: [
          { header: "", key: "var" },
          { header: "B", key: "b" },
          { header: "S.E.", key: "se" },
          { header: "Wald", key: "wald" },
          { header: "df", key: "df" },
          { header: "Sig.", key: "sig" },
          { header: "Exp(B)", key: "expb" },
        ],
        rows: [
          {
            rowHeader: ["Constant"],
            b: fmt(b0_constant),
            se: "", // Kita tidak hitung SE Null Model di Rust saat ini
            wald: "",
            df: "1",
            sig: "",
            expb: fmt(b0_expB),
          },
        ],
      },

      // ============================================================
      // BLOCK 1: Method = Enter
      // ============================================================
      {
        title: "Omnibus Tests of Model Coefficients",
        note: "Block 1: Method = Enter",
        columnHeaders: [
          { header: "", key: "rowHeader" },
          { header: "Chi-square", key: "chi" },
          { header: "df", key: "df" },
          { header: "Sig.", key: "sig" },
        ],
        rows: [
          {
            rowHeader: ["Step 1"],
            chi: fmt(result.omni_tests.chi_square),
            df: result.omni_tests.df,
            sig: fmtSig(result.omni_tests.sig),
          },
          {
            rowHeader: ["Block"],
            chi: fmt(result.omni_tests.chi_square),
            df: result.omni_tests.df,
            sig: fmtSig(result.omni_tests.sig),
          },
          {
            rowHeader: ["Model"],
            chi: fmt(result.omni_tests.chi_square),
            df: result.omni_tests.df,
            sig: fmtSig(result.omni_tests.sig),
          },
        ],
      },
      {
        title: "Model Summary",
        note: "Block 1: Method = Enter",
        columnHeaders: [
          { header: "Step", key: "step" },
          { header: "-2 Log likelihood", key: "ll" },
          { header: "Cox & Snell R Square", key: "cox" },
          { header: "Nagelkerke R Square", key: "nagel" },
        ],
        rows: [
          {
            rowHeader: ["1"],
            ll: fmt(result.model_summary.log_likelihood),
            cox: fmt(result.model_summary.cox_snell_r2),
            nagel: fmt(result.model_summary.nagelkerke_r2),
          },
        ],
      },
      {
        title: "Classification Table",
        note: "a. The cut value is .500\nBlock 1: Method = Enter",
        columnHeaders: [
          {
            header: "Observed",
            children: [
              { header: "", key: "rh1" },
              { header: "", key: "rh2" },
            ],
          },
          {
            header: "Predicted",
            children: [
              {
                header: dependentName,
                children: [
                  { header: "0", key: "pred_0" },
                  { header: "1", key: "pred_1" },
                ],
              },
              { header: "Percentage Correct", key: "pct" },
            ],
          },
        ],
        rows: [
          {
            rowHeader: [dependentName, "0"],
            pred_0: result.classification_table.predicted_0_observed_0,
            pred_1: result.classification_table.predicted_1_observed_0,
            pct:
              obs0 === 0
                ? ".0"
                : fmtPct(
                    result.classification_table.predicted_0_observed_0 / obs0
                  ).replace("%", ""),
          },
          {
            rowHeader: [dependentName, "1"],
            pred_0: result.classification_table.predicted_0_observed_1,
            pred_1: result.classification_table.predicted_1_observed_1,
            pct:
              obs1 === 0
                ? ".0"
                : fmtPct(
                    result.classification_table.predicted_1_observed_1 / obs1
                  ).replace("%", ""),
          },
          {
            rowHeader: ["Overall Percentage", null],
            pred_0: "",
            pred_1: "",
            pct: fmt(result.classification_table.overall_percentage, 1),
          },
        ],
      },
      {
        title: "Variables in the Equation",
        note: "Block 1: Method = Enter",
        columnHeaders: [
          { header: "", key: "var" },
          { header: "B", key: "b" },
          { header: "S.E.", key: "se" },
          { header: "Wald", key: "wald" },
          { header: "df", key: "df" },
          { header: "Sig.", key: "sig" },
          { header: "Exp(B)", key: "expb" },
        ],
        rows: result.variables_in_equation.map((row) => ({
          rowHeader: [row.label],
          b: fmt(row.b),
          se: fmt(row.se),
          wald: fmt(row.wald),
          df: row.df,
          sig: fmtSig(row.sig),
          expb: fmt(row.exp_b),
        })),
      },
    ],
  };
};
