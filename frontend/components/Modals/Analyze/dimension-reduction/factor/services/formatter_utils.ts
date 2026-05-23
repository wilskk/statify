/**
 * Factor Analysis Formatter Utils
 * 
 * Inspired by Binary Logistic Regression formatter_utils.ts
 * Provides helper functions for creating sections with descriptions,
 * formatting numbers, and generating SPSS-style interpretations.
 * 
 * Philosophy: Keep descriptions concise and actionable, following SPSS conventions.
 */

import { Table, ResultJson } from "@/types/Table";

// ============================================================================
// TYPE DEFINITIONS (Compatible with existing Table structure)
// ============================================================================

export type AnalysisSection = Table & {
  id: string;
  type?: "table" | "text" | "chart";
  chartData?: any;
};

export type TableResultContent = {
  columnHeaders: any[];
  rows: any[];
};

// ============================================================================
// SECTION BUILDER HELPER
// ============================================================================

/**
 * Helper untuk menggabungkan note dan description
 * Note (technical/methodological info) menjadi bagian awal
 * Description (interpretasi/insight) menjadi bagian akhir
 * 
 * Format output (HTML untuk TiptapEditor):
 * "a. [Note line 1]<br>
 *  b. [Note line 2]<br><br>
 *  [Description/Interpretation]"
 * 
 * Notes:
 * - Setiap poin (a., b., c., dll) dipisahkan dengan <br>
 * - Ada double <br> antara note dan interpretasi
 */
const mergeNoteAndDescription = (
  note?: string,
  description?: string
): string | undefined => {
  const parts: string[] = [];
  
  if (note && note.trim()) {
    // Konversi \n menjadi <br> untuk HTML rendering
    const formattedNote = note.trim().replace(/\n/g, "<br>");
    parts.push(formattedNote);
  }
  
  if (description && description.trim()) {
    parts.push(description.trim());
  }
  
  // Gabungkan dengan <br><br> agar ada spasi antara note dan interpretasi
  return parts.length > 0 ? parts.join("<br><br>") : undefined;
};

/**
 * Helper factory untuk membuat Section standard
 * Kompatibel dengan struktur Table yang existing
 */
export const createSection = (
  id: string,
  title: string,
  data: TableResultContent,
  options?: {
    description?: string;
    note?: string;
  }
): AnalysisSection => {
  // Gabungkan note ke dalam field interpretation (mengikuti pattern Table)
  const mergedInterpretation = mergeNoteAndDescription(
    options?.note,
    options?.description
  );
  
  return {
    id,
    key: id,
    title,
    type: "table",
    columnHeaders: data.columnHeaders || [],
    rows: data.rows || [],
    interpretation: mergedInterpretation,
  };
};

// ============================================================================
// NUMBER FORMATTERS (SPSS Style)
// ============================================================================

/**
 * Format angka desimal dengan presisi default 3 digit
 * Menangani null, undefined, NaN dengan "." 
 * Nilai sangat kecil (< 1e-9) dianggap 0
 */
export const safeFixed = (
  val: number | undefined | null,
  digits = 3
): string => {
  if (val === undefined || val === null || isNaN(val)) return ".";
  if (val === 0 || Math.abs(val) < 1e-9) return ".000";
  return val.toFixed(digits);
};

/**
 * Format p-value / Significance
 * Jika < 0.001, tampilkan "< .001"
 * Format standar SPSS untuk p-values
 */
export const fmtSig = (num: number | undefined | null, digits = 3): string => {
  if (num === undefined || num === null || isNaN(num)) return ".";
  return num < 0.001 ? "< .001" : num.toFixed(digits);
};

/**
 * Format persentase dengan 1 digit desimal
 * Cocok untuk variance explained, communalities, dll
 */
export const fmtPct = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return ".";
  return num.toFixed(1);
};

/**
 * Format persentase dengan 2 digit desimal (untuk lebih presisi)
 */
