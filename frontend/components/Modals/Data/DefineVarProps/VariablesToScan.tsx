"use client";

import React, { FC, useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { InfoIcon, AlertCircle } from "lucide-react";
import { useVariableStore } from "@/stores/useVariableStore";
import { Variable } from "@/types/Variable";
import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';

interface VariablesToScanProps {
    onClose: () => void;
    onContinue: (variables: Variable[], caseLimit: string | null, valueLimit: string | null) => void;
    containerType?: "dialog" | "sidebar";
}

// Main content component that's agnostic of container type
const VariablesToScanContent: FC<VariablesToScanProps> = ({ onClose, onContinue, containerType = "dialog" }) => {
    // Get variables directly from store
    const { variables } = useVariableStore();

    // Variables in the left list (available) and right list (to scan)
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [variablesToScan, setVariablesToScan] = useState<Variable[]>([]);

    // Update available variables when store variables are loaded
    useEffect(() => {
        if (variables && variables.length > 0) {
            // Filter out empty variables and ensure each has a tempId
            const validVars = variables.filter(v => v.name !== "").map(v => ({
                ...v,
                tempId: v.tempId || `temp_${v.columnIndex}`
            }));
            setAvailableVariables(validVars);
        }
    }, [variables]);

    // Currently selected variable for highlighting
    const [highlightedVariable, setHighlightedVariable] = useState<{tempId: string, source: 'available' | 'toScan'} | null>(null);

    // Setup for the VariableListManager
    const [managerHighlightedVariable, setManagerHighlightedVariable] = useState<{id: string, source: string} | null>(null);

    // Error dialog state
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);

    // Settings for the limits
    const [limitCases, setLimitCases] = useState<boolean>(true);
    const [limitValues, setLimitValues] = useState<boolean>(true);
    const [caseLimit, setCaseLimit] = useState<string>("50");
    const [valueLimit, setValueLimit] = useState<string>("200");

    // Move a variable from available to scan
    const moveToScan = (variable: Variable, targetIndex?: number) => {
        if (!variable.tempId) {
            console.error("Cannot move variable without tempId:", variable);
            return;
        }

        setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setVariablesToScan(prev => {
            if (prev.some(v => v.tempId === variable.tempId)) {
                return prev;
            }
            const newList = [...prev];
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variable);
            } else {
                newList.push(variable);
            }
            return newList;
        });
        setHighlightedVariable(null);
    };

    // Move a variable from scan to available
    const moveToAvailable = (variable: Variable, targetIndex?: number) => {
        if (!variable.tempId) {
            console.error("Cannot move variable without tempId:", variable);
            return;
        }

        setVariablesToScan(prev => prev.filter(v => v.tempId !== variable.tempId));
        setAvailableVariables(prev => {
            if (prev.some(v => v.tempId === variable.tempId)) {
                return prev;
            }
            const newList = [...prev];
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variable);
            } else {
                newList.push(variable);
            }
            // Sort by column index
            newList.sort((a, b) => a.columnIndex - b.columnIndex);
            return newList;
        });
        setHighlightedVariable(null);
    };

    // Reorder variables within a list
    const reorderVariables = (source: 'available' | 'toScan', reorderedList: Variable[]) => {
        if (source === 'available') {
            setAvailableVariables([...reorderedList]);
        } else if (source === 'toScan') {
            setVariablesToScan([...reorderedList]);
        }
    };

    // Setup target list configuration for the VariableListManager
    const targetLists: TargetListConfig[] = [
        {
            id: 'toScan',
            title: 'Variables to Scan:',
            variables: variablesToScan,
            height: '300px',
            draggableItems: true,
            droppable: true
        }
    ];

    // Synchronize the two highlight states
    useEffect(() => {
        if (highlightedVariable) {
            setManagerHighlightedVariable({
                id: highlightedVariable.tempId,
                source: highlightedVariable.source
            });
        } else {
            setManagerHighlightedVariable(null);
        }
    }, [highlightedVariable]);

    // Handle highlight changes from the VariableListManager
    const handleHighlightChange = useCallback((value: { id: string, source: string } | null) => {
        if (value && (value.source === 'available' || value.source === 'toScan')) {
            setHighlightedVariable({ tempId: value.id, source: value.source as 'available' | 'toScan' });
        } else {
            setHighlightedVariable(null);
        }
    }, []);

    // Handle moving variables between lists
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        if (toListId === 'toScan') {
            moveToScan(variable, targetIndex);
        } else if (toListId === 'available') {
            moveToAvailable(variable, targetIndex);
        }
    }, []);

    // Handle reordering variables within a list
    const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
        if (listId === 'toScan') {
            reorderVariables('toScan', variables);
        } else if (listId === 'available') {
            reorderVariables('available', variables);
        }
    }, []);

    // Button handlers
    const handleContinue = () => {
        if (variablesToScan.length === 0) {
            setErrorMessage("No variables have been selected for scanning.");
            setErrorDialogOpen(true);
            return;
        }

        // Continue to the Properties Editor with selected variables and limits
        onContinue(
            variablesToScan,
            limitCases ? caseLimit : null,
            limitValues ? valueLimit : null
        );
    };

    return (
        <>
            <div className="p-6 overflow-y-auto flex-grow">
                {/* Information text */}
                <div className="mb-4 p-3 border-l-2 border-primary bg-accent rounded-sm">
                    <p className="text-sm text-accent-foreground">
                        Select variables to scan. Categorical variables (nominal/ordinal) work best.
                        You can change measurement level in the next panel.
                    </p>
                </div>

                {/* Variable List Manager */}
                <div className="mb-6">
                    <VariableListManager
                        availableVariables={availableVariables}
                        targetLists={targetLists}
                        variableIdKey="tempId"
                        highlightedVariable={managerHighlightedVariable}
                        setHighlightedVariable={setManagerHighlightedVariable}
                        onMoveVariable={handleMoveVariable}
                        onReorderVariable={handleReorderVariables}
                    />
                </div>

                {/* Limit options */}
                <div className="border border-border rounded-md p-6 mt-6 bg-card">
                    <div className="text-sm font-medium mb-4 text-card-foreground">Scanning Limits</div>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="limit-cases"
                                checked={limitCases}
                                onCheckedChange={(checked) => setLimitCases(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="limit-cases" className="text-sm cursor-pointer text-card-foreground">
                                Limit number of cases scanned to:
                            </Label>
                            <Input
                                value={caseLimit}
                                onChange={(e) => setCaseLimit(e.target.value)}
                                className="w-24 h-8 text-sm"
                                disabled={!limitCases}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="limit-values"
                                checked={limitValues}
                                onCheckedChange={(checked) => setLimitValues(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="limit-values" className="text-sm cursor-pointer text-card-foreground">
                                Limit number of values displayed to:
                            </Label>
                            <Input
                                value={valueLimit}
                                onChange={(e) => setValueLimit(e.target.value)}
                                className="w-24 h-8 text-sm"
                                disabled={!limitValues}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0 rounded-b-md">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4"
                        onClick={handleContinue}
                    >
                        Continue
                    </Button>
                    <Button
                        variant="outline"
                        className="border-border hover:bg-accent hover:text-accent-foreground h-8 px-4"
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="border-border hover:bg-accent hover:text-accent-foreground h-8 px-4"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        className="border-border hover:bg-accent hover:text-accent-foreground h-8 px-4"
                    >
                        Help
                    </Button>
                </div>
            </div>

            {/* Error Dialog */}
            <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <DialogContent className="max-w-[400px] p-6 bg-popover border border-border shadow-md rounded-md">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-[18px] font-semibold text-popover-foreground">Statify</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-4 items-start">
                        <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-popover-foreground">{errorMessage}</p>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4"
                            onClick={() => setErrorDialogOpen(false)}
                        >
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

// Main component that handles different container types
const VariablesToScan: FC<VariablesToScanProps> = ({ onClose, onContinue, containerType = "dialog" }) => {
    // If sidebar mode, use a div container
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden">
                <VariablesToScanContent 
                    onClose={onClose} 
                    onContinue={onContinue} 
                    containerType={containerType} 
                />
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent
    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-[650px] p-0 bg-popover border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-[22px] font-semibold text-foreground">Define Variable Properties</DialogTitle>
                </DialogHeader>
                
                <VariablesToScanContent 
                    onClose={onClose} 
                    onContinue={onContinue} 
                    containerType={containerType} 
                />
            </DialogContent>
        </Dialog>
    );
};

export default VariablesToScan;