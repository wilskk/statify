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
    lower_ci: number;
    upper_ci: number;
  }>;
  variables_not_in_equation: Array<{
    label: string;
    score: number;
    df: number;
    sig: number;
  }>;
  block_0_constant: {
    b: number;
    se: number;
    wald: number;
    df: number;
    sig: number;
    exp_b: number;
  };
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

  // Hitung Totals dari Block 1 Classification Table
  const obs0 =
    result.classification_table.predicted_0_observed_0 +
    result.classification_table.predicted_1_observed_0;
  const obs1 =
    result.classification_table.predicted_0_observed_1 +
    result.classification_table.predicted_1_observed_1;
  const nTotal = obs0 + obs1;
  const nMissing = 0; // Asumsi data bersih dari Rust

  // --- LOGIKA BLOCK 0 (Beginning Block) ---
  // Di Block 0, model hanya menebak kategori mayoritas.
  const majorityIs1 = obs1 >= obs0;

  const b0_pred0_obs0 = majorityIs1 ? 0 : obs0;
  const b0_pred1_obs0 = majorityIs1 ? obs0 : 0;
  const b0_pred0_obs1 = majorityIs1 ? 0 : obs1;
  const b0_pred1_obs1 = majorityIs1 ? obs1 : 0;
  const b0_correct = majorityIs1 ? obs1 : obs0;
  const b0_overall_pct = (b0_correct / nTotal) * 100;

  // Hitung Konstanta Awal (B) untuk Block 0
  const b0_constant = obs0 > 0 ? Math.log(obs1 / obs0) : 0;
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
          { header: "N", key: "n", align: "right" },
          { header: "Percent", key: "percent", align: "right" },
        ],
        rows: [
          {
            rowHeader: ["Selected Cases", "Included in Analysis"],
            n: nTotal,
            percent: fmtPct(1.0),
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
      // BLOCK 0
      // ============================================================
      {
        title:
          "Block 0: Beginning Block<br/>Classification Table<sup style='display:none'></sup>",
        note: "a. Constant is included in the model.\nb. The cut value is .500",
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
            b: fmt(result.block_0_constant?.b || b0_constant),
            se: fmt(result.block_0_constant?.se || 0),
            wald: fmt(result.block_0_constant?.wald || 0),
            df: "1",
            sig: fmtSig(result.block_0_constant?.sig || 0),
            expb: fmt(result.block_0_constant?.exp_b || b0_expB),
          },
        ],
      },
      {
        title: "Variables not in the Equation",
        columnHeaders: [
          { header: "", key: "var" },
          { header: "Score", key: "score" },
          { header: "df", key: "df" },
          { header: "Sig.", key: "sig" },
        ],
        rows: [
          ...(result.variables_not_in_equation || []).map((v) => ({
            rowHeader: [v.label],
            score: fmt(v.score),
            df: v.df,
            sig: fmtSig(v.sig),
          })),
          {
            rowHeader: ["Overall Statistics"],
            score: fmt(
              (result.variables_not_in_equation || []).reduce(
                (acc, v) => acc + v.score,
                0
              )
            ),
            df: (result.variables_not_in_equation || []).length,
            sig: fmtSig(0.0),
          },
        ],
      },

      // ============================================================
      // BLOCK 1
      // ============================================================
      {
        title:
          "Block 1: Method = Enter<br/>Omnibus Tests of Model Coefficients<sup style='display:none'></sup>",
        columnHeaders: [
          { header: "", key: "rh" },
          { header: "Chi-square", key: "chi" },
          { header: "df", key: "df" },
          { header: "Sig.", key: "sig" },
        ],
        rows: [
          {
            rowHeader: ["Step 1", "Step"],
            chi: fmt(result.omni_tests.chi_square),
            df: result.omni_tests.df,
            sig: fmtSig(result.omni_tests.sig),
          },
          {
            rowHeader: ["Step 1", "Block"],
            chi: fmt(result.omni_tests.chi_square),
            df: result.omni_tests.df,
            sig: fmtSig(result.omni_tests.sig),
          },
          {
            rowHeader: ["Step 1", "Model"],
            chi: fmt(result.omni_tests.chi_square),
            df: result.omni_tests.df,
            sig: fmtSig(result.omni_tests.sig),
          },
        ],
      },
      {
        title: "Model Summary",
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
        note: "a. The cut value is .500",
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
        columnHeaders: [
          { header: "", key: "var" },
          { header: "B", key: "b" },
          { header: "S.E.", key: "se" },
          { header: "Wald", key: "wald" },
          { header: "df", key: "df" },
          { header: "Sig.", key: "sig" },
          { header: "Exp(B)", key: "expb" },
          {
            header: "95% C.I.for EXP(B)",
            children: [
              { header: "Lower", key: "lo" },
              { header: "Upper", key: "up" },
            ],
          },
        ],
        rows: result.variables_in_equation.map((row) => ({
          rowHeader: [row.label],
          b: fmt(row.b),
          se: fmt(row.se),
          wald: fmt(row.wald),
          df: row.df,
          sig: fmtSig(row.sig),
          expb: fmt(row.exp_b),
          lo: fmt(row.lower_ci),
          up: fmt(row.upper_ci),
        })),
      },
    ],
  };
};
