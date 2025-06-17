import { Dispatch, SetStateAction } from 'react';
import type { Variable } from "@/types/Variable";
import { BaseModalProps } from "@/types/modalTypes";

// === Shared Types ===
export type NonintegerWeightsType = 'roundCell' | 'roundCase' | 'truncateCell' | 'truncateCase' | 'noAdjustment';
export type ExactTestMethodType = 'asymptotic' | 'monteCarlo' | 'exact';
export type RowOrderType = 'ascending' | 'descending';
export type VariableHighlight = { id: string, source: 'available' | 'row' | 'column' | 'layer' } | null;

// === Variables Tab Props ===
export interface VariablesTabProps {
    availableVariables: Variable[];
    rowVariables: Variable[];
    columnVariables: Variable[];
    layerVariablesMap: Record<number, Variable[]>;
    currentLayerIndex: number;
    totalLayers: number;
    highlightedVariable: VariableHighlight;
    displayClusteredBarCharts: boolean;
    suppressTables: boolean;
    displayLayerVariables: boolean;
    setHighlightedVariable: (value: VariableHighlight) => void;
    setCurrentLayerIndex: (value: number) => void;
    setTotalLayers: (value: number) => void;
    moveToRowVariables: (variable: Variable) => void;
    moveToColumnVariables: (variable: Variable) => void;
    moveToLayerVariables: (variable: Variable) => void;
    moveToAvailableVariables: (variable: Variable, source: 'row' | 'column' | 'layer') => void;
    reorderVariables: (source: 'available' | 'row' | 'column' | 'layer', variables: Variable[]) => void;
    setDisplayClusteredBarCharts: (value: boolean) => void;
    setSuppressTables: (value: boolean) => void;
    setDisplayLayerVariables: (value: boolean) => void;
    containerType?: "dialog" | "sidebar";
}

// === Statistics Tab Props ===
export interface StatisticsTabProps {
    chiSquare: boolean;
    correlations: boolean;
    contingencyCoefficient: boolean;
    phiAndCramersV: boolean;
    lambda: boolean;
    uncertaintyCoefficient: boolean;
    gamma: boolean;
    somersD: boolean;
    kendallTauB: boolean;
    kendallTauC: boolean;
    eta: boolean;
    kappa: boolean;
    risk: boolean;
    mcNemar: boolean;
    cochranMantelHaenszel: boolean;
    commonOddsRatio: string;
    setChiSquare: Dispatch<SetStateAction<boolean>>;
    setCorrelations: Dispatch<SetStateAction<boolean>>;
    setContingencyCoefficient: Dispatch<SetStateAction<boolean>>;
    setPhiAndCramersV: Dispatch<SetStateAction<boolean>>;
    setLambda: Dispatch<SetStateAction<boolean>>;
    setUncertaintyCoefficient: Dispatch<SetStateAction<boolean>>;
    setGamma: Dispatch<SetStateAction<boolean>>;
    setSomersD: Dispatch<SetStateAction<boolean>>;
    setKendallTauB: Dispatch<SetStateAction<boolean>>;
    setKendallTauC: Dispatch<SetStateAction<boolean>>;
    setEta: Dispatch<SetStateAction<boolean>>;
    setKappa: Dispatch<SetStateAction<boolean>>;
    setRisk: Dispatch<SetStateAction<boolean>>;
    setMcNemar: Dispatch<SetStateAction<boolean>>;
    setCochranMantelHaenszel: Dispatch<SetStateAction<boolean>>;
    setCommonOddsRatio: Dispatch<SetStateAction<string>>;
    containerType?: "dialog" | "sidebar";
}

// === Cells Tab Props ===
export interface CellsTabProps {
    observedCounts: boolean;
    expectedCounts: boolean;
    hideSmallCounts: boolean;
    smallCountThreshold: string;
    rowPercentages: boolean;
    columnPercentages: boolean;
    totalPercentages: boolean;
    compareColumnProportions: boolean;
    adjustPValues: boolean;
    unstandardizedResiduals: boolean;
    standardizedResiduals: boolean;
    adjustedStandardizedResiduals: boolean;
    nonintegerWeights: NonintegerWeightsType;
    setObservedCounts: Dispatch<SetStateAction<boolean>>;
    setExpectedCounts: Dispatch<SetStateAction<boolean>>;
    setHideSmallCounts: Dispatch<SetStateAction<boolean>>;
    setSmallCountThreshold: Dispatch<SetStateAction<string>>;
    setRowPercentages: Dispatch<SetStateAction<boolean>>;
    setColumnPercentages: Dispatch<SetStateAction<boolean>>;
    setTotalPercentages: Dispatch<SetStateAction<boolean>>;
    setCompareColumnProportions: Dispatch<SetStateAction<boolean>>;
    setAdjustPValues: Dispatch<SetStateAction<boolean>>;
    setUnstandardizedResiduals: Dispatch<SetStateAction<boolean>>;
    setStandardizedResiduals: Dispatch<SetStateAction<boolean>>;
    setAdjustedStandardizedResiduals: Dispatch<SetStateAction<boolean>>;
    setNonintegerWeights: Dispatch<SetStateAction<NonintegerWeightsType>>;
    containerType?: "dialog" | "sidebar";
}

// === Exact Tests Tab Props ===
export interface ExactTestsTabProps {
    exactTestMethod: ExactTestMethodType;
    confidenceLevel: string;
    monteCarloSamples: string;
    timeLimit: string;
    useTimeLimit: boolean;
    setExactTestMethod: Dispatch<SetStateAction<ExactTestMethodType>>;
    setConfidenceLevel: Dispatch<SetStateAction<string>>;
    setMonteCarloSamples: Dispatch<SetStateAction<string>>;
    setTimeLimit: Dispatch<SetStateAction<string>>;
    setUseTimeLimit: Dispatch<SetStateAction<boolean>>;
    containerType?: "dialog" | "sidebar";
}

// === Format Tab Props ===
export interface FormatTabProps {
    rowOrder: RowOrderType;
    setRowOrder: Dispatch<SetStateAction<RowOrderType>>;
    containerType?: "dialog" | "sidebar";
}

// === Analysis Params ===
export interface CrosstabsAnalysisParams extends Pick<BaseModalProps, 'onClose'> {
    rowVariables: Variable[];
    columnVariables: Variable[];
    layerVariablesMap: Record<number, Variable[]>;
    displayClusteredBarCharts: boolean;
    suppressTables: boolean;
    displayLayerVariables: boolean;
    exactTestMethod: ExactTestMethodType;
    confidenceLevel: string;
    monteCarloSamples: string;
    timeLimit: string;
    useTimeLimit: boolean;
    chiSquare: boolean;
    correlations: boolean;
    contingencyCoefficient: boolean;
    phiAndCramersV: boolean;
    lambda: boolean;
    uncertaintyCoefficient: boolean;
    gamma: boolean;
    somersD: boolean;
    kendallTauB: boolean;
    kendallTauC: boolean;
    eta: boolean;
    kappa: boolean;
    risk: boolean;
    mcNemar: boolean;
    cochranMantelHaenszel: boolean;
    commonOddsRatio: string;
    observedCounts: boolean;
    expectedCounts: boolean;
    hideSmallCounts: boolean;
    smallCountThreshold: string;
    rowPercentages: boolean;
    columnPercentages: boolean;
    totalPercentages: boolean;
    compareColumnProportions: boolean;
    adjustPValues: boolean;
    unstandardizedResiduals: boolean;
    standardizedResiduals: boolean;
    adjustedStandardizedResiduals: boolean;
    nonintegerWeights: NonintegerWeightsType;
    rowOrder: RowOrderType;
} 