export const fmtPctPrecise = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return ".";
  return num.toFixed(2);
};

/**
 * Format angka integer
 * Untuk counts, n, df, dll
 */
export const fmtInt = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return ".";
  return Math.round(num).toString();
};

/**
 * Format eigenvalue dengan presisi tinggi
 * Eigenvalues perlu ditampilkan dengan detail karena penting untuk keputusan berapa faktor
 */
export const fmtEigenvalue = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return ".";
  if (val < 0) return (val).toFixed(4); // Bisa negative untuk component lanjutan
  return val.toFixed(4);
};

/**
 * Parse formatted SPSS string value back to numeric value
 * Used to extract numeric values from already-formatted WASM output
 * Examples: ".458" -> 0.458, "<.001" -> 0.0001, "67.675" -> 67.675
 */
export const parseFormattedValue = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null) return 1; // Default fallback
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 1;

  // Handle special cases
  if (value === "<.001" || value === "< .001") return 0.0001; // Treat as very small
  if (value === "1.000") return 1.0;

  // Remove leading dot and parse
  const cleanValue = value.replace(/^\./g, "0.").trim();
  const parsed = parseFloat(cleanValue);

  return isNaN(parsed) ? 1 : parsed;
};

/**
 * Format factor loading dengan presisi yang sesuai
 * Loadings biasanya -1 hingga 1, perlu precision 3 digit
 */
export const fmtLoading = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return ".";
  // Highlight loadings yang mendekati ±0.3 atau lebih (threshold praktis)
  return val.toFixed(3);
};

// ============================================================================
// FACTOR ANALYSIS DESCRIPTION GENERATORS (SPSS Style - English)
// ============================================================================




/**
 * Menghasilkan deskripsi untuk KMO and Bartlett's Test
 * 
 * Interpretasi KMO:
 * - 0.90+  : Marvelous
 * - 0.80+  : Meritorious
 * - 0.70+  : Middling
 * - 0.60+  : Mediocre
 * - 0.50+  : Miserable
 * - < 0.50 : Unacceptable
 * 
 * Bartlett's Test harus signifikan (p < 0.05) untuk matrix bukan identity
 */
export const generateKMODescription = (
  kmoValue: number | string,
  bartlettSig: number | string,
  bartlettChiSquare?: number | string,
  bartlettDf?: number
): string => {
  // Parse values from either number or formatted string
  const kmoNumeric = typeof kmoValue === "string" ? parseFormattedValue(kmoValue) : kmoValue;
  const bartlettSigNumeric = parseFormattedValue(bartlettSig);
  const bartlettChiSquareNumeric = typeof bartlettChiSquare === "string" ? parseFormattedValue(bartlettChiSquare) : bartlettChiSquare;

  const isKMOAdequate = kmoNumeric >= 0.5;
  const isBartlettSig = bartlettSigNumeric < 0.05;
  const pVal = bartlettSigNumeric < 0.001 ? "< .001" : `= ${bartlettSigNumeric.toFixed(3)}`;

  // KMO interpretation label
  let kmoLabel = "unacceptable";
  if (kmoNumeric >= 0.9) kmoLabel = "marvelous";
  else if (kmoNumeric >= 0.8) kmoLabel = "meritorious";
  else if (kmoNumeric >= 0.7) kmoLabel = "middling";
  else if (kmoNumeric >= 0.6) kmoLabel = "mediocre";
  else if (kmoNumeric >= 0.5) kmoLabel = "miserable";

  let interpretation = "";
  if (isKMOAdequate && isBartlettSig) {
    interpretation = "The data is suitable for factor analysis.";
  } else if (!isKMOAdequate) {
    interpretation = "The Kaiser-Meyer-Olkin measure is less than 0.5, suggesting the data may not be suitable for factor analysis.";
  } else if (!isBartlettSig) {
    interpretation = "Bartlett's test of sphericity is not significant, indicating the correlation matrix does not differ significantly from an identity matrix.";
  }

  const chiSquareInfo = bartlettChiSquareNumeric !== undefined && bartlettDf !== undefined
    ? `, χ²(${bartlettDf}) = ${(bartlettChiSquareNumeric as number).toFixed(3)},`
    : ",";

  return `The Kaiser-Meyer-Olkin measure of sampling adequacy was ${kmoNumeric.toFixed(3)} (${kmoLabel})${chiSquareInfo} and Bartlett's test of sphericity was significant (p ${pVal}). ${interpretation}`;
};

