"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    InfoIcon
} from "lucide-react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { Variable } from "@/types/Variable";
import VariableListManager, { TargetListConfig } from "@/components/Common/VariableListManager";

interface TransposeModalProps {
    onClose: () => void;
}

const TransposeModal: React.FC<TransposeModalProps> = ({ onClose }) => {
    // Get store data
    const { variables, overwriteVariables } = useVariableStore();
    const { data, setDataAndSync } = useDataStore();

    // Prepare variables with tempId
    const prepareVariablesWithTempId = useCallback((vars: Variable[]) => {
        return vars.map(v => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));
    }, []);

    // Filter variables to handle in UI
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [nameVariables, setNameVariables] = useState<Variable[]>([]);

    // Selected variable for highlight - updated to match VariableListManager format
    const [highlightedVariable, setHighlightedVariable] = useState<{
        id: string;
        source: string;
    } | null>(null);

    // Initialize variables from store
    useEffect(() => {
        if (variables.length > 0) {
            // Add tempId to variables
            const varsWithTempId = prepareVariablesWithTempId(variables);

            // Initialize with variables from the store
            const initialSelected: Variable[] = [];
            const initialName: Variable[] = [];
            const initialAvailable: Variable[] = varsWithTempId.filter((v, idx) => {
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
    }, [variables, prepareVariablesWithTempId]);

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
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-gray-600 mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
        }
    };

    // Get variable display name
    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    // Handler for moving variables between lists - compatible with VariableListManager
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        // Remove from source list
        if (fromListId === 'available') {
            setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (fromListId === 'selected') {
            setSelectedVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (fromListId === 'name') {
            setNameVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        }

        // Add to target list
        if (toListId === 'available') {
            setAvailableVariables(prev => [...prev, variable]);
        } else if (toListId === 'selected') {
            setSelectedVariables(prev => [...prev, variable]);
        } else if (toListId === 'name') {
            // Name variable can only have one variable, so replace it
            setNameVariables([variable]);
        }

        // Clear highlight
        setHighlightedVariable(null);
    }, []);

    // Handler for reordering variables within a list - compatible with VariableListManager
    const handleReorderVariable = useCallback((listId: string, reorderedVariables: Variable[]) => {
        if (listId === 'available') {
            setAvailableVariables(reorderedVariables);
        } else if (listId === 'selected') {
            setSelectedVariables(reorderedVariables);
        }
        // Reordering is not applicable for name list as it only has one item
    }, []);

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
                columns: 64,
                align: "left",
                measure: "nominal",
                role: "input",
                values: [],
                missing: null
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
                    columns: 8,
                    align: "right",
                    measure: "scale",
                    role: "input",
                    values: [],
                    missing: null
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
            const varsWithTempId = prepareVariablesWithTempId(variables);

            const initialSelected: Variable[] = [];
            const initialName: Variable[] = [];
            const initialAvailable: Variable[] = varsWithTempId.filter((v, idx) => {
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

    // Configure target lists for VariableListManager
    const selectedListConfig: TargetListConfig = {
        id: 'selected',
        title: 'Variable(s):',
        variables: selectedVariables,
        height: '150px',
        droppable: true,
        draggableItems: true
    };

    const nameListConfig: TargetListConfig = {
        id: 'name',
        title: 'Name Variable:',
        variables: nameVariables,
        height: '40px',
        maxItems: 1, // Only allow one item
        droppable: true,
        draggableItems: false // No need to reorder since it's just one item
    };

    return (
        <DialogContent className="max-w-[550px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Transpose</DialogTitle>
            </DialogHeader>

            <div className="p-6 overflow-y-auto flex-grow">
                <div className="space-y-6">
                    {/* Variable List Manager */}
                    <VariableListManager
                        availableVariables={availableVariables}
                        targetLists={[selectedListConfig, nameListConfig]}
                        variableIdKey="tempId"
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        onMoveVariable={handleMoveVariable}
                        onReorderVariable={handleReorderVariable}
                        getVariableIcon={getVariableIcon}
                        getDisplayName={getDisplayName}
                        showArrowButtons={true}
                        availableListHeight="220px"
                    />

                    {/* Info Text */}
                    <div className="text-xs text-[#888888] flex items-center">
                        <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                        <span>Variables become cases and cases become variables. The name variable (optional) provides names for the new variables.</span>
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