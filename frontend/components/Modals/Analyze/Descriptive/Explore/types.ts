import { Dispatch, SetStateAction } from 'react';
import type { Variable } from "@/types/Variable";
import { BaseModalProps } from "@/types/modalTypes";

// Type for highlighted variable
export type HighlightedVariable = {
    tempId: string;
    source: 'available' | 'dependent' | 'factor' | 'label';
} | null;

// Props for VariablesTab component
export interface VariablesTabProps {
    availableVariables: Variable[];
    dependentVariables: Variable[];
    factorVariables: Variable[];
    labelVariable: Variable | null;
    highlightedVariable: HighlightedVariable;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable>>;
    moveToAvailableVariables: (variable: Variable, source: 'dependent' | 'factor' | 'label', targetIndex?: number) => void;
    moveToDependentVariables: (variable: Variable, targetIndex?: number) => void;
    moveToFactorVariables: (variable: Variable, targetIndex?: number) => void;
    moveToLabelVariable: (variable: Variable) => void;
    reorderVariables: (source: 'dependent' | 'factor', variables: Variable[]) => void;
    errorMsg: string | null;
    containerType?: "dialog" | "sidebar";
}

// Props for StatisticsTab component
export interface StatisticsTabProps {
    showDescriptives: boolean;
    setShowDescriptives: Dispatch<SetStateAction<boolean>>;
    confidenceInterval: string;
    setConfidenceInterval: Dispatch<SetStateAction<string>>;
    showMEstimators: boolean;
    setShowMEstimators: Dispatch<SetStateAction<boolean>>;
    showOutliers: boolean;
    setShowOutliers: Dispatch<SetStateAction<boolean>>;
    showPercentiles: boolean;
    setShowPercentiles: Dispatch<SetStateAction<boolean>>;
    containerType?: "dialog" | "sidebar";
}

// Props for PlotsTab component
export interface PlotsTabProps {
    boxplotOption: string;
    setBoxplotOption: Dispatch<SetStateAction<string>>;
    showStemAndLeaf: boolean;
    setShowStemAndLeaf: Dispatch<SetStateAction<boolean>>;
    showHistogram: boolean;
    setShowHistogram: Dispatch<SetStateAction<boolean>>;
    showNormalityPlots: boolean;
    setShowNormalityPlots: Dispatch<SetStateAction<boolean>>;
    containerType?: "dialog" | "sidebar";
}

// Main analysis parameters that will be used for execution and results
export interface ExploreAnalysisParams extends Pick<BaseModalProps, 'onClose'> {
    dependentVariables: Variable[];
    factorVariables: Variable[];
    labelVariable: Variable | null;
    confidenceInterval: string;
    showDescriptives: boolean;
    showMEstimators: boolean;
    showOutliers: boolean;
    showPercentiles: boolean;
    boxplotOption: string;
    showStemAndLeaf: boolean;
    showHistogram: boolean;
    showNormalityPlots: boolean;
}

// Results structure for the explore analysis
export interface ExploreResults {
    // Define types for the results data structure here
    dependents: string[];
    factors: string[];
    label?: string;
    statistics?: any;
    plots?: any;
} 