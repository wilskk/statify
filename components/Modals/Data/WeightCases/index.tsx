"use client";

import React, { useState, useEffect } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Dialog,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    AlertCircle,
    Ruler,
    Shapes,
    BarChartHorizontal,
    CornerDownRight
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useVariableStore } from "@/stores/useVariableStore";
import { useMetaStore } from "@/stores/useMetaStore";
import { Variable } from "@/types/Variable";

interface WeightCasesModalProps {
    onClose: () => void;
}

const WeightCasesModal: React.FC<WeightCasesModalProps> = ({ onClose }) => {
    const { variables } = useVariableStore();
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);

    const meta = useMetaStore((state) => state.meta);
    const setMeta = useMetaStore((state) => state.setMeta);

    const [weightMethod, setWeightMethod] = useState<"none" | "byVariable">("none");
    const [frequencyVariable, setFrequencyVariable] = useState<string>("");
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string} | null>(null);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);

    useEffect(() => {
        const numericVariables = variables.filter(v => v.name !== "" && v.type !== "STRING");
        setAvailableVariables(numericVariables);

        if (meta.weight && meta.weight !== "") {
            const weightVar = variables.find(v => v.name === meta.weight && v.type !== "STRING");
            if (weightVar) {
                setHighlightedVariable({ id: weightVar.columnIndex.toString() });
                setFrequencyVariable(meta.weight);
                setWeightMethod("byVariable");
            }
        }
    }, [variables, meta.weight]);

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    const getVariableIcon = (variable: Variable) => {
        if (!variable) return null;

        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <BarChartHorizontal size={14} className="text-gray-600 mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
        }
    };

    const handleVariableSelect = (columnIndex: number) => {
        if (highlightedVariable?.id === columnIndex.toString()) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: columnIndex.toString() });
        }
    };

    const handleSelectFrequencyVariable = (variable: Variable) => {
        if (variable.type === "STRING") {
            setErrorMessage("Weight variable must be numeric");
            setErrorDialogOpen(true);
            return;
        }

        setFrequencyVariable(variable.name);
        setWeightMethod("byVariable");
        setHighlightedVariable({ id: variable.columnIndex.toString() });
    };

    const handleVariableDoubleClick = (variable: Variable) => {
        handleSelectFrequencyVariable(variable);
    };

    const currentStatus =
        weightMethod === "none"
            ? "Do not weight cases"
            : `Weight cases by: ${frequencyVariable || "(not selected)"}`;

    const handleOk = () => {
        if (weightMethod === "none") {
            setMeta({ weight: "" });
        } else if (weightMethod === "byVariable" && frequencyVariable) {
            setMeta({ weight: frequencyVariable });
        }
        onClose();
    };

    const handleReset = () => {
        setWeightMethod("none");
        setFrequencyVariable("");
        setHighlightedVariable(null);
    };

    return (
        <>
            <DialogContent className="max-w-[450px] p-3">
                <DialogHeader className="p-0 mb-2">
                    <DialogTitle>Weight Cases</DialogTitle>
                </DialogHeader>
                <Separator className="my-0" />

                <div className="grid grid-cols-7 gap-2 py-2">
                    <div className="col-span-3 flex flex-col">
                        <Label className="text-xs font-semibold mb-1">Variables:</Label>
                        <div className="border p-2 rounded-md h-[200px] overflow-y-auto overflow-x-hidden">
                            <div className="space-y-1">
                                {availableVariables.map((variable) => (
                                    <TooltipProvider key={variable.columnIndex}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-gray-100 ${
                                                        highlightedVariable?.id === variable.columnIndex.toString()
                                                            ? "bg-gray-200 border-gray-500"
                                                            : "border-gray-300"
                                                    }`}
                                                    onClick={() => handleVariableSelect(variable.columnIndex)}
                                                    onDoubleClick={() => handleVariableDoubleClick(variable)}
                                                >
                                                    <div className="flex items-center w-full">
                                                        {getVariableIcon(variable)}
                                                        <span className="text-xs truncate">{getDisplayName(variable)}</span>
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                                <p className="text-xs">{getDisplayName(variable)}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="col-span-1 flex flex-col items-center justify-center">
                        <Button
                            variant="link"
                            onClick={() => {
                                if (highlightedVariable) {
                                    const variable = availableVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
                                    if (variable) {
                                        handleSelectFrequencyVariable(variable);
                                    }
                                }
                            }}
                            disabled={!highlightedVariable}
                        >
                            <CornerDownRight size={20} />
                        </Button>
                    </div>

                    <div className="col-span-3 space-y-2">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="weightMethod"
                                    className="w-3 h-3"
                                    checked={weightMethod === "none"}
                                    onChange={() => {
                                        setWeightMethod("none");
                                        setFrequencyVariable("");
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
                                    onChange={() => setWeightMethod("byVariable")}
                                />
                                <span className="text-xs">Weight cases by</span>
                            </label>

                            <div className="pl-5 space-y-1">
                                <div className="text-xs text-gray-600">Frequency Variable:</div>
                                <Input
                                    type="text"
                                    value={frequencyVariable}
                                    onChange={(e) => setFrequencyVariable(e.target.value)}
                                    disabled={weightMethod === "none"}
                                    className="h-6 text-xs w-full"
                                />
                            </div>

                            <div className="border p-2 rounded-md bg-gray-50 mt-4">
                                <div className="text-xs text-gray-700">
                                    <span className="font-semibold">Current Status:</span> {currentStatus}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex justify-center space-x-2 mt-4 p-0">
                    <Button size="sm" className="text-xs h-7" onClick={handleOk}>
                        OK
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => alert("Paste syntax here")}>
                        Paste
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
                <DialogContent className="max-w-[450px] p-3">
                    <DialogHeader className="p-0 mb-2">
                        <DialogTitle>IBM SPSS Statistics</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-4">
                        <AlertCircle className="h-10 w-10 text-blue-500" />
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