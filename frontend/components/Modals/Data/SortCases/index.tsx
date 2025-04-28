"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { InfoIcon, Ruler, Shapes, BarChartHorizontal, ChevronUp, ChevronDown } from "lucide-react";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { Variable } from "@/types/Variable";
import VariableListManager, { TargetListConfig } from "@/components/Common/VariableListManager";

interface SortVariableConfig {
    variable: Variable;
    direction: 'asc' | 'desc';
}

interface SortCasesModalProps {
    onClose: () => void;
}

const SortCasesModal: React.FC<SortCasesModalProps> = ({ onClose }) => {
    const { sortData } = useDataStore();
    const { variables } = useVariableStore();

    // Prepare variables with tempId
    const prepareVariablesWithTempId = useCallback((vars: Variable[]) => {
        return vars.map(v => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));
    }, []);

    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [sortByConfigs, setSortByConfigs] = useState<SortVariableConfig[]>([]);
    const [defaultSortOrder, setDefaultSortOrder] = useState<"asc" | "desc">("asc");

    // Updated to match VariableListManager's expected format
    const [highlightedVariable, setHighlightedVariable] = useState<{
        id: string;
        source: string;
    } | null>(null);

    const [saveSortedData, setSaveSortedData] = useState<boolean>(false);
    const [fileName, setFileName] = useState<string>("");
    const [createIndex, setCreateIndex] = useState<boolean>(false);

    // Initialize available variables from the store
    useEffect(() => {
        const sortByVarIds = sortByConfigs.map(config => config.variable.columnIndex);
        const filtered = variables.filter(v => !sortByVarIds.includes(v.columnIndex));
        setAvailableVariables(prepareVariablesWithTempId(filtered));
    }, [variables, sortByConfigs, prepareVariablesWithTempId]);

    // Function to get sortBy variables as an array (for VariableListManager)
    const getSortByVariables = useCallback(() => {
        return sortByConfigs.map(config => config.variable);
    }, [sortByConfigs]);

    // Handler for moving variables between lists - compatible with VariableListManager
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        if (fromListId === 'available' && toListId === 'sortBy') {
            // Moving from available to sortBy
            const newConfig: SortVariableConfig = {
                variable,
                direction: defaultSortOrder
            };

            if (typeof targetIndex === 'number') {
                // Insert at specific position
                const newConfigs = [...sortByConfigs];
                newConfigs.splice(targetIndex, 0, newConfig);
                setSortByConfigs(newConfigs);
            } else {
                // Add to end
                setSortByConfigs(prev => [...prev, newConfig]);
            }

            setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        }
        else if (fromListId === 'sortBy' && toListId === 'available') {
            // Moving from sortBy to available
            setSortByConfigs(prev => prev.filter(c => c.variable.tempId !== variable.tempId));
            setAvailableVariables(prev => [...prev, variable]);
        }

        // Clear highlight
        setHighlightedVariable(null);
    }, [defaultSortOrder]);

    // Handler for reordering variables within a list - compatible with VariableListManager
    const handleReorderVariable = useCallback((listId: string, reorderedVariables: Variable[]) => {
        if (listId === 'available') {
            setAvailableVariables(reorderedVariables);
        }
        else if (listId === 'sortBy') {
            // We need to preserve the direction settings when reordering
            const newConfigs: SortVariableConfig[] = reorderedVariables.map(variable => {
                // Find existing config for this variable to keep the direction
                const existingConfig = sortByConfigs.find(c => c.variable.tempId === variable.tempId);
                return {
                    variable,
                    direction: existingConfig?.direction || defaultSortOrder
                };
            });
            setSortByConfigs(newConfigs);
        }
    }, [sortByConfigs, defaultSortOrder]);

    // Change sort direction for a variable
    const changeSortDirection = (tempId: string, direction: 'asc' | 'desc') => {
        setSortByConfigs(prev =>
            prev.map(config =>
                config.variable.tempId === tempId
                    ? { ...config, direction }
                    : config
            )
        );
    };

    // Move variables up and down in sortBy list
    const moveVariableUp = (tempId: string) => {
        const index = sortByConfigs.findIndex(c => c.variable.tempId === tempId);
        if (index <= 0) return;

        const newConfigs = [...sortByConfigs];
        [newConfigs[index], newConfigs[index - 1]] = [newConfigs[index - 1], newConfigs[index]];

        setSortByConfigs(newConfigs);
    };

    const moveVariableDown = (tempId: string) => {
        const index = sortByConfigs.findIndex(c => c.variable.tempId === tempId);
        if (index === -1 || index >= sortByConfigs.length - 1) return;

        const newConfigs = [...sortByConfigs];
        [newConfigs[index], newConfigs[index + 1]] = [newConfigs[index + 1], newConfigs[index]];

        setSortByConfigs(newConfigs);
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

    // Custom display name for sortBy list to include sort direction
    const getSortByDisplayName = (variable: Variable): string => {
        const direction = sortByConfigs.find(c => c.variable.tempId === variable.tempId)?.direction;
        const directionSymbol = direction === 'asc' ? '▲' : '▼';
        return `${getDisplayName(variable)} ${directionSymbol}`;
    };

    // Custom render for sortBy list to show sort direction controls
    const renderSortByListFooter = () => {
        if (!highlightedVariable || highlightedVariable.source !== 'sortBy') return null;

        const selectedTempId = highlightedVariable.id;
        const selectedConfig = sortByConfigs.find(c => c.variable.tempId === selectedTempId);
        if (!selectedConfig) return null;

        return (
            <div className="mt-2 space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium">Sort Order:</div>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                onClick={() => moveVariableUp(selectedTempId)}
                                disabled={sortByConfigs.indexOf(selectedConfig) === 0}
                            >
                                <ChevronUp size={14} className="mr-1" /> Move Up
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                onClick={() => moveVariableDown(selectedTempId)}
                                disabled={sortByConfigs.indexOf(selectedConfig) === sortByConfigs.length - 1}
                            >
                                <ChevronDown size={14} className="mr-1" /> Move Down
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="sortOrder"
                                checked={selectedConfig.direction === "asc"}
                                onChange={() => changeSortDirection(selectedTempId, 'asc')}
                                className="border-[#CCCCCC]"
                            />
                            <span className="text-sm">Ascending</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="sortOrder"
                                checked={selectedConfig.direction === "desc"}
                                onChange={() => changeSortDirection(selectedTempId, 'desc')}
                                className="border-[#CCCCCC]"
                            />
                            <span className="text-sm">Descending</span>
                        </label>
                    </div>
                </div>
            </div>
        );
    };

    // Default sort order controls (when no variable is selected)
    const renderDefaultSortOrderControls = () => {
        if (highlightedVariable?.source === 'sortBy') return null;

        return (
            <div className="mt-4">
                <div className="text-sm mb-2 font-medium">Default Sort Order:</div>
                <div className="flex flex-col space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="defaultSortOrder"
                            checked={defaultSortOrder === "asc"}
                            onChange={() => setDefaultSortOrder("asc")}
                            className="border-[#CCCCCC]"
                        />
                        <span className="text-sm">Ascending</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="defaultSortOrder"
                            checked={defaultSortOrder === "desc"}
                            onChange={() => setDefaultSortOrder("desc")}
                            className="border-[#CCCCCC]"
                        />
                        <span className="text-sm">Descending</span>
                    </label>
                </div>
            </div>
        );
    };

    const performSort = async () => {
        if (sortByConfigs.length === 0) {
            alert("Please select at least one variable to sort by");
            return;
        }

        try {
            // Sort by the highest priority variable first (the first in the list)
            // Then sort by the next highest priority, and so on
            // This maintains the correct multi-level sorting order
            for (let i = 0; i < sortByConfigs.length; i++) {
                const { variable, direction } = sortByConfigs[i];
                await sortData(variable.columnIndex, direction);
            }

            if (saveSortedData && fileName) {
                // In a real implementation, this would save to a file
                console.log(`Saving sorted data to ${fileName}`);

                if (createIndex) {
                    console.log("Creating index for sorted data");
                }
            }

            onClose();
        } catch (error) {
            console.error("Error during sort operation:", error);
            alert("An error occurred while sorting the data");
        }
    };

    const handleOk = () => performSort();

    const handleReset = () => {
        const sortedVariables = sortByConfigs.map(config => config.variable);
        setAvailableVariables(prepareVariablesWithTempId([...availableVariables, ...sortedVariables].sort((a, b) => a.columnIndex - b.columnIndex)));
        setSortByConfigs([]);
        setDefaultSortOrder("asc");
        setSaveSortedData(false);
        setFileName("");
        setCreateIndex(false);
        setHighlightedVariable(null);
    };

    // Configure target list for VariableListManager
    const sortByListConfig: TargetListConfig = {
        id: 'sortBy',
        title: 'Sort By:',
        variables: getSortByVariables(),
        height: '245px',
        droppable: true,
        draggableItems: true
    };

    return (
        <DialogContent className="max-w-[600px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Sort Cases</DialogTitle>
            </DialogHeader>

            <div className="p-6 overflow-y-auto flex-grow">
                <div className="grid grid-cols-1 gap-6">
                    {/* Variable List Manager */}
                    <VariableListManager
                        availableVariables={availableVariables}
                        targetLists={[sortByListConfig]}
                        variableIdKey="tempId"
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        onMoveVariable={handleMoveVariable}
                        onReorderVariable={handleReorderVariable}
                        getVariableIcon={getVariableIcon}
                        getDisplayName={sortByConfigs.length > 0 ? getSortByDisplayName : getDisplayName}
                        renderListFooter={renderSortByListFooter}
                        showArrowButtons={true}
                        availableListHeight="250px"
                    />

                    {/* Default sort order controls (when no variable is selected) */}
                    {renderDefaultSortOrderControls()}

                    {/* Save Options Section */}
                    <div className="mt-2 border border-[#E6E6E6] p-4 rounded-md">
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Checkbox
                                    id="saveSortedData"
                                    checked={saveSortedData}
                                    onCheckedChange={(checked) => setSaveSortedData(!!checked)}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="saveSortedData" className="text-sm cursor-pointer">
                                    Save file with sorted data
                                </Label>
                            </div>

                            {saveSortedData && (
                                <div className="ml-6 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                            onClick={() => {
                                                // In a real implementation, this would open a file picker
                                                const fakeFile = "sorted_data.csv";
                                                setFileName(fakeFile);
                                            }}
                                        >
                                            File...
                                        </Button>
                                        {fileName && (
                                            <span className="text-xs text-[#444444]">
                                                Selected File: {fileName}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center">
                                        <Checkbox
                                            id="createIndex"
                                            checked={createIndex}
                                            onCheckedChange={(checked) => setCreateIndex(!!checked)}
                                            className="mr-2 border-[#CCCCCC]"
                                        />
                                        <Label htmlFor="createIndex" className="text-sm cursor-pointer">
                                            Create an index
                                        </Label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                        onClick={handleOk}
                    >
                        OK
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        onClick={handleReset}
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
                        onClick={() => alert("Help dialog here")}
                    >
                        Help
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
};

export default SortCasesModal;