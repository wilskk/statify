import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Variable } from "@/types/Variable";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    CornerDownRight,
    CornerDownLeft,
    InfoIcon
} from "lucide-react";

interface VariablesTabProps {
    storeVariables: Variable[];
    selectedVariables: Variable[];
    highlightedVariable: {id: string, source: 'available' | 'selected'} | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<{id: string, source: 'available' | 'selected'} | null>>;
    moveToSelectedVariables: (variable: Variable) => void;
    moveFromSelectedVariables: (variable: Variable) => void;
    handleTransferClick: () => void;
    saveStandardized: boolean;
    setSaveStandardized: React.Dispatch<React.SetStateAction<boolean>>;
}

const VariablesTab: FC<VariablesTabProps> = ({
                                                 storeVariables,
                                                 selectedVariables,
                                                 highlightedVariable,
                                                 setHighlightedVariable,
                                                 moveToSelectedVariables,
                                                 moveFromSelectedVariables,
                                                 handleTransferClick,
                                                 saveStandardized,
                                                 setSaveStandardized
                                             }) => {
    const handleVariableSelect = (columnIndex: number, source: 'available' | 'selected') => {
        if (highlightedVariable?.id === columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: columnIndex.toString(), source });
        }
    };

    const handleVariableDoubleClick = (columnIndex: number, source: 'available' | 'selected') => {
        if (source === "available") {
            const variable = storeVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveToSelectedVariables(variable);
            }
        } else if (source === "selected") {
            const variable = selectedVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveFromSelectedVariables(variable);
            }
        }
    };

    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-gray-600 mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
        }
    };

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
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
                                    onClick={() => handleVariableSelect(variable.columnIndex, source)}
                                    onDoubleClick={() => handleVariableDoubleClick(variable.columnIndex, source)}
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
        <div className="grid grid-cols-8 gap-6">
            <div className="col-span-3">
                <div className="text-sm mb-2 font-medium">Variables:</div>
                {renderVariableList(storeVariables, 'available', '250px')}
                <div className="text-xs mt-2 text-[#888888] flex items-center">
                    <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                    <span>Double-click to move variables between lists</span>
                </div>
            </div>

            <div className="col-span-1 flex flex-col items-center justify-center">
                <Button
                    variant="outline"
                    size="sm"
                    className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                    onClick={handleTransferClick}
                    disabled={!highlightedVariable}
                >
                    {highlightedVariable?.source === 'selected' ?
                        <CornerDownLeft size={16} /> :
                        <CornerDownRight size={16} />
                    }
                </Button>
            </div>

            <div className="col-span-4">
                <div className="text-sm mb-2 font-medium">Variable(s):</div>
                {renderVariableList(selectedVariables, 'selected', '250px')}

                <div className="mt-6">
                    <div className="flex items-center">
                        <Checkbox
                            id="saveStandardized"
                            checked={saveStandardized}
                            onCheckedChange={(checked) => setSaveStandardized(!!checked)}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="saveStandardized" className="text-sm cursor-pointer">
                            Save standardized values as variables
                        </Label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;