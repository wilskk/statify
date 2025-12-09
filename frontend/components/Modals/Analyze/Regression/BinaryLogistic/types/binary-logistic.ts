// frontend/components/Modals/Analyze/Regression/BinaryLogistic/types/binary-logistic.ts

import { Variable } from "@/types/Variable";

// =========================================================================
// 1. CONFIGURATION TYPES (Input dari UI)
// =========================================================================

export interface BinaryLogisticSaveParams {
  predictedProbabilities: boolean;
  predictedGroup: boolean;
  residualsUnstandardized: boolean;
  residualsLogit: boolean;
  residualsStudentized: boolean;
  residualsStandardized: boolean;
  residualsDeviance: boolean;
  influenceCooks: boolean;
  influenceLeverage: boolean;
  influenceDfBeta: boolean;
}

export interface BinaryLogisticOptionsParams {
  classificationPlots: boolean;
  hosmerLemeshow: boolean;
  casewiseListing: boolean;
  casewiseType: "outliers" | "all";
  casewiseOutliers: number;
  correlations: boolean;
  iterationHistory: boolean;
  ciForExpB: boolean;
  ciLevel: number;
  displayAtEachStep: boolean;
  probEntry: number;
  probRemoval: number;
  classificationCutoff: number;
  maxIterations: number;
  includeConstant: boolean;
}

export interface BinaryLogisticCategoricalParams {
  covariates: string[];
  contrast:
    | "Indicator"
    | "Simple"
    | "Difference"
    | "Helmert"
    | "Repeated"
    | "Polynomial"
    | "Deviation";
  referenceCategory: "Last" | "First";
}

// Main Options
export interface BinaryLogisticOptions {
  dependent: Variable | null;
  covariates: Variable[];
  factors: Variable[];
  method:
    | "Enter"
    | "Forward: Conditional"
    | "Forward: LR"
    | "Forward: Wald"
    | "Backward: Conditional"
    | "Backward: LR"
    | "Backward: Wald";
}

export const DEFAULT_BINARY_LOGISTIC_OPTIONS: BinaryLogisticOptions = {
  dependent: null,
  covariates: [],
  factors: [],
  method: "Enter",
};

// =========================================================================
// 2. RESULT TYPES (Output dari Worker/Rust)
// =========================================================================

// Representasi satu baris variabel di tabel "Variables in Equation"
export interface VariableRow {
  label: string;
  b: number;
  error: number; // Rust mengirim field ini dengan nama 'error' (Standard Error)
  wald: number;
  df: number;
  sig: number;
  exp_b: number;
  lower_ci: number;
  upper_ci: number;
}

// Representasi satu baris di tabel "Variables NOT in Equation"
export interface VariableNotInEquation {
  label: string;
  score: number;
  df: number;
  sig: number;
}

// Struktur utama hasil analisis yang dikirim dari Worker
export interface LogisticResult {
  model_summary: {
    log_likelihood: number;
    cox_snell_r_square: number;
    nagelkerke_r_square: number;
    converged?: boolean;
    iterations?: number;
  };
  classification_table: {
    observed_0_predicted_0: number;
    observed_0_predicted_1: number;
    percentage_correct_0: number;
    observed_1_predicted_0: number;
    observed_1_predicted_1: number;
    percentage_correct_1: number;
    overall_percentage: number;
  };
  // Block 1 Variables
  variables_in_equation: VariableRow[];
  // Block 0 Variables (Score Test)
  variables_not_in_equation: VariableNotInEquation[];
  // Block 0 Constant
  block_0_constant?: VariableRow;

  omni_tests: {
    chi_square: number;
    df: number;
    sig: number;
  };

  // Optional: info tambahan dari worker (misal encoding Y)
  model_info?: {
    y_encoding?: Record<string, number>;
    n_samples?: number;
  };
}

// =========================================================================
// 3. UI OUTPUT TYPE (Format Akhir untuk Ditampilkan)
// =========================================================================

export interface ColumnHeader {
  header: string;
  key?: string; // Optional karena parent header mungkin tidak punya key data langsung
  align?: "left" | "right" | "center";
  children?: ColumnHeader[]; // <--- INI SOLUSI ERROR 'children does not exist'
}

export interface BinaryLogisticOutput {
  tables: Array<{
    title: string;
    note?: string;
    columnHeaders: Array<ColumnHeader>; // Gunakan interface recursive di atas
    rows: Array<Record<string, any>>;
  }>;
}
