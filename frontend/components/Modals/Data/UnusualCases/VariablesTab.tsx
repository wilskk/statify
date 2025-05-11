import React, { FC, useCallback } from "react";
import { InfoIcon } from "lucide-react";
import type { Variable } from "@/types/Variable";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';

// Possible sources within this specific modal's variable lists
type UnusualCasesSource = 'available' | 'analysis' | 'identifier';

interface VariablesTabProps {
    availableVariables: Variable[];
    analysisVariables: Variable[];
    caseIdentifierVariable: Variable | null; // Single variable

    // Use the original highlight state type (tempId) from the parent
    highlightedVariable: { tempId: string, source: UnusualCasesSource } | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<{ tempId: string, source: UnusualCasesSource } | null>>;

    // Movement functions passed from parent
    moveToAvailableVariables: (variable: Variable, source: 'analysis' | 'identifier', targetIndex?: number) => void;
    moveToAnalysisVariables: (variable: Variable, targetIndex?: number) => void;
    moveToCaseIdentifierVariable: (variable: Variable) => void; // No targetIndex needed
    reorderVariables: (source: 'analysis', variables: Variable[]) => void; // Only analysis reorderable

    errorMsg: string | null;
}

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    analysisVariables,
    caseIdentifierVariable,
    highlightedVariable,
    setHighlightedVariable,
    moveToAvailableVariables,
    moveToAnalysisVariables,
    moveToCaseIdentifierVariable,
    reorderVariables,
    errorMsg
}) => {

    // --- Adapt props for VariableListManager ---
    const variableIdKeyToUse: keyof Variable = 'tempId'; // Manager uses tempId internally

    // 1. Configure the target lists
    const targetLists: TargetListConfig[] = [
        {
            id: 'analysis',
            title: 'Analysis Variables',
            variables: analysisVariables,
            height: '205px',
            draggableItems: true,
            droppable: true,
        },
        {
            id: 'identifier',
            title: 'Case Identifier Variable',
            variables: caseIdentifierVariable ? [caseIdentifierVariable] : [],
            height: '70px',
            maxItems: 1,
            draggableItems: false, // Cannot drag *from* or reorder within identifier list
            droppable: true,      // Can drop *into* identifier list
        }
    ];

    // 2. Adapt highlightedVariable state for the manager (tempId -> id)
    const managerHighlightedVariable = highlightedVariable
        ? { id: highlightedVariable.tempId, source: highlightedVariable.source }
        : null;

    // Adapt the setter function to convert back (id -> tempId)
    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        // Ensure the source is one of the expected types for this component
        if (value && ['available', 'analysis', 'identifier'].includes(value.source)) {
            setHighlightedVariable({ tempId: value.id, source: value.source as UnusualCasesSource });
        } else {
            setHighlightedVariable(null);
        }
    }, [setHighlightedVariable]);

    // 3. Create onMoveVariable callback
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        const source = fromListId as UnusualCasesSource;

        switch (toListId) {
            case 'available':
                // Only allow moving back from 'analysis' or 'identifier'
                if (source === 'analysis' || source === 'identifier') {
                    moveToAvailableVariables(variable, source, targetIndex);
                }
                break;
            case 'analysis':
                // Can only move *to* analysis from available
                if (source === 'available') {
                    moveToAnalysisVariables(variable, targetIndex);
                }
                break;
            case 'identifier':
                // Can only move *to* identifier from available
                if (source === 'available') {
                     // moveToCaseIdentifierVariable doesn't take targetIndex
                    moveToCaseIdentifierVariable(variable);
                }
                break;
        }
    }, [moveToAvailableVariables, moveToAnalysisVariables, moveToCaseIdentifierVariable]);

    // 4. Create onReorderVariable callback
    const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'analysis') {
            reorderVariables(listId, variables);
        }
        // Cannot reorder 'identifier' or 'available'
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
            />
            {errorMsg && (
                <div className="col-span-2 text-red-600 text-sm mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    {errorMsg}
                </div>
            )}
        </div>
    );
};

export default VariablesTab;