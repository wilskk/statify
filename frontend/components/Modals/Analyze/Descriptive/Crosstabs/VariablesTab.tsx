// VariablesTab.tsx
import React, { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Ruler,
    Shapes,
    BarChartHorizontal,
    InfoIcon,
    GripVertical,
    MoveHorizontal,
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
    reorderVariables: (source: 'available' | 'row' | 'column' | 'layer', variables: Variable[]) => void;
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
                                                 reorderVariables,
                                                 setDisplayClusteredBarCharts,
                                                 setSuppressTables,
                                                 setDisplayLayerVariables
                                             }) => {
    const [draggedItem, setDraggedItem] = useState<{ variable: Variable, source: 'available' | 'row' | 'column' | 'layer' } | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState<'available' | 'row' | 'column' | 'layer' | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
            // Default to row if double-clicking from available
            moveToRowVariables(variable);
        } else if (source === 'row') {
            moveToAvailableVariables(variable, 'row');
        } else if (source === 'column') {
            moveToAvailableVariables(variable, 'column');
        } else if (source === 'layer') {
            moveToAvailableVariables(variable, 'layer');
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, variable: Variable, source: 'available' | 'row' | 'column' | 'layer') => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            columnIndex: variable.columnIndex,
            source
        }));
        e.dataTransfer.effectAllowed = 'move';
        setDraggedItem({ variable, source });
        setHighlightedVariable(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setIsDraggingOver(null);
        setDragOverIndex(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetSource: 'available' | 'row' | 'column' | 'layer') => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDraggingOver(targetSource);
        if (draggedItem && draggedItem.source !== targetSource && dragOverIndex !== null) {
            setDragOverIndex(null);
        }
    };

    const handleItemDragOver = (e: React.DragEvent<HTMLDivElement>, targetIndex: number, listSource: 'available' | 'row' | 'column' | 'layer') => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        if (draggedItem && draggedItem.source === listSource) {
            setDragOverIndex(targetIndex);
        } else {
            if (dragOverIndex !== null) {
                setDragOverIndex(null);
            }
        }
    };

    const handleDragLeave = () => {
        setIsDraggingOver(null);
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetSource: 'available' | 'row' | 'column' | 'layer', targetIndex?: number) => {
        e.preventDefault();

        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            const { columnIndex, source } = data;

            // Find the variable from the appropriate source list
            let sourceVariables: Variable[] = [];
            if (source === 'available') sourceVariables = availableVariables;
            else if (source === 'row') sourceVariables = rowVariables;
            else if (source === 'column') sourceVariables = columnVariables;
            else if (source === 'layer') sourceVariables = layerVariablesMap[currentLayerIndex] || [];

            const variable = sourceVariables.find(v => v.columnIndex === columnIndex);

            if (!variable) return;

            // Reordering within the same list
            if (source === targetSource) {
                if (targetIndex !== undefined) {
                    const currentList = [...sourceVariables];
                    const sourceIndex = currentList.findIndex(v => v.columnIndex === columnIndex);

                    if (sourceIndex === targetIndex || sourceIndex === targetIndex - 1) {
                        // No change needed
                        setIsDraggingOver(null);
                        setDraggedItem(null);
                        setDragOverIndex(null);
                        return;
                    }

                    // Remove from current position and add at new position
                    const [movedVariable] = currentList.splice(sourceIndex, 1);
                    const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
                    currentList.splice(adjustedTargetIndex, 0, movedVariable);

                    // Update the list
                    reorderVariables(targetSource, currentList);
                }
            }
            // Moving between different lists
            else {
                if (targetSource === 'available') {
                    moveToAvailableVariables(variable, source as 'row' | 'column' | 'layer');
                } else if (targetSource === 'row') {
                    // First remove from source list
                    if (source === 'column') {
                        // Direct transfer from column to row
                        const updatedColumns = columnVariables.filter(v => v.columnIndex !== variable.columnIndex);
                        reorderVariables('column', updatedColumns);
                    } else if (source === 'layer') {
                        // Direct transfer from layer to row
                        const updatedLayer = (layerVariablesMap[currentLayerIndex] || [])
                            .filter(v => v.columnIndex !== variable.columnIndex);
                        const newLayerMap = {...layerVariablesMap, [currentLayerIndex]: updatedLayer};
                        // This would need a function to handle layer variables specifically
                        // For now, we'll just move it to available then to row
                        moveToAvailableVariables(variable, 'layer');
                        setTimeout(() => moveToRowVariables(variable), 0);
                        return;
                    }
                    moveToRowVariables(variable);
                } else if (targetSource === 'column') {
                    // First remove from source list
                    if (source === 'row') {
                        // Direct transfer from row to column
                        const updatedRows = rowVariables.filter(v => v.columnIndex !== variable.columnIndex);
                        reorderVariables('row', updatedRows);
                    } else if (source === 'layer') {
                        // Direct transfer from layer to column
                        const updatedLayer = (layerVariablesMap[currentLayerIndex] || [])
                            .filter(v => v.columnIndex !== variable.columnIndex);
                        const newLayerMap = {...layerVariablesMap, [currentLayerIndex]: updatedLayer};
                        // Similar to above, simplified approach
                        moveToAvailableVariables(variable, 'layer');
                        setTimeout(() => moveToColumnVariables(variable), 0);
                        return;
                    }
                    moveToColumnVariables(variable);
                } else if (targetSource === 'layer') {
                    // First remove from source list
                    if (source === 'row') {
                        // Direct transfer from row to layer
                        const updatedRows = rowVariables.filter(v => v.columnIndex !== variable.columnIndex);
                        reorderVariables('row', updatedRows);
                    } else if (source === 'column') {
                        // Direct transfer from column to layer
                        const updatedColumns = columnVariables.filter(v => v.columnIndex !== variable.columnIndex);
                        reorderVariables('column', updatedColumns);
                    }
                    moveToLayerVariables(variable);
                }
            }
        } catch (error) {
            console.error('[handleDrop] Error processing drop:', error);
        }

        setIsDraggingOver(null);
        setDraggedItem(null);
        setDragOverIndex(null);
    };

    const getAnimationClass = (source: 'available' | 'row' | 'column' | 'layer'): string => {
        return "transition-all duration-150";
    };

    const handlePreviousLayer = () => {
        if (currentLayerIndex > 1) {
            setCurrentLayerIndex(currentLayerIndex - 1);
        }
    };

    const handleNextLayer = () => {
        const currentLayerVars = layerVariablesMap[currentLayerIndex] || [];

        if (currentLayerVars.length > 0) {
            if (currentLayerIndex < totalLayers) {
                setCurrentLayerIndex(currentLayerIndex + 1);
            } else {
                setTotalLayers(totalLayers + 1);
                setCurrentLayerIndex(currentLayerIndex + 1);
            }
        }
    };

    const currentLayerVariables = layerVariablesMap[currentLayerIndex] || [];

    const renderVariableList = (variables: Variable[], source: 'available' | 'row' | 'column' | 'layer', height: string) => (
        <div
            className={`border p-2 rounded-md w-full overflow-y-auto overflow-x-hidden transition-colors relative ${
                isDraggingOver === source
                    ? "border-blue-500 bg-blue-50"
                    : "border-[#E6E6E6]"
            }`}
            style={{ height }}
            onDragOver={(e) => handleDragOver(e, source)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, source)}
        >
            {variables.length === 0 && source !== 'available' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#888888] pointer-events-none p-2">
                    <MoveHorizontal size={18} className="mb-1" />
                    <p className="text-xs text-center">Drop variables here</p>
                </div>
            )}
            {variables.length === 0 && source === 'available' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#888888] pointer-events-none p-4">
                    <p className="text-sm text-center">All variables used</p>
                </div>
            )}

            <div className={`space-y-0.5 ${getAnimationClass(source)}`}>
                {variables.map((variable, index) => {
                    const isSameListDrag = draggedItem?.source === source;
                    const isDraggingThis = draggedItem?.variable.columnIndex === variable.columnIndex && isSameListDrag;
                    const currentDragOverIndex = dragOverIndex;
                    const isDropTarget = isSameListDrag && currentDragOverIndex === index && draggedItem;
                    const showBottomLine = isSameListDrag && currentDragOverIndex === index + 1 && draggedItem;

                    return (
                        <TooltipProvider key={variable.columnIndex}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={`flex items-center p-1 cursor-grab border rounded-md group relative
                                                ${isDraggingThis ? "opacity-40 bg-[#FAFAFA]" : "hover:bg-[#F5F5F5]"}
                                                ${isDropTarget ? "border-t-[3px] border-t-[#888888] pt-0.5" : ""}
                                            ${highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === source
                                            ? "bg-[#E6E6E6] border-[#888888]"
                                            : "border-[#CCCCCC]"
                                        }`}
                                        onClick={() => handleVariableSelect(variable, source)}
                                        onDoubleClick={() => handleVariableDoubleClick(variable, source)}
                                        draggable={true}
                                        onDragStart={(e) => handleDragStart(e, variable, source)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => handleItemDragOver(e, index, source)}
                                        onDragLeave={() => { setDragOverIndex(null); }}
                                        onDrop={(e) => { e.stopPropagation(); handleDrop(e, source, index); }}
                                    >
                                        <div className="flex items-center w-full">
                                            <GripVertical size={14} className="text-[#AAAAAA] mr-1 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            {getVariableIcon(variable)}
                                            <span className="text-xs truncate">{getDisplayName(variable)}</span>
                                        </div>
                                        {showBottomLine && (<div className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-[#888888] z-10"></div>)}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p className="text-xs">{getDisplayName(variable)}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="p-4">
            <div className="grid grid-cols-2 gap-6">
                {/* Available Variables Section */}
                <div className="col-span-1">
                    <div className="flex items-center mb-2">
                        <span className="text-sm font-medium">Available Variables</span>
                    </div>
                    {renderVariableList(availableVariables, 'available', '330px')}
                    <div className="text-xs mt-2 text-[#888888] flex items-center">
                        <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                        <span>Drag or double-click variables to move them.</span>
                    </div>
                </div>

                {/* Variables Lists Section */}
                <div className="col-span-1 space-y-4">
                    {/* Row Variables */}
                    <div className="flex flex-col">
                        <div className="flex-1">
                            <div className="flex items-center mb-2">
                                <Rows3 size={16} className="mr-2 text-[#444444]" />
                                <span className="text-sm font-medium">Row(s)</span>
                            </div>
                            {renderVariableList(rowVariables, 'row', '80px')}

                        </div>
                    </div>

                    {/* Column Variables */}
                    <div className="flex flex-col">
                        <div className="flex-1">
                            <div className="flex items-center mb-2">
                                <Columns3 size={16} className="mr-2 text-[#444444]" />
                                <span className="text-sm font-medium">Column(s)</span>
                            </div>
                            {renderVariableList(columnVariables, 'column', '80px')}

                        </div>
                    </div>

                    {/* Layer Variables */}
                    <div className="flex flex-col">
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