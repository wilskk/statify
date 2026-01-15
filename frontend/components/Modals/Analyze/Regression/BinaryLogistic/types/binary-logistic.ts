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

export const DEFAULT_BINARY_LOGISTIC_SAVE_PARAMS: BinaryLogisticSaveParams = {
  predictedProbabilities: false,
  predictedGroup: false,
  residualsUnstandardized: false,
  residualsLogit: false,
  residualsStudentized: false,
  residualsStandardized: false,
  residualsDeviance: false,
  influenceCooks: false,
  influenceLeverage: false,
  influenceDfBeta: false,
};

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

export const DEFAULT_BINARY_LOGISTIC_OPTIONS_PARAMS: BinaryLogisticOptionsParams =
  {
    classificationPlots: false,
    hosmerLemeshow: false,
    casewiseListing: false,
    casewiseType: "outliers",
    casewiseOutliers: 2.0,
    correlations: false,
    iterationHistory: false,
    ciForExpB: false,
    ciLevel: 95,
    displayAtEachStep: false,
    probEntry: 0.05,
    probRemoval: 0.1,
    classificationCutoff: 0.5,
    maxIterations: 20,
    includeConstant: true,
  };

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

export const DEFAULT_BINARY_LOGISTIC_CATEGORICAL_PARAMS: BinaryLogisticCategoricalParams =
  {
    covariates: [],
    contrast: "Indicator",
    referenceCategory: "Last",
  };

export interface BinaryLogisticAssumptionParams {
  multicollinearity: boolean;
  boxTidwell: boolean;
}

export const DEFAULT_BINARY_LOGISTIC_ASSUMPTION_PARAMS: BinaryLogisticAssumptionParams =
  {
    multicollinearity: false,
    boxTidwell: false,
  };

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

  // Sub-configuration objects
  optionParams: BinaryLogisticOptionsParams;
  categoricalParams: BinaryLogisticCategoricalParams;
  saveParams: BinaryLogisticSaveParams;
  assumptionParams: BinaryLogisticAssumptionParams;
}

export const DEFAULT_BINARY_LOGISTIC_OPTIONS: BinaryLogisticOptions = {
  dependent: null,
  covariates: [],
  factors: [],
  method: "Enter",
  optionParams: DEFAULT_BINARY_LOGISTIC_OPTIONS_PARAMS,
  categoricalParams: DEFAULT_BINARY_LOGISTIC_CATEGORICAL_PARAMS,
  saveParams: DEFAULT_BINARY_LOGISTIC_SAVE_PARAMS,
  assumptionParams: DEFAULT_BINARY_LOGISTIC_ASSUMPTION_PARAMS,
};

// =========================================================================
// 2. RESULT TYPES (Output dari Worker/Rust)
// =========================================================================

// Interface reusable untuk Summary dan Classification Table
export interface ModelSummary {
  log_likelihood: number;
  cox_snell_r_square: number;
  nagelkerke_r_square: number;
  converged?: boolean;
  iterations?: number;
}

export interface ClassificationTable {
  observed_0_predicted_0: number;
  observed_0_predicted_1: number;
  percentage_correct_0: number;
  observed_1_predicted_0: number;
  observed_1_predicted_1: number;
  percentage_correct_1: number;
  overall_percentage: number;
}

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

export interface VifRow {
  variable: string;
  tolerance: number;
  vif: number;
}

export interface BoxTidwellRow {
  variable: string;
  interaction_term: string;
  b: number;
  sig: number;
  is_significant: boolean;
}

export interface AssumptionResult {
  vif?: VifRow[];
  box_tidwell?: BoxTidwellRow[];
  correlation_matrix?: number[][];
  feature_names?: string[];
}

// Representasi satu baris di tabel "Variables NOT in Equation"
export interface VariableNotInEquation {
  label: string;
  score: number;
  df: number;
  sig: number;
}

// Representasi untuk Overall Statistics (Remainder Test)
export interface RemainderTest {
  chi_square: number;
  df: number;
  sig: number;
}

// Representasi Step History (Ringkasan per langkah)
export interface StepHistory {
  step: number;
  action: string;
  variable: string;
  score_statistic: number;
  improvement_chi_sq: number;
  model_log_likelihood: number;
  nagelkerke_r2: number;
  variables_in_equation?: VariableRow[];
  variables_not_in_equation?: VariableNotInEquation[];
}

