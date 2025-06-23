"use client";

import React from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Dialog,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, InfoIcon, HelpCircle } from "lucide-react";
import VariableListManager, { TargetListConfig } from "@/components/Common/VariableListManager";
import { WeightCasesModalProps } from "./types";
import { useWeightCases } from "./hooks/useWeightCases";

// interface WeightCasesModalProps { // MOVED TO TYPES.TS
//     onClose: () => void;
//     containerType?: "dialog" | "sidebar";
// }

// Content component separated from container logic
const WeightCasesContent: React.FC<WeightCasesModalProps> = ({ 
    onClose,
}) => {
    const {
        availableVariables,
        frequencyVariables,
        highlightedVariable,
        setHighlightedVariable,
        errorMessage,
        errorDialogOpen,
        setErrorDialogOpen,
        weightMethod,
        handleMoveVariable,
        handleReorderVariable,
        handleSave,
        handleReset
    } = useWeightCases({ onClose });

    // Configure target lists for VariableListManager
    const targetLists: TargetListConfig[] = [
        {
            id: 'frequency',
            title: 'Weight cases by:',
            variables: frequencyVariables,
            height: '5rem',
            maxItems: 1, 
            draggableItems: false 
        }
    ];

    const currentStatus = weightMethod === "none"
        ? "Do not weight cases"
        : `Weight cases by: ${frequencyVariables[0]?.name || "(not selected)"}`;

    return (
        <>
            <div className="p-6 overflow-y-auto flex-grow">
                {/* Added info section */}
                <div className="flex items-center gap-2 py-2 mb-4 bg-accent p-3 rounded border border-border">
                    <InfoIcon className="text-accent-foreground h-4 w-4 flex-shrink-0" />
                    <p className="text-accent-foreground text-xs">
                        Cases are weighted by the values of the selected numeric variable. 
                        If a case has a value of zero, negative, or missing for the weighting variable, it is excluded from the analysis.
                    </p>
                </div>

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

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                {/* Left: Help icon (Removed) */}
                <div className="flex items-center text-muted-foreground">
                    {/* <HelpCircle size={18} className="mr-1" /> */}
                </div>
                {/* Right: Buttons */} 
                <div>
                    <Button
                        variant="outline"
                        className="mr-2"
                        onClick={handleReset}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="mr-2"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        OK
                    </Button>
                </div>
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