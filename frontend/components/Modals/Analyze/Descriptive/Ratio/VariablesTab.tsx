import React, { FC, useCallback } from "react";
import { Variable } from "@/types/Variable";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';

interface VariablesTabProps {
    availableVariables: Variable[];
    highlightedVariable: {tempId: string, source: 'available' | 'numerator' | 'denominator' | 'group'} | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<{tempId: string, source: 'available' | 'numerator' | 'denominator' | 'group'} | null>>;
    numeratorVariable: Variable | null;
    denominatorVariable: Variable | null;
    groupVariable: Variable | null;
    setAsNumerator: () => void;
    setAsDenominator: () => void;
    setAsGroupVariable: () => void;
    removeFromNumerator: () => void;
    removeFromDenominator: () => void;
    removeFromGroupVariable: () => void;
    addVariableBackToAvailable: (variable: Variable | null) => void;
    setVariableForRole: (role: 'numerator' | 'denominator' | 'group') => void;
}

const VariablesTab: FC<VariablesTabProps> = ({
                                                 availableVariables,
                                                 highlightedVariable,
                                                 setHighlightedVariable,
                                                 numeratorVariable,
                                                 denominatorVariable,
                                                 groupVariable,
                                                 setAsNumerator,
                                                 setAsDenominator,
                                                 setAsGroupVariable,
                                                 removeFromNumerator,
                                                 removeFromDenominator,
                                                 removeFromGroupVariable
                                             }) => {
    // Use tempId as the unique identifier key
    const variableIdKeyToUse: keyof Variable = 'tempId';

    // Configure target lists for the VariableListManager
    const targetLists: TargetListConfig[] = [
        {
            id: 'numerator',
            title: 'Numerator:',
            variables: numeratorVariable ? [numeratorVariable] : [],
            height: '46px',
            maxItems: 1,
            draggableItems: false
        },
        {
            id: 'denominator',
            title: 'Denominator:',
            variables: denominatorVariable ? [denominatorVariable] : [],
            height: '46px',
            maxItems: 1,
            draggableItems: false
        },
        {
            id: 'group',
            title: 'Group Variable:',
            variables: groupVariable ? [groupVariable] : [],
            height: '46px',
            maxItems: 1,
            draggableItems: false
        }
    ];

    // Convert the highlighted variable format for VariableListManager
    // Pastikan tempId selalu berupa string untuk managerHighlightedVariable
    const managerHighlightedVariable = highlightedVariable && highlightedVariable.tempId
        ? { id: highlightedVariable.tempId, source: highlightedVariable.source }
        : null;

    // Convert the highlighted variable setter for VariableListManager
    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        if (value && ['available', 'numerator', 'denominator', 'group'].includes(value.source)) {
            setHighlightedVariable({
                tempId: value.id,
                source: value.source as 'available' | 'numerator' | 'denominator' | 'group'
            });
        } else {
            setHighlightedVariable(null);
        }
    }, [setHighlightedVariable]);

    // Handle variable movement between lists
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string) => {
        // Moving from available to a role
        if (fromListId === 'available') {
            // First set the highlighted variable to ensure we're selecting the right one
            if (variable.tempId) {
                setHighlightedVariable({ tempId: variable.tempId, source: 'available' });
            }

            // Then assign to the appropriate role
            if (toListId === 'numerator') setAsNumerator();
            else if (toListId === 'denominator') setAsDenominator();
            else if (toListId === 'group') setAsGroupVariable();
        }
        // Moving from a role back to available
        else if (toListId === 'available') {
            if (fromListId === 'numerator') removeFromNumerator();
            else if (fromListId === 'denominator') removeFromDenominator();
            else if (fromListId === 'group') removeFromGroupVariable();
        }
        // Moving between roles (e.g., numerator to denominator)
        else if (fromListId !== toListId) {
            // First add the variable back to available
            let varToMove: Variable | null = null;

            if (fromListId === 'numerator') {
                varToMove = numeratorVariable;
                removeFromNumerator();
            }
            else if (fromListId === 'denominator') {
                varToMove = denominatorVariable;
                removeFromDenominator();
            }
            else if (fromListId === 'group') {
                varToMove = groupVariable;
                removeFromGroupVariable();
            }

            // Wait for state updates before proceeding
            setTimeout(() => {
                if (varToMove && varToMove.tempId) {
                    // Highlight the variable in the available list
                    setHighlightedVariable({ tempId: varToMove.tempId, source: 'available' });

                    // Assign to new role
                    if (toListId === 'numerator') setAsNumerator();
                    else if (toListId === 'denominator') setAsDenominator();
                    else if (toListId === 'group') setAsGroupVariable();
                }
            }, 0);
        }
    }, [
        setHighlightedVariable,
        setAsNumerator, setAsDenominator, setAsGroupVariable,
        removeFromNumerator, removeFromDenominator, removeFromGroupVariable,
        numeratorVariable, denominatorVariable, groupVariable
    ]);

    // Handle variable reordering (not used in this case but required by the component)
    const handleReorderVariable = useCallback(() => {
        // Not needed for single-item lists
    }, []);

    // Render a footer with instructions for clarity
    const renderListFooter = useCallback((listId: string) => {
        if (listId === 'available') {
            return (
                <div className="text-xs mt-2 text-slate-500 flex items-center p-1.5 rounded bg-slate-50 border border-slate-200">
                    <span>Drag variables to assign or use the arrow buttons</span>
                </div>
            );
        }
        return null;
    }, []);

    return (
        <div className="p-6">
            <VariableListManager
                availableVariables={availableVariables}
                targetLists={targetLists}
                variableIdKey={variableIdKeyToUse}
                highlightedVariable={managerHighlightedVariable}
                setHighlightedVariable={setManagerHighlightedVariable}
                onMoveVariable={handleMoveVariable}
                onReorderVariable={handleReorderVariable}
                showArrowButtons={true}
                availableListHeight="280px"
                renderListFooter={renderListFooter}
            />
        </div>
    );
};

export default VariablesTab;