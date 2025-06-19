import type { Variable, VariableData } from '@/types/Variable';
import type { Dispatch, SetStateAction } from 'react';
import { BaseModalProps } from '@/types/modalTypes';

// ---------------------------------
// Test Settings Types
// ---------------------------------
export interface RunsTestOptions {
  cutPoint: {
    median: boolean;
    mode: boolean;
    mean: boolean;
    custom: boolean;
  };
  customValue: number;
  displayStatistics: {
    descriptive: boolean;
    quartiles: boolean;
  };
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
export interface RunsWorkerResult {
  success: boolean;
  descriptives?: RunsStatistics;
  runsMedian?: RunsResults;
  runsMean?: RunsResults;
  runsMode?: RunsResults;
  runsCustom?: RunsResults;
  cutPoint?: {
    median: boolean;
    mode: boolean;
    mean: boolean;
    custom: boolean;
  };
  displayStatistics?: {
    descriptive: boolean;
    quartiles: boolean;
  };
  error?: string;
}

export interface RunsStatistics {
  title: string;
  output_data: any;
  components: string;
  description: string;
}

export interface RunsResults {
  title: string;
  output_data: any;
  components: string;
  description: string;
}

export interface WorkerInput {
  variableData: VariableData[];
  cutPoint: {
    median: boolean;
    mode: boolean;
    mean: boolean;
    custom: boolean;
  };
  customValue: number;
  displayStatistics: {
    descriptive: boolean;
    quartiles: boolean;
  };
}

export interface WorkerCalculationPromise {
  resolve: (value: RunsWorkerResult | null) => void;
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
  initialCutPoint?: {
    median: boolean;
    mode: boolean;
    mean: boolean;
    custom: boolean;
  };
  initialCustomValue?: number;
  initialDisplayStatistics?: {
    descriptive: boolean;
    quartiles: boolean;
  };
}

export interface TestSettingsResult {
  cutPoint: {
    median: boolean;
    mode: boolean;
    mean: boolean;
    custom: boolean;
  };
  setCutPoint: Dispatch<SetStateAction<{
    median: boolean;
    mode: boolean;
    mean: boolean;
    custom: boolean;
  }>>;
  customValue: number;
  setCustomValue: Dispatch<SetStateAction<number>>;
  displayStatistics: {
    descriptive: boolean;
    quartiles: boolean;
  };
  setDisplayStatistics: Dispatch<SetStateAction<{
    descriptive: boolean;
    quartiles: boolean;
  }>>;
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

export interface RunsWorkerProps {
  workerUrl?: string;
  timeoutDuration?: number;
}

export interface RunsWorkerHookResult {
  isCalculating: boolean;
  error: string | undefined;
  calculate: (input: WorkerInput) => Promise<RunsWorkerResult | null>;
  cancelCalculation: () => void;
}

export interface RunsAnalysisProps extends Pick<BaseModalProps, 'onClose' | 'containerType'> {
  selectedVariables: Variable[];
  cutPoint: {
    median: boolean;
    mode: boolean;
    mean: boolean;
    custom: boolean;
  };
  customValue: number;
  displayStatistics: {
    descriptive: boolean;
    quartiles: boolean;
  };
}

export interface RunsAnalysisResult {
  isLoading: boolean;
  errorMsg: string | null;
  runAnalysis: () => Promise<void>;
  cancelAnalysis: () => void;
} 