import type { Variable, VariableData } from '@/types/Variable';
import type { Dispatch, SetStateAction } from 'react';
import { BaseModalProps } from '@/types/modalTypes';

// ---------------------------------
// Test Settings Types
// ---------------------------------
export interface OneSampleTTestOptions {
  testValue: number;
  estimateEffectSize: boolean;
}

// ---------------------------------
// Variable Selection Types
// ---------------------------------
export interface HighlightedVariableInfo {
  tempId: string;
  source: 'available' | 'selected';
}

// ---------------------------------
// Data Fetching Types
// ---------------------------------
export interface FetchedData {
  variableData: VariableData[] | null;
}

// ---------------------------------
// Worker Types
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

export interface TestSettingsProps {
  initialTestValue?: number;
  initialEstimateEffectSize?: boolean;
}

export interface TestSettingsResult {
  testValue: number;
  setTestValue: Dispatch<SetStateAction<number>>;
  estimateEffectSize: boolean;
  setEstimateEffectSize: Dispatch<SetStateAction<boolean>>;
  resetTestSettings: () => void;
}

export interface DataFetchingProps {
}

export interface DataFetchingResult {
  isLoading: boolean;
  error: string | null;
  fetchData: (variables: Variable[]) => Promise<FetchedData>;
  clearError: () => void;
}

export interface OneSampleTTestWorkerProps {
  workerUrl?: string;
  timeoutDuration?: number;
}

export interface OneSampleTTestWorkerHookResult {
  isCalculating: boolean;
  error: string | undefined;
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