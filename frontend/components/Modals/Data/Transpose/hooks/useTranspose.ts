import { useState, useEffect, useCallback } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { Variable } from "@/types/Variable";

interface UseTransposeProps {
    onClose: () => void;
}

export const useTranspose = ({ onClose }: UseTransposeProps) => {
    const { variables, overwriteVariables } = useVariableStore();
    const { data, setData } = useDataStore();

    const prepareVariablesWithTempId = useCallback((vars: Variable[]) => {
        return vars.map(v => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));
    }, []);

    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [nameVariables, setNameVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{
        id: string;
        source: string;
    } | null>(null);

    useEffect(() => {
        if (variables.length > 0) {
            const varsWithTempId = prepareVariablesWithTempId(variables);
            const initialAvailable: Variable[] = varsWithTempId;
            setAvailableVariables(initialAvailable);
            setSelectedVariables([]);
            setNameVariables([]);
        }
    }, [variables, prepareVariablesWithTempId]);

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        if (fromListId === 'available') {
            setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (fromListId === 'selected') {
            setSelectedVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (fromListId === 'name') {
            setNameVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        }

        if (toListId === 'available') {
            setAvailableVariables(prev => [...prev, variable]);
        } else if (toListId === 'selected') {
            setSelectedVariables(prev => [...prev, variable]);
        } else if (toListId === 'name') {
            setNameVariables([variable]);
        }
        setHighlightedVariable(null);
    }, []);

    const handleReorderVariable = useCallback((listId: string, reorderedVariables: Variable[]) => {
        if (listId === 'available') {
            setAvailableVariables(reorderedVariables);
        } else if (listId === 'selected') {
            setSelectedVariables(reorderedVariables);
        }
    }, []);

    const processVariableName = (name: string, existingVars: Variable[]): string => {
        let processedName = name || "Var1";
        if (!/^[a-zA-Z@#$]/.test(processedName)) {
            processedName = 'var_' + processedName;
        }
        processedName = processedName
            .replace(/[^a-zA-Z0-9@#$_.]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/\.$/, '_');
        if (processedName.length > 64) {
            processedName = processedName.substring(0, 64);
        }
        const existingNames = existingVars.map(v => v.name.toLowerCase());
        if (existingNames.includes(processedName.toLowerCase())) {
            let counter = 1;
            let uniqueName = processedName;
            while (existingNames.includes(uniqueName.toLowerCase())) {
                uniqueName = `${processedName.substring(0, Math.min(60, processedName.length))}_${counter}`;
                counter++;
            }
            processedName = uniqueName;
        }
        return processedName;
    };

    const handleOk = async () => {
        if (selectedVariables.length === 0) {
            onClose();
            return;
        }
        try {
            const variablesToTranspose = selectedVariables;
            const nameVariable = nameVariables.length > 0 ? nameVariables[0] : null;
            const transposedData: (string | number)[][] = [];
            const newBaseVariables: Variable[] = [];

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
            newBaseVariables.push(caseLabelVariable);

            const caseCount = data.length;
            const newColVariables: Variable[] = [];
            for (let i = 0; i < caseCount; i++) {
                let varName: string;
                if (nameVariable && data[i] && data[i][nameVariable.columnIndex] !== undefined) {
                    const nameValue = data[i][nameVariable.columnIndex];
                    varName = (typeof nameValue === 'number') ? `V${nameValue}` : String(nameValue);
                } else {
                    varName = `Var${i + 1}`;
                }
                varName = processVariableName(varName, [...newBaseVariables, ...newColVariables]);
                const newVar: Variable = {
                    columnIndex: i + 1,
                    name: varName,
                    type: "NUMERIC",
                    width: 8,
                    decimals: 2,
                    label: "",
                    columns: 64,
                    align: "right",
                    measure: "scale",
                    role: "input",
                    values: [],
                    missing: null
                };
                newColVariables.push(newVar);
            }
            const finalTransposedVariables = [...newBaseVariables, ...newColVariables];

            for (let varIdx = 0; varIdx < variablesToTranspose.length; varIdx++) {
                const variable = variablesToTranspose[varIdx];
                const newRow: (string | number)[] = [variable.name];
                for (let caseIdx = 0; caseIdx < caseCount; caseIdx++) {
                    newRow.push(data[caseIdx]?.[variable.columnIndex] ?? "");
                }
                transposedData.push(newRow);
            }

            await setData(transposedData);
            await overwriteVariables(finalTransposedVariables);
            onClose();
        } catch (error) {
            console.error("Transpose operation failed:", error);
            onClose(); 
        }
    };

    const handleReset = () => {
        if (variables.length > 0) {
            const varsWithTempId = prepareVariablesWithTempId(variables);
            setAvailableVariables(varsWithTempId);
            setSelectedVariables([]);
            setNameVariables([]);
        }
        setHighlightedVariable(null);
    };

    return {
        availableVariables,
        selectedVariables,
        nameVariables,
        highlightedVariable,
        setHighlightedVariable,
        getDisplayName,
        handleMoveVariable,
        handleReorderVariable,
        handleOk,
        handleReset,
    };
}; 