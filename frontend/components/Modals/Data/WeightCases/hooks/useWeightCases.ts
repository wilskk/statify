import { useState, useEffect, useCallback } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useMetaStore } from "@/stores/useMetaStore";
import { Variable } from "@/types/Variable";

interface UseWeightCasesProps {
    onClose: () => void;
}

export const useWeightCases = ({ onClose }: UseWeightCasesProps) => {
    const { variables } = useVariableStore();
    const meta = useMetaStore((state) => state.meta);
    const setMeta = useMetaStore((state) => state.setMeta);

    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [frequencyVariables, setFrequencyVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{ id: string; source: string } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);

    const weightMethod = frequencyVariables.length > 0 ? "byVariable" : "none";

    const ensureUniqueTempId = useCallback((variable: Variable): Variable => {
        // Ensure tempId is always fresh for list operations if not present or to break React key issues
        return {
            ...variable,
            tempId: `weight_temp_${variable.columnIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
    }, []);

    useEffect(() => {
        const numericVariables = variables
            .filter(v => v.name !== "" && v.type !== "STRING")
            .map(ensureUniqueTempId);

        if (meta.weight && meta.weight !== "") {
            const weightVar = numericVariables.find(v => v.name === meta.weight);
            if (weightVar) {
                setFrequencyVariables([ensureUniqueTempId(weightVar)]); // Ensure it has a fresh tempId
                setAvailableVariables(numericVariables.filter(v => v.name !== meta.weight));
            } else {
                setAvailableVariables(numericVariables);
                setFrequencyVariables([]);
            }
        } else {
            setAvailableVariables(numericVariables);
            setFrequencyVariables([]);
        }
    }, [variables, meta.weight, ensureUniqueTempId]);

    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string) => {
        const variableWithFreshTempId = ensureUniqueTempId(variable);

        if (toListId === 'frequency' && variableWithFreshTempId.type === "STRING") {
            setErrorMessage("Weight variable must be numeric");
            setErrorDialogOpen(true);
            return;
        }

        if (fromListId === 'available') {
            setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (fromListId === 'frequency') {
            setFrequencyVariables([]); // Clear current frequency variable
        }

        if (toListId === 'available') {
            setAvailableVariables(prev => [...prev, variableWithFreshTempId].sort((a, b) => a.columnIndex - b.columnIndex));
        } else if (toListId === 'frequency') {
            // Move current frequency variable back to available if exists
            if (frequencyVariables.length > 0 && frequencyVariables[0].tempId !== variableWithFreshTempId.tempId) {
                const currentFreqVar = ensureUniqueTempId(frequencyVariables[0]);
                setAvailableVariables(prev => {
                    const filtered = prev.filter(v => v.name !== currentFreqVar.name);
                    return [...filtered, currentFreqVar].sort((a, b) => a.columnIndex - b.columnIndex);
                });
            }
            setFrequencyVariables([variableWithFreshTempId]);
        }
        setHighlightedVariable(null);
    }, [frequencyVariables, ensureUniqueTempId]);

    const handleReorderVariable = useCallback((listId: string, reorderedVariables: Variable[]) => {
        if (listId === 'available') {
            setAvailableVariables(reorderedVariables.map(ensureUniqueTempId));
        } else if (listId === 'frequency') {
            setFrequencyVariables(reorderedVariables.map(ensureUniqueTempId));
        }
    }, [ensureUniqueTempId]);

    const handleSave = () => {
        if (frequencyVariables.length > 0) {
            setMeta({ weight: frequencyVariables[0].name });
        } else {
            setMeta({ weight: "" });
        }
        onClose();
    };

    const handleReset = () => {
        if (frequencyVariables.length > 0) {
            const varsToMove = frequencyVariables.map(ensureUniqueTempId);
            setAvailableVariables(prev => {
                const nameSet = new Set(varsToMove.map(v => v.name));
                const filtered = prev.filter(v => !nameSet.has(v.name));
                return [...filtered, ...varsToMove].sort((a, b) => a.columnIndex - b.columnIndex);
            });
            setFrequencyVariables([]);
        }
        // Re-initialize availableVariables from scratch based on numeric variables
        const numericVariables = variables
            .filter(v => v.name !== "" && v.type !== "STRING")
            .map(ensureUniqueTempId);
        setAvailableVariables(numericVariables);
        setFrequencyVariables([]); // Ensure frequency is cleared
        setMeta({ weight: "" }); // Also reset meta store's weight
        setHighlightedVariable(null);
        setErrorMessage(null);
        setErrorDialogOpen(false);
    };

    return {
        availableVariables,
        frequencyVariables,
        highlightedVariable,
        setHighlightedVariable,
        errorMessage,
        errorDialogOpen,
        setErrorDialogOpen, // Expose setter for dialog
        weightMethod,
        handleMoveVariable,
        handleReorderVariable,
        handleSave,
        handleReset
    };
}; 