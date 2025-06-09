import React, { FC, useCallback, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Variable } from "@/types/Variable";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    MoveHorizontal,
    GripVertical,
    InfoIcon
} from "lucide-react";
import { HighlightedVariableInfo } from "./types";
import { Dispatch, SetStateAction } from "react";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { TourStep } from "./hooks/useTourGuide";

export interface VariablesTabProps {
    availableVariables: Variable[];
    selectedVariables: Variable[];
    highlightedVariable: HighlightedVariableInfo | null;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariableInfo | null>>;
    moveToSelectedVariables: (variable: Variable, targetIndex?: number) => void;
    moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
    reorderVariables: (source: 'available' | 'selected', variables: Variable[]) => void;
    saveStandardized: boolean;
    setSaveStandardized: Dispatch<SetStateAction<boolean>>;
    tourActive?: boolean;
    currentStep?: number;
    tourSteps?: TourStep[];
}

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    selectedVariables,
    highlightedVariable,
    setHighlightedVariable,
    moveToSelectedVariables,
    moveToAvailableVariables,
    reorderVariables,
    saveStandardized,
    setSaveStandardized,
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    const variableIdKeyToUse: keyof Variable = 'tempId';

    // Filter availableVariables to include only NUMERIC and DATE types
    const filteredAvailableVariables = useMemo(() => {
        return availableVariables.filter(
            (variable) => variable.type === 'NUMERIC' || variable.type === 'DATE'
        );
    }, [availableVariables]);

    const targetLists: TargetListConfig[] = [
        {
            id: 'selected',
            title: 'Variable(s):',
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
            const stepIndex = tourSteps.findIndex(step => step.targetId === 'save-standardized-section');
            return (
                <div className="mt-4">
                    <div id="save-standardized-section" className="flex items-center relative">
                        <Checkbox
                            id="saveStandardized"
                            checked={saveStandardized}
                            onCheckedChange={(checked) => setSaveStandardized(!!checked)}
                            className="mr-2 h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <Label htmlFor="saveStandardized" className="text-sm cursor-pointer">
                            Save standardized values as variables
                        </Label>
                        <ActiveElementHighlight active={tourActive && currentStep === stepIndex} />
                    </div>
                </div>
            );
        }
        return null;
    }, [saveStandardized, setSaveStandardized, tourActive, currentStep, tourSteps]);
    
    const availableStepIndex = tourSteps.findIndex(step => step.targetId === 'descriptive-available-variables');
    const selectedStepIndex = tourSteps.findIndex(step => step.targetId === 'descriptive-selected-variables');
    
    return (
        <div className="space-y-4">
            <div className="relative">
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
                <div id="descriptive-available-variables" className="absolute top-0 left-0 w-[48%] h-full pointer-events-none rounded-md">
                    <ActiveElementHighlight active={tourActive && currentStep === availableStepIndex} />
                </div>
                <div id="descriptive-selected-variables" className="absolute top-0 right-0 w-[48%] h-full pointer-events-none rounded-md">
                     <ActiveElementHighlight active={tourActive && currentStep === selectedStepIndex} />
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;