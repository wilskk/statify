import React, { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CornerDownLeft, CornerDownRight, Ruler, Shapes, BarChartHorizontal, InfoIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Variable } from "@/types/Variable";

interface VariablesTabProps {
    listVariables: Variable[];
    testVariables: Variable[];
    highlightedVariable: { id: string, source: 'available' | 'selected' } | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<{ id: string, source: 'available' | 'selected' } | null>>;
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
    handleSelectedVariable: (variable: Variable) => void;
    handleDeselectVariable: (variable: Variable) => void;
    handleAddExpectedValue: () => void;
    handleRemoveExpectedValue: (value: string) => void;
    handleChangeExpectedValue: (oldValue: string) => void;
}

const VariablesTab: FC<VariablesTabProps> = ({
    listVariables,
    testVariables,
    highlightedVariable,
    setHighlightedVariable,
    expectedRange,
    setExpectedRange,
    rangeValue,
    setRangeValue,
    expectedValue,
    setExpectedValue,
    expectedValueList,
    highlightedExpectedValue,
    setHighlightedExpectedValue,
    handleSelectedVariable,
    handleDeselectVariable,
    handleAddExpectedValue,
    handleRemoveExpectedValue,
    handleChangeExpectedValue
}) => {
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

    const handleVariableSelect = (variable: Variable, source: 'available' | 'selected') => {
        if (highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: variable.columnIndex.toString(), source });
        }
    };

    const handleVariableDoubleClick = (variable: Variable, source: 'available' | 'selected') => {
        if (source === 'available') {
            handleSelectedVariable(variable);
        } else {
            handleDeselectVariable(variable);
        }
    };

    const handleMoveVariable = () => {
        if (!highlightedVariable) return;
        if (highlightedVariable.source === 'available') {
            const variable = listVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
            if (variable) {
                handleSelectedVariable(variable);
            }
        } else {
            const variable = testVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
            if (variable) {
                handleDeselectVariable(variable);
            }
        }
    };

    const renderVariableList = (variables: Variable[], source: 'available' | 'selected', height: string) => (
        <div className="border border-[#E6E6E6] p-2 rounded-md overflow-y-auto overflow-x-hidden" style={{ height }}>
            <div className="space-y-1">
                {variables.map((variable) => (
                    <TooltipProvider key={variable.columnIndex}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-[#F7F7F7] ${
                                        highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === source
                                            ? "bg-[#E6E6E6] border-[#888888]"
                                            : "border-[#CCCCCC]"
                                    }`}
                                    onClick={() => handleVariableSelect(variable, source)}
                                    onDoubleClick={() => handleVariableDoubleClick(variable, source)}
                                >
                                    <div className="flex items-center w-full">
                                        {getVariableIcon(variable)}
                                        <span className="text-xs truncate">{getDisplayName(variable)}</span>
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p className="text-xs">{getDisplayName(variable)}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-7 gap-2">
            {/* List Variables */}
            <div className="col-span-3" style={{height: "340px"}}>
                <div className="text-sm mb-2 font-medium">List Variables:</div>
                {renderVariableList(listVariables, 'available', '288px')}
                <div className="text-xs mt-2 text-[#888888] flex items-center">
                    <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                    <span>Double-click to move variables between lists.</span>
                </div>
            </div>

            {/* Move Buttons */}
            <div className="col-span-1 flex flex-col items-center justify-center space-y-32">
                <Button
                    variant="outline"
                    size="sm"
                    className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                    onClick={handleMoveVariable}
                    disabled={!highlightedVariable}
                >
                    {highlightedVariable?.source === 'selected' ?
                        <CornerDownLeft size={16} /> :
                        <CornerDownRight size={16} />
                    }
                </Button>
            </div>

            {/* Test Variables */}
            <div className="col-span-3" style={{minHeight: "340px"}}>
                <div className="text-sm mb-2 font-medium">Test Variables List:</div>
                {renderVariableList(testVariables, 'selected', '300px')}
            </div>

            {/* Expected Range */}
            <div className="col-span-3">
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
                                className="border-[#CCCCCC] w-3 h-3 data-[state=checked]:bg-black data-[state=checked]:border-black"
                            />
                            <Label htmlFor="getFromData" className="text-xs">Get from data</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem
                                value="useSpecificRange"
                                id="useSpecificRange"
                                className="border-[#CCCCCC] w-3 h-3 data-[state=checked]:bg-black data-[state=checked]:border-black"
                            />
                            <Label htmlFor="useSpecificRange" className="text-xs">Use specified range</Label>
                        </div>
                    </RadioGroup>
                    <div className="grid gap-1 mt-1 ml-6">
                        <div className="grid grid-cols-[50px_1fr] gap-1 flex items-center space-x-2">
                            <Label htmlFor="lowerValue" className={`col-span-1 text-xs ${!expectedRange.useSpecificRange ? 'opacity-50' : ''}`}>Lower:</Label>
                            <input
                                id="lowerValue"
                                type="number"
                                disabled={!expectedRange.useSpecificRange}
                                value={rangeValue.lowerValue || ""}
                                onChange={(e) => setRangeValue({
                                    ...rangeValue,
                                    lowerValue: e.target.value ? Number(e.target.value) : null
                                })}
                                className={`col-span-1 w-24 text-xs border rounded-md p-1 ${
                                    !expectedRange.useSpecificRange 
                                        ? 'text-[#888888]' 
                                        : ''
                                }`}
                            />
                        </div>
                        <div className="grid grid-cols-[50px_1fr] gap-1 flex items-center space-x-2">
                            <Label htmlFor="upperValue" className={`col-span-1 text-xs ${!expectedRange.useSpecificRange ? 'opacity-50' : ''}`}>Upper:</Label>
                            <input
                                id="upperValue"
                                type="number"
                                disabled={!expectedRange.useSpecificRange}
                                value={rangeValue.upperValue || ""}
                                onChange={(e) => setRangeValue({
                                    ...rangeValue,
                                    upperValue: e.target.value ? Number(e.target.value) : null
                                })}
                                className={`col-span-1 w-24 text-xs border rounded-md p-1 ${
                                    !expectedRange.useSpecificRange 
                                        ? 'text-[#888888]' 
                                        : ''
                                }`}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-span-1"></div>

            {/* Expected Value */}
            <div className="col-span-3">
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
                                className="border-[#CCCCCC] w-3 h-3 data-[state=checked]:bg-black data-[state=checked]:border-black"
                                onClick={() => setHighlightedExpectedValue(null)}
                            />
                            <Label htmlFor="allCategoriesEqual" className="text-xs">All categories equal</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem
                                value="values"
                                id="values"
                                className="border-[#CCCCCC] w-3 h-3 data-[state=checked]:bg-black data-[state=checked]:border-black"
                            />
                            <Label htmlFor="values" className="text-xs">Values:</Label>
                            <input
                                type="number"
                                disabled={expectedValue.allCategoriesEqual}
                                value={expectedValue.inputValue || ""}
                                onChange={(e) => setExpectedValue({
                                    ...expectedValue,
                                    inputValue: e.target.value ? Number(e.target.value) : null
                                })}
                                className={`col-span-1 w-24 text-xs border rounded-md p-1 ${
                                    !expectedValue.values 
                                        ? 'text-[#888888]' 
                                        : ''
                                }`}
                            />
                        </div>
                        <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-1"></div>
                            <div className="col-span-4 flex flex-col justify-center space-y-1">
                                <Button
                                    variant="outline"
                                    className="h-[26px] text-xs border rounded-md p-1"
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
                                    className="h-[26px] text-xs border rounded-md p-1"
                                    disabled={highlightedExpectedValue === null || expectedValue.allCategoriesEqual || expectedValue.inputValue === null}
                                    onClick={() => {
                                        if (highlightedExpectedValue) {
                                            handleChangeExpectedValue(highlightedExpectedValue);
                                            setHighlightedExpectedValue(null);
                                        }
                                    }}
                                >
                                    Change
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-[26px] text-xs border rounded-md p-1"
                                    disabled={highlightedExpectedValue === null || expectedValue.allCategoriesEqual}
                                    onClick={() => {
                                        if (highlightedExpectedValue) {
                                            handleRemoveExpectedValue(highlightedExpectedValue);
                                            setHighlightedExpectedValue(null);
                                        }
                                    }}
                                >
                                    Remove
                                </Button>
                            </div>
                            <div className={`col-span-7 border border-[#E6E6E6] ${expectedValue.allCategoriesEqual ? 'opacity-50' : ''} p-2 rounded-md overflow-y-auto overflow-x-hidden`} style={{ height: "168px" }}>
                            {/* <div className="col-span-7 border border-[#E6E6E6] p-2 rounded-md overflow-y-auto overflow-x-hidden " style={{ height: "168px" }}> */}
                                <div className="space-y-1">
                                    {expectedValueList.map((value, index) => (
                                        <div
                                            key={`${value}-${index}`}
                                            className={`flex items-center p-1 cursor-pointer border rounded-md ${
                                                !expectedValue.allCategoriesEqual ? 'hover:bg-[#F7F7F7]' : ''} ${
                                                highlightedExpectedValue === value ? "bg-[#E6E6E6] border-[#888888]" : "border-[#CCCCCC]"
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
    );
};

export default VariablesTab;