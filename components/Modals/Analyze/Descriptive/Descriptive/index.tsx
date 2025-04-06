"use client";

import React, { FC, useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
    CornerDownRight,
    CornerDownLeft,
    InfoIcon
} from "lucide-react";

interface DescriptivesProps {
    onClose: () => void;
}

const Descriptives: FC<DescriptivesProps> = ({ onClose }) => {
    const { closeModal } = useModalStore();
    const { variables } = useVariableStore();
    const { data } = useDataStore();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    const [storeVariables, setStoreVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available' | 'selected'} | null>(null);

    // Tab state
    const [activeTab, setActiveTab] = useState("variables");

    // Options settings
    const [saveStandardized, setSaveStandardized] = useState(false);
    const [displayStatistics, setDisplayStatistics] = useState({
        mean: true,
        stdDev: true,
        minimum: true,
        maximum: true,
        variance: false,
        range: false,
        sum: false,
        median: false,
        skewness: false,
        kurtosis: false,
        standardError: false
    });

    // Display settings
    const [displayOrder, setDisplayOrder] = useState("analysis");
    const [variableListFormat, setVariableListFormat] = useState("name");

    // Bootstrap settings
    const [useBootstrap, setUseBootstrap] = useState(false);
    const [bootstrapSamples, setBootstrapSamples] = useState("1000");
    const [confidenceLevel, setConfidenceLevel] = useState("95");

    useEffect(() => {
        setStoreVariables(variables.filter(v => v.name !== ""));
    }, [variables]);

    const handleVariableSelect = (columnIndex: number, source: 'available' | 'selected') => {
        if (highlightedVariable?.id === columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: columnIndex.toString(), source });
        }
    };

    const handleVariableDoubleClick = (columnIndex: number, source: 'available' | 'selected') => {
        if (source === "available") {
            const variable = storeVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveToSelectedVariables(variable);
            }
        } else if (source === "selected") {
            const variable = selectedVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveFromSelectedVariables(variable);
            }
        }
    };

    const moveToSelectedVariables = (variable: Variable) => {
        setSelectedVariables(prev => [...prev, variable]);
        setStoreVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const moveFromSelectedVariables = (variable: Variable) => {
        setStoreVariables(prev => [...prev, variable]);
        setSelectedVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const handleTransferClick = () => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === "available") {
            const columnIndex = parseInt(highlightedVariable.id);
            const variable = storeVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveToSelectedVariables(variable);
            }
        } else if (highlightedVariable.source === "selected") {
            const columnIndex = parseInt(highlightedVariable.id);
            const variable = selectedVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveFromSelectedVariables(variable);
            }
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

    const handleConfirm = async () => {
        if (selectedVariables.length === 0) {
            alert("Please select at least one variable.");
            return;
        }

        try {
            // Logic for performing descriptive analysis would go here

            // Create a log entry
            const logEntry = {
                log: `Descriptives Analysis: ${new Date().toLocaleString()}`
            };

            const logId = await addLog(logEntry);

            // Create an analytic entry
            const analyticEntry = {
                title: "Descriptives",
                note: `Analysis performed with ${selectedVariables.length} variables.`
            };

            const analyticId = await addAnalytic(logId, analyticEntry);

            // Save results - implementation would depend on actual analysis

            // Close the modal
            closeModal();
        } catch (error) {
            console.error("Error performing descriptives analysis:", error);
            alert("An error occurred while performing the analysis. Please try again.");
        }
    };

    const renderVariableList = (variables: Variable[], source: 'available' | 'selected', height: string) => (
        <div className="border border-[#E6E6E6] p-2 rounded-md overflow-y-auto overflow-x-hidden" style={{ height }}>
            <div className="space-y-1">
                {variables.map((variable) => (
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
                ))}
            </div>
        </div>
    );

    return (
        <DialogContent className="max-w-[600px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Descriptives</DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-[#E6E6E6] flex-shrink-0">
                    <TabsList className="bg-[#F7F7F7] rounded-none h-9 p-0">
                        <TabsTrigger
                            value="variables"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'variables' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Variables
                        </TabsTrigger>
                        <TabsTrigger
                            value="statistics"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'statistics' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Statistics
                        </TabsTrigger>
                        <TabsTrigger
                            value="display"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'display' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Display
                        </TabsTrigger>
                        <TabsTrigger
                            value="bootstrap"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'bootstrap' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Bootstrap
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <div className="grid grid-cols-8 gap-6">
                        <div className="col-span-3">
                            <div className="text-sm mb-2 font-medium">Variables:</div>
                            {renderVariableList(storeVariables, 'available', '250px')}
                            <div className="text-xs mt-2 text-[#888888] flex items-center">
                                <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                                <span>Double-click to move variables between lists</span>
                            </div>
                        </div>

                        <div className="col-span-1 flex flex-col items-center justify-center">
                            <Button
                                variant="outline"
                                size="sm"
                                className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                onClick={handleTransferClick}
                                disabled={!highlightedVariable}
                            >
                                {highlightedVariable?.source === 'selected' ?
                                    <CornerDownLeft size={16} /> :
                                    <CornerDownRight size={16} />
                                }
                            </Button>
                        </div>

                        <div className="col-span-4">
                            <div className="text-sm mb-2 font-medium">Variable(s):</div>
                            {renderVariableList(selectedVariables, 'selected', '250px')}

                            <div className="mt-6">
                                <div className="flex items-center">
                                    <Checkbox
                                        id="saveStandardized"
                                        checked={saveStandardized}
                                        onCheckedChange={(checked) => setSaveStandardized(!!checked)}
                                        className="mr-2 border-[#CCCCCC]"
                                    />
                                    <Label htmlFor="saveStandardized" className="text-sm cursor-pointer">
                                        Save standardized values as variables
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="statistics" className="p-6 overflow-y-auto flex-grow">
                    <div className="border border-[#E6E6E6] rounded-md p-6">
                        <div className="text-sm font-medium mb-4">Descriptive Statistics</div>

                        <div className="grid grid-cols-2 gap-y-3">
                            <div className="flex items-center">
                                <Checkbox
                                    id="mean"
                                    checked={displayStatistics.mean}
                                    onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, mean: !!checked})}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="mean" className="text-sm cursor-pointer">
                                    Mean
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="variance"
                                    checked={displayStatistics.variance}
                                    onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, variance: !!checked})}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="variance" className="text-sm cursor-pointer">
                                    Variance
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="stdDev"
                                    checked={displayStatistics.stdDev}
                                    onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, stdDev: !!checked})}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="stdDev" className="text-sm cursor-pointer">
                                    Standard deviation
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="range"
                                    checked={displayStatistics.range}
                                    onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, range: !!checked})}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="range" className="text-sm cursor-pointer">
                                    Range
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="minimum"
                                    checked={displayStatistics.minimum}
                                    onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, minimum: !!checked})}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="minimum" className="text-sm cursor-pointer">
                                    Minimum
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="sum"
                                    checked={displayStatistics.sum}
                                    onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, sum: !!checked})}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="sum" className="text-sm cursor-pointer">
                                    Sum
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="maximum"
                                    checked={displayStatistics.maximum}
                                    onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, maximum: !!checked})}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="maximum" className="text-sm cursor-pointer">
                                    Maximum
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="median"
                                    checked={displayStatistics.median}
                                    onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, median: !!checked})}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="median" className="text-sm cursor-pointer">
                                    Median
                                </Label>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-[#E6E6E6] pt-4">
                            <div className="text-sm font-medium mb-3">Distribution</div>

                            <div className="grid grid-cols-2 gap-y-3">
                                <div className="flex items-center">
                                    <Checkbox
                                        id="skewness"
                                        checked={displayStatistics.skewness}
                                        onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, skewness: !!checked})}
                                        className="mr-2 border-[#CCCCCC]"
                                    />
                                    <Label htmlFor="skewness" className="text-sm cursor-pointer">
                                        Skewness
                                    </Label>
                                </div>

                                <div className="flex items-center">
                                    <Checkbox
                                        id="kurtosis"
                                        checked={displayStatistics.kurtosis}
                                        onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, kurtosis: !!checked})}
                                        className="mr-2 border-[#CCCCCC]"
                                    />
                                    <Label htmlFor="kurtosis" className="text-sm cursor-pointer">
                                        Kurtosis
                                    </Label>
                                </div>

                                <div className="flex items-center">
                                    <Checkbox
                                        id="standardError"
                                        checked={displayStatistics.standardError}
                                        onCheckedChange={(checked) => setDisplayStatistics({...displayStatistics, standardError: !!checked})}
                                        className="mr-2 border-[#CCCCCC]"
                                    />
                                    <Label htmlFor="standardError" className="text-sm cursor-pointer">
                                        Standard error of mean
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="display" className="p-6 overflow-y-auto flex-grow">
                    <div className="border border-[#E6E6E6] rounded-md p-6 mb-6">
                        <div className="text-sm font-medium mb-4">Display Order</div>

                        <div className="space-y-3">
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="analysisOrder"
                                    checked={displayOrder === "analysis"}
                                    onChange={() => setDisplayOrder("analysis")}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="analysisOrder" className="text-sm cursor-pointer">
                                    Variable list order
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="alphabeticalOrder"
                                    checked={displayOrder === "alphabetical"}
                                    onChange={() => setDisplayOrder("alphabetical")}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="alphabeticalOrder" className="text-sm cursor-pointer">
                                    Alphabetical
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="ascendingMeans"
                                    checked={displayOrder === "ascendingMeans"}
                                    onChange={() => setDisplayOrder("ascendingMeans")}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="ascendingMeans" className="text-sm cursor-pointer">
                                    Ascending means
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="descendingMeans"
                                    checked={displayOrder === "descendingMeans"}
                                    onChange={() => setDisplayOrder("descendingMeans")}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="descendingMeans" className="text-sm cursor-pointer">
                                    Descending means
                                </Label>
                            </div>
                        </div>
                    </div>

                    <div className="border border-[#E6E6E6] rounded-md p-6">
                        <div className="text-sm font-medium mb-4">Variable List Format</div>

                        <div className="space-y-3">
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="nameFormat"
                                    checked={variableListFormat === "name"}
                                    onChange={() => setVariableListFormat("name")}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="nameFormat" className="text-sm cursor-pointer">
                                    Variable names
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="labelFormat"
                                    checked={variableListFormat === "label"}
                                    onChange={() => setVariableListFormat("label")}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="labelFormat" className="text-sm cursor-pointer">
                                    Variable labels
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="bothFormat"
                                    checked={variableListFormat === "both"}
                                    onChange={() => setVariableListFormat("both")}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="bothFormat" className="text-sm cursor-pointer">
                                    Both names and labels
                                </Label>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="bootstrap" className="p-6 overflow-y-auto flex-grow">
                    <div className="border border-[#E6E6E6] rounded-md p-6">
                        <div className="flex items-center mb-4">
                            <Checkbox
                                id="useBootstrap"
                                checked={useBootstrap}
                                onCheckedChange={(checked) => setUseBootstrap(!!checked)}
                                className="mr-2 border-[#CCCCCC]"
                            />
                            <Label htmlFor="useBootstrap" className="text-sm font-medium cursor-pointer">
                                Perform bootstrapping
                            </Label>
                        </div>

                        <div className="ml-6 space-y-4">
                            <div className="flex items-center">
                                <Label htmlFor="bootstrapSamples" className="text-sm w-32">
                                    Number of samples:
                                </Label>
                                <Input
                                    id="bootstrapSamples"
                                    value={bootstrapSamples}
                                    onChange={(e) => setBootstrapSamples(e.target.value)}
                                    className="h-8 text-sm w-24 border-[#CCCCCC] focus:border-black focus:ring-black"
                                    disabled={!useBootstrap}
                                />
                            </div>

                            <div className="flex items-center">
                                <Label htmlFor="confidenceLevel" className="text-sm w-32">
                                    Confidence level (%):
                                </Label>
                                <Input
                                    id="confidenceLevel"
                                    value={confidenceLevel}
                                    onChange={(e) => setConfidenceLevel(e.target.value)}
                                    className="h-8 text-sm w-24 border-[#CCCCCC] focus:border-black focus:ring-black"
                                    disabled={!useBootstrap}
                                />
                            </div>

                            <div className="text-xs text-[#888888] pt-2">
                                Bootstrapping provides more robust estimates by resampling with replacement from the
                                observed data. This method produces confidence intervals for statistical estimates.
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                        onClick={handleConfirm}
                    >
                        OK
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
    );
};

export default Descriptives;