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
        <DialogContent className="max-w-[700px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Set Measurement Level</DialogTitle>
            </DialogHeader>

            <div className="p-6 overflow-y-auto flex-grow">
                <div className="flex items-center gap-2 py-2 mb-4 bg-[#F7F7F7] p-3 rounded border border-[#E6E6E6]">
                    <InfoIcon className="text-[#444444] h-4 w-4 flex-shrink-0" />
                    <p className="text-[#444444] text-xs">
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

            <div className="flex items-center px-6 py-3 border-t border-[#E6E6E6] bg-[#F7F7F7] text-xs text-[#888888] flex-shrink-0">
                <InfoIcon size={14} className="mr-2 flex-shrink-0" />
                <span>Variables will retain their assigned measurement level for statistical analysis</span>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-black text-white hover:bg-[#444444] h-8 px-4 text-sm"
                        onClick={handleSave}
                    >
                        OK
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4 text-sm"
                    >
                        Paste
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4 text-sm"
                        onClick={handleReset}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4 text-sm"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4 text-sm"
                    >
                        Help
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
};

export default VariableTab;