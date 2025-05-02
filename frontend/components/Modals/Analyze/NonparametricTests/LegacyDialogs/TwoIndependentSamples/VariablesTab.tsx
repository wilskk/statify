import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CornerDownLeft, CornerDownRight, Ruler, Shapes, BarChartHorizontal, InfoIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Variable } from "@/types/Variable";

interface VariablesTabProps {
    listVariables: Variable[];
    testVariables: Variable[];
    groupingVariable: Variable | null;
    group1: number | null;
    group2: number | null;
    highlightedVariable: { id: string, source: 'available' | 'selected' | 'grouping' } | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<{ id: string, source: 'available' | 'selected' | 'grouping' } | null>>;
    testType: {
        mannWhitneyU: boolean;
        mosesExtremeReactions: boolean;
        kolmogorovSmirnovZ: boolean;
        waldWolfowitzRuns: boolean;
    };
    setTestType: React.Dispatch<React.SetStateAction<{
        mannWhitneyU: boolean;
        mosesExtremeReactions: boolean;
        kolmogorovSmirnovZ: boolean;
        waldWolfowitzRuns: boolean;
    }>>;
    handleSelectedVariable: (variable: Variable) => void;
    handleDeselectVariable: (variable: Variable) => void;
    handleSelectGroupVariable: (variable: Variable) => void;
    handleDeselectGroupVariable: () => void;
    setShowDefineGroupsModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const VariablesTab: FC<VariablesTabProps> = ({
    listVariables,
    testVariables,
    groupingVariable,
    group1,
    group2,
    highlightedVariable,
    setHighlightedVariable,
    testType,
    setTestType,
    handleSelectedVariable,
    handleDeselectVariable,
    handleSelectGroupVariable,
    handleDeselectGroupVariable,
    setShowDefineGroupsModal
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

    const handleVariableSelect = (variable: Variable, source: 'available' | 'selected' | 'grouping') => {
        const variableId = variable.columnIndex.toString();
        
        if (highlightedVariable?.id === variableId && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: variableId, source });
        }
    };

    const handleVariableDoubleClick = (variable: Variable, source: 'available' | 'selected' | 'grouping') => {
        if (source === 'available') {
            // Determine if it should go to test variables or grouping variable
            if (!groupingVariable) {
                // Ask user if they want to use it as a grouping variable
                const useAsGrouping = window.confirm(`Use ${getDisplayName(variable)} as grouping variable?`);
                if (useAsGrouping) {
                    handleSelectGroupVariable(variable);
                } else {
                    handleSelectedVariable(variable);
                }
            } else {
                // Already have a grouping variable, so add to test variables
                handleSelectedVariable(variable);
            }
        } else if (source === 'selected') {
            handleDeselectVariable(variable);
        } else if (source === 'grouping') {
            handleDeselectGroupVariable();
        }
    };

    return (
        <div className="grid grid-cols-7 gap-4">
            {/* List Variables */}
            <div className="col-span-3" style={{height: "325.5px"}}>
                <div className="text-sm mb-2 font-medium">List Variables:</div>
                <div className="border border-[#E6E6E6] p-2 rounded-md overflow-y-auto" style={{height: "273.5px"}}>
                    <div className="space-y-1">
                        {listVariables.map((variable) => (
                            <TooltipProvider key={variable.columnIndex}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-[#F7F7F7] ${
                                                highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === 'available'
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
                                const variable = listVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
                                if (variable) handleSelectedVariable(variable);
                            } else if (highlightedVariable.source === 'selected') {
                                const variable = testVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
                                if (variable) handleDeselectVariable(variable);
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
                                const variable = listVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
                                if (variable) handleSelectGroupVariable(variable);
                            } else if (highlightedVariable.source === 'grouping') {
                                handleDeselectGroupVariable();
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
                                                    highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === 'selected'
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
                                                highlightedVariable?.id === groupingVariable.columnIndex.toString() && highlightedVariable.source === 'grouping'
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
                            onClick={() => setShowDefineGroupsModal(true)}
                            disabled={!groupingVariable}
                        >
                            Define Groups...
                        </Button>
                    </div>
                </div>
            </div>

            {/* Test Type */}
            <div className="col-span-7 mt-4">
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
                        />
                        <Label htmlFor="wald-wolfowitz-runs" className="text-sm">Wald-Wolfowitz runs</Label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;