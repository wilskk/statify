"use client";

import React, { useState, useEffect } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CornerDownRight, CornerDownLeft, InfoIcon, Ruler, Shapes, BarChartHorizontal, ChevronUp, ChevronDown } from "lucide-react";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { Variable } from "@/types/Variable";

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

    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [sortByConfigs, setSortByConfigs] = useState<SortVariableConfig[]>([]);
    const [defaultSortOrder, setDefaultSortOrder] = useState<"asc" | "desc">("asc");
    const [highlightedItem, setHighlightedItem] = useState<{
        columnIndex: number;
        source: 'available' | 'sortBy';
    } | null>(null);

    const [saveSortedData, setSaveSortedData] = useState<boolean>(false);
    const [fileName, setFileName] = useState<string>("");
    const [createIndex, setCreateIndex] = useState<boolean>(false);

    // Initialize available variables from the store
    useEffect(() => {
        const sortByColumnIndices = sortByConfigs.map(config => config.variable.columnIndex);
        const filtered = variables.filter(v => !sortByColumnIndices.includes(v.columnIndex));
        setAvailableVariables(filtered);
    }, [variables, sortByConfigs]);

    const handleVariableSelect = (columnIndex: number, source: 'available' | 'sortBy') => {
        if (highlightedItem?.columnIndex === columnIndex && highlightedItem.source === source) {
            setHighlightedItem(null);
        } else {
            setHighlightedItem({ columnIndex, source });
        }
    };

    const handleVariableDoubleClick = (columnIndex: number, source: 'available' | 'sortBy') => {
        if (source === "available") {
            const variable = availableVariables.find(v => v.columnIndex === columnIndex);
            if (variable) moveToSortByVariables(variable);
        } else if (source === "sortBy") {
            const config = sortByConfigs.find(c => c.variable.columnIndex === columnIndex);
            if (config) moveFromSortByVariables(config.variable);
        }
    };

    const moveToSortByVariables = (variable: Variable) => {
        const newConfig: SortVariableConfig = {
            variable,
            direction: defaultSortOrder
        };

        setSortByConfigs(prev => [...prev, newConfig]);
        setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedItem(null);
    };

    const moveFromSortByVariables = (variable: Variable) => {
        setSortByConfigs(prev => prev.filter(c => c.variable.columnIndex !== variable.columnIndex));
        setAvailableVariables(prev => [...prev, variable]);
        setHighlightedItem(null);
    };

    const handleTransferClick = () => {
        if (!highlightedItem) return;

        if (highlightedItem.source === "available") {
            const variable = availableVariables.find(v => v.columnIndex === highlightedItem.columnIndex);
            if (variable) moveToSortByVariables(variable);
        } else if (highlightedItem.source === "sortBy") {
            const config = sortByConfigs.find(c => c.variable.columnIndex === highlightedItem.columnIndex);
            if (config) moveFromSortByVariables(config.variable);
        }
    };

    const changeSortDirection = (columnIndex: number, direction: 'asc' | 'desc') => {
        setSortByConfigs(prev =>
            prev.map(config =>
                config.variable.columnIndex === columnIndex
                    ? { ...config, direction }
                    : config
            )
        );
    };

    const moveVariableUp = (columnIndex: number) => {
        const index = sortByConfigs.findIndex(c => c.variable.columnIndex === columnIndex);
        if (index <= 0) return;

        const newConfigs = [...sortByConfigs];
        [newConfigs[index], newConfigs[index - 1]] = [newConfigs[index - 1], newConfigs[index]];

        setSortByConfigs(newConfigs);
    };

    const moveVariableDown = (columnIndex: number) => {
        const index = sortByConfigs.findIndex(c => c.variable.columnIndex === columnIndex);
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
        setAvailableVariables([...availableVariables, ...sortedVariables].sort((a, b) => a.columnIndex - b.columnIndex));
        setSortByConfigs([]);
        setDefaultSortOrder("asc");
        setSaveSortedData(false);
        setFileName("");
        setCreateIndex(false);
        setHighlightedItem(null);
    };

    const renderVariableList = (vars: Variable[], source: 'available' | 'sortBy', height: string) => {
        const variablesToRender = source === 'available'
            ? vars
            : sortByConfigs.map(config => config.variable);

        return (
            <div className="border border-[#E6E6E6] p-2 rounded-md overflow-y-auto overflow-x-hidden" style={{ height }}>
                <div className="space-y-1">
                    {variablesToRender.map((variable) => {
                        const config = source === 'sortBy'
                            ? sortByConfigs.find(c => c.variable.columnIndex === variable.columnIndex)
                            : null;

                        return (
                            <TooltipProvider key={variable.columnIndex}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-[#F7F7F7] ${
                                                highlightedItem?.columnIndex === variable.columnIndex && highlightedItem.source === source
                                                    ? "bg-[#E6E6E6] border-[#888888]"
                                                    : "border-[#CCCCCC]"
                                            }`}
                                            onClick={() => handleVariableSelect(variable.columnIndex, source)}
                                            onDoubleClick={() => handleVariableDoubleClick(variable.columnIndex, source)}
                                        >
                                            <div className="flex items-center w-full">
                                                {getVariableIcon(variable)}
                                                <span className="text-xs truncate">{variable.name}</span>
                                                {source === 'sortBy' && config && (
                                                    <span className="ml-auto text-xs text-gray-500">
                                                        {config.direction === 'asc' ? '▲' : '▼'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        <p className="text-xs">
                                            {variable.name}
                                            {variable.label ? ` - ${variable.label}` : ''}
                                            {source === 'sortBy' && config && ` (${config.direction})`}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <DialogContent className="max-w-[600px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Sort Cases</DialogTitle>
            </DialogHeader>

            <div className="p-6 overflow-y-auto flex-grow">
                <div className="grid grid-cols-7 gap-6">
                    {/* Left column: Available variables */}
                    <div className="col-span-3">
                        <div className="text-sm mb-2 font-medium">Variables:</div>
                        {renderVariableList(availableVariables, 'available', '250px')}
                        <div className="text-xs mt-2 text-[#888888] flex items-center">
                            <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                            <span>Double-click a variable to add it to Sort By</span>
                        </div>
                    </div>

                    {/* Middle column: Transfer buttons */}
                    <div className="col-span-1 flex flex-col items-center justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                            onClick={handleTransferClick}
                            disabled={!highlightedItem}
                        >
                            {highlightedItem?.source === 'sortBy' ?
                                <CornerDownLeft size={16} /> :
                                <CornerDownRight size={16} />
                            }
                        </Button>
                    </div>

                    {/* Right column: Sort By variables and sort options */}
                    <div className="col-span-3">
                        <div className="space-y-6">
                            <div>
                                <div className="text-sm mb-2 font-medium">Sort By:</div>
                                {renderVariableList([], 'sortBy', '180px')}
                                {sortByConfigs.length > 0 && (
                                    <div className="flex justify-end mt-2 space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 px-2 text-xs border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                            onClick={() => {
                                                if (highlightedItem?.source === 'sortBy') {
                                                    moveVariableUp(highlightedItem.columnIndex);
                                                }
                                            }}
                                            disabled={!highlightedItem || highlightedItem.source !== 'sortBy'}
                                        >
                                            <ChevronUp size={14} className="mr-1" /> Move Up
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 px-2 text-xs border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                            onClick={() => {
                                                if (highlightedItem?.source === 'sortBy') {
                                                    moveVariableDown(highlightedItem.columnIndex);
                                                }
                                            }}
                                            disabled={!highlightedItem || highlightedItem.source !== 'sortBy'}
                                        >
                                            <ChevronDown size={14} className="mr-1" /> Move Down
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="text-sm mb-2 font-medium">Sort Order:</div>
                                <div className="flex flex-col space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="sortOrder"
                                            checked={
                                                !highlightedItem || highlightedItem.source !== 'sortBy'
                                                    ? defaultSortOrder === "asc"
                                                    : sortByConfigs.find(c => c.variable.columnIndex === highlightedItem.columnIndex)?.direction === "asc"
                                            }
                                            onChange={() => {
                                                if (!highlightedItem || highlightedItem.source !== 'sortBy') {
                                                    setDefaultSortOrder("asc");
                                                } else {
                                                    changeSortDirection(highlightedItem.columnIndex, 'asc');
                                                }
                                            }}
                                            className="border-[#CCCCCC]"
                                        />
                                        <span className="text-sm">Ascending</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="sortOrder"
                                            checked={
                                                !highlightedItem || highlightedItem.source !== 'sortBy'
                                                    ? defaultSortOrder === "desc"
                                                    : sortByConfigs.find(c => c.variable.columnIndex === highlightedItem.columnIndex)?.direction === "desc"
                                            }
                                            onChange={() => {
                                                if (!highlightedItem || highlightedItem.source !== 'sortBy') {
                                                    setDefaultSortOrder("desc");
                                                } else {
                                                    changeSortDirection(highlightedItem.columnIndex, 'desc');
                                                }
                                            }}
                                            className="border-[#CCCCCC]"
                                        />
                                        <span className="text-sm">Descending</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Options Section */}
                <div className="mt-6 border border-[#E6E6E6] p-4 rounded-md">
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
                        onClick={() => alert("Paste syntax here")}
                    >
                        Paste
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