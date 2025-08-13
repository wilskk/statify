import React, { FC, useCallback, useEffect, useRef } from "react";
import type { Variable } from "@/types/Variable";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';
import { VariablesTabProps } from "./types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { toast as sonner } from "sonner";

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

    // Sonner guards to reduce duplicate notifications
    const filteredSonnerShownRef = useRef(false);
    const prevUnknownCountRef = useRef(0);

    // --- Adapt props for VariableListManager ---
    const variableIdKeyToUse: keyof Variable = 'id';
    
    // Filter to show only NUMERIC variables in available list (include all measurements for NUMERIC)
    const filteredAvailableVariables = availableVariables.filter(variable => 
        variable.type === 'NUMERIC'
    );

    // Show sonner notifications for filtered variables (once per mount)
    useEffect(() => {
        if (filteredSonnerShownRef.current) return;
        const filteredOutVariables = availableVariables.filter(variable => variable.type !== 'NUMERIC');
        if (filteredOutVariables.length > 0) {
            const nonNumericCount = filteredOutVariables.length;
            sonner.info(`${nonNumericCount} non-numeric variable${nonNumericCount > 1 ? 's' : ''} ${nonNumericCount > 1 ? 'were' : 'was'} filtered out from available variables for exploratory analysis`, { id: 'explore-non-numeric-filtered' });
            filteredSonnerShownRef.current = true;
        }
    }, [availableVariables]);

    // Check for variables with unknown measurement levels
    const unknownVariables = [...dependentVariables, ...factorVariables].filter(variable => variable.measure === 'unknown');
    const unknownCount = unknownVariables.length;

    // Show sonner for unknown measurement levels (only when transitioning 0 -> >0)
    useEffect(() => {
        if (unknownCount > 0 && prevUnknownCountRef.current === 0) {
            sonner.warning(`${unknownCount} variable${unknownCount > 1 ? 's' : ''} with unknown measurement level selected. Consider reviewing variable properties.`, { id: 'explore-unknown-measurement' });
        }
        // Track last seen count and reset when it returns to 0
        if (unknownCount === 0) {
            prevUnknownCountRef.current = 0;
        } else {
            prevUnknownCountRef.current = unknownCount;
        }
    }, [unknownCount]);

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
            allowedMeasurements: ['unknown', 'nominal', 'ordinal', 'scale'],
        },
        {
            id: 'factor',
            title: 'Factor List',
            variables: factorVariables,
            height: '110px', // increased accordingly
            draggableItems: true,
            droppable: true,
            allowedTypes: ['NUMERIC'],
            allowedMeasurements: ['unknown', 'nominal', 'ordinal', 'scale'],
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
                    // notification suppressed to reduce noise: moved to available variables
                }
                break;
            case 'dependent':
                moveToDependentVariables(variable, targetIndex);
                // notification suppressed to reduce noise: added to dependent list
                break;
            case 'factor':
                moveToFactorVariables(variable, targetIndex);
                // notification suppressed to reduce noise: added to factor list
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