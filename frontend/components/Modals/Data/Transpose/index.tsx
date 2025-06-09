"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    HelpCircle,
    InfoIcon // Import InfoIcon
} from "lucide-react";
import { Variable } from "@/types/Variable";
import VariableListManager, { TargetListConfig } from "@/components/Common/VariableListManager";
import { TransposeModalProps } from "./types";
import { useTranspose } from "./hooks/useTranspose";

// Content component separated from container logic
const TransposeContent: React.FC<TransposeModalProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    const {
        availableVariables,
        selectedVariables,
        nameVariables,
        highlightedVariable,
        setHighlightedVariable,
        getDisplayName,
        handleMoveVariable,
        handleReorderVariable,
        handleOk,
        handleReset
    } = useTranspose({ onClose });

    // Get variable icon based on measure
    const getVariableIcon = (variable: Variable) => {
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

    // Configure target lists for VariableListManager
    const selectedListConfig: TargetListConfig = {
        id: 'selected',
        title: 'Variable(s):',
        variables: selectedVariables,
        height: '11.5rem',
        droppable: true,
        draggableItems: true
    };

    const nameListConfig: TargetListConfig = {
        id: 'name',
        title: 'Name Variable:',
        variables: nameVariables,
        height: '3rem',
        maxItems: 1,
        droppable: true,
        draggableItems: false
    };

    return (
        <>
            {containerType === "dialog" && (
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold">Transpose</DialogTitle>
                </DialogHeader>
            )}
            <div className="p-6 overflow-y-auto flex-grow">
                <div className="space-y-6">
                    {/* Updated info section */}
                    <div className="flex items-center gap-2 py-2 mb-4 bg-accent p-3 rounded border border-border">
                        <InfoIcon className="text-accent-foreground h-4 w-4 flex-shrink-0" />
                        <p className="text-accent-foreground text-xs">
                            Variables become cases and cases become variables. The name variable (optional) provides names for the new variables.
                        </p>
                    </div>
                    <VariableListManager
                        availableVariables={availableVariables}
                        targetLists={[selectedListConfig, nameListConfig]}
                        variableIdKey="tempId"
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        onMoveVariable={handleMoveVariable}
                        onReorderVariable={handleReorderVariable}
                        getVariableIcon={getVariableIcon}
                        getDisplayName={getDisplayName}
                        showArrowButtons={true}
                        availableListHeight="14rem"
                    />
                </div>
            </div>

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                {/* Left: Help icon (Removed) */}
                <div className="flex items-center text-muted-foreground">
                    {/* <HelpCircle size={18} className="mr-1" /> */}
                </div>
                {/* Right: Buttons */} 
                <div>
                    {/* <Button
                        variant="outline"
                        className="mr-2"
                        onClick={handleReset}
                    >
                        Reset
                    </Button> */}
                    <Button
                        variant="outline"
                        className="mr-2"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleOk}>
                        OK
                    </Button>
                </div>
            </div>
        </>
    );
};

// Main component that handles different container types
const TransposeModal: React.FC<TransposeModalProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    // If sidebar mode, use a div container
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <TransposeContent onClose={onClose} containerType={containerType} />
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent
    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-md p-0 bg-card border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
                <TransposeContent onClose={onClose} containerType={containerType} />
            </DialogContent>
        </Dialog>
    );
};

export default TransposeModal;