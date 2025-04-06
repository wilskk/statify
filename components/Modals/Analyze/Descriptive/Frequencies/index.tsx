"use client";
import React, { useState, useEffect, FC } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import {
    CornerDownLeft,
    CornerDownRight,
    Ruler,
    Shapes,
    BarChartHorizontal,
    InfoIcon
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import type { Variable } from "@/types/Variable";

interface FrequenciesModalProps {
    onClose: () => void;
}

const Index: FC<FrequenciesModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState("variables");
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available' | 'selected'} | null>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Display options
    const [showFrequencyTables, setShowFrequencyTables] = useState(true);
    const [showCharts, setShowCharts] = useState(false);
    const [showStatistics, setShowStatistics] = useState(true);

    const variables = useVariableStore.getState().variables;
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    // Initialize available variables on component mount
    useEffect(() => {
        const validVars = variables.filter(v => v.name !== "");
        setAvailableVariables(validVars);
    }, [variables]);

    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-[#888888] mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
        }
    };

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    const handleVariableSelect = (variable: Variable, source: 'available' | 'selected') => {
        if (highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: variable.columnIndex.toString(), source });
        }
    };

    const handleVariableDoubleClick = (variable: Variable, source: 'available' | 'selected') => {
        if (source === 'available') {
            moveToSelectedVariables(variable);
        } else {
            moveToAvailableVariables(variable);
        }
    };

    const moveToSelectedVariables = (variable: Variable) => {
        setSelectedVariables(prev => [...prev, variable]);
        setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const moveToAvailableVariables = (variable: Variable) => {
        setAvailableVariables(prev => [...prev, variable]);
        setSelectedVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const handleMoveVariable = () => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'available') {
            const variable = availableVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
            if (variable) {
                moveToSelectedVariables(variable);
            }
        } else {
            const variable = selectedVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
            if (variable) {
                moveToAvailableVariables(variable);
            }
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
                                    onClick={() => handleVariableSelect(variable, source)}
                                    onDoubleClick={() => handleVariableDoubleClick(variable, source)}
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

    const handleAnalyze = async () => {
        if (!selectedVariables.length) {
            setErrorMsg("Please select at least one variable.");
            return;
        }
        setErrorMsg(null);
        setIsCalculating(true);

        try {
            // 1. Prepare variable data using useDataStore's getVariableData
            const variableDataPromises = [];
            for (const varDef of selectedVariables) {
                variableDataPromises.push(useDataStore.getState().getVariableData(varDef));
            }
            const variableData = await Promise.all(variableDataPromises);

            // 2. Create worker and set up handlers
            const worker = new Worker("/workers/Frequencies/index.js");

            // Set a timeout to prevent worker hanging
            const timeoutId = setTimeout(() => {
                worker.terminate();
                setErrorMsg("Analysis timed out. Please try again with fewer variables.");
                setIsCalculating(false);
            }, 60000); // 60 second timeout

            worker.onmessage = async (e) => {
                clearTimeout(timeoutId);
                const wData = e.data;

                if (wData.success) {
                    try {
                        // Save results to database
                        const variableNames = selectedVariables.map(v => v.name);
                        const logMsg = `FREQUENCIES VARIABLES=${variableNames.join(", ")}`;
                        const logId = await addLog({ log: logMsg });

                        const analyticId = await addAnalytic(logId, {
                            title: "Frequencies",
                            note: ""
                        });

                        if (wData.descriptive) {
                            await addStatistic(analyticId, {
                                title: "Statistics",
                                output_data: wData.descriptive,
                                components: "Descriptive Statistics",
                                description: ""
                            });
                        }

                        if (wData.frequencies) {
                            for (let i = 0; i < wData.frequencies.length; i++) {
                                await addStatistic(analyticId, {
                                    title: `${variableNames[i]}`,
                                    output_data: wData.frequencies[i],
                                    components: "Frequency Table",
                                    description: ""
                                });
                            }
                        }

                        setIsCalculating(false);
                        worker.terminate();
                        onClose();
                    } catch (err) {
                        console.error(err);
                        setErrorMsg("Error saving results.");
                        setIsCalculating(false);
                        worker.terminate();
                    }
                } else {
                    setErrorMsg(wData.error || "Worker returned an error.");
                    setIsCalculating(false);
                    worker.terminate();
                }
            };

            worker.onerror = (event) => {
                clearTimeout(timeoutId);
                console.error("Worker error:", event);
                setIsCalculating(false);
                setErrorMsg("Worker error occurred. Check console for details.");
                worker.terminate();
            };

            // 3. Send data to worker - using the new format with variableData
            worker.postMessage({
                action: "FULL_ANALYSIS",  // Get both descriptive and frequency results
                variableData: variableData
            });

        } catch (ex) {
            console.error(ex);
            setErrorMsg("Something went wrong.");
            setIsCalculating(false);
        }
    };

    return (
        <DialogContent className="max-w-[650px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Frequencies</DialogTitle>
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
                            value="charts"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'charts' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Charts
                        </TabsTrigger>
                        <TabsTrigger
                            value="format"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'format' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Format
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <div className="grid grid-cols-9 gap-6">
                        <div className="col-span-4">
                            <div className="text-sm mb-2 font-medium">Available Variables:</div>
                            {renderVariableList(availableVariables, 'available', '300px')}
                            <div className="text-xs mt-2 text-[#888888] flex items-center">
                                <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                                <span>Double-click to move variables between lists.</span>
                            </div>
                        </div>

                        <div className="col-span-1 flex flex-col items-center justify-center">
                            <Button
                                variant="outline"
                                size="sm"
                                className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                onClick={handleMoveVariable}
                                disabled={!highlightedVariable}
                            >
                                {highlightedVariable?.source === 'selected' ?
                                    <CornerDownLeft size={16} /> :
                                    <CornerDownRight size={16} />
                                }
                            </Button>
                        </div>

                        <div className="col-span-4">
                            <div className="text-sm mb-2 font-medium">Selected Variables:</div>
                            {renderVariableList(selectedVariables, 'selected', '300px')}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="statistics" className="p-6 overflow-y-auto flex-grow">
                    <div className="border border-[#E6E6E6] rounded-md p-6">
                        <div className="text-sm font-medium mb-4">Display</div>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Checkbox
                                    id="frequencyTables"
                                    checked={showFrequencyTables}
                                    onCheckedChange={(checked) => setShowFrequencyTables(!!checked)}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="frequencyTables" className="text-sm cursor-pointer">
                                    Frequency tables
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="showStatistics"
                                    checked={showStatistics}
                                    onCheckedChange={(checked) => setShowStatistics(!!checked)}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="showStatistics" className="text-sm cursor-pointer">
                                    Show statistics
                                </Label>
                            </div>
                        </div>
                    </div>

                    <div className="border border-[#E6E6E6] rounded-md p-6 mt-6">
                        <div className="text-sm font-medium mb-4">Statistics</div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center">
                                <Checkbox
                                    id="percentiles"
                                    className="mr-2 border-[#CCCCCC]"
                                    disabled={!showStatistics}
                                />
                                <Label htmlFor="percentiles" className="text-sm cursor-pointer">
                                    Percentiles
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="centralTendency"
                                    className="mr-2 border-[#CCCCCC]"
                                    checked={true}
                                    disabled={!showStatistics}
                                />
                                <Label htmlFor="centralTendency" className="text-sm cursor-pointer">
                                    Central Tendency
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="dispersion"
                                    className="mr-2 border-[#CCCCCC]"
                                    checked={true}
                                    disabled={!showStatistics}
                                />
                                <Label htmlFor="dispersion" className="text-sm cursor-pointer">
                                    Dispersion
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="distribution"
                                    className="mr-2 border-[#CCCCCC]"
                                    checked={true}
                                    disabled={!showStatistics}
                                />
                                <Label htmlFor="distribution" className="text-sm cursor-pointer">
                                    Distribution
                                </Label>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="charts" className="p-6 overflow-y-auto flex-grow">
                    <div className="border border-[#E6E6E6] rounded-md p-6">
                        <div className="text-sm font-medium mb-4">Display</div>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Checkbox
                                    id="showCharts"
                                    checked={showCharts}
                                    onCheckedChange={(checked) => setShowCharts(!!checked)}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="showCharts" className="text-sm cursor-pointer">
                                    Display charts
                                </Label>
                            </div>
                        </div>
                    </div>

                    <div className="border border-[#E6E6E6] rounded-md p-6 mt-6">
                        <div className="text-sm font-medium mb-4">Chart Type</div>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Checkbox
                                    id="barCharts"
                                    className="mr-2 border-[#CCCCCC]"
                                    checked={true}
                                    disabled={!showCharts}
                                />
                                <Label htmlFor="barCharts" className="text-sm cursor-pointer">
                                    Bar charts
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="pieCharts"
                                    className="mr-2 border-[#CCCCCC]"
                                    disabled={!showCharts}
                                />
                                <Label htmlFor="pieCharts" className="text-sm cursor-pointer">
                                    Pie charts
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="histograms"
                                    className="mr-2 border-[#CCCCCC]"
                                    disabled={!showCharts}
                                />
                                <Label htmlFor="histograms" className="text-sm cursor-pointer">
                                    Histograms (numeric variables only)
                                </Label>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="format" className="p-6 overflow-y-auto flex-grow">
                    <div className="border border-[#E6E6E6] rounded-md p-6">
                        <div className="text-sm font-medium mb-4">Order</div>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Checkbox
                                    id="ascendingValues"
                                    className="mr-2 border-[#CCCCCC]"
                                    checked={true}
                                />
                                <Label htmlFor="ascendingValues" className="text-sm cursor-pointer">
                                    Ascending values
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="descendingValues"
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="descendingValues" className="text-sm cursor-pointer">
                                    Descending values
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="ascendingCounts"
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="ascendingCounts" className="text-sm cursor-pointer">
                                    Ascending counts
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="descendingCounts"
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="descendingCounts" className="text-sm cursor-pointer">
                                    Descending counts
                                </Label>
                            </div>
                        </div>
                    </div>

                    <div className="border border-[#E6E6E6] rounded-md p-6 mt-6">
                        <div className="text-sm font-medium mb-4">Multiple Variables</div>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Checkbox
                                    id="compareVariables"
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="compareVariables" className="text-sm cursor-pointer">
                                    Compare variables (side-by-side tables)
                                </Label>
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    id="suppressTables"
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="suppressTables" className="text-sm cursor-pointer">
                                    Suppress tables with more than 100 distinct values
                                </Label>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {errorMsg && <div className="px-6 py-2 text-red-600">{errorMsg}</div>}

            <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                        onClick={handleAnalyze}
                        disabled={isCalculating}
                    >
                        {isCalculating ? "Calculating..." : "OK"}
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        disabled={isCalculating}
                    >
                        Paste
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        disabled={isCalculating}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        onClick={onClose}
                        disabled={isCalculating}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        disabled={isCalculating}
                    >
                        Help
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
};

export default Index;