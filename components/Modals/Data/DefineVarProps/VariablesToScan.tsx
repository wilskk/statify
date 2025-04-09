"use client";

import React, { FC, useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    CornerDownLeft,
    CornerDownRight,
    AlertCircle,
    InfoIcon
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useVariableStore } from "@/stores/useVariableStore";
import { Variable } from "@/types/Variable";

interface VariablesToScanProps {
    onClose: () => void;
    onContinue: (variables: Variable[], caseLimit: string | null, valueLimit: string | null) => void;
}

const VariablesToScan: FC<VariablesToScanProps> = ({ onClose, onContinue }) => {
    // Get variables directly from store
    const { variables } = useVariableStore();

    // Variables in the left list (available) and right list (to scan)
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [variablesToScan, setVariablesToScan] = useState<Variable[]>([]);

    // Update available variables when store variables are loaded
    useEffect(() => {
        if (variables && variables.length > 0) {
            // Filter out empty variables if needed
            setAvailableVariables(variables.filter(v => v.name !== ""));
        }
    }, [variables]);

    // Currently selected variable for highlighting
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available' | 'toScan'} | null>(null);

    // Error dialog state
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);

    // Settings for the limits
    const [limitCases, setLimitCases] = useState<boolean>(true);
    const [limitValues, setLimitValues] = useState<boolean>(true);
    const [caseLimit, setCaseLimit] = useState<string>("50");
    const [valueLimit, setValueLimit] = useState<string>("200");

    // Handle variable selection
    const handleVariableSelect = (columnIndex: number, source: 'available' | 'toScan') => {
        if (highlightedVariable?.id === columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: columnIndex.toString(), source });
        }
    };

    // Handle variable double-click
    const handleVariableDoubleClick = (columnIndex: number, source: 'available' | 'toScan') => {
        if (source === 'available') {
            moveToScan(columnIndex);
        } else {
            moveToAvailable(columnIndex);
        }
    };

    // Move a variable from available to scan
    const moveToScan = (columnIndex: number) => {
        const variable = availableVariables.find(v => v.columnIndex === columnIndex);
        if (variable) {
            setVariablesToScan(prev => [...prev, variable]);
            setAvailableVariables(prev => prev.filter(v => v.columnIndex !== columnIndex));
            setHighlightedVariable(null);
        }
    };

    // Move a variable from scan to available
    const moveToAvailable = (columnIndex: number) => {
        const variable = variablesToScan.find(v => v.columnIndex === columnIndex);
        if (variable) {
            setAvailableVariables(prev => [...prev, variable]);
            setVariablesToScan(prev => prev.filter(v => v.columnIndex !== columnIndex));
            setHighlightedVariable(null);
        }
    };

    // Handle arrow click (right)
    const handleMoveToScan = () => {
        if (highlightedVariable && highlightedVariable.source === 'available') {
            const columnIndex = parseInt(highlightedVariable.id);
            moveToScan(columnIndex);
        }
    };

    // Handle arrow click (left)
    const handleMoveFromScan = () => {
        if (highlightedVariable && highlightedVariable.source === 'toScan') {
            const columnIndex = parseInt(highlightedVariable.id);
            moveToAvailable(columnIndex);
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
    const handleContinue = () => {
        if (variablesToScan.length === 0) {
            setErrorMessage("No variables have been selected for scanning.");
            setErrorDialogOpen(true);
            return;
        }

        // Continue to the Properties Editor with selected variables and limits
        onContinue(
            variablesToScan,
            limitCases ? caseLimit : null,
            limitValues ? valueLimit : null
        );
    };

    // Render variable list
    const renderVariableList = (variables: Variable[], source: 'available' | 'toScan', height: string) => (
        <div className="border border-[#E6E6E6] p-2 rounded-md overflow-y-auto overflow-x-hidden" style={{ height }}>
            <div className="space-y-1">
                {variables.length === 0 ? (
                    <div className="px-2 py-1 text-xs text-[#888888] italic">No variables</div>
                ) : (
                    variables.map((variable) => (
                        <TooltipProvider key={variable.columnIndex}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-[#F7F7F7] ${
                                            highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === source
                                                ? "bg-[#E6E6E6] border-[#888888]"
                                                : "border-[#CCCCCC]"
                                        }`}
                                        onClick={() => handleVariableSelect(variable.columnIndex, source)}
                                        onDoubleClick={() => handleVariableDoubleClick(variable.columnIndex, source)}
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
                    ))
                )}
            </div>
        </div>
    );

    return (
        <>
            <DialogContent className="max-w-[650px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
                <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                    <DialogTitle className="text-[22px] font-semibold">Define Variable Properties</DialogTitle>
                </DialogHeader>

                <div className="p-6 overflow-y-auto flex-grow">
                    {/* Information text */}
                    <div className="mb-6 p-4 border-l-2 border-black bg-[#F7F7F7] rounded-sm">
                        <div className="space-y-2">
                            <p className="text-sm">
                                Use this facility to label variable values and set other properties
                                after scanning the data.
                            </p>
                            <p className="text-sm">
                                Select the variables to scan. They should be categorical
                                (nominal or ordinal) for best results. You can change the
                                measurement level setting in the next panel.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-8 gap-6">
                        {/* Left Column - Available Variables */}
                        <div className="col-span-3">
                            <div className="text-sm mb-2 font-medium">Variables:</div>
                            {renderVariableList(availableVariables, 'available', '250px')}
                            <div className="text-xs mt-2 text-[#888888] flex items-center">
                                <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                                <span>Double-click variables to move them between lists</span>
                            </div>
                        </div>

                        {/* Middle Column - Arrow Controls */}
                        <div className="col-span-1 flex flex-col items-center justify-center">
                            <div className="flex flex-col space-y-32">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                    onClick={highlightedVariable?.source === 'toScan' ? handleMoveFromScan : handleMoveToScan}
                                    disabled={!highlightedVariable || (highlightedVariable.source !== 'available' && highlightedVariable.source !== 'toScan')}
                                >
                                    {highlightedVariable?.source === 'toScan' ?
                                        <CornerDownLeft size={16} /> :
                                        <CornerDownRight size={16} />
                                    }
                                </Button>
                            </div>
                        </div>

                        {/* Right Column - Variables to Scan */}
                        <div className="col-span-4">
                            <div className="text-sm mb-2 font-medium">Variables to Scan:</div>
                            {renderVariableList(variablesToScan, 'toScan', '250px')}
                        </div>
                    </div>

                    {/* Limit options */}
                    <div className="border border-[#E6E6E6] rounded-md p-6 mt-6">
                        <div className="text-sm font-medium mb-4">Scanning Limits</div>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="limit-cases"
                                    checked={limitCases}
                                    onCheckedChange={(checked) => setLimitCases(!!checked)}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="limit-cases" className="text-sm cursor-pointer">
                                    Limit number of cases scanned to:
                                </Label>
                                <Input
                                    value={caseLimit}
                                    onChange={(e) => setCaseLimit(e.target.value)}
                                    className="w-24 h-8 text-sm border-[#CCCCCC] focus:border-black focus:ring-black"
                                    disabled={!limitCases}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="limit-values"
                                    checked={limitValues}
                                    onCheckedChange={(checked) => setLimitValues(!!checked)}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="limit-values" className="text-sm cursor-pointer">
                                    Limit number of values displayed to:
                                </Label>
                                <Input
                                    value={valueLimit}
                                    onChange={(e) => setValueLimit(e.target.value)}
                                    className="w-24 h-8 text-sm border-[#CCCCCC] focus:border-black focus:ring-black"
                                    disabled={!limitValues}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                    <div className="flex justify-end space-x-3">
                        <Button
                            className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                            onClick={handleContinue}
                        >
                            Continue
                        </Button>
                        <Button
                            variant="outline"
                            className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        >
                            Paste
                        </Button>
                        <Button
                            variant="outline"
                            className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        >
                            Reset
                        </Button>
                        <Button
                            variant="outline"
                            className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        >
                            Help
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>

            {/* Error Dialog */}
            <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <DialogContent className="max-w-[400px] p-6 bg-white border border-[#E6E6E6] shadow-md rounded-md">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-[18px] font-semibold">Statify</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-4 items-start">
                        <AlertCircle className="h-6 w-6 text-black flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{errorMessage}</p>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button
                            className="bg-black text-white hover:bg-[#444444] h-8 px-4"
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

export default VariablesToScan;