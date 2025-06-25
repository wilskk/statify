import { Variable } from "@/types/Variable";

export enum RestructureMethod {
    VariablesToCases = "variables_to_cases",
    CasesToVariables = "cases_to_variables",
    TransposeAllData = "transpose_all_data",
}

export interface RestructureConfig {
    method: RestructureMethod;
    selectedVariables: Array<{
        name: string;
        columnIndex: number;
        type: string;
        measure: string;
    }>;
    indexVariables: Array<{
        name: string;
        columnIndex: number;
        type: string;
        measure: string;
    }>;
    identifierVariables: Array<{
        name: string;
        columnIndex: number;
        type: string;
        measure: string;
    }>;
    options: {
        createCount: boolean;
        createIndex: boolean;
        dropEmptyVariables: boolean;
    };
}

export interface UseRestructureReturn {
    // State
    currentStep: number;
    activeTab: string;
    method: RestructureMethod;
    availableVariables: Variable[];
    selectedVariables: Variable[];
    indexVariables: Variable[];
    identifierVariables: Variable[];
    highlightedVariable: { id: string; source: string } | null;
    createCount: boolean;
    createIndex: boolean;
    dropEmptyVariables: boolean;
    validationErrors: string[];
    
    // Actions
    setCurrentStep: (step: number) => void;
    setActiveTab: (tab: string) => void;
    setMethod: (method: RestructureMethod) => void;
    setHighlightedVariable: (variable: { id: string; source: string } | null) => void;
    setCreateCount: (value: boolean) => void;
    setCreateIndex: (value: boolean) => void;
    setDropEmptyVariables: (value: boolean) => void;
    
    // Handlers
    handleNext: () => void;
    handleBack: () => void;
    handleFinish: (onClose: () => void) => Promise<void>;
    handleMoveVariable: (variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => void;
    handleReorderVariable: (listId: string, variables: Variable[]) => void;
    
    // Utilities
    validateCurrentStep: () => string[];
    prepareVariablesWithTempId: (vars: Variable[]) => Variable[];
}

export interface RestructureUIProps {
    hook: UseRestructureReturn;
    onClose: () => void;
} 