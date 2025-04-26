import React, { FC, useState, useCallback } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Ruler, Shapes, BarChartHorizontal, InfoIcon, GripVertical, MoveHorizontal, ArrowBigDown, ArrowBigLeft } from "lucide-react";
import type { Variable } from "@/types/Variable";

// Define the structure for configuring target lists
export interface TargetListConfig {
    id: string; // Unique identifier for the list (e.g., 'selected', 'rows', 'factors')
    title: string; // Display title for the list
    variables: Variable[]; // The array of variables currently in this list
    height: string; // CSS height for the list container
    maxItems?: number; // Optional limit for the number of items
    droppable?: boolean; // Whether items can be dropped into this list (defaults to true)
    draggableItems?: boolean; // Whether items *within* this list can be dragged (defaults to true)
}

// Props for the reusable component
interface VariableListManagerProps {
    availableVariables: Variable[];
    targetLists: TargetListConfig[];
    variableIdKey: keyof Variable; // Key to use for unique identification ('tempId' or 'columnIndex')
    highlightedVariable: { id: string, source: string } | null; // Use generic 'id' and 'source'
    setHighlightedVariable: (value: { id: string, source: string } | null) => void;
    onMoveVariable: (variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => void;
    onReorderVariable: (listId: string, variables: Variable[]) => void;
    getVariableIcon?: (variable: Variable) => React.ReactNode; // Optional custom icon function
    getDisplayName?: (variable: Variable) => string; // Optional custom display name function
    renderListFooter?: (listId: string) => React.ReactNode; // Optional footer for specific lists
    onVariableDoubleClick?: (variable: Variable, sourceListId: string) => void; // Optional double click handler
    showArrowButtons?: boolean; // Whether to show arrow buttons between lists
    availableListHeight?: string; // Optional height for the available variables list
}

// Helper function to get variable icon (default implementation)
const defaultGetVariableIcon = (variable: Variable) => {
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

// Helper function to get display name (default implementation)
const defaultGetDisplayName = (variable: Variable): string => {
    if (variable.label) {
        return `${variable.label} [${variable.name}]`;
    }
    return variable.name;
};


const VariableListManager: FC<VariableListManagerProps> = ({
                                                               availableVariables,
                                                               targetLists,
                                                               variableIdKey,
                                                               highlightedVariable,
                                                               setHighlightedVariable,
                                                               onMoveVariable,
                                                               onReorderVariable,
                                                               getVariableIcon = defaultGetVariableIcon,
                                                               getDisplayName = defaultGetDisplayName,
                                                               renderListFooter,
                                                               onVariableDoubleClick,
                                                               showArrowButtons = true,
                                                               availableListHeight = '300px', // Default height of 300px if not provided
                                                           }) => {
    const [draggedItem, setDraggedItem] = useState<{ variable: Variable, sourceListId: string } | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState<string | null>(null); // Store the ID of the list being dragged over
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const allLists = [
        { id: 'available', title: 'Available Variables', variables: availableVariables, height: availableListHeight }, // Use the provided height
        ...targetLists
    ];

    // --- Drag and Drop Handlers ---

    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, variable: Variable, sourceListId: string) => {
        console.log(`[VariableListManager] handleDragStart - variableId: ${variable?.[variableIdKey]}, sourceListId: ${sourceListId}`);
        const varId = variable[variableIdKey];
        if (varId === undefined || varId === null) {
            console.error("Variable is missing the unique key:", variableIdKey);
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('application/json', JSON.stringify({
            variableId: varId,
            sourceListId: sourceListId
        }));
        e.dataTransfer.effectAllowed = 'move';
        setDraggedItem({ variable, sourceListId });
        setHighlightedVariable(null); // Clear highlight on drag start
    }, [variableIdKey, setHighlightedVariable]);

    const handleDragEnd = useCallback(() => {
        console.log("[VariableListManager] handleDragEnd called");
        setDraggedItem(null);
        setIsDraggingOver(null);
        setDragOverIndex(null);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, targetListId: string) => {
        e.preventDefault();
        const targetListConfig = allLists.find(l => l.id === targetListId);
        const targetDroppable = (targetListConfig as TargetListConfig)?.droppable !== false; // Default true

        // Prevent dropping into non-droppable lists or lists that are full
        if (!targetDroppable || (targetListConfig?.maxItems && targetListConfig.variables.length >= targetListConfig.maxItems && draggedItem?.sourceListId !== targetListId)) {
            e.dataTransfer.dropEffect = 'none';
            setIsDraggingOver(null); // Ensure visual feedback matches drop effect
        } else {
            e.dataTransfer.dropEffect = 'move';
            setIsDraggingOver(targetListId);
            // If dragging to a different list, clear the index indicator
            if (draggedItem && draggedItem.sourceListId !== targetListId && dragOverIndex !== null) {
                setDragOverIndex(null);
            }
        }
    }, [draggedItem, dragOverIndex, allLists]);

    const handleItemDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, targetIndex: number, listId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const listConfig = allLists.find(l => l.id === listId);
        const itemsDraggable = (listConfig as TargetListConfig)?.draggableItems !== false; // Default true

        if (draggedItem && draggedItem.sourceListId === listId && itemsDraggable) {
            e.dataTransfer.dropEffect = 'move';
            setDragOverIndex(targetIndex);
        } else if (!draggedItem || draggedItem.sourceListId !== listId) {
            // Allow drop effect if dropping from another list (handled by handleDragOver)
            // but don't set dragOverIndex unless it's for reordering within the same list
            if (dragOverIndex !== null) {
                setDragOverIndex(null);
            }
            // Ensure the general drop effect is still 'move' if the list is droppable
            const targetListConfig = allLists.find(l => l.id === listId);
            const targetDroppable = (targetListConfig as TargetListConfig)?.droppable !== false;
            if (targetDroppable) {
                e.dataTransfer.dropEffect = 'move';
            } else {
                e.dataTransfer.dropEffect = 'none';
            }
        } else {
            e.dataTransfer.dropEffect = 'none'; // Cannot reorder if draggableItems is false
        }

    }, [draggedItem, dragOverIndex, allLists]);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        // Check if the relatedTarget (where the mouse is going) is still inside the current element
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDraggingOver(null);
            setDragOverIndex(null);
        }
    }, []);


    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetListId: string, targetIndex?: number) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent drop from bubbling to parent container if dropping on item
        console.log(`[VariableListManager] handleDrop fired for targetListId: ${targetListId}, targetIndex: ${targetIndex}`);

        const targetListConfig = allLists.find(l => l.id === targetListId);
        const targetDroppable = (targetListConfig as TargetListConfig)?.droppable !== false;

        // Adjusted condition: Allow drop onto 'available' even if not explicitly 'droppable' in config
        if (!targetDroppable && targetListId !== 'available') {
            handleDragEnd(); // Clean up state even if drop is invalid
            return;
        }

        try {
            const dataString = e.dataTransfer.getData('application/json');
            if (!dataString) throw new Error("No drag data found");

            const { variableId, sourceListId } = JSON.parse(dataString);
            console.log(`[VariableListManager] Drop data - variableId: ${variableId}, sourceListId: ${sourceListId}`);
            if (!variableId || !sourceListId) throw new Error("Invalid drag data structure");

            const sourceList = allLists.find(l => l.id === sourceListId)?.variables;
            if (!sourceList) throw new Error(`Source list ${sourceListId} not found`);

            const variableToMove = sourceList.find(v => v[variableIdKey] === variableId);
            if (!variableToMove) throw new Error(`Variable with ID ${variableId} not found in source list ${sourceListId}`);

            // --- Overwrite Logic for Single-Item Lists (like 'label') ---
            const isReplacingSingleItem = sourceListId !== targetListId &&
                targetListConfig?.maxItems === 1 &&
                targetListConfig.variables.length === 1;

            // --- Check Max Items Constraint (Modified) ---
            // Prevent drop only if it exceeds maxItems AND we are NOT replacing the single item
            if (sourceListId !== targetListId &&
                targetListConfig?.maxItems &&
                targetListConfig.variables.length >= targetListConfig.maxItems &&
                !isReplacingSingleItem) // Allow drop if we are replacing
            {
                console.warn(`Cannot drop into list '${targetListId}'. Max items (${targetListConfig.maxItems}) reached.`);
                handleDragEnd();
                return;
            }

            // --- Perform Overwrite (if necessary) ---
            if (isReplacingSingleItem && targetListConfig) {
                const existingVariable = targetListConfig.variables[0];
                // Move the existing variable back to 'available' first
                onMoveVariable(existingVariable, targetListId, 'available');
            }


            // --- Logic for Moving/Reordering ---
            if (sourceListId === targetListId) {
                // Reordering within the same list
                const listConfig = allLists.find(l => l.id === targetListId) as TargetListConfig | undefined;
                const itemsDraggable = listConfig?.draggableItems !== false; // Default true

                if (!itemsDraggable) {
                    console.warn(`Items in list '${targetListId}' are not reorderable.`);
                    handleDragEnd();
                    return;
                }

                if (typeof targetIndex === 'number') {
                    const currentList = [...sourceList];
                    const sourceIndex = currentList.findIndex(v => v[variableIdKey] === variableId);

                    if (sourceIndex === -1) throw new Error("Dragged item not found in list for reorder");
                    // Allow dropping at the same position if replacing during reorder isn't logical here
                    if (sourceIndex === targetIndex) {
                        handleDragEnd();
                        return;
                    }

                    const [movedVariable] = currentList.splice(sourceIndex, 1);
                    // Adjust target index based on movement direction ONLY if targetIndex is not 0
                    // If targetIndex is 0, we always insert at the beginning.
                    // If sourceIndex < targetIndex, we insert before the original targetIndex position.
                    const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex -1 : targetIndex;

                    currentList.splice(adjustedTargetIndex, 0, movedVariable);

                    onReorderVariable(targetListId, currentList);
                }
            } else {
                // Moving between different lists
                // Use the provided targetIndex if dropping on an item, otherwise append (undefined index)
                const effectiveTargetIndex = typeof targetIndex === 'number' ? targetIndex : undefined;
                onMoveVariable(variableToMove, sourceListId, targetListId, effectiveTargetIndex);
            }

        } catch (error) {
            console.error('[VariableListManager handleDrop] Error:', error);
        } finally {
            handleDragEnd(); // Always reset drag state
        }
    }, [allLists, variableIdKey, onReorderVariable, onMoveVariable, handleDragEnd]);


    // --- Selection and Double Click Handlers ---
    const handleVariableSelect = useCallback((variable: Variable, sourceListId: string) => {
        const varId = variable[variableIdKey]?.toString();
        if (varId === undefined || varId === null) return;
        if (highlightedVariable?.id === varId && highlightedVariable.source === sourceListId) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: varId, source: sourceListId });
        }
    }, [highlightedVariable, setHighlightedVariable, variableIdKey]);

    const handleVariableDoubleClick = useCallback((variable: Variable, sourceListId: string) => {
        const targetListId = sourceListId === 'available'
            ? targetLists.find(l => l.droppable !== false && (!l.maxItems || l.variables.length < l.maxItems || l.maxItems === 1))?.id // Prioritize non-full or single-item lists
            : 'available'; // Default move back to available

        if (targetListId) {
            const targetListConfig = allLists.find(l => l.id === targetListId);
            const isReplacingSingleItem = targetListId !== 'available' &&
                targetListConfig?.maxItems === 1 &&
                targetListConfig.variables.length === 1;

            // Check max items constraint, allowing for replacement
            if (targetListId !== 'available' &&
                targetListConfig?.maxItems &&
                targetListConfig.variables.length >= targetListConfig.maxItems &&
                !isReplacingSingleItem)
            {
                console.warn(`Cannot move to list '${targetListId}'. Max items (${targetListConfig.maxItems}) reached.`);
                return; // Do nothing if the target list is full and not replacing
            }

            // Perform overwrite if necessary
            if (isReplacingSingleItem && targetListConfig) {
                const existingVariable = targetListConfig.variables[0];
                onMoveVariable(existingVariable, targetListId, 'available');
            }

            // Move the double-clicked variable
            onMoveVariable(variable, sourceListId, targetListId);
        } else {
            console.warn("Could not determine valid target list for double click.");
        }
    }, [targetLists, onMoveVariable, allLists, variableIdKey]); // Added variableIdKey dependency

    // --- Arrow Button Handlers ---
    const handleArrowButtonClick = useCallback((targetListId: string) => {
        if (!highlightedVariable) return;

        const { id, source } = highlightedVariable;

        // From available to target list
        if (source === 'available') {
            const variable = availableVariables.find(v => {
                // Using type assertion as a last resort for TypeScript
                return String((v as any)[variableIdKey]) === id;
            });

            if (variable) {
                onMoveVariable(variable, 'available', targetListId);
            }
        }
        // From target list to available
        else if (source === targetListId) {
            const listConfig = targetLists.find(l => l.id === targetListId);
            if (!listConfig) return;

            const variable = listConfig.variables.find(v => {
                // Using type assertion as a last resort for TypeScript
                return String((v as any)[variableIdKey]) === id;
            });

            if (variable) {
                onMoveVariable(variable, targetListId, 'available');
            }
        }
    }, [highlightedVariable, availableVariables, targetLists, variableIdKey, onMoveVariable]);

    // --- Rendering Logic ---
    const renderVariableItem = (variable: Variable, listId: string, index: number) => {
        const varId = variable[variableIdKey]?.toString();
        if (varId === undefined || varId === null) {
            console.warn("Variable missing ID for rendering:", variable);
            return null; // Don't render item if it lacks a unique ID
        }

        const listConfig = allLists.find(l => l.id === listId);
        // Determine if items *within* this list can be reordered or dragged *from*
        const itemsDraggableInList = (listConfig as TargetListConfig)?.draggableItems !== false;
        const isDraggable = itemsDraggableInList || listId === 'available';

        const isBeingDragged = draggedItem?.variable[variableIdKey] === variable[variableIdKey];
        const isHighlighted = highlightedVariable?.id === varId && highlightedVariable.source === listId;
        // Show drop indicator *above* the item at targetIndex if dragging within the same list
        const isDropTargetIndicator = itemsDraggableInList && draggedItem?.sourceListId === listId && dragOverIndex === index && draggedItem && !isBeingDragged;


        return (
            <TooltipProvider key={varId}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={`
                                flex items-center p-1 border rounded-md group relative transition-all duration-150 ease-in-out text-sm
                                ${isDraggable ? 'cursor-grab' : 'cursor-default'}
                                ${isBeingDragged ? "opacity-40 bg-slate-100" : "hover:bg-slate-100"}
                                ${isHighlighted ? "bg-slate-200 border-slate-400" : "border-slate-300"}
                                ${isDropTargetIndicator ? "border-t-[3px] border-t-blue-500 pt-[1px]" : "pt-1"}
                            `}
                            style={{
                                // More precise styling based on state
                                borderTopStyle: isDropTargetIndicator ? 'solid' : 'solid',
                                borderTopWidth: isDropTargetIndicator ? '3px' : '1px',
                                borderTopColor: isDropTargetIndicator ? '#3B82F6' : (isHighlighted ? '#94A3B8' : '#CBD5E1'), // slate-400 and slate-300
                                paddingTop: isDropTargetIndicator ? '1px' : '4px', // Adjust padding for border
                                paddingBottom: '4px',
                                // Consistent side/bottom borders
                                borderLeftWidth: '1px', borderRightWidth: '1px', borderBottomWidth: '1px',
                                borderLeftColor: isHighlighted ? '#94A3B8' : '#CBD5E1',
                                borderRightColor: isHighlighted ? '#94A3B8' : '#CBD5E1',
                                borderBottomColor: isHighlighted ? '#94A3B8' : '#CBD5E1',
                            }}
                            onClick={() => handleVariableSelect(variable, listId)}
                            onDoubleClick={() => handleVariableDoubleClick(variable, listId)}
                            draggable={isDraggable}
                            onDragStart={(e) => isDraggable && handleDragStart(e, variable, listId)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleItemDragOver(e, index, listId)}
                            // No onDragLeave needed here, handled by the list container
                            onDrop={(e) => handleDrop(e, listId, index)} // Pass index for item-specific drop
                        >
                            <div className="flex items-center w-full truncate">
                                {itemsDraggableInList && <GripVertical size={14} className="text-slate-400 mr-1 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />}
                                {!itemsDraggableInList && <div className="w-[14px] mr-1 flex-shrink-0"></div> /* Placeholder */}
                                {getVariableIcon(variable)}
                                <span className="truncate">{getDisplayName(variable)}</span>
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p className="text-sm">{getDisplayName(variable)}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };


    const renderList = (listConfig: TargetListConfig | { id: string, title: string, variables: Variable[], height: string }) => {
        const { id, title, variables, height } = listConfig;
        // Check if it's a full TargetListConfig or just the basic available list structure
        const isTargetConfig = 'droppable' in listConfig || 'draggableItems' in listConfig || 'maxItems' in listConfig;
        const config = isTargetConfig ? listConfig as TargetListConfig : null; // Cast for accessing specific props

        // Determine if items can be dropped INTO this list container
        const droppable = id !== 'available' && (!config || config.droppable !== false); // Can drop into targets unless explicitly false

        const showDropPlaceholder = variables.length === 0 && droppable;

        // Adjust the height for single-item lists
        const isSingleItemList = config?.maxItems === 1;
        const adjustedHeight = isSingleItemList
            ? variables.length === 0 ? "46px" : "auto" // Enough height for placeholder or exactly fit content
            : height;

        // Adjust overflow for single-item lists
        const overflowStyle = isSingleItemList ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden";

        // Render arrow button if showArrowButtons is true
        const renderArrowButton = () => {
            if (!showArrowButtons || id === 'available') return null;

            const isTargetHighlighted = highlightedVariable?.source === id;
            const isAvailableHighlighted = highlightedVariable?.source === 'available';
            const isDisabled = !highlightedVariable ||
                (highlightedVariable.source !== 'available' && highlightedVariable.source !== id);

            // Direction: if target is highlighted, show left arrow (to available)
            // otherwise show right arrow (from available to target)
            const direction = isTargetHighlighted ? 'left' : 'right';

            return (
                <button
                    className={`
                        flex-shrink-0 flex items-center justify-center p-1 w-6 h-6 rounded border mr-2
                        ${isDisabled
                        ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400'}
                    `}
                    onClick={() => !isDisabled && handleArrowButtonClick(id)}
                    disabled={isDisabled}
                >
                    {direction === 'left'
                        ? <ArrowBigLeft size={14} />
                        : <ArrowBigDown size={14} />}
                </button>
            );
        };

        return (
            <div key={id} className={`flex flex-col ${id !== 'available' ? 'mb-2' : ''}`}>
                {title && (
                    <div className="text-sm font-medium text-slate-700 mb-1.5 px-1 flex items-center">
                        {id !== 'available' && renderArrowButton()}
                        <span className="flex-1">{title}</span>
                    </div>
                )}
                <div
                    className={`
                        border p-1 rounded-md w-full transition-colors relative bg-white
                        ${overflowStyle}
                        ${isDraggingOver === id && droppable ? "border-blue-500 bg-blue-50" : "border-slate-300"}
                        ${!droppable && id !== 'available' ? 'bg-slate-50 cursor-not-allowed' : ''}
                    `}
                    style={{ height: adjustedHeight, minHeight: isSingleItemList ? "auto" : "" }}
                    onDragOver={(e) => handleDragOver(e, id)}
                    onDragLeave={handleDragLeave}
                    // Handle drop on the empty area of the list (appends to the end if droppable)
                    onDrop={(e) => handleDrop(e, id)} // Pass undefined index for drop on container
                >
                    {showDropPlaceholder && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none p-2">
                            <MoveHorizontal size={18} className="mb-1" />
                            <p className="text-xs text-center">
                                {config?.maxItems === 1 ? "Drop one variable here" : "Drop variables here"}
                            </p>
                        </div>
                    )}
                    {variables.length === 0 && id === 'available' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none p-4">
                            <p className="text-sm text-center">All variables used</p>
                        </div>
                    )}

                    <div className={`space-y-0.5 p-0.5 transition-all duration-150`}>
                        {variables.map((variable, index) => renderVariableItem(variable, id, index))}
                    </div>
                </div>
                {renderListFooter && renderListFooter(id)}
            </div>
        );
    };

    // --- Main Return ---
    return (
        <div className="grid grid-cols-2 gap-4">
            {/* Available Variables Column */}
            <div className="col-span-1 flex flex-col">
                {renderList(allLists.find(l => l.id === 'available')!)}
                {/* General Helper Text - Could be a prop */}
                <div className="text-xs mt-2 text-slate-500 flex items-center p-1.5 rounded bg-slate-50 border border-slate-200">
                    <InfoIcon size={14} className="mr-1.5 flex-shrink-0 text-slate-400" />
                    <span>Drag or double-click variables to move them. Drag within a list to reorder.</span>
                </div>
            </div>

            {/* Target Variables Column */}
            <div className="col-span-1 flex flex-col space-y-2">
                {targetLists.map(listConfig => renderList(listConfig))}
            </div>
        </div>
    );
};

export default VariableListManager;