import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Variable } from "@/types/Variable";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    ChevronRight,
    InfoIcon
} from "lucide-react";

interface VariablesTabProps {
    storeVariables: Variable[];
    highlightedVariable: string | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<string | null>>;
    numeratorVariable: Variable | null;
    denominatorVariable: Variable | null;
    groupVariable: Variable | null;
    setAsNumerator: () => void;
    setAsDenominator: () => void;
    setAsGroupVariable: () => void;
}

const VariablesTab: FC<VariablesTabProps> = ({
                                                 storeVariables,
                                                 highlightedVariable,
                                                 setHighlightedVariable,
                                                 numeratorVariable,
                                                 denominatorVariable,
                                                 groupVariable,
                                                 setAsNumerator,
                                                 setAsDenominator,
                                                 setAsGroupVariable
                                             }) => {
    const handleVariableClick = (columnIndex: string) => {
        setHighlightedVariable(columnIndex === highlightedVariable ? null : columnIndex);
    };

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
        <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-6 gap-6">
                {/* Left side - Variable list */}
                <div className="col-span-3">
                    <div className="text-sm mb-2 font-medium">Variables:</div>
                    <div className="border border-[#E6E6E6] p-2 rounded-md overflow-y-auto overflow-x-hidden" style={{ height: '250px' }}>
                        <div className="space-y-1">
                            {storeVariables.map((variable) => (
                                <TooltipProvider key={variable.columnIndex}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-[#F7F7F7] ${
                                                    highlightedVariable === variable.columnIndex.toString()
                                                        ? "bg-[#E6E6E6] border-[#888888]"
                                                        : "border-[#CCCCCC]"
                                                }`}
                                                onClick={() => handleVariableClick(variable.columnIndex.toString())}
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
                        <span>Select a variable for assignment</span>
                    </div>
                </div>

                {/* Right side - Variable selections */}
                <div className="col-span-3 space-y-4">
                    <div className="border border-[#E6E6E6] rounded-md p-4">
                        <div className="text-sm font-medium mb-3">Variable Assignment</div>

                        {/* Numerator */}
                        <div className="mb-3">
                            <div className="text-sm mb-1">Numerator:</div>
                            <div className="flex">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 mr-2 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                    onClick={setAsNumerator}
                                    disabled={!highlightedVariable}
                                >
                                    <ChevronRight size={16} />
                                </Button>
                                <div className="border border-[#E6E6E6] rounded-md h-8 flex-grow flex items-center px-2 bg-[#F7F7F7]">
                                    <span className="text-xs truncate">
                                        {numeratorVariable ? getDisplayName(numeratorVariable) : ""}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Denominator */}
                        <div className="mb-3">
                            <div className="text-sm mb-1">Denominator:</div>
                            <div className="flex">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 mr-2 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                    onClick={setAsDenominator}
                                    disabled={!highlightedVariable}
                                >
                                    <ChevronRight size={16} />
                                </Button>
                                <div className="border border-[#E6E6E6] rounded-md h-8 flex-grow flex items-center px-2 bg-[#F7F7F7]">
                                    <span className="text-xs truncate">
                                        {denominatorVariable ? getDisplayName(denominatorVariable) : ""}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Group Variable */}
                        <div>
                            <div className="text-sm mb-1">Group Variable:</div>
                            <div className="flex">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 mr-2 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                    onClick={setAsGroupVariable}
                                    disabled={!highlightedVariable}
                                >
                                    <ChevronRight size={16} />
                                </Button>
                                <div className="border border-[#E6E6E6] rounded-md h-8 flex-grow flex items-center px-2 bg-[#F7F7F7]">
                                    <span className="text-xs truncate">
                                        {groupVariable ? getDisplayName(groupVariable) : ""}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;