/**
 * Menghasilkan deskripsi untuk Communalities
 * 
 * Communalities menunjukkan proporsi variance dari setiap variabel
 * yang dijelaskan oleh faktor yang diextract.
 * 
 * Nilai rendah (< 0.5) mengindikasikan variabel tidak fit dengan good solution
 */
export const generateCommunalitiesDescription = (
  communalities: { name: string; value: number }[],
  extractionMethod?: string
): string => {
  if (!communalities || communalities.length === 0) {
    return "Extraction communalities represent the proportion of variance in each variable accounted for by the extracted components.";
  }

  // Cari communalities terendah
  const lowestCommunality = communalities.reduce((min, curr) => 
    curr.value < min.value ? curr : min
  );

  const pct = (lowestCommunality.value * 100).toFixed(1);
  
  // Cari berapa banyak variabel yang < 0.5
  const poorFitCount = communalities.filter(c => c.value < 0.5).length;
  
  let advice = "";
  if (poorFitCount === 0) {
    advice = "All variables are well represented by the extracted factors (all communalities > 0.50).";
  } else if (poorFitCount === 1) {
    advice = `One variable (${lowestCommunality.name}) has low communality (${pct}%), suggesting it does not fit well with the factor solution.`;
  } else {
    advice = `${poorFitCount} variables have communalities less than 0.50, indicating they are not well represented by the extracted factors.`;
  }

  return `Extraction communalities represent the amount of variance in each variable that is accounted for by the extracted components. The lowest communality is ${pct}% for '${lowestCommunality.name}'. ${advice}`;
};

/**
 * Menghasilkan deskripsi untuk Total Variance Explained
 * 
 * Menjelaskan berapa component diextract dan berapa % variance yang dijelaskan
 * Rekomendasi umum: 60-80% untuk sustainable solution
 */
export const generateTotalVarianceDescription = (
  numComponents: number,
  cumulativeVariancePct: number,
  extractionMethod?: string
): string => {
  const normalizedVariancePct = cumulativeVariancePct <= 1 ? cumulativeVariancePct * 100 : cumulativeVariancePct;
  const componentText = numComponents === 1 ? "1 component" : `${numComponents} components`;
  
  let qualityAssessment = "";
  if (normalizedVariancePct >= 80) {
    qualityAssessment = "This represents a high-quality factor solution.";
  } else if (normalizedVariancePct >= 60) {
    qualityAssessment = "This represents an acceptable factor solution.";
  } else if (normalizedVariancePct >= 50) {
    qualityAssessment = "While explaining more than 50% of variance is often regarded as reasonable, this solution may benefit from retaining additional components.";
  } else {
    qualityAssessment = "This solution explains only a modest amount of variance; consider retaining additional components.";
  }

  const methodNote = extractionMethod 
    ? ` using ${extractionMethod}`
    : "";

  return `The factor extraction process${methodNote} resulted in ${componentText}, cumulatively explaining ${normalizedVariancePct.toFixed(1)}% of the total variance in the data. ${qualityAssessment}`;
};

/**
 * Menghasilkan deskripsi untuk Component Matrix (Unrotated)
 * 
 * Penjelasan singkat tentang apa yang ditampilkan di unrotated matrix
 */
