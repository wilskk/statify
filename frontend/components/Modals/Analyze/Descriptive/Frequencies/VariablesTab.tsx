import React, { FC, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Variable } from "@/types/Variable";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';

export interface VariablesTabProps {
    availableVariables: Variable[];
    selectedVariables: Variable[];
    highlightedVariable: { tempId: string, source: 'available' | 'selected' } | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<{ tempId: string, source: 'available' | 'selected' } | null>>;
    moveToSelectedVariables: (variable: Variable, targetIndex?: number) => void;
    moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
    reorderVariables?: (source: 'available' | 'selected', variables: Variable[]) => void;
    showFrequencyTables: boolean;
    setShowFrequencyTables: React.Dispatch<React.SetStateAction<boolean>>;
    containerType?: "dialog" | "sidebar";
}

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    selectedVariables,
    highlightedVariable,
    setHighlightedVariable,
    moveToSelectedVariables,
    moveToAvailableVariables,
    reorderVariables = () => { console.warn("reorderVariables not implemented upstream"); },
    showFrequencyTables,
    setShowFrequencyTables,
    containerType = "dialog"
}) => {
    const variableIdKeyToUse: keyof Variable = 'tempId';

    // --- Adapt props for VariableListManager ---

    // 1. Configure the target list(s)
    const targetLists: TargetListConfig[] = [
        {
            id: 'selected',
            title: 'Variable(s):',
            variables: selectedVariables,
            height: '300px', // Changed to fixed height
            draggableItems: true,
            droppable: true
        }
    ];

    // 2. Adapt highlightedVariable state
    // Map internal state {tempId, source} to manager's {id, source}
    const managerHighlightedVariable = highlightedVariable
        ? { id: highlightedVariable.tempId, source: highlightedVariable.source }
        : null;

    // Adapt setHighlightedVariable to map back from manager's format
    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        if (value && (value.source === 'available' || value.source === 'selected')) {
            setHighlightedVariable({ tempId: value.id, source: value.source as 'available' | 'selected' });
        } else {
            setHighlightedVariable(null);
        }
    }, [setHighlightedVariable]);

    // 3. Create onMoveVariable callback
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        if (toListId === 'selected') {
            moveToSelectedVariables(variable, targetIndex);
        } else if (toListId === 'available') {
            moveToAvailableVariables(variable, targetIndex);
        }
    }, [moveToSelectedVariables, moveToAvailableVariables]);

    // 4. Create onReorderVariable callback
    const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'selected') {
            if (reorderVariables) reorderVariables('selected', variables);
        }
    }, [reorderVariables]);

    // 5. Create footer rendering function
    const renderSelectedFooter = useCallback((listId: string) => {
        if (listId === 'selected') {
            return (
                <div className="mt-4">
                    <div className="flex items-center">
                        <Checkbox
                            id="display-frequency-tables"
                            checked={showFrequencyTables}
                            onCheckedChange={(checked) => setShowFrequencyTables(!!checked)}
                            className="mr-2 h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <Label htmlFor="display-frequency-tables" className="text-sm cursor-pointer">
                            Display frequency tables
                        </Label>
                    </div>
                </div>
            );
        }
        return null;
    }, [showFrequencyTables, setShowFrequencyTables]);

    // Render wrapper divs with IDs for tour targeting
    return (
        <div className="space-y-4">
            <div id="available-variables-wrapper">
                <VariableListManager
                    availableVariables={availableVariables}
                    targetLists={targetLists}
                    variableIdKey={variableIdKeyToUse}
                    highlightedVariable={managerHighlightedVariable}
                    setHighlightedVariable={setManagerHighlightedVariable}
                    onMoveVariable={handleMoveVariable}
                    onReorderVariable={handleReorderVariables}
                    renderListFooter={renderSelectedFooter}
                />
            </div>
            <div id="selected-variables-wrapper" className="hidden">
                {/* This is just a placeholder for the tour target, actual content is in VariableListManager */}
            </div>
        </div>
    );
};

export default VariablesTab;