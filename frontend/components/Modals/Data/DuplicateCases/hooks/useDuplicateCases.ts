import { useState, useEffect, useCallback } from "react";
import { useModalStore } from "@/stores/useModalStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { Variable } from "@/types/Variable";
import { TabType } from "../types";

interface UseDuplicateCasesProps {
    onClose: () => void;
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
}

export const useDuplicateCases = ({ onClose, activeTab, setActiveTab }: UseDuplicateCasesProps) => {
    const { closeModal } = useModalStore();
    const { variables: storeVariables, addVariable } = useVariableStore(); // Renamed variables to storeVariables to avoid conflict
    const { data, updateCells, setData } = useDataStore();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    const prepareVariablesWithTempId = useCallback((vars: Variable[]) => {
        return vars.map(v => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));
    }, []);

    const [sourceVariables, setSourceVariables] = useState<Variable[]>([]);
    const [matchingVariables, setMatchingVariables] = useState<Variable[]>([]);
    const [sortingVariables, setSortingVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: string} | null>(null);
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
        setSourceVariables(prepareVariablesWithTempId(storeVariables.filter(v => v.name !== "")));
    }, [storeVariables, prepareVariablesWithTempId]);

    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        if (fromListId === 'available') {
            setSourceVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (fromListId === 'matching') {
            setMatchingVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (fromListId === 'sorting') {
            setSortingVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        }

        if (toListId === 'available') {
            setSourceVariables(prev => [...prev, variable].sort((a, b) => a.columnIndex - b.columnIndex));
        } else if (toListId === 'matching') {
            setMatchingVariables(prev => {
                const newList = [...prev];
                if (typeof targetIndex === 'number') newList.splice(targetIndex, 0, variable); else newList.push(variable);
                return newList;
            });
        } else if (toListId === 'sorting') {
            setSortingVariables(prev => {
                const newList = [...prev];
                if (typeof targetIndex === 'number') newList.splice(targetIndex, 0, variable); else newList.push(variable);
                return newList;
            });
        }
        setHighlightedVariable(null);
    }, []);

    const handleReorderVariable = useCallback((listId: string, reorderedVariables: Variable[]) => {
        if (listId === 'matching') {
            setMatchingVariables(reorderedVariables);
        } else if (listId === 'sorting') {
            setSortingVariables(reorderedVariables);
        } else if (listId === 'available') { // Added for completeness, though not typically reordered by user
            setSourceVariables(reorderedVariables.sort((a,b) => a.columnIndex - b.columnIndex));
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
        const primaryUpdates = result.primaryValues.map((value: number, rowIdx: number) => ({ row: rowIdx, col: primaryVarIndex, value }));
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
            const sequenceUpdates = result.sequenceValues.map((value: number, rowIdx: number) => ({ row: rowIdx, col: sequenceVarIndex, value }));
            await updateCells(sequenceUpdates);
        }
    };

    const createOutputLog = async (statistics: any[]) => {
        const logId = await addLog({
            log: `Identify Duplicate Cases: ${matchingVariables.map(v => v.name).join(', ')}`,
        });
        const analyticId = await addAnalytic(logId, {
            title: "Identify Duplicate Cases",
            note: `Matching variables: ${matchingVariables.map(v => v.name).join(', ')}. ` +
                  `${sortingVariables.length > 0 ? `Sorting variables: ${sortingVariables.map(v => v.name).join(', ')} (${sortOrder}).` : ''} ` +
                  `Primary case: ${primaryCaseIndicator}. ${sequentialCount ? 'Sequential numbering created.' : ''}`,
        });
        for (const stat of statistics) {
            await addStatistic(analyticId, {
                title: stat.title,
                output_data: stat.output_data,
                components: stat.component, // Assuming 'component' is the correct field name
                description: stat.description
            });
        }
    };

    const handleReset = () => {
        setSourceVariables(prepareVariablesWithTempId(storeVariables.filter(v => v.name !== "")));
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
        setActiveTab("variables"); // Reset to variable tab
        setErrorMessage(null);
        setErrorDialogOpen(false);
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
            if (moveMatchingToTop && result.reorderedData) { // check if reorderedData exists
                await setData(result.reorderedData);
            }
            await createIndicatorVariables(result);
            if (displayFrequencies && statistics) { // check if statistics exist
                await createOutputLog(statistics);
            }
            onClose(); // Call the onClose passed from props
        } catch (error: any) {
            console.error("Error processing duplicates:", error);
            setErrorMessage(error.message || "An error occurred while processing duplicates.");
            setErrorDialogOpen(true);
        } finally {
            setIsProcessing(false);
        }
    };

    // handleClose is not needed here as onClose is used directly or via useModalStore by the component

    return {
        sourceVariables, 
        matchingVariables, 
        sortingVariables, 
        highlightedVariable, setHighlightedVariable,
        activeTab, setActiveTab,
        sortOrder, setSortOrder,
        primaryCaseIndicator, setPrimaryCaseIndicator,
        primaryName, setPrimaryName,
        filterByIndicator, setFilterByIndicator,
        sequentialCount, setSequentialCount,
        sequentialName, setSequentialName,
        moveMatchingToTop, setMoveMatchingToTop,
        displayFrequencies, setDisplayFrequencies,
        errorMessage, errorDialogOpen, setErrorDialogOpen, // No need to expose setErrorMessage directly if only used for errorDialog
        isProcessing,
        handleMoveVariable,
        handleReorderVariable,
        handleReset,
        handleConfirm,
        // No need to expose: prepareVariablesWithTempId, processWithWorker, createIndicatorVariables, createOutputLog as they are internal
    };
}; 