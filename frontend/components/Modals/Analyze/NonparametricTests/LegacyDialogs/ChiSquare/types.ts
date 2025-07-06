import { Variable } from '@/types/Variable';
import { Dispatch, SetStateAction } from 'react';
import { TourStep as BaseTourStep } from '@/types/tourTypes';
import { BaseModalProps } from '@/types/modalTypes';

// ---------------------------------
// Tab Type
// ---------------------------------
export const TABS = {
    VARIABLES: 'variables' as const,
    OPTIONS: 'options' as const,
};

export type TabType = typeof TABS.VARIABLES | typeof TABS.OPTIONS;

// ---------------------------------
// Tour Step Type
// ---------------------------------
export type TourStep = BaseTourStep & {
    requiredTab?: TabType;
    forceChangeTab?: boolean;
};

// ---------------------------------
// Tab Control Props
// ---------------------------------
export interface TabControlProps {
    setActiveTab: (tab: 'variables' | 'options') => void;
    currentActiveTab: string;
}

export interface VariablesTabProps {
    availableVariables: Variable[];
    testVariables: Variable[];
    expectedRange: ExpectedRangeOptions;
    setExpectedRange: Dispatch<SetStateAction<ExpectedRangeOptions>>;
    rangeValue: RangeValueOptions;
    setRangeValue: Dispatch<SetStateAction<RangeValueOptions>>;
    expectedValue: ExpectedValueOptions;
    setExpectedValue: Dispatch<SetStateAction<ExpectedValueOptions>>;
    expectedValueList: number[];
    setExpectedValueList: Dispatch<SetStateAction<number[]>>;
    displayStatistics: DisplayStatisticsOptions;
    setDisplayStatistics: Dispatch<SetStateAction<DisplayStatisticsOptions>>;
    highlightedExpectedValueIndex: number | null;
    setHighlightedExpectedValueIndex: Dispatch<SetStateAction<number | null>>;
    addExpectedValue: () => void;
    removeExpectedValue: (value: number) => void;
    changeExpectedValue: (oldValue: number) => void;
    highlightedVariable: HighlightedVariable | null;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
    moveToTestVariables: (variable: Variable, targetIndex?: number) => void;
    moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
    reorderVariables: (source: 'available' | 'test', variables: Variable[]) => void;
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

// ---------------------------------
// Use Tour Guide Result
// ---------------------------------
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

export interface ChiSquareTable {
    title: string;
    columnHeaders: TableColumnHeader[];
    rows: TableRow[];
}

// ---------------------------------
// Result Types
// ---------------------------------

export interface Frequencies {
    categoryList: (string | number)[];
    observedN: number[];
    expectedN: number[] | number;
    residual: number[];
}

export interface TestStatistics {
    ChiSquare: number;
    DF: number;
    PValue: number;
}

export interface DescriptiveStatistics {
    N: number;
    Mean: number;
    StdDev: number;
    SEMean: number;
    Min: number;
    Max: number;
}

// ---------------------------------
// Highlighted Variable
// ---------------------------------
export type HighlightedVariable = {
    tempId: string;
    source: 'available' | 'test';
};

// ---------------------------------
// Hook Props and Results
// ---------------------------------

// Variable Selection Props
export interface VariableSelectionProps {
  initialVariables?: Variable[];
}

// Variable Selection Result
export interface VariableSelectionResult {
  availableVariables: Variable[];
  testVariables: Variable[];
  highlightedVariable: HighlightedVariable | null;
  setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
  moveToTestVariables: (variable: Variable, targetIndex?: number) => void;
  moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
  reorderVariables: (source: 'available' | 'test', variables: Variable[]) => void;
  resetVariableSelection: () => void;
}

// Test Settings Props
export interface TestSettingsProps {
  initialExpectedRange?: {
    getFromData: boolean;
    useSpecifiedRange: boolean;
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
  initialExpectedValueList?: number[];
  initialDisplayStatistics?: {
    descriptive: boolean;
    quartiles: boolean;
  };
}

// Test Settings Result
export interface TestSettingsResult {
  expectedRange: {
    getFromData: boolean;
    useSpecifiedRange: boolean;
  };
  setExpectedRange: Dispatch<SetStateAction<{
    getFromData: boolean;
    useSpecifiedRange: boolean;
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
  expectedValueList: number[];
  setExpectedValueList: Dispatch<SetStateAction<number[]>>;
  displayStatistics: {
    descriptive: boolean;
    quartiles: boolean;
  };
  setDisplayStatistics: Dispatch<SetStateAction<{
    descriptive: boolean;
    quartiles: boolean;
  }>>;
  highlightedExpectedValueIndex: number | null;
  setHighlightedExpectedValueIndex: Dispatch<SetStateAction<number | null>>;
  addExpectedValue: () => void;
  removeExpectedValue: (value: number) => void;
  changeExpectedValue: (oldValue: number) => void;
  resetTestSettings: () => void;
}

// Expected Range Options
export interface ExpectedRangeOptions {
  getFromData: boolean;
  useSpecifiedRange: boolean;
}

// Range Value Options
export interface RangeValueOptions {
  lowerValue: number | null;
  upperValue: number | null;
}

// Expected Value Options
export interface ExpectedValueOptions {
  allCategoriesEqual: boolean;
  values: boolean;
  inputValue: number | null;
}

// Display Statistics Options
export interface DisplayStatisticsOptions {
  descriptive: boolean;
  quartiles: boolean;
}

// Chi Square Analysis Props
export interface ChiSquareAnalysisProps extends Pick<BaseModalProps, 'onClose' | 'containerType'> {
  testVariables: Variable[];
  expectedRange: {
    getFromData: boolean;
    useSpecifiedRange: boolean;
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
  expectedValueList: number[];
  displayStatistics: {
    descriptive: boolean;
    quartiles: boolean;
  };
}

// Chi Square Analysis Result
export interface ChiSquareResult {
    variable: Variable;
    specifiedRange?: boolean;
    stats: Frequencies | TestStatistics | DescriptiveStatistics;
} 

// Chi Square Results Collection
export interface ChiSquareResults {
    frequencies?: ChiSquareResult[];
    testStatistics?: ChiSquareResult[];
    descriptiveStatistics?: ChiSquareResult[];
}