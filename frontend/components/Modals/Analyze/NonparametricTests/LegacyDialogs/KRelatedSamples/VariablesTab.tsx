import React, { FC, useCallback } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Variable } from "@/types/Variable";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';
import { VariablesTabProps } from "./types";

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    testVariables,
    highlightedVariable,
    setHighlightedVariable,
    testType,
    setTestType,
    handleVariableSelect,
    handleVariableDoubleClick,
    moveToAvailableVariables,
    moveToTestVariable,
    reorderVariables,
    errorMsg,
    containerType = "dialog"
}) => {
    // --- Adapt props for VariableListManager ---
    const variableIdKeyToUse: keyof Variable = 'columnIndex';
        
    // 1. Configure the target lists
    const targetLists: TargetListConfig[] = [
        {
            id: 'selected',
            title: 'Test Variables',
            variables: testVariables,
            height: '300px',
            draggableItems: true,
            droppable: true,
        }
    ];

    // 2. Adapt highlightedVariable state
    const managerHighlightedVariable = highlightedVariable
        ? { id: highlightedVariable.tempId, source: highlightedVariable.source }
        : null;

    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        // Ensure the source is one of the expected types for this component
        if (value && ['available', 'selected'].includes(value.source)) {
            setHighlightedVariable({ tempId: value.id, source: value.source as 'available' | 'selected' });
        } else {
            setHighlightedVariable(null);
        }
    }, [setHighlightedVariable]);

    // 3. Create onMoveVariable callback
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        const source = fromListId as 'available' | 'selected';

        switch (toListId) {
            case 'available':
                if (source === 'selected') {
                    moveToAvailableVariables(variable, source, targetIndex);
                }
                break;
            case 'selected':
                moveToTestVariable(variable, targetIndex);
                break;
        }
    }, [moveToAvailableVariables, moveToTestVariable]);

    // 4. Create onReorderVariable callback
    const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'selected') {
            reorderVariables('selected', variables);
        }
    }, [reorderVariables]);

    // 5. Create variable double click handler for VariableListManager
    const handleVariableDoubleClickAdapter = useCallback((variable: Variable, sourceListId: string) => {
        if (sourceListId === 'available' || sourceListId === 'selected') {
            handleVariableDoubleClick(variable, sourceListId as 'available' | 'selected');
        }
    }, [handleVariableDoubleClick]);

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
                availableListHeight={'300px'}
                showArrowButtons={true}
                onVariableDoubleClick={handleVariableDoubleClickAdapter}
            />

            {/* Test Type Section */}
            <div className="mt-4">
                <div className="text-sm font-medium mb-2">Test Type</div>
                <div className="border p-4 rounded-md flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="friedman"
                            checked={testType.friedman}
                            onCheckedChange={(checked) => setTestType({ ...testType, friedman: !!checked })}
                            className="border-[#CCCCCC]"
                        />
                        <Label htmlFor="friedman" className="text-sm">Friedman</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="kendalls-w"
                            checked={testType.kendallsW}
                            onCheckedChange={(checked) => setTestType({ ...testType, kendallsW: !!checked })}
                            className="border-[#CCCCCC]"
                            disabled
                        />
                        <Label htmlFor="kendalls-w" className="text-sm">Kendall&rsquo;s W</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="cochrans-q"
                            checked={testType.cochransQ}
                            onCheckedChange={(checked) => setTestType({ ...testType, cochransQ: !!checked })}
                            className="border-[#CCCCCC]"
                            disabled
                        />
                        <Label htmlFor="cochrans-q" className="text-sm">Cochran&rsquo;s Q</Label>
                    </div>
                </div>
            </div>

            {errorMsg && (
                <div className="text-destructive-foreground text-sm mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded">
                    {errorMsg}
                </div>
            )}
        </div>
    );
};

export default VariablesTab;