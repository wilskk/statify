import type { Variable } from "@/types/Variable";
import { BaseModalProps } from "@/types/modalTypes";
import { Dispatch, SetStateAction } from "react";

// ---------------------------------
// Define Groups Options
// ---------------------------------
export interface DefineGroupsOptions {
    group1: number | null;
    group2: number | null;
}

// ---------------------------------
// Test Settings Types
// ---------------------------------
export interface TwoIndependentSamplesOptions {
    testType: {
        mannWhitneyU: boolean;
        mosesExtremeReactions: boolean;
        kolmogorovSmirnovZ: boolean;
        waldWolfowitzRuns: boolean;
    };
    displayStatistics: {
        descriptive: boolean;
        quartiles: boolean;
    };
}

// ---------------------------------
// Variable Selection Types
// ---------------------------------
export type HighlightedVariable = {
    tempId: string;
    source: 'available' | 'selected' | 'grouping';
};

export interface VariablesTabProps {
    availableVariables: Variable[];
    testVariables: Variable[];
    groupingVariable: Variable | null;
    group1: number | null;
    group2: number | null;
    highlightedVariable: HighlightedVariable | null;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
    testType: {
        mannWhitneyU: boolean;
        mosesExtremeReactions: boolean;
        kolmogorovSmirnovZ: boolean;
        waldWolfowitzRuns: boolean;
    };
    setTestType: Dispatch<SetStateAction<{
        mannWhitneyU: boolean;
        mosesExtremeReactions: boolean;
        kolmogorovSmirnovZ: boolean;
        waldWolfowitzRuns: boolean;
    }>>;
    handleVariableSelect: (variable: Variable, source: 'available' | 'selected' | 'grouping') => void;
    handleVariableDoubleClick: (variable: Variable, source: 'available' | 'selected' | 'grouping') => void;
    handleDefineGroupsClick: () => void;
    moveToAvailableVariables: (variable: Variable, source: 'selected' | 'grouping', targetIndex?: number) => void;
    moveToTestVariable: (variable: Variable, targetIndex?: number) => void;
    moveToGroupingVariable: (variable: Variable, targetIndex?: number) => void;
    reorderVariables: (source: 'selected', variables: Variable[]) => void;
    errorMsg: string | null;
    containerType?: "dialog" | "sidebar";
}

// === Analysis Params ===
export interface TwoIndependentSamplesAnalysisParams extends Pick<BaseModalProps, 'onClose'> {
    testVariables: Variable[];
    groupingVariable: Variable | null;
    group1: number | null;
    group2: number | null;
    testType: {
        mannWhitneyU: boolean;
        mosesExtremeReactions: boolean;
        kolmogorovSmirnovZ: boolean;
        waldWolfowitzRuns: boolean;
    };
    displayStatistics: {
        descriptive: boolean;
        quartiles: boolean;
    };
}

// === Results Types ===
export interface TwoIndependentSamplesResults {
    descriptives?: any;
    ranks?: any;
    mannWhitneyU?: any;
    kolmogorovSmirnovZFrequencies?: any;
    kolmogorovSmirnovZ?: any;
}

// === Worker Types ===
export interface WorkerInput {
    variableData: {
        variable: import('@/types/Variable').Variable;
        data: any[];
    }[];
    groupData: {
        variable: import('@/types/Variable').Variable;
        data: any[];
    };
    group1: number | null;
    group2: number | null;
    testType: {
        mannWhitneyU: boolean;
        mosesExtremeReactions: boolean;
        kolmogorovSmirnovZ: boolean;
        waldWolfowitzRuns: boolean;
    };
    displayStatistics: {
        descriptive: boolean;
        quartiles: boolean;
    };
}

export interface WorkerCalculationPromise {
    resolve: (result: TwoIndependentSamplesResults) => void;
    reject: (reason: any) => void;
}

export interface TwoIndependentSamplesWorkerResult {
    success: boolean;
    descriptives?: any;
    ranks?: any;
    mannWhitneyU?: any;
    kolmogorovSmirnovZFrequencies?: any;
    kolmogorovSmirnovZ?: any;
    error?: string;
    testType: {
        mannWhitneyU: boolean;
        mosesExtremeReactions: boolean;
        kolmogorovSmirnovZ: boolean;
        waldWolfowitzRuns: boolean;
    };
    displayStatistics: {
        descriptive: boolean;
        quartiles: boolean;
    };
}

// ---------------------------------
// Hook Props and Results
// ---------------------------------
export interface VariableSelectionProps {
    initialVariables?: Variable[];
}

export interface VariableSelectionResult {
    availableVariables: Variable[];
    testVariables: Variable[];
    groupingVariable: Variable | null;
    highlightedVariable: HighlightedVariable | null;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
    moveToTestVariable: (variable: Variable, targetIndex?: number) => void;
    moveToGroupingVariable: (variable: Variable) => void;
    moveToAvailableVariables: (variable: Variable, source: 'selected' | 'grouping', targetIndex?: number) => void;
    reorderVariables: (source: 'available' | 'selected', variables: Variable[]) => void;
    resetVariableSelection: () => void;
}

// For data fetching hook
export interface DataFetchingResult {
    fetchData: (testVariables: Variable[], groupingVariable: Variable) => Promise<{
        variableData: {
            variable: Variable;
            data: any;
        }[];
        groupData: {
            variable: Variable;
            data: any;
        };
    }>;
    isLoading: boolean;
    error?: string;
    clearError: () => void;
}

// For worker communication
export interface TwoIndependentSamplesWorkerInterface {
    calculate: (data: WorkerInput) => Promise<TwoIndependentSamplesResults>;
    isCalculating: boolean;
    error?: string;
    cancelCalculation: () => void;
} 