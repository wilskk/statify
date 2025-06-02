"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Dialog,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, InfoIcon } from "lucide-react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useMetaStore } from "@/stores/useMetaStore";
import { Variable } from "@/types/Variable";
import VariableListManager, { TargetListConfig } from "@/components/Common/VariableListManager";

interface WeightCasesModalProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

// Content component separated from container logic
const WeightCasesContent: React.FC<WeightCasesModalProps> = ({ 
    onClose,
    // containerType prop is no longer needed here as parent will handle chrome
}) => {
    const { variables } = useVariableStore();
    const meta = useMetaStore((state) => state.meta);
    const setMeta = useMetaStore((state) => state.setMeta);    // States for variable lists
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [frequencyVariables, setFrequencyVariables] = useState<Variable[]>([]);
    
    // Track the highlighted variable
    const [highlightedVariable, setHighlightedVariable] = useState<{
        id: string;
        source: string;
    } | null>(null);

    // Error handling
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);    // Compute the weight method based on frequency variables
    const weightMethod = frequencyVariables.length > 0 ? "byVariable" : "none";
    
    // Helper function to ensure variable has unique tempId
    const ensureUniqueTempId = useCallback((variable: Variable): Variable => {
        if (!variable.tempId) {
            return {
                ...variable,
                tempId: `weight_temp_${variable.columnIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
        }
        return variable;
    }, []);

    // Initialize lists from store
    useEffect(() => {
        // Filter to only numeric variables and ensure each has a unique tempId
        const numericVariables = variables
            .filter(v => v.name !== "" && v.type !== "STRING")
            .map((v, index) => ensureUniqueTempId({
                ...v,
                // Force regenerate tempId to ensure uniqueness in this context
                tempId: `weight_${v.columnIndex}_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }));

        // If we have a weight variable set in meta, move it to the frequency list
        if (meta.weight && meta.weight !== "") {
            const weightVar = numericVariables.find(v => v.name === meta.weight);

            if (weightVar) {
                setFrequencyVariables([weightVar]);
                setAvailableVariables(numericVariables.filter(v => v.name !== meta.weight));
            } else {
                setAvailableVariables(numericVariables);
                setFrequencyVariables([]);
            }
        } else {
            setAvailableVariables(numericVariables);
            setFrequencyVariables([]);
        }
    }, [variables, meta.weight, ensureUniqueTempId]);    // Handler for moving variables between lists
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string) => {
        // Create a new variable with unique tempId for this move operation
        const variableWithTempId = {
            ...variable,
            tempId: `weight_move_${variable.columnIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        // Validate variable type for frequency list
        if (toListId === 'frequency' && variableWithTempId.type === "STRING") {
            setErrorMessage("Weight variable must be numeric");
            setErrorDialogOpen(true);
            return;
        }

        // Check if variable is already in the target list (by name, not tempId)
        if (toListId === 'frequency') {
            const isAlreadySelected = frequencyVariables.some(v => v.name === variableWithTempId.name);
            if (isAlreadySelected) {
                // Variable is already selected, do nothing
                setHighlightedVariable(null);
                return;
            }
        }

        if (toListId === 'available') {
            const isAlreadyAvailable = availableVariables.some(v => v.name === variableWithTempId.name);
            if (isAlreadyAvailable) {
                // Variable is already in available list, do nothing
                setHighlightedVariable(null);
                return;
            }
        }

        // Remove from source list (by tempId for exact match)
        if (fromListId === 'available') {
            setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (fromListId === 'frequency') {
            setFrequencyVariables([]);
        }

        // Add to target list
        if (toListId === 'available') {
            setAvailableVariables(prev => [...prev, variableWithTempId].sort((a, b) => a.columnIndex - b.columnIndex));        } else if (toListId === 'frequency') {
            // Move current frequency variable back to available if exists
            if (frequencyVariables.length > 0) {
                const currentFreqVar = frequencyVariables[0];
                const newAvailableVar = {
                    ...currentFreqVar,
                    tempId: `weight_back_${currentFreqVar.columnIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                };
                setAvailableVariables(prev => {
                    // First remove any existing instance of this variable by name to prevent duplicates
                    const filtered = prev.filter(v => v.name !== currentFreqVar.name);
                    return [...filtered, newAvailableVar].sort((a, b) => a.columnIndex - b.columnIndex);
                });
            }
            // Set the new variable as the frequency variable (single selection)
            setFrequencyVariables([variableWithTempId]);
        }// Clear highlight
        setHighlightedVariable(null);
    }, [frequencyVariables, availableVariables]);

    // Handler for reordering variables within a list (not needed for this modal, but required by VariableListManager)
    const handleReorderVariable = useCallback((listId: string, reorderedVariables: Variable[]) => {
        if (listId === 'available') {
            setAvailableVariables(reorderedVariables);
        } else if (listId === 'frequency') {
            setFrequencyVariables(reorderedVariables);
        }
    }, []);

    const handleSave = () => {
        if (frequencyVariables.length > 0) {
            setMeta({ weight: frequencyVariables[0].name });
        } else {
            setMeta({ weight: "" });
        }
        onClose();
    };    const handleReset = () => {
        // Move any frequency variables back to available with new tempId
        if (frequencyVariables.length > 0) {
            const varsWithNewTempId = frequencyVariables.map(v => ({
                ...v,
                tempId: `weight_reset_${v.columnIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }));
            setAvailableVariables(prev => {
                // Remove any existing instances of these variables by name to prevent duplicates
                const filtered = prev.filter(v => !varsWithNewTempId.some(newVar => newVar.name === v.name));
                return [...filtered, ...varsWithNewTempId].sort((a, b) => a.columnIndex - b.columnIndex);
            });
            setFrequencyVariables([]);
        }
        setHighlightedVariable(null);
    };

    // Configure target lists for VariableListManager
    const targetLists: TargetListConfig[] = [
        {
            id: 'frequency',
            title: 'Weight cases by:',
            variables: frequencyVariables,
            height: '5rem',
            maxItems: 1, // Only allow one frequency variable
            draggableItems: false // No reordering needed
        }
    ];

    // Current status message
    const currentStatus = weightMethod === "none"
        ? "Do not weight cases"
        : `Weight cases by: ${frequencyVariables[0]?.name || "(not selected)"}`;

    return (
        <>
            {/* DialogHeader and Separator are removed from here, will be handled by parent */}
              {/* Main content area with standardized padding and scrolling */}            <div className="p-6 overflow-y-auto flex-grow">
                {/* Use VariableListManager for drag & drop functionality */}                <VariableListManager
                    availableVariables={availableVariables}
                    targetLists={targetLists}
                    variableIdKey="tempId"
                    highlightedVariable={highlightedVariable}
                    setHighlightedVariable={setHighlightedVariable}
                    onMoveVariable={handleMoveVariable}
                    onReorderVariable={handleReorderVariable}
                    showArrowButtons={true}
                    availableListHeight={"12rem"}
                />

                <div className="border border-border p-2 rounded-md bg-muted mt-4 flex items-center">
                    <InfoIcon className="text-muted-foreground h-4 w-4 flex-shrink-0 mr-2" />
                    <div className="text-xs text-foreground">
                        <span className="font-semibold">Current Status:</span> {currentStatus}
                    </div>
                </div>
            </div>

            {/* Standardized action buttons footer */}
            <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0 flex justify-end space-x-3">
                <Button onClick={handleSave}>
                    OK
                </Button>
                <Button variant="outline" onClick={handleReset}>
                    Reset
                </Button>
                <Button variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button variant="outline" onClick={() => alert("Help dialog here")}>
                    Help
                </Button>
            </div>

            <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <DialogContent className="max-w-sm p-3">
                    <DialogHeader className="p-0 mb-2">
                        <DialogTitle>IBM SPSS Statistics</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-4">
                        <AlertCircle className="h-10 w-10 text-primary" />
                        <div>
                            <p className="text-sm mt-2">{errorMessage}</p>
                        </div>
                    </div>

                    <DialogFooter className="flex justify-center mt-4">
                        <Button
                            size="sm"
                            className="text-xs h-7"
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
const WeightCasesModal: React.FC<WeightCasesModalProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    // If sidebar mode, use a div container
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                {/* Sidebar Header should be handled by SidebarContainer */}
                {/* <div className="px-6 py-4 border-b border-border flex-shrink-0">
                    <h2 className="text-xl font-semibold">Weight Cases</h2>
                </div> */}
                <div className="flex-grow flex flex-col overflow-hidden">
                    <WeightCasesContent onClose={onClose} /> 
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent with standardized structure
    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md p-0 bg-popover text-popover-foreground border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
                {/* Dialog Header */}
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-[22px] font-semibold">Weight Cases</DialogTitle>
                </DialogHeader>
                {/* Content Wrapper */}
                <div className="flex-grow flex flex-col overflow-hidden">
                    <WeightCasesContent onClose={onClose} /> 
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default WeightCasesModal;