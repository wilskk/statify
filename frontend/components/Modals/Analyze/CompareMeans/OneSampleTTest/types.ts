import { Variable } from '@/types/Variable';
import { Dispatch, SetStateAction } from 'react';
import { TourStep as BaseTourStep } from '@/types/tourTypes';
import { BaseModalProps } from '@/types/modalTypes';

// ---------------------------------
// Constants
// ---------------------------------

// Tab Constants
export const TABS = {
    VARIABLES: 'variables' as const,
};

// ---------------------------------
// Type
// ---------------------------------

// Tab Type
export type TabType = typeof TABS.VARIABLES;

// TourStep Type
export type TourStep = BaseTourStep & {
    requiredTab?: TabType | string;
    forceChangeTab?: boolean;
};

// Highlighted Variable
export type HighlightedVariable = {
  tempId: string;
  source: 'available' | 'test';
};
// ---------------------------------
// Props
// ---------------------------------

// TabControl Props
export interface TabControlProps {
    setActiveTab: (tab: 'variables') => void;
    currentActiveTab: string;
}

// Variables Tab Props
export interface VariablesTabProps {
  availableVariables: Variable[];
  testVariables: Variable[];
  highlightedVariable: HighlightedVariable | null;
  setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
  moveToTestVariables: (variable: Variable, targetIndex?: number) => void;
  moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
  reorderVariables: (source: 'available' | 'test', variables: Variable[]) => void;
  testValue: number;
  setTestValue: Dispatch<SetStateAction<number>>;
  estimateEffectSize: boolean;
  setEstimateEffectSize: Dispatch<SetStateAction<boolean>>;
  tourActive?: boolean;
  currentStep?: number;
  tourSteps?: TourStep[];
}

// TestSettings Props
export interface TestSettingsProps {
  initialTestValue?: number;
  initialEstimateEffectSize?: boolean;
}

// Variable Selection Props
export interface VariableSelectionProps {
  initialVariables?: Variable[];
}

// OneSampleTTestAnalysis Props
export interface OneSampleTTestAnalysisProps extends Pick<BaseModalProps, 'onClose' | 'containerType'> {
  testVariables: Variable[];
  testValue: number;
  estimateEffectSize: boolean;
}

// ---------------------------------
// Result
// ---------------------------------

// UseTourGuide Result
export interface UseTourGuideResult {
  tourActive: boolean;
  currentStep: number;
  tourSteps: TourStep[];
  currentTargetElement: HTMLElement | null;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
} 

// OneSampleStatistics Result
export interface OneSampleStatistics {
  N: number;
  Mean: number;
  StdDev: number;
  SEMean: number;
}

// OneSampleTest Result
export interface OneSampleTest {
  T: number;
  DF: number;
  PValue: number;
  MeanDifference: number;
  Lower: number;
  Upper: number;
}

// OneSampleTTest Result
export interface OneSampleTTestResult {
  variable: Variable;
  testValue?: number;
  stats: OneSampleStatistics | OneSampleTest;
}

// OneSampleTTest Results Collection
export interface OneSampleTTestResults {
  oneSampleStatistics?: OneSampleTTestResult[];
  oneSampleTest?: OneSampleTTestResult[];
}

// ---------------------------------
// Table Types
// ---------------------------------
export interface TableColumnHeader {
  header: string;
  key: string;
  children?: TableColumnHeader[];
}

export interface TableRow {
  [key: string]: any;
  rowHeader?: any[];
}

export interface OneSampleTTestTable {
  title: string;
  columnHeaders: TableColumnHeader[];
  rows: TableRow[];
}