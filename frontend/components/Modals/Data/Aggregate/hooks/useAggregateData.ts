import { useState, useEffect, useCallback } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useModalStore } from "@/stores/useModalStore";
import { Variable, VariableType, VariableMeasure } from "@/types/Variable";
import { AggregatedVariable } from "../types";
import {
    createVariableName,
    mapUIFunctionToCalculationFunction,
    getFunctionDisplay,
    calculateAggregateValue
} from "../aggregateUtils";

export const useAggregateData = () => {
    const { variables } = useVariableStore();
    const { data, updateCells } = useDataStore();
    const { setStatisticProgress } = useModalStore();

    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [breakVariables, setBreakVariables] = useState<Variable[]>([]);
    const [aggregatedVariables, setAggregatedVariables] = useState<AggregatedVariable[]>([]);

    const [activeTab, setActiveTab] = useState("variables");

    useEffect(() => {
        setAvailableVariables(variables.filter(v => v.name !== ""));
    }, [variables]);

    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available' | 'break' | 'aggregated'} | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);

    const [functionDialogOpen, setFunctionDialogOpen] = useState<boolean>(false);
    const [functionCategory, setFunctionCategory] = useState<"summary" | "specific" | "cases" | "percentages">("summary");
    const [selectedFunction, setSelectedFunction] = useState<string>("MEAN");
    const [percentageType, setPercentageType] = useState<"above" | "below" | "inside" | "outside">("above");
    const [percentageValue, setPercentageValue] = useState<string>("");
    const [percentageLow, setPercentageLow] = useState<string>("");
    const [percentageHigh, setPercentageHigh] = useState<string>("");

    const [nameDialogOpen, setNameDialogOpen] = useState<boolean>(false);
    const [newVariableName, setNewVariableName] = useState<string>("");
    const [newVariableLabel, setNewVariableLabel] = useState<string>("");
    const [currentEditingVariable, setCurrentEditingVariable] = useState<AggregatedVariable | null>(null);

    // Save Tab state (to be implemented if SaveTab is used)
    const [datasetName, setDatasetName] = useState<string>("");
    const [filePath, setFilePath] = useState<string>("C:\\Users\\hp\\Downloads\\aggr.sav");
    const [saveOption, setSaveOption] = useState<"ADD" | "CREATE" | "WRITE">("ADD");

    // Options Tab state
    const [isAlreadySorted, setIsAlreadySorted] = useState<boolean>(false);
    const [sortBeforeAggregating, setSortBeforeAggregating] = useState<boolean>(false);
    const [addNumberOfCases, setAddNumberOfCases] = useState<boolean>(false);
    const [breakName, setBreakName] = useState<string>("N_BREAK");

    const getDisplayName = useCallback((variable: Variable | AggregatedVariable): string => {
        if ('label' in variable && variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    }, []);

    const handleVariableSelect = useCallback((columnIndex: number, source: 'available' | 'break' | 'aggregated') => {
        if (highlightedVariable?.id === columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: columnIndex.toString(), source });
        }
    }, [highlightedVariable]);

    const handleAggregatedVariableSelect = useCallback((aggId: string) => {
        if (highlightedVariable?.id === aggId && highlightedVariable.source === 'aggregated') {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: aggId, source: 'aggregated' });
        }
    }, [highlightedVariable]);

    const isVariableInAggregated = useCallback((columnIndex: number) => {
        return aggregatedVariables.some(v => v.baseVarColumnIndex === columnIndex);
    }, [aggregatedVariables]);

    const moveToBreak = useCallback((variable: Variable) => {
        if (!variable) return;

        if (isVariableInAggregated(variable.columnIndex)) {
            setErrorMessage("The target list accepts only variables that do not appear in another target list.");
            setErrorDialogOpen(true);
            return;
        }

        setBreakVariables(prev => [...prev, variable]);
        setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    }, [isVariableInAggregated]);

    const moveFromBreak = useCallback((variable: Variable) => {
        if (!variable) return;

        setAvailableVariables(prev => [...prev, variable]);
        setBreakVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    }, []);
    
    const getDefaultFunction = useCallback((variable: Variable): { functionCategory: "summary" | "specific" | "cases" | "percentages", function: string } => {
        if (variable.type === "STRING") {
            return { functionCategory: "specific", function: "FIRST" };
        } else {
            return { functionCategory: "summary", function: "MEAN" };
        }
    }, []);

    const moveToAggregated = useCallback((variable: Variable) => {
        if (!variable) return;

        const { functionCategory, function: uiFunc } = getDefaultFunction(variable);
        const calculationFunction = mapUIFunctionToCalculationFunction(uiFunc, "above");
        const existingNames = aggregatedVariables.map(v => v.name);
        const newName = createVariableName(variable.name, calculationFunction, existingNames);
        const displayFormula = getFunctionDisplay(calculationFunction, variable.name);

        const newAggregatedVar: AggregatedVariable = {
            aggregateId: `agg_${variable.columnIndex}_${Date.now()}`,
            baseVarColumnIndex: variable.columnIndex,
            baseVarName: variable.name,
            baseVarType: variable.type as VariableType,
            name: newName,
            displayName: `${newName} = ${displayFormula}`,
            type: variable.type as VariableType,
            measure: variable.measure,
            label: variable.label,
            function: uiFunc,
            calculationFunction,
            functionCategory
        };

        setAggregatedVariables(prev => [...prev, newAggregatedVar]);
        setHighlightedVariable(null);
    }, [aggregatedVariables, getDefaultFunction]);

    const moveFromAggregated = useCallback((variable: AggregatedVariable) => {
        if (!variable) return;

        setAggregatedVariables(prev => prev.filter(v => v.aggregateId !== variable.aggregateId));
        setHighlightedVariable(null);
    }, []);

    const handleVariableDoubleClick = useCallback((columnIndex: number, source: 'available' | 'break') => {
        if (source === 'break') {
            const variable = breakVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveFromBreak(variable);
            }
        } else if (source === 'available') {
            moveToBreak(availableVariables.find(v => v.columnIndex === columnIndex)!);
        }
    }, [availableVariables, breakVariables, moveFromBreak, moveToBreak]);

    const handleAggregatedDoubleClick = useCallback((aggId: string) => {
        moveFromAggregated(aggregatedVariables.find(v => v.aggregateId === aggId)!);
    }, [aggregatedVariables, moveFromAggregated]);

    const reorderBreakVariables = useCallback((variables: Variable[]) => {
        setBreakVariables([...variables]);
    }, []);

    const reorderAggregatedVariables = useCallback((variables: AggregatedVariable[]) => {
        setAggregatedVariables([...variables]);
    }, []);

    const handleTopArrowClick = useCallback(() => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'available') {
            const variable = availableVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
            if (variable) {
                moveToBreak(variable);
            }
        } else if (highlightedVariable.source === 'break') {
            const variable = breakVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
            if (variable) {
                moveFromBreak(variable);
            }
        }
    }, [availableVariables, breakVariables, highlightedVariable, moveFromBreak, moveToBreak]);

    const handleBottomArrowClick = useCallback(() => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'available') {
            const variable = availableVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
            if (variable) {
                moveToAggregated(variable);
            }
        } else if (highlightedVariable.source === 'aggregated') {
            const variable = aggregatedVariables.find(v => v.aggregateId === highlightedVariable.id);
            if (variable) {
                moveFromAggregated(variable);
            }
        }
    }, [availableVariables, aggregatedVariables, highlightedVariable, moveFromAggregated, moveToAggregated]);

    const handleFunctionClick = useCallback(() => {
        if (!highlightedVariable || highlightedVariable.source !== 'aggregated') {
            setErrorMessage("Please select an aggregated variable to change its function.");
            setErrorDialogOpen(true);
            return;
        }
        const variableToEdit = aggregatedVariables.find(v => v.aggregateId === highlightedVariable.id);
        if (variableToEdit) {
            setCurrentEditingVariable(variableToEdit);
            setFunctionCategory(variableToEdit.functionCategory);
            setSelectedFunction(variableToEdit.function);
            setPercentageType(variableToEdit.percentageType || "above");
            setPercentageValue(variableToEdit.percentageValue || "");
            setPercentageLow(variableToEdit.percentageLow || "");
            setPercentageHigh(variableToEdit.percentageHigh || "");
            setFunctionDialogOpen(true);
        }
    }, [aggregatedVariables, highlightedVariable]);

    const handleNameLabelClick = useCallback(() => {
        if (highlightedVariable && highlightedVariable.source === 'aggregated') {
            const variable = aggregatedVariables.find(v => v.aggregateId === highlightedVariable.id);
            if (variable) {
                setNewVariableName(variable.name);
                setNewVariableLabel(variable.label || "");
                setCurrentEditingVariable(variable);
                setNameDialogOpen(true);
            }
        }
    }, [aggregatedVariables, highlightedVariable]);

    const applyFunction = useCallback(() => {
        if (currentEditingVariable) {
            const oldFunction = currentEditingVariable.function;
            const functionChanged = oldFunction !== selectedFunction;
            const baseName = currentEditingVariable.baseVarName;
            const calculationFunction = mapUIFunctionToCalculationFunction(
                selectedFunction,
                functionCategory === "percentages" ? percentageType : undefined
            );

            let newName = currentEditingVariable.name;
            if (functionChanged) {
                const existingNames = aggregatedVariables
                    .filter(v => v.aggregateId !== currentEditingVariable.aggregateId)
                    .map(v => v.name);
                newName = createVariableName(baseName, calculationFunction, existingNames);
            }

            let displayFormula;
            if (functionCategory === "percentages") {
                if (["PGT", "PLT"].includes(calculationFunction)) {
                    displayFormula = getFunctionDisplay(calculationFunction, baseName, percentageValue);
                } else if (["PIN", "POUT"].includes(calculationFunction)) {
                    displayFormula = getFunctionDisplay(calculationFunction, baseName, undefined, percentageLow, percentageHigh);
                } else {
                    displayFormula = getFunctionDisplay(calculationFunction, baseName);
                }
            } else {
                displayFormula = getFunctionDisplay(calculationFunction, baseName);
            }

            const updatedVar: AggregatedVariable = {
                ...currentEditingVariable,
                function: selectedFunction,
                calculationFunction,
                functionCategory,
                name: newName,
                displayName: `${newName}${currentEditingVariable.label ? ` '${currentEditingVariable.label}'` : ''} = ${displayFormula}`
            };

            if (functionCategory === "percentages") {
                updatedVar.percentageType = percentageType;

                if (percentageType === "above" || percentageType === "below") {
                    updatedVar.percentageValue = percentageValue;
                    delete updatedVar.percentageLow;
                    delete updatedVar.percentageHigh;
                } else if (percentageType === "inside" || percentageType === "outside") {
                    delete updatedVar.percentageValue;
                    updatedVar.percentageLow = percentageLow;
                    updatedVar.percentageHigh = percentageHigh;
                }
            } else {
                delete updatedVar.percentageType;
                delete updatedVar.percentageValue;
                delete updatedVar.percentageLow;
                delete updatedVar.percentageHigh;
            }

            setAggregatedVariables(prev =>
                prev.map(v => v.aggregateId === currentEditingVariable.aggregateId ? updatedVar : v)
            );

            setFunctionDialogOpen(false);
            setCurrentEditingVariable(null);
        }
    }, [currentEditingVariable, selectedFunction, functionCategory, percentageType, aggregatedVariables, percentageValue, percentageLow, percentageHigh]);

    const applyNameLabel = useCallback(() => {
        if (currentEditingVariable) {
            const isNameDuplicate = aggregatedVariables.some(
                v => v.name === newVariableName && v.aggregateId !== currentEditingVariable.aggregateId
            );
            if (isNameDuplicate) {
                setErrorMessage("A variable with this name already exists.");
                setErrorDialogOpen(true);
                return;
            }

            let displayFormula;
            const func = currentEditingVariable.calculationFunction || currentEditingVariable.function;

            if (["PGT", "PLT", "FGT", "FLT"].includes(func) && currentEditingVariable.percentageValue) {
                displayFormula = getFunctionDisplay(
                    func,
                    currentEditingVariable.baseVarName,
                    currentEditingVariable.percentageValue
                );
            } else if (["PIN", "POUT", "FIN", "FOUT"].includes(func) &&
                currentEditingVariable.percentageLow &&
                currentEditingVariable.percentageHigh) {
                displayFormula = getFunctionDisplay(
                    func,
                    currentEditingVariable.baseVarName,
                    undefined,
                    currentEditingVariable.percentageLow,
                    currentEditingVariable.percentageHigh
                );
            } else {
                displayFormula = getFunctionDisplay(func, currentEditingVariable.baseVarName);
            }

            const updatedVar: AggregatedVariable = {
                ...currentEditingVariable,
                name: newVariableName,
                label: newVariableLabel !== "" ? newVariableLabel : undefined,
                displayName: `${newVariableName}${newVariableLabel ? ` '${newVariableLabel}'` : ''} = ${displayFormula}`
            };

            setAggregatedVariables(prev =>
                prev.map(v => v.aggregateId === currentEditingVariable.aggregateId ? updatedVar : v)
            );

            setNameDialogOpen(false);
            setCurrentEditingVariable(null);
        }
    }, [currentEditingVariable, aggregatedVariables, newVariableName, newVariableLabel]);

    const handleReset = useCallback(() => {
        setAvailableVariables(variables.filter(v => v.name !== ""));
        setBreakVariables([]);
        setAggregatedVariables([]);
        setHighlightedVariable(null);
        setIsAlreadySorted(false);
        setSortBeforeAggregating(false);
        setAddNumberOfCases(false);
        setBreakName("N_BREAK");
        setSaveOption("ADD");
        setDatasetName("");
        setFilePath("C:\\Users\\hp\\Downloads\\aggr.sav");
    }, [variables]);

    const handleConfirm = useCallback(async (closeModal: () => void) => {
        const variableStore = useVariableStore.getState();
        const dataStore = useDataStore.getState();
        setStatisticProgress(true);

        // Validation for number of cases variable
        if (addNumberOfCases) {
            if (!breakName.trim()) {
                setErrorMessage("The name for the 'Number of cases' variable cannot be empty.");
                setErrorDialogOpen(true);
                setStatisticProgress(false);
                return;
            }
            const allNewVarNames = aggregatedVariables.map(v => v.name);
            const allExistingVarNames = variableStore.variables.map(v => v.name);

            if (allExistingVarNames.includes(breakName) || allNewVarNames.includes(breakName)) {
                setErrorMessage(`The variable name '${breakName}' already exists.`);
                setErrorDialogOpen(true);
                setStatisticProgress(false);
                return;
            }
        }

        const groups: Record<string, { rowIndex: number; row: (string | number | null)[] }[]> = {};
        data.forEach((row, rowIndex) => {
            const key = breakVariables
                .map((bv: { columnIndex: number }) => row[bv.columnIndex])
                .join("|");
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push({ rowIndex, row });
        });

        const newVariables: Partial<Variable>[] = [];
        const bulkUpdates: { row: number; col: number; value: string | number }[] = [];
        let newVarIndex = variables.length;

        for (const aggVar of aggregatedVariables) {
            const currentVarIndex = newVarIndex;
            const calcFunction = aggVar.calculationFunction || aggVar.function;

            for (const groupKey in groups) {
                const groupRows = groups[groupKey];
                const values = groupRows.map(
                    (item: { rowIndex: number; row: (string | number | null)[] }) =>
                        item.row[aggVar.baseVarColumnIndex]
                );

                const aggregatedValue = calculateAggregateValue(
                    calcFunction,
                    values,
                    {
                        percentageValue: aggVar.percentageValue,
                        percentageLow: aggVar.percentageLow,
                        percentageHigh: aggVar.percentageHigh
                    }
                );

                groupRows.forEach((item: { rowIndex: number; row: (string | number | null)[] }) => {
                    bulkUpdates.push({
                        row: item.rowIndex,
                        col: currentVarIndex,
                        value: aggregatedValue ?? ""
                    });
                });
            }

            const aggregatedDataForVar = bulkUpdates
                .filter(update => update.col === currentVarIndex)
                .map(update => update.value);

            const nonEmptyData = aggregatedDataForVar.filter((d) => d !== null && d !== "");
            const allNumeric = nonEmptyData.every(
                (d) => typeof d === "number" || (!isNaN(Number(d)) && d !== "")
            );
            
            const type: VariableType = allNumeric ? "NUMERIC" : "STRING";
            let width = 8;
            if (type === "STRING") {
                const maxWidth = nonEmptyData.reduce((max: number, d: string | number | null): number => {
                    const strVal = String(d);
                    return Math.max(max, strVal.length);
                }, 0);
                width = Math.max(width, maxWidth);
            }
            
            const newVariable: Partial<Variable> = {
                columnIndex: currentVarIndex,
                name: aggVar.name,
                type,
                width,
                decimals: type === 'NUMERIC' ? 2 : 0,
                label: aggVar.label || "",
                measure: aggVar.measure,
                role: 'input'
            };
            newVariables.push(newVariable);
            newVarIndex++;
        }

        // Add number of cases variable if requested
        if (addNumberOfCases) {
            const currentVarIndex = newVarIndex;
            for (const groupKey in groups) {
                const groupRows = groups[groupKey];
                const count = groupRows.length;

                groupRows.forEach((item) => {
                    bulkUpdates.push({
                        row: item.rowIndex,
                        col: currentVarIndex,
                        value: count
                    });
                });
            }

            const newVariable: Partial<Variable> = {
                columnIndex: currentVarIndex,
                name: breakName,
                type: "NUMERIC",
                width: 8,
                decimals: 0,
                label: `Number of cases in break group`,
                measure: 'scale',
                role: 'input'
            };
            newVariables.push(newVariable);
            newVarIndex++;
        }

        try {
            if (newVariables.length > 0) {
                await variableStore.addVariables(newVariables, bulkUpdates);
            } else if (bulkUpdates.length > 0) {
                await dataStore.updateCells(bulkUpdates);
            }
        } catch (error) {
            console.error("Error during batch update:", error);
            setErrorMessage(error instanceof Error ? error.message : String(error));
            setErrorDialogOpen(true);
        } finally {
            setStatisticProgress(false);
            closeModal();
        }
    }, [data, breakVariables, aggregatedVariables, variables, setStatisticProgress, addNumberOfCases, breakName, setErrorMessage, setErrorDialogOpen]);

    return {
        availableVariables, setAvailableVariables,
        breakVariables, setBreakVariables,
        aggregatedVariables, setAggregatedVariables,
        activeTab, setActiveTab,
        highlightedVariable, setHighlightedVariable,
        errorMessage, setErrorMessage,
        errorDialogOpen, setErrorDialogOpen,
        functionDialogOpen, setFunctionDialogOpen,
        functionCategory, setFunctionCategory,
        selectedFunction, setSelectedFunction,
        percentageType, setPercentageType,
        percentageValue, setPercentageValue,
        percentageLow, setPercentageLow,
        percentageHigh, setPercentageHigh,
        nameDialogOpen, setNameDialogOpen,
        newVariableName, setNewVariableName,
        newVariableLabel, setNewVariableLabel,
        currentEditingVariable, setCurrentEditingVariable,
        datasetName, setDatasetName,
        filePath, setFilePath,
        saveOption, setSaveOption,
        isAlreadySorted, setIsAlreadySorted,
        sortBeforeAggregating, setSortBeforeAggregating,
        addNumberOfCases, setAddNumberOfCases,
        breakName, setBreakName,
        getDisplayName,
        handleVariableSelect,
        handleAggregatedVariableSelect,
        handleVariableDoubleClick,
        handleAggregatedDoubleClick,
        moveToBreak,
        moveFromBreak,
        moveToAggregated,
        moveFromAggregated,
        reorderBreakVariables,
        reorderAggregatedVariables,
        handleTopArrowClick,
        handleBottomArrowClick,
        handleFunctionClick,
        handleNameLabelClick,
        applyFunction,
        applyNameLabel,
        handleReset,
        handleConfirm,
    };
}; 