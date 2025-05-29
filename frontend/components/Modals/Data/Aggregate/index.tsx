"use client";

import React, { FC, useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { useModal } from "@/hooks/useModal";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useModalStore } from "@/stores/useModalStore";
import { Variable, VariableType, VariableMeasure } from "@/types/Variable";
import { ErrorDialog } from "./dialogs/ErrorDialog";
import { FunctionDialog } from "./dialogs/FunctionDialog";
import { NameLabelDialog } from "./dialogs/NameLabelDialog";
import VariablesTab from "./VariablesTab";
import OptionsTab from "./OptionsTab";
import {
    createVariableName,
    mapUIFunctionToCalculationFunction,
    getFunctionDisplay,
    calculateAggregateValue
} from "./Utils";

export interface AggregatedVariable extends Omit<Variable, 'id' | 'tempId' | 'values' | 'missing' | 'align' | 'role' | 'width' | 'decimals' | 'columns' | 'columnIndex'> {
    aggregateId: string;
    baseVarColumnIndex: number;
    baseVarName: string;
    baseVarType: VariableType;
    name: string;
    displayName: string;
    type: VariableType;
    measure: VariableMeasure;
    label?: string;
    function: string;
    functionCategory: "summary" | "specific" | "cases" | "percentages";
    calculationFunction?: string;
    percentageType?: "above" | "below" | "inside" | "outside";
    percentageValue?: string;
    percentageLow?: string;
    percentageHigh?: string;
}

interface AggregateDataProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

