"use client";

import React, { useState } from "react";
import {
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

const SortVariablesModal: React.FC<SortVariablesModalProps> = ({ onClose }) => {
    const { variables, sortVariables } = useVariableStore();
    const { data, setDataAndSync } = useDataStore();

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
                await setDataAndSync(newData);
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
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Sort Variables</DialogTitle>
            </DialogHeader>

            <div className="mb-4">
                <p className="font-semibold mb-2">Variable View Columns</p>
                <ul className="border p-2 h-40 overflow-auto">
                    {columns.map((col) => (
                        <li
                            key={col}
                            className={`p-1 cursor-pointer hover:bg-gray-100 ${
                                selectedColumn === col ? "bg-gray-200" : ""
                            }`}
                            onClick={() => handleSelectColumn(col)}
                        >
                            {col}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mb-4">
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

            <div className="mb-4 border p-2 rounded">
                <label className="flex items-center gap-2 mb-2">
                    <input
                        type="checkbox"
                        checked={savePreSortedOrder}
                        onChange={() => setSavePreSortedOrder((prev) => !prev)}
                    />
                    Save the current (pre-sorted) variable order in a new attribute
                </label>
                {savePreSortedOrder && (
                    <div className="mt-2">
                        <label className="block mb-1">Attribute name:</label>
                        <input
                            type="text"
                            value={attributeName}
                            onChange={(e) => setAttributeName(e.target.value)}
                            className="border p-1 w-full"
                            disabled={!savePreSortedOrder}
                        />
                    </div>
                )}
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={handleOk}>
                    OK
                </Button>
                <Button variant="outline" onClick={() => alert("Paste syntax here")}>
                    Paste
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
            </DialogFooter>
        </DialogContent>
    );
};

export default SortVariablesModal;