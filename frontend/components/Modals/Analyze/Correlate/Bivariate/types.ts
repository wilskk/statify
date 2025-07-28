import { Variable } from "@/types/Variable";
import { Dispatch, SetStateAction } from "react";
import { TourStep as BaseTourStep } from '@/types/tourTypes';
import { BaseModalProps } from "@/types/modalTypes";

// ---------------------------------
// Constants
// ---------------------------------

// Tab Constants
export const TABS = {
    VARIABLES: 'variables' as const,
    OPTIONS: 'options' as const,
};

// ---------------------------------
// Type
// ---------------------------------

// Tab Type
export type TabType = typeof TABS.VARIABLES | typeof TABS.OPTIONS;
// export type TabType = typeof TABS.VARIABLES;

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

// Test Type
export type CorrelationCoefficient = {
    pearson: boolean;
    kendallsTauB: boolean;
    spearman: boolean;
};

export type TestOfSignificance = {
    oneTailed: boolean;
    twoTailed: boolean;
};

// Statistics
export interface StatisticsOptions {
    meansAndStandardDeviations: boolean;
    crossProductDeviationsAndCovariances: boolean;
}

// ---------------------------------
// Props
// ---------------------------------

// TabControl Props
export interface TabControlProps {
    setActiveTab: (tab: 'variables' | 'options') => void;
    // setActiveTab: (tab: 'variables') => void;
    currentActiveTab: string;
}

// VariablesTab Props
export interface VariablesTabProps {
    availableVariables: Variable[];
    testVariables: Variable[];
    highlightedVariable: HighlightedVariable | null;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
    moveToAvailableVariables: (variable: Variable) => void;
    moveToTestVariables: (variable: Variable, targetIndex?: number) => void;
    reorderVariables: (source: 'available' | 'test', variables: Variable[]) => void;
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

// OptionsTab Props
export interface OptionsTabProps {
    correlationCoefficient: CorrelationCoefficient;
    setCorrelationCoefficient: Dispatch<SetStateAction<CorrelationCoefficient>>;
    testOfSignificance: TestOfSignificance;
    setTestOfSignificance: Dispatch<SetStateAction<TestOfSignificance>>;
    flagSignificantCorrelations: boolean;
    setFlagSignificantCorrelations: Dispatch<SetStateAction<boolean>>;
    showOnlyTheLowerTriangle: boolean;
    setShowOnlyTheLowerTriangle: Dispatch<SetStateAction<boolean>>;
    showDiagonal: boolean;
    setShowDiagonal: Dispatch<SetStateAction<boolean>>;
    partialCorrelationKendallsTauB: boolean;
    setPartialCorrelationKendallsTauB: Dispatch<SetStateAction<boolean>>;
    statisticsOptions: StatisticsOptions;
    setStatisticsOptions: Dispatch<SetStateAction<StatisticsOptions>>;
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
    testVariables: Variable[];
}

// TestSettings Props
export interface TestSettingsProps {
    initialCorrelationCoefficient?: CorrelationCoefficient;
    initialTestOfSignificance?: TestOfSignificance;
    initialFlagSignificantCorrelations?: boolean;
    initialShowOnlyTheLowerTriangle?: boolean;
    initialShowDiagonal?: boolean;
    initialPartialCorrelationKendallsTauB?: boolean;
    initialStatisticsOptions?: StatisticsOptions;
}

// VariableSelection Props
export interface VariableSelectionProps {
    initialVariables?: Variable[];
}

// BivariateAnalysis Props
export interface BivariateAnalysisProps extends Pick<BaseModalProps, 'onClose'> {
    testVariables: Variable[];
    correlationCoefficient: CorrelationCoefficient;
    testOfSignificance: TestOfSignificance;
    flagSignificantCorrelations: boolean;
    showOnlyTheLowerTriangle: boolean;
    showDiagonal: boolean;
    partialCorrelationKendallsTauB: boolean;
    statisticsOptions: StatisticsOptions;
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

// Descriptive Statistics
export interface DescriptiveStatistics {
    Mean: number;
    StdDev: number;
    N: number;
}

// Correlation Result
export interface CorrelationResult {
    Pearson?: number;
    KendallTauB?: number;
    Spearman?: number;
    PValue: number;
    SumOfSquares?: number;
    Covariance?: number;
    N: number;
}

// Partial Correlation
export interface PartialCorrelation {
    PartialCorrelation: number;
    PValue: number;
    df: number;
}
// Correlation
export interface Correlation {
    pearsonCorrelation?: CorrelationResult;
    kendallsTauBCorrelation?: CorrelationResult;
    spearmanCorrelation?: CorrelationResult;
}
  

// Bivariate Result
export interface BivariateResult {
    controlVariable?: Variable;
    variable1: Variable;
    variable2?: Variable;
    descriptiveStatistics?: DescriptiveStatistics;
    correlation?: Correlation;
    partialCorrelation?: PartialCorrelation;
}
  
  // Bivariate Results Collection
  export interface BivariateResults {
    descriptiveStatistics?: BivariateResult[];
    correlation?: BivariateResult[];
    partialCorrelation?: BivariateResult[];
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
  
  export interface BivariateTable {
    title: string;
    columnHeaders: TableColumnHeader[];
    rows: TableRow[];
  }