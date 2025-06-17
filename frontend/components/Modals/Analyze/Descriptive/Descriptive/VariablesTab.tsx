import React, { FC, useCallback, useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Variable } from "@/types/Variable";
import { HighlightedVariableInfo } from "./types";
import { Dispatch, SetStateAction } from "react";
import VariableListManager, { TargetListConfig } from "@/components/Common/VariableListManager";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { TourStep } from "./hooks/useTourGuide";
import { InfoIcon } from "lucide-react";

export interface VariablesTabProps {
    availableVariables: Variable[];
    selectedVariables: Variable[];
    highlightedVariable: HighlightedVariableInfo | null;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariableInfo | null>>;
    moveToSelectedVariables: (variable: Variable, targetIndex?: number) => void;
    moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
    reorderVariables: (source: 'selected', variables: Variable[]) => void;
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
    const [allowUnknown, setAllowUnknown] = useState(false);

    const getDisplayName = (variable: Variable) => {
        if (!variable.label) return variable.name;
        return `${variable.label} [${variable.name}]`;
    };

    const isVariableDisabled = (variable: Variable): boolean => {
        const isNormallyValid = (variable.type === 'NUMERIC' || variable.type === 'DATE') && 
                                (variable.measure === 'scale' || variable.measure === 'ordinal');
        
        if (isNormallyValid) return false;
        if (variable.measure === 'unknown') return !allowUnknown;
        
        return true;
    };

    const handleDoubleClick = (variable: Variable, sourceListId: string) => {
        // Prevent moving from available to selected if it's disabled
        if (sourceListId === 'available' && isVariableDisabled(variable)) {
            return;
        }

        if (sourceListId === 'available') {
            moveToSelectedVariables(variable);
        } else if (sourceListId === 'selected') {
            // Always allow moving back to available
            moveToAvailableVariables(variable);
        }
    };

    const targetLists: TargetListConfig[] = [
        {
            id: 'selected',
            title: 'Variable(s):',
            variables: selectedVariables,
            height: '300px',
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
        // Prevent moving to selected if it's disabled
        if (toListId === 'selected' && isVariableDisabled(variable)) {
            return;
        }

        if (toListId === 'selected') {
            moveToSelectedVariables(variable, targetIndex);
        } else if (toListId === 'available') {
            moveToAvailableVariables(variable, targetIndex);
        }
    }, [moveToSelectedVariables, moveToAvailableVariables, allowUnknown]);

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

    const renderExtraInfo = () => (
        <>
            <div className="text-xs text-muted-foreground flex items-center p-1.5 rounded bg-accent border border-border mt-2">
                <InfoIcon size={14} className="mr-1.5 flex-shrink-0 text-muted-foreground" />
                <span>Drag or double-click to move variables.</span>
            </div>
            <div className="flex items-center mt-2 p-1.5">
                <Checkbox
                    id="allowUnknown"
                    checked={allowUnknown}
                    onCheckedChange={(checked: boolean) => setAllowUnknown(checked)}
                    className="mr-2 h-4 w-4"
                />
                <Label htmlFor="allowUnknown" className="text-sm cursor-pointer">
                    Treat &apos;unknown&apos; as Scale and allow selection
                </Label>
            </div>
        </>
    );
    
    return (
        <div className="space-y-4">
            <div className="relative">
                <VariableListManager
                    availableVariables={availableVariables}
                    targetLists={targetLists}
                    variableIdKey={variableIdKeyToUse}
                    highlightedVariable={managerHighlightedVariable}
                    setHighlightedVariable={setManagerHighlightedVariable}
                    onMoveVariable={handleMoveVariable}
                    onReorderVariable={handleReorderVariables}
                    onVariableDoubleClick={handleDoubleClick}
                    getDisplayName={getDisplayName}
                    isVariableDisabled={isVariableDisabled}
                    showArrowButtons={true}
                    renderListFooter={renderSelectedFooter}
                    renderExtraInfoContent={renderExtraInfo}
                />
                <div id="descriptive-available-variables" className="absolute top-0 left-0 w-[48%] h-full pointer-events-none rounded-md">
             <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'descriptive-available-variables')} />
                </div>
                <div id="descriptive-selected-variables" className="absolute top-0 right-0 w-[48%] h-full pointer-events-none rounded-md">
             <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'descriptive-selected-variables')} />
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;