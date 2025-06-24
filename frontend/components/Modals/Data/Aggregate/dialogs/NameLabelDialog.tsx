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
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

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
            <DialogContent 
                className="w-full p-0 border border-border rounded-md"
                style={{ 
                    maxWidth: "450px",
                    width: "100%",
                    maxHeight: "400px",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                <div className="px-3 py-2 flex-shrink-0">
                    <DialogHeader className="p-0">
                        <DialogTitle className="text-sm font-semibold flex items-center">
                            <span>Aggregate Data: Variable Name</span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                                            <HelpCircle size={14} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        <p className="text-xs">Set name and label for the new aggregated variable.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </DialogTitle>
                    </DialogHeader>
                </div>
                <Separator className="flex-shrink-0" />
                <div className="p-3 flex-grow overflow-y-auto">
                    <div className="text-center mb-3 text-xs bg-muted/50 p-2 rounded-md font-mono">
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
                            <Label htmlFor="name" className="text-xs whitespace-nowrap min-w-12">Name:</Label>
                            <Input
                                id="name"
                                value={newVariableName}
                                onChange={(e) => setNewVariableName(e.target.value)}
                                className="h-7 text-xs"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Label htmlFor="label" className="text-xs whitespace-nowrap min-w-12">Label:</Label>
                            <Input
                                id="label"
                                value={newVariableLabel}
                                onChange={(e) => setNewVariableLabel(e.target.value)}
                                className="h-7 text-xs"
                            />
                        </div>
                    </div>
                </div>
                <Separator className="flex-shrink-0" />
                <DialogFooter className="px-3 py-2 flex-shrink-0">
                    <div className="flex gap-2 ml-auto">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" className="h-7 text-xs" onClick={onApply}>
                            Continue
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export { NameLabelDialog };