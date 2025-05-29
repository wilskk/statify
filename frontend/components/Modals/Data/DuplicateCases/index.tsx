"use client";

import React, { FC, useState, useEffect, useCallback } from "react";
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
    containerType?: "dialog" | "sidebar";
}

// Main content component separated from container logic
const DuplicateCasesContent: FC<DuplicateCasesProps> = ({ onClose, containerType = "dialog" }) => {
    const { closeModal } = useModalStore();
    const { variables, addVariable } = useVariableStore();
    const { data, updateCells, setDataAndSync } = useDataStore();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    // Prepare variables with tempId if they don't have it
    const prepareVariablesWithTempId = useCallback((vars: Variable[]) => {
        return vars.map(v => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));
    }, []);

    const [sourceVariables, setSourceVariables] = useState<Variable[]>([]);
    const [matchingVariables, setMatchingVariables] = useState<Variable[]>([]);
    const [sortingVariables, setSortingVariables] = useState<Variable[]>([]);

    // Update highlightedVariable to match VariableListManager format
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: string} | null>(null);

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
        // Add tempId to each variable during initialization
        setSourceVariables(prepareVariablesWithTempId(variables.filter(v => v.name !== "")));
    }, [variables, prepareVariablesWithTempId]);

    // Handler for moving variables between lists - compatible with VariableListManager
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        // Remove from source list
        if (fromListId === 'available') {
            setSourceVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (fromListId === 'matching') {
            setMatchingVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (fromListId === 'sorting') {
            setSortingVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        }

        // Add to target list
        if (toListId === 'available') {
            setSourceVariables(prev => [...prev, variable]);
        } else if (toListId === 'matching') {
            setMatchingVariables(prev => [...prev, variable]);
        } else if (toListId === 'sorting') {
            setSortingVariables(prev => [...prev, variable]);
        }

        // Clear highlight
        setHighlightedVariable(null);
    }, []);

    // Handler for reordering variables within a list - compatible with VariableListManager
    const handleReorderVariable = useCallback((listId: string, reorderedVariables: Variable[]) => {
        if (listId === 'available') {
            setSourceVariables(reorderedVariables);
        } else if (listId === 'matching') {
            setMatchingVariables(reorderedVariables);
        } else if (listId === 'sorting') {
            setSortingVariables(reorderedVariables);
        }
    }, []);

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
            columns: 64,
            align: "right",
            measure: "nominal",
            role: "input"
        });

        const primaryUpdates = result.primaryValues.map((value: number, rowIdx: number) => ({
            row: rowIdx,
            col: primaryVarIndex,
            value
        }));
        await updateCells(primaryUpdates);

        if (sequentialCount) {
            const sequenceVarIndex = primaryVarIndex + 1;
            await addVariable({
                columnIndex: sequenceVarIndex,
                name: sequentialName,
                type: "NUMERIC",
                width: 2,
                decimals: 0,
                label: `Sequential count of matching cases`,
                columns: 64,
                align: "right",
                measure: "ordinal",
                role: "input"
            });

            const sequenceUpdates = result.sequenceValues.map((value: number, rowIdx: number) => ({
                row: rowIdx,
                col: sequenceVarIndex,
                value
            }));
            await updateCells(sequenceUpdates);
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

    const handleReset = () => {
        // Reset all variables and add tempId to source variables
        setSourceVariables(prepareVariablesWithTempId(variables.filter(v => v.name !== "")));
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
                return <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
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
            <div className={`flex flex-col ${containerType === "sidebar" ? "h-full overflow-hidden" : "max-h-[85vh]"}`}>
                {containerType === "dialog" && (
                    <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                        <DialogTitle className="text-[22px] font-semibold text-foreground">Identify Duplicate Cases</DialogTitle>
                    </DialogHeader>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow overflow-hidden">
                    <div className="border-b border-border flex-shrink-0">
                        <TabsList className="bg-muted rounded-none h-9 p-0">
                            <TabsTrigger
                                value="variables"
                                className={`px-4 h-8 rounded-none text-sm ${activeTab === 'variables' ? 'bg-background border-t border-l border-r border-border text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                            >
                                Variables
                            </TabsTrigger>
                            <TabsTrigger
                                value="options"
                                className={`px-4 h-8 rounded-none text-sm ${activeTab === 'options' ? 'bg-background border-t border-l border-r border-border text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
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
                            setHighlightedVariable={setHighlightedVariable}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                            handleMoveVariable={handleMoveVariable}
                            handleReorderVariable={handleReorderVariable}
                            getVariableIcon={getVariableIcon}
                            getDisplayName={getDisplayName}
                            containerType={containerType}
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
                            containerType={containerType}
                        />
                    </TabsContent>
                </Tabs>

                <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0 rounded-b-md">
                    <div className="flex justify-end space-x-3">
                        <Button
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4"
                            onClick={handleConfirm}
                            disabled={isProcessing}
                        >
                            {isProcessing ? "Processing..." : "OK"}
                        </Button>
                        <Button
                            variant="outline"
                            className="border-border hover:bg-accent hover:text-accent-foreground h-8 px-4"
                            onClick={handleReset}
                            disabled={isProcessing}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="outline"
                            className="border-border hover:bg-accent hover:text-accent-foreground h-8 px-4"
                            onClick={handleClose}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            className="border-border hover:bg-accent hover:text-accent-foreground h-8 px-4"
                            disabled={isProcessing}
                        >
                            Help
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <DialogContent className="max-w-[400px] p-6 bg-popover border border-border shadow-md rounded-md">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-[18px] font-semibold text-popover-foreground">IBM SPSS Statistics</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-4 items-start">
                        <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-popover-foreground">{errorMessage}</p>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4"
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

// Main component that handles different container types
const DuplicateCases: FC<DuplicateCasesProps> = ({ onClose, containerType = "dialog" }) => {
    // If sidebar mode, use a div container
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <DuplicateCasesContent onClose={onClose} containerType={containerType} />
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent
    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-[650px] p-0 bg-popover border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
                <DuplicateCasesContent onClose={onClose} containerType={containerType} />
            </DialogContent>
        </Dialog>
    );
};

export default DuplicateCases;