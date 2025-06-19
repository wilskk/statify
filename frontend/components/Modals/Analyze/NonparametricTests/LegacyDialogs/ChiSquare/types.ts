import type { Variable, VariableData } from '@/types/Variable';
import type { Dispatch, SetStateAction } from 'react';
import { BaseModalProps } from '@/types/modalTypes';

// ---------------------------------
// Test Settings Types
// ---------------------------------
export interface ChiSquareOptions {
  expectedRange: {
    getFromData: boolean;
    useSpecificRange: boolean;
  };
  rangeValue: {
    lowerValue: number | null;
    upperValue: number | null;
  };
  expectedValue: {
    allCategoriesEqual: boolean;
    values: boolean;
    inputValue: number | null;
  };
  expectedValueList: string[];
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
export interface ChiSquareWorkerResult {
  success: boolean;
  descriptives?: any;
  frequencies?: any[];
  chiSquare?: any;
  error?: string;
}

export interface WorkerInput {
  variableData: VariableData[];
  expectedRange: {
    getFromData: boolean;
    useSpecificRange: boolean;
  };
  rangeValue: {
    lowerValue: number | null;
    upperValue: number | null;
  };
  expectedValue: {
    allCategoriesEqual: boolean;
    values: boolean;
    inputValue: number | null;
  };
  expectedValueList: string[];
  displayStatistics: {
    descriptive: boolean;
    quartiles: boolean;
  };
}

export interface WorkerCalculationPromise {
  resolve: (value: ChiSquareWorkerResult | null) => void;
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
  initialExpectedRange?: {
    getFromData: boolean;
    useSpecificRange: boolean;
  };
  initialRangeValue?: {
    lowerValue: number | null;
    upperValue: number | null;
  };
  initialExpectedValue?: {
    allCategoriesEqual: boolean;
    values: boolean;
    inputValue: number | null;
  };
  initialExpectedValueList?: string[];
  initialDisplayStatistics?: {
    descriptive: boolean;
    quartiles: boolean;
  };
}

export interface TestSettingsResult {
  expectedRange: {
    getFromData: boolean;
    useSpecificRange: boolean;
  };
  setExpectedRange: Dispatch<SetStateAction<{
    getFromData: boolean;
    useSpecificRange: boolean;
  }>>;
  rangeValue: {
    lowerValue: number | null;
    upperValue: number | null;
  };
  setRangeValue: Dispatch<SetStateAction<{
    lowerValue: number | null;
    upperValue: number | null;
  }>>;
  expectedValue: {
    allCategoriesEqual: boolean;
    values: boolean;
    inputValue: number | null;
  };
  setExpectedValue: Dispatch<SetStateAction<{
    allCategoriesEqual: boolean;
    values: boolean;
    inputValue: number | null;
  }>>;
  expectedValueList: string[];
  setExpectedValueList: Dispatch<SetStateAction<string[]>>;
  highlightedExpectedValue: string | null;
  setHighlightedExpectedValue: Dispatch<SetStateAction<string | null>>;
  displayStatistics: {
    descriptive: boolean;
    quartiles: boolean;
  };
  setDisplayStatistics: Dispatch<SetStateAction<{
    descriptive: boolean;
    quartiles: boolean;
  }>>;
  handleAddExpectedValue: () => void;
  handleRemoveExpectedValue: (value: string) => void;
  handleChangeExpectedValue: (oldValue: string) => void;
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

export interface ChiSquareWorkerProps {
  workerUrl?: string;
  timeoutDuration?: number;
}

export interface ChiSquareWorkerHookResult {
  isCalculating: boolean;
  error: string | undefined;
  calculate: (input: WorkerInput) => Promise<ChiSquareWorkerResult | null>;
  cancelCalculation: () => void;
}

export interface ChiSquareAnalysisProps extends Pick<BaseModalProps, 'onClose' | 'containerType'> {
  selectedVariables: Variable[];
  expectedRange: {
    getFromData: boolean;
    useSpecificRange: boolean;
  };
  rangeValue: {
    lowerValue: number | null;
    upperValue: number | null;
  };
  expectedValue: {
    allCategoriesEqual: boolean;
    values: boolean;
    inputValue: number | null;
  };
  expectedValueList: string[];
  displayStatistics: {
    descriptive: boolean;
    quartiles: boolean;
  };
}

export interface ChiSquareAnalysisResult {
  isLoading: boolean;
  errorMsg: string | null;
  runAnalysis: () => Promise<void>;
  cancelAnalysis: () => void;
} 