export interface ModelIfTermRemovedRow {
  label: string;
  model_log_likelihood: number;
  change_in_neg2ll: number;
  df: number;
  sig_change: number;
}

export interface OmniTestsResult {
  chi_square: number;
  df: number;
  sig: number;
}

export interface FrequencyCount {
  category_label: string;
  frequency: number;
  parameter_codings: number[];
}

export interface CategoricalCoding {
  variable_label: string;
  categories: FrequencyCount[];
}

// --- BARU: Hosmer-Lemeshow Types ---
export interface HosmerLemeshowGroup {
  group: number;
  size: number;
  observed_1: number;
  expected_1: number;
  observed_0: number;
  expected_0: number;
  total_observed: number;
}

export interface HosmerLemeshowResult {
  chi_square: number;
  df: number;
  sig: number;
  contingency_table: HosmerLemeshowGroup[];
}

// Ini memetakan struct StepDetail dari Rust
export interface StepDetail {
  step: number;
  action: string; // "Start", "Entered", "Removed"
  variable_changed?: string;
  summary: ModelSummary;
  classification_table: ClassificationTable;
  variables_in_equation: VariableRow[];
  variables_not_in_equation: VariableNotInEquation[];
  remainder_test?: RemainderTest;
  omni_tests?: OmniTestsResult;
  step_omni_tests?: OmniTestsResult;
  model_if_term_removed?: ModelIfTermRemovedRow[];

  // --- BARU: Field Hosmer Lemeshow per step ---
  hosmer_lemeshow?: HosmerLemeshowResult;
}

// Struktur utama hasil analisis yang dikirim dari Worker
export interface LogisticResult {
  method_used?: string;

  // Field ini memetakan ModelSummary dari Rust
  model_summary: ModelSummary;

  // Field ini memetakan ClassificationTable dari Rust
  classification_table: ClassificationTable;

  // Block 1 Variables (Final)
  variables_in_equation: VariableRow[];

  // Block 0 Variables / Final Variables not in equation
  variables_not_in_equation: VariableNotInEquation[];

  // Block 0 Constant (Backward compatibility / shortcut)
  block_0_constant?: VariableRow;

  // Final Omnibus Tests
  omni_tests: {
    chi_square: number;
    df: number;
    sig: number;
  };

  // Final Overall Remainder Test (jika ada variabel sisa)
  overall_remainder_test?: RemainderTest;

  // Optional: info tambahan dari worker (misal encoding Y)
  model_info?: {
    y_encoding?: Record<string, number>;
    n_samples?: number;
    n_missing?: number;
    step_number?: number;
  };

  // History ringkas (untuk tabel Step History)
  step_history?: StepHistory[];

  // --- BARU: Detail lengkap setiap langkah (Block 0, Step 1, dst.) ---
  steps_detail?: StepDetail[];

  assumption_tests?: AssumptionResult;

  categorical_codings?: CategoricalCoding[];

  // --- BARU: Field Hosmer Lemeshow Final Model ---
  hosmer_lemeshow?: HosmerLemeshowResult;
}

// =========================================================================
// 3. UI OUTPUT TYPE (Format Akhir untuk Ditampilkan)
// =========================================================================

export interface ColumnHeader {
  header: string;
  key?: string; // Optional karena parent header mungkin tidak punya key data langsung
  align?: "left" | "right" | "center";
  children?: ColumnHeader[];
}

export interface TableResultContent {
  columnHeaders: ColumnHeader[];
  rows: any[];
  // Field opsional untuk styling spesifik tabel
  style?: "standard" | "compact";
}

// Ini adalah struktur wrapper baru untuk setiap "Kartu" output
export interface AnalysisSection {
  id: string; // ID Unik untuk key React
  title: string; // Judul Card (misal: "Model Summary")
  description?: string; // Deskripsi di bawah judul
  type: "table" | "text" | "chart"; // Future-proofing
  data: TableResultContent; // Data mentah tabel
  note?: string; // Footer note (misal: "a. Constant is included...")
}

export interface BinaryLogisticOutput {
  sections: AnalysisSection[];
}
