import React, { FC } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InfoIcon, HelpCircle } from "lucide-react";
import { Variable } from "@/types/Variable";
import VariableListManager from "@/components/Common/VariableListManager";
import type { TargetListConfig } from "@/components/Common/VariableListManager";
import { VariableTabProps } from "./types"; // Import from new types.ts

// Props interface for VariableTab component
// interface VariableTabProps { // This will be removed
//     onClose: () => void;
//     unknownVariables: Variable[];
//     nominalVariables: Variable[];
//     ordinalVariables: Variable[];
//     scaleVariables: Variable[];
//     highlightedVariable: { id: string, source: string } | null;
//     setHighlightedVariable: (value: { id: string, source: string } | null) => void;
//     handleMoveVariable: (variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => void;
//     handleReorderVariable: (listId: string, variables: Variable[]) => void;
//     handleSave: () => void;
//     handleReset: () => void;
//     containerType?: "dialog" | "sidebar";
// }

// The content component that's shared between dialog and sidebar
const VariableTabContent: FC<VariableTabProps> = ({
    onClose,
    unknownVariables,
    nominalVariables,
    ordinalVariables,
    scaleVariables,
    highlightedVariable,
    setHighlightedVariable,
    handleMoveVariable,
    handleReorderVariable,
    handleSave,
    handleReset,
    containerType = "dialog"
}) => {
    // Configure target lists for VariableListManager
    const targetLists: TargetListConfig[] = [
        {
            id: 'nominal',
            title: 'Nominal Variables',
            variables: nominalVariables,
            height: '110px',
            draggableItems: false // Prevent reordering within nominal list
        },
        {
            id: 'ordinal',
            title: 'Ordinal Variables',
            variables: ordinalVariables,
            height: '110px',
            draggableItems: false // Prevent reordering within ordinal list
        },
        {
            id: 'scale',
            title: 'Scale/Continuous Variabless',
            variables: scaleVariables,
            height: '110px',
            draggableItems: false // Prevent reordering within scale list
        }
    ];

    return (
        <>
            <div className="p-6 overflow-y-auto flex-grow">
                <div className="flex items-center gap-2 py-2 mb-4 bg-accent p-3 rounded border border-border">
                    <InfoIcon className="text-accent-foreground h-4 w-4 flex-shrink-0" />
                    <p className="text-accent-foreground text-xs">
                        This dialog only displays variables for which the measurement level is unknown.
                        Use Variable View in the Data Editor to change the measurement level for other variables.
                    </p>
                </div>

                {/* Use VariableListManager instead of the custom layout */}
                <VariableListManager
                    availableVariables={unknownVariables}
                    targetLists={targetLists}
                    variableIdKey="tempId"
                    highlightedVariable={highlightedVariable}
                    setHighlightedVariable={setHighlightedVariable}
                    onMoveVariable={handleMoveVariable}
                    onReorderVariable={handleReorderVariable}
                    showArrowButtons={true} // Enable arrow buttons
                    availableListHeight={"420px"}
                />
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
                    <Button onClick={handleSave}>
                        OK
                    </Button>
                </div>
            </div>
        </>
    );
};

// Main component that handles different container types
const VariableTab: FC<VariableTabProps> = (props) => {
    const { containerType = "dialog", onClose } = props;
    
    // If sidebar mode, use a div container
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    {/* Title for sidebar mode - TEMPORARILY COMMENTED OUT FOR DIAGNOSIS */}
                    {/* <h2 className="text-lg font-semibold px-6 py-4 border-b border-border">Set Measurement Level</h2> */}
                    <VariableTabContent {...props} />
                </div>
            </div>
        );
    }

    // For dialog mode, VariableTab now renders the Dialog, DialogContent, DialogHeader, and DialogTitle
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-[700px] p-0 bg-popover border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-[22px] font-semibold text-popover-foreground">Set Measurement Level</DialogTitle>
                </DialogHeader>
                <VariableTabContent {...props} />
            </DialogContent>
        </Dialog>
    );
};

export default VariableTab;