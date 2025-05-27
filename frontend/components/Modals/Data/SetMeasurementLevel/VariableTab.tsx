import React, { FC } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";
import { Variable } from "@/types/Variable";
import VariableListManager from "@/components/Common/VariableListManager";
import type { TargetListConfig } from "@/components/Common/VariableListManager";

// Props interface for VariableTab component
interface VariableTabProps {
    onClose: () => void;
    unknownVariables: Variable[];
    nominalVariables: Variable[];
    ordinalVariables: Variable[];
    scaleVariables: Variable[];
    highlightedVariable: { id: string, source: string } | null;
    setHighlightedVariable: (value: { id: string, source: string } | null) => void;
    handleMoveVariable: (variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => void;
    handleReorderVariable: (listId: string, variables: Variable[]) => void;
    handleSave: () => void;
    handleReset: () => void;
}

const VariableTab: FC<VariableTabProps> = ({
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
                                               handleReset
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
        <DialogContent className="max-w-[700px] p-0 bg-popover border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold text-popover-foreground">Set Measurement Level</DialogTitle>
            </DialogHeader>

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

            <div className="flex items-center px-6 py-3 border-t border-border bg-muted text-xs text-muted-foreground flex-shrink-0">
                <InfoIcon size={14} className="mr-2 flex-shrink-0" />
                <span>Variables will retain their assigned measurement level for statistical analysis</span>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border bg-muted flex-shrink-0 rounded-b-md">
                <div className="flex justify-end space-x-3">
                    <Button size="sm" onClick={handleSave}>OK</Button>
                    {/* <Button variant="outline" size="sm">Paste</Button> */}
                    <Button variant="outline" size="sm" onClick={handleReset}>Reset</Button>
                    <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                    <Button variant="outline" size="sm">Help</Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
};

export default VariableTab;