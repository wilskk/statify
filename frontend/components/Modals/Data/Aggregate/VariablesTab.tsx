import React, { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    InfoIcon,
    GripVertical,
    MoveHorizontal,
    ArrowBigDown,
    ArrowBigLeft
} from "lucide-react";
import { Variable } from "@/types/Variable";
import { AggregatedVariable, TourStep } from './types';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ActiveElementHighlight: FC<{active: boolean}> = ({active}) => {
    if (!active) return null;
    
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-md ring-2 ring-primary ring-offset-2 pointer-events-none"
        />
    );
};

interface VariablesTabProps {
    availableVariables: Variable[];
    breakVariables: Variable[];
    aggregatedVariables: AggregatedVariable[];
    highlightedVariable: {id: string, source: 'available' | 'break' | 'aggregated'} | null;
    breakName: string;
    setBreakName: (value: string) => void;
    handleVariableSelect: (columnIndex: number, source: 'available' | 'break' | 'aggregated') => void;
    handleVariableDoubleClick: (columnIndex: number, source: 'available' | 'break') => void;
    handleAggregatedVariableSelect: (aggregateId: string) => void;
    handleAggregatedDoubleClick: (aggregateId: string) => void;
    handleTopArrowClick: () => void;
    handleBottomArrowClick: () => void;
    handleFunctionClick: () => void;
    handleNameLabelClick: () => void;
    getDisplayName: (variable: Variable | AggregatedVariable) => string;
    // New props for DnD functionality
    moveToBreak: (variable: Variable) => void;
    moveFromBreak: (variable: Variable) => void;
    moveToAggregated: (variable: Variable) => void;
    moveFromAggregated: (variable: AggregatedVariable) => void;
    reorderBreakVariables: (variables: Variable[]) => void;
    reorderAggregatedVariables: (variables: AggregatedVariable[]) => void;
    containerType?: "dialog" | "sidebar" | "panel";
    tourActive: boolean;
    currentStep: number;
    tourSteps: TourStep[];
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
    getDisplayName,
    moveToBreak,
    moveFromBreak,
    moveToAggregated,
    moveFromAggregated,
    reorderBreakVariables,
    reorderAggregatedVariables,
    containerType = "dialog",
    tourActive,
    currentStep,
    tourSteps,
}) => {
    // DnD state
    const [draggedItem, setDraggedItem] = useState<{
        variable: Variable | AggregatedVariable,
        source: 'available' | 'break' | 'aggregated',
        isAggregated: boolean
    } | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState<'available' | 'break' | 'aggregated' | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const isStepActive = (targetId: string) => {
        return tourActive && tourSteps[currentStep]?.targetId === targetId;
    };

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

    // Function to handle arrow button click for Break Variables
    const handleBreakArrowClick = () => {
        if (!highlightedVariable) return;

        const { id, source } = highlightedVariable;

        // From available to Break list
        if (source === 'available') {
            const variable = availableVariables.find(v => v.columnIndex.toString() === id);
            if (variable) {
                moveToBreak(variable);
            }
        }
        // From Break list to available
        else if (source === 'break') {
            const variable = breakVariables.find(v => v.columnIndex.toString() === id);
            if (variable) {
                moveFromBreak(variable);
            }
        }
    };

    // Function to handle arrow button click for Aggregated Variables
    const handleAggregatedArrowClick = () => {
        if (!highlightedVariable) return;

        const { id, source } = highlightedVariable;

        // From available to Aggregated list
        if (source === 'available') {
            const variable = availableVariables.find(v => v.columnIndex.toString() === id);
            if (variable) {
                moveToAggregated(variable);
            }
        }
        // From Aggregated list to available
        else if (source === 'aggregated') {
            const variable = aggregatedVariables.find(v => v.aggregateId === id);
            if (variable) {
                moveFromAggregated(variable);
            }
        }
    };

    // Function to render arrow button
    const renderArrowButton = (targetListId: 'break' | 'aggregated') => {
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
                    ? 'border-border/50 text-muted-foreground/50 cursor-not-allowed'
                    : 'border-border text-muted-foreground hover:bg-accent hover:border-ring'}
                `}
                onClick={() => !isDisabled && (targetListId === 'break' ? handleBreakArrowClick() : handleAggregatedArrowClick())}
                disabled={isDisabled}
            >
                {direction === 'left'
                    ? <ArrowBigLeft size={14} />
                    : <ArrowBigDown size={14} />}
            </button>
        );
    };

    // DnD handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, variable: Variable | AggregatedVariable, source: 'available' | 'break' | 'aggregated') => {
        const isAggregated = 'aggregateId' in variable;

        e.dataTransfer.setData('application/json', JSON.stringify({
            id: isAggregated ? variable.aggregateId : variable.columnIndex,
            source,
            isAggregated
        }));

        e.dataTransfer.effectAllowed = 'move';
        setDraggedItem({ variable, source, isAggregated });

        // Clear any selection when dragging starts
        if (highlightedVariable) {
            if (source === 'available' || source === 'break') {
                handleVariableSelect(-1, source);
            } else {
                handleAggregatedVariableSelect("");
            }
        }
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setIsDraggingOver(null);
        setDragOverIndex(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetSource: 'available' | 'break' | 'aggregated') => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDraggingOver(targetSource);
        if (draggedItem && draggedItem.source !== targetSource && dragOverIndex !== null) {
            setDragOverIndex(null);
        }
    };

    const handleItemDragOver = (e: React.DragEvent<HTMLDivElement>, targetIndex: number, listSource: 'available' | 'break' | 'aggregated') => {
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

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetSource: 'available' | 'break' | 'aggregated', targetIndex?: number) => {
        e.preventDefault();

        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            const { id, source, isAggregated } = data;

            // Find the variable from the appropriate source list
            let variable: Variable | AggregatedVariable | undefined;

            if (source === 'available') {
                variable = availableVariables.find(v => v.columnIndex === id);
            } else if (source === 'break') {
                variable = breakVariables.find(v => v.columnIndex === id);
            } else if (source === 'aggregated') {
                variable = aggregatedVariables.find(v => v.aggregateId === id);
            }

            if (!variable) return;

            // Reordering within the same list
            if (source === targetSource) {
                if (targetIndex !== undefined) {
                    if (source === 'break') {
                        const currentList = [...breakVariables];
                        const sourceIndex = currentList.findIndex(v => v.columnIndex === id);

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
                        reorderBreakVariables(currentList);
                    } else if (source === 'aggregated') {
                        const currentList = [...aggregatedVariables];
                        const sourceIndex = currentList.findIndex(v => v.aggregateId === id);

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
                        reorderAggregatedVariables(currentList);
                    }
                }
            }
            // Moving between different lists
            else {
                if (targetSource === 'available') {
                    if (source === 'break' && !isAggregated) {
                        moveFromBreak(variable as Variable);
                    } else if (source === 'aggregated' && isAggregated) {
                        moveFromAggregated(variable as AggregatedVariable);
                    }
                } else if (targetSource === 'break') {
                    if (source === 'available' && !isAggregated) {
                        moveToBreak(variable as Variable);
                    }
                } else if (targetSource === 'aggregated') {
                    if (source === 'available' && !isAggregated) {
                        moveToAggregated(variable as Variable);
                    }
                }
            }
        } catch (error) {
            console.error('[handleDrop] Error processing drop:', error);
        }

        setIsDraggingOver(null);
        setDraggedItem(null);
        setDragOverIndex(null);
    };

    const getAnimationClass = (): string => {
        return "transition-all duration-150";
    };

    // Render variable lists with DnD support
    const renderVariableList = (variables: Variable[], source: 'available' | 'break', height: string) => (
        <div
            className={`border p-2 rounded-md w-full overflow-y-auto overflow-x-hidden transition-colors relative ${
                isDraggingOver === source
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300"
            }`}
            style={{ height }}
            onDragOver={(e) => handleDragOver(e, source)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, source)}
        >
            {variables.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none p-2">
                    <MoveHorizontal size={18} className="mb-1" />
                    <p className="text-xs text-center">Drop variables here</p>
                </div>
            )}

            <div className={`space-y-0.5 ${getAnimationClass()}`}>
                {variables.map((variable, index) => {
                    const isSameListDrag = draggedItem?.source === source;
                    const isDraggingThis = draggedItem?.variable && 'columnIndex' in draggedItem.variable &&
                        draggedItem.variable.columnIndex === variable.columnIndex && isSameListDrag;
                    const isDropTarget = isSameListDrag && dragOverIndex === index && draggedItem;
                    const showBottomLine = isSameListDrag && dragOverIndex === index + 1 && draggedItem;

                    return (
                        <TooltipProvider key={variable.columnIndex}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={`flex items-center p-1 cursor-grab border rounded-md group relative
                                            ${isDraggingThis ? "opacity-40 bg-gray-100" : "hover:bg-gray-100"}
                                            ${isDropTarget ? "border-t-2 border-t-gray-500 pt-0.5" : ""}
                                            ${highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === source
                                            ? "bg-gray-200 border-gray-500"
                                            : "border-gray-300"
                                        }`}
                                        onClick={() => handleVariableSelect(variable.columnIndex, source)}
                                        onDoubleClick={() => handleVariableDoubleClick(variable.columnIndex, source)}
                                        draggable={true}
                                        onDragStart={(e) => handleDragStart(e, variable, source)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => handleItemDragOver(e, index, source)}
                                        onDragLeave={() => { setDragOverIndex(null); }}
                                        onDrop={(e) => { e.stopPropagation(); handleDrop(e, source, index); }}
                                    >
                                        <div className="flex items-center w-full">
                                            <GripVertical size={14} className="text-gray-400 mr-1 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            {getVariableIcon(variable)}
                                            <span className="text-xs truncate">{getDisplayName(variable)}</span>
                                        </div>
                                        {showBottomLine && (<div className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-gray-500 z-10"></div>)}
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

    // Render aggregated variables list with DnD support
    const renderAggregatedList = (variables: AggregatedVariable[], height: string) => (
        <div
            className={`border p-2 rounded-md w-full overflow-y-auto overflow-x-hidden transition-colors relative ${
                isDraggingOver === 'aggregated'
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300"
            }`}
            style={{ height }}
            onDragOver={(e) => handleDragOver(e, 'aggregated')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'aggregated')}
        >
            {variables.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none p-2">
                    <MoveHorizontal size={18} className="mb-1" />
                    <p className="text-xs text-center">Drop variables here</p>
                </div>
            )}

            <div className={`space-y-0.5 ${getAnimationClass()}`}>
                {variables.map((variable, index) => {
                    const isSameListDrag = draggedItem?.source === 'aggregated';
                    const isDraggingThis = draggedItem?.variable && 'aggregateId' in draggedItem.variable &&
                        draggedItem.variable.aggregateId === variable.aggregateId && isSameListDrag;
                    const isDropTarget = isSameListDrag && dragOverIndex === index && draggedItem;
                    const showBottomLine = isSameListDrag && dragOverIndex === index + 1 && draggedItem;

                    return (
                        <TooltipProvider key={variable.aggregateId}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={`flex items-center p-1 cursor-grab border rounded-md group relative
                                            ${isDraggingThis ? "opacity-40 bg-gray-100" : "hover:bg-gray-100"}
                                            ${isDropTarget ? "border-t-2 border-t-gray-500 pt-0.5" : ""}
                                            ${highlightedVariable?.id === variable.aggregateId && highlightedVariable.source === 'aggregated'
                                            ? "bg-gray-200 border-gray-500"
                                            : "border-gray-300"
                                        }`}
                                        onClick={() => handleAggregatedVariableSelect(variable.aggregateId)}
                                        onDoubleClick={() => handleAggregatedDoubleClick(variable.aggregateId)}
                                        draggable={true}
                                        onDragStart={(e) => handleDragStart(e, variable, 'aggregated')}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => handleItemDragOver(e, index, 'aggregated')}
                                        onDragLeave={() => { setDragOverIndex(null); }}
                                        onDrop={(e) => { e.stopPropagation(); handleDrop(e, 'aggregated', index); }}
                                    >
                                        <div className="flex items-center w-full">
                                            <GripVertical size={14} className="text-gray-400 mr-1 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            <span className="text-xs truncate">{variable.displayName}</span>
                                        </div>
                                        {showBottomLine && (<div className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-gray-500 z-10"></div>)}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p className="text-xs">{variable.displayName}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-4 gap-4 py-2">
            {/* Available Variables Column */}
            <div className="col-span-2 flex flex-col relative" id="aggregate-available-vars-wrapper">
                <Label className={cn("text-xs font-semibold mb-1", isStepActive("aggregate-available-vars-wrapper") && "text-primary")}>Available Variables</Label>
                {renderVariableList(availableVariables, 'available', '250px')}
                <ActiveElementHighlight active={isStepActive("aggregate-available-vars-wrapper")} />
            </div>

            {/* Target Variables Column */}
            <div className="col-span-2 space-y-4">
                <div className="relative">
                    <div className="flex items-center mb-1 relative" id="aggregate-to-break-arrow">
                        {renderArrowButton('break')}
                        <Label className={cn("text-xs font-semibold", isStepActive("aggregate-to-break-arrow") && "text-primary", isStepActive("aggregate-break-vars-wrapper") && "text-primary")}>Break Variable(s):</Label>
                        <ActiveElementHighlight active={isStepActive("aggregate-to-break-arrow")} />
                    </div>
                    <div className="relative" id="aggregate-break-vars-wrapper">
                        {renderVariableList(breakVariables, 'break', '80px')}
                        <ActiveElementHighlight active={isStepActive("aggregate-break-vars-wrapper")} />
                    </div>
                </div>

                <div className="relative">
                    <div className="flex items-center mb-1 relative" id="aggregate-to-aggregated-arrow">
                        {renderArrowButton('aggregated')}
                        <Label className={cn("text-xs font-semibold", isStepActive("aggregate-to-aggregated-arrow") && "text-primary", isStepActive("aggregate-aggregated-vars-wrapper") && "text-primary")}>Aggregated Variables</Label>
                         <ActiveElementHighlight active={isStepActive("aggregate-to-aggregated-arrow")} />
                    </div>
                    <div className="text-xs mb-1">Summaries of Variable(s):</div>
                    <div className="relative" id="aggregate-aggregated-vars-wrapper">
                        {renderAggregatedList(aggregatedVariables, '110px')}
                        <ActiveElementHighlight active={isStepActive("aggregate-aggregated-vars-wrapper")} />
                    </div>

                    <div className="flex gap-1 mt-1">
                        <div className="relative" id="aggregate-function-button">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={handleFunctionClick}
                                disabled={!(highlightedVariable?.source === 'aggregated')}
                            >
                                Function...
                            </Button>
                            <ActiveElementHighlight active={isStepActive("aggregate-function-button")} />
                        </div>
                        <div className="relative" id="aggregate-name-label-button">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={handleNameLabelClick}
                                disabled={!(highlightedVariable?.source === 'aggregated')}
                            >
                                Name & Label...
                            </Button>
                            <ActiveElementHighlight active={isStepActive("aggregate-name-label-button")} />
                        </div>
                    </div>

                    <div className="flex items-center mt-1 gap-2 relative" id="aggregate-n-cases-wrapper">
                        <div className="flex items-center gap-1">
                            <Checkbox id="number-cases" className="w-3 h-3" />
                            <Label htmlFor="number-cases" className={cn("text-xs", isStepActive("aggregate-n-cases-wrapper") && "text-primary")}>Number of cases</Label>
                        </div>

                        <div className="flex items-center gap-1">
                            <Label className={cn("text-xs", isStepActive("aggregate-n-cases-wrapper") && "text-primary")}>Name:</Label>
                            <Input
                                value={breakName}
                                onChange={(e) => setBreakName(e.target.value)}
                                className="h-6 text-xs w-24"
                            />
                        </div>
                        <ActiveElementHighlight active={isStepActive("aggregate-n-cases-wrapper")} />
                    </div>
                </div>
            </div>

            <div className="col-span-4">
                <div className="text-xs mt-2 text-gray-500 flex items-center">
                    <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                    <span>Drag and drop or double-click variables to move them between lists</span>
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;