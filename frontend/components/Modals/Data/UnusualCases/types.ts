import React from 'react';
import type { Variable } from "@/types/Variable";
import type { Dispatch, SetStateAction } from 'react';

export interface IdentifyUnusualCasesProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

// From VariablesTab.tsx
export type UnusualCasesSource = 'available' | 'analysis' | 'identifier';

export interface VariablesTabProps {
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
export interface OutputTabProps {
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
export interface SaveTabProps {
    saveAnomalyIndex: boolean;
    setSaveAnomalyIndex: (value: boolean) => void;
    anomalyIndexName: string;
    setAnomalyIndexName: (value: string) => void;
    savePeerGroups: boolean;
    setSavePeerGroups: (value: boolean) => void;
    peerGroupsRootName: string;
    setPeerGroupsRootName: (value: string) => void;
    saveReasons: boolean;
    setSaveReasons: (value: boolean) => void;
    reasonsRootName: string;
    setReasonsRootName: (value: string) => void;
    replaceExisting: boolean;
    setReplaceExisting: (value: boolean) => void;
    exportFilePath: string; 
    setExportFilePath: (value: string) => void; 
}

// From MissingValuesTab.tsx
export interface MissingValuesTabProps {
    missingValuesOption: string;
    setMissingValuesOption: (value: string) => void;
    useProportionMissing: boolean;
    setUseProportionMissing: (value: boolean) => void;
}

// From OptionsTab.tsx
export interface OptionsTabProps {
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
    minPeerGroups: string;
    setMinPeerGroups: (value: string) => void;
    maxPeerGroups: string;
    setMaxPeerGroups: (value: string) => void;
    maxReasons: string;
    setMaxReasons: (value: string) => void;
} 