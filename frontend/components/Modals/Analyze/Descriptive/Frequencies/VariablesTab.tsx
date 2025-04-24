import React, { FC, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Ruler, Shapes, BarChartHorizontal, InfoIcon, GripVertical, MoveHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Variable } from "@/types/Variable";

interface VariablesTabProps {
    availableVariables: Variable[];
    selectedVariables: Variable[];
    highlightedVariable: { tempId: string, source: 'available' | 'selected' } | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<{ tempId: string, source: 'available' | 'selected' } | null>>;
    moveToSelectedVariables: (variable: Variable, targetIndex?: number) => void;
    moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
    reorderVariables?: (source: 'available' | 'selected', variables: Variable[]) => void;
    showFrequencyTables: boolean;
    setShowFrequencyTables: React.Dispatch<React.SetStateAction<boolean>>;
}

const VariablesTab: FC<VariablesTabProps> = ({
                                                 availableVariables,
                                                 selectedVariables,
                                                 highlightedVariable,
                                                 setHighlightedVariable,
                                                 moveToSelectedVariables,
                                                 moveToAvailableVariables,
                                                 reorderVariables = () => {},
                                                 showFrequencyTables,
                                                 setShowFrequencyTables,
                                             }) => {
    const [draggedItem, setDraggedItem] = useState<{ variable: Variable, source: 'available' | 'selected' } | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState<'available' | 'selected' | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
        if (highlightedVariable?.tempId === variable.tempId && highlightedVariable?.source === source) {
            setHighlightedVariable(null);
        } else if (variable.tempId) {
            setHighlightedVariable({ tempId: variable.tempId, source });
        }
    };

    const handleVariableDoubleClick = (variable: Variable, source: 'available' | 'selected') => {
        if (source === 'available') {
            moveToSelectedVariables(variable);
        } else {
            moveToAvailableVariables(variable);
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, variable: Variable, source: 'available' | 'selected') => {
        if (!variable.tempId) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('application/json', JSON.stringify({
            tempId: variable.tempId,
            source
        }));
        e.dataTransfer.effectAllowed = 'move';
        setDraggedItem({ variable, source });
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
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
        setIsDraggingOver(null);
        setDragOverIndex(null);

        try {
            const dataString = e.dataTransfer.getData('application/json');
            if (!dataString) return;

            const data = JSON.parse(dataString);
            const { tempId, source: dragSource } = data;

            if (!tempId) {
                console.error("[handleDrop] tempId missing from drag data");
                setDraggedItem(null);
                return;
            }

            const sourceList = dragSource === 'available' ? availableVariables : selectedVariables;
            const variableToMove = sourceList.find(v => v.tempId === tempId);

            if (!variableToMove) {
                 console.error(`[handleDrop] Variable with tempId ${tempId} not found in source list (${dragSource})`);
                 setDraggedItem(null);
                return;
            }

            if (dragSource === targetSource && typeof targetIndex === 'number') {
                const currentList = [...sourceList];
                const sourceIndex = currentList.findIndex(v => v.tempId === tempId);

                if (sourceIndex === -1) {
                    console.error("[handleDrop] Dragged item not found in current list for reorder.");
                    setDraggedItem(null);
                    return;
                }

                if (sourceIndex === targetIndex || sourceIndex === targetIndex - 1) {
                    setDraggedItem(null);
                    return;
                }

                const [movedVariable] = currentList.splice(sourceIndex, 1);
                const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
                currentList.splice(adjustedTargetIndex, 0, movedVariable);

                reorderVariables(targetSource, currentList);
            }
            else if (dragSource !== targetSource) {
                if (targetSource === 'selected') {
                    moveToSelectedVariables(variableToMove, targetIndex);
                } else {
                    moveToAvailableVariables(variableToMove, targetIndex);
                }
            }
        } catch (error) {
            console.error('[handleDrop] Error processing drop:', error);
        }

        setDraggedItem(null);
        setDragOverIndex(null);
        setIsDraggingOver(null);
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
                    const isDraggingThis = isSameListDrag && draggedItem?.variable.tempId === variable.tempId;
                    const currentDragOverIndex = dragOverIndex;
                    const isDropTarget = isSameListDrag && currentDragOverIndex === index && draggedItem;
                    const showTopLine = isDropTarget;

                    return (
                        <TooltipProvider key={variable.tempId || variable.columnIndex}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={`flex items-center p-1 cursor-grab border rounded-md group relative transition-all duration-150 ease-in-out
                                            ${isDraggingThis ? "opacity-40 bg-[#FAFAFA]" : "hover:bg-[#F5F5F5]"}
                                            ${showTopLine ? "border-t-[3px] border-t-blue-500 pt-[1px]" : "pt-1"}
                                             ${highlightedVariable?.tempId === variable.tempId && highlightedVariable?.source === source
                                            ? "bg-[#E6E6E6] border-[#888888]"
                                            : "border-[#CCCCCC]"
                                        }`}
                                        style={{
                                            borderTopStyle: showTopLine ? 'solid' : 'solid',
                                            borderTopWidth: showTopLine ? '3px' : '1px',
                                            borderTopColor: showTopLine ? '#3B82F6' : (highlightedVariable?.tempId === variable.tempId && highlightedVariable?.source === source ? '#888888' : '#CCCCCC'),
                                            paddingTop: showTopLine ? '1px' : '4px',
                                            paddingBottom: '4px',
                                            borderLeftWidth: '1px', borderRightWidth: '1px', borderBottomWidth: '1px',
                                            borderLeftColor: highlightedVariable?.tempId === variable.tempId && highlightedVariable?.source === source ? '#888888' : '#CCCCCC',
                                            borderRightColor: highlightedVariable?.tempId === variable.tempId && highlightedVariable?.source === source ? '#888888' : '#CCCCCC',
                                            borderBottomColor: highlightedVariable?.tempId === variable.tempId && highlightedVariable?.source === source ? '#888888' : '#CCCCCC',
                                        }}
                                        onClick={() => handleVariableSelect(variable, source)}
                                        onDoubleClick={() => handleVariableDoubleClick(variable, source)}
                                        draggable={!!variable.tempId}
                                        onDragStart={(e) => handleDragStart(e, variable, source)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => handleItemDragOver(e, index, source)}
                                        onDragLeave={() => {
                                            if (dragOverIndex === index) {
                                                setDragOverIndex(null);
                                            }
                                        }}
                                        onDrop={(e) => {
                                            e.stopPropagation();
                                            handleDrop(e, source, index);
                                        }}
                                    >
                                        <div className="flex items-center w-full">
                                            <GripVertical size={14} className="text-[#AAAAAA] mr-1 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            {getVariableIcon(variable)}
                                            <span className="text-sm truncate">{getDisplayName(variable)}</span>
                                        </div>
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
            <div>
                <div className="flex items-center mb-2">
                    <div className="text-sm font-medium mb-4">Available Variables:</div>
                </div>
                {renderVariableList(availableVariables, 'available', '300px')}
                <div className="mt-2">
                    <div className="flex items-center">
                        <Checkbox
                            id="frequencyTables"
                            checked={showFrequencyTables}
                            onCheckedChange={(checked) => setShowFrequencyTables(!!checked)}
                            className="mr-2 border-[#CCCCCC]"
                        />
                        <Label htmlFor="frequencyTables" className="text-sm cursor-pointer">
                            Display frequency tables
                        </Label>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex items-center mb-2">
                    <div className="text-sm font-medium mb-4">Selected Variables:</div>
                </div>
                {renderVariableList(selectedVariables, 'selected', '300px')}
                <div className="text-sm mt-2 text-[#888888] flex items-center p-1 rounded bg-[#F7F7F7] border border-[#E6E6E6]">
                    <InfoIcon size={14} className="mr-1.5 flex-shrink-0" />
                    <span>
                        Drag to reorder or move between lists
                    </span>
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;