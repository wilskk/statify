import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface NameLabelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentEditingVariable: any;
    newVariableName: string;
    setNewVariableName: (name: string) => void;
    newVariableLabel: string;
    setNewVariableLabel: (label: string) => void;
    onApply: () => void;
}

const NameLabelDialog: React.FC<NameLabelDialogProps> = ({
                                                             open,
                                                             onOpenChange,
                                                             currentEditingVariable,
                                                             newVariableName,
                                                             setNewVariableName,
                                                             newVariableLabel,
                                                             setNewVariableLabel,
                                                             onApply
                                                         }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[400px] p-3">
                <DialogHeader className="p-0 mb-2">
                    <DialogTitle>Aggregate Data: Variable Name</DialogTitle>
                </DialogHeader>

                <div className="text-center mb-4">
                    {currentEditingVariable && (() => {
                        const func = currentEditingVariable.calculationFunction || currentEditingVariable.function;
                        let displayFormula;

                        if (["PGT", "PLT", "FGT", "FLT"].includes(func) && currentEditingVariable.percentageValue) {
                            displayFormula = `${func}(${currentEditingVariable.baseVarName}, ${currentEditingVariable.percentageValue})`;
                        } else if (["PIN", "POUT", "FIN", "FOUT"].includes(func) &&
                            currentEditingVariable.percentageLow &&
                            currentEditingVariable.percentageHigh) {
                            displayFormula = `${func}(${currentEditingVariable.baseVarName}, ${currentEditingVariable.percentageLow}, ${currentEditingVariable.percentageHigh})`;
                        } else {
                            displayFormula = `${func}(${currentEditingVariable.baseVarName})`;
                        }

                        return displayFormula;
                    })()}
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="name" className="text-xs whitespace-nowrap">Name:</Label>
                        <Input
                            id="name"
                            value={newVariableName}
                            onChange={(e) => setNewVariableName(e.target.value)}
                            className="h-7 text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Label htmlFor="label" className="text-xs whitespace-nowrap">Label:</Label>
                        <Input
                            id="label"
                            value={newVariableLabel}
                            onChange={(e) => setNewVariableLabel(e.target.value)}
                            className="h-7 text-xs"
                        />
                    </div>
                </div>

                <DialogFooter className="flex justify-center space-x-2 mt-4 p-0">
                    <Button
                        size="sm"
                        className="text-xs h-7"
                        onClick={onApply}
                    >
                        Continue
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                    >
                        Help
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export { NameLabelDialog };