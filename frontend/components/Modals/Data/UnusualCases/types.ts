import React from 'react';
import type { Variable } from "@/types/Variable";
import type { TourStep } from './hooks/useTourGuide';
import type { Dispatch, SetStateAction } from 'react';

export type TabType = 'variables' | 'options' | 'output' | 'save' | 'missing';

export interface IdentifyUnusualCasesProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

// From VariablesTab.tsx
export type UnusualCasesSource = 'available' | 'analysis' | 'identifier';

interface TourTabProps {
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

export interface VariablesTabProps extends TourTabProps {
    availableVariables: Variable[];
    analysisVariables: Variable[];
    caseIdentifierVariable: Variable | null;
    highlightedVariable: { tempId: string, source: UnusualCasesSource } | null;
    setHighlightedVariable: Dispatch<SetStateAction<{ tempId: string, source: UnusualCasesSource } | null>>;
    moveToAvailableVariables: (variable: Variable, source: 'analysis' | 'identifier', targetIndex?: number) => void;
    moveToAnalysisVariables: (variable: Variable, targetIndex?: number) => void;
    moveToCaseIdentifierVariable: (variable: Variable) => void;
    reorderVariables: (source: 'analysis', variables: Variable[]) => void;
    errorMsg: string | null;
    getVariableIcon: (variable: Variable) => React.JSX.Element;
    getDisplayName: (variable: Variable) => string;
}

// From OutputTab.tsx
export interface OutputTabProps extends TourTabProps {
    showUnusualCasesList: boolean;
    setShowUnusualCasesList: (value: boolean) => void;
    peerGroupNorms: boolean;
    setPeerGroupNorms: (value: boolean) => void;
    anomalyIndices: boolean;
    setAnomalyIndices: (value: boolean) => void;
    reasonOccurrence: boolean;
    setReasonOccurrence: (value: boolean) => void;
    caseProcessed: boolean;
    setCaseProcessed: (value: boolean) => void;
}

// From SaveTab.tsx
export interface SaveTabProps extends TourTabProps {
    saveAnomalyIndex: boolean;
    setSaveAnomalyIndex: (value: boolean) => void;
    anomalyIndexName: string;
    setAnomalyIndexName: (value: string) => void;
    replaceExisting: boolean;
    setReplaceExisting: (value: boolean) => void;
}

// From MissingValuesTab.tsx
export interface MissingValuesTabProps extends TourTabProps {
    missingValuesOption: string;
    setMissingValuesOption: (value: string) => void;
    useProportionMissing: boolean;
    setUseProportionMissing: (value: boolean) => void;
}

// From OptionsTab.tsx
export interface OptionsTabProps extends TourTabProps {
    identificationCriteria: string;
    setIdentificationCriteria: (value: string) => void;
    percentageValue: string;
    setPercentageValue: (value: string) => void;
    fixedNumber: string;
    setFixedNumber: (value: string) => void;
    useMinimumValue: boolean;
    setUseMinimumValue: (value: boolean) => void;
    cutoffValue: string;
    setCutoffValue: (value: string) => void;
} 