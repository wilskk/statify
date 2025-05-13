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
    highlightedVariable: { id: string, source: 'available' | 'selected' } | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<{ id: string, source: 'available' | 'selected' } | null>>;
    testType: {
        friedman: boolean;
        kendallsW: boolean;
        cochransQ: boolean;
    };
    setTestType: React.Dispatch<React.SetStateAction<{
        friedman: boolean;
        kendallsW: boolean;
        cochransQ: boolean;
    }>>;
    handleSelectedVariable: (variable: Variable) => void;
    handleDeselectVariable: (variable: Variable) => void;
}

const VariablesTab: FC<VariablesTabProps> = (
    {
        listVariables,
        testVariables,
        highlightedVariable,
        setHighlightedVariable,
        testType,
        setTestType,
        handleSelectedVariable,
        handleDeselectVariable,
    }
) => {
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
                <div className="text-sm mb-2 font-medium">Test Variables:</div>
                {renderVariableList(testVariables, 'selected', '300px')}
            </div>

            {/* Test Type */}
            <div className="col-span-7 ">
                <div className="text-sm font-medium mb-4">Test Type</div>
                {/* <Label htmlFor="test-type" className="font-semibold text-base">Cut Point</Label> */}
                <div className="border p-4 rounded-md flex space-x-12 items-center">
                    <div className="flex items-center">
                        <Checkbox
                            id="friedman"
                            checked={testType.friedman}
                            onCheckedChange={(checked) => setTestType({ ...testType, friedman: !!checked })}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="friedman-option">Friedman</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="kendalls-w"
                            checked={testType.kendallsW}
                            onCheckedChange={(checked) => setTestType({ ...testType, kendallsW: !!checked })}
                            className="mr-2 border-[#CCCCCC]"
                            disabled
                        />
                        <Label htmlFor="kendalls-w-option">Kendall&rsquo;s W</Label>
                    </div>
                    <div className="flex items-center">
                        <Checkbox
                            id="cochrans-q"
                            checked={testType.cochransQ}
                            onCheckedChange={(checked) => setTestType({ ...testType, cochransQ: !!checked })}
                            className="mr-2 border-[#CCCCCC]"
                            disabled
                        />
                        <Label htmlFor="cochrans-q-option">Cochran&rsquo;s Q</Label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;