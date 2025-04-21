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
import { useModalStore } from "@/stores/useModalStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { Variable } from "@/types/Variable";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    AlertCircle
} from "lucide-react";
import VariableTab from "./VariableTab";
import OptionsTab from "./OptionsTab";

interface DuplicateCasesProps {
    onClose: () => void;
}

const DuplicateCases: FC<DuplicateCasesProps> = ({ onClose }) => {
    const { closeModal } = useModalStore();
    const { variables, addVariable } = useVariableStore();
    const { data, updateBulkCells, setDataAndSync } = useDataStore();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    const [sourceVariables, setSourceVariables] = useState<Variable[]>([]);
    const [matchingVariables, setMatchingVariables] = useState<Variable[]>([]);
    const [sortingVariables, setSortingVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'source' | 'matching' | 'sorting'} | null>(null);

    const [activeTab, setActiveTab] = useState("variables");

    const [sortOrder, setSortOrder] = useState<"ascending" | "descending">("ascending");
    const [primaryCaseIndicator, setPrimaryCaseIndicator] = useState<"last" | "first">("last");
    const [primaryName, setPrimaryName] = useState<string>("PrimaryLast");
    const [filterByIndicator, setFilterByIndicator] = useState<boolean>(false);
    const [sequentialCount, setSequentialCount] = useState<boolean>(false);
    const [sequentialName, setSequentialName] = useState<string>("MatchSequence");
    const [moveMatchingToTop, setMoveMatchingToTop] = useState<boolean>(true);
    const [displayFrequencies, setDisplayFrequencies] = useState<boolean>(true);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    useEffect(() => {
        setSourceVariables(variables.filter(v => v.name !== ""));
    }, [variables]);

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

    const createIndicatorVariables = async (result: any) => {
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
            columns: 8,
            align: "right",
            measure: "nominal",
            role: "input"
        });

        const primaryUpdates = result.primaryValues.map((value: number, rowIdx: number) => ({
            row: rowIdx,
            col: primaryVarIndex,
            value
        }));
        await updateBulkCells(primaryUpdates);

        if (sequentialCount) {
            const sequenceVarIndex = primaryVarIndex + 1;
            await addVariable({
                columnIndex: sequenceVarIndex,
                name: sequentialName,
                type: "NUMERIC",
                width: 2,
                decimals: 0,
                label: `Sequential count of matching cases`,
                columns: 8,
                align: "right",
                measure: "ordinal",
                role: "input"
            });

            const sequenceUpdates = result.sequenceValues.map((value: number, rowIdx: number) => ({
                row: rowIdx,
                col: sequenceVarIndex,
                value
            }));
            await updateBulkCells(sequenceUpdates);
        }
    };

    const createOutputLog = async (statistics: any[]) => {
        const logId = await addLog({
            log: `Identify Duplicate Cases: ${matchingVariables.map(v => v.name).join(', ')}`,
        });

        const analyticId = await addAnalytic(logId, {
            title: "Identify Duplicate Cases",
            note: `Matching variables: ${matchingVariables.map(v => v.name).join(', ')}. 
                ${sortingVariables.length > 0 ? `Sorting variables: ${sortingVariables.map(v => v.name).join(', ')} (${sortOrder}).` : ''} 
                Primary case: ${primaryCaseIndicator}. ${sequentialCount ? 'Sequential numbering created.' : ''}`,
        });

        for (const stat of statistics) {
            await addStatistic(analyticId, {
                title: stat.title,
                output_data: stat.output_data,
                components: stat.component,
                description: stat.description
            });
        }
    };

    const handleVariableSelect = (columnIndex: number, source: 'source' | 'matching' | 'sorting') => {
        if (highlightedVariable?.id === columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: columnIndex.toString(), source });
        }
    };

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

    const handleConfirm = async () => {
        if (matchingVariables.length === 0) {
            setErrorMessage("No matching variables have been selected.");
            setErrorDialogOpen(true);
            return;
        }

        setIsProcessing(true);

        try {
            const workerResult: any = await processWithWorker();
            const { result, statistics } = workerResult;

            if (moveMatchingToTop) {
                await setDataAndSync(result.reorderedData);
            }

            await createIndicatorVariables(result);

            if (displayFrequencies) {
                await createOutputLog(statistics);
            }

            handleClose();
        } catch (error) {
            console.error("Error processing duplicates:", error);
            setErrorMessage("An error occurred while processing duplicates.");
            setErrorDialogOpen(true);
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            closeModal();
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

                    <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                        <VariableTab
                            sourceVariables={sourceVariables}
                            matchingVariables={matchingVariables}
                            sortingVariables={sortingVariables}
                            highlightedVariable={highlightedVariable}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                            handleVariableSelect={handleVariableSelect}
                            handleVariableDoubleClick={handleVariableDoubleClick}
                            handleTransferToMatching={handleTransferToMatching}
                            handleMoveFromMatching={handleMoveFromMatching}
                            handleTransferToSorting={handleTransferToSorting}
                            handleMoveFromSorting={handleMoveFromSorting}
                            getVariableIcon={getVariableIcon}
                            getDisplayName={getDisplayName}
                        />
                    </TabsContent>

                    <TabsContent value="options" className="p-6 overflow-y-auto flex-grow">
                        <OptionsTab
                            primaryCaseIndicator={primaryCaseIndicator}
                            setPrimaryCaseIndicator={setPrimaryCaseIndicator}
                            primaryName={primaryName}
                            setPrimaryName={setPrimaryName}
                            filterByIndicator={filterByIndicator}
                            setFilterByIndicator={setFilterByIndicator}
                            sequentialCount={sequentialCount}
                            setSequentialCount={setSequentialCount}
                            sequentialName={sequentialName}
                            setSequentialName={setSequentialName}
                            moveMatchingToTop={moveMatchingToTop}
                            setMoveMatchingToTop={setMoveMatchingToTop}
                            displayFrequencies={displayFrequencies}
                            setDisplayFrequencies={setDisplayFrequencies}
                        />
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