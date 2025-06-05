import { useState } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { Variable } from "@/types/Variable";

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

interface UseSortVariablesProps {
    onClose: () => void;
}

export const useSortVariables = ({ onClose }: UseSortVariablesProps) => {
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
            // Potentially notify user via UI state
        }
    };

    const handleOk = async () => {
        if (!selectedColumn) {
            alert("Please select a column to sort"); // Consider replacing alert with UI notification
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

            const originalVariableOrder = [...variables];
            await sortVariables(sortOrder, columnIndex);

            if (data.length > 0) {
                const columnMapping = new Map<number, number>();
                variables.forEach((variable) => {
                    const originalVariable = originalVariableOrder.find(v => v.id === variable.id);
                    if (originalVariable) {
                        columnMapping.set(originalVariable.columnIndex, variable.columnIndex);
                    }
                });

                const newData = data.map(row => {
                    const newRow = Array(row.length).fill("");
                    originalVariableOrder.forEach(variable => {
                        const oldIndex = variable.columnIndex;
                        const newIndex = columnMapping.get(oldIndex);

                        if (newIndex !== undefined && oldIndex < row.length) {
                            newRow[newIndex] = row[oldIndex];
                        }
                    });
                    return newRow;
                });
                await setData(newData);
            }
            onClose();
        } catch (error) {
            console.error("Error sorting variables:", error);
            alert("An error occurred while sorting variables"); // Consider replacing alert with UI notification
        }
    };

    const handleReset = () => {
        setSelectedColumn(null);
        setSortOrder("asc");
        setSavePreSortedOrder(false);
        setAttributeName("");
    };

    return {
        columns,
        selectedColumn,
        sortOrder,
        savePreSortedOrder,
        attributeName,
        handleSelectColumn,
        setSortOrder,
        setSavePreSortedOrder,
        setAttributeName,
        handleOk,
        handleReset,
        // Exposing variables and data for potential direct use if needed, though typically props would flow down
        variables, 
        data 
    };
}; 