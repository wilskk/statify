import { LogisticResult, BinaryLogisticOutput } from "../types/binary-logistic";

// Helper formats
const safeFixed = (val: number | undefined | null, digits = 3): string => {
  if (val === undefined || val === null || isNaN(val)) return ".";
  if (val === 0) return ".000";
  if (Math.abs(val) < 1e-9) return ".000";
  return val.toFixed(digits);
};

const fmtSig = (num: number | undefined | null) => {
  if (num === undefined || num === null || isNaN(num)) return ".";
  return num < 0.001 ? "< .001" : num.toFixed(3);
};

// FIX UTAMA: Jangan dikali 100 lagi jika input sudah skala 0-100.
// Berdasarkan screenshot "10000.0", inputnya adalah 100.0.
const fmtPct = (num: number | undefined | null) => {
  if (num === undefined || num === null || isNaN(num)) return ".";
  // Logic: Jika angka > 1 (misal 75.0), asumsikan sudah persen.
  // Jika angka <= 1 (misal 0.75), baru kali 100.
  // Tapi demi konsistensi dengan log SPSS biasanya backend kirim 0-100.
  // Kita hapus pengalian 100-nya agar aman.
  return num.toFixed(1);
};

export const formatBinaryLogisticResult = (
  result: LogisticResult,
  dependentName: string
): BinaryLogisticOutput => {
  // ----------------------------------------------------------------------
  // 1. DATA PREPARATION
  // ----------------------------------------------------------------------

  const ct = result.classification_table;

  // Pastikan angka valid (handle undefined/null dari backend)
  const obs0_pred0 = ct.observed_0_predicted_0 || 0;
  const obs0_pred1 = ct.observed_0_predicted_1 || 0;
  const obs1_pred0 = ct.observed_1_predicted_0 || 0;
  const obs1_pred1 = ct.observed_1_predicted_1 || 0;

  const count_0 = obs0_pred0 + obs0_pred1;
  const count_1 = obs1_pred0 + obs1_pred1;
  const totalN = count_0 + count_1;

  // Logika Block 0 (Baseline/Null Model)
  const predict_0 = count_0 >= count_1;
  const b0_obs0_pred0 = predict_0 ? count_0 : 0;
  const b0_obs0_pred1 = predict_0 ? 0 : count_0;
  const b0_obs1_pred0 = predict_0 ? count_1 : 0;
  const b0_obs1_pred1 = predict_0 ? 0 : count_1;

  // Hitung persen Block 0 (skala 0-100)
  const b0_pct_0 = count_0 > 0 ? (b0_obs0_pred0 / count_0) * 100 : 0;
  const b0_pct_1 = count_1 > 0 ? (b0_obs1_pred1 / count_1) * 100 : 0;
  const b0_overall = ((b0_obs0_pred0 + b0_obs1_pred1) / totalN) * 100;

  // Hitung konstanta Block 0
  let b0_B = 0;
  if (count_0 > 0 && count_1 > 0) {
    b0_B = Math.log(count_1 / count_0);
  }
  const b0_ExpB = Math.exp(b0_B);

  const const0 = result.block_0_constant;
  const val_B0 = const0?.b !== undefined ? const0.b : b0_B;
  const val_ExpB0 = const0?.exp_b !== undefined ? const0.exp_b : b0_ExpB;

  // --- C. Table 5 Preparation (Variables Not in Equation) ---
  const varsNotIn = result.variables_not_in_equation || [];

  // Agregasi Score (Summation adalah operasi standar formatter tabel)
  const totalScore = varsNotIn.reduce((acc, curr) => acc + curr.score, 0);
  const totalDf = varsNotIn.length;

  const backendOverallSig = (result as any).overall_remainder_test?.sig;

  const overallSig =
    backendOverallSig !== undefined
      ? backendOverallSig
      : totalDf === 1
      ? varsNotIn[0].sig
      : null; // Akan render "." jika backend tidak kirim data untuk N > 1

  return {
    tables: [
      // ============================================================
      // TABLE 1: CASE PROCESSING SUMMARY
      // ============================================================
      {
        title: "Case Processing Summary",
        note: "a. If weight is in effect, see classification table for the total number of cases.",
        columnHeaders: [
          {
            header: "Unweighted Cases",
            children: [
              { header: "", key: "rh1" }, // Tempat untuk "Selected Cases"
              { header: "", key: "rh2" }, // Tempat untuk "Included in Analysis"
            ],
          },
          { header: "N", key: "n", align: "right" },
          { header: "Percent", key: "percent", align: "right" },
        ],
        rows: [
          {
            rowHeader: ["Selected Cases", "Included in Analysis"],
            // Mengubah ke String eksplisit agar tidak dianggap objek oleh tabel komponen
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
      },

      // ============================================================
      // TABLE 2: DEPENDENT VARIABLE ENCODING
      // ============================================================
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
      // TABLE 3: BLOCK 0 - CLASSIFICATION TABLE
      // ============================================================
      {
        title:
          "Block 0: Beginning Block<br/>Classification Table<sup style='display:none'>a,b</sup>",
        note: "a. Constant is included in the model.\nb. The cut value is .500",
        columnHeaders: [
          {
            header: "Observed",
            // SOLUSI: Menggunakan pola children seperti contoh Omnibus Anda
            // Membagi kolom Observed menjadi 3 sub-kolom untuk: [Step] - [VarName] - [Value]
            children: [
              { header: "", key: "rh1" }, // Slot untuk "Step 0"
              { header: "", key: "rh2" }, // Slot untuk Dependent Name / Overall Pct
              { header: "", key: "rh3" }, // Slot untuk Value (0/1)
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
            // Baris 1: Step 0 -> Nama Variabel -> 0
            rowHeader: ["Step 0", dependentName, "0"],
            pred_0: b0_obs0_pred0,
            pred_1: b0_obs0_pred1,
            pct: fmtPct(b0_pct_0),
          },
          {
            // Baris 2: Step 0 -> Nama Variabel -> 1
            // (Komponen tabel biasanya akan menggabungkan "Step 0" dan "VarName" jika sama persis dengan atasnya)
            rowHeader: ["Step 0", dependentName, "1"],
            pred_0: b0_obs1_pred0,
            pred_1: b0_obs1_pred1,
            pct: fmtPct(b0_pct_1),
          },
          {
            // Baris 3: Step 0 -> Overall Percentage -> (Kosong)
            rowHeader: ["Step 0", "Overall Percentage", ""],
            pred_0: "",
            pred_1: "",
            pct: fmtPct(b0_overall),
          },
        ],
      },

      // ============================================================
      // TABLE 4: BLOCK 0 - VARIABLES IN EQUATION
      // ============================================================
      {
        title: "Variables in the Equation",
        columnHeaders: [
          {
            header: "",
            children: [
              { header: "", key: "rh1" },
              { header: "", key: "rh2" },
            ],
          },
          { header: "B", key: "b" },
          { header: "S.E.", key: "se" },
          { header: "Wald", key: "wald" },
          { header: "df", key: "df" },
          { header: "Sig.", key: "sig" },
          { header: "Exp(B)", key: "expb" },
        ],
        rows: [
          {
            rowHeader: ["Step 0", "Constant"],
            b: safeFixed(val_B0),
            se: safeFixed(const0?.error),
            wald: safeFixed(const0?.wald),
            df: "1",
            sig: fmtSig(const0?.sig),
            expb: safeFixed(val_ExpB0),
          },
        ],
      },

      // ============================================================
      // TABLE 5: BLOCK 0 - VARIABLES NOT IN EQUATION
      // ============================================================
      {
        title: "Variables not in the Equation",
        columnHeaders: [
          {
            header: "",
            children: [
              { header: "", key: "rh1" },
              { header: "", key: "rh2" },
            ],
          },
          { header: "Score", key: "score" },
          { header: "df", key: "df" },
          { header: "Sig.", key: "sig" },
        ],
        rows: [
          ...(result.variables_not_in_equation || []).map((v) => ({
            rowHeader: ["Step 0", v.label],
            score: safeFixed(v.score),
            df: v.df,
            sig: fmtSig(v.sig),
          })),
          {
            rowHeader: ["Step 0", "Overall Statistics"],
            score: safeFixed(totalScore),
            df: totalDf,
            sig: fmtSig(overallSig), // Benar (0.329) jika N=1, atau "." jika N>1 & backend null
          },
        ],
      },

      // ============================================================
      // TABLE 6: BLOCK 1 - OMNIBUS TESTS (Fix Column Mapping)
      // ============================================================
      {
        title:
          "Block 1: Method = Enter<br/>Omnibus Tests of Model Coefficients<sup style='display:none'>a,b</sup>",
        columnHeaders: [
          {
            header: "", // Header utama kosong
            // SOLUSI: Kita buat 2 kolom anak untuk menampung Hirarki Baris
            children: [
              { header: "", key: "rh1" },
              { header: "", key: "rh2" },
            ],
          },
          { header: "Chi-square", key: "chi" },
          { header: "df", key: "df" },
          { header: "Sig.", key: "sig" },
        ],
        rows: [
          {
            // Row Header diperjelas, pastikan komponen tabel membaca 'rh' ini
            rowHeader: ["Step 1", "Step"],
            rh: "Step", // Kadang tabel butuh key spesifik
            chi: safeFixed(result.omni_tests?.chi_square),
            df: result.omni_tests?.df,
            sig: fmtSig(result.omni_tests?.sig),
          },
          {
            rowHeader: ["Step 1", "Block"],
            rh: "Block",
            chi: safeFixed(result.omni_tests?.chi_square),
            df: result.omni_tests?.df,
            sig: fmtSig(result.omni_tests?.sig),
          },
          {
            rowHeader: ["Step 1", "Model"],
            rh: "Model",
            chi: safeFixed(result.omni_tests?.chi_square),
            df: result.omni_tests?.df,
            sig: fmtSig(result.omni_tests?.sig),
          },
        ],
      },

      // ============================================================
      // TABLE 7: MODEL SUMMARY
      // ============================================================
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
            ll: safeFixed(result.model_summary?.log_likelihood),
            cox: safeFixed(result.model_summary?.cox_snell_r_square),
            nagel: safeFixed(result.model_summary?.nagelkerke_r_square),
          },
        ],
      },

      // ============================================================
      // TABLE 8: CLASSIFICATION TABLE (FULL MODEL)
      // ============================================================
      {
        title: "Classification Table<sup style='display:none'>a</sup>",
        note: "a. The cut value is .500",
        columnHeaders: [
          {
            header: "Observed",
            children: [
              { header: "", key: "rh1" },
              { header: "", key: "rh2" },
              { header: "", key: "rh3" },
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
            rowHeader: ["Step 1", dependentName, "0"],
            pred_0: obs0_pred0,
            pred_1: obs0_pred1,
            // fmtPct sekarang aman (tidak dikali 100 lagi)
            pct: fmtPct(ct.percentage_correct_0),
          },
          {
            rowHeader: ["Step 1", dependentName, "1"],
            pred_0: obs1_pred0,
            pred_1: obs1_pred1,
            pct: fmtPct(ct.percentage_correct_1),
          },
          {
            rowHeader: ["Step 1", "Overall Percentage", ""],
            pred_0: "",
            pred_1: "",
            pct: fmtPct(ct.overall_percentage),
          },
        ],
      },

      // ============================================================
      // TABLE 9: VARIABLES IN THE EQUATION (FULL)
      // ============================================================
      {
        title: "Variables in the Equation",
        columnHeaders: [
          {
            header: "",
            children: [
              { header: "", key: "rh1" },
              { header: "", key: "rh2" },
            ],
          },
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
        rows: (result.variables_in_equation || []).map((row) => ({
          rowHeader: ["Step 1", row.label],
          b: safeFixed(row.b),
          se: safeFixed(row.error),
          wald: safeFixed(row.wald),
          df: row.df,
          sig: fmtSig(row.sig),
          expb: safeFixed(row.exp_b),
          lo: safeFixed(row.lower_ci),
          up: safeFixed(row.upper_ci),
        })),
      },
    ],
  };
};
