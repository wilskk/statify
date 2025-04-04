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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
    InfoIcon,
    AlertCircle
} from "lucide-react";

interface DuplicateCasesProps {
    onClose: () => void;
}

const DuplicateCases: FC<DuplicateCasesProps> = ({ onClose }) => {
    const { closeModal } = useModalStore();
    const { variables, updateVariable, addVariable } = useVariableStore();
    const { data, updateBulkCells, setDataAndSync } = useDataStore();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    // State for variables
    const [sourceVariables, setSourceVariables] = useState<Variable[]>([]);
    const [matchingVariables, setMatchingVariables] = useState<Variable[]>([]);
    const [sortingVariables, setSortingVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'source' | 'matching' | 'sorting'} | null>(null);

    // State for tabs
    const [activeTab, setActiveTab] = useState("variables");

    // Options state
    const [sortOrder, setSortOrder] = useState<"ascending" | "descending">("ascending");
    const [primaryCaseIndicator, setPrimaryCaseIndicator] = useState<"last" | "first">("last");
    const [primaryName, setPrimaryName] = useState<string>("PrimaryLast");
    const [filterByIndicator, setFilterByIndicator] = useState<boolean>(false);
    const [sequentialCount, setSequentialCount] = useState<boolean>(false);
    const [sequentialName, setSequentialName] = useState<string>("MatchSequence");
    const [moveMatchingToTop, setMoveMatchingToTop] = useState<boolean>(true);
    const [displayFrequencies, setDisplayFrequencies] = useState<boolean>(true);

    // Error handling
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    // Update available variables when store variables are loaded
    useEffect(() => {
        setSourceVariables(variables.filter(v => v.name !== ""));
    }, [variables]);

    // Process duplicates with worker
    const processWithWorker = async () => {
        return new Promise((resolve, reject) => {
            try {
                const worker = new Worker('/workers/duplicateCases.worker.js');

                worker.onmessage = async (e) => {
                    if (e.data.success) {
                        resolve(e.data);
                    } else {
                        reject(new Error(e.data.error || 'Worker processing failed'));
                    }
                    worker.terminate();
                };

                worker.onerror = (error) => {
                    reject(new Error(error.message || 'Worker error'));
                    worker.terminate();
                };

                worker.postMessage({
                    data,
                    matchingVariables,
                    sortingVariables,
                    sortOrder,
                    primaryCaseIndicator,
                    primaryName,
                    sequentialCount,
                    sequentialName,
                    moveMatchingToTop,
                    displayFrequencies
                });
            } catch (error) {
                reject(error);
            }
        });
    };

    // Create indicator variables
    const createIndicatorVariables = async (result: any) => {
        // Create primary indicator variable
        const primaryVarIndex = data[0]?.length || 0;
        await addVariable({
            columnIndex: primaryVarIndex,
            name: primaryName,
            type: "NUMERIC",
            width: 1,
            decimals: 0,
            label: `Primary case indicator (1=primary, 0=duplicate)`,
            values: [
                { variableName: primaryName, value: 0, label: "Duplicate case" },
                { variableName: primaryName, value: 1, label: "Primary case" }
            ],
            missing: [],
            columns: 8,
            align: "right",
            measure: "nominal",
            role: "input"
        });

        // Add values to data
        const primaryUpdates = result.primaryValues.map((value: number, rowIdx: number) => ({
            row: rowIdx,
            col: primaryVarIndex,
            value
        }));
        await updateBulkCells(primaryUpdates);

        // Create sequential variable if requested
        if (sequentialCount) {
            const sequenceVarIndex = primaryVarIndex + 1;
            await addVariable({
                columnIndex: sequenceVarIndex,
                name: sequentialName,
                type: "NUMERIC",
                width: 2,
                decimals: 0,
                label: `Sequential count of matching cases`,
                values: [],
                missing: [],
                columns: 8,
                align: "right",
                measure: "ordinal",
                role: "input"
            });

            // Add values to data
            const sequenceUpdates = result.sequenceValues.map((value: number, rowIdx: number) => ({
                row: rowIdx,
                col: sequenceVarIndex,
                value
            }));
            await updateBulkCells(sequenceUpdates);
        }
    };

    // Create log entries and analytics
    const createOutputLog = async (statistics: any[]) => {
        // Create log entry
        const logId = await addLog({
            log: `Identify Duplicate Cases: ${matchingVariables.map(v => v.name).join(', ')}`,
        });

        // Create analytic
        const analyticId = await addAnalytic(logId, {
            title: "Identify Duplicate Cases",
            note: `Matching variables: ${matchingVariables.map(v => v.name).join(', ')}. 
                ${sortingVariables.length > 0 ? `Sorting variables: ${sortingVariables.map(v => v.name).join(', ')} (${sortOrder}).` : ''} 
                Primary case: ${primaryCaseIndicator}. ${sequentialCount ? 'Sequential numbering created.' : ''}`,
        });

        // Add all statistics
        for (const stat of statistics) {
            await addStatistic(analyticId, {
                title: stat.title,
                output_data: stat.output_data,
                components: stat.component,
                description: stat.description
            });
        }
    };

    // Handle variable selection
    const handleVariableSelect = (columnIndex: number, source: 'source' | 'matching' | 'sorting') => {
        if (highlightedVariable?.id === columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: columnIndex.toString(), source });
        }
    };

    // Handle variable double click
    const handleVariableDoubleClick = (columnIndex: number, source: 'source' | 'matching' | 'sorting') => {
        if (source === 'source') {
            const variable = sourceVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                setMatchingVariables(prev => [...prev, variable]);
                setSourceVariables(prev => prev.filter(v => v.columnIndex !== columnIndex));
            }
        } else if (source === 'matching') {
            const variable = matchingVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                setSourceVariables(prev => [...prev, variable]);
                setMatchingVariables(prev => prev.filter(v => v.columnIndex !== columnIndex));
            }
        } else if (source === 'sorting') {
            const variable = sortingVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                setSourceVariables(prev => [...prev, variable]);
                setSortingVariables(prev => prev.filter(v => v.columnIndex !== columnIndex));
            }
        }
    };

    // Handle transfer to matching variables
    const handleTransferToMatching = () => {
        if (!highlightedVariable || highlightedVariable.source !== 'source') return;

        const sourceId = parseInt(highlightedVariable.id);
        const variable = sourceVariables.find(v => v.columnIndex === sourceId);
        if (variable) {
            setMatchingVariables(prev => [...prev, variable]);
            setSourceVariables(prev => prev.filter(v => v.columnIndex !== sourceId));
            setHighlightedVariable(null);
        }
    };

    // Handle move from matching variables
    const handleMoveFromMatching = () => {
        if (!highlightedVariable || highlightedVariable.source !== 'matching') return;

        const sourceId = parseInt(highlightedVariable.id);
        const variable = matchingVariables.find(v => v.columnIndex === sourceId);
        if (variable) {
            setSourceVariables(prev => [...prev, variable]);
            setMatchingVariables(prev => prev.filter(v => v.columnIndex !== sourceId));
            setHighlightedVariable(null);
        }
    };

    // Handle transfer to sorting variables
    const handleTransferToSorting = () => {
        if (!highlightedVariable || highlightedVariable.source !== 'source') return;

        const sourceId = parseInt(highlightedVariable.id);
        const variable = sourceVariables.find(v => v.columnIndex === sourceId);
        if (variable) {
            setSortingVariables(prev => [...prev, variable]);
            setSourceVariables(prev => prev.filter(v => v.columnIndex !== sourceId));
            setHighlightedVariable(null);
        }
    };

    // Handle move from sorting variables
    const handleMoveFromSorting = () => {
        if (!highlightedVariable || highlightedVariable.source !== 'sorting') return;

        const sourceId = parseInt(highlightedVariable.id);
        const variable = sortingVariables.find(v => v.columnIndex === sourceId);
        if (variable) {
            setSourceVariables(prev => [...prev, variable]);
            setSortingVariables(prev => prev.filter(v => v.columnIndex !== sourceId));
            setHighlightedVariable(null);
        }
    };

    // Handle reset
    const handleReset = () => {
        setSourceVariables(variables || []);
        setMatchingVariables([]);
        setSortingVariables([]);
        setHighlightedVariable(null);
        setSortOrder("ascending");
        setPrimaryCaseIndicator("last");
        setPrimaryName("PrimaryLast");
        setFilterByIndicator(false);
        setSequentialCount(false);
        setSequentialName("MatchSequence");
        setMoveMatchingToTop(true);
        setDisplayFrequencies(true);
    };

    // Handle confirm
    const handleConfirm = async () => {
        if (matchingVariables.length === 0) {
            setErrorMessage("No matching variables have been selected.");
            setErrorDialogOpen(true);
            return;
        }

        setIsProcessing(true);

        try {
            // Process duplicates with worker
            const workerResult: any = await processWithWorker();
            const { result, statistics } = workerResult;

            // Update data if reordering was requested
            if (moveMatchingToTop) {
                await setDataAndSync(result.reorderedData);
            }

            // Create indicator variables
            await createIndicatorVariables(result);

            // Create log and analytics if requested
            if (displayFrequencies) {
                await createOutputLog(statistics);
            }

            // Close the modal
            handleClose();
        } catch (error) {
            console.error("Error processing duplicates:", error);
            setErrorMessage("An error occurred while processing duplicates.");
            setErrorDialogOpen(true);
            setIsProcessing(false);
        }
    };

    // Handle close
    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            closeModal();
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

    // Render variable list
    const renderVariableList = (variables: Variable[], source: 'source' | 'matching' | 'sorting', height: string) => (
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
                    <DialogTitle className="text-[22px] font-semibold">Identify Duplicate Cases</DialogTitle>
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
                                value="options"
                                className={`px-4 h-8 rounded-none text-sm ${activeTab === 'options' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                            >
                                Options
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Variables Tab Content */}
                    <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                        <div className="grid grid-cols-8 gap-6">
                            {/* Left Column - Source Variables */}
                            <div className="col-span-3">
                                <div className="text-sm mb-2 font-medium">Source Variables:</div>
                                {renderVariableList(sourceVariables, 'source', '300px')}
                                <div className="text-xs mt-2 text-[#888888] flex items-center">
                                    <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                                    <span>Double-click variables to move them between lists</span>
                                </div>
                            </div>

                            {/* Middle Column - Transfer Buttons */}
                            <div className="col-span-1 flex flex-col items-center justify-center">
                                <div className="flex flex-col space-y-32">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                        onClick={highlightedVariable?.source === 'matching' ? handleMoveFromMatching : handleTransferToMatching}
                                        disabled={!highlightedVariable || (highlightedVariable.source !== 'source' && highlightedVariable.source !== 'matching')}
                                    >
                                        {highlightedVariable?.source === 'matching' ?
                                            <CornerDownLeft size={16} /> :
                                            <CornerDownRight size={16} />
                                        }
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                        onClick={highlightedVariable?.source === 'sorting' ? handleMoveFromSorting : handleTransferToSorting}
                                        disabled={!highlightedVariable || (highlightedVariable.source !== 'source' && highlightedVariable.source !== 'sorting')}
                                    >
                                        {highlightedVariable?.source === 'sorting' ?
                                            <CornerDownLeft size={16} /> :
                                            <CornerDownRight size={16} />
                                        }
                                    </Button>
                                </div>
                            </div>

                            {/* Right Column - Matching/Sorting Variables */}
                            <div className="col-span-4 space-y-6">
                                <div>
                                    <div className="text-sm mb-2 font-medium">Define matching cases by:</div>
                                    {renderVariableList(matchingVariables, 'matching', '150px')}
                                </div>

                                <div>
                                    <div className="text-sm mb-2 font-medium">Sort within matching groups by:</div>
                                    {renderVariableList(sortingVariables, 'sorting', '60px')}
                                    <div className="flex items-center mt-2">
                                        <div className="ml-auto flex items-center space-x-4">
                                            <div className="flex items-center">
                                                <Checkbox
                                                    id="ascending"
                                                    checked={sortOrder === "ascending"}
                                                    onCheckedChange={() => setSortOrder("ascending")}
                                                    className="mr-2 border-[#CCCCCC]"
                                                />
                                                <Label htmlFor="ascending" className="text-xs cursor-pointer">
                                                    Ascending
                                                </Label>
                                            </div>
                                            <div className="flex items-center">
                                                <Checkbox
                                                    id="descending"
                                                    checked={sortOrder === "descending"}
                                                    onCheckedChange={() => setSortOrder("descending")}
                                                    className="mr-2 border-[#CCCCCC]"
                                                />
                                                <Label htmlFor="descending" className="text-xs cursor-pointer">
                                                    Descending
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Options Tab Content */}
                    <TabsContent value="options" className="p-6 overflow-y-auto flex-grow">
                        <div className="border border-[#E6E6E6] rounded-md p-6 mb-6">
                            <div className="text-sm font-medium mb-4">Variables to Create</div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <div className="flex items-center">
                                            <Checkbox
                                                id="primaryIndicator"
                                                checked={true}
                                                className="mr-2 border-[#CCCCCC]"
                                                disabled={true}
                                            />
                                            <Label htmlFor="primaryIndicator" className="text-sm font-medium cursor-pointer">
                                                Indicator of primary cases (1=unique or primary, 0=duplicate)
                                            </Label>
                                        </div>
                                        <p className="text-xs mt-2 ml-6 text-[#888888]">
                                            Creates a variable that identifies primary cases (1) and duplicate cases (0)
                                        </p>
                                    </div>

                                    <div className="flex items-center">
                                        <Label htmlFor="primaryName" className="text-xs whitespace-nowrap mr-2">
                                            Name:
                                        </Label>
                                        <Input
                                            id="primaryName"
                                            value={primaryName}
                                            onChange={(e) => setPrimaryName(e.target.value)}
                                            className="h-8 text-sm border-[#CCCCCC] focus:border-black focus:ring-black"
                                        />
                                    </div>
                                </div>

                                <div className="ml-6 space-y-2">
                                    <div className="flex items-center">
                                        <Checkbox
                                            id="last"
                                            checked={primaryCaseIndicator === "last"}
                                            onCheckedChange={() => setPrimaryCaseIndicator("last")}
                                            className="mr-2 border-[#CCCCCC]"
                                        />
                                        <Label htmlFor="last" className="text-sm cursor-pointer">
                                            Last case in each group is primary
                                        </Label>
                                    </div>
                                    <div className="flex items-center">
                                        <Checkbox
                                            id="first"
                                            checked={primaryCaseIndicator === "first"}
                                            onCheckedChange={() => setPrimaryCaseIndicator("first")}
                                            className="mr-2 border-[#CCCCCC]"
                                        />
                                        <Label htmlFor="first" className="text-sm cursor-pointer">
                                            First case in each group is primary
                                        </Label>
                                    </div>
                                    <div className="flex items-center">
                                        <Checkbox
                                            id="filterIndicator"
                                            checked={filterByIndicator}
                                            onCheckedChange={(checked) => setFilterByIndicator(!!checked)}
                                            className="mr-2 border-[#CCCCCC]"
                                        />
                                        <Label htmlFor="filterIndicator" className="text-sm cursor-pointer">
                                            Filter by indicator values
                                        </Label>
                                    </div>
                                </div>

                                <Separator className="my-4 border-[#E6E6E6]" />

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <div className="flex items-center">
                                            <Checkbox
                                                id="sequentialCount"
                                                checked={sequentialCount}
                                                onCheckedChange={(checked) => setSequentialCount(!!checked)}
                                                className="mr-2 border-[#CCCCCC]"
                                            />
                                            <Label htmlFor="sequentialCount" className="text-sm font-medium cursor-pointer">
                                                Sequential count of matching case in each group (0=nonmatching case)
                                            </Label>
                                        </div>
                                        <p className="text-xs mt-2 ml-6 text-[#888888]">
                                            Sequential count of matching cases in each group (0=nonmatching case)
                                        </p>
                                    </div>

                                    <div className="flex items-center">
                                        <Label htmlFor="sequentialName" className="text-xs whitespace-nowrap mr-2">
                                            Name:
                                        </Label>
                                        <Input
                                            id="sequentialName"
                                            value={sequentialName}
                                            onChange={(e) => setSequentialName(e.target.value)}
                                            className="h-8 text-sm border-[#CCCCCC] focus:border-black focus:ring-black"
                                            disabled={!sequentialCount}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border border-[#E6E6E6] rounded-md p-6">
                            <div className="text-sm font-medium mb-4">Additional Options</div>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <Checkbox
                                        id="moveToTop"
                                        checked={moveMatchingToTop}
                                        onCheckedChange={(checked) => setMoveMatchingToTop(!!checked)}
                                        className="mr-2 border-[#CCCCCC]"
                                    />
                                    <Label htmlFor="moveToTop" className="text-sm cursor-pointer">
                                        Move matching cases to the top of the file
                                    </Label>
                                </div>
                                <div className="flex items-center">
                                    <Checkbox
                                        id="displayFrequencies"
                                        checked={displayFrequencies}
                                        onCheckedChange={(checked) => setDisplayFrequencies(!!checked)}
                                        className="mr-2 border-[#CCCCCC]"
                                    />
                                    <Label htmlFor="displayFrequencies" className="text-sm cursor-pointer">
                                        Display frequencies for created variables
                                    </Label>
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
                            disabled={isProcessing}
                        >
                            {isProcessing ? "Processing..." : "OK"}
                        </Button>
                        <Button
                            variant="outline"
                            className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                            onClick={handleReset}
                            disabled={isProcessing}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="outline"
                            className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                            onClick={handleClose}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                            disabled={isProcessing}
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
                        <DialogTitle className="text-[18px] font-semibold">IBM SPSS Statistics</DialogTitle>
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

export default DuplicateCases;