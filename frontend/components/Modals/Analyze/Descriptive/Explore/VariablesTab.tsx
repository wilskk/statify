<<<<<<< HEAD
import React, { FC, useCallback, useEffect } from "react";
import type { Variable } from "@/types/Variable";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';
import { VariablesTabProps } from "./types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { toast } from "sonner";
=======
import type { FC} from "react";
import { useCallback } from "react";
import type { Variable } from "@/types/Variable";
import type { TargetListConfig } from '@/components/Common/VariableListManager';
import VariableListManager from '@/components/Common/VariableListManager';
import type { VariablesTabProps } from "./types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

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
    const variableIdKeyToUse: keyof Variable = 'id';
    
<<<<<<< HEAD
    // Filter to show only NUMERIC variables with scale or unknown measurement in available list
    const filteredAvailableVariables = availableVariables.filter(variable => 
        variable.type === 'NUMERIC' && 
        (variable.measure === 'scale' || variable.measure === 'unknown')
    );

    // Show toast notifications for filtered variables
    useEffect(() => {
        const filteredOutVariables = availableVariables.filter(variable => 
            variable.type !== 'NUMERIC' || 
            (variable.measure !== 'scale' && variable.measure !== 'unknown')
        );
        
        if (filteredOutVariables.length > 0) {
            const nonNumericCount = filteredOutVariables.filter(v => v.type !== 'NUMERIC').length;
            const nonScaleCount = filteredOutVariables.filter(v => v.type === 'NUMERIC' && v.measure !== 'scale' && v.measure !== 'unknown').length;
            
            if (nonNumericCount > 0 || nonScaleCount > 0) {
                const messages = [];
                if (nonNumericCount > 0) messages.push(`${nonNumericCount} non-numeric variable${nonNumericCount > 1 ? 's' : ''}`);
                if (nonScaleCount > 0) messages.push(`${nonScaleCount} non-scale variable${nonScaleCount > 1 ? 's' : ''}`);
                
                toast.info(`${messages.join(' and ')} ${messages.length > 1 ? 'were' : 'was'} filtered out from available variables for descriptive analysis`);
            }
        }
    }, [availableVariables]);

    // Check for variables with unknown measurement levels
    const unknownVariables = [...dependentVariables, ...factorVariables].filter(variable => variable.measure === 'unknown');
    const unknownCount = unknownVariables.length;

    // Show toast for unknown measurement levels
    useEffect(() => {
        if (unknownCount > 0) {
            toast.warning(`${unknownCount} variable${unknownCount > 1 ? 's' : ''} with unknown measurement level selected. Consider reviewing variable properties.`);
        }
    }, [unknownCount]);
=======
    // Filter to show only NUMERIC variables in available list (include all measurements for NUMERIC)
    const filteredAvailableVariables = availableVariables.filter(variable => 
        variable.type === 'NUMERIC'
    );

>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

    // 1. Configure the target lists
    const targetLists: TargetListConfig[] = [
        {
            id: 'dependent',
            title: 'Dependent List',
            variables: dependentVariables,
            height: '160px', // increased to fill space formerly used by label list
            draggableItems: true,
            droppable: true,
            allowedTypes: ['NUMERIC'],
<<<<<<< HEAD
            allowedMeasurements: ['scale', 'unknown'],
=======
            allowedMeasurements: ['unknown', 'nominal', 'ordinal', 'scale'],
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        },
        {
            id: 'factor',
            title: 'Factor List',
            variables: factorVariables,
            height: '110px', // increased accordingly
            draggableItems: true,
            droppable: true,
            allowedTypes: ['NUMERIC'],
<<<<<<< HEAD
            allowedMeasurements: ['scale', 'unknown'],
=======
            allowedMeasurements: ['unknown', 'nominal', 'ordinal', 'scale'],
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        }
    ];

    // 2. Adapt highlightedVariable state (already using id)
    const managerHighlightedVariable = highlightedVariable
        ? { id: String(highlightedVariable.id), source: highlightedVariable.source }
        : null;

    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        // Ensure the source is one of the expected types for this component (label removed)
        if (value && ['available', 'dependent', 'factor'].includes(value.source)) {
            setHighlightedVariable({ id: value.id, source: value.source as AllSource });
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
<<<<<<< HEAD
                    toast.success(`Variable "${variable.name}" moved to available variables`);
=======
                    // notification suppressed to reduce noise: moved to available variables
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
                }
                break;
            case 'dependent':
                moveToDependentVariables(variable, targetIndex);
<<<<<<< HEAD
                toast.success(`Variable "${variable.name}" added to dependent list`);
                break;
            case 'factor':
                moveToFactorVariables(variable, targetIndex);
                toast.success(`Variable "${variable.name}" added to factor list`);
=======
                // notification suppressed to reduce noise: added to dependent list
                break;
            case 'factor':
                moveToFactorVariables(variable, targetIndex);
                // notification suppressed to reduce noise: added to factor list
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
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
        <div data-testid="explore-variables-tab-content">
            <div id="explore-variable-lists" data-testid="explore-variable-lists" className="relative">
                <VariableListManager
                    availableVariables={filteredAvailableVariables}
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
                <div data-testid="explore-variables-error" className="col-span-2 text-destructive-foreground text-sm mt-3 p-2 bg-destructive border border-destructive/50 rounded">
                    {errorMsg}
                </div>
            )}
        </div>
    );
};

export default VariablesTab;