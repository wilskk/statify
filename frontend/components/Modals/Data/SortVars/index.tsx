"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { Variable } from "@/types/Variable";

interface SortVariablesModalProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

// Map UI column names to variable field names
const columnToFieldMap: Record<string, keyof Variable> = {
    "Name": "name",
    "Type": "type",
    "Width": "width",
    "Decimals": "decimals",
    "Label": "label",
    "Values": "values",
    "Missing": "missing",
    "Columns": "columns",
    "Align": "align",
    "Measure": "measure"
};

// This maps to the indices used in getFieldNameByColumnIndex in useVariableStore.ts
const fieldToColumnIndex: Record<string, number> = {
    "name": 0,
    "type": 1,
    "width": 2,
    "decimals": 3,
    "label": 4,
    "values": 5,
    "missing": 6,
    "columns": 7,
    "align": 8,
    "measure": 9,
    "role": 10
};

// Content component separated from container logic
const SortVariablesContent: React.FC<SortVariablesModalProps> = ({ 
    onClose,
}) => {
    const { variables, sortVariables } = useVariableStore();
    const { data, setData } = useDataStore();

    const [columns] = useState<string[]>([
        "Name",
        "Type",
        "Width",
        "Decimals",
        "Label",
        "Values",
        "Missing",
        "Columns",
        "Align",
        "Measure",
    ]);

    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [savePreSortedOrder, setSavePreSortedOrder] = useState<boolean>(false);
    const [attributeName, setAttributeName] = useState<string>("");

    const handleSelectColumn = (column: string) => {
        setSelectedColumn(column);
    };

    const saveOriginalOrder = () => {
        if (!attributeName.trim() || !savePreSortedOrder) return;

        try {
            const originalOrder = variables.map((variable, index) => ({
                name: variable.name,
                position: index
            }));

            localStorage.setItem(`variableOrder_${attributeName}`, JSON.stringify(originalOrder));
        } catch (error) {
            console.error("Error saving original order:", error);
        }
    };

    const handleOk = async () => {
        if (!selectedColumn) {
            alert("Please select a column to sort");
            return;
        }

        try {
            const fieldName = columnToFieldMap[selectedColumn];
            if (!fieldName) {
                throw new Error(`Column ${selectedColumn} not found in mapping`);
            }

            const columnIndex = fieldToColumnIndex[fieldName as string];
            if (columnIndex === undefined) {
                throw new Error(`Field ${fieldName} not found in column index mapping`);
            }

            if (savePreSortedOrder) {
                saveOriginalOrder();
            }

            // Store the original variable order before sorting
            const originalVariableOrder = [...variables];

            // Sort the variables
            await sortVariables(sortOrder, columnIndex);

            // If we have data, we need to reorder it based on the new variable order
            if (data.length > 0) {
                // Create a mapping from original column position to new position
                const columnMapping = new Map();

                variables.forEach((variable, newIndex) => {
                    // Find this variable in the original order
                    const originalVariable = originalVariableOrder.find(v => v.id === variable.id);
                    if (originalVariable) {
                        // Map from original column index to new column index
                        columnMapping.set(originalVariable.columnIndex, variable.columnIndex);
                    }
                });

                // Create a new data array with reordered columns
                const newData = data.map(row => {
                    // Create a new row with the same length, filled with empty values
                    const newRow = Array(row.length).fill("");

                    // Place each value from the original row to its new position
                    originalVariableOrder.forEach(variable => {
                        const oldIndex = variable.columnIndex;
                        const newIndex = columnMapping.get(oldIndex);

                        if (newIndex !== undefined && oldIndex < row.length) {
                            newRow[newIndex] = row[oldIndex];
                        }
                    });

                    return newRow;
                });

                // Update the data in the store
                await setData(newData);
            }

            onClose();
        } catch (error) {
            console.error("Error sorting variables:", error);
            alert("An error occurred while sorting variables");
        }
    };

    const handleReset = () => {
        setSelectedColumn(null);
        setSortOrder("asc");
        setSavePreSortedOrder(false);
        setAttributeName("");
    };

    return (
        <>
            {/* Standardized content area */}
            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                <div>
                    <p className="font-semibold mb-2">Variable View Columns</p>
                    <ul className="border border-border p-2 h-40 overflow-auto">
                        {columns.map((col) => (
                            <li
                                key={col}
                                className={`p-1 cursor-pointer hover:bg-accent ${
                                    selectedColumn === col ? "bg-muted" : ""
                                }`}
                                onClick={() => handleSelectColumn(col)}
                            >
                                {col}
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <p className="font-semibold mb-2">Sort Order</p>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input
                                type="radio"
                                name="sortOrder"
                                checked={sortOrder === "asc"}
                                onChange={() => setSortOrder("asc")}
                            />
                            Ascending
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input
                                type="radio"
                                name="sortOrder"
                                checked={sortOrder === "desc"}
                                onChange={() => setSortOrder("desc")}
                            />
                            Descending
                        </label>
                    </div>
                </div>

            </div>

            {/* Standardized action buttons footer */}
            <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0 flex justify-end space-x-3">
                <Button onClick={handleOk}>
                    OK
                </Button>
                <Button variant="outline" onClick={handleReset}>
                    Reset
                </Button>
                <Button variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button variant="outline" onClick={() => alert("Help dialog here")}>
                    Help
                </Button>
            </div>
        </>
    );
};

// Main component that handles different container types
const SortVariablesModal: React.FC<SortVariablesModalProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    // If sidebar mode, use a div container
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <SortVariablesContent onClose={onClose} />
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent with standardized structure
    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-md p-0 bg-popover text-popover-foreground border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
                {/* Dialog Header */}
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-[22px] font-semibold">Sort Variables</DialogTitle>
                </DialogHeader>
                 {/* Content Wrapper */}
                <div className="flex-grow flex flex-col overflow-hidden">
                    <SortVariablesContent onClose={onClose} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SortVariablesModal;