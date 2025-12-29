import {
  LogisticResult,
  StepHistory,
  AnalysisSection,
} from "../types/binary-logistic";
import { createSection, safeFixed, fmtSig, fmtPct } from "./formatter_utils";

export const formatBlock1 = (
  result: LogisticResult,
  dependentName: string
): { sections: AnalysisSection[] } => {
  const sections: AnalysisSection[] = [];
  const ct = result.classification_table;

  // ----------------------------------------------------------------------
  // 1. Logic Check & Metadata
  // ----------------------------------------------------------------------

  // Ambil list variabel yang masuk ke model
  const predictors = result.variables_in_equation || [];

  // FIX: Cek apakah ada prediktor SELAIN Constant.
  // Jika length > 0 tapi isinya cuma Constant, berarti belum ada variabel X yang masuk.
  const realPredictors = predictors.filter((p) => p.label !== "Constant");
  const hasRealPredictors = realPredictors.length > 0;

  // Cek metode yang digunakan
  const methodUsed = (result as any).method_used || "Enter";

  // Deteksi Group Metode
  const isBackward = methodUsed.includes("Backward");
  const isForward =
    methodUsed.includes("Forward") || methodUsed.includes("Stepwise");
  const isEnter = !isBackward && !isForward; // Asumsi default Enter

  // Tentukan Nomor Langkah Terakhir (Final Step)
  const history = result.step_history || [];
  // Jika history kosong (karena dicukupkan worker atau metode Enter), default ke 1 atau 0
  const finalStepNum =
    history.length > 0
      ? history[history.length - 1].step
      : hasRealPredictors
      ? 1
      : 0;
  const currentStepLabel = `Step ${finalStepNum}`;

  // ======================================================================
  // LOGIKA UTAMA TAMPILKAN BLOCK 1
  // ======================================================================
  /*
    Kapan Block 1 Muncul?
    1. Metode ENTER: Selalu muncul.
    2. Metode BACKWARD: Selalu muncul (karena start dari semua variabel).
    3. Metode FORWARD: Hanya muncul jika ada variabel 'Real' yang masuk.
  */
  const shouldShowBlock1 =
    isEnter || isBackward || (isForward && hasRealPredictors);

  if (shouldShowBlock1) {
    // ======================================================================
    // SECTION 1: Omnibus Tests of Model Coefficients
    // ======================================================================
    const omnibusData = {
      columnHeaders: [
        {
          header: "",
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
          rowHeader: [currentStepLabel, "Step"],
          chi: safeFixed(result.omni_tests?.chi_square),
          df: result.omni_tests?.df?.toString() ?? "0",
          sig: fmtSig(result.omni_tests?.sig),
        },
        {
          rowHeader: [currentStepLabel, "Block"],
          chi: safeFixed(result.omni_tests?.chi_square),
          df: result.omni_tests?.df?.toString() ?? "0",
          sig: fmtSig(result.omni_tests?.sig),
        },
        {
          rowHeader: [currentStepLabel, "Model"],
          chi: safeFixed(result.omni_tests?.chi_square),
          df: result.omni_tests?.df?.toString() ?? "0",
          sig: fmtSig(result.omni_tests?.sig),
        },
      ],
    };

    sections.push(
      createSection(
        "block1_omnibus",
        `Omnibus Tests of Model Coefficients`,
        omnibusData,
        {
          description:
            "Pengujian signifikansi model secara keseluruhan (Chi-square).",
        }
      )
    );

    // ======================================================================
    // SECTION 2: Model Summary
    // ======================================================================
    let summaryRows: any[] = [];

    if (history.length > 0) {
      // Jika ada history (Backward/Stepwise yang sukses), tampilkan baris per langkah
      summaryRows = history.map((h: StepHistory) => ({
        rowHeader: [h.step.toString()],
        ll: safeFixed(h.model_log_likelihood),
        cox: safeFixed(0), // Placeholder (Rust library mungkin belum return ini di history)
        nagel: safeFixed(h.nagelkerke_r2),
      }));
    } else {
      // Jika Metode Enter atau Forward Step 1 (tanpa history array)
      summaryRows = [
        {
          rowHeader: ["1"],
          ll: safeFixed(result.model_summary?.log_likelihood),
          cox: safeFixed(result.model_summary?.cox_snell_r_square),
          nagel: safeFixed(result.model_summary?.nagelkerke_r_square),
        },
      ];
    }

    const modelSummaryData = {
      columnHeaders: [
        { header: "Step", key: "rowHeader" },
        { header: "-2 Log likelihood", key: "ll" },
        { header: "Cox & Snell R Square", key: "cox" },
        { header: "Nagelkerke R Square", key: "nagel" },
      ],
      rows: summaryRows,
    };

    sections.push(
      createSection("block1_model_summary", "Model Summary", modelSummaryData, {
        description:
          "Statistik kebaikan model (Goodness of Fit) termasuk R Square semu.",
        note: "a. Estimation terminated at iteration number...", // String statis sementara
      })
    );

    // ======================================================================
    // SECTION 3: Classification Table (Final Step)
    // ======================================================================
    const obs0_pred0 = ct.observed_0_predicted_0 || 0;
    const obs0_pred1 = ct.observed_0_predicted_1 || 0;
    const obs1_pred0 = ct.observed_1_predicted_0 || 0;
    const obs1_pred1 = ct.observed_1_predicted_1 || 0;

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
          rowHeader: [currentStepLabel, dependentName, "0"],
          pred_0: obs0_pred0.toString(),
          pred_1: obs0_pred1.toString(),
          pct: fmtPct(ct.percentage_correct_0),
        },
        {
          rowHeader: [currentStepLabel, dependentName, "1"],
          pred_0: obs1_pred0.toString(),
          pred_1: obs1_pred1.toString(),
          pct: fmtPct(ct.percentage_correct_1),
        },
        {
          rowHeader: [currentStepLabel, "Overall Percentage", ""],
          pred_0: "",
          pred_1: "",
          pct: fmtPct(ct.overall_percentage),
        },
      ],
    };

    sections.push(
      createSection(
        "block1_classification",
        "Classification Table",
        classificationData,
        {
          description: `Tabel klasifikasi akurasi prediksi pada ${currentStepLabel}.`,
          note: "a. The cut value is .500",
        }
      )
    );

    // ======================================================================
    // SECTION 4: Variables in the Equation
    // ======================================================================
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
        {
          header: "95% C.I.for EXP(B)",
          children: [
            { header: "Lower", key: "lo" },
            { header: "Upper", key: "up" },
          ],
        },
      ],
      rows: predictors.map((row) => ({
        rowHeader: [currentStepLabel, row.label],
        b: safeFixed(row.b),
        se: safeFixed(row.error),
        wald: safeFixed(row.wald),
        df: row.df ? row.df.toString() : "1",
        sig: fmtSig(row.sig),
        expb: safeFixed(row.exp_b),
        lo: safeFixed(row.lower_ci),
        up: safeFixed(row.upper_ci),
      })),
    };

    sections.push(
      createSection("block1_vars_in", "Variables in the Equation", varsInData, {
        description:
          "Koefisien regresi logistik dan rasio odds (Exp(B)) untuk variabel dalam model.",
      })
    );

    // ======================================================================
    // SECTION 5: Variables NOT in the Equation
    // ======================================================================
    const varsNotIn = result.variables_not_in_equation || [];

    if (varsNotIn.length > 0) {
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
        rows: varsNotIn.map((v) => ({
          rowHeader: [currentStepLabel, v.label],
          score: safeFixed(v.score),
          df: v.df.toString(),
          sig: fmtSig(v.sig),
        })),
      };

      sections.push(
        createSection(
          "block1_vars_not_in",
          "Variables not in the Equation",
          varsNotInData,
          {
            description:
              "Uji statistik Score untuk variabel yang dikeluarkan atau belum dimasukkan.",
          }
        )
      );
    }
  } else {
    // ======================================================================
    // KONDISI B: FORWARD STEPWISE TAPI TIDAK ADA VARIABEL MASUK
    // ======================================================================
    const statusData = {
      columnHeaders: [
        {
          header: "",
          children: [{ header: "", key: "rh1" }],
        },
        { header: "Model Status Information", key: "message_content" },
      ],
      rows: [
        {
          rowHeader: ["Result"],
          message_content: "No variables were entered into the equation.",
        },
      ],
    };

    sections.push(
      createSection(
        "block1_status",
        `Block 1: Method = ${methodUsed}`,
        statusData,
        {
          description: "Status eksekusi metode stepwise.",
        }
      )
    );
  }

  return { sections };
};