export const generateComponentMatrixDescription = (
  numComponents: number,
  numVariables?: number
): string => {
  const componentPlural = numComponents === 1 ? "component" : "components";
  const variableInfo = numVariables ? ` with ${numVariables} variables` : "";
  
  return `The component matrix displays the loadings of each variable on the extracted ${componentPlural}${variableInfo}. These are the unrotated factor loadings, representing the correlation between each variable and the extracted factors.`;
};

/**
 * Menghasilkan deskripsi untuk kasus ekstraksi yang terhenti sebelum konvergen
 */
export const generateExtractionTerminationDescription = (
  extractedFactors?: number,
  terminationReason?: string
): string => {
  const factorText = extractedFactors && extractedFactors > 0
    ? ` ${extractedFactors} factor${extractedFactors === 1 ? "" : "s"} were retained before termination,`
    : " no factors were retained,";

  const reasonText = terminationReason && terminationReason.trim()
    ? ` ${terminationReason.trim()}`
    : " extraction terminated before a stable factor solution was obtained.";

  return `The extraction process did not converge.${factorText}${reasonText} Later-stage tables are suppressed.`;
};

/**
 * Menghasilkan deskripsi untuk Goodness-of-fit Test
 */
export const generateGoodnessOfFitDescription = (
  chiSquare: number | string,
  df: number,
  significance: number | string,
  methodName?: string,
  extractedFactors?: number
): string => {
  const chiSquareValue = typeof chiSquare === "string" ? parseFormattedValue(chiSquare) : chiSquare;
  const significanceValue = typeof significance === "string" ? parseFormattedValue(significance) : significance;
  const pValueText = significanceValue < 0.001
    ? "< .001"
    : `= ${significanceValue.toFixed(3)}`;
  const methodText = methodName ? ` for the ${methodName} solution` : "";
  const factorText = extractedFactors && extractedFactors > 0
    ? ` using ${extractedFactors} extracted factor${extractedFactors === 1 ? "" : "s"}`
    : "";

  return `The goodness-of-fit test${methodText}${factorText} indicates whether the reproduced correlations adequately match the observed matrix. Chi-Square = ${chiSquareValue.toFixed(3)}, df = ${df}, Sig. ${pValueText}.`;
};

/**
 * Menghasilkan deskripsi untuk Rotated Component Matrix
 * 
 * Penjelasan tentang rotation method dan keuntaatannya
 */
export const generateRotatedMatrixDescription = (
  rotationMethod: string = "Varimax",
  numComponents?: number
): string => {
  let methodDescription = "";
  
  // Deskripsi spesifik per rotation method
  switch (rotationMethod.toLowerCase()) {
    case "varimax":
      methodDescription = "Varimax rotation aims to maximize the variance of the loadings within each component, simplifying interpretation by making loadings as close to 0 or ±1 as possible.";
      break;
    case "promax":
      methodDescription = "Promax is an oblique rotation that allows factors to correlate, potentially providing a more realistic solution when underlying factors are expected to be correlated.";
      break;
    case "quartimax":
      methodDescription = "Quartimax rotation aims to simplify the rows of the loading matrix, making each variable load highly on one factor if possible.";
      break;
    case "equimax":
      methodDescription = "Equimax combines goals of Varimax and Quartimax, attempting to simplify both rows and columns of the loading matrix.";
      break;
    case "oblimin":
      methodDescription = "Oblimin is an oblique rotation that allows factors to be correlated, with Delta parameter controlling the correlation relationship.";
      break;
    default:
      methodDescription = `${rotationMethod} rotation has been applied to the factor solution.`;
  }

  return `The rotated component matrix clarifies the factor structure through a ${rotationMethod} rotation. ${methodDescription} Loadings closer to ±1 indicate stronger relationships between variables and factors.`;
};

/**
 * Menghasilkan deskripsi untuk Scree Plot Interpretation
 * 
 * Scree test menggunakan "elbow method" untuk menentukan berapa faktor diextract
 */
