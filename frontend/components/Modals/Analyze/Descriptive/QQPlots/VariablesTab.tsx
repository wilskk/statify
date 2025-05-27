import React, { FC, useCallback } from "react";
import { InfoIcon } from "lucide-react";
import type { Variable } from "@/types/Variable";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';

interface VariablesTabProps {
    availableVariables: Variable[];
    selectedVariables: Variable[];
    highlightedVariable: { tempId: string, source: 'available' | 'selected' } | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<{ tempId: string, source: 'available' | 'selected' } | null>>;
    moveToSelectedVariables: (variable: Variable, targetIndex?: number) => void;
    moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
    reorderVariables?: (source: 'available' | 'selected', variables: Variable[]) => void;
}

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    selectedVariables,
    highlightedVariable,
    setHighlightedVariable,
    moveToSelectedVariables,
    moveToAvailableVariables,
    reorderVariables = () => { console.warn("reorderVariables not implemented in parent"); },
}) => {
    const variableIdKeyToUse: keyof Variable = 'tempId';

    const targetLists: TargetListConfig[] = [
        {
            id: 'selected',
            title: 'Selected Variables:',
            variables: selectedVariables,
            height: '300px',
            draggableItems: true,
            droppable: true
        }
    ];

    const managerHighlightedVariable = highlightedVariable
        ? { id: highlightedVariable.tempId, source: highlightedVariable.source }
        : null;

    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        if (value && (value.source === 'available' || value.source === 'selected')) {
            setHighlightedVariable({ tempId: value.id, source: value.source as 'available' | 'selected' });
        } else {
            setHighlightedVariable(null);
        }
    }, [setHighlightedVariable]);

    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        if (toListId === 'selected') {
            moveToSelectedVariables(variable, targetIndex);
        } else if (toListId === 'available') {
            moveToAvailableVariables(variable, targetIndex);
        }
    }, [moveToSelectedVariables, moveToAvailableVariables]);

    const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'selected') {
            reorderVariables('selected', variables);
        }
    }, [reorderVariables]);

    return (
        <VariableListManager
            availableVariables={availableVariables}
            targetLists={targetLists}
            variableIdKey={variableIdKeyToUse}
            highlightedVariable={managerHighlightedVariable}
            setHighlightedVariable={setManagerHighlightedVariable}
            onMoveVariable={handleMoveVariable}
            onReorderVariable={handleReorderVariables}
            showArrowButtons={true}
        />
    );
};

export default VariablesTab;