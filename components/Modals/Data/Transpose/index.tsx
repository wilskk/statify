"use client";

import React, { useState, useEffect } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    CornerDownRight,
    CornerDownLeft,
    Shapes,
    Ruler,
    BarChartHorizontal
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { Variable } from "@/types/Variable";

interface TransposeModalProps {
    onClose: () => void;
}

const TransposeModal: React.FC<TransposeModalProps> = ({ onClose }) => {
    // Get store data
    const { variables, overwriteVariables } = useVariableStore();
    const { data, setDataAndSync } = useDataStore();

    // Filter variables to handle in UI
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [nameVariables, setNameVariables] = useState<Variable[]>([]);

    // Selected variable for highlight
    const [highlightedVariable, setHighlightedVariable] = useState<{
        id: string;
        source: "available" | "selected" | "name";
    } | null>(null);

    // Initialize variables from store
    useEffect(() => {
        if (variables.length > 0) {
            // Initialize with variables from the store
            const initialSelected: Variable[] = [];
            const initialName: Variable[] = [];
            const initialAvailable: Variable[] = variables.filter((v, idx) => {
                // First variable as name variable by default
                if (idx === 0) {
                    initialName.push(v);
                    return false;
                }
                // Second variable as selected by default
                if (idx === 1) {
                    initialSelected.push(v);
                    return false;
                }
                return true;
            });

            setAvailableVariables(initialAvailable);
            setSelectedVariables(initialSelected);
            setNameVariables(initialName);
        }
    }, [variables]);

    // Get variable icon based on measure
    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            default:
                return <Shapes size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
        }
    };

    // Function to move a variable from left to right
    const moveToSelected = (variable: Variable) => {
        setAvailableVariables((prev) => prev.filter((v) => v.columnIndex !== variable.columnIndex));
        setSelectedVariables((prev) => [...prev, variable]);
        setHighlightedVariable(null);
    };

    // Function to move a variable from right to left
    const moveToAvailable = (variable: Variable) => {
        setSelectedVariables((prev) => prev.filter((v) => v.columnIndex !== variable.columnIndex));
        setAvailableVariables((prev) => [...prev, variable]);
        setHighlightedVariable(null);
    };

    // Function to move a variable to name variable field
    const moveToNameVariable = (variable: Variable) => {
        setAvailableVariables((prev) => prev.filter((v) => v.columnIndex !== variable.columnIndex));
        // Replace existing name variable (only allow one)
        setNameVariables([variable]);
        setHighlightedVariable(null);
    };

    // Function to move name variable back to available
    const moveNameToAvailable = (variable: Variable) => {
        setNameVariables([]);
        setAvailableVariables((prev) => [...prev, variable]);
        setHighlightedVariable(null);
    };

    // Handle variable selection for highlighting
    const handleVariableSelect = (columnIndex: number, source: "available" | "selected" | "name") => {
        const variableId = columnIndex.toString();

        if (
            highlightedVariable?.id === variableId &&
            highlightedVariable?.source === source
        ) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({
                id: variableId,
                source,
            });
        }
    };

    // Handle variable double click
    const handleVariableDoubleClick = (columnIndex: number, source: "available" | "selected" | "name") => {
        if (source === "available") {
            const variable = availableVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveToSelected(variable);
            }
        } else if (source === "selected") {
            const variable = selectedVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveToAvailable(variable);
            }
        } else if (source === "name") {
            const variable = nameVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveNameToAvailable(variable);
            }
        }
    };

    // Handle transfer button click for variables list
    const handleVariableTransferClick = () => {
        if (!highlightedVariable) return;

        const columnIndex = parseInt(highlightedVariable.id);

        if (highlightedVariable.source === "available") {
            const variable = availableVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveToSelected(variable);
            }
        } else if (highlightedVariable.source === "selected") {
            const variable = selectedVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveToAvailable(variable);
            }
        }
    };

    // Handle transfer button click for name variable
    const handleNameVariableTransferClick = () => {
        if (!highlightedVariable) return;

        const columnIndex = parseInt(highlightedVariable.id);

        if (highlightedVariable.source === "available") {
            const variable = availableVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveToNameVariable(variable);
            }
        } else if (highlightedVariable.source === "name") {
            const variable = nameVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveNameToAvailable(variable);
            }
        }
    };

    // Process variable name to ensure it's valid and unique
    const processVariableName = (name: string, existingVariables: Variable[]): string => {
        if (!name) {
            return "Var1";
        }

        let processedName = name;

        // Start with a letter, @ or $
        if (!/^[a-zA-Z@#$]/.test(processedName)) {
            processedName = 'var_' + processedName;
        }

        // Replace invalid characters
        processedName = processedName
            .replace(/[^a-zA-Z0-9@#$_.]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/\.$/, '_');

        // Max length 64
        if (processedName.length > 64) {
            processedName = processedName.substring(0, 64);
        }

        // Ensure uniqueness
        const existingNames = existingVariables.map(v => v.name.toLowerCase());
        if (existingNames.includes(processedName.toLowerCase())) {
            let counter = 1;
            let uniqueName = processedName;

            while (existingNames.includes(uniqueName.toLowerCase())) {
                uniqueName = `${processedName.substring(0, 60)}_${counter}`;
                counter++;
            }

            processedName = uniqueName;
        }

        return processedName;
    };

    // Handle OK button click - perform the transpose operation
    const handleOk = async () => {
        if (selectedVariables.length === 0) {
            onClose();
            return;
        }

        try {
            // Step 1: Extract the data we need to transpose
            const variablesToTranspose = selectedVariables;
            const nameVariable = nameVariables.length > 0 ? nameVariables[0] : null;

            // Create a new transposed dataset
            const transposedData: (string | number)[][] = [];
            const transposedVariables: Variable[] = [];

            // Step 2: Create case_lbl variable (first column in new dataset)
            const caseLabelVariable: Variable = {
                columnIndex: 0,
                name: "case_lbl",
                type: "STRING",
                width: 64,
                decimals: 0,
                label: "Original Variable Name",
                values: [],
                missing: [],
                columns: 64,
                align: "left",
                measure: "nominal",
                role: "input"
            };

            transposedVariables.push(caseLabelVariable);

            // Step 3: Create variables for each case in the original dataset
            const caseCount = data.length;
            const newVariables: Variable[] = [];

            for (let i = 0; i < caseCount; i++) {
                let varName: string;

                // If name variable exists, use its value for the new variable name
                if (nameVariable && data[i] && data[i][nameVariable.columnIndex] !== undefined) {
                    const nameValue = data[i][nameVariable.columnIndex];

                    // If numeric, prefix with V
                    if (typeof nameValue === 'number') {
                        varName = `V${nameValue}`;
                    } else {
                        varName = String(nameValue);
                    }
                } else {
                    // Default naming
                    varName = `Var${i + 1}`;
                }

                // Process variable name to ensure it's valid
                varName = processVariableName(varName, [...transposedVariables, ...newVariables]);

                const newVar: Variable = {
                    columnIndex: i + 1,
                    name: varName,
                    type: "NUMERIC", // Default to numeric, could be refined based on data content
                    width: 8,
                    decimals: 2,
                    label: "",
                    values: [],
                    missing: [],
                    columns: 8,
                    align: "right",
                    measure: "scale",
                    role: "input"
                };

                newVariables.push(newVar);
            }

            transposedVariables.push(...newVariables);

            // Step 4: Create the transposed data rows
            for (let varIdx = 0; varIdx < variablesToTranspose.length; varIdx++) {
                const variable = variablesToTranspose[varIdx];
                const newRow: (string | number)[] = [];

                // First cell is the original variable name
                newRow.push(variable.name);

                // Add data from each case
                for (let caseIdx = 0; caseIdx < caseCount; caseIdx++) {
                    if (data[caseIdx] && data[caseIdx][variable.columnIndex] !== undefined) {
                        newRow.push(data[caseIdx][variable.columnIndex]);
                    } else {
                        newRow.push("");
                    }
                }

                transposedData.push(newRow);
            }

            // Step 5: Update data and variables in stores
            await setDataAndSync(transposedData);
            await overwriteVariables(transposedVariables);

            onClose();
        } catch (error) {
            console.error("Transpose operation failed:", error);
            onClose();
        }
    };

    // Handle Reset button click
    const handleReset = () => {
        // Reset to initial state - use first variable as name and second as selected
        if (variables.length > 0) {
            const initialSelected: Variable[] = [];
            const initialName: Variable[] = [];
            const initialAvailable: Variable[] = variables.filter((v, idx) => {
                if (idx === 0) {
                    initialName.push(v);
                    return false;
                }
                if (idx === 1) {
                    initialSelected.push(v);
                    return false;
                }
                return true;
            });

            setAvailableVariables(initialAvailable);
            setSelectedVariables(initialSelected);
            setNameVariables(initialName);
        }

        setHighlightedVariable(null);
    };

    // Render variable list
    const renderVariableList = (variables: Variable[], source: 'available' | 'selected' | 'name', height?: string) => (
        <div className={`border border-[#E6E6E6] p-2 rounded-md ${height ? 'overflow-y-auto overflow-x-hidden' : ''}`} style={height ? { height } : {}}>
            <div className="space-y-1">
                {variables.map((variable) => (
                    <TooltipProvider key={variable.columnIndex}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-[#F7F7F7] ${
                                        highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === source
                                            ? "bg-[#E6E6E6] border-[#888888]"
                                            : "border-[#CCCCCC]"
                                    }`}
                                    onClick={() => handleVariableSelect(variable.columnIndex, source)}
                                    onDoubleClick={() => handleVariableDoubleClick(variable.columnIndex, source)}
                                >
                                    <div className="flex items-center w-full">
                                        {getVariableIcon(variable)}
                                        <span className="text-xs truncate">{variable.name}</span>
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p className="text-xs">{variable.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>
        </div>
    );

    return (
        <DialogContent className="max-w-[550px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Transpose</DialogTitle>
            </DialogHeader>

            <div className="p-6 overflow-y-auto flex-grow">
                <div className="grid grid-cols-12 gap-4">
                    {/* Left column with available variables */}
                    <div className="col-span-5">
                        <div className="text-sm mb-2 font-medium">Variables:</div>
                        {renderVariableList(availableVariables, 'available', '220px')}
                    </div>

                    {/* Middle column with transfer buttons */}
                    <div className="col-span-2 flex flex-col items-center justify-center">
                        <div className="flex flex-col items-center space-y-4">
                            <Button
                                variant="outline"
                                size="sm"
                                className="p-0 w-10 h-10 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                onClick={handleVariableTransferClick}
                                disabled={!highlightedVariable || (highlightedVariable.source !== 'available' && highlightedVariable.source !== 'selected')}
                            >
                                {highlightedVariable?.source === 'selected' ?
                                    <CornerDownLeft size={20} /> :
                                    <CornerDownRight size={20} />
                                }
                            </Button>
                        </div>
                    </div>

                    {/* Right column with selected variables and name variable */}
                    <div className="col-span-5 space-y-5">
                        <div>
                            <div className="text-sm mb-2 font-medium">Variable(s):</div>
                            {renderVariableList(selectedVariables, 'selected', '150px')}
                        </div>

                        <div>
                            <div className="flex items-center mb-2">
                                <div className="text-sm font-medium">Name Variable:</div>
                            </div>
                            <div className="flex gap-2 items-start">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] mt-1"
                                    onClick={handleNameVariableTransferClick}
                                    disabled={!highlightedVariable || (highlightedVariable.source !== 'available' && highlightedVariable.source !== 'name')}
                                >
                                    {highlightedVariable?.source === 'name' ?
                                        <CornerDownLeft size={16} /> :
                                        <CornerDownRight size={16} />
                                    }
                                </Button>
                                <div className="flex-grow">
                                    {renderVariableList(nameVariables, 'name', '40px')}
                                </div>
                            </div>
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
                    >
                        Help
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
};

export default TransposeModal;