export const generateScreePlotDescription = (
  numComponentsRetained: number,
  numComponentsTotal: number,
  explainedVarianceAt?: number
): string => {
  const varianceNote = explainedVarianceAt !== undefined
    ? ` explaining approximately ${explainedVarianceAt.toFixed(1)}% of total variance`
    : "";

  return `The scree plot displays eigenvalues in descending order. An "elbow" or point of inflection suggests the number of factors to retain. Based on visual inspection, ${numComponentsRetained} component(s) were retained from the ${numComponentsTotal} possible${varianceNote}.`;
};

/**
 * Menghasilkan deskripsi untuk Factor Scores Information
 * 
 * Penjelasan tentang factor scores dan metode saving
 */
export const generateFactorScoresDescription = (
  method: string = "Regression",
  numComponents?: number
): string => {
  let methodDescription = "";
  
  switch (method.toLowerCase()) {
    case "regression":
      methodDescription = "Factor scores were computed using regression method, which produces scores with mean 0 and variance equal to R².";
      break;
    case "bartlett":
      methodDescription = "Factor scores were computed using Bartlett's method, a maximum likelihood estimation approach that minimizes correlations with other factors.";
      break;
    case "anderson":
      methodDescription = "Factor scores were computed using Anderson-Rubin method, which produces uncorrelated scores with mean 0 and unit variance.";
      break;
    default:
      methodDescription = `Factor scores were computed using the ${method} method.`;
  }

  const componentNote = numComponents 
    ? ` for each of the ${numComponents} component(s)`
    : "";

  return `${methodDescription} These scores allow subsequent analysis or classification based on the factor structure${componentNote}.`;
};

/**
 * Menghasilkan deskripsi umum untuk interpretation section
 * Membantu user memahami apa saja yang harus diinterpretasikan
 */
export const generateFactorAnalysisOverviewDescription = (
  extractionMethod?: string,
  rotationMethod?: string
): string => {
  const methodInfo = extractionMethod 
    ? `using ${extractionMethod} for extraction`
    : "";
  
  const rotationInfo = rotationMethod && rotationMethod.toLowerCase() !== "none"
    ? ` and ${rotationMethod} for rotation`
    : "";

  return `Factor analysis was conducted ${methodInfo}${rotationInfo}. The results include tests of data adequacy, communalities, variance explained, and component loadings. Review the Scree plot and variance explained to assess solution quality.`;
};

/**
 * Menghasilkan deskripsi untuk Anti-Image Correlation Matrix (MSA per variable)
 */
export const generateAntiImageDescription = (): string => {
  return `The anti-image correlation matrix displays the Measure of Sampling Adequacy (MSA) for each variable on the diagonal. Variables with low MSA values (< 0.5) may be problematic and should be considered for removal. Off-diagonal values represent the partial correlations among variables.`;
};

/**
 * Menghasilkan deskripsi untuk Reproduced Correlation Matrix
 */
export const generateReproducedCorrelationDescription = (
  numComponents?: number
): string => {
  const componentInfo = numComponents 
    ? ` using the ${numComponents} extracted component(s)`
    : "";

  return `The reproduced correlation matrix shows the correlations among variables as predicted by the factor model${componentInfo}. Residuals (observed minus reproduced correlations) indicate goodness of fit; small residuals suggest an adequate model.`;
};

/**
 * Menghasilkan deskripsi untuk Descriptive Statistics
 * Memberikan konteks jumlah variabel dan sampel (N).
 */
export const generateDescriptiveDescription = (
  numVariables?: number,
  n?: number
): string => {
  const varInfo = numVariables ? ` for the ${numVariables} variables` : "";
  const nInfo = n ? ` based on a valid sample size of N = ${n}` : "";
  
  return `The descriptive statistics table displays the mean, standard deviation, and analysis N${varInfo}${nInfo}. This helps verify data integrity and identify variables with unusually high or low variances before proceeding with factor extraction.`;
};

