import { Variable } from "@/types/Variable";

export interface DuplicateCasesProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

export interface VariableTabProps {
    sourceVariables: Variable[];
    matchingVariables: Variable[];
    sortingVariables: Variable[];
    highlightedVariable: { id: string, source: string } | null;
    setHighlightedVariable: (value: { id: string, source: string } | null) => void;
    sortOrder: "ascending" | "descending";
    setSortOrder: (value: "ascending" | "descending") => void;
    handleMoveVariable: (variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => void;
    handleReorderVariable: (listId: string, variables: Variable[]) => void;
    getVariableIcon: (variable: Variable) => React.ReactNode;
    getDisplayName: (variable: Variable) => string;
    containerType?: "dialog" | "sidebar";
}

export interface OptionsTabProps {
    primaryCaseIndicator: "last" | "first";
    setPrimaryCaseIndicator: (value: "last" | "first") => void;
    primaryName: string;
    setPrimaryName: (value: string) => void;
    sequentialCount: boolean;
    setSequentialCount: (value: boolean) => void;
    sequentialName: string;
    setSequentialName: (value: string) => void;
    moveMatchingToTop: boolean;
    setMoveMatchingToTop: (value: boolean) => void;
    containerType?: "dialog" | "sidebar";
} 