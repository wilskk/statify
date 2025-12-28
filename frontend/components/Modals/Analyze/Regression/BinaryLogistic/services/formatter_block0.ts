/**
 * formatter_block0.ts
 * Menangani output untuk "Block 0: Beginning Block".
 * Meliputi: Classification Table (Null Model), Vars in Equation, Vars not in Equation.
 */

import { LogisticResult } from "../types/binary-logistic";
import { safeFixed, fmtSig, fmtPct } from "./formatter_utils";

export const formatBlock0 = (result: LogisticResult, dependentName: string) => {
  const tables: any[] = [];
  const ct = result.classification_table;

  // ----------------------------------------------------------------------
  // 1. Re-kalkulasi Data Dasar (untuk independensi fungsi)
  // ----------------------------------------------------------------------
  const obs0_pred0 = ct.observed_0_predicted_0 || 0;
  const obs0_pred1 = ct.observed_0_predicted_1 || 0;
  const obs1_pred0 = ct.observed_1_predicted_0 || 0;
  const obs1_pred1 = ct.observed_1_predicted_1 || 0;

  const count_0 = obs0_pred0 + obs0_pred1;
  const count_1 = obs1_pred0 + obs1_pred1;
  const totalN = count_0 + count_1;

  // ----------------------------------------------------------------------
  // 2. Logika "Null Model" (Tebak Mayoritas)
  // ----------------------------------------------------------------------
  // Jika jumlah 0 >= jumlah 1, maka sistem akan memprediksi 0 untuk semua kasus.
  const predict_0 = count_0 >= count_1;

  const b0_obs0_pred0 = predict_0 ? count_0 : 0;
  const b0_obs0_pred1 = predict_0 ? 0 : count_0;
  const b0_obs1_pred0 = predict_0 ? count_1 : 0;
  const b0_obs1_pred1 = predict_0 ? 0 : count_1;

  // Persentase akurasi
  const b0_pct_0 = count_0 > 0 ? (b0_obs0_pred0 / count_0) * 100 : 0;
  const b0_pct_1 = count_1 > 0 ? (b0_obs1_pred1 / count_1) * 100 : 0;
  const b0_overall = ((b0_obs0_pred0 + b0_obs1_pred1) / totalN) * 100;

  // ----------------------------------------------------------------------
  // 3. Table: Classification Table (Block 0)
  // ----------------------------------------------------------------------
  tables.push({
    title:
      "Block 0: Beginning Block<br/>Classification Table<sup style='display:none'>a,b</sup>",
    note: "a. Constant is included in the model.\nb. The cut value is .500",
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
        rowHeader: ["Step 0", dependentName, "0"],
        pred_0: b0_obs0_pred0.toString(),
        pred_1: b0_obs0_pred1.toString(),
        pct: fmtPct(b0_pct_0),
      },
      {
        rowHeader: ["Step 0", dependentName, "1"],
        pred_0: b0_obs1_pred0.toString(),
        pred_1: b0_obs1_pred1.toString(),
        pct: fmtPct(b0_pct_1),
      },
      {
        rowHeader: ["Step 0", "Overall Percentage", ""],
        pred_0: "",
        pred_1: "",
        pct: fmtPct(b0_overall),
      },
    ],
  });

  // ----------------------------------------------------------------------
  // 4. Hitung Nilai Konstanta Awal (ln(n1/n0))
  // ----------------------------------------------------------------------
  let b0_B = 0;
  if (count_0 > 0 && count_1 > 0) {
    b0_B = Math.log(count_1 / count_0);
  }
  const b0_ExpB = Math.exp(b0_B);

  const const0 = result.block_0_constant;
  // Gunakan nilai dari Wasm jika ada, jika tidak gunakan hitungan JS manual
  const val_B0 = const0?.b !== undefined ? const0.b : b0_B;
  const val_ExpB0 = const0?.exp_b !== undefined ? const0.exp_b : b0_ExpB;

  // ----------------------------------------------------------------------
  // 5. Table: Variables in the Equation (Hanya Constant)
  // ----------------------------------------------------------------------
  tables.push({
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
  });

  // ----------------------------------------------------------------------
  // 6. Table: Variables not in the Equation
  // ----------------------------------------------------------------------
  const varsNotIn = result.variables_not_in_equation || [];
  const totalScore = varsNotIn.reduce((acc, curr) => acc + curr.score, 0);
  const totalDf = varsNotIn.length;

  // Ambil overall sig dari Wasm, atau fallback ke item pertama jika cuma 1 var
  const backendOverallSig = (result as any).overall_remainder_test?.sig;
  const overallSig =
    backendOverallSig !== undefined
      ? backendOverallSig
      : totalDf === 1
      ? varsNotIn[0]?.sig
      : null;

  tables.push({
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
      ...varsNotIn.map((v) => ({
        rowHeader: ["Step 0", v.label],
        score: safeFixed(v.score),
        df: v.df.toString(),
        sig: fmtSig(v.sig),
      })),
      {
        rowHeader: ["Step 0", "Overall Statistics"],
        score: safeFixed(totalScore),
        df: totalDf.toString(),
        sig: fmtSig(overallSig),
      },
    ] as any[],
  });

  return tables;
};