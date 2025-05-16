import React, { FC, useCallback } from "react";
import { InfoIcon } from "lucide-react";
import type { Variable } from "@/types/Variable";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';

// Source types remain the same, but used internally by the parent mostly
type AllSource = 'available' | 'dependent' | 'factor' | 'label';

interface VariablesTabProps {
    availableVariables: Variable[];
    dependentVariables: Variable[];
    factorVariables: Variable[];
    labelVariable: Variable | null;
    // Highlight state uses tempId, compatible with manager using string ID
    highlightedVariable: {tempId: string, source: AllSource} | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<{tempId: string, source: AllSource} | null>>;

    moveToAvailableVariables: (variable: Variable, source: 'dependent' | 'factor' | 'label', targetIndex?: number) => void;
    moveToDependentVariables: (variable: Variable, targetIndex?: number) => void;
    moveToFactorVariables: (variable: Variable, targetIndex?: number) => void;
    moveToLabelVariable: (variable: Variable) => void;
    reorderVariables: (source: 'dependent' | 'factor', variables: Variable[]) => void; // Only dependent/factor reorderable

    errorMsg: string | null;
}

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    dependentVariables,
    factorVariables,
    labelVariable,
    highlightedVariable,
    setHighlightedVariable,
    moveToAvailableVariables,
    moveToDependentVariables,
    moveToFactorVariables,
    moveToLabelVariable,
    reorderVariables,
    errorMsg
}) => {

    // --- Adapt props for VariableListManager ---
    const variableIdKeyToUse: keyof Variable = 'tempId';

    // 1. Configure the target lists
    const targetLists: TargetListConfig[] = [
        {
            id: 'dependent',
            title: 'Dependent List',
            variables: dependentVariables,
            height: '110px',
            draggableItems: true,
            droppable: true,
        },
        {
            id: 'factor',
            title: 'Factor List',
            variables: factorVariables,
            height: '80px',
            draggableItems: true,
            droppable: true,
        },
        {
            id: 'label',
            title: 'Label Cases by',
            variables: labelVariable ? [labelVariable] : [],
            height: '50px',
            maxItems: 1,
            draggableItems: false, // Cannot drag *from* or reorder within label list
            droppable: true, // Can drop *into* label list (up to maxItems)
        }
    ];

    // 2. Adapt highlightedVariable state (already using tempId)
    const managerHighlightedVariable = highlightedVariable
        ? { id: highlightedVariable.tempId, source: highlightedVariable.source }
        : null;

    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        // Ensure the source is one of the expected types for this component
        if (value && ['available', 'dependent', 'factor', 'label'].includes(value.source)) {
            setHighlightedVariable({ tempId: value.id, source: value.source as AllSource });
        } else {
            setHighlightedVariable(null);
        }
    }, [setHighlightedVariable]);

    // 3. Create onMoveVariable callback
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        const source = fromListId as AllSource;

        switch (toListId) {
            case 'available':
                if (source === 'dependent' || source === 'factor' || source === 'label') {
                    moveToAvailableVariables(variable, source, targetIndex);
                }
                break;
            case 'dependent':
                moveToDependentVariables(variable, targetIndex);
                break;
            case 'factor':
                moveToFactorVariables(variable, targetIndex);
                break;
            case 'label':
                // moveToLabelVariable doesn't take targetIndex
                moveToLabelVariable(variable);
                break;
        }
    }, [moveToAvailableVariables, moveToDependentVariables, moveToFactorVariables, moveToLabelVariable]);

    // 4. Create onReorderVariable callback
    const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'dependent' || listId === 'factor') {
            reorderVariables(listId, variables);
        }
        // Cannot reorder 'label' or 'available'
    }, [reorderVariables]);

    // --- Render the manager component and error message ---
    return (
        <div>
            <VariableListManager
                availableVariables={availableVariables}
                targetLists={targetLists}
                variableIdKey={variableIdKeyToUse}
                highlightedVariable={managerHighlightedVariable}
                setHighlightedVariable={setManagerHighlightedVariable}
                onMoveVariable={handleMoveVariable}
                onReorderVariable={handleReorderVariables}
                availableListHeight={'320px'}
                // Using default icons and display names
                // No specific footers needed here
            />
            {errorMsg && (
                <div className="col-span-2 text-destructive-foreground text-sm mt-3 p-2 bg-destructive border border-destructive/50 rounded">
                    {errorMsg}
                </div>
            )}
        </div>
    );
};

export default VariablesTab;