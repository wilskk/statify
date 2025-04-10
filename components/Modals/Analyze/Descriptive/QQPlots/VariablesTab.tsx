import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CornerDownLeft, CornerDownRight, Ruler, Shapes, BarChartHorizontal, InfoIcon } from "lucide-react";
import type { Variable } from "@/types/Variable";

interface VariablesTabProps {
    availableVariables: Variable[];
    selectedVariables: Variable[];
    highlightedVariable: { id: string, source: 'available' | 'selected' } | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<{ id: string, source: 'available' | 'selected' } | null>>;
    moveToSelectedVariables: (variable: Variable) => void;
    moveToAvailableVariables: (variable: Variable) => void;
}

const VariablesTab: FC<VariablesTabProps> = ({
                                                 availableVariables,
                                                 selectedVariables,
                                                 highlightedVariable,
                                                 setHighlightedVariable,
                                                 moveToSelectedVariables,
                                                 moveToAvailableVariables,
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
            moveToSelectedVariables(variable);
        } else {
            moveToAvailableVariables(variable);
        }
    };

    const handleMoveVariable = () => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'available') {
            const variable = availableVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
            if (variable) {
                moveToSelectedVariables(variable);
            }
        } else {
            const variable = selectedVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
            if (variable) {
                moveToAvailableVariables(variable);
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
        <div className="grid grid-cols-9 gap-6">
            <div className="col-span-4">
                <div className="text-sm mb-2 font-medium">Available Variables:</div>
                {renderVariableList(availableVariables, 'available', '300px')}
                <div className="text-xs mt-2 text-[#888888] flex items-center">
                    <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                    <span>Double-click to move variables between lists.</span>
                </div>
            </div>

            <div className="col-span-1 flex flex-col items-center justify-center">
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

            <div className="col-span-4">
                <div className="text-sm mb-2 font-medium">Selected Variables:</div>
                {renderVariableList(selectedVariables, 'selected', '300px')}
            </div>
        </div>
    );
};

export default VariablesTab;