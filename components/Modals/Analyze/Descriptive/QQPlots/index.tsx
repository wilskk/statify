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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
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

interface QQPlotsProps {
    onClose: () => void;
}

const Index: FC<QQPlotsProps> = ({ onClose }) => {
    const { closeModal } = useModalStore();
    const { variables } = useVariableStore();
    const { data } = useDataStore();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    // Variables
    const [storeVariables, setStoreVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<string | null>(null);

    // Test Distribution
    const [testDistribution, setTestDistribution] = useState("normal");
    const [degreesOfFreedom, setDegreesOfFreedom] = useState("");

    // Distribution Parameters
    const [estimateFromData, setEstimateFromData] = useState(true);
    const [location, setLocation] = useState("0");
    const [scale, setScale] = useState("1");

    // Transform
    const [naturalLogTransform, setNaturalLogTransform] = useState(false);
    const [standardizeValues, setStandardizeValues] = useState(false);
    const [useDifference, setUseDifference] = useState(false);
    const [differenceValue, setDifferenceValue] = useState("1");
    const [useSeasonalDifference, setUseSeasonalDifference] = useState(false);
    const [seasonalDifferenceValue, setSeasonalDifferenceValue] = useState("1");
    const [currentPeriodicity, setCurrentPeriodicity] = useState("None");

    // Proportion Estimation Formula
    const [proportionEstimation, setProportionEstimation] = useState("blom");

    // Rank Assigned to Ties
    const [rankAssigned, setRankAssigned] = useState("mean");

    useEffect(() => {
        setStoreVariables(variables.filter(v => v.name !== ""));
    }, [variables]);

    const handleVariableClick = (columnIndex: string) => {
        setHighlightedVariable(columnIndex === highlightedVariable ? null : columnIndex);
    };

    const transferToSelectedVariables = () => {
        if (!highlightedVariable) return;

        const variable = storeVariables.find(v => v.columnIndex.toString() === highlightedVariable);
        if (variable) {
            setSelectedVariables(prev => [...prev, variable]);
            setStoreVariables(prev => prev.filter(v => v.columnIndex.toString() !== highlightedVariable));
            setHighlightedVariable(null);
        }
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

    const handleReset = () => {
        setSelectedVariables([]);
        setTestDistribution("normal");
        setDegreesOfFreedom("");
        setEstimateFromData(true);
        setLocation("0");
        setScale("1");
        setNaturalLogTransform(false);
        setStandardizeValues(false);
        setUseDifference(false);
        setDifferenceValue("1");
        setUseSeasonalDifference(false);
        setSeasonalDifferenceValue("1");
        setCurrentPeriodicity("None");
        setProportionEstimation("blom");
        setRankAssigned("mean");
    };

    const handleConfirm = async () => {
        if (selectedVariables.length === 0) {
            alert("Please select at least one variable.");
            return;
        }

        try {
            // Logic for performing QQ plots analysis would go here

            // Create a log entry
            const logEntry = {
                log: `QQ Plots Analysis: ${new Date().toLocaleString()}`
            };

            const logId = await addLog(logEntry);

            // Create an analytic entry
            const analyticEntry = {
                title: "QQ Plots",
                note: `Analysis performed with ${selectedVariables.length} variables. Test distribution: ${testDistribution}.`
            };

            const analyticId = await addAnalytic(logId, analyticEntry);

            // Save results - implementation would depend on actual analysis

            // Close the modal
            closeModal();
        } catch (error) {
            console.error("Error performing QQ plots analysis:", error);
            alert("An error occurred while performing the analysis. Please try again.");
        }
    };

    return (
        <DialogContent className="max-w-[700px] p-0 bg-[#F0F0F0] border border-[#0000AA] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-4 py-2 border-b border-[#0000AA] flex-shrink-0 bg-[#DDDDFF]">
                <DialogTitle className="text-[16px] font-semibold flex items-center">
                    <div className="w-5 h-5 mr-2 bg-[#FF0000] border border-[#0000AA]"></div>
                    Q-Q Plots
                </DialogTitle>
            </DialogHeader>

            <div className="p-4 flex-grow">
                <div className="grid grid-cols-12 gap-4">
                    {/* Left panel - Available variables */}
                    <div className="col-span-4">
                        <div className="border border-[#0000AA] bg-white h-[400px] overflow-y-auto">
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

                    {/* Middle panel - Selected variables + Transform */}
                    <div className="col-span-4 flex flex-col">
                        {/* Variables panel */}
                        <div className="mb-4">
                            <div className="text-sm font-semibold mb-1 underline">Variables:</div>
                            <div className="flex items-start mb-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="p-0 w-8 h-8 mr-2 mt-8 bg-[#BBDEFB] border-[#0000AA] hover:bg-[#90CAF9]"
                                    onClick={transferToSelectedVariables}
                                    disabled={!highlightedVariable}
                                >
                                    <ChevronRight size={16} className="text-[#0000AA]" />
                                </Button>
                                <div className="border border-[#0000AA] bg-white h-[180px] flex-grow overflow-y-auto">
                                    {selectedVariables.map((variable) => (
                                        <div key={variable.columnIndex} className="flex items-center p-1">
                                            <div className="flex items-center w-full">
                                                {getVariableIcon(variable)}
                                                <span className="text-xs truncate">{getDisplayName(variable)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Transform panel */}
                        <div className="border border-[#0000AA] bg-[#F0F0F0] p-3 flex-grow">
                            <div className="text-sm font-semibold mb-3 underline">Transform</div>

                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <Checkbox
                                        id="naturalLog"
                                        checked={naturalLogTransform}
                                        onCheckedChange={(checked) => setNaturalLogTransform(!!checked)}
                                        className="mr-2 border-[#888888]"
                                    />
                                    <Label htmlFor="naturalLog" className="text-sm cursor-pointer underline">
                                        Natural log transform
                                    </Label>
                                </div>

                                <div className="flex items-center">
                                    <Checkbox
                                        id="standardize"
                                        checked={standardizeValues}
                                        onCheckedChange={(checked) => setStandardizeValues(!!checked)}
                                        className="mr-2 border-[#888888]"
                                    />
                                    <Label htmlFor="standardize" className="text-sm cursor-pointer underline">
                                        Standardize values
                                    </Label>
                                </div>

                                <div className="flex items-center">
                                    <Checkbox
                                        id="difference"
                                        checked={useDifference}
                                        onCheckedChange={(checked) => setUseDifference(!!checked)}
                                        className="mr-2 border-[#888888]"
                                    />
                                    <Label htmlFor="difference" className="text-sm cursor-pointer underline mr-2">
                                        Difference:
                                    </Label>
                                    <Input
                                        value={differenceValue}
                                        onChange={(e) => setDifferenceValue(e.target.value)}
                                        className="h-7 w-16 text-sm border-[#0000AA]"
                                        disabled={!useDifference}
                                    />
                                </div>

                                <div className="flex items-center">
                                    <Checkbox
                                        id="seasonalDifference"
                                        checked={useSeasonalDifference}
                                        onCheckedChange={(checked) => setUseSeasonalDifference(!!checked)}
                                        className="mr-2 border-[#888888]"
                                    />
                                    <Label htmlFor="seasonalDifference" className="text-sm cursor-pointer underline mr-2 text-gray-400">
                                        Seasonally difference:
                                    </Label>
                                    <Input
                                        value={seasonalDifferenceValue}
                                        onChange={(e) => setSeasonalDifferenceValue(e.target.value)}
                                        className="h-7 w-16 text-sm border-[#0000AA]"
                                        disabled={true}
                                    />
                                </div>

                                <div className="mt-3">
                                    <Label className="text-sm">
                                        Current Periodicity: {currentPeriodicity}
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right panel */}
                    <div className="col-span-4 flex flex-col space-y-4">
                        {/* Test Distribution panel */}
                        <div className="border border-[#0000AA] bg-[#F0F0F0] p-3">
                            <div className="text-sm font-semibold mb-3 underline text-[#0000AA]">Test Distribution</div>

                            <Select
                                value={testDistribution}
                                onValueChange={setTestDistribution}
                            >
                                <SelectTrigger className="h-8 border-[#0000AA] bg-[#DDDDFF]">
                                    <SelectValue placeholder="Select distribution" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="uniform">Uniform</SelectItem>
                                    <SelectItem value="exponential">Exponential</SelectItem>
                                    <SelectItem value="poisson">Poisson</SelectItem>
                                    <SelectItem value="lognormal">Lognormal</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center mt-3">
                                <Label htmlFor="df" className="text-sm mr-2 w-8 underline text-gray-400">
                                    df:
                                </Label>
                                <Input
                                    id="df"
                                    value={degreesOfFreedom}
                                    onChange={(e) => setDegreesOfFreedom(e.target.value)}
                                    className="h-7 text-sm border-[#0000AA]"
                                    disabled={true}
                                />
                            </div>
                        </div>

                        {/* Distribution Parameters panel */}
                        <div className="border border-[#0000AA] bg-[#F0F0F0] p-3">
                            <div className="text-sm font-semibold mb-3 underline text-[#0000AA]">Distribution Parameters</div>

                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <Checkbox
                                        id="estimateFromData"
                                        checked={estimateFromData}
                                        onCheckedChange={(checked) => setEstimateFromData(!!checked)}
                                        className="mr-2 border-[#888888]"
                                    />
                                    <Label htmlFor="estimateFromData" className="text-sm cursor-pointer underline">
                                        Estimate from data
                                    </Label>
                                </div>

                                <div className="flex items-center">
                                    <Label htmlFor="location" className="text-sm mr-2 w-16 underline text-gray-400">
                                        Location:
                                    </Label>
                                    <Input
                                        id="location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="h-7 text-sm border-[#0000AA]"
                                        disabled={estimateFromData}
                                    />
                                </div>

                                <div className="flex items-center">
                                    <Label htmlFor="scale" className="text-sm mr-2 w-16 underline text-gray-400">
                                        Scale:
                                    </Label>
                                    <Input
                                        id="scale"
                                        value={scale}
                                        onChange={(e) => setScale(e.target.value)}
                                        className="h-7 text-sm border-[#0000AA]"
                                        disabled={estimateFromData}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Proportion Estimation Formula panel */}
                        <div className="border border-[#0000AA] bg-[#F0F0F0] p-3">
                            <div className="text-sm font-semibold mb-3 underline text-[#0000AA]">Proportion Estimation Formula</div>

                            <RadioGroup
                                value={proportionEstimation}
                                onValueChange={setProportionEstimation}
                                className="space-y-1"
                            >
                                <div className="flex items-center">
                                    <RadioGroupItem
                                        value="blom"
                                        id="blom"
                                        className="mr-2 border-[#888888] data-[state=checked]:bg-[#0000AA] data-[state=checked]:border-[#0000AA]"
                                    />
                                    <Label htmlFor="blom" className="text-sm cursor-pointer underline">
                                        Blom&apos;s
                                    </Label>
                                </div>
                                <div className="flex items-center">
                                    <RadioGroupItem
                                        value="rankit"
                                        id="rankit"
                                        className="mr-2 border-[#888888] data-[state=checked]:bg-[#0000AA] data-[state=checked]:border-[#0000AA]"
                                    />
                                    <Label htmlFor="rankit" className="text-sm cursor-pointer underline">
                                        Rankit
                                    </Label>
                                </div>
                                <div className="flex items-center">
                                    <RadioGroupItem
                                        value="tukey"
                                        id="tukey"
                                        className="mr-2 border-[#888888] data-[state=checked]:bg-[#0000AA] data-[state=checked]:border-[#0000AA]"
                                    />
                                    <Label htmlFor="tukey" className="text-sm cursor-pointer underline">
                                        Tukey&apos;s
                                    </Label>
                                </div>
                                <div className="flex items-center">
                                    <RadioGroupItem
                                        value="vanderwaerden"
                                        id="vanderwaerden"
                                        className="mr-2 border-[#888888] data-[state=checked]:bg-[#0000AA] data-[state=checked]:border-[#0000AA]"
                                    />
                                    <Label htmlFor="vanderwaerden" className="text-sm cursor-pointer underline">
                                        Van der Waerden&apos;s
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Rank Assigned to Ties panel */}
                        <div className="border border-[#0000AA] bg-[#F0F0F0] p-3">
                            <div className="text-sm font-semibold mb-3 underline text-[#0000AA]">Rank Assigned to Ties</div>

                            <RadioGroup
                                value={rankAssigned}
                                onValueChange={setRankAssigned}
                                className="space-y-1"
                            >
                                <div className="flex items-center">
                                    <RadioGroupItem
                                        value="mean"
                                        id="mean"
                                        className="mr-2 border-[#888888] data-[state=checked]:bg-[#0000AA] data-[state=checked]:border-[#0000AA]"
                                    />
                                    <Label htmlFor="mean" className="text-sm cursor-pointer underline">
                                        Mean
                                    </Label>
                                </div>
                                <div className="flex items-center">
                                    <RadioGroupItem
                                        value="high"
                                        id="high"
                                        className="mr-2 border-[#888888] data-[state=checked]:bg-[#0000AA] data-[state=checked]:border-[#0000AA]"
                                    />
                                    <Label htmlFor="high" className="text-sm cursor-pointer underline">
                                        High
                                    </Label>
                                </div>
                                <div className="flex items-center">
                                    <RadioGroupItem
                                        value="low"
                                        id="low"
                                        className="mr-2 border-[#888888] data-[state=checked]:bg-[#0000AA] data-[state=checked]:border-[#0000AA]"
                                    />
                                    <Label htmlFor="low" className="text-sm cursor-pointer underline">
                                        Low
                                    </Label>
                                </div>
                                <div className="flex items-center">
                                    <RadioGroupItem
                                        value="break"
                                        id="break"
                                        className="mr-2 border-[#888888] data-[state=checked]:bg-[#0000AA] data-[state=checked]:border-[#0000AA]"
                                    />
                                    <Label htmlFor="break" className="text-sm cursor-pointer underline">
                                        Break ties arbitrarily
                                    </Label>
                                </div>
                            </RadioGroup>
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

export default Index;