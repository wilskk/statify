import { LogisticResult, AnalysisSection } from "../types/binary-logistic";
import { createSection, safeFixed, fmtSig } from "./formatter_utils";

// Helper untuk menentukan Concern Level berdasarkan nilai VIF
const getConcernLevel = (vif: number): string => {
  if (vif < 2) return "Low";
  if (vif >= 2 && vif < 5) return "Moderate";
  if (vif >= 5 && vif < 10) return "High";
  return "Very High";
};

// Helper untuk membuat deskripsi dinamis
const generateDescription = (
  vifData: any[],
  correlationMatrix: any
): string => {
  let description = [];

  // Analisis VIF
  const highVif = vifData.filter((r) => r.vif >= 5);
  if (highVif.length > 0) {
    const vars = highVif
      .map((r) => `${r.variable} (VIF=${safeFixed(r.vif)})`)
      .join(", ");
    description.push(
      `Multicollinearity issues detected. The following variables have high VIF (>5): ${vars}.`
    );
  } else {
    description.push(
      "No significant multicollinearity detected based on VIF values (all < 5)."
    );
  }

  // Analisis Korelasi (jika ada)
  if (correlationMatrix && correlationMatrix.length > 0) {
    let highCorrCount = 0;
    // Cek triangle atas saja. Struktur data: { variable, values: [] }
    for (let i = 0; i < correlationMatrix.length; i++) {
      // Pastikan values ada
      const rowVals = correlationMatrix[i].values;
      if (!rowVals) continue;

      for (let j = i + 1; j < correlationMatrix.length; j++) {
        const val = Math.abs(rowVals[j]);
        if (val > 0.8) highCorrCount++;
      }
    }
    if (highCorrCount > 0) {
      description.push(
        `Additionally, strong correlations (> 0.8) were found between ${highCorrCount} pairs of variables, supporting the presence of multicollinearity.`
      );
    }
  }

  return description.join(" ");
};

export const formatAssumptionTests = (
  result: LogisticResult
): { sections: AnalysisSection[] } => {
  const sections: AnalysisSection[] = [];
  const assumptions = result.assumption_tests;

  if (!assumptions) return { sections };

  // --- 1. Correlation Matrix ---
  if (
    assumptions.correlation_matrix &&
    assumptions.correlation_matrix.length > 0
  ) {
    // Ambil daftar nama variabel langsung dari data correlation matrix
    // Data dari worker: [{ variable: "X1", values: [...] }, ...]
    const predictors = assumptions.correlation_matrix.map(
      (row: any) => row.variable
    );

    // Setup Column Headers: Variable Name sebagai kolom
    const corrHeaders = [
      { header: "Variable", key: "row_var" },
      ...predictors.map((name: string, idx: number) => ({
        header: name,
        key: `col_${idx}`,
      })),
    ];

    // Setup Rows (PERBAIKAN UTAMA DI SINI)
    const corrRows = assumptions.correlation_matrix.map(
      (rowObj: any, idx: number) => {
        // rowObj adalah { variable: string, values: number[] }

        // Data output untuk Renderer
        const outputRow: any = {
          rowHeader: [rowObj.variable], // Header kiri
          row_var: rowObj.variable, // Key untuk kolom pertama
        };

        // Akses array angka melalui properti .values
        const values = rowObj.values;

        if (Array.isArray(values)) {
          values.forEach((val: number, colIdx: number) => {
            outputRow[`col_${colIdx}`] = safeFixed(val, 3);
          });
        }

        return outputRow;
      }
    );

    sections.push(
      createSection(
        "assumption_corr_matrix",
        "Correlation Matrix",
        {
          columnHeaders: corrHeaders,
          rows: corrRows,
        },
        {
          description:
            "Pearson correlation coefficients between predictor variables. Values close to 1 or -1 indicate strong multicollinearity.",
        }
      )
    );
  }

  // --- 2. Variance Inflation Factors (VIF) ---
  if (assumptions.vif && assumptions.vif.length > 0) {
    const vifData = {
      columnHeaders: [
        { header: "Variable", key: "var" },
        { header: "Tolerance", key: "tol" },
        { header: "VIF", key: "vif" },
        { header: "Concern Level", key: "concern" },
      ],
      rows: assumptions.vif.map((row) => ({
        rowHeader: [row.variable],
        var: row.variable,
        tol: safeFixed(row.tolerance),
        vif: safeFixed(row.vif),
        concern: getConcernLevel(row.vif),
      })),
    };

    // Buat Deskripsi Dinamis
    const dynamicDesc = generateDescription(
      assumptions.vif,
      assumptions.correlation_matrix
    );

    sections.push(
      createSection(
        "assumption_vif",
        "Variance Inflation Factors (VIF)",
        vifData,
        {
          description: dynamicDesc,
        }
      )
    );

    // --- 3. Legend VIF ---
    const legendData = {
      columnHeaders: [
        { header: "Level", key: "level" },
        { header: "VIF Range", key: "range" },
        { header: "Interpretation", key: "interp" },
      ],
      rows: [
        {
          rowHeader: ["Low"],
          level: "Low",
          range: "< 2",
          interp: "No significant multicollinearity",
        },
        {
          rowHeader: ["Moderate"],
          level: "Moderate",
          range: "2 - 5",
          interp: "Moderate multicollinearity, may not require action",
        },
        {
          rowHeader: ["High"],
          level: "High",
          range: "5 - 10",
          interp: "High multicollinearity, consider remedial measures",
        },
        {
          rowHeader: ["Very High"],
          level: "Very High",
          range: "> 10",
          interp: "Severe multicollinearity, remedial action recommended",
        },
      ],
    };

    sections.push(
      createSection(
        "assumption_vif_legend",
        "VIF Concern Levels Legend",
        legendData,
        {
          description: "Reference table for interpreting VIF values.",
        }
      )
    );
  }

  // --- 4. Box-Tidwell Test ---
  if (assumptions.box_tidwell && assumptions.box_tidwell.length > 0) {
    const btData = {
      columnHeaders: [
        { header: "Original Variable", key: "var" },
        { header: "Interaction Term", key: "term" },
        { header: "Coeff (B)", key: "b" },
        { header: "Sig.", key: "sig" },
        { header: "Conclusion", key: "res" },
      ],
      rows: assumptions.box_tidwell.map((row) => ({
        rowHeader: [row.variable],
        var: row.variable,
        term: row.interaction_term,
        b: safeFixed(row.b),
        sig: fmtSig(row.sig),
        res: row.is_significant
          ? "Non-Linear (Assumption Violated)"
          : "Linear Assumption Met",
      })),
    };

    sections.push(
      createSection(
        "assumption_box_tidwell",
        "Linearity of the Logit (Box-Tidwell Test)",
        btData,
        {
          description:
            "Tests the linear relationship between continuous predictors and the logit. Significance < 0.05 indicates a violation of the linearity assumption.",
        }
      )
    );
  }

  return { sections };
};
