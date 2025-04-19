// VariablesTab.tsx
import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    CornerDownLeft,
    CornerDownRight,
    Ruler,
    Shapes,
    BarChartHorizontal,
    InfoIcon,
    ChevronLeft,
    ChevronRight,
    Layers,
    Columns3,
    Rows3
} from "lucide-react";
import type { Variable } from "@/types/Variable";

interface VariablesTabProps {
    availableVariables: Variable[];
    rowVariables: Variable[];
    columnVariables: Variable[];
    layerVariablesMap: Record<number, Variable[]>;
    currentLayerIndex: number;
    totalLayers: number;
    highlightedVariable: {id: string, source: 'available' | 'row' | 'column' | 'layer'} | null;
    displayClusteredBarCharts: boolean;
    suppressTables: boolean;
    displayLayerVariables: boolean;
    setHighlightedVariable: (value: {id: string, source: 'available' | 'row' | 'column' | 'layer'} | null) => void;
    setCurrentLayerIndex: (value: number) => void;
    setTotalLayers: (value: number) => void;
    moveToRowVariables: (variable: Variable) => void;
    moveToColumnVariables: (variable: Variable) => void;
    moveToLayerVariables: (variable: Variable) => void;
    moveToAvailableVariables: (variable: Variable, source: 'row' | 'column' | 'layer') => void;
    setDisplayClusteredBarCharts: (value: boolean) => void;
    setSuppressTables: (value: boolean) => void;
    setDisplayLayerVariables: (value: boolean) => void;
}

