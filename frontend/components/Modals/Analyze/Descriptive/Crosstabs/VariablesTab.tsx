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
    ArrowBigDown,
    ArrowBigLeft
} from "lucide-react";
import type { Variable } from "@/types/Variable";
import { VariablesTabProps, VariableHighlight } from "./types";

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
    setDisplayLayerVariables,
    containerType = "dialog"
}) => {
    const [draggedItem, setDraggedItem] = useState<{ variable: Variable, source: 'available' | 'row' | 'column' | 'layer' } | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState<'available' | 'row' | 'column' | 'layer' | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const variableIdKeyToUse: keyof Variable = 'tempId';

    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        }
    };

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    const handleVariableSelect = (variable: Variable, source: 'available' | 'row' | 'column' | 'layer') => {
        if (highlightedVariable && highlightedVariable.id === variable.tempId && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: variable.tempId!, source });
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

    // Function to handle arrow button click
    const handleArrowButtonClick = (targetListId: 'row' | 'column' | 'layer') => {
        if (!highlightedVariable) return;

        const { id, source } = highlightedVariable;

        // From available to target list
        if (source === 'available') {
            const variable = availableVariables.find(v => v.tempId === id);
            if (variable) {
                if (targetListId === 'row') {
                    moveToRowVariables(variable);
                } else if (targetListId === 'column') {
                    moveToColumnVariables(variable);
                } else if (targetListId === 'layer') {
                    moveToLayerVariables(variable);
                }
            }
        }
        // From target list to available
        else if (source === targetListId) {
            let variable;
            if (targetListId === 'row') {
                variable = rowVariables.find(v => v.tempId === id);
            } else if (targetListId === 'column') {
                variable = columnVariables.find(v => v.tempId === id);
            } else if (targetListId === 'layer') {
                variable = (layerVariablesMap[currentLayerIndex] || []).find(v => v.tempId === id);
            }

            if (variable) {
                moveToAvailableVariables(variable, targetListId);
            }
        }
    };

    // Function to render arrow button
    const renderArrowButton = (targetListId: 'row' | 'column' | 'layer') => {
        const isTargetHighlighted = highlightedVariable?.source === targetListId;
        const isAvailableHighlighted = highlightedVariable?.source === 'available';
        const isDisabled = !highlightedVariable ||
            (highlightedVariable.source !== 'available' && highlightedVariable.source !== targetListId);

        // Direction: if target is highlighted, show left arrow (to available)
        // otherwise show right arrow (from available to target)
        const direction = isTargetHighlighted ? 'left' : 'right';

        return (
            <button
                className={`
                    flex-shrink-0 flex items-center justify-center p-1 w-6 h-6 rounded border mr-2
                    ${isDisabled
                    ? 'border-border text-muted-foreground/50 cursor-not-allowed'
                    : 'border-input text-foreground hover:bg-accent hover:border-primary'}
                `}
                onClick={() => !isDisabled && handleArrowButtonClick(targetListId)}
                disabled={isDisabled}
            >
                {direction === 'left'
                    ? <ArrowBigLeft size={14} />
                    : <ArrowBigDown size={14} />}
            </button>
        );
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, variable: Variable, source: 'available' | 'row' | 'column' | 'layer') => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            id: variable.tempId,
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
            const { id, source } = data;

            // Find the variable from the appropriate source list
            let sourceVariables: Variable[] = [];
            if (source === 'available') sourceVariables = availableVariables;
            else if (source === 'row') sourceVariables = rowVariables;
            else if (source === 'column') sourceVariables = columnVariables;
            else if (source === 'layer') sourceVariables = layerVariablesMap[currentLayerIndex] || [];

            const variable = sourceVariables.find(v => v.tempId === id);

            if (!variable) return;

            // Reordering within the same list
            if (source === targetSource) {
                if (targetIndex !== undefined) {
                    const currentList = [...sourceVariables];
                    const sourceIndex = currentList.findIndex(v => v.tempId === id);

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
                        const updatedColumns = columnVariables.filter(v => v.tempId !== variable.tempId);
                        reorderVariables('column', updatedColumns);
                    } else if (source === 'layer') {
                        // Direct transfer from layer to row
                        const updatedLayer = (layerVariablesMap[currentLayerIndex] || [])
                            .filter(v => v.tempId !== variable.tempId);
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
                        const updatedRows = rowVariables.filter(v => v.tempId !== variable.tempId);
                        reorderVariables('row', updatedRows);
                    } else if (source === 'layer') {
                        // Direct transfer from layer to column
                        const updatedLayer = (layerVariablesMap[currentLayerIndex] || [])
                            .filter(v => v.tempId !== variable.tempId);
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
                        const updatedRows = rowVariables.filter(v => v.tempId !== variable.tempId);
                        reorderVariables('row', updatedRows);
                    } else if (source === 'column') {
                        // Direct transfer from column to layer
                        const updatedColumns = columnVariables.filter(v => v.tempId !== variable.tempId);
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
        // Allow adding a new layer if currently at the last layer
        if (currentLayerIndex === totalLayers) {
            setTotalLayers(totalLayers + 1);
        }
        setCurrentLayerIndex(currentLayerIndex + 1);
    };

    const currentLayerVariables = layerVariablesMap[currentLayerIndex] || [];

    const renderVariableList = (variables: Variable[], source: 'available' | 'row' | 'column' | 'layer', height: string) => (
        <div
            className={`
                border rounded-md overflow-y-auto overflow-x-hidden
                ${isDraggingOver === source ? 'border-primary bg-primary/10' : 'border-border bg-background'}
            `}
            style={{ height }}
            onDragOver={(e) => handleDragOver(e, source)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, source)}
        >
            {variables.length === 0 && !isDraggingOver && (
                <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-muted-foreground">List is empty</p>
                </div>
            )}
            {variables.map((variable, index) => (
                <div
                    key={variable[variableIdKeyToUse]}
                    draggable
                    onDragStart={(e) => handleDragStart(e, variable, source)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleItemDragOver(e, index, source)}
                    onClick={() => handleVariableSelect(variable, source)}
                    onDoubleClick={() => handleVariableDoubleClick(variable, source)}
                    className={`
                        flex items-center p-2 cursor-grab border-b last:border-b-0
                        ${highlightedVariable && highlightedVariable.id === variable.tempId && highlightedVariable.source === source
                        ? 'bg-accent border-primary'
                        : 'border-border hover:bg-accent'}
                        ${draggedItem && draggedItem.variable.tempId === variable.tempId && draggedItem.source === source ? 'opacity-50' : ''}
                    `}
                >
                    {dragOverIndex === index && draggedItem && draggedItem.source === source && (
                        <div className="absolute left-0 right-0 h-1 bg-primary rounded -top-[2px]" />
                    )}
                    <GripVertical size={14} className="text-muted-foreground mr-2 flex-shrink-0 cursor-grab" />
                    {getVariableIcon(variable)}
                    <span className="text-xs text-foreground select-none truncate" title={getDisplayName(variable)}>
                        {getDisplayName(variable)}
                    </span>
                    {dragOverIndex === index && draggedItem && draggedItem.source === source && index === variables.length -1 && (
                         <div className="absolute left-0 right-0 h-1 bg-primary rounded -bottom-[2px]" />
                    )}
                </div>
            ))}
            {isDraggingOver === source && variables.length > 0 && dragOverIndex === null && (
                <div className="p-2 border-t border-dashed border-primary">
                     <p className="text-xs text-center text-primary">Drop here to add to list</p>
                </div>
            )}
             {isDraggingOver === source && variables.length === 0 && (
                 <div className="p-2 h-full flex items-center justify-center">
                    <p className="text-xs text-center text-primary">Drop here to add to list</p>
                </div>
            )}
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
                    {renderVariableList(availableVariables, 'available', '340px')}
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
                                {renderArrowButton('row')}
                                <span className="text-sm font-medium">Row(s)</span>
                            </div>
                            {renderVariableList(rowVariables, 'row', '80px')}
                        </div>
                    </div>

                    {/* Column Variables */}
                    <div className="flex flex-col">
                        <div className="flex-1">
                            <div className="flex items-center mb-2">
                                {renderArrowButton('column')}
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
                                    {renderArrowButton('layer')}
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