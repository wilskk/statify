import { useState, useEffect, useCallback } from "react";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { Variable } from "@/types/Variable";
import { SortVariableConfig } from "../types";

interface UseSortCasesProps {
    onClose: () => void;
}

export const useSortCases = ({ onClose }: UseSortCasesProps) => {
    const { sortData } = useDataStore();
    const { variables: storeVariables } = useVariableStore(); // Renamed variables to storeVariables

    const prepareVariablesWithTempId = useCallback((vars: Variable[]) => {
        return vars.map(v => ({
            ...v,
            tempId: v.tempId || `temp_sort_${v.columnIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));
    }, []);

    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [sortByConfigs, setSortByConfigs] = useState<SortVariableConfig[]>([]);
    const [defaultSortOrder, setDefaultSortOrder] = useState<"asc" | "desc">("asc");
    const [highlightedVariable, setHighlightedVariable] = useState<{ id: string; source: string } | null>(null);
    // saveSortedData, fileName, createIndex states are not used in the current SortCasesContent logic, so they are omitted for now.
    // If they become used, they can be added back.

    useEffect(() => {
        const sortByVarColIndexes = sortByConfigs.map(config => config.variable.columnIndex);
        const filtered = storeVariables.filter(v => !sortByVarColIndexes.includes(v.columnIndex));
        setAvailableVariables(prepareVariablesWithTempId(filtered));
    }, [storeVariables, sortByConfigs, prepareVariablesWithTempId]);

    const getSortByVariables = useCallback(() => {
        return sortByConfigs.map(config => config.variable);
    }, [sortByConfigs]);

    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        if (fromListId === 'available' && toListId === 'sortBy') {
            const newConfig: SortVariableConfig = { variable, direction: defaultSortOrder };
            setSortByConfigs(prev => {
                const newConfigs = [...prev];
                if (typeof targetIndex === 'number') newConfigs.splice(targetIndex, 0, newConfig);
                else newConfigs.push(newConfig);
                return newConfigs;
            });
            // setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId)); // This will be handled by useEffect
        } else if (fromListId === 'sortBy' && toListId === 'available') {
            setSortByConfigs(prev => prev.filter(c => c.variable.tempId !== variable.tempId));
            // setAvailableVariables(prev => [...prev, variable].sort((a,b) => a.columnIndex - b.columnIndex)); // This will be handled by useEffect
        }
        setHighlightedVariable(null);
    }, [defaultSortOrder]);

    const handleReorderVariable = useCallback((listId: string, reorderedVariables: Variable[]) => {
        if (listId === 'sortBy') {
            setSortByConfigs(prevConfigs => 
                reorderedVariables.map(variable => {
                    const existingConfig = prevConfigs.find(c => c.variable.tempId === variable.tempId);
                    return { variable, direction: existingConfig?.direction || defaultSortOrder };
                })
            );
        } else if (listId === 'available') {
            setAvailableVariables(reorderedVariables.sort((a,b) => a.columnIndex - b.columnIndex));
        }
    }, [defaultSortOrder]);

    const changeSortDirection = (tempId: string, direction: 'asc' | 'desc') => {
        setSortByConfigs(prev =>
            prev.map(config =>
                config.variable.tempId === tempId ? { ...config, direction } : config
            )
        );
    };

    const moveVariableUp = (tempId: string) => {
        setSortByConfigs(prev => {
            const index = prev.findIndex(c => c.variable.tempId === tempId);
            if (index <= 0) return prev;
            const newConfigs = [...prev];
            [newConfigs[index], newConfigs[index - 1]] = [newConfigs[index - 1], newConfigs[index]];
            return newConfigs;
        });
    };

    const moveVariableDown = (tempId: string) => {
        setSortByConfigs(prev => {
            const index = prev.findIndex(c => c.variable.tempId === tempId);
            if (index === -1 || index >= prev.length - 1) return prev;
            const newConfigs = [...prev];
            [newConfigs[index], newConfigs[index + 1]] = [newConfigs[index + 1], newConfigs[index]];
            return newConfigs;
        });
    };

    const performSort = async () => {
        if (sortByConfigs.length === 0) {
            // Consider using a state for error messages to display in UI instead of alert
            alert("Please select at least one variable to sort by");
            return;
        }
        try {
            // Sorting logic iterates through sortByConfigs, applying sortData for each.
            // This implies sortData modifies the store's data array in place, or returns a new sorted array.
            // If sortData is not synchronous or doesn't immediately reflect in `data` from useDataStore,
            // this loop might not behave as expected for multi-level sorts without awaiting or handling chained sorting.
            // For now, assuming sortData correctly handles this or the data array is updated before the next iteration.
            for (const config of sortByConfigs) {
                await sortData(config.variable.columnIndex, config.direction);
            }
            onClose();
        } catch (error) {
            console.error("Error during sort operation:", error);
            // Consider using a state for error messages
            alert("An error occurred while sorting the data");
        }
    };

    const handleOk = () => performSort();

    const handleReset = () => {
        // availableVariables will be repopulated by useEffect due to sortByConfigs change
        setSortByConfigs([]);
        setDefaultSortOrder("asc");
        setHighlightedVariable(null);
    };

    return {
        availableVariables,
        sortByConfigs, setSortByConfigs, // Expose setSortByConfigs if needed by component, e.g., for advanced direct manipulation not covered by handlers
        defaultSortOrder, setDefaultSortOrder,
        highlightedVariable, setHighlightedVariable,
        getSortByVariables, // This is a derived state, could be calculated in component or here
        handleMoveVariable,
        handleReorderVariable,
        changeSortDirection,
        moveVariableUp,
        moveVariableDown,
        handleOk,
        handleReset,
        // prepareVariablesWithTempId is internal, not needed by component
        // performSort is internal, exposed via handleOk
    };
}; 