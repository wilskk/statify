import React, { FC, useCallback, useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CornerDownLeft, CornerDownRight, Plus, Ruler, Shapes, BarChartHorizontal, InfoIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Variable } from "@/types/Variable";
import { HighlightedVariableInfo, DefineGroupsOptions } from "./types";
import { Dispatch, SetStateAction } from "react";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface VariablesTabProps {
    availableVariables: Variable[];
    selectedVariables: Variable[];
    groupingVariable: Variable | null;
    highlightedVariable: HighlightedVariableInfo | null;
    setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariableInfo | null>>;
    moveToSelectedVariables: (variable: Variable, targetIndex?: number) => void;
    moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
    setGroupingVariable: (variable: Variable | null) => void;
    reorderVariables: (source: 'available' | 'selected', variables: Variable[]) => void;
    estimateEffectSize: boolean;
    setEstimateEffectSize: Dispatch<SetStateAction<boolean>>;
    defineGroups: DefineGroupsOptions;
    group1: number | null;
    group2: number | null;
    cutPointValue: number | null;
    setShowDefineGroupsModal: Dispatch<SetStateAction<boolean>>;
}

const VariablesTab: FC<VariablesTabProps> = ({
    availableVariables,
    selectedVariables,
    groupingVariable,
    highlightedVariable,
    setHighlightedVariable,
    moveToSelectedVariables,
    moveToAvailableVariables,
    setGroupingVariable,
    reorderVariables,
    estimateEffectSize,
    setEstimateEffectSize,
    defineGroups,
    group1,
    group2,
    cutPointValue,
    setShowDefineGroupsModal
}) => {
    const variableIdKeyToUse: keyof Variable = 'tempId';
    const [showDestinationDialog, setShowDestinationDialog] = useState(false);
    const [selectedAvailableVariable, setSelectedAvailableVariable] = useState<Variable | null>(null);

    // Helper functions for display
    const getVariableIcon = useCallback((variable: Variable) => {
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
    }, []);

    const getDisplayName = useCallback((variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    }, []);

    // Handle variable selection 
    const handleVariableSelect = useCallback((variable: Variable, source: 'available' | 'selected' | 'grouping') => {
        if (!variable.tempId) return;
        
        if (highlightedVariable && 
            highlightedVariable.tempId === variable.tempId && 
            highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ tempId: variable.tempId, source });
        }
    }, [highlightedVariable, setHighlightedVariable]);

    // Handle variable double click via DOM events
    const handleVariableDoubleClick = useCallback((event: MouseEvent) => {
        const element = event.currentTarget as HTMLElement;
        const variableId = element.getAttribute('data-variable-id');
        const source = element.getAttribute('data-variable-source');
        
        if (!variableId || !source) return;
        
        if (source === 'available') {
            const variable = availableVariables.find(v => v.tempId === variableId);
            if (variable) {
                if (!groupingVariable) {
                    setSelectedAvailableVariable(variable);
                    setShowDestinationDialog(true);
                } else {
                    moveToSelectedVariables(variable);
                }
            }
        } else if (source === 'selected') {
            const variable = selectedVariables.find(v => v.tempId === variableId);
            if (variable) {
                moveToAvailableVariables(variable);
            }
        } else if (source === 'grouping' && groupingVariable) {
            setGroupingVariable(null);
        }
    }, [availableVariables, selectedVariables, groupingVariable, moveToSelectedVariables, moveToAvailableVariables, setGroupingVariable]);

    // Add event listeners for double click after component mounts
    useEffect(() => {
        const addDoubleClickListeners = () => {
            // Query all variable items
            const availableItems = document.querySelectorAll('[data-variable-source="available"]');
            const selectedItems = document.querySelectorAll('[data-variable-source="selected"]');
            const groupingItem = document.querySelector('[data-variable-source="grouping"]');
            
            // Add listeners
            availableItems.forEach(item => {
                item.addEventListener('dblclick', handleVariableDoubleClick as any);
            });
            
            selectedItems.forEach(item => {
                item.addEventListener('dblclick', handleVariableDoubleClick as any);
            });
            
            if (groupingItem) {
                groupingItem.addEventListener('dblclick', handleVariableDoubleClick as any);
            }
        };
        
        // Run after a short delay to ensure DOM is ready
        const timerId = setTimeout(addDoubleClickListeners, 100);
        
        return () => {
            clearTimeout(timerId);
            // Clean up event listeners
            const availableItems = document.querySelectorAll('[data-variable-source="available"]');
            const selectedItems = document.querySelectorAll('[data-variable-source="selected"]');
            const groupingItem = document.querySelector('[data-variable-source="grouping"]');
            
            availableItems.forEach(item => {
                item.removeEventListener('dblclick', handleVariableDoubleClick as any);
            });
            
            selectedItems.forEach(item => {
                item.removeEventListener('dblclick', handleVariableDoubleClick as any);
            });
            
            if (groupingItem) {
                groupingItem.removeEventListener('dblclick', handleVariableDoubleClick as any);
            }
        };
    }, [handleVariableDoubleClick]);

    // Format grouped variable display name
    const getGroupingVariableDisplay = useCallback(() => {
        if (!groupingVariable) return '';
        
        const baseName = groupingVariable.label ? 
            `${groupingVariable.label} [${groupingVariable.name}]` : 
            groupingVariable.name;
            
        if (defineGroups.useSpecifiedValues) {
            return group1 !== null && group2 !== null ? 
                `${baseName} (${group1}, ${group2})` : 
                `${baseName} (?, ?)`;
        } else {
            return cutPointValue !== null ? 
                `${baseName} (${cutPointValue})` : 
                `${baseName} (?)`;
        }
    }, [groupingVariable, defineGroups, group1, group2, cutPointValue]);

    // Convert highlighted variable format for VariableListManager
    const managerHighlightedVariable = highlightedVariable
        ? { id: highlightedVariable.tempId, source: highlightedVariable.source }
        : null;

    const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
        if (value && (value.source === 'available' || value.source === 'selected' || value.source === 'grouping')) {
            setHighlightedVariable({ tempId: value.id, source: value.source as 'available' | 'selected' | 'grouping' });
        } else {
            setHighlightedVariable(null);
        }
    }, [setHighlightedVariable]);

    // Handle variable movement
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        if (toListId === 'selected') {
            moveToSelectedVariables(variable, targetIndex);
        } else if (toListId === 'available') {
            moveToAvailableVariables(variable, targetIndex);
        } else if (toListId === 'grouping') {
            setGroupingVariable(variable);
        }
    }, [moveToSelectedVariables, moveToAvailableVariables, setGroupingVariable]);

    // Handle reordering variables
    const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'selected' || listId === 'available') {
            reorderVariables(listId as 'available' | 'selected', variables);
        }
    }, [reorderVariables]);

    // Render the grouping variable section
    const renderGroupingVariable = useCallback(() => {
        return (
            <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-medium">Grouping Variable:</Label>
                    {highlightedVariable?.source === "available" && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 px-2"
                            onClick={() => {
                                const variable = availableVariables.find(v => v.tempId === highlightedVariable.tempId);
                                if (variable) {
                                    setGroupingVariable(variable);
                                }
                            }}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                        </Button>
                    )}
                </div>
                <div className="border border-border p-2 rounded-md mb-2" style={{ height: "44px" }}>
                    {groupingVariable && groupingVariable.tempId ? (
                        <div
                            className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-muted ${
                                highlightedVariable && 
                                highlightedVariable.tempId === groupingVariable.tempId && 
                                highlightedVariable.source === 'grouping'
                                    ? "bg-muted border-muted-foreground"
                                    : "border-border"
                            }`}
                            onClick={() => handleVariableSelect(groupingVariable, 'grouping')}
                            data-variable-id={groupingVariable.tempId}
                            data-variable-source="grouping"
                        >
                            <div className="flex items-center w-full">
                                {getVariableIcon(groupingVariable)}
                                <span className="text-xs truncate">{getGroupingVariableDisplay()}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-muted-foreground p-1 flex items-center justify-center h-full">
                            No grouping variable selected
                        </div>
                    )}
                </div>
                <div className="mt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() => setShowDefineGroupsModal(true)}
                        disabled={!groupingVariable}
                    >
                        Define Groups...
                    </Button>
                </div>
            </div>
        );
    }, [
        groupingVariable,
        highlightedVariable,
        getVariableIcon,
        getGroupingVariableDisplay,
        setShowDefineGroupsModal,
        availableVariables,
        handleVariableSelect
    ]);

    // Render the settings footer
    const renderFooter = useCallback((listId: string) => {
        if (listId === 'selected') {
            return (
                <div>
                    {renderGroupingVariable()}
                    <div className="flex items-center mt-4">
                        <Checkbox
                            id="estimate-effect-size"
                            checked={estimateEffectSize}
                            onCheckedChange={(checked) => setEstimateEffectSize(!!checked)}
                            className="mr-2 h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <Label htmlFor="estimate-effect-size" className="text-sm cursor-pointer">
                            Estimate effect sizes
                        </Label>
                    </div>
                </div>
            );
        }
        return null;
    }, [estimateEffectSize, setEstimateEffectSize, renderGroupingVariable]);

    // Set up variable lists for VariableListManager
    const targetLists: TargetListConfig[] = [
        {
            id: 'selected',
            title: 'Test Variables:',
            variables: selectedVariables,
            height: '175px',
            draggableItems: true,
            droppable: true
        }
    ];

    return (
        <>
            <div className="relative">
                <VariableListManager
                    availableVariables={availableVariables}
                    targetLists={targetLists}
                    variableIdKey={variableIdKeyToUse}
                    highlightedVariable={managerHighlightedVariable}
                    setHighlightedVariable={setManagerHighlightedVariable}
                    onMoveVariable={handleMoveVariable}
                    onReorderVariable={handleReorderVariables}
                    renderListFooter={renderFooter}
                    getVariableIcon={getVariableIcon}
                    getDisplayName={getDisplayName}
                />

                <div className="absolute top-1 right-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-sm">
                    Double-click to add variable
                </div>
            </div>

            {/* Destination Dialog */}
            <Dialog open={showDestinationDialog} onOpenChange={setShowDestinationDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Variable Destination</DialogTitle>
                        <DialogDescription>
                            Where would you like to add variable "{selectedAvailableVariable?.label || selectedAvailableVariable?.name}"?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center space-x-4 py-4">
                        <Button
                            onClick={() => {
                                if (selectedAvailableVariable) {
                                    moveToSelectedVariables(selectedAvailableVariable);
                                    setSelectedAvailableVariable(null);
                                    setShowDestinationDialog(false);
                                }
                            }}
                        >
                            Test Variable
                        </Button>
                        <Button
                            onClick={() => {
                                if (selectedAvailableVariable) {
                                    setGroupingVariable(selectedAvailableVariable);
                                    setSelectedAvailableVariable(null);
                                    setShowDestinationDialog(false);
                                }
                            }}
                        >
                            Grouping Variable
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setSelectedAvailableVariable(null);
                                setShowDestinationDialog(false);
                            }}
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default VariablesTab;