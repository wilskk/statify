import React, { FC, useState, useCallback, useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Ruler, Shapes, BarChartHorizontal, InfoIcon, GripVertical, MoveHorizontal, ArrowBigDown, ArrowBigLeft } from "lucide-react";
import type { Variable } from "@/types/Variable";
import { useMobile } from "@/hooks/useMobile";

// Define the structure for configuring target lists
export interface TargetListConfig {
    id: string;               // Unique identifier for the list (e.g., 'selected', 'rows', 'factors')
    title: string;            // Display title for the list
    variables: Variable[];    // The array of variables currently in this list
    height: string;           // CSS height for the list container
    maxItems?: number;        // Optional limit for the number of items
    droppable?: boolean;      // Whether items can be dropped into this list (defaults to true)
    draggableItems?: boolean; // Whether items *within* this list can be dragged (defaults to true)
}

// Props for the reusable component
interface VariableListManagerProps {
    // Core data props
    availableVariables: Variable[];
    targetLists: TargetListConfig[];
    variableIdKey: keyof Variable; // Key to use for unique identification ('tempId' or 'columnIndex')
    
    // Selection state
    highlightedVariable: { id: string, source: string } | null;
    setHighlightedVariable: (value: { id: string, source: string } | null) => void;
    
    // Event handlers
    onMoveVariable: (variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => void;
    onReorderVariable: (listId: string, variables: Variable[]) => void;
    onVariableDoubleClick?: (variable: Variable, sourceListId: string) => void;
    
    // Display customization
    getVariableIcon?: (variable: Variable) => React.ReactNode;
    getDisplayName?: (variable: Variable) => string;
    showArrowButtons?: boolean;
    availableListHeight?: string;
    
    // Custom content rendering
    renderListFooter?: (listId: string) => React.ReactNode;
    renderExtraInfoContent?: () => React.ReactNode;
    renderRightColumnFooter?: () => React.ReactNode;
}

// Helper function to get variable icon (default implementation)
const defaultGetVariableIcon = (variable: Variable) => {
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

// Helper function to get display name (default implementation)
const defaultGetDisplayName = (variable: Variable): string => {
    if (variable.label) {
        return `${variable.label} [${variable.name}]`;
    }
    return variable.name;
};

const VariableListManager: FC<VariableListManagerProps> = ({
    // Core data props
    availableVariables,
    targetLists,
    variableIdKey,
    
    // Selection state
    highlightedVariable,
    setHighlightedVariable,
    
    // Event handlers
    onMoveVariable,
    onReorderVariable,
    onVariableDoubleClick,
    
    // Display customization (with defaults)
    getVariableIcon = defaultGetVariableIcon,
    getDisplayName = defaultGetDisplayName,
    showArrowButtons = true,
    availableListHeight = '300px',
    
    // Custom content rendering
    renderListFooter,
    renderExtraInfoContent,
    renderRightColumnFooter,
}) => {
    // State for drag and drop operations
    const [draggedItem, setDraggedItem] = useState<{ variable: Variable, sourceListId: string } | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState<string | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Use the mobile hook to detect mobile devices and orientation
    const { isMobile, isPortrait } = useMobile();

    // Combine available variables and target lists for unified handling
    const allLists = useMemo(() => [
        { id: 'available', title: 'Available Variables', variables: availableVariables, height: availableListHeight },
        ...targetLists
    ], [availableVariables, targetLists, availableListHeight]);

    // --- Drag and Drop Handlers ---
    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, variable: Variable, sourceListId: string) => {
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
        setDraggedItem(null);
        setIsDraggingOver(null);
        setDragOverIndex(null);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, targetListId: string) => {
        e.preventDefault();
        const targetListConfig = allLists.find(l => l.id === targetListId);
        const targetDroppable = (targetListConfig as TargetListConfig)?.droppable !== false; // Default true

        // Prevent dropping into non-droppable lists or lists that are full
        if (!targetDroppable || (targetListConfig?.maxItems && 
            targetListConfig.variables.length >= targetListConfig.maxItems && 
            draggedItem?.sourceListId !== targetListId)) {
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
            // Dragging within the same list for reordering
            e.dataTransfer.dropEffect = 'move';
            setDragOverIndex(targetIndex);
        } else if (!draggedItem || draggedItem.sourceListId !== listId) {
            // Dropping from another list - don't show item-level drop indicator
            if (dragOverIndex !== null) {
                setDragOverIndex(null);
            }
            
            // Ensure the general drop effect is still 'move' if the list is droppable
            const targetListConfig = allLists.find(l => l.id === listId);
            const targetDroppable = (targetListConfig as TargetListConfig)?.droppable !== false;
            e.dataTransfer.dropEffect = targetDroppable ? 'move' : 'none';
        } else {
            e.dataTransfer.dropEffect = 'none'; // Cannot reorder if draggableItems is false
        }
    }, [draggedItem, dragOverIndex, allLists]);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        // Check if the mouse is actually leaving the container
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDraggingOver(null);
            setDragOverIndex(null);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetListId: string, targetIndex?: number) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent drop from bubbling to parent container
        
        const targetListConfig = allLists.find(l => l.id === targetListId);
        const targetDroppable = (targetListConfig as TargetListConfig)?.droppable !== false;

        // Allow drop onto 'available' even if not explicitly 'droppable' in config
        if (!targetDroppable && targetListId !== 'available') {
            handleDragEnd(); // Clean up state even if drop is invalid
            return;
        }

        try {
            const dataString = e.dataTransfer.getData('application/json');
            if (!dataString) throw new Error("No drag data found");

            const { variableId, sourceListId } = JSON.parse(dataString);
            if (!variableId || !sourceListId) throw new Error("Invalid drag data structure");

            const sourceList = allLists.find(l => l.id === sourceListId)?.variables;
            if (!sourceList) throw new Error(`Source list ${sourceListId} not found`);

            const variableToMove = sourceList.find(v => v[variableIdKey] === variableId);
            if (!variableToMove) throw new Error(`Variable with ID ${variableId} not found in source list ${sourceListId}`);

            // --- Handle single-item list overwrite logic ---
            const isReplacingSingleItem = sourceListId !== targetListId &&
                targetListConfig?.maxItems === 1 &&
                targetListConfig.variables.length === 1;

            // Check max items constraint (prevent drop only if exceeding maxItems AND not replacing single item)
            if (sourceListId !== targetListId &&
                targetListConfig?.maxItems &&
                targetListConfig.variables.length >= targetListConfig.maxItems &&
                !isReplacingSingleItem) {
                handleDragEnd();
                return;
            }

            // Perform overwrite if needed (move existing variable back to available first)
            if (isReplacingSingleItem && targetListConfig) {
                const existingVariable = targetListConfig.variables[0];
                onMoveVariable(existingVariable, targetListId, 'available');
            }

            // --- Handle move or reorder operations ---
            if (sourceListId === targetListId) {
                // Reordering within the same list
                const listConfig = allLists.find(l => l.id === targetListId) as TargetListConfig | undefined;
                const itemsDraggable = listConfig?.draggableItems !== false;

                if (!itemsDraggable) {
                    handleDragEnd();
                    return;
                }

                if (typeof targetIndex === 'number') {
                    const currentList = [...sourceList];
                    const sourceIndex = currentList.findIndex(v => v[variableIdKey] === variableId);

                    if (sourceIndex === -1) throw new Error("Dragged item not found in list for reorder");
                    if (sourceIndex === targetIndex) {
                        handleDragEnd();
                        return;
                    }

                    const [movedVariable] = currentList.splice(sourceIndex, 1);
                    // Adjust target index based on movement direction
                    const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
                    currentList.splice(adjustedTargetIndex, 0, movedVariable);

                    onReorderVariable(targetListId, currentList);
                }
            } else {
                // Moving between different lists
                onMoveVariable(variableToMove, sourceListId, targetListId, targetIndex);
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
        
        // Toggle selection if already selected
        if (highlightedVariable?.id === varId && highlightedVariable.source === sourceListId) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: varId, source: sourceListId });
        }
    }, [highlightedVariable, setHighlightedVariable, variableIdKey]);

    const handleVariableDoubleClick = useCallback((variable: Variable, sourceListId: string) => {
        // Use custom handler if provided
        if (onVariableDoubleClick) {
            onVariableDoubleClick(variable, sourceListId);
            return;
        }
        
        // Default double-click behavior: move between available and first target list
        const targetListId = sourceListId === 'available'
            ? targetLists.find(l => l.droppable !== false && (!l.maxItems || l.variables.length < l.maxItems || l.maxItems === 1))?.id
            : 'available';

        if (targetListId) {
            const targetListConfig = allLists.find(l => l.id === targetListId);
            const isReplacingSingleItem = targetListId !== 'available' &&
                targetListConfig?.maxItems === 1 &&
                targetListConfig.variables.length === 1;

            // Check max items constraint
            if (targetListId !== 'available' &&
                targetListConfig?.maxItems &&
                targetListConfig.variables.length >= targetListConfig.maxItems &&
                !isReplacingSingleItem) {
                return;
            }

            // Perform overwrite if needed
            if (isReplacingSingleItem && targetListConfig) {
                const existingVariable = targetListConfig.variables[0];
                onMoveVariable(existingVariable, targetListId, 'available');
            }

            // Move the double-clicked variable
            onMoveVariable(variable, sourceListId, targetListId);
        }
    }, [targetLists, onMoveVariable, allLists, onVariableDoubleClick]);

    // --- Arrow Button Handlers ---
    const handleArrowButtonClick = useCallback((targetListId: string) => {
        if (!highlightedVariable) return;

        const { id, source } = highlightedVariable;

        // From available to target list
        if (source === 'available') {
            const variable = availableVariables.find(v => 
                String(v[variableIdKey]) === id
            );

            if (variable) {
                onMoveVariable(variable, 'available', targetListId);
            }
        }
        // From target list to available
        else if (source === targetListId) {
            const listConfig = targetLists.find(l => l.id === targetListId);
            if (!listConfig) return;

            const variable = listConfig.variables.find(v => 
                String(v[variableIdKey]) === id
            );

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
            return null;
        }

        const listConfig = allLists.find(l => l.id === listId);
        const itemsDraggableInList = (listConfig as TargetListConfig)?.draggableItems !== false;
        const isDraggable = itemsDraggableInList || listId === 'available';

        const isBeingDragged = draggedItem?.variable[variableIdKey] === variable[variableIdKey];
        const isHighlighted = highlightedVariable?.id === varId && highlightedVariable.source === listId;
        const isDropTargetIndicator = itemsDraggableInList && 
            draggedItem?.sourceListId === listId && 
            dragOverIndex === index && 
            draggedItem && 
            !isBeingDragged;

        return (
            <TooltipProvider key={varId}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={`
                                flex items-center p-1 border rounded-md group relative transition-all duration-150 ease-in-out text-sm
                                ${isDraggable ? 'cursor-grab' : 'cursor-default'}
                                ${isBeingDragged ? "opacity-40 bg-accent" : "hover:bg-accent"}
                                ${isHighlighted ? "bg-accent border-primary" : "border-border"}
                                ${isDropTargetIndicator ? "border-t-[3px] border-t-primary pt-[1px]" : "pt-1"}
                            `}
                            style={{
                                // Border styling
                                borderTopStyle: isDropTargetIndicator ? 'solid' : 'solid',
                                borderTopWidth: isDropTargetIndicator ? '3px' : '1px',
                                borderTopColor: isDropTargetIndicator 
                                    ? 'hsl(var(--primary))' 
                                    : (isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))'),
                                paddingTop: isDropTargetIndicator ? '1px' : '4px',
                                paddingBottom: '4px',
                                
                                // Consistent side/bottom borders
                                borderLeftWidth: '1px', 
                                borderRightWidth: '1px', 
                                borderBottomWidth: '1px',
                                borderLeftColor: isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                borderRightColor: isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                borderBottomColor: isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                            }}
                            onClick={() => handleVariableSelect(variable, listId)}
                            onDoubleClick={() => handleVariableDoubleClick(variable, listId)}
                            draggable={isDraggable}
                            onDragStart={(e) => isDraggable && handleDragStart(e, variable, listId)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleItemDragOver(e, index, listId)}
                            onDrop={(e) => handleDrop(e, listId, index)}
                        >
                            <div className="flex items-center w-full truncate">
                                {itemsDraggableInList && (
                                    <GripVertical 
                                        size={14} 
                                        className="text-muted-foreground mr-1 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" 
                                    />
                                )}
                                {!itemsDraggableInList && <div className="w-[14px] mr-1 flex-shrink-0"></div>}
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
        const config = isTargetConfig ? listConfig as TargetListConfig : null;

        // Determine if items can be dropped INTO this list container
        const droppable = id !== 'available' && (!config || config.droppable !== false);
        const showDropPlaceholder = variables.length === 0 && droppable;

        // Adjust the height for single-item lists
        const isSingleItemList = config?.maxItems === 1;
        const adjustedHeight = isSingleItemList
            ? variables.length === 0 ? "46px" : "auto"
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
                        ? 'border-border text-muted-foreground cursor-not-allowed'
                        : 'border-border text-foreground hover:bg-accent hover:border-primary'}
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
                    <div className="text-sm font-medium text-foreground mb-1.5 px-1 flex items-center h-6">
                        {id !== 'available' && renderArrowButton()}
                        <span className="flex-1">{title}</span>
                    </div>
                )}
                <div
                    className={`
                        border p-1 rounded-md w-full transition-colors relative bg-background
                        ${overflowStyle}
                        ${isDraggingOver === id && droppable ? "border-primary bg-accent" : "border-border"}
                        ${!droppable && id !== 'available' ? 'bg-muted cursor-not-allowed' : ''}
                    `}
                    style={{ height: adjustedHeight, minHeight: isSingleItemList ? "auto" : "" }}
                    onDragOver={(e) => handleDragOver(e, id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, id)} // Drop on container (append to end)
                >
                    {showDropPlaceholder && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground pointer-events-none p-2">
                            <MoveHorizontal size={18} className="mb-1" />
                            <p className="text-xs text-center">
                                {config?.maxItems === 1 ? "Drop one variable here" : "Drop variables here"}
                            </p>
                        </div>
                    )}
                    {variables.length === 0 && id === 'available' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground pointer-events-none p-4">
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

    // --- Main Return with Responsive Layout ---
    // Only use flex column layout if mobile AND portrait orientation
    const useVerticalLayout = isMobile && isPortrait;

    return (
        <div className={`${useVerticalLayout ? 'flex flex-col gap-4' : 'grid grid-cols-2 gap-4'}`}>
            {/* Available Variables Column (Left) */}
            <div className={`${useVerticalLayout ? 'w-full' : 'col-span-1'} flex flex-col`}>
                {renderList(allLists.find(l => l.id === 'available')!)}
                
                {/* Helper Text and Extra Content */}
                {(!isMobile || !isPortrait) && (
                    <div className="flex flex-col mt-2 space-y-2">
                        <div className="text-xs text-muted-foreground flex items-center p-1.5 rounded bg-accent border border-border">
                            <InfoIcon size={14} className="mr-1.5 flex-shrink-0 text-muted-foreground" />
                            <span>Drag or double-click variables to move them. Drag within a list to reorder.</span>
                        </div>
                        {renderExtraInfoContent && renderExtraInfoContent()}
                    </div>
                )}
            </div>

            {/* Target Lists Column (Right) */}
            <div className={`${useVerticalLayout ? 'w-full mt-4' : 'col-span-1'} flex flex-col space-y-2`}>
                {targetLists.map(listConfig => renderList(listConfig))}
                {renderRightColumnFooter && renderRightColumnFooter()}
            </div>
        </div>
    );
};

export default VariableListManager;