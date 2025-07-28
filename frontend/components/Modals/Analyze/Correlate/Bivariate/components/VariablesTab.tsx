import React, { FC, useCallback, useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { Variable } from "@/types/Variable";
import { VariablesTabProps } from "../types";

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    testVariables,
    highlightedVariable,
    setHighlightedVariable,
    moveToAvailableVariables,
    moveToTestVariables,
    reorderVariables,
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

    const isVariableDisabled = useCallback((variable: Variable): boolean => {   
        const isNormallyValid = (variable.type === 'NUMERIC' || variable.type === 'DATE') &&
                                (variable.measure === 'scale' || variable.measure === 'ordinal');
        
        if (isNormallyValid) return false;
        if (variable.measure === 'unknown') return !allowUnknown;
        
        return true;
    }, [allowUnknown]);

    const handleDoubleClick = (variable: Variable, sourceListId: string) => {
        if (sourceListId === 'available' && isVariableDisabled(variable)) {
            return;
        }
        
        if (sourceListId === 'available') {
            moveToTestVariables(variable);
        } else if (sourceListId === 'test') {
            moveToAvailableVariables(variable);
        }
    };

    const targetLists: TargetListConfig[] = [
        {
            id: 'test',
            title: 'Test Variable(s):',
            variables: testVariables,
            height: '300px'
        }
    ];

    const managerHighlightedVariable = highlightedVariable
        ? { id: highlightedVariable.tempId, source: highlightedVariable.source }
        : null;

    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        if (value && (value.source === 'available' || value.source === 'test')) {
            setHighlightedVariable({ tempId: value.id, source: value.source as 'available' | 'test' });
        } else {
            setHighlightedVariable(null);
        }
    }, [setHighlightedVariable]);

    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        if (toListId === 'test' && isVariableDisabled(variable)) {
            return;
        }
        
        if (toListId === 'test') {
            moveToTestVariables(variable, targetIndex);
        } else if (toListId === 'available') {
            moveToAvailableVariables(variable);
        }
    }, [moveToTestVariables, moveToAvailableVariables, isVariableDisabled]);

    const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'test') {
            reorderVariables('test', variables);
        }
    }, [reorderVariables]);

    const isTourElementActive = useCallback((elementId: string) => {
        if (!tourActive || currentStep >= tourSteps.length) return false;
        return tourSteps[currentStep]?.targetId === elementId;
    }, [tourActive, currentStep, tourSteps]);

    const renderAllowUnknown = () => (
        <>
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

    // --- Render the manager component and error message ---
    return (
        <div className="space-y-2">
            <VariableListManager
                availableVariables={availableVariables}
                targetLists={targetLists}
                variableIdKey={variableIdKeyToUse}
                highlightedVariable={managerHighlightedVariable}
                setHighlightedVariable={setManagerHighlightedVariable}
                onMoveVariable={handleMoveVariable}
                onReorderVariable={handleReorderVariables}
                onVariableDoubleClick={handleDoubleClick}
                availableListHeight={'273.5px'}
                getDisplayName={getDisplayName}
                isVariableDisabled={isVariableDisabled}
                showArrowButtons={true}
                renderExtraInfoContent={renderAllowUnknown}
            />

            <div id="two-independent-samples-available-variables" className="absolute top-0 left-0 w-[48%] h-full pointer-events-none rounded-md">
                <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'two-independent-samples-available-variables')} />
            </div>
            <div id="two-independent-samples-test-variables" className="absolute top-0 right-0 w-[48%] h-full pointer-events-none rounded-md">
                <ActiveElementHighlight active={tourActive && currentStep === tourSteps.findIndex(step => step.targetId === 'two-independent-samples-test-variables')} />
            </div>
        </div>
    );
};

export default VariablesTab;