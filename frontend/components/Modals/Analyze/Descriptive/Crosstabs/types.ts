import { Dispatch, SetStateAction } from 'react';
import type { Variable } from "@/types/Variable";
import { BaseModalProps } from "@/types/modalTypes";
import { TourStep } from './hooks/useTourGuide';

// === Shared Types ===
export type NonintegerWeightsType = 'roundCell' | 'roundCase' | 'truncateCell' | 'truncateCase' | 'noAdjustment';
export type VariableHighlight = { id: string, source: 'available' | 'row' | 'column' | 'layer' } | null;

// === Tour Props ===
export interface TourProps {
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

// === Variables Tab Props ===
export interface VariablesTabProps extends TourProps {
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
export interface StatisticsTabProps extends TourProps {
    chiSquare: boolean;
    correlations: boolean;
    phiAndCramersV: boolean;
    gamma: boolean;
    kendallTauB: boolean;
    kendallTauC: boolean;
    risk: boolean;
    setChiSquare: Dispatch<SetStateAction<boolean>>;
    setCorrelations: Dispatch<SetStateAction<boolean>>;
    setPhiAndCramersV: Dispatch<SetStateAction<boolean>>;
    setGamma: Dispatch<SetStateAction<boolean>>;
    setKendallTauB: Dispatch<SetStateAction<boolean>>;
    setKendallTauC: Dispatch<SetStateAction<boolean>>;
    setRisk: Dispatch<SetStateAction<boolean>>;
    containerType?: "dialog" | "sidebar";
}

// === Cells Tab Props ===
export interface CellsTabProps extends TourProps {
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

// === Analysis Params ===
export interface CrosstabsAnalysisParams extends Pick<BaseModalProps, 'onClose'> {
    rowVariables: Variable[];
    columnVariables: Variable[];
    layerVariablesMap: Record<number, Variable[]>;
    displayClusteredBarCharts: boolean;
    suppressTables: boolean;
    displayLayerVariables: boolean;
    chiSquare: boolean;
    correlations: boolean;
    phiAndCramersV: boolean;
    gamma: boolean;
    kendallTauB: boolean;
    kendallTauC: boolean;
    risk: boolean;
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
} 