import type { Variable } from "@/types/Variable";
import { BaseModalProps } from "@/types/modalTypes";
import { Dispatch, SetStateAction } from "react";


// ---------------------------------
// Define Groups Options
// ---------------------------------
export interface DefineGroupsOptions {
    useSpecifiedValues: boolean;
    cutPoint: boolean;
    group1: number | null;
    group2: number | null;
    cutPointValue: number | null;
}

// ---------------------------------
// Test Settings Types
// ---------------------------------
export interface IndependentSamplesTTestOptions {
    defineGroups: DefineGroupsOptions;
    group1: number | null;
    group2: number | null;
    cutPointValue: number | null;
    estimateEffectSize: boolean;
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
    defineGroups: DefineGroupsOptions;
    group1: number | null;
    group2: number | null;
    cutPointValue: number | null;
    estimateEffectSize: boolean;
    highlightedVariable: HighlightedVariable | null;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
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
export interface IndependentSamplesTTestAnalysisParams extends Pick<BaseModalProps, 'onClose'> {
    testVariables: Variable[];
    groupingVariable: Variable | null;
    defineGroups: DefineGroupsOptions;
    group1: number | null;
    group2: number | null;
    cutPointValue: number | null;
    estimateEffectSize: boolean;
}

// === Results Types ===
export interface IndependentSamplesTTestResults {
    group?: any;
    test?: any;
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
    defineGroups: DefineGroupsOptions;
    group1: number | null;
    group2: number | null;
    cutPointValue: number | null;
    estimateEffectSize: boolean;
}

export interface WorkerCalculationPromise {
    resolve: (result: IndependentSamplesTTestResults | null) => void;
    reject: (reason: any) => void;
}

export interface IndependentSamplesTTestWorkerResult {
    success: boolean;
    group?: any;
    test?: any;
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
        } | null;
    }>;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
}

// For worker communication
export interface TTestWorkerResult {
    calculate: (data: WorkerInput) => Promise<IndependentSamplesTTestResults>;
    isCalculating: boolean;
    error: string | null;
    cancelCalculation: () => void;
} 