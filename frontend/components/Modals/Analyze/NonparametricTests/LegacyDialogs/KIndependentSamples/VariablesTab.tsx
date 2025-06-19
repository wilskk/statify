import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CornerDownLeft, CornerDownRight, Ruler, Shapes, BarChartHorizontal, InfoIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Variable } from "@/types/Variable";
import { VariablesTabProps } from "./types";

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
    errorMsg
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

    return (
        <div className="grid grid-cols-7 gap-4">
            {/* Available Variables */}
            <div className="col-span-3" style={{height: "325.5px"}}>
                <div className="text-sm mb-2 font-medium">List Variables:</div>
                <div className="border border-[#E6E6E6] p-2 rounded-md overflow-y-auto" style={{height: "273.5px"}}>
                    <div className="space-y-1">
                        {availableVariables.map((variable) => (
                            <TooltipProvider key={variable.columnIndex}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-[#F7F7F7] ${
                                                highlightedVariable?.tempId === variable.columnIndex.toString() && highlightedVariable.source === 'available'
                                                    ? "bg-[#E6E6E6] border-[#888888]"
                                                    : "border-[#CCCCCC]"
                                            }`}
                                            onClick={() => handleVariableSelect(variable, 'available')}
                                            onDoubleClick={() => handleVariableDoubleClick(variable, 'available')}
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
                <div className="text-xs mt-2 text-[#888888] flex items-center">
                    <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                    <span>Double-click to move variables between lists.</span>
                </div>
            </div>

            {/* Move Buttons */}
            <div className="col-span-1 flex flex-col items-center justify-between" style={{height: "325.5px"}}>
                {/* Test Variable Move Button */}
                <div className="mt-24">
                    <Button
                        variant="outline"
                        size="sm"
                        className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                        onClick={() => {
                            if (!highlightedVariable) return;
                            
                            if (highlightedVariable.source === 'available') {
                                const variable = availableVariables.find(v => v.columnIndex.toString() === highlightedVariable.tempId);
                                if (variable) moveToTestVariable(variable);
                            } else if (highlightedVariable.source === 'selected') {
                                const variable = testVariables.find(v => v.columnIndex.toString() === highlightedVariable.tempId);
                                if (variable) moveToAvailableVariables(variable, 'selected');
                            }
                        }}
                        disabled={!highlightedVariable || highlightedVariable.source === 'grouping'}
                    >
                        {highlightedVariable?.source === 'selected' ?
                            <CornerDownLeft size={16} /> :
                            <CornerDownRight size={16} />
                        }
                    </Button>
                </div>

                {/* Grouping Variable Move Button */}
                <div className="mb-11">
                    <Button
                        variant="outline"
                        size="sm"
                        className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                        onClick={() => {
                            if (!highlightedVariable) return;
                            
                            if (highlightedVariable.source === 'available') {
                                const variable = availableVariables.find(v => v.columnIndex.toString() === highlightedVariable.tempId);
                                if (variable) moveToGroupingVariable(variable);
                            } else if (highlightedVariable.source === 'grouping') {
                                const variable = groupingVariable;
                                if (variable) moveToAvailableVariables(variable, 'grouping');
                            }
                        }}
                        disabled={
                            !highlightedVariable || 
                            highlightedVariable.source === 'selected' || 
                            (highlightedVariable.source === 'available' && groupingVariable !== null)
                        }
                    >
                        {highlightedVariable?.source === 'grouping' ?
                            <CornerDownLeft size={16} /> :
                            <CornerDownRight size={16} />
                        }
                    </Button>
                </div>
            </div>

            {/* Variables Panel */}
            <div className="col-span-3" style={{height: "325.5px"}}>
                {/* Test Variables */}
                <div>
                    <div className="text-sm mb-2 font-medium">Test Variables:</div>
                    <div className="border border-[#E6E6E6] p-2 rounded-md overflow-y-auto" style={{height: "169.5px"}}>
                        <div className="space-y-1">
                            {testVariables.map((variable) => (
                                <TooltipProvider key={variable.columnIndex}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-[#F7F7F7] ${
                                                    highlightedVariable?.tempId === variable.columnIndex.toString() && highlightedVariable.source === 'selected'
                                                        ? "bg-[#E6E6E6] border-[#888888]"
                                                        : "border-[#CCCCCC]"
                                                }`}
                                                onClick={() => handleVariableSelect(variable, 'selected')}
                                                onDoubleClick={() => handleVariableDoubleClick(variable, 'selected')}
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
                </div>

                {/* Grouping Variable */}
                <div className="mt-4">
                    <div className="text-sm mb-2 font-medium">Grouping Variable:</div>
                    <div className="border border-[#E6E6E6] p-2 rounded-md" style={{height: "44px"}}>
                        {groupingVariable ? (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-[#F7F7F7] ${
                                                highlightedVariable?.tempId === groupingVariable.columnIndex.toString() && highlightedVariable.source === 'grouping'
                                                    ? "bg-[#E6E6E6] border-[#888888]"
                                                    : "border-[#CCCCCC]"
                                            }`}
                                            onClick={() => handleVariableSelect(groupingVariable, 'grouping')}
                                            onDoubleClick={() => handleVariableDoubleClick(groupingVariable, 'grouping')}
                                        >
                                            <div className="flex items-center w-full">
                                                {getVariableIcon(groupingVariable)}
                                                <span className="text-xs truncate">
                                                    {getDisplayName(groupingVariable)}
                                                    {group1 !== null && group2 !== null ? ` (${group1}, ${group2})` : ' (?, ?)'}
                                                </span>
                                            </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        <p className="text-xs">
                                            {getDisplayName(groupingVariable)}
                                            {group1 !== null && group2 !== null ? ` (${group1}, ${group2})` : ' (?, ?)'}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ) : (
                            <div className="text-xs text-gray-500 p-1 flex items-center justify-center h-full">
                                No grouping variable selected
                            </div>
                        )}
                    </div>
                    <div className="mt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                            onClick={handleDefineGroupsClick}
                            disabled={!groupingVariable}
                        >
                            Define Range...
                        </Button>
                    </div>
                </div>
            </div>

            {/* Test Type */}
            <div className="col-span-7 mt-4">
                <div className="text-sm font-medium mb-2">Test Type</div>
                <div className="border p-4 rounded-md flex flex-wrap gap-16 items-center">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="kruskal-wallis-h"
                            checked={testType.kruskalWallisH}
                            onCheckedChange={(checked) => setTestType({ ...testType, kruskalWallisH: !!checked })}
                            className="border-[#CCCCCC]"
                        />
                        <Label htmlFor="kruskal-wallis-h" className="text-sm">Kruskal-Wallis H</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="median"
                            checked={testType.median}
                            onCheckedChange={(checked) => setTestType({ ...testType, median: !!checked })}
                            className="border-[#CCCCCC]"
                            disabled
                        />
                        <Label htmlFor="median" className="text-sm">Median</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="jonckheere-terpstra"
                            checked={testType.jonckheereTerpstra}
                            onCheckedChange={(checked) => setTestType({ ...testType, jonckheereTerpstra: !!checked })}
                            className="border-[#CCCCCC]"
                            disabled
                        />
                        <Label htmlFor="jonckheere-terpstra" className="text-sm">Jonckheere-Terpstra</Label>
                    </div>
                </div>
            </div>

            {/* Error message */}
            {errorMsg && (
                <div className="col-span-7 mt-2 text-red-600 text-sm">{errorMsg}</div>
            )}
        </div>
    );
};

export default VariablesTab;