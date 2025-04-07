import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    CornerDownLeft,
    CornerDownRight,
    InfoIcon
} from "lucide-react";
import { Variable } from "@/types/Variable";

interface VariablesTabProps {
    availableVariables: Variable[];
    breakVariables: Variable[];
    aggregatedVariables: any[];
    highlightedVariable: {id: string, source: 'available' | 'break' | 'aggregated'} | null;
    breakName: string;
    setBreakName: (value: string) => void;
    handleVariableSelect: (columnIndex: number, source: 'available' | 'break' | 'aggregated') => void;
    handleVariableDoubleClick: (columnIndex: number, source: 'available' | 'break') => void;
    handleAggregatedVariableSelect: (id: string) => void;
    handleAggregatedDoubleClick: (id: string) => void;
    handleTopArrowClick: () => void;
    handleBottomArrowClick: () => void;
    handleFunctionClick: () => void;
    handleNameLabelClick: () => void;
    getDisplayName: (variable: Variable) => string;
}

const VariablesTab: FC<VariablesTabProps> = ({
                                                 availableVariables,
                                                 breakVariables,
                                                 aggregatedVariables,
                                                 highlightedVariable,
                                                 breakName,
                                                 setBreakName,
                                                 handleVariableSelect,
                                                 handleVariableDoubleClick,
                                                 handleAggregatedVariableSelect,
                                                 handleAggregatedDoubleClick,
                                                 handleTopArrowClick,
                                                 handleBottomArrowClick,
                                                 handleFunctionClick,
                                                 handleNameLabelClick,
                                                 getDisplayName
                                             }) => {
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
                    ? <BarChartHorizontal size={14} className="text-gray-600 mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
        }
    };

    const getTopArrowDirection = () => {
        if (!highlightedVariable) return <CornerDownRight size={20} />;

        if (highlightedVariable.source === 'break') {
            return <CornerDownLeft size={20} />;
        } else {
            return <CornerDownRight size={20} />;
        }
    };

    const getBottomArrowDirection = () => {
        if (!highlightedVariable) return <CornerDownRight size={20} />;

        if (highlightedVariable.source === 'aggregated') {
            return <CornerDownLeft size={20} />;
        } else {
            return <CornerDownRight size={20} />;
        }
    };

    return (
        <div className="grid grid-cols-9 gap-2 py-2">
            <div className="col-span-3 flex flex-col">
                <Label className="text-xs font-semibold mb-1">Available Variables</Label>
                <div className="border p-2 rounded-md h-[250px] overflow-y-auto overflow-x-hidden">
                    <div className="space-y-1">
                        {availableVariables.map((variable) => (
                            <TooltipProvider key={variable.columnIndex}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-gray-100 ${
                                                highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable?.source === 'available'
                                                    ? "bg-gray-200 border-gray-500"
                                                    : "border-gray-300"
                                            }`}
                                            onClick={() => handleVariableSelect(variable.columnIndex, 'available')}
                                            onDoubleClick={() => handleVariableDoubleClick(variable.columnIndex, 'available')}
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

            <div className="col-span-1 flex flex-col items-center justify-center space-y-16">
                <Button
                    variant="link"
                    onClick={handleTopArrowClick}
                    disabled={!highlightedVariable}
                >
                    {getTopArrowDirection()}
                </Button>

                <Button
                    variant="link"
                    onClick={handleBottomArrowClick}
                    disabled={!highlightedVariable}
                >
                    {getBottomArrowDirection()}
                </Button>
            </div>

            <div className="col-span-5 space-y-2">
                <div>
                    <Label className="text-xs font-semibold mb-1">Break Variable(s):</Label>
                    <div className="border p-2 rounded-md h-20 overflow-y-auto overflow-x-hidden">
                        <div className="space-y-1">
                            {breakVariables.map((variable) => (
                                <TooltipProvider key={variable.columnIndex}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-gray-100 ${
                                                    highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable?.source === 'break'
                                                        ? "bg-gray-200 border-gray-500"
                                                        : "border-gray-300"
                                                }`}
                                                onClick={() => handleVariableSelect(variable.columnIndex, 'break')}
                                                onDoubleClick={() => handleVariableDoubleClick(variable.columnIndex, 'break')}
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

                <div>
                    <Label className="text-xs font-semibold mb-1">Aggregated Variables</Label>
                    <div className="text-xs mb-1">Summaries of Variable(s):</div>
                    <div className="border p-2 rounded-md h-[110px] overflow-y-auto overflow-x-hidden">
                        <div className="space-y-1">
                            {aggregatedVariables.map((variable, index) => (
                                <TooltipProvider key={variable.id}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-gray-100 ${
                                                    highlightedVariable?.id === variable.id && highlightedVariable?.source === 'aggregated'
                                                        ? "bg-gray-200 border-gray-500"
                                                        : index === 1 ? "bg-gray-100 border-gray-300" : "border-gray-300"
                                                }`}
                                                onClick={() => handleAggregatedVariableSelect(variable.id)}
                                                onDoubleClick={() => handleAggregatedDoubleClick(variable.id)}
                                            >
                                                <span className="text-xs truncate">{variable.displayName}</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            <p className="text-xs">{variable.displayName}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-1 mt-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={handleFunctionClick}
                            disabled={!(highlightedVariable?.source === 'aggregated')}
                        >
                            Function...
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={handleNameLabelClick}
                            disabled={!(highlightedVariable?.source === 'aggregated')}
                        >
                            Name & Label...
                        </Button>
                    </div>

                    <div className="flex items-center mt-1 gap-2">
                        <div className="flex items-center gap-1">
                            <Checkbox id="number-cases" className="w-3 h-3" />
                            <Label htmlFor="number-cases" className="text-xs">Number of cases</Label>
                        </div>

                        <div className="flex items-center gap-1">
                            <Label className="text-xs">Name:</Label>
                            <Input
                                value={breakName}
                                onChange={(e) => setBreakName(e.target.value)}
                                className="h-6 text-xs w-24"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-span-9">
                <div className="text-xs mt-2 text-[#888888] flex items-center">
                    <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                    <span>Double-click a variable to add it to a target list</span>
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;