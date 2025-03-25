"use client";

import React, { FC, useState, useEffect } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Dialog,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useVariableStore } from "@/stores/useVariableStore";
import { useModalStore, ModalType } from "@/stores/useModalStore";
import { Variable } from "@/types/Variable";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    CornerDownRight,
    AlertCircle
} from "lucide-react";

interface SelectCasesProps {
    onClose: () => void;
}

const SelectCases: FC<SelectCasesProps> = ({ onClose }) => {
    const { closeModal, openModal } = useModalStore();

    // Get variables from store
    const { variables } = useVariableStore();
    const [storeVariables, setStoreVariables] = useState<Variable[]>([]);

    // Selected variable for highlighting
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available'} | null>(null);

    // Filter options state
    const [selectOption, setSelectOption] = useState<string>("all");
    const [filterVariable, setFilterVariable] = useState<Variable | null>(null);
    const [outputOption, setOutputOption] = useState<string>("filter");
    const [newDatasetName, setNewDatasetName] = useState<string>("");
    const [currentStatus, setCurrentStatus] = useState<string>("Do not filter cases");

    // Error dialog state
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);

    // Update available variables when store variables are loaded
    useEffect(() => {
        setStoreVariables(variables.filter(v => v.name !== ""));
    }, [variables]);

    // Handle variable selection
    const handleVariableSelect = (columnIndex: number, source: 'available') => {
        if (highlightedVariable?.id === columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: columnIndex.toString(), source });
        }
    };

    // Handle variable double-click
    const handleVariableDoubleClick = (columnIndex: number, source: 'available') => {
        if (source === 'available') {
            const variable = storeVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                setFilterVariable(variable);
                setSelectOption("variable");
            }
        }
    };

    // Handle transfer click
    const handleTransferClick = () => {
        if (highlightedVariable && highlightedVariable.source === 'available') {
            const columnIndex = parseInt(highlightedVariable.id);
            const variable = storeVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                setFilterVariable(variable);
                setSelectOption("variable");
                setHighlightedVariable(null);
            }
        }
    };

    // Get variable icon based on measure
    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-gray-600 mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
        }
    };

    // Get display name for variable
    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    // Button handlers
    const handleConfirm = () => {
        if (selectOption === "variable" && !filterVariable) {
            setErrorMessage("Please select a filter variable.");
            setErrorDialogOpen(true);
            return;
        }

        if (outputOption === "copy" && !newDatasetName.trim()) {
            setErrorMessage("Please enter a dataset name.");
            setErrorDialogOpen(true);
            return;
        }

        // Implement the confirmation logic here
        // This would typically involve setting up the filter based on the selected options

        // Update the status based on selection
        if (selectOption === "all") {
            setCurrentStatus("All cases will be processed");
        } else if (selectOption === "variable" && filterVariable) {
            setCurrentStatus(`Filter variable: ${filterVariable.name}`);
        } else {
            setCurrentStatus("Custom filter applied");
        }

        closeModal();
    };

    const handleReset = () => {
        setSelectOption("all");
        setFilterVariable(null);
        setOutputOption("filter");
        setNewDatasetName("");
        setCurrentStatus("Do not filter cases");
    };

    const handleHelp = () => {
        console.log("Help requested");
    };

    const handlePaste = () => {
        console.log("Paste syntax requested");
    };

    return (
        <>
            <DialogContent className="max-w-[650px] p-3">
                <DialogHeader className="p-0 mb-2">
                    <DialogTitle>Select Cases</DialogTitle>
                </DialogHeader>
                <Separator className="my-0" />

                <div className="grid grid-cols-9 gap-4 py-2">
                    {/* Left Column - Variables List */}
                    <div className="col-span-3">
                        <Label className="text-xs font-semibold mb-1">Variables:</Label>
                        <div className="border p-2 rounded-md h-[420px] overflow-y-auto overflow-x-hidden">
                            <div className="space-y-1">
                                {storeVariables.map((variable) => (
                                    <TooltipProvider key={variable.columnIndex}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-gray-100 ${
                                                        highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === 'available'
                                                            ? "bg-gray-200 border-gray-500"
                                                            : "border-gray-300"
                                                    }`}
                                                    onClick={() => handleVariableSelect(variable.columnIndex, 'available')}
                                                    onDoubleClick={() => handleVariableDoubleClick(variable.columnIndex, 'available')}
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

                    {/* Right Column - Selection Options */}
                    <div className="col-span-6">
                        {/* Select section */}
                        <div className="border rounded-md p-3 mb-3">
                            <div className="text-sm font-medium mb-2">Select</div>

                            <div className="space-y-2">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="selectOption"
                                        checked={selectOption === "all"}
                                        onChange={() => setSelectOption("all")}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">All cases</span>
                                </label>

                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="selectOption"
                                        checked={selectOption === "condition"}
                                        onChange={() => setSelectOption("condition")}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">If condition is satisfied</span>
                                </label>

                                <div className="pl-6">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        disabled={selectOption !== "condition"}
                                    >
                                        If...
                                    </Button>
                                </div>

                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="selectOption"
                                        checked={selectOption === "random"}
                                        onChange={() => setSelectOption("random")}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Random sample of cases</span>
                                </label>

                                <div className="pl-6">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        disabled={selectOption !== "random"}
                                    >
                                        Sample...
                                    </Button>
                                </div>

                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="selectOption"
                                        checked={selectOption === "time"}
                                        onChange={() => setSelectOption("time")}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Based on time or case range</span>
                                </label>

                                <div className="pl-6">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        disabled={selectOption !== "time"}
                                    >
                                        Range...
                                    </Button>
                                </div>

                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="selectOption"
                                        checked={selectOption === "variable"}
                                        onChange={() => setSelectOption("variable")}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Use filter variable:</span>
                                </label>

                                <div className="pl-6 flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0 flex items-center justify-center"
                                        disabled={selectOption !== "variable" || !highlightedVariable}
                                        onClick={handleTransferClick}
                                    >
                                        <CornerDownRight size={16} />
                                    </Button>
                                    <Input
                                        className="h-7 text-xs"
                                        value={filterVariable?.name || ""}
                                        readOnly
                                        disabled={selectOption !== "variable"}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Output section */}
                        <div className="border rounded-md p-3">
                            <div className="text-sm font-medium mb-2">Output</div>

                            <div className="space-y-2">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="outputOption"
                                        checked={outputOption === "filter"}
                                        onChange={() => setOutputOption("filter")}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Filter out unselected cases</span>
                                </label>

                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="outputOption"
                                        checked={outputOption === "copy"}
                                        onChange={() => setOutputOption("copy")}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Copy selected cases to a new dataset</span>
                                </label>

                                <div className="pl-6 flex items-center gap-2">
                                    <span className="text-xs">Dataset name:</span>
                                    <Input
                                        className="h-7 text-xs"
                                        value={newDatasetName}
                                        onChange={(e) => setNewDatasetName(e.target.value)}
                                        disabled={outputOption !== "copy"}
                                    />
                                </div>

                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="outputOption"
                                        checked={outputOption === "delete"}
                                        onChange={() => setOutputOption("delete")}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Delete unselected cases</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-gray-600 mt-2">
                    Current Status: {currentStatus}
                </div>

                <DialogFooter className="flex justify-center space-x-2 mt-2 p-0">
                    <Button
                        size="sm"
                        className="text-xs h-7"
                        onClick={handleConfirm}
                    >
                        OK
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={handlePaste}
                    >
                        Paste
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={handleReset}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={handleHelp}
                    >
                        Help
                    </Button>
                </DialogFooter>
            </DialogContent>

            {/* Error Dialog */}
            <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <DialogContent className="max-w-[450px] p-3">
                    <DialogHeader className="p-0 mb-2">
                        <DialogTitle>Statify</DialogTitle>
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

export default SelectCases;