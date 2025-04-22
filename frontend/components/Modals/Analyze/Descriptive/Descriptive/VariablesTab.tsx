import React, { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Variable } from "@/types/Variable";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    MoveHorizontal,
    GripVertical,
    InfoIcon
} from "lucide-react";

interface VariablesTabProps {
    availableVariables: Variable[];
    selectedVariables: Variable[];
    highlightedVariable: { columnIndex: number, source: 'available' | 'selected' } | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<{ columnIndex: number, source: 'available' | 'selected' } | null>>;
    moveToSelectedVariables: (variable: Variable, targetIndex?: number) => void;
    moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
    reorderVariables: (source: 'available' | 'selected', variables: Variable[]) => void;
    saveStandardized: boolean;
    setSaveStandardized: React.Dispatch<React.SetStateAction<boolean>>;
}

const VariablesTab: FC<VariablesTabProps> = ({
                                                 availableVariables,
                                                 selectedVariables,
                                                 highlightedVariable,
                                                 setHighlightedVariable,
                                                 moveToSelectedVariables,
                                                 moveToAvailableVariables,
                                                 reorderVariables,
                                                 saveStandardized,
                                                 setSaveStandardized
                                             }) => {
    const [draggedItem, setDraggedItem] = useState<{ variable: Variable, source: 'available' | 'selected' } | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState<'available' | 'selected' | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleVariableSelect = (variable: Variable, source: 'available' | 'selected') => {
        if (highlightedVariable?.columnIndex === variable.columnIndex && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ columnIndex: variable.columnIndex, source });
        }
    };

    const handleVariableDoubleClick = (variable: Variable, source: 'available' | 'selected') => {
        if (source === "available") {
            moveToSelectedVariables(variable);
        } else if (source === "selected") {
            moveToAvailableVariables(variable);
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, variable: Variable, source: 'available' | 'selected') => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            columnIndex: variable.columnIndex,
            source
        }));
        e.dataTransfer.effectAllowed = 'move';
        setDraggedItem({ variable, source });
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setIsDraggingOver(null);
        setDragOverIndex(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetSource: 'available' | 'selected') => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDraggingOver(targetSource);
        if (draggedItem && draggedItem.source !== targetSource && dragOverIndex !== null) {
            setDragOverIndex(null);
        }
    };

    const handleItemDragOver = (e: React.DragEvent<HTMLDivElement>, targetIndex: number, listSource: 'available' | 'selected') => {
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

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetSource: 'available' | 'selected', targetIndex?: number) => {
        e.preventDefault();
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            const { columnIndex, source } = data;

            const sourceList = source === 'available' ? availableVariables : selectedVariables;
            const variable = sourceList.find(v => v.columnIndex === columnIndex);

            if (!variable) return;

            if (source === targetSource && targetIndex !== undefined) {
                const currentList = [...sourceList];
                const sourceIndex = currentList.findIndex(v => v.columnIndex === columnIndex);

                if (sourceIndex === targetIndex || sourceIndex === targetIndex - 1) {
                    setIsDraggingOver(null);
                    setDraggedItem(null);
                    setDragOverIndex(null);
                    return;
                }

                const [movedVariable] = currentList.splice(sourceIndex, 1);
                const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
                currentList.splice(adjustedTargetIndex, 0, movedVariable);
                reorderVariables(targetSource, currentList);
            }
            else if (source !== targetSource) {
                if (targetSource === 'selected') {
                    moveToSelectedVariables(variable, targetIndex);
                } else {
                    moveToAvailableVariables(variable, targetIndex);
                }
            }
        } catch (error) {
            console.error('[handleDrop] Error parsing drag data:', error);
        }

        setIsDraggingOver(null);
        setDraggedItem(null);
        setDragOverIndex(null);
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

    const getAnimationClass = (source: 'available' | 'selected'): string => {
        return "transition-all duration-150";
    };

    const renderVariableList = (variables: Variable[], source: 'available' | 'selected', height: string) => (
        <div
            className={`border p-2 rounded-md overflow-y-auto overflow-x-hidden transition-colors relative ${
                isDraggingOver === source
                    ? "border-blue-500 bg-blue-50"
                    : "border-[#E6E6E6]"
            }`}
            style={{ height }}
            onDragOver={(e) => handleDragOver(e, source)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, source)}
        >
            {variables.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#888888] pointer-events-none p-4">
                    <MoveHorizontal size={24} className="mb-2" />
                    <p className="text-sm text-center">
                        {source === 'available'
                            ? "All variables have been selected"
                            : "Drop variables here or double-click from Available Variables"}
                    </p>
                </div>
            )}
            <div className={`space-y-0.5 p-2 ${getAnimationClass(source)}`}>
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
                                                ${highlightedVariable?.columnIndex === variable.columnIndex && highlightedVariable.source === source
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
                                            <span className="text-sm truncate">{getDisplayName(variable)}</span>
                                        </div>
                                        {showBottomLine && (<div className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-[#888888] z-10"></div>)}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p className="text-sm">{getDisplayName(variable)}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-2 gap-6">
            <div className="col-span-1">
                <div className="text-sm mb-2 font-medium">Variables:</div>
                {renderVariableList(availableVariables, 'available', '250px')}
                <div className="text-xs mt-2 text-[#888888] flex items-center">
                    <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                    <span>Double-click to move variables between lists</span>
                </div>
            </div>

            <div className="col-span-1">
                <div className="text-sm mb-2 font-medium">Variable(s):</div>
                {renderVariableList(selectedVariables, 'selected', '250px')}

                <div className="mt-4">
                    <div className="flex items-center">
                        <Checkbox
                            id="saveStandardized"
                            checked={saveStandardized}
                            onCheckedChange={(checked) => setSaveStandardized(!!checked)}
                            className="mr-2 border-[#CCCCCC] data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
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