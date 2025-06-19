import type { Variable } from "@/types/Variable";
import { BaseModalProps } from "@/types/modalTypes";
import { Dispatch, SetStateAction } from "react";

// ---------------------------------
// Test Settings Types
// ---------------------------------
export interface KRelatedSamplesOptions {
    testType: {
        friedman: boolean;
        kendallsW: boolean;
        cochransQ: boolean;
    };
    displayStatistics: {
        descriptive: boolean;
        quartile: boolean;
    };
}

// ---------------------------------
// Variable Selection Types
// ---------------------------------
export type HighlightedVariable = {
    tempId: string;
    source: 'available' | 'selected';
};

export interface VariablesTabProps {
    availableVariables: Variable[];
    testVariables: Variable[];
    highlightedVariable: HighlightedVariable | null;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
    testType: {
        friedman: boolean;
        kendallsW: boolean;
        cochransQ: boolean;
    };
    setTestType: Dispatch<SetStateAction<{
        friedman: boolean;
        kendallsW: boolean;
        cochransQ: boolean;
    }>>;
    handleVariableSelect: (variable: Variable, source: 'available' | 'selected') => void;
    handleVariableDoubleClick: (variable: Variable, source: 'available' | 'selected') => void;
    moveToAvailableVariables: (variable: Variable, source: 'selected', targetIndex?: number) => void;
    moveToTestVariable: (variable: Variable, targetIndex?: number) => void;
    reorderVariables: (source: 'selected', variables: Variable[]) => void;
    errorMsg: string | null;
    containerType?: "dialog" | "sidebar";
}

// ---------------------------------
// Options Tab Props
// ---------------------------------
export interface OptionsTabProps {
    displayStatistics: {
        descriptive: boolean;
        quartile: boolean;
    };
    setDisplayStatistics: Dispatch<SetStateAction<{
        descriptive: boolean;
        quartile: boolean;
    }>>;
}

// === Analysis Params ===
export interface KRelatedSamplesAnalysisParams extends Pick<BaseModalProps, 'onClose'> {
    testVariables: Variable[];
    testType: {
        friedman: boolean;
        kendallsW: boolean;
        cochransQ: boolean;
    };
    displayStatistics: {
        descriptive: boolean;
        quartile: boolean;
    };
}

// === Results Types ===
export interface KRelatedSamplesResults {
    descriptives?: any;
    ranks?: any;
    friedmanTest?: any;
}

// === Worker Types ===
export interface WorkerInput {
    variableData: {
        variable: import('@/types/Variable').Variable;
        data: any[];
    }[];
    testType: {
        friedman: boolean;
        kendallsW: boolean;
        cochransQ: boolean;
    };
    displayStatistics: {
        descriptive: boolean;
        quartile: boolean;
    };
}

export interface WorkerCalculationPromise {
    resolve: (result: KRelatedSamplesResults) => void;
    reject: (reason: any) => void;
}

export interface KRelatedSamplesWorkerResult {
    success: boolean;
    descriptives?: any;
    ranks?: any;
    friedmanTest?: any;
    error?: string;
    testType: {
        friedman: boolean;
        kendallsW: boolean;
        cochransQ: boolean;
    };
    displayStatistics: {
        descriptive: boolean;
        quartile: boolean;
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
    highlightedVariable: HighlightedVariable | null;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
    moveToTestVariable: (variable: Variable, targetIndex?: number) => void;
    moveToAvailableVariables: (variable: Variable, source: 'selected', targetIndex?: number) => void;
    reorderVariables: (source: 'available' | 'selected', variables: Variable[]) => void;
    resetVariableSelection: () => void;
}

// For data fetching hook
export interface DataFetchingResult {
    fetchData: (testVariables: Variable[]) => Promise<{
        variableData: {
            variable: Variable;
            data: any;
        }[];
    }>;
    isLoading: boolean;
    error?: string;
    clearError: () => void;
}

// For worker communication
export interface KRelatedSamplesWorkerInterface {
    calculate: (data: WorkerInput) => Promise<KRelatedSamplesResults>;
    isCalculating: boolean;
    error?: string;
    cancelCalculation: () => void;
} 