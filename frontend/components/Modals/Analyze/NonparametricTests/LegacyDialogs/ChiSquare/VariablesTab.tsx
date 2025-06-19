import React, { FC, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CornerDownLeft, CornerDownRight, Ruler, Shapes, BarChartHorizontal, InfoIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Variable } from "@/types/Variable";
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
    expectedRange: {
        getFromData: boolean;
        useSpecificRange: boolean;
    };
    setExpectedRange: React.Dispatch<React.SetStateAction<{
        getFromData: boolean;
        useSpecificRange: boolean;
    }>>;
    rangeValue: {
        lowerValue: number | null;
        upperValue: number | null;
    };
    setRangeValue: React.Dispatch<React.SetStateAction<{
        lowerValue: number | null;
        upperValue: number | null;
    }>>;
    expectedValue: {
        allCategoriesEqual: boolean;
        values: boolean;
        inputValue: number | null;
    };
    setExpectedValue: React.Dispatch<React.SetStateAction<{
        allCategoriesEqual: boolean;
        values: boolean;
        inputValue: number | null;
    }>>;
    expectedValueList: string[];
    setExpectedValueList: React.Dispatch<React.SetStateAction<string[]>>;
    highlightedExpectedValue: string | null;
    setHighlightedExpectedValue: React.Dispatch<React.SetStateAction<string | null>>;
    handleAddExpectedValue: () => void;
    handleRemoveExpectedValue: (value: string) => void;
    handleChangeExpectedValue: (oldValue: string) => void;
}

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    selectedVariables,
    highlightedVariable,
    setHighlightedVariable,
    moveToSelectedVariables,
    moveToAvailableVariables,
    reorderVariables,
    expectedRange,
    setExpectedRange,
    rangeValue,
    setRangeValue,
    expectedValue,
    setExpectedValue,
    expectedValueList,
    highlightedExpectedValue,
    setHighlightedExpectedValue,
    handleAddExpectedValue,
    handleRemoveExpectedValue,
    handleChangeExpectedValue
}) => {
    const variableIdKeyToUse: keyof Variable = 'tempId';

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

    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-[#888888] mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
        }
    };

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    return (
        <div className="space-y-6">
            <VariableListManager
                availableVariables={availableVariables}
                targetLists={targetLists}
                variableIdKey={variableIdKeyToUse}
                highlightedVariable={managerHighlightedVariable}
                setHighlightedVariable={setManagerHighlightedVariable}
                onMoveVariable={handleMoveVariable}
                onReorderVariable={handleReorderVariables}
            />

            <div className="grid grid-cols-2 gap-4">
                {/* Expected Range */}
                <div>
                    <div className="text-sm mb-2 font-medium">Expected Range</div>
                    <div className="border py-2 px-4 rounded-md">
                        <RadioGroup
                            value={expectedRange.getFromData ? "getFromData" : "useSpecificRange"}
                            className="gap-2"
                            onValueChange={(value) => setExpectedRange({
                                ...expectedRange,
                                getFromData: value === "getFromData",
                                useSpecificRange: value === "useSpecificRange"
                            })}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="getFromData"
                                    id="getFromData"
                                />
                                <Label htmlFor="getFromData" className="text-sm">Get from data</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="useSpecificRange"
                                    id="useSpecificRange"
                                />
                                <Label htmlFor="useSpecificRange" className="text-sm">Use specified range</Label>
                            </div>
                        </RadioGroup>
                        <div className="grid gap-1 mt-1 ml-6">
                            <div className="grid grid-cols-[50px_1fr] gap-1 flex items-center space-x-2">
                                <Label htmlFor="lowerValue" className={`col-span-1 text-sm ${!expectedRange.useSpecificRange ? 'opacity-50' : ''}`}>Lower:</Label>
                                <input
                                    id="lowerValue"
                                    type="number"
                                    disabled={!expectedRange.useSpecificRange}
                                    value={rangeValue.lowerValue || ""}
                                    onChange={(e) => setRangeValue({
                                        ...rangeValue,
                                        lowerValue: e.target.value ? Number(e.target.value) : null
                                    })}
                                    className={`col-span-1 w-24 text-sm border rounded-md p-1 ${
                                        !expectedRange.useSpecificRange 
                                            ? 'text-muted-foreground' 
                                            : ''
                                    }`}
                                />
                            </div>
                            <div className="grid grid-cols-[50px_1fr] gap-1 flex items-center space-x-2">
                                <Label htmlFor="upperValue" className={`col-span-1 text-sm ${!expectedRange.useSpecificRange ? 'opacity-50' : ''}`}>Upper:</Label>
                                <input
                                    id="upperValue"
                                    type="number"
                                    disabled={!expectedRange.useSpecificRange}
                                    value={rangeValue.upperValue || ""}
                                    onChange={(e) => setRangeValue({
                                        ...rangeValue,
                                        upperValue: e.target.value ? Number(e.target.value) : null
                                    })}
                                    className={`col-span-1 w-24 text-sm border rounded-md p-1 ${
                                        !expectedRange.useSpecificRange 
                                            ? 'text-muted-foreground' 
                                            : ''
                                    }`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expected Value */}
                <div>
                    <div className="text-sm mb-2 font-medium">Expected Value</div>
                    <div className="border py-2 px-4 rounded-md">
                        <RadioGroup
                            value={expectedValue.allCategoriesEqual ? "allCategoriesEqual" : "values"}
                            className="gap-1"
                            onValueChange={(value) => setExpectedValue({
                                ...expectedValue,
                                allCategoriesEqual: value === "allCategoriesEqual",
                                values: value === "values"
                            })}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="allCategoriesEqual"
                                    id="allCategoriesEqual"
                                    onClick={() => setHighlightedExpectedValue(null)}
                                />
                                <Label htmlFor="allCategoriesEqual" className="text-sm">All categories equal</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="values"
                                    id="values"
                                />
                                <Label htmlFor="values" className="text-sm">Values:</Label>
                                <input
                                    type="number"
                                    disabled={expectedValue.allCategoriesEqual}
                                    value={expectedValue.inputValue || ""}
                                    onChange={(e) => setExpectedValue({
                                        ...expectedValue,
                                        inputValue: e.target.value ? Number(e.target.value) : null
                                    })}
                                    className={`col-span-1 w-24 text-sm border rounded-md p-1 ${
                                        !expectedValue.values 
                                            ? 'text-muted-foreground' 
                                            : ''
                                    }`}
                                />
                            </div>
                            <div className="grid grid-cols-12 gap-2 mt-2">
                                <div className="col-span-4 flex flex-col justify-center space-y-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        disabled={
                                            expectedValue.allCategoriesEqual ||
                                            expectedValue.inputValue === null || 
                                            expectedValue.inputValue === 0
                                        }
                                        onClick={handleAddExpectedValue}
                                    >
                                        Add
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        disabled={highlightedExpectedValue === null || expectedValue.allCategoriesEqual || expectedValue.inputValue === null}
                                        onClick={() => {
                                            if (highlightedExpectedValue) {
                                                handleChangeExpectedValue(highlightedExpectedValue);
                                            }
                                        }}
                                    >
                                        Change
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        disabled={highlightedExpectedValue === null || expectedValue.allCategoriesEqual}
                                        onClick={() => {
                                            if (highlightedExpectedValue) {
                                                handleRemoveExpectedValue(highlightedExpectedValue);
                                            }
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </div>
                                <div className={`col-span-8 border p-2 rounded-md overflow-y-auto ${expectedValue.allCategoriesEqual ? 'opacity-50' : ''}`} style={{ height: "120px" }}>
                                    <div className="space-y-1">
                                        {expectedValueList.map((value, index) => (
                                            <div
                                                key={`${value}-${index}`}
                                                className={`flex items-center p-1 cursor-pointer border rounded-md ${
                                                    !expectedValue.allCategoriesEqual ? 'hover:bg-muted' : ''} ${
                                                    highlightedExpectedValue === value ? "bg-muted border-muted-foreground" : ""
                                                }`}
                                                onClick={() => !expectedValue.allCategoriesEqual && setHighlightedExpectedValue(value)}
                                            >
                                                <div className="flex items-center w-full">
                                                    <span className="text-xs truncate">{value}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;