/**
 * Format notasi ilmiah dengan gaya SPSS
 * Mengganti decimal point dengan comma dan memastikan exponent 3-digit
 * Contoh: 4.53e-6 → 4,53E-006
 * Export: Dapat digunakan di berbagai tempat untuk formatting determinant dll
 */
export const formatScientificNotationSPSSStyle = (num: number): string => {
  if (num === 0 || !isFinite(num)) return "0";
  
  // Hitung exponent
  const exponent = Math.floor(Math.log10(Math.abs(num)));
  const mantissa = num / Math.pow(10, exponent);
  
  // Format mantissa dengan 2 digit desimal (untuk presisi seperti SPSS)
  const mantissaStr = mantissa.toFixed(2).replace(".", ",");
  
  // Format exponent dengan 3-digit (±XXX) - jangan lupakan minus sign untuk negative exponent
  const expSign = exponent >= 0 ? "+" : "-";
  const expStr = String(Math.abs(exponent)).padStart(3, "0");
  
  return `${mantissaStr}E${expSign}${expStr}`;
};

/**
 * Menghasilkan deskripsi untuk Correlation Matrix
 * Determinant hanya ditampilkan jika checkbox "Determinant" dicentang di tab Descriptives.
 */
export const generateCorrelationMatrixDescription = (
  determinant?: number
): string => {
  let fullDescription = "";
  
  // Tampilkan determinant info jika nilai tersedia
  if (determinant !== undefined) {
    console.log("[DESC] Correlation Matrix Determinant:", determinant);
    // Format scientific notation jika angkanya sangat kecil dengan gaya SPSS
    const detStr = determinant < 0.001 
      ? formatScientificNotationSPSSStyle(determinant)
      : determinant.toFixed(5);
    
    fullDescription = `The determinant of the correlation matrix is ${detStr}. The correlation matrix shows the bivariate relationships between all variables.`;
  } else {
    console.log("[DESC] No determinant provided for correlation matrix");
    // Tanpa determinant - hanya base description
    fullDescription = "The correlation matrix shows the bivariate relationships between all variables.";
  }

  return fullDescription;
};

/**
 * Menghasilkan deskripsi untuk Covariance Matrix
 * Determinant hanya ditampilkan jika checkbox "Determinant" dicentang di tab Descriptives.
 */
export const generateCovarianceMatrixDescription = (
  determinant?: number
): string => {
  let fullDescription = "";
  
  // Tampilkan determinant info jika nilai tersedia
  if (determinant !== undefined) {
    console.log("[DESC] Covariance Matrix Determinant:", determinant);
    // Format scientific notation jika angkanya sangat kecil dengan gaya SPSS
    const detStr = determinant < 0.001 
      ? formatScientificNotationSPSSStyle(determinant)
      : determinant.toFixed(5);
    
    fullDescription = `The determinant of the covariance matrix is ${detStr}. The diagonal elements represent the variance of each individual variable, while the off-diagonal elements show the covariance between pairs.`;
  } else {
    console.log("[DESC] No determinant provided for covariance matrix");
    // Tanpa determinant - hanya base description
    fullDescription = "The diagonal elements represent the variance of each individual variable, while the off-diagonal elements show the covariance between pairs.";
  }

  return fullDescription;
};

/**
 * Menghasilkan deskripsi untuk Inverse of Correlation Matrix
 * Fokus pada nilai diagonal yang bertindak sebagai pengukur multikolinearitas.
 */
export const generateInverseCorrelationDescription = (): string => {
  return "The inverse of the correlation matrix is another diagnostic tool for multicollinearity. The diagonal elements represent the Variance Inflation Factors (VIF) for each variable. High diagonal values suggest that a variable is highly correlated with others in the dataset.";
};

/**
 * Menghasilkan deskripsi yang lebih tajam untuk Anti-image Matrices
 * Fokus pada MSA values untuk individual variable adequacy
 */