const VariablesTab: FC<VariablesTabProps> = ({
                                                 availableVariables,
                                                 rowVariables,
                                                 columnVariables,
                                                 layerVariablesMap,
                                                 currentLayerIndex,
                                                 totalLayers,
                                                 highlightedVariable,
                                                 displayClusteredBarCharts,
                                                 suppressTables,
                                                 displayLayerVariables,
                                                 setHighlightedVariable,
                                                 setCurrentLayerIndex,
                                                 setTotalLayers,
                                                 moveToRowVariables,
                                                 moveToColumnVariables,
                                                 moveToLayerVariables,
                                                 moveToAvailableVariables,
                                                 setDisplayClusteredBarCharts,
                                                 setSuppressTables,
                                                 setDisplayLayerVariables
                                             }) => {
    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-[#444444] mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-[#444444] mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-[#444444] mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-[#444444] mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-[#444444] mr-1 flex-shrink-0" />;
        }
    };

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    const handleVariableSelect = (variable: Variable, source: 'available' | 'row' | 'column' | 'layer') => {
        if (highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: variable.columnIndex.toString(), source });
        }
    };

    const handleVariableDoubleClick = (variable: Variable, source: 'available' | 'row' | 'column' | 'layer') => {
        if (source === 'available') {
            moveToRowVariables(variable);
        } else if (source === 'row') {
            moveToAvailableVariables(variable, 'row');
        } else if (source === 'column') {
            moveToAvailableVariables(variable, 'column');
        } else if (source === 'layer') {
            moveToAvailableVariables(variable, 'layer');
        }
    };

    const handleMoveVariable = (target: 'row' | 'column' | 'layer') => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'available') {
            const variable = availableVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
            if (variable) {
                if (target === 'row') {
                    moveToRowVariables(variable);
                } else if (target === 'column') {
                    moveToColumnVariables(variable);
                } else if (target === 'layer') {
                    moveToLayerVariables(variable);
                }
            }
        } else if (highlightedVariable.source === 'row' && target === 'row') {
            const variable = rowVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
            if (variable) {
                moveToAvailableVariables(variable, 'row');
            }
        } else if (highlightedVariable.source === 'column' && target === 'column') {
            const variable = columnVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
            if (variable) {
                moveToAvailableVariables(variable, 'column');
            }
        } else if (highlightedVariable.source === 'layer' && target === 'layer') {
            const variable = layerVariablesMap[currentLayerIndex]?.find(v => v.columnIndex.toString() === highlightedVariable.id);
            if (variable) {
                moveToAvailableVariables(variable, 'layer');
            }
        }
    };

    const handlePreviousLayer = () => {
        if (currentLayerIndex > 1) {
            setCurrentLayerIndex(currentLayerIndex - 1);
        }
    };

    const handleNextLayer = () => {
        const currentLayerVars = layerVariablesMap[currentLayerIndex] || [];

        // Only allow navigation to the next layer if current layer has variables
        if (currentLayerVars.length > 0) {
            if (currentLayerIndex < totalLayers) {
                // Move to an existing layer
                setCurrentLayerIndex(currentLayerIndex + 1);
            } else {
                // Create a new layer
                setTotalLayers(totalLayers + 1);
                setCurrentLayerIndex(currentLayerIndex + 1);
            }
        }
    };

    // Get the current layer's variables
    const currentLayerVariables = layerVariablesMap[currentLayerIndex] || [];

    const renderVariableList = (variables: Variable[], source: 'available' | 'row' | 'column' | 'layer', height: string) => (
        <div className="border border-[#E6E6E6] w-full overflow-y-auto overflow-x-hidden" style={{ height }}>
            <div className="p-2 space-y-1">
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
                {variables.length === 0 && (
                    <div className="text-xs text-[#888888] italic p-1">No variables selected</div>
                )}
            </div>
        </div>
    );

    const renderArrowButton = (target: 'row' | 'column' | 'layer') => (
        <Button
            variant="outline"
            size="sm"
            className={`w-8 h-8 border-[#CCCCCC] ${!highlightedVariable || (highlightedVariable.source !== 'available' && highlightedVariable.source !== target) ? 'opacity-50' : 'hover:bg-[#F7F7F7] hover:border-[#888888]'}`}
            onClick={() => handleMoveVariable(target)}
            disabled={!highlightedVariable || (highlightedVariable.source !== 'available' && highlightedVariable.source !== target)}
        >
            {highlightedVariable?.source === target ?
                <CornerDownLeft size={16} /> :
                <CornerDownRight size={16} />
            }
        </Button>
    );

    return (
        <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Available Variables Section */}
                <div className="lg:w-2/5">
                    <div className="flex items-center mb-2">
                        <span className="text-sm font-medium">Available Variables</span>
                    </div>
                    {renderVariableList(availableVariables, 'available', '330px')}
                    <div className="text-xs mt-2 text-[#888888] flex items-center">
                        <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                        <span>Double-click to move variables between lists.</span>
                    </div>
                </div>

                {/* Variables Lists Section */}
                <div className="lg:w-3/5 space-y-6">
                    {/* Row Variables */}
                    <div className="flex gap-3 items-start">
                        <div className="pt-6">
                            {renderArrowButton('row')}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center mb-2">
                                <Rows3 size={16} className="mr-2 text-[#444444]" />
                                <span className="text-sm font-medium">Row(s)</span>
                            </div>
                            {renderVariableList(rowVariables, 'row', '80px')}
                            <div className="text-xs mt-1 text-[#888888]">
                                <span>Variables that define table rows</span>
                            </div>
                        </div>
                    </div>

                    {/* Column Variables */}
                    <div className="flex gap-3 items-start">
                        <div className="pt-6">
                            {renderArrowButton('column')}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center mb-2">
                                <Columns3 size={16} className="mr-2 text-[#444444]" />
                                <span className="text-sm font-medium">Column(s)</span>
                            </div>
                            {renderVariableList(columnVariables, 'column', '80px')}
                            <div className="text-xs mt-1 text-[#888888]">
                                <span>Variables that define table columns</span>
                            </div>
                        </div>
                    </div>

                    {/* Layer Variables */}
                    <div className="flex gap-3 items-start">
                        <div className="pt-6">
                            {renderArrowButton('layer')}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                    <Layers size={16} className="mr-2 text-[#444444]" />
                                    <span className="text-sm font-medium">Layer</span>
                                </div>
                                <div className="flex items-center bg-[#F7F7F7] border border-[#E6E6E6] rounded px-2 py-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`w-6 h-6 mr-1 ${currentLayerIndex <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#E6E6E6]'}`}
                                        onClick={handlePreviousLayer}
                                        disabled={currentLayerIndex <= 1}
                                        title="Previous Layer"
                                    >
                                        <ChevronLeft size={14} />
                                    </Button>
                                    <span className="text-xs font-medium mx-1">
                                        {currentLayerIndex} of {totalLayers > 0 ? totalLayers : 1}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`w-6 h-6 ml-1 ${currentLayerVariables.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#E6E6E6]'}`}
                                        onClick={handleNextLayer}
                                        disabled={currentLayerVariables.length === 0}
                                        title={currentLayerVariables.length === 0 ? "Add variables to create next layer" : "Next Layer"}
                                    >
                                        <ChevronRight size={14} />
                                    </Button>
                                </div>
                            </div>
                            {renderVariableList(currentLayerVariables, 'layer', '80px')}
                            <div className="flex items-center mt-2">
                                <Checkbox
                                    id="displayLayerVariables"
                                    checked={displayLayerVariables}
                                    onCheckedChange={(checked) => setDisplayLayerVariables(!!checked)}
                                    className="mr-2 border-[#CCCCCC] h-4 w-4 rounded-sm data-[state=checked]:bg-black data-[state=checked]:text-white"
                                />
                                <Label htmlFor="displayLayerVariables" className="text-xs cursor-pointer">
                                    Display layer variables in table layers
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Options Section */}
            <div className="mt-6 pt-4 border-t border-[#E6E6E6]">
                <div className="text-sm font-medium mb-2">Display Options</div>
                <div className="space-y-2">
                    <div className="flex items-center">
                        <Checkbox
                            id="displayClusteredBarCharts"
                            checked={displayClusteredBarCharts}
                            onCheckedChange={(checked) => setDisplayClusteredBarCharts(!!checked)}
                            className="mr-2 border-[#CCCCCC] h-4 w-4 rounded-sm data-[state=checked]:bg-black data-[state=checked]:text-white"
                        />
                        <Label htmlFor="displayClusteredBarCharts" className="text-sm cursor-pointer">
                            Display clustered bar charts
                        </Label>
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="suppressTables"
                            checked={suppressTables}
                            onCheckedChange={(checked) => setSuppressTables(!!checked)}
                            className="mr-2 border-[#CCCCCC] h-4 w-4 rounded-sm data-[state=checked]:bg-black data-[state=checked]:text-white"
                        />
                        <Label htmlFor="suppressTables" className="text-sm cursor-pointer">
                            Suppress tables
                        </Label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;