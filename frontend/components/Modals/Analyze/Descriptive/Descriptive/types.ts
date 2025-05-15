import type { Variable, VariableData } from '@/types/Variable';
import type { Dispatch, SetStateAction } from 'react';

// ---------------------------------
// Statistics Settings Types
// ---------------------------------
export interface DescriptiveStatisticsOptions {
  mean: boolean;
  stdDev: boolean;
  minimum: boolean;
  maximum: boolean;
  variance: boolean;
  range: boolean;
  sum: boolean;
  median: boolean;
  skewness: boolean;
  kurtosis: boolean;
  standardError: boolean;
}

export type DisplayOrderType = 'variableList' | 'alphabetic' | 'ascendingMeans' | 'descendingMeans';

// ---------------------------------
// Variable Selection Types
// ---------------------------------
export interface HighlightedVariableInfo {
  columnIndex: number;
  source: 'available' | 'selected';
}

// ---------------------------------
// Data Fetching Types
// ---------------------------------
export interface FetchedData {
  variableData: VariableData[] | null;
  weightVariableData: (string | number)[] | null;
}

// ---------------------------------
// Z-Score Data Types
// ---------------------------------
export interface ZScoreVariableInfo {
  name: string;
  label: string;
  type: "NUMERIC"; // Z-scores always numeric
  width: number;
  decimals: number;
  measure: "scale"; // Z-scores always scale measure
}

export interface ZScoreData {
  [variableName: string]: {
    scores: (number | string)[];
    variableInfo: ZScoreVariableInfo;
  };
}

// ---------------------------------
// Worker Types
// ---------------------------------
export interface DescriptiveWorkerResult {
  success: boolean;
  statistics?: DescriptiveStatistics;
  zScoreData?: ZScoreData | null;
  error?: string;
}

export interface DescriptiveStatistics {
  title: string;
  output_data: any; // Mengubah tipe ini agar lebih fleksibel untuk perubahan format
  components: string;
  description: string;
}

export interface DescriptiveStatisticsTable {
  title: string;
  columnHeaders: TableColumnHeader[];
  rows: TableRow[];
}

export interface TableColumnHeader {
  header: string;
  key?: string;
  children?: TableColumnHeader[];
}

export interface TableRow {
  rowHeader: string[];
  [key: string]: any;
}

export interface WorkerInput {
  variableData: VariableData[];
  weightVariableData: (string | number)[] | null;
  params: DescriptiveStatisticsOptions;
  saveStandardized: boolean;
}

export interface WorkerCalculationPromise {
  resolve: (value: DescriptiveWorkerResult | null) => void;
  reject: (reason: any) => void;
}

// ---------------------------------
// Hook Props and Results
// ---------------------------------
export interface VariableSelectionProps {
  initialVariables?: Variable[];
}

export interface VariableSelectionResult {
  availableVariables: Variable[];
  selectedVariables: Variable[];
  highlightedVariable: HighlightedVariableInfo | null;
  setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariableInfo | null>>;
  moveToSelectedVariables: (variable: Variable, targetIndex?: number) => void;
  moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
  reorderVariables: (source: 'available' | 'selected', variables: Variable[]) => void;
  resetVariableSelection: () => void;
}

export interface StatisticsSettingsProps {
  initialDisplayStatistics?: Partial<DescriptiveStatisticsOptions>;
  initialDisplayOrder?: DisplayOrderType;
  initialSaveStandardized?: boolean;
}

export interface StatisticsSettingsResult {
  displayStatistics: DescriptiveStatisticsOptions;
  setDisplayStatistics: Dispatch<SetStateAction<DescriptiveStatisticsOptions>>;
  updateStatistic: (key: keyof DescriptiveStatisticsOptions, value: boolean) => void;
  displayOrder: DisplayOrderType;
  setDisplayOrder: Dispatch<SetStateAction<DisplayOrderType>>;
  saveStandardized: boolean;
  setSaveStandardized: Dispatch<SetStateAction<boolean>>;
  resetStatisticsSettings: () => void;
}

export interface DataFetchingProps {
}

export interface DataFetchingResult {
  isLoading: boolean;
  error: string | null;
  fetchData: (variables: Variable[]) => Promise<FetchedData>;
  clearError: () => void;
}

export interface DescriptivesWorkerProps {
  workerUrl?: string;
  timeoutDuration?: number;
}

export interface DescriptivesWorkerResult {
  isCalculating: boolean;
  error: string | null;
  calculate: (input: WorkerInput) => Promise<DescriptiveWorkerResult | null>;
  cancelCalculation: () => void;
}

export interface DescriptivesAnalysisProps {
  selectedVariables: Variable[];
  displayStatistics: DescriptiveStatisticsOptions;
  saveStandardized: boolean;
  displayOrder?: DisplayOrderType;
  onClose: () => void;
}

export interface DescriptivesAnalysisResult {
  isLoading: boolean;
  errorMsg: string | null;
  runAnalysis: () => Promise<void>;
  cancelAnalysis: () => void;
} 