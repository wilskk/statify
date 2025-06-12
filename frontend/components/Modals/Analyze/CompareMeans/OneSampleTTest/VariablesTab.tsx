import React, { FC, useCallback, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Variable } from "@/types/Variable";
import { HighlightedVariableInfo } from "./types";
import { Dispatch, SetStateAction } from "react";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';

export interface VariablesTabProps {
    availableVariables: Variable[];
    selectedVariables: Variable[];
    highlightedVariable: HighlightedVariableInfo | null;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariableInfo | null>>;
    moveToSelectedVariables: (variable: Variable, targetIndex?: number) => void;
    moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
    reorderVariables: (source: 'available' | 'selected', variables: Variable[]) => void;
    testValue: number;
    setTestValue: Dispatch<SetStateAction<number>>;
    estimateEffectSize: boolean;
    setEstimateEffectSize: Dispatch<SetStateAction<boolean>>;
}

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    selectedVariables,
    highlightedVariable,
    setHighlightedVariable,
    moveToSelectedVariables,
    moveToAvailableVariables,
    reorderVariables,
    testValue,
    setTestValue,
    estimateEffectSize,
    setEstimateEffectSize
}) => {
    const variableIdKeyToUse: keyof Variable = 'tempId';

    // Filter availableVariables to include only NUMERIC types
    const filteredAvailableVariables = useMemo(() => {
        return availableVariables.filter(
            (variable) => variable.type === 'NUMERIC'
        );
    }, [availableVariables]);

    const targetLists: TargetListConfig[] = [
        {
            id: 'selected',
            title: 'Test Variables:',
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

    const renderSelectedFooter = useCallback((listId: string) => {
        if (listId === 'selected') {
            return (
                <div className="mt-4 space-y-2">
                    <div className="flex items-center">
                        <Label htmlFor="test-value" className="mr-2 text-sm">Test Value:</Label>
                        <Input
                            id="test-value"
                            type="number"
                            value={testValue}
                            onChange={(e) => setTestValue(Number(e.target.value))}
                            className="w-24 h-8 text-sm"
                        />
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="estimate-effect-size"
                            checked={estimateEffectSize}
                            onCheckedChange={(checked) => setEstimateEffectSize(!!checked)}
                            className="mr-2 h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <Label htmlFor="estimate-effect-size" className="text-sm cursor-pointer">
                            Estimate effect size
                        </Label>
                    </div>
                </div>
            );
        }
        return null;
    }, [testValue, setTestValue, estimateEffectSize, setEstimateEffectSize]);

    return (
        <VariableListManager
            availableVariables={filteredAvailableVariables}
            targetLists={targetLists}
            variableIdKey={variableIdKeyToUse}
            highlightedVariable={managerHighlightedVariable}
            setHighlightedVariable={setManagerHighlightedVariable}
            onMoveVariable={handleMoveVariable}
            onReorderVariable={handleReorderVariables}
            renderListFooter={renderSelectedFooter}
        />
    );
};

export default VariablesTab;