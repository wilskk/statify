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
    // Get store functions
    const { variables, sortVariables } = useVariableStore();
    const { data, setDataAndSync, swapColumns } = useDataStore();

    // Daftar kolom Variable View yang bisa dipilih
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

    // Kolom yang dipilih untuk diurutkan
    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

    // Sort order: "asc" atau "desc"
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    // State untuk opsi "Save the current (pre-sorted) variable order..."
    const [savePreSortedOrder, setSavePreSortedOrder] = useState<boolean>(false);
    const [attributeName, setAttributeName] = useState<string>("");

    // Event handler untuk memilih kolom
    const handleSelectColumn = (column: string) => {
        setSelectedColumn(column);
    };

    // Helper function to save original order
    const saveOriginalOrder = () => {
        if (!attributeName.trim() || !savePreSortedOrder) return;

        try {
            // Save original variable order with variable name and position
            const originalOrder = variables.map((variable, index) => ({
                name: variable.name,
                position: index
            }));

            localStorage.setItem(`variableOrder_${attributeName}`, JSON.stringify(originalOrder));
            console.log(`Original order saved as ${attributeName}`);
        } catch (error) {
            console.error("Error saving original order:", error);
        }
    };

    // Tombol OK
    const handleOk = async () => {
        if (!selectedColumn) {
            alert("Please select a column to sort");
            return;
        }

        try {
            // Get the field name for the selected column
            const fieldName = columnToFieldMap[selectedColumn];

            if (!fieldName) {
                throw new Error(`Column ${selectedColumn} not found in mapping`);
            }

            // Get column index for sorting
            const columnIndex = fieldToColumnIndex[fieldName as string];

            if (columnIndex === undefined) {
                throw new Error(`Field ${fieldName} not found in column index mapping`);
            }

            // Save original order if requested
            if (savePreSortedOrder) {
                saveOriginalOrder();
            }

            // Get the original variable order to track column movements
            const originalVariables = [...variables];

            // Execute the variable sort
            await sortVariables(sortOrder, columnIndex);

            // Now we need to reorganize the data columns to match the new variable order
            // This is necessary because sortVariables only sorts the variable definitions,
            // not the actual data in those columns
            if (data.length > 0) {
                // Create a mapping of original columnIndex to new position
                const reorderMap = new Map();

                variables.forEach((variable, newIndex) => {
                    // Find this variable's original position
                    const originalPosition = originalVariables.findIndex(v =>
                        v.id === variable.id
                    );

                    if (originalPosition !== -1) {
                        reorderMap.set(originalVariables[originalPosition].columnIndex, variable.columnIndex);
                    }
                });

                // Apply column reordering to actual data
                const newData = structuredClone(data);

                // For each row of data
                for (let rowIndex = 0; rowIndex < newData.length; rowIndex++) {
                    const row = newData[rowIndex];
                    const newRow = Array(row.length).fill("");

                    // Reorder the cells in this row according to the new column order
                    originalVariables.forEach((variable, oldColIndex) => {
                        const newColIndex = reorderMap.get(variable.columnIndex);
                        if (newColIndex !== undefined && oldColIndex < row.length) {
                            newRow[newColIndex] = row[oldColIndex];
                        }
                    });

                    newData[rowIndex] = newRow;
                }

                // Apply the reordered data
                await setDataAndSync(newData);
            }

            // Close the modal
            onClose();
        } catch (error) {
            console.error("Error sorting variables:", error);
            alert("An error occurred while sorting variables");
        }
    };

    // Tombol Reset
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

            {/* Daftar "Variable View Columns" */}
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

            {/* Sort Order */}
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

            {/* Save the current (pre-sorted) variable order */}
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

            {/* Action Buttons */}
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