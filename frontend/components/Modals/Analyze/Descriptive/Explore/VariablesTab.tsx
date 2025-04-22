import React, { FC, useState } from "react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Ruler, Shapes, BarChartHorizontal, InfoIcon, GripVertical, MoveHorizontal } from "lucide-react";
import type { Variable } from "@/types/Variable";

interface VariablesTabProps {
    availableVariables: Variable[];
    dependentVariables: Variable[];
    factorVariables: Variable[];
    labelVariable: Variable | null;
    highlightedVariable: {id: string, source: 'available' | 'dependent' | 'factor' | 'label'} | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<{id: string, source: 'available' | 'dependent' | 'factor' | 'label'} | null>>;

    moveToAvailableVariables: (variable: Variable, source: 'dependent' | 'factor' | 'label', targetIndex?: number) => void;
    moveToDependentVariables: (variable: Variable, targetIndex?: number) => void;
    moveToFactorVariables: (variable: Variable, targetIndex?: number) => void;
    moveToLabelVariable: (variable: Variable) => void;
    reorderVariables: (source: 'available' | 'dependent' | 'factor' | 'label', variables: Variable[]) => void;

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
                                             }) => {
    const [draggedItem, setDraggedItem] = useState<{ variable: Variable, source: 'available' | 'dependent' | 'factor' | 'label' } | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState<'available' | 'dependent' | 'factor' | 'label' | null>(null);
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

    const handleVariableSelect = (variable: Variable, source: 'available' | 'dependent' | 'factor' | 'label') => {
        if (highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: variable.columnIndex.toString(), source });
        }
    };

    const handleVariableDoubleClick = (variable: Variable, source: 'available' | 'dependent' | 'factor' | 'label') => {
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

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, variable: Variable, source: 'available' | 'dependent' | 'factor' | 'label') => {
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

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetSource: 'available' | 'dependent' | 'factor' | 'label') => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDraggingOver(targetSource);
        if (draggedItem && draggedItem.source !== targetSource && dragOverIndex !== null) {
            setDragOverIndex(null);
        }
    };

    const handleItemDragOver = (e: React.DragEvent<HTMLDivElement>, targetIndex: number, listSource: 'available' | 'dependent' | 'factor' | 'label') => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        if (listSource === 'label') return; // Cannot drop within Label list

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

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetSource: 'available' | 'dependent' | 'factor' | 'label', targetIndex?: number) => {
        e.preventDefault();
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            const { columnIndex, source } = data;

            // Define the proper type for sourceList
            let sourceList: Variable[] = [];

            // Assign the appropriate list based on source
            if (source === 'available') {
                sourceList = availableVariables;
            } else if (source === 'dependent') {
                sourceList = dependentVariables;
            } else if (source === 'factor') {
                sourceList = factorVariables;
            } else if (source === 'label' && labelVariable) {
                sourceList = [labelVariable]; // Treat single label as list
            }

            const variable = sourceList.find(v => v.columnIndex === columnIndex);

            if (!variable) return;

            // Reordering within the same list (excluding 'label')
            if (source === targetSource && targetIndex !== undefined && source !== 'label') {
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
                reorderVariables(source, currentList);
            }
            // Moving between lists
            else if (source !== targetSource) {
                // Move from any list back to available
                if (targetSource === 'available') {
                    moveToAvailableVariables(variable, source as 'dependent' | 'factor' | 'label', targetIndex);
                }
                // Move from available to a specific list
                else if (source === 'available') {
                    if (targetSource === 'label') {
                        if (!labelVariable) { // Only move if no label exists
                            moveToLabelVariable(variable);
                        }
                    } else if (targetSource === 'dependent') {
                        moveToDependentVariables(variable, targetIndex);
                    } else if (targetSource === 'factor') {
                        moveToFactorVariables(variable, targetIndex);
                    }
                }
                // Direct moves between dependent/factor/label
                else if (source === 'dependent' && targetSource === 'factor') {
                    moveToFactorVariables(variable, targetIndex);
                    moveToAvailableVariables(variable, 'dependent');
                }
                else if (source === 'dependent' && targetSource === 'label') {
                    if (!labelVariable) {
                        moveToLabelVariable(variable);
                        moveToAvailableVariables(variable, 'dependent');
                    }
                }
                else if (source === 'factor' && targetSource === 'dependent') {
                    moveToDependentVariables(variable, targetIndex);
                    moveToAvailableVariables(variable, 'factor');
                }
                else if (source === 'factor' && targetSource === 'label') {
                    if (!labelVariable) {
                        moveToLabelVariable(variable);
                        moveToAvailableVariables(variable, 'factor');
                    }
                }
                else if (source === 'label' && targetSource === 'dependent') {
                    moveToDependentVariables(variable, targetIndex);
                    moveToAvailableVariables(variable, 'label');
                }
                else if (source === 'label' && targetSource === 'factor') {
                    moveToFactorVariables(variable, targetIndex);
                    moveToAvailableVariables(variable, 'label');
                }
            }
        } catch (error) {
            console.error('[handleDrop] Error processing drop:', error);
        }

        setIsDraggingOver(null);
        setDraggedItem(null);
        setDragOverIndex(null);
    };

    const getAnimationClass = (source: 'available' | 'dependent' | 'factor' | 'label'): string => {
        return "transition-all duration-150";
    };

    const renderVariableList = (variables: Variable[], source: 'available' | 'dependent' | 'factor' | 'label', height: string) => (
        <div
            className={`border p-2 rounded-md w-full overflow-y-auto overflow-x-hidden transition-colors relative bg-white ${
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
                    <p className="text-xs text-center">{source === 'label' ? "Drop one variable here" : "Drop variables here"}</p>
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
                                        className={`flex items-center p-1 border rounded-md group relative
                                                ${source !== 'label' ? 'cursor-grab' : 'cursor-pointer'}
                                                ${isDraggingThis ? "opacity-40 bg-[#FAFAFA]" : "hover:bg-[#F5F5F5]"}
                                                ${isDropTarget && source !== 'label' ? "border-t-[3px] border-t-[#888888] pt-0.5" : ""}
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
                                            {source !== 'label' && <GripVertical size={14} className="text-[#AAAAAA] mr-1 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />}
                                            {getVariableIcon(variable)}
                                            <span className="text-xs truncate">{getDisplayName(variable)}</span>
                                        </div>
                                        {showBottomLine && source !== 'label' && (<div className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-[#888888] z-10"></div>)}
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
        <div className="grid grid-cols-2 gap-6">
            {/* Available Variables Column */}
            <div className="col-span-1">
                <div className="text-sm font-medium mb-2">Available Variables:</div>
                {renderVariableList(availableVariables, 'available', '330px')}
                <div className="text-xs mt-2 text-[#888888] flex items-center p-1.5 rounded bg-[#F7F7F7] border border-[#E6E6E6]">
                    <InfoIcon size={14} className="mr-1.5 flex-shrink-0" />
                    <span>
                        Drag or double-click variables to move them between lists
                    </span>
                </div>
            </div>

            {/* Target Variables Column */}
            <div className="col-span-1">
                <div className="space-y-4">
                    <div>
                        <Label className="block text-sm mb-2 font-medium">Dependent List:</Label>
                        {renderVariableList(dependentVariables, 'dependent', '140px')}
                    </div>
                    <div>
                        <Label className="block text-sm mb-2 font-medium">Factor List:</Label>
                        {renderVariableList(factorVariables, 'factor', '90px')}
                    </div>
                    <div>
                        <Label className="block text-sm mb-2 font-medium">Label Cases by:</Label>
                        {renderVariableList(labelVariable ? [labelVariable] : [], 'label', '50px')}
                    </div>
                </div>
            </div>

            {errorMsg && <div className="col-span-2 text-red-600 text-sm mt-1">{errorMsg}</div>}
        </div>
    );
};

export default VariablesTab;