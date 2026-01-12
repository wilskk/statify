import {
  LogisticResult,
  AnalysisSection,
  StepDetail,
} from "../types/binary-logistic";
import { createSection, safeFixed, fmtSig, fmtPct } from "./formatter_utils";

export const formatBlock0 = (
  result: LogisticResult,
  dependentName: string
): { sections: AnalysisSection[] } => {
  const sections: AnalysisSection[] = [];

  const modelInfo = (result as any).model_info || {};
  const variableNames = modelInfo.variables || [];

  // Helper Name: Mengembalikan nama asli variabel jika formatnya "Var_X"
  const getRealVariableName = (label: string): string => {
    if (label.startsWith("Var_") || label.startsWith("Var ")) {
      const parts = label.split(/[ _]/);
      const indexStr = parts[1];
      const index = parseInt(indexStr, 10);
      // Note: Rust index might be 0-based.
      if (!isNaN(index) && variableNames[index]) {
        return variableNames[index];
      }
    }
    return label;
  };

  // ======================================================================
  // 1. HELPERS: LABEL DECODING
  // ======================================================================
  const yMap = modelInfo.y_encoding || {};
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
  const label0 = getLabel(0);
  const label1 = getLabel(1);

  // ======================================================================
  // 2. DATA PREPARATION (Classification Table - RECALCULATE FOR NULL MODEL)
  // ======================================================================
  // Kita hitung manual prediksi Null Model (Block 0) agar konsisten untuk semua metode.
  // Null Model selalu memprediksi kategori mayoritas.

  // Ambil total N dari data result yang tersedia
  const ctRef = result.classification_table;
  const totalObs0 =
    (ctRef?.observed_0_predicted_0 || 0) + (ctRef?.observed_0_predicted_1 || 0);
  const totalObs1 =
    (ctRef?.observed_1_predicted_0 || 0) + (ctRef?.observed_1_predicted_1 || 0);
  const totalN = totalObs0 + totalObs1;

  // Tentukan Prediksi Mayoritas
  const predict1 = totalObs1 > totalObs0;

  let obs0_pred0 = 0,
    obs0_pred1 = 0,
    obs1_pred0 = 0,
    obs1_pred1 = 0;

  if (predict1) {
    // Jika Mayoritas 1, semua diprediksi 1
    obs0_pred1 = totalObs0; // 0 salah diprediksi 1
    obs1_pred1 = totalObs1; // 1 benar diprediksi 1
  } else {
    // Jika Mayoritas 0 (atau seimbang), semua diprediksi 0
    obs0_pred0 = totalObs0; // 0 benar diprediksi 0
    obs1_pred0 = totalObs1; // 1 salah diprediksi 0
  }

  const b0_pct_0 = totalObs0 > 0 ? (obs0_pred0 / totalObs0) * 100 : 0;
  const b0_pct_1 = totalObs1 > 0 ? (obs1_pred1 / totalObs1) * 100 : 0;
  const b0_overall =
    totalN > 0 ? ((obs0_pred0 + obs1_pred1) / totalN) * 100 : 0;

  // ======================================================================
  // 3. TABLE: CLASSIFICATION TABLE
  // ======================================================================
  const classificationData = {
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
              { header: label0, key: "pred_0" },
              { header: label1, key: "pred_1" },
            ],
          },
          { header: "Percentage Correct", key: "pct" },
        ],
      },
    ],
    rows: [
      {
        rowHeader: ["Step 0", dependentName, label0],
        pred_0: obs0_pred0.toString(),
        pred_1: obs0_pred1.toString(),
        pct: fmtPct(b0_pct_0),
      },
      {
        rowHeader: ["Step 0", dependentName, label1],
        pred_0: obs1_pred0.toString(),
        pred_1: obs1_pred1.toString(),
        pct: fmtPct(b0_pct_1),
      },
      {
        rowHeader: ["Step 0", "Overall Percentage", ""],
        pred_0: "",
        pred_1: "",
        pct: fmtPct(b0_overall),
      },
    ],
  };

  sections.push(
    createSection(
      "block0_classification",
      "Classification Table",
      classificationData,
      {
        description: "Klasifikasi awal (Null Model).",
        note: "a. Constant is included in the model.\nb. The cut value is .500",
      }
    )
  );

  // ======================================================================
  // 4. TABLE: VARIABLES IN EQUATION (Constant Only)
  // ======================================================================
  // LOGIKA PRIORITY:
  // 1. Cek field khusus `block_0_constant` (Metode Backward pakai ini).
  // 2. Jika tidak ada, cek `steps_detail[0]` (Metode Enter/Forward pakai ini).

  let constVar = (result as any).block_0_constant;

  if (!constVar && result.steps_detail && result.steps_detail.length > 0) {
    const step0Vars = result.steps_detail[0].variables_in_equation || [];
    constVar = step0Vars.find((v: any) => v.label === "Constant");
  }

  // Fallback safe object
  if (!constVar) {
    constVar = { b: 0, error: 0, wald: 0, df: 1, sig: 1, exp_b: 1 };
  }

  const varsInData = {
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
        b: safeFixed(constVar?.b),
        se: safeFixed(constVar?.error),
        wald: safeFixed(constVar?.wald),
        df: "1",
        sig: fmtSig(constVar?.sig),
        expb: safeFixed(constVar?.exp_b),
      },
    ],
  };

  sections.push(
    createSection("block0_vars_in", "Variables in the Equation", varsInData, {
      description: "Koefisien untuk model awal (hanya Konstanta).",
    })
  );

  // ======================================================================
  // 5. TABLE: VARIABLES NOT IN EQUATION (Score Tests)
  // ======================================================================
  // LOGIKA PRIORITY:
  // 1. Cek field khusus `block_0_variables_not_in` (Backward).
  // 2. Jika tidak ada, cek `steps_detail[0].variables_not_in_equation` (Enter/Forward).
  // 3. Fallback ke `variables_not_in_equation` global (root).

  let varsNotIn = (result as any).block_0_variables_not_in;
  let remainderTest = null;

  if (!varsNotIn) {
    if (result.steps_detail && result.steps_detail.length > 0) {
      varsNotIn = result.steps_detail[0].variables_not_in_equation;
      remainderTest = result.steps_detail[0].remainder_test;
    }

    if (!varsNotIn) {
      // Sangat jarang, fallback terakhir
      varsNotIn = result.variables_not_in_equation;
    }
  }

  // Jika remainderTest belum diambil (misal dari steps_detail[0] diatas), coba ambil global
  if (!remainderTest) {
    remainderTest = (result as any).overall_remainder_test;
  }

  // Pastikan array
  const varsNotInArray = varsNotIn ? [...varsNotIn] : [];

  // --- LOGIKA FIX OVERALL STATISTICS ---
  // Cek apakah di dalam list variabel sudah ada baris "Overall Statistics".
  // (Backward method biasanya sudah menyertakannya dari Rust).
  const hasOverall = varsNotInArray.some(
    (v: any) => v.label === "Overall Statistics"
  );

  // Jika belum ada (biasanya pada Enter/Forward), dan kita punya datanya, tambahkan manual.
  if (!hasOverall && remainderTest) {
    varsNotInArray.push({
      label: "Overall Statistics",
      score: remainderTest.chi_square,
      df: remainderTest.df,
      sig: remainderTest.sig,
    });
  }

  const varsNotInData = {
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
    rows: varsNotInArray.map((v: any) => ({
      rowHeader: ["Step 0", getRealVariableName(v.label)],
      score: safeFixed(v.score),
      df: v.df.toString(),
      sig: fmtSig(v.sig),
    })),
  };

  sections.push(
    createSection(
      "block0_vars_not_in",
      "Variables not in the Equation",
      varsNotInData,
      {
        description:
          "Uji Score untuk variabel kandidat yang belum dimasukkan ke model.",
        note: "a. Residual Chi-Squares are computed based on the likelihood ratios.",
      }
    )
  );

  return { sections };
};
