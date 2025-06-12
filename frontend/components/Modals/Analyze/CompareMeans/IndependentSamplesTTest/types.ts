import type { Variable, VariableData } from '@/types/Variable';
import type { Dispatch, SetStateAction } from 'react';
import { BaseModalProps } from '@/types/modalTypes';

// ---------------------------------
// Test Settings Types
// ---------------------------------
export interface DefineGroupsOptions {
  useSpecifiedValues: boolean;
  cutPoint: boolean;
}

export interface IndependentSamplesTTestOptions {
  estimateEffectSize: boolean;
  defineGroups: DefineGroupsOptions;
  group1: number | null;
  group2: number | null;
  cutPointValue: number | null;
}

// ---------------------------------
// Variable Selection Types
// ---------------------------------
export interface HighlightedVariableInfo {
  tempId: string;
  source: 'available' | 'selected' | 'grouping';
}

// ---------------------------------
// Modal States
// ---------------------------------
export interface DefineGroupsModalState {
  showDefineGroupsModal: boolean;
  tempDefineGroups: DefineGroupsOptions;
  tempGroup1: number | null;
  tempGroup2: number | null;
  tempCutPointValue: number | null;
  groupRangeError: string | null;
}

// ---------------------------------
// Data Fetching Types
// ---------------------------------
export interface FetchedData {
  variableData: VariableData[] | null;
  groupData: VariableData | null;
}

// ---------------------------------
// Worker Types
// ---------------------------------
export interface IndependentSamplesTTestWorkerResult {
  success: boolean;
  group?: IndependentSamplesTTestGroupStatistics;
  test?: IndependentSamplesTTestResults;
  error?: string;
}

export interface IndependentSamplesTTestGroupStatistics {
  title: string;
  output_data: any;
  components: string;
  description: string;
}

export interface IndependentSamplesTTestResults {
  title: string;
  output_data: any;
  components: string;
  description: string;
}

export interface WorkerInput {
  variableData: VariableData[];
  groupData: VariableData;
  defineGroups: DefineGroupsOptions;
  group1: number | null;
  group2: number | null;
  cutPointValue: number | null;
  estimateEffectSize: boolean;
}

export interface WorkerCalculationPromise {
  resolve: (value: IndependentSamplesTTestWorkerResult | null) => void;
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
  groupingVariable: Variable | null;
  highlightedVariable: HighlightedVariableInfo | null;
  setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariableInfo | null>>;
  moveToSelectedVariables: (variable: Variable, targetIndex?: number) => void;
  moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
  setGroupingVariable: (variable: Variable | null) => void;
  reorderVariables: (source: 'available' | 'selected', variables: Variable[]) => void;
  resetVariableSelection: () => void;
}

export interface TestSettingsProps {
  initialEstimateEffectSize?: boolean;
  initialDefineGroups?: DefineGroupsOptions;
  initialGroup1?: number | null;
  initialGroup2?: number | null;
  initialCutPointValue?: number | null;
}

export interface TestSettingsResult {
  estimateEffectSize: boolean;
  setEstimateEffectSize: Dispatch<SetStateAction<boolean>>;
  defineGroups: DefineGroupsOptions;
  setDefineGroups: Dispatch<SetStateAction<DefineGroupsOptions>>;
  group1: number | null;
  setGroup1: Dispatch<SetStateAction<number | null>>;
  group2: number | null;
  setGroup2: Dispatch<SetStateAction<number | null>>;
  cutPointValue: number | null;
  setCutPointValue: Dispatch<SetStateAction<number | null>>;
  resetTestSettings: () => void;
}

export interface ModalSettingsProps {
  groupingVariable: Variable | null;
}

export interface ModalSettingsResult extends DefineGroupsModalState {
  setShowDefineGroupsModal: Dispatch<SetStateAction<boolean>>;
  setTempDefineGroups: Dispatch<SetStateAction<DefineGroupsOptions>>;
  setTempGroup1: Dispatch<SetStateAction<number | null>>;
  setTempGroup2: Dispatch<SetStateAction<number | null>>;
  setTempCutPointValue: Dispatch<SetStateAction<number | null>>;
  setGroupRangeError: Dispatch<SetStateAction<string | null>>;
  resetModalSettings: () => void;
  applyGroupSettings: () => void;
}

export interface DataFetchingProps {
}

export interface DataFetchingResult {
  isLoading: boolean;
  error: string | null;
  fetchData: (variables: Variable[], groupVariable: Variable) => Promise<FetchedData>;
  clearError: () => void;
}

export interface IndependentSamplesTTestWorkerProps {
  workerUrl?: string;
  timeoutDuration?: number;
}

export interface IndependentSamplesTTestWorkerHookResult {
  isCalculating: boolean;
  error: string | undefined;
  calculate: (input: WorkerInput) => Promise<IndependentSamplesTTestWorkerResult | null>;
  cancelCalculation: () => void;
}

export interface IndependentSamplesTTestAnalysisProps extends Pick<BaseModalProps, 'onClose' | 'containerType'> {
  selectedVariables: Variable[];
  groupingVariable: Variable | null;
  defineGroups: DefineGroupsOptions;
  group1: number | null;
  group2: number | null;
  cutPointValue: number | null;
  estimateEffectSize: boolean;
}

export interface IndependentSamplesTTestAnalysisResult {
  isLoading: boolean;
  errorMsg: string | null;
  runAnalysis: () => Promise<void>;
  cancelAnalysis: () => void;
} 