export const generateAntiImageRefinedDescription = (): string => {
  return "The anti-image matrices contain the negative partial covariances and correlations. Focus on the diagonal of the Anti-image Correlation matrix (often marked with an 'a'), which represents the Measure of Sampling Adequacy (MSA) for individual variables. Variables with an MSA below 0.50 should generally be excluded from the analysis.";
};

/**
 * Menghasilkan deskripsi yang lebih tajam untuk Reproduced Correlations
 * Fokus pada residual count dan goodness of fit assessment
 */
export const generateReproducedRefinedDescription = (
  residualCount?: number,
  residualPct?: number
): string => {
  let residualInfo = "";
  
  if (residualCount !== undefined && residualPct !== undefined) {
    const isGoodFit = residualPct < 50;
    residualInfo = ` There are ${residualCount} (${residualPct.toFixed(0)}%) nonredundant residuals with absolute values greater than 0.05. ${
      isGoodFit 
        ? "Since this is less than 50%, the model is considered a good fit." 
        : "Since this is greater than 50%, the model may not be a good fit and additional factors might be needed."
    }`;
  }

  return `The reproduced matrix contains the correlation matrix based on the extracted factors. The lower part of the table shows the residuals, which are the differences between the observed and reproduced correlations.${residualInfo}`;
};

/**
 * Menghasilkan deskripsi untuk Component Transformation Matrix
 * Penjelasan tentang rotasi yang diterapkan
 */
export const generateComponentTransformationDescription = (
  rotationMethod: string = "Varimax"
): string => {
  return `The component transformation matrix displays the specific mathematical rotation applied to the unrotated component matrix to achieve the final ${rotationMethod} solution. A symmetrical matrix typically indicates an orthogonal rotation, showing the correlations between the unrotated and rotated factors.`;
};

// ============================================================================
// UTILITY HELPER FUNCTIONS
// ============================================================================

/**
 * Helper untuk membuat abbreviation dari extraction method
 */
export const getExtractionMethodAbbr = (method: string): string => {
  const abbrs: Record<string, string> = {
    "Principal Component Analysis": "PCA",
    "PrincipalComp": "PCA",
    "Principal Axis Factoring": "PAF",
    "PrincipalAxisFactoring": "PAF",
    "Maximum Likelihood": "ML",
    "MaxLikelihood": "ML",
    "Generalized Least Squares": "GLS",
    "GeneralizedLeastSqr": "GLS",
    "Unweighted Least Squares": "ULS",
    "UnweightLeastSqr": "ULS",
    "Alpha Factoring": "Alpha",
    "AlphaFactoring": "Alpha",
    "Image Factoring": "Image",
    "ImageFactoring": "Image",
  };
  
  return abbrs[method] || method;
};

/**
 * Helper untuk membuat interpretasi KMO value (verbose label)
 */
export const interpretKMOValue = (kmo: number): string => {
  if (kmo >= 0.9) return "Marvelous";
  if (kmo >= 0.8) return "Meritorious";
  if (kmo >= 0.7) return "Middling";
  if (kmo >= 0.6) return "Mediocre";
  if (kmo >= 0.5) return "Miserable";
  return "Unacceptable";
};

/**
 * Helper untuk interpretasi communality rendah vs tinggi
 */
export const interpretCommunality = (comm: number): string => {
  if (comm >= 0.9) return "Excellent fit";
  if (comm >= 0.7) return "Good fit";
  if (comm >= 0.5) return "Acceptable fit";
  if (comm >= 0.3) return "Questionable fit";
  return "Poor fit";
};

/**
 * Helper untuk interpretasi loading strength
 */
export const interpretLoadingStrength = (loading: number): string => {
  const absLoading = Math.abs(loading);
  if (absLoading >= 0.9) return "Very strong";
  if (absLoading >= 0.7) return "Strong";
  if (absLoading >= 0.5) return "Moderate";
  if (absLoading >= 0.3) return "Weak";
  return "Very weak";
};
