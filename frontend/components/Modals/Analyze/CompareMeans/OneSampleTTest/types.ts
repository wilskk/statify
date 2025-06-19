import type { Variable, VariableData } from '@/types/Variable';
import type { Dispatch, SetStateAction } from 'react';
import { BaseModalProps } from '@/types/modalTypes';

// ---------------------------------
// Variable Selection Types
// ---------------------------------
export interface HighlightedVariable {
  tempId: string;
  source: 'available' | 'selected';
}

// ---------------------------------
// Variables Tab Types
// ---------------------------------
export interface VariablesTabProps {
  availableVariables: Variable[];
  selectedVariables: Variable[];
  highlightedVariable: HighlightedVariable | null;
  setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
  moveToSelectedVariables: (variable: Variable, targetIndex?: number) => void;
  moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
  reorderVariables: (source: 'available' | 'selected', variables: Variable[]) => void;
  testValue: number;
  setTestValue: Dispatch<SetStateAction<number>>;
  estimateEffectSize: boolean;
  setEstimateEffectSize: Dispatch<SetStateAction<boolean>>;
}

// ---------------------------------
// Variable Selection Types
// ---------------------------------
export interface VariableSelectionProps {
  initialVariables?: Variable[];
}

// ---------------------------------
// Variable Selection Result Types
// ---------------------------------
export interface VariableSelectionResult {
  availableVariables: Variable[];
  selectedVariables: Variable[];
  highlightedVariable: HighlightedVariable | null;
  setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
  moveToSelectedVariables: (variable: Variable, targetIndex?: number) => void;
  moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
  reorderVariables: (source: 'available' | 'selected', variables: Variable[]) => void;
  resetVariableSelection: () => void;
}

// ---------------------------------
// Test Settings Types
// ---------------------------------
export interface TestSettingsProps {
  initialTestValue?: number;
  initialEstimateEffectSize?: boolean;
}

// ---------------------------------
// Test Settings Result Types
// ---------------------------------
export interface TestSettingsResult {
  testValue: number;
  setTestValue: Dispatch<SetStateAction<number>>;
  estimateEffectSize: boolean;
  setEstimateEffectSize: Dispatch<SetStateAction<boolean>>;
  resetTestSettings: () => void;
  updateTestSettings: (key: keyof TestSettingsOptions, value: boolean) => void;
}

// ---------------------------------
// Test Settings Options Types
// ---------------------------------
export interface TestSettingsOptions {
  testValue: number;
  estimateEffectSize: boolean;
}

// ---------------------------------
// Data Fetching Types
// ---------------------------------
export interface FetchedData {
  variableData: VariableData[] | null;
}

// ---------------------------------
// Data Fetching Result Types
// ---------------------------------
export interface DataFetchingResult {
  isLoading: boolean;
  error: string | null;
  fetchData: (variables: Variable[]) => Promise<FetchedData>;
  clearError: () => void;
}

// ---------------------------------
// One Sample T Test Worker Result Types
// ---------------------------------
export interface OneSampleTTestWorkerResult {
  success: boolean;
  statistics?: OneSampleTTestStatistics;
  test?: OneSampleTTestResults;
  error?: string;
}

export interface OneSampleTTestStatistics {
  title: string;
  output_data: any;
  components: string;
  description: string;
}

export interface OneSampleTTestResults {
  title: string;
  output_data: any;
  components: string;
  description: string;
}

export interface WorkerInput {
  variableData: VariableData[];
  testValue: number;
  estimateEffectSize: boolean;
}

export interface WorkerCalculationPromise {
  resolve: (value: OneSampleTTestWorkerResult | null) => void;
  reject: (reason: any) => void;
}

export interface OneSampleTTestWorkerHookResult {
  isCalculating: boolean;
  error: string | null;
  calculate: (input: WorkerInput) => Promise<OneSampleTTestWorkerResult | null>;
  cancelCalculation: () => void;
}

export interface OneSampleTTestAnalysisProps extends Pick<BaseModalProps, 'onClose' | 'containerType'> {
  selectedVariables: Variable[];
  testValue: number;
  estimateEffectSize: boolean;
}

export interface OneSampleTTestAnalysisResult {
  isLoading: boolean;
  errorMsg: string | null;
  runAnalysis: () => Promise<void>;
  cancelAnalysis: () => void;
} 