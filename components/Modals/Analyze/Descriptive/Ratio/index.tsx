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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useModalStore } from "@/stores/useModalStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { Variable } from "@/types/Variable";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    ChevronRight
} from "lucide-react";

interface RatioStatisticsProps {
    onClose: () => void;
}

const RatioStatistics: FC<RatioStatisticsProps> = ({ onClose }) => {
    const { closeModal } = useModalStore();
    const { variables } = useVariableStore();
    const { data } = useDataStore();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    const [storeVariables, setStoreVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<string | null>(null);

    const [numeratorVariable, setNumeratorVariable] = useState<Variable | null>(null);
    const [denominatorVariable, setDenominatorVariable] = useState<Variable | null>(null);
    const [groupVariable, setGroupVariable] = useState<Variable | null>(null);

    const [sortByGroup, setSortByGroup] = useState(true);
    const [sortOrder, setSortOrder] = useState<"ascending" | "descending">("ascending");
    const [displayResults, setDisplayResults] = useState(true);
    const [saveToFile, setSaveToFile] = useState(false);
    const [filePath, setFilePath] = useState("");

    useEffect(() => {
        setStoreVariables(variables.filter(v => v.name !== ""));
    }, [variables]);

    const handleVariableClick = (columnIndex: string) => {
        setHighlightedVariable(columnIndex === highlightedVariable ? null : columnIndex);
    };

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

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    const setAsNumerator = () => {
        if (!highlightedVariable) return;
        const variable = storeVariables.find(v => v.columnIndex.toString() === highlightedVariable);
        if (variable) {
            setNumeratorVariable(variable);
        }
    };

    const setAsDenominator = () => {
        if (!highlightedVariable) return;
        const variable = storeVariables.find(v => v.columnIndex.toString() === highlightedVariable);
        if (variable) {
            setDenominatorVariable(variable);
        }
    };

    const setAsGroupVariable = () => {
        if (!highlightedVariable) return;
        const variable = storeVariables.find(v => v.columnIndex.toString() === highlightedVariable);
        if (variable) {
            setGroupVariable(variable);
        }
    };

    const handleFileBrowse = () => {
        // File browse logic would go here
        console.log("Browse for file");
    };

    const handleStatistics = () => {
        // Statistics dialog logic would go here
        console.log("Statistics options");
    };

    const handleConfirm = async () => {
        if (!numeratorVariable || !denominatorVariable) {
            alert("Please select both numerator and denominator variables.");
            return;
        }

        try {
            // Logic for performing ratio statistics analysis would go here

            // Create a log entry
            const logEntry = {
                log: `Ratio Statistics Analysis: ${new Date().toLocaleString()}`
            };

            const logId = await addLog(logEntry);

            // Create an analytic entry
            const analyticEntry = {
                title: "Ratio Statistics",
                note: `Analysis performed with numerator: ${numeratorVariable.name}, denominator: ${denominatorVariable.name}${groupVariable ? `, grouped by: ${groupVariable.name}` : ''}.`
            };

            const analyticId = await addAnalytic(logId, analyticEntry);

            // Save results - implementation would depend on actual analysis

            // Close the modal
            closeModal();
        } catch (error) {
            console.error("Error performing ratio statistics analysis:", error);
            alert("An error occurred while performing the analysis. Please try again.");
        }
    };

    const handleReset = () => {
        setNumeratorVariable(null);
        setDenominatorVariable(null);
        setGroupVariable(null);
        setSortByGroup(true);
        setSortOrder("ascending");
        setDisplayResults(true);
        setSaveToFile(false);
        setFilePath("");
    };

    return (
        <DialogContent className="max-w-[520px] p-0 bg-[#F0F0F0] border border-[#0000AA] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-4 py-2 border-b border-[#0000AA] flex-shrink-0 bg-[#DDDDFF]">
                <DialogTitle className="text-[16px] font-semibold flex items-center">
                    <div className="w-5 h-5 mr-2 bg-[#FF0000] border border-[#0000AA]"></div>
                    Ratio Statistics
                </DialogTitle>
            </DialogHeader>

            <div className="p-4 flex-grow">
                <div className="grid grid-cols-6 gap-4">
                    {/* Left side - Variable list */}
                    <div className="col-span-3">
                        <div className="border border-[#0000AA] bg-white h-[200px] overflow-y-auto">
                            {storeVariables.map((variable) => (
                                <TooltipProvider key={variable.columnIndex}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`flex items-center p-1 cursor-pointer ${
                                                    highlightedVariable === variable.columnIndex.toString()
                                                        ? "bg-[#FFFF99] border border-[#888888]"
                                                        : ""
                                                }`}
                                                onClick={() => handleVariableClick(variable.columnIndex.toString())}
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

                    {/* Right side - Variable selections */}
                    <div className="col-span-3 space-y-3">
                        {/* Numerator */}
                        <div>
                            <div className="text-sm mb-1 font-semibold underline">Numerator:</div>
                            <div className="flex">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="p-0 w-8 h-8 mr-2 bg-[#BBDEFB] border-[#0000AA] hover:bg-[#90CAF9]"
                                    onClick={setAsNumerator}
                                    disabled={!highlightedVariable}
                                >
                                    <ChevronRight size={16} className="text-[#0000AA]" />
                                </Button>
                                <div className="border border-[#0000AA] bg-white h-8 flex-grow flex items-center px-2">
                                    <span className="text-xs truncate">
                                        {numeratorVariable ? getDisplayName(numeratorVariable) : ""}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Denominator */}
                        <div>
                            <div className="text-sm mb-1 font-semibold underline">Denominator:</div>
                            <div className="flex">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="p-0 w-8 h-8 mr-2 bg-[#BBDEFB] border-[#0000AA] hover:bg-[#90CAF9]"
                                    onClick={setAsDenominator}
                                    disabled={!highlightedVariable}
                                >
                                    <ChevronRight size={16} className="text-[#0000AA]" />
                                </Button>
                                <div className="border border-[#0000AA] bg-white h-8 flex-grow flex items-center px-2">
                                    <span className="text-xs truncate">
                                        {denominatorVariable ? getDisplayName(denominatorVariable) : ""}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Group Variable */}
                        <div>
                            <div className="text-sm mb-1 font-semibold underline">Group Variable:</div>
                            <div className="flex">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="p-0 w-8 h-8 mr-2 bg-[#BBDEFB] border-[#0000AA] hover:bg-[#90CAF9]"
                                    onClick={setAsGroupVariable}
                                    disabled={!highlightedVariable}
                                >
                                    <ChevronRight size={16} className="text-[#0000AA]" />
                                </Button>
                                <div className="border border-[#0000AA] bg-white h-8 flex-grow flex items-center px-2">
                                    <span className="text-xs truncate">
                                        {groupVariable ? getDisplayName(groupVariable) : ""}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Sort options */}
                        <div className="mt-2 pl-10">
                            <div className="flex items-center mb-1">
                                <Checkbox
                                    id="sortByGroup"
                                    checked={sortByGroup}
                                    onCheckedChange={(checked) => setSortByGroup(!!checked)}
                                    className="mr-2 border-[#888888]"
                                    disabled={!groupVariable}
                                />
                                <Label htmlFor="sortByGroup" className="text-sm cursor-pointer">
                                    Sort by group variable
                                </Label>
                            </div>

                            <div className="pl-6">
                                <RadioGroup
                                    value={sortOrder}
                                    onValueChange={(value) => setSortOrder(value as "ascending" | "descending")}
                                    className="space-y-1"
                                    disabled={!sortByGroup || !groupVariable}
                                >
                                    <div className="flex items-center">
                                        <RadioGroupItem
                                            value="ascending"
                                            id="ascending"
                                            className="mr-2 border-[#888888] data-[state=checked]:bg-[#0000AA] data-[state=checked]:border-[#0000AA]"
                                        />
                                        <Label htmlFor="ascending" className="text-sm cursor-pointer">
                                            Ascending order
                                        </Label>
                                    </div>
                                    <div className="flex items-center">
                                        <RadioGroupItem
                                            value="descending"
                                            id="descending"
                                            className="mr-2 border-[#888888] data-[state=checked]:bg-[#0000AA] data-[state=checked]:border-[#0000AA]"
                                        />
                                        <Label htmlFor="descending" className="text-sm cursor-pointer">
                                            Descending order
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Output options */}
                <div className="mt-4">
                    <div className="flex items-center mb-2">
                        <Checkbox
                            id="displayResults"
                            checked={displayResults}
                            onCheckedChange={(checked) => setDisplayResults(!!checked)}
                            className="mr-2 border-[#888888]"
                        />
                        <Label htmlFor="displayResults" className="text-sm cursor-pointer font-semibold">
                            Display results
                        </Label>
                    </div>

                    <div className="flex items-center mb-2">
                        <Checkbox
                            id="saveToFile"
                            checked={saveToFile}
                            onCheckedChange={(checked) => setSaveToFile(!!checked)}
                            className="mr-2 border-[#888888]"
                        />
                        <Label htmlFor="saveToFile" className="text-sm cursor-pointer">
                            Save results to external file
                        </Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                            <Button
                                variant="outline"
                                className="h-8 px-4 py-1 bg-[#DDDDFF] border-[#0000AA] hover:bg-[#BBBBFF] text-sm"
                                onClick={handleFileBrowse}
                                disabled={!saveToFile}
                            >
                                File...
                            </Button>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                className="h-8 px-4 py-1 bg-[#DDDDFF] border-[#0000AA] hover:bg-[#BBBBFF] text-sm"
                                onClick={handleStatistics}
                            >
                                Statistics...
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter className="p-4 border-t border-[#0000AA] bg-[#F0F0F0] flex justify-center">
                <div className="grid grid-cols-5 gap-2">
                    <Button
                        variant="outline"
                        className="h-8 px-4 py-1 bg-[#DDDDFF] border-[#0000AA] hover:bg-[#BBBBFF] text-sm"
                        onClick={handleConfirm}
                    >
                        OK
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 px-4 py-1 bg-[#DDDDFF] border-[#0000AA] hover:bg-[#BBBBFF] text-sm opacity-50"
                    >
                        Paste
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 px-4 py-1 bg-[#DDDDFF] border-[#0000AA] hover:bg-[#BBBBFF] text-sm"
                        onClick={handleReset}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 px-4 py-1 bg-[#DDDDFF] border-[#0000AA] hover:bg-[#BBBBFF] text-sm"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 px-4 py-1 bg-[#DDDDFF] border-[#0000AA] hover:bg-[#BBBBFF] text-sm"
                    >
                        Help
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
};

export default RatioStatistics;