// Main content component that's agnostic of container type
const AggregateContent: FC<AggregateDataProps> = ({ onClose, containerType = "dialog" }) => {
    const { closeModal } = useModal();
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

    // Save Tab state
    const [datasetName, setDatasetName] = useState<string>("");
    const [filePath, setFilePath] = useState<string>("C:\\Users\\hp\\Downloads\\aggr.sav");
    const [saveOption, setSaveOption] = useState<"ADD" | "CREATE" | "WRITE">("ADD");

    // Options Tab state
    const [isAlreadySorted, setIsAlreadySorted] = useState<boolean>(false);
    const [sortBeforeAggregating, setSortBeforeAggregating] = useState<boolean>(false);
    const [breakName, setBreakName] = useState<string>("N_BREAK");

    const getDisplayName = (variable: Variable | AggregatedVariable): string => {
        if ('label' in variable && variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    const handleVariableSelect = (columnIndex: number, source: 'available' | 'break' | 'aggregated') => {
        if (highlightedVariable?.id === columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: columnIndex.toString(), source });
        }
    };

    const handleAggregatedVariableSelect = (aggId: string) => {
        if (highlightedVariable?.id === aggId && highlightedVariable.source === 'aggregated') {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: aggId, source: 'aggregated' });
        }
    };

    const handleVariableDoubleClick = (columnIndex: number, source: 'available' | 'break') => {
        if (source === 'break') {
            const variable = breakVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveFromBreak(variable);
            }
        } else if (source === 'available') {
            moveToBreak(availableVariables.find(v => v.columnIndex === columnIndex)!);
        }
    };

    const handleAggregatedDoubleClick = (aggId: string) => {
        moveFromAggregated(aggregatedVariables.find(v => v.aggregateId === aggId)!);
    };

    const getDefaultFunction = (variable: Variable): { functionCategory: "summary" | "specific" | "cases" | "percentages", function: string } => {
        if (variable.type === "STRING") {
            return { functionCategory: "specific", function: "FIRST" };
        } else {
            return { functionCategory: "summary", function: "MEAN" };
        }
    };

    const isVariableInAggregated = (columnIndex: number) => {
        return aggregatedVariables.some(v => v.baseVarColumnIndex === columnIndex);
    };

    // Functions for DnD and variable management
    const moveToBreak = (variable: Variable) => {
        if (!variable) return;

        if (isVariableInAggregated(variable.columnIndex)) {
            setErrorMessage("The target list accepts only variables that do not appear in another target list.");
            setErrorDialogOpen(true);
            return;
        }

        setBreakVariables(prev => [...prev, variable]);
        setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const moveFromBreak = (variable: Variable) => {
        if (!variable) return;

        setAvailableVariables(prev => [...prev, variable]);
        setBreakVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const moveToAggregated = (variable: Variable) => {
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
    };

    const moveFromAggregated = (variable: AggregatedVariable) => {
        if (!variable) return;

        setAggregatedVariables(prev => prev.filter(v => v.aggregateId !== variable.aggregateId));
        setHighlightedVariable(null);
    };

    // Reordering functions for DnD
    const reorderBreakVariables = (variables: Variable[]) => {
        setBreakVariables([...variables]);
    };

    const reorderAggregatedVariables = (variables: AggregatedVariable[]) => {
        setAggregatedVariables([...variables]);
    };

    const handleTopArrowClick = () => {
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
    };

    const handleBottomArrowClick = () => {
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
    };

    const handleFunctionClick = () => {
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
    };

    const handleNameLabelClick = () => {
        if (highlightedVariable && highlightedVariable.source === 'aggregated') {
            const variable = aggregatedVariables.find(v => v.aggregateId === highlightedVariable.id);
            if (variable) {
                setNewVariableName(variable.name);
                setNewVariableLabel(variable.label || "");
                setCurrentEditingVariable(variable);
                setNameDialogOpen(true);
            }
        }
    };

    const applyFunction = () => {
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
    };

    const applyNameLabel = () => {
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
    };

    const handleReset = () => {
        setAvailableVariables(variables.filter(v => v.name !== ""));
        setBreakVariables([]);
        setAggregatedVariables([]);
        setHighlightedVariable(null);
        setIsAlreadySorted(false);
        setSortBeforeAggregating(false);
        setBreakName("N_BREAK");
        setSaveOption("ADD");
        setDatasetName("");
        setFilePath("C:\\Users\\hp\\Downloads\\aggr.sav");
    };

    const handleConfirm = async () => {
        const variableStore = useVariableStore.getState();
        setStatisticProgress(true);

        const groups: Record<string, { rowIndex: number; row: (string | number)[] }[]> = {};
        data.forEach((row, rowIndex) => {
            const key = breakVariables
                .map((bv: { columnIndex: number }) => row[bv.columnIndex])
                .join("|");
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push({ rowIndex, row });
        });

        let totalVarCount = variables.length;
        const bulkUpdates: { row: number; col: number; value: string | number }[] = [];

        for (const aggVar of aggregatedVariables) {
            const aggregatedData: (string | number | null)[] = new Array(data.length).fill(null);
            const calcFunction = aggVar.calculationFunction || aggVar.function;

            for (const groupKey in groups) {
                const groupRows = groups[groupKey];
                const values = groupRows.map(
                    (item: { rowIndex: number; row: (string | number)[] }) =>
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

                groupRows.forEach((item: { rowIndex: number; row: (string | number)[] }) => {
                    aggregatedData[item.rowIndex] = aggregatedValue;
                    bulkUpdates.push({
                        row: item.rowIndex,
                        col: totalVarCount,
                        value: aggregatedValue ?? ""
                    });
                });
            }

            const nonEmptyData = aggregatedData.filter((d) => d !== "");
            const allNumeric = nonEmptyData.every(
                (d) => typeof d === "number" || (!isNaN(Number(d)) && d !== "")
            );
            let computedType = allNumeric ? "NUMERIC" : "STRING";
            const type = computedType as "NUMERIC" | "STRING";
            let width = 8;
            let decimals = 2;
            if (!allNumeric) {
                const maxWidth = nonEmptyData.reduce((max: number, d: string | number | null): number => {
                    const str = String(d);
                    return Math.max(max, str.length);
                }, 0);
                width = maxWidth || width;
            }

            const newVariable = {
                columnIndex: totalVarCount,
                name: aggVar.name,
                type,
                width,
                decimals,
                label: aggVar.label || "",
            };
            await variableStore.addVariable(newVariable);
            totalVarCount++;
        }

        await updateCells(bulkUpdates);
        setStatisticProgress(false);
        closeModal();
    };

    return (
        <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-border flex-shrink-0">
                    <TabsList className="bg-muted rounded-none h-9 p-0">
                        <TabsTrigger
                            value="variables"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'variables' ? 'bg-background border-t border-l border-r border-border text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                        >
                            Variables
                        </TabsTrigger>
                        <TabsTrigger
                            value="options"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'options' ? 'bg-background border-t border-l border-r border-border text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                        >
                            Options
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <VariablesTab
                        availableVariables={availableVariables}
                        breakVariables={breakVariables}
                        aggregatedVariables={aggregatedVariables}
                        highlightedVariable={highlightedVariable}
                        breakName={breakName}
                        setBreakName={setBreakName}
                        handleVariableSelect={handleVariableSelect}
                        handleVariableDoubleClick={handleVariableDoubleClick}
                        handleAggregatedVariableSelect={handleAggregatedVariableSelect}
                        handleAggregatedDoubleClick={handleAggregatedDoubleClick}
                        handleTopArrowClick={handleTopArrowClick}
                        handleBottomArrowClick={handleBottomArrowClick}
                        handleFunctionClick={handleFunctionClick}
                        handleNameLabelClick={handleNameLabelClick}
                        getDisplayName={getDisplayName}
                        // Props for DnD functionality
                        moveToBreak={moveToBreak}
                        moveFromBreak={moveFromBreak}
                        moveToAggregated={moveToAggregated}
                        moveFromAggregated={moveFromAggregated}
                        reorderBreakVariables={reorderBreakVariables}
                        reorderAggregatedVariables={reorderAggregatedVariables}
                        containerType={containerType}
                    />
                </TabsContent>

                <TabsContent value="options" className="p-6 overflow-y-auto flex-grow">
                    <OptionsTab
                        isAlreadySorted={isAlreadySorted}
                        setIsAlreadySorted={setIsAlreadySorted}
                        sortBeforeAggregating={sortBeforeAggregating}
                        setSortBeforeAggregating={setSortBeforeAggregating}
                        containerType={containerType}
                    />
                </TabsContent>
            </Tabs>

            <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0 rounded-b-md">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4"
                        onClick={handleConfirm}
                    >
                        OK
                    </Button>
                    <Button
                        variant="outline"
                        className="border-border hover:bg-accent hover:text-accent-foreground h-8 px-4"
                        onClick={() => console.log("Paste clicked")}
                    >
                        Paste
                    </Button>
                    <Button
                        variant="outline"
                        className="border-border hover:bg-accent hover:text-accent-foreground h-8 px-4"
                        onClick={handleReset}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="border-border hover:bg-accent hover:text-accent-foreground h-8 px-4"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        className="border-border hover:bg-accent hover:text-accent-foreground h-8 px-4"
                        onClick={() => console.log("Help clicked")}
                    >
                        Help
                    </Button>
                </div>
            </div>

            <FunctionDialog
                open={functionDialogOpen}
                onOpenChange={setFunctionDialogOpen}
                currentEditingVariable={currentEditingVariable}
                functionCategory={functionCategory}
                setFunctionCategory={setFunctionCategory}
                selectedFunction={selectedFunction}
                setSelectedFunction={setSelectedFunction}
                percentageType={percentageType}
                setPercentageType={setPercentageType}
                percentageValue={percentageValue}
                setPercentageValue={setPercentageValue}
                percentageLow={percentageLow}
                setPercentageLow={setPercentageLow}
                percentageHigh={percentageHigh}
                setPercentageHigh={setPercentageHigh}
                onApply={applyFunction}
            />

            <NameLabelDialog
                open={nameDialogOpen}
                onOpenChange={setNameDialogOpen}
                currentEditingVariable={currentEditingVariable}
                newVariableName={newVariableName}
                setNewVariableName={setNewVariableName}
                newVariableLabel={newVariableLabel}
                setNewVariableLabel={setNewVariableLabel}
                onApply={applyNameLabel}
            />

            <ErrorDialog
                open={errorDialogOpen}
                onOpenChange={setErrorDialogOpen}
                errorMessage={errorMessage}
            />
        </>
    );
};

// Main component that handles different container types
const Aggregate: FC<AggregateDataProps> = ({ onClose, containerType = "dialog" }) => {
    // If sidebar mode, use a div container without header (header is provided by SidebarContainer)
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <AggregateContent onClose={onClose} containerType={containerType} />
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent
    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-[650px] p-0">
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-[22px] font-semibold text-foreground">Aggregate Data</DialogTitle>
                </DialogHeader>

                <div className="flex-grow flex flex-col overflow-hidden">
                    <AggregateContent onClose={onClose} containerType={containerType} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default Aggregate;