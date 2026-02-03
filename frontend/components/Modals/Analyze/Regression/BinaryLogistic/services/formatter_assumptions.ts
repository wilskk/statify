import { LogisticResult, AnalysisSection } from "../types/binary-logistic";
import { createSection, safeFixed, fmtSig } from "./formatter_utils";

// Helper untuk menentukan Concern Level berdasarkan nilai VIF
const getConcernLevel = (vif: number): string => {
  if (vif < 2) return "Low";
  if (vif >= 2 && vif < 5) return "Moderate";
  if (vif >= 5 && vif < 10) return "High";
  return "Very High";
};

// Helper untuk membuat deskripsi dinamis VIF & Korelasi
const generateAssumptionDescription = (
  vifData: any[],
  correlationMatrix: any,
): string => {
  let descriptionParts = [];

  // Analisis VIF
  const highVif = vifData.filter((r) => r.vif >= 5);
  if (highVif.length > 0) {
    const vars = highVif
      .map((r) => `${r.variable} (VIF=${safeFixed(r.vif)})`)
      .join(", ");
    descriptionParts.push(
      `Potential multicollinearity detected. The following variables have VIF values greater than 5: ${vars}. Values above 10 usually indicate serious multicollinearity.`,
    );
  } else {
    descriptionParts.push(
      "No significant multicollinearity detected based on VIF values (all < 5).",
    );
  }

  // Analisis Korelasi (jika ada)
  if (correlationMatrix && correlationMatrix.length > 0) {
    let highCorrCount = 0;
    // Cek triangle atas saja. Struktur data: { variable, values: [] }
    for (let i = 0; i < correlationMatrix.length; i++) {
      const rowVals = correlationMatrix[i].values;
      if (!rowVals) continue;

      for (let j = i + 1; j < correlationMatrix.length; j++) {
        const val = Math.abs(rowVals[j]);
        if (val > 0.8) highCorrCount++;
      }
    }
    if (highCorrCount > 0) {
      descriptionParts.push(
        `Review of the correlation matrix shows ${highCorrCount} pair(s) of variables with strong correlations (|r| > 0.8), which supports the possibility of multicollinearity.`,
      );
    }
  }

  return descriptionParts.join(" ");
};

// Helper untuk membuat deskripsi dinamis Box-Tidwell
const generateBoxTidwellDescription = (boxTidwellData: any[]): string => {
  if (!boxTidwellData || boxTidwellData.length === 0) return "";

  // Cari variabel yang interaksinya signifikan (p < 0.05)
  // Signifikan berarti HUBUNGANNYA TIDAK LINEAR (Asumsi Dilanggar)
  const violatedVars = boxTidwellData.filter((row) => row.is_significant);

  if (violatedVars.length > 0) {
    const varNames = violatedVars.map((v) => v.variable).join(", ");
    return `Linearity assumption likely violated. The Box-Tidwell test indicates non-linear relationships for the following variable(s): ${varNames} (Sig. < 0.05). You may need to transform these variables or treat them as categorical.`;
  } else {
    return "Linearity assumption met. None of the interaction terms were statistically significant (Sig. > 0.05), indicating a linear relationship between the continuous predictors and the logit of the outcome.";
  }
};

export const formatAssumptionTests = (
  result: LogisticResult,
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
    const predictors = assumptions.correlation_matrix.map(
      (row: any) => row.variable,
    );

    // Setup Column Headers: Variable Name sebagai kolom
    const corrHeaders = [
      { header: "Variable", key: "row_var" },
      ...predictors.map((name: string, idx: number) => ({
        header: name,
        key: `col_${idx}`,
      })),
    ];

    // Setup Rows
    const corrRows = assumptions.correlation_matrix.map((rowObj: any) => {
      // rowObj adalah { variable: string, values: number[] }
      const outputRow: any = {
        rowHeader: [rowObj.variable], // Header kiri
        row_var: rowObj.variable, // Key untuk kolom pertama
      };

      const values = rowObj.values;

      if (Array.isArray(values)) {
        values.forEach((val: number, colIdx: number) => {
          outputRow[`col_${colIdx}`] = safeFixed(val, 3);
        });
      }

      return outputRow;
    });

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
            "Pearson correlation coefficients between predictor variables. Coefficients close to 1 or -1 indicate strong linear relationships, suggesting potential multicollinearity.",
        },
      ),
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

    // Buat Deskripsi Dinamis VIF
    const dynamicDesc = generateAssumptionDescription(
      assumptions.vif,
      assumptions.correlation_matrix,
    );

    sections.push(
      createSection(
        "assumption_vif",
        "Collinearity Statistics (VIF)",
        vifData,
        {
          description: dynamicDesc,
        },
      ),
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
          interp: "No significant multicollinearity.",
        },
        {
          rowHeader: ["Moderate"],
          level: "Moderate",
          range: "2 - 5",
          interp: "Moderate multicollinearity; typically acceptable.",
        },
        {
          rowHeader: ["High"],
          level: "High",
          range: "5 - 10",
          interp: "High multicollinearity; verify coefficient stability.",
        },
        {
          rowHeader: ["Very High"],
          level: "Very High",
          range: "> 10",
          interp: "Severe multicollinearity; remedial action recommended.",
        },
      ],
    };

    sections.push(
      createSection(
        "assumption_vif_legend",
        "VIF Interpretation Guide",
        legendData,
        {
          description:
            "General guidelines for interpreting Variance Inflation Factors.",
        },
      ),
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
        { header: "Result", key: "res" },
      ],
      rows: assumptions.box_tidwell.map((row) => ({
        rowHeader: [row.variable],
        var: row.variable,
        term: row.interaction_term,
        b: safeFixed(row.b),
        sig: fmtSig(row.sig),
        res: row.is_significant
          ? "Assumption Violated (Non-Linear)"
          : "Assumption Met (Linear)",
      })),
    };

    // Buat Deskripsi Dinamis Box-Tidwell
    const btDescription = generateBoxTidwellDescription(
      assumptions.box_tidwell,
    );

    sections.push(
      createSection(
        "assumption_box_tidwell",
        "Linearity of the Logit (Box-Tidwell Test)",
        btData,
        {
          description: btDescription,
        },
      ),
    );
  }

  return { sections };
};
