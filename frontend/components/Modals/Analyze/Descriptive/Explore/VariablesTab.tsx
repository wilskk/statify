import React, { FC, useState } from "react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Ruler, Shapes, BarChartHorizontal, InfoIcon, GripVertical, MoveHorizontal } from "lucide-react";
import type { Variable } from "@/types/Variable";

// Define source types, excluding 'label' from reordering
type ReorderableSource = 'available' | 'dependent' | 'factor';
type AllSource = ReorderableSource | 'label';

interface VariablesTabProps {
    availableVariables: Variable[];
    dependentVariables: Variable[];
    factorVariables: Variable[];
    labelVariable: Variable | null;
    highlightedVariable: {tempId: string, source: AllSource} | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<{tempId: string, source: AllSource} | null>>;

    moveToAvailableVariables: (variable: Variable, source: 'dependent' | 'factor' | 'label', targetIndex?: number) => void;
    moveToDependentVariables: (variable: Variable, targetIndex?: number) => void;
    moveToFactorVariables: (variable: Variable, targetIndex?: number) => void;
    moveToLabelVariable: (variable: Variable) => void;
    reorderVariables: (source: ReorderableSource, variables: Variable[]) => void;

    errorMsg: string | null;
}

const VariablesTab: FC<VariablesTabProps> = ({
                                                 availableVariables,
                                                 dependentVariables,
                                                 factorVariables,
                                                 labelVariable,
                                                 highlightedVariable,
                                                 setHighlightedVariable,
                                                 moveToAvailableVariables,
                                                 moveToDependentVariables,
                                                 moveToFactorVariables,
                                                 moveToLabelVariable,
                                                 reorderVariables,
                                                 errorMsg
                                             }): React.ReactNode => {
    const [draggedItem, setDraggedItem] = useState<{ variable: Variable, source: AllSource } | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState<AllSource | null>(null);
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

    const handleVariableSelect = (variable: Variable, source: AllSource) => {
        if (highlightedVariable && highlightedVariable.tempId === variable.tempId && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else if (variable.tempId) {
            setHighlightedVariable({ tempId: variable.tempId, source });
        }
    };

    const handleVariableDoubleClick = (variable: Variable, source: AllSource) => {
        if (source === 'available') {
            moveToDependentVariables(variable);
        } else if (source === 'dependent') {
            moveToAvailableVariables(variable, 'dependent');
        } else if (source === 'factor') {
            moveToAvailableVariables(variable, 'factor');
        } else if (source === 'label') {
            moveToAvailableVariables(variable, 'label');
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, variable: Variable, source: AllSource) => {
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
        setHighlightedVariable(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setIsDraggingOver(null);
        setDragOverIndex(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetSource: AllSource) => {
        e.preventDefault();
        if (draggedItem?.source === 'label' && targetSource !== 'available') {
            e.dataTransfer.dropEffect = 'none';
            return;
        }
        if (targetSource === 'label' && labelVariable && labelVariable.tempId !== draggedItem?.variable.tempId) {
             e.dataTransfer.dropEffect = 'none';
             return;
        }

        e.dataTransfer.dropEffect = 'move';
        setIsDraggingOver(targetSource);
        if (draggedItem && draggedItem.source !== targetSource && dragOverIndex !== null) {
            setDragOverIndex(null);
        }
    };

    const handleItemDragOver = (e: React.DragEvent<HTMLDivElement>, targetIndex: number, listSource: AllSource) => {
        e.preventDefault();
        e.stopPropagation();
        if (listSource === 'label') return;

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

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetSource: AllSource, targetIndex?: number) => {
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

            let sourceList: Variable[] = [];
            if (dragSource === 'available') {
                sourceList = availableVariables;
            } else if (dragSource === 'dependent') {
                sourceList = dependentVariables;
            } else if (dragSource === 'factor') {
                sourceList = factorVariables;
            } else if (dragSource === 'label' && labelVariable) {
                sourceList = [labelVariable];
            }

            const variableToMove = sourceList.find(v => v.tempId === tempId);

            if (!variableToMove) {
                 console.error(`[handleDrop] Variable with tempId ${tempId} not found in source list (${dragSource})`);
                 setDraggedItem(null);
                 return;
            }

            if (dragSource === targetSource && targetSource !== 'label' && typeof targetIndex === 'number') {
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
                reorderVariables(targetSource as ReorderableSource, currentList);
            }
            else if (dragSource !== targetSource) {
                if (targetSource === 'available') {
                    moveToAvailableVariables(variableToMove, dragSource as 'dependent' | 'factor' | 'label', targetIndex);
                } else if (targetSource === 'dependent') {
                    moveToDependentVariables(variableToMove, targetIndex);
                } else if (targetSource === 'factor') {
                    moveToFactorVariables(variableToMove, targetIndex);
                } else if (targetSource === 'label') {
                    if (!labelVariable || labelVariable.tempId === variableToMove.tempId) {
                        moveToLabelVariable(variableToMove);
                    }
                }
            }
        } catch (error) {
            console.error('[handleDrop] Error processing drop:', error as Error);
        }

        setDraggedItem(null);
    };

    const getAnimationClass = (source: AllSource): string => {
        return "transition-all duration-150";
    };

    const renderVariableList = (variables: Variable[], source: AllSource, height: string, title?: string) => (
        <div className={`mb-1 ${source !== 'available' ? 'pl-1 pr-1 pb-1 pt-0 border border-[#E6E6E6] rounded-md bg-[#F7F7F7]' : ''}`}>
             {title && <div className="text-xs font-medium text-[#555555] mb-1.5 pl-1">{title}</div>}
            <div
                className={`border p-1 rounded-md w-full overflow-y-auto overflow-x-hidden transition-colors relative bg-white ${source === 'label' && variables.length > 0 ? 'cursor-not-allowed' : ''} ${
                    isDraggingOver === source
                        ? "border-blue-500 bg-blue-50"
                        : "border-[#CCCCCC]"
                }`}
                style={{ height }}
                onDragOver={(e) => handleDragOver(e, source)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, source)}
            >
                {variables.length === 0 && source !== 'available' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[#AAAAAA] pointer-events-none p-2">
                        <MoveHorizontal size={18} className="mb-1" />
                        <p className="text-[11px] text-center">{source === 'label' ? "Drop one variable here" : "Drop variables here"}</p>
                    </div>
                )}
                {variables.length === 0 && source === 'available' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[#AAAAAA] pointer-events-none p-4">
                        <p className="text-sm text-center">All variables used</p>
                    </div>
                )}

                <div className={`space-y-0.5 ${getAnimationClass(source)} ${source === 'label' ? 'p-0.5' : 'p-0.5'}`}>
                    {variables.map((variable, index) => {
                        if (!variable.tempId) return null;

                        const isSameListDrag = draggedItem?.source === source;
                        const isDraggingThis = isSameListDrag && draggedItem?.variable.tempId === variable.tempId;
                        const currentDragOverIndex = dragOverIndex;
                        const isReorderableList = source !== 'label';

                        const isDropTarget = isReorderableList && isSameListDrag && currentDragOverIndex === index && draggedItem && !isDraggingThis;
                        const showTopLine = isDropTarget;

                        return (
                            <TooltipProvider key={variable.tempId}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`flex items-center p-1 border rounded-md group relative transition-all duration-150 ease-in-out
                                                ${source !== 'label' ? 'cursor-grab' : 'cursor-default'} ${
                                                isDraggingThis ? "opacity-40 bg-[#FAFAFA]" : "hover:bg-[#F5F5F5]"}
                                                ${showTopLine ? "border-t-[3px] border-t-blue-500 pt-[1px]" : "pt-1"}
                                                ${highlightedVariable?.tempId === variable.tempId && highlightedVariable.source === source
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
                                            draggable={!!variable.tempId && source !== 'label'}
                                            onDragStart={(e) => handleDragStart(e, variable, source)}
                                            onDragEnd={handleDragEnd}
                                            onDragOver={(e) => isReorderableList && handleItemDragOver(e, index, source)}
                                            onDragLeave={() => {
                                                 if (isReorderableList && dragOverIndex === index) {
                                                     setDragOverIndex(null);
                                                 }
                                            }}
                                            onDrop={(e) => {
                                                e.stopPropagation();
                                                handleDrop(e, source, index);
                                            }}
                                        >
                                            <div className="flex items-center w-full">
                                                {isReorderableList && <GripVertical size={14} className="text-[#AAAAAA] mr-1 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />}
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
        </div>
    );

    return (
        <div className="grid grid-cols-2 gap-4">
            {/* Available Variables Column */}
            <div className="col-span-1 flex flex-col">
                <div className="text-sm font-medium mb-2 pl-1">Available Variables:</div>
                {renderVariableList(availableVariables, 'available', '330px')}
                <div className="text-xs mt-2 text-[#888888] flex items-center p-1.5 rounded bg-[#F9F9F9] border border-[#E6E6E6]">
                    <InfoIcon size={14} className="mr-1.5 flex-shrink-0 text-[#AAAAAA]" />
                    <span>
                        Drag to reorder or move between lists
                    </span>
                </div>
            </div>

            {/* Target Variables Column */}
            <div className="col-span-1 flex flex-col">
                <div className="space-y-2">
                    {renderVariableList(dependentVariables, 'dependent', '140px', 'Dependent List')}
                    {renderVariableList(factorVariables, 'factor', '90px', 'Factor List')}
                    {renderVariableList(labelVariable ? [labelVariable] : [], 'label', '50px', 'Label Cases by')}
                </div>
            </div>

            {errorMsg && <div className="col-span-2 text-red-600 text-sm mt-1 p-2 bg-red-50 border border-red-200 rounded">{errorMsg}</div>}
        </div>
    );
};

export default VariablesTab;