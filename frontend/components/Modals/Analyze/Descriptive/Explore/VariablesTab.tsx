import React, { FC, useCallback } from "react";
import type { Variable } from "@/types/Variable";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';
import { VariablesTabProps } from "./types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";

// Source types remain the same, but used internally by the parent mostly
type AllSource = 'available' | 'dependent' | 'factor' | 'label';

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    dependentVariables,
    factorVariables,
    labelVariable: _labelVariable,
    highlightedVariable,
    setHighlightedVariable,
    moveToAvailableVariables,
    moveToDependentVariables,
    moveToFactorVariables,
    moveToLabelVariable, // not used – retained for props compatibility
    reorderVariables,
    errorMsg,
    containerType = "dialog",
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    // Silence unused prop warning for moveToLabelVariable
    void moveToLabelVariable;
    void _labelVariable;

    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);
    const varListsStep = getStepIndex('explore-variable-lists');

    // --- Adapt props for VariableListManager ---
    const variableIdKeyToUse: keyof Variable = 'tempId';

    // 1. Configure the target lists
    const targetLists: TargetListConfig[] = [
        {
            id: 'dependent',
            title: 'Dependent List',
            variables: dependentVariables,
            height: '160px', // increased to fill space formerly used by label list
            draggableItems: true,
            droppable: true,
        },
        {
            id: 'factor',
            title: 'Factor List',
            variables: factorVariables,
            height: '110px', // increased accordingly
            draggableItems: true,
            droppable: true,
        }
    ];

    // 2. Adapt highlightedVariable state (already using tempId)
    const managerHighlightedVariable = highlightedVariable
        ? { id: highlightedVariable.tempId, source: highlightedVariable.source }
        : null;

    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        // Ensure the source is one of the expected types for this component (label removed)
        if (value && ['available', 'dependent', 'factor'].includes(value.source)) {
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
            // 'label' list removed – no action needed
        }
    }, [moveToAvailableVariables, moveToDependentVariables, moveToFactorVariables]);

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
            <div id="explore-variable-lists" className="relative">
                <VariableListManager
                    availableVariables={availableVariables}
                    targetLists={targetLists}
                    variableIdKey={variableIdKeyToUse}
                    highlightedVariable={managerHighlightedVariable}
                    setHighlightedVariable={setManagerHighlightedVariable}
                    onMoveVariable={handleMoveVariable}
                    onReorderVariable={handleReorderVariables}
                    availableListHeight={'320px'}
                />
                <ActiveElementHighlight active={tourActive && currentStep === varListsStep} />
            </div>

            {errorMsg && (
                <div className="col-span-2 text-destructive-foreground text-sm mt-3 p-2 bg-destructive border border-destructive/50 rounded">
                    {errorMsg}
                </div>
            )}
        </div>
    );
};

export default VariablesTab;