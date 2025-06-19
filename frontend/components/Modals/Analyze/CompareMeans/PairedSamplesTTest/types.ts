import { Variable, VariableData } from "@/types/Variable";
import type { Dispatch, SetStateAction } from 'react';
import { BaseModalProps } from '@/types/modalTypes';

// ---------------------------------
// Test Settings Types
// ---------------------------------
export interface TestSettingsProps {
  onChange?: (settings: TestSettings) => void;
}

export interface TestSettings {
  estimateEffectSize: boolean;
  calculateStandardizer: {
    standardDeviation: boolean;
    correctedStandardDeviation: boolean;
    averageOfVariances: boolean;
  };
}

export interface TestSettingsResult extends TestSettings {
  setEstimateEffectSize: Dispatch<SetStateAction<boolean>>;
  setCalculateStandardizer: Dispatch<SetStateAction<{
    standardDeviation: boolean;
    correctedStandardDeviation: boolean;
    averageOfVariances: boolean;
  }>>;
  resetTestSettings: () => void;
}

// ---------------------------------
// Variable Selection Types
// ---------------------------------
export interface HighlightedVariableInfo {
  tempId: string;
  source: 'available' | 'selected1' | 'selected2';
  rowIndex?: number;
}

export interface SelectedPairInfo {
  index: number | null;
}

// ---------------------------------
// Data Fetching Types
// ---------------------------------
export interface FetchedData {
  variableData1: VariableData[] | null;
  variableData2: VariableData[] | null;
}

// ---------------------------------
// Hook Props and Results
// ---------------------------------
export interface VariableSelectionProps {
  onVariableSelectionChange?: (variables1: Variable[], variables2: Variable[]) => void;
}

export interface VariableSelectionResult {
  availableVariables: Variable[];
  testVariables1: Variable[];
  testVariables2: Variable[];
  highlightedVariable: HighlightedVariableInfo | null;
  selectedPair: number | null;
  setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariableInfo | null>>;
  setSelectedPair: Dispatch<SetStateAction<number | null>>;
  handleSelectedVariable: (variable: Variable, targetList: 'list1' | 'list2') => void;
  handleDeselectVariable: (variable: Variable, sourceList: 'list1' | 'list2', rowIndex?: number) => void;
  handleMoveVariableBetweenLists: (index: number) => void;
  handleMoveUpPair: (index: number) => void;
  handleMoveDownPair: (index: number) => void;
  handleRemovePair: (index: number) => void;
  isPairValid: (index: number) => boolean;
  areAllPairsValid: () => boolean;
  hasDuplicatePairs: () => boolean;
  resetVariableSelection: () => void;
}

export interface DataFetchingProps {
  // Optional configuration properties
}

export interface DataFetchingResult {
  isLoading: boolean;
  error: string | null;
  fetchData: (variables1: Variable[], variables2: Variable[]) => Promise<FetchedData>;
  clearError: () => void;
}

export interface PairedSamplesTTestAnalysisProps {
  testVariables1: Variable[];
  testVariables2: Variable[];
  calculateStandardizer: {
    standardDeviation: boolean;
    correctedStandardDeviation: boolean;
    averageOfVariances: boolean;
  };
  estimateEffectSize: boolean;
  areAllPairsValid: () => boolean;
  hasDuplicatePairs: () => boolean;
  onClose?: () => void;
}

export interface PairedSamplesTTestAnalysisResult {
  isLoading: boolean;
  errorMsg: string | null;
  runAnalysis: () => Promise<void>;
  cancelAnalysis: () => void;
}

// Mock Worker types (used for implementation)
export interface PairedSamplesTTestWorkerProps {
  workerUrl?: string;
  timeoutDuration?: number;
}

export interface PairedSamplesTTestWorkerHookResult {
  isCalculating: boolean;
  error: string | undefined;
  calculate: (input: any) => Promise<any>;
  cancelCalculation: () => void;
} 