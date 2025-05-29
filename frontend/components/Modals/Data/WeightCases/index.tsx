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
}

const WeightCasesModal: React.FC<WeightCasesModalProps> = ({ onClose }) => {
    const { variables } = useVariableStore();
    const meta = useMetaStore((state) => state.meta);
    const setMeta = useMetaStore((state) => state.setMeta);

    // States for variable lists
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [frequencyVariables, setFrequencyVariables] = useState<Variable[]>([]);

    // Track the highlighted variable
    const [highlightedVariable, setHighlightedVariable] = useState<{
        id: string;
        source: string;
    } | null>(null);

    // Error handling
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);

    // Compute the weight method based on frequency variables
    const weightMethod = frequencyVariables.length > 0 ? "byVariable" : "none";

    // Initialize lists from store
    useEffect(() => {
        // Filter to only numeric variables
        const numericVariables = variables.filter(v => v.name !== "" && v.type !== "STRING");

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
    }, [variables, meta.weight]);

    // Handler for moving variables between lists
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string) => {
        // Validate variable type for frequency list
        if (toListId === 'frequency' && variable.type === "STRING") {
            setErrorMessage("Weight variable must be numeric");
            setErrorDialogOpen(true);
            return;
        }

        // Remove from source list
        if (fromListId === 'available') {
            setAvailableVariables(prev => prev.filter(v =>
                // Use tempId if available, otherwise use columnIndex
                (v.tempId !== undefined ? v.tempId !== variable.tempId : v.columnIndex !== variable.columnIndex)
            ));
        } else if (fromListId === 'frequency') {
            setFrequencyVariables([]);
        }

        // Add to target list
        if (toListId === 'available') {
            setAvailableVariables(prev => [...prev, variable].sort((a, b) => a.columnIndex - b.columnIndex));
        } else if (toListId === 'frequency') {
            // Replace any existing variable in the frequency list (single selection)
            setFrequencyVariables([variable]);
        }

        // Clear highlight
        setHighlightedVariable(null);
    }, []);

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
    };

    const handleReset = () => {
        // Move any frequency variables back to available
        if (frequencyVariables.length > 0) {
            setAvailableVariables(prev =>
                [...prev, ...frequencyVariables].sort((a, b) => a.columnIndex - b.columnIndex)
            );
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
            <DialogContent className="max-w-md p-3">
                <DialogHeader className="p-0 mb-2">
                    <DialogTitle>Weight Cases</DialogTitle>
                </DialogHeader>
                <Separator className="my-0" />

                <div className="py-2">
                    <div className="flex items-start space-x-4 mb-4">
                        <div className="space-y-2 flex-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="weightMethod"
                                    className="w-3 h-3"
                                    checked={weightMethod === "none"}
                                    onChange={() => {
                                        // Move any frequency variables back to available
                                        if (frequencyVariables.length > 0) {
                                            setAvailableVariables(prev =>
                                                [...prev, ...frequencyVariables].sort((a, b) => a.columnIndex - b.columnIndex)
                                            );
                                            setFrequencyVariables([]);
                                        }
                                    }}
                                />
                                <span className="text-xs">Do not weight cases</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="weightMethod"
                                    className="w-3 h-3"
                                    checked={weightMethod === "byVariable"}
                                    onChange={() => {
                                        // If no variable is selected yet, encourage selection
                                        if (frequencyVariables.length === 0) {
                                            // We don't need to do anything here, as the user will select a variable
                                            // which will automatically set the weight method to "byVariable"
                                        }
                                    }}
                                />
                                <span className="text-xs">Weight cases by variable</span>
                            </label>
                        </div>
                    </div>

                    {/* Use VariableListManager for drag & drop functionality */}
                    <VariableListManager
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

                <DialogFooter className="flex justify-center space-x-2 mt-4 p-0">
                    <Button size="sm" className="text-xs h-7" onClick={handleSave}>
                        OK
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleReset}>
                        Reset
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => alert("Help dialog here")}>
                        Help
                    </Button>
                </DialogFooter>
            </DialogContent>

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

export default WeightCasesModal;