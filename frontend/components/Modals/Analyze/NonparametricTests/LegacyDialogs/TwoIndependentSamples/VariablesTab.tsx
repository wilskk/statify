import React, { FC, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CornerDownLeft, CornerDownRight, Ruler, Shapes, BarChartHorizontal, InfoIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Variable } from "@/types/Variable";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';
import { VariablesTabProps } from "./types";

// Source types remain the same, but used internally by the parent mostly
type AllSource = 'available' | 'selected' | 'grouping';

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    testVariables,
    groupingVariable,
    group1,
    group2,
    highlightedVariable,
    setHighlightedVariable,
    testType,
    setTestType,
    handleVariableSelect,
    handleVariableDoubleClick,
    handleDefineGroupsClick,
    moveToAvailableVariables,
    moveToTestVariable,
    moveToGroupingVariable,
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
            height: '169.5px',
            draggableItems: true,
            droppable: true,
        },
        {
            id: 'grouping',
            title: 'Grouping Variable',
            variables: groupingVariable ? [groupingVariable] : [],
            height: '44px',
            maxItems: 1,
            draggableItems: true,
            droppable: true
        }
    ];

    // 2. Adapt highlightedVariable state
    const managerHighlightedVariable = highlightedVariable
        ? { id: highlightedVariable.tempId, source: highlightedVariable.source }
        : null;

    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        // Ensure the source is one of the expected types for this component
        if (value && ['available', 'selected', 'grouping'].includes(value.source)) {
            setHighlightedVariable({ tempId: value.id, source: value.source as AllSource });
        } else {
            setHighlightedVariable(null);
        }
    }, [setHighlightedVariable]);

    // 3. Create onMoveVariable callback
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        const source = fromListId as 'available' | 'selected' | 'grouping';

        switch (toListId) {
            case 'available':
                if (source === 'selected' || source === 'grouping') {
                    moveToAvailableVariables(variable, source, targetIndex);
                }
                break;
            case 'selected':
                moveToTestVariable(variable, targetIndex);
                break;
            case 'grouping':
                moveToGroupingVariable(variable, targetIndex);
                break;
        }
    }, [moveToAvailableVariables, moveToTestVariable, moveToGroupingVariable]);

    // 4. Create onReorderVariable callback
    const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'selected') {
            reorderVariables('selected', variables);
        }
        // Cannot reorder 'available' or 'grouping'
    }, [reorderVariables]);

    // 5. Create footer for grouping variable list
    const groupingFooter = useCallback((listId: string) => {
        if (listId === 'grouping') {
            return (
                <div className="mt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                        onClick={handleDefineGroupsClick}
                        disabled={!groupingVariable}
                    >
                        Define Groups...
                    </Button>
                </div>
            );
        }
        return null;
    }, [groupingVariable, handleDefineGroupsClick]);

    // Custom display name function to show group info for grouping variables
    const getCustomDisplayName = useCallback((variable: Variable): string => {
        const displayName = variable.label 
            ? `${variable.label} [${variable.name}]` 
            : variable.name;
        
        // Add group info only if this is the grouping variable
        if (groupingVariable && variable.columnIndex === groupingVariable.columnIndex) {
            const groupInfo = group1 !== null && group2 !== null ? ` (${group1}, ${group2})` : ' (?, ?)';
            return `${displayName}${groupInfo}`;
        }
        
        return displayName;
    }, [groupingVariable, group1, group2]);

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
                availableListHeight={'273.5px'}
                getDisplayName={getCustomDisplayName}
                renderListFooter={groupingFooter}
                showArrowButtons={true}
            />

            {/* Test Type Section */}
            <div className="mt-4">
                <div className="text-sm font-medium mb-2">Test Type</div>
                <div className="border p-4 rounded-md flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="mann-whitney-u"
                            checked={testType.mannWhitneyU}
                            onCheckedChange={(checked) => setTestType({ ...testType, mannWhitneyU: !!checked })}
                            className="border-[#CCCCCC]"
                        />
                        <Label htmlFor="mann-whitney-u" className="text-sm">Mann-Whitney U</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="moses-extreme-reactions"
                            checked={testType.mosesExtremeReactions}
                            onCheckedChange={(checked) => setTestType({ ...testType, mosesExtremeReactions: !!checked })}
                            className="border-[#CCCCCC]"
                            disabled
                        />
                        <Label htmlFor="moses-extreme-reactions" className="text-sm">Moses extreme reactions</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="kolmogorov-smirnov-z"
                            checked={testType.kolmogorovSmirnovZ}
                            onCheckedChange={(checked) => setTestType({ ...testType, kolmogorovSmirnovZ: !!checked })}
                            className="border-[#CCCCCC]"
                        />
                        <Label htmlFor="kolmogorov-smirnov-z" className="text-sm">Kolmogorov-Smirnov Z</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="wald-wolfowitz-runs"
                            checked={testType.waldWolfowitzRuns}
                            onCheckedChange={(checked) => setTestType({ ...testType, waldWolfowitzRuns: !!checked })}
                            className="border-[#CCCCCC]"
                            disabled
                        />
                        <Label htmlFor="wald-wolfowitz-runs" className="text-sm">Wald-Wolfowitz runs</Label>
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