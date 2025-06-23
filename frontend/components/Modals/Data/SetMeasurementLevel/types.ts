import { Variable } from "@/types/Variable";

export interface SetMeasurementLevelProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

export interface VariableTabProps {
    onClose: () => void;
    unknownVariables: Variable[];
    nominalVariables: Variable[];
    ordinalVariables: Variable[];
    scaleVariables: Variable[];
    highlightedVariable: { id: string, source: string } | null;
    setHighlightedVariable: (value: { id: string, source: string } | null) => void;
    handleMoveVariable: (variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => void;
    handleReorderVariable: (listId: string, variables: Variable[]) => void;
    handleSave: () => void;
    handleReset: () => void;
    containerType?: "dialog" | "sidebar";
} 