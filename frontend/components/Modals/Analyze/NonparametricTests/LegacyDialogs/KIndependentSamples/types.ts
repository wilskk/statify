import type { Variable } from "@/types/Variable";
import { BaseModalProps } from "@/types/modalTypes";
import { Dispatch, SetStateAction } from "react";

// ---------------------------------
// Variable Selection Types
// ---------------------------------
export type HighlightedVariable = {
    tempId: string;
    source: 'available' | 'selected' | 'grouping';
};

// ---------------------------------
// Test Settings Types
// ---------------------------------
export interface KIndependentSamplesOptions {
    group1: number | null;
    group2: number | null;
    testType: {
        kruskalWallisH: boolean;
        median: boolean;
        jonckheereTerpstra: boolean;
    };
    displayStatistics: {
        descriptive: boolean;
        quartiles: boolean;
    };
}

export interface VariablesTabProps {
    availableVariables: Variable[];
    testVariables: Variable[];
    groupingVariable: Variable | null;
    group1: number | null;
    group2: number | null;
    highlightedVariable: HighlightedVariable | null;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
    testType: {
        kruskalWallisH: boolean;
        median: boolean;
        jonckheereTerpstra: boolean;
    };
    setTestType: Dispatch<SetStateAction<{
        kruskalWallisH: boolean;
        median: boolean;
        jonckheereTerpstra: boolean;
    }>>;
    handleVariableSelect: (variable: Variable, source: 'available' | 'selected' | 'grouping') => void;
    handleVariableDoubleClick: (variable: Variable, source: 'available' | 'selected' | 'grouping') => void;
    handleDefineGroupsClick: () => void;
    moveToAvailableVariables: (variable: Variable, source: 'selected' | 'grouping', targetIndex?: number) => void;
    moveToTestVariable: (variable: Variable, targetIndex?: number) => void;
    moveToGroupingVariable: (variable: Variable, targetIndex?: number) => void;
    reorderVariables: (source: 'selected', variables: Variable[]) => void;
    errorMsg: string | null;
}

export interface OptionsTabProps {
    displayStatistics: {
        descriptive: boolean;
        quartiles: boolean;
    };
    setDisplayStatistics: Dispatch<SetStateAction<{
        descriptive: boolean;
        quartiles: boolean;
    }>>;
}

// === Analysis Params ===
export interface KIndependentSamplesAnalysisParams extends Pick<BaseModalProps, 'onClose'> {
    testVariables: Variable[];
    groupingVariable: Variable | null;
    group1: number | null;
    group2: number | null;
    testType: {
        kruskalWallisH: boolean;
        median: boolean;
        jonckheereTerpstra: boolean;
    };
    displayStatistics: {
        descriptive: boolean;
        quartiles: boolean;
    };
}

// === Results Types ===
export interface KIndependentSamplesResults {
    descriptives?: any;
    ranks?: any;
    kruskalWallisH?: any;
    medianFrequencies?: any;
    medianTest?: any;
    jonckheereTerpstraTest?: any;
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
        kruskalWallisH: boolean;
        median: boolean;
        jonckheereTerpstra: boolean;
    };
    displayStatistics: {
        descriptive: boolean;
        quartiles: boolean;
    };
}

export interface WorkerCalculationPromise {
    resolve: (result: KIndependentSamplesResults) => void;
    reject: (reason: any) => void;
}

export interface KIndependentSamplesWorkerResult {
    success: boolean;
    descriptives?: any;
    ranks?: any;
    kruskalWallisH?: any;
    medianFrequencies?: any;
    medianTest?: any;
    jonckheereTerpstraTest?: any;
    testType?: {
        kruskalWallisH: boolean;
        median: boolean;
        jonckheereTerpstra: boolean;
    };
    displayStatistics?: {
        descriptive: boolean;
        quartiles: boolean;
    };
    error?: string;
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
            data: any[];
        }[];
        groupData: {
            variable: Variable;
            data: any[];
        };
    }>;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
}

// For worker communication
export interface KIndependentSamplesWorkerHookResult {
    calculate: (data: WorkerInput) => Promise<KIndependentSamplesResults>;
    isCalculating: boolean;
    error: string | null;
    cancelCalculation: () => void;
} 