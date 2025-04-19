"use client";

import React, { FC, useState, useEffect } from "react";
import {
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
import { Variable } from "@/types/Variable";
import { ErrorDialog } from "./dialogs/ErrorDialog";
import { FunctionDialog } from "./dialogs/FunctionDialog";
import { NameLabelDialog } from "./dialogs/NameLabelDialog";
import VariablesTab from "./VariablesTab";
import SaveTab from "./SaveTab";
import OptionsTab from "./OptionsTab";
import {
    createVariableName,
    mapUIFunctionToCalculationFunction,
    getFunctionDisplay,
    calculateAggregateValue
} from "./Utils";

interface AggregatedVariable {
    id: string;
    baseVarColumnIndex: number;
    baseVarName: string;
    name: string;
    displayName: string;
    type: string;
    measure?: "scale" | "ordinal" | "nominal" | "unknown";
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
}

const AggregateData: FC<AggregateDataProps> = ({ onClose }) => {
    const { closeModal } = useModal();
    const { variables } = useVariableStore();
    const { data, updateBulkCells } = useDataStore();
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

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
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

    const handleAggregatedVariableSelect = (id: string) => {
        if (highlightedVariable?.id === id && highlightedVariable.source === 'aggregated') {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id, source: 'aggregated' });
        }
    };

    const handleVariableDoubleClick = (columnIndex: number, source: 'available' | 'break') => {
        if (source === 'break') {
            const variable = breakVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                setAvailableVariables(prev => [...prev, variable]);
                setBreakVariables(prev => prev.filter(v => v.columnIndex !== columnIndex));
            }
        } else if (source === 'available') {
            handleMoveToBreak();
        }
    };

    const handleAggregatedDoubleClick = (id: string) => {
        setAggregatedVariables(prev => prev.filter(v => v.id !== id));
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

    const handleMoveToBreak = () => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'available') {
            const columnIndex = parseInt(highlightedVariable.id);

            if (isVariableInAggregated(columnIndex)) {
                setErrorMessage("The target list accepts only variables that do not appear in another target list.");
                setErrorDialogOpen(true);
                return;
            }

            const variable = availableVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                setBreakVariables(prev => [...prev, variable]);
                setAvailableVariables(prev => prev.filter(v => v.columnIndex !== columnIndex));
                setHighlightedVariable(null);
            }
        } else if (highlightedVariable.source === 'aggregated') {
            setErrorMessage("The target list accepts only variables that do not appear in another target list.");
            setErrorDialogOpen(true);
        }
    };

    const handleMoveFromBreak = () => {
        if (highlightedVariable && highlightedVariable.source === 'break') {
            const columnIndex = parseInt(highlightedVariable.id);
            const variable = breakVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                setAvailableVariables(prev => [...prev, variable]);
                setBreakVariables(prev => prev.filter(v => v.columnIndex !== columnIndex));
                setHighlightedVariable(null);
            }
        }
    };

    const handleMoveToAggregated = () => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'available') {
            const columnIndex = parseInt(highlightedVariable.id);
            const variable = availableVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                const { functionCategory, function: uiFunc } = getDefaultFunction(variable);
                const calculationFunction = mapUIFunctionToCalculationFunction(uiFunc, "above");
                const existingNames = aggregatedVariables.map(v => v.name);
                const newName = createVariableName(variable.name, calculationFunction, existingNames);
                const displayFormula = getFunctionDisplay(calculationFunction, variable.name);

                const newAggregatedVar: AggregatedVariable = {
                    id: `agg_${columnIndex}_${Date.now()}`,
                    baseVarColumnIndex: columnIndex,
                    baseVarName: variable.name,
                    name: newName,
                    displayName: `${newName} = ${displayFormula}`,
                    type: variable.type,
                    measure: variable.measure,
                    function: uiFunc,
                    calculationFunction,
                    functionCategory
                };

                setAggregatedVariables(prev => [...prev, newAggregatedVar]);
                setHighlightedVariable(null);
            }
        } else if (highlightedVariable.source === 'break') {
            setErrorMessage("The target list accepts only variables that do not appear in another target list.");
            setErrorDialogOpen(true);
        }
    };

    const handleMoveFromAggregated = () => {
        if (highlightedVariable && highlightedVariable.source === 'aggregated') {
            setAggregatedVariables(prev =>
                prev.filter(v => v.id !== highlightedVariable.id)
            );
            setHighlightedVariable(null);
        }
    };

    const handleTopArrowClick = () => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'available') {
            handleMoveToBreak();
        } else if (highlightedVariable.source === 'break') {
            handleMoveFromBreak();
        } else if (highlightedVariable.source === 'aggregated') {
            handleMoveToBreak();
        }
    };

    const handleBottomArrowClick = () => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'available') {
            handleMoveToAggregated();
        } else if (highlightedVariable.source === 'break') {
            handleMoveToAggregated();
        } else if (highlightedVariable.source === 'aggregated') {
            handleMoveFromAggregated();
        }
    };

    const handleFunctionClick = () => {
        if (highlightedVariable && highlightedVariable.source === 'aggregated') {
            const variable = aggregatedVariables.find(v => v.id === highlightedVariable.id);
            if (variable) {
                setFunctionCategory(variable.functionCategory);
                setSelectedFunction(variable.function);
                setPercentageType(variable.percentageType || "above");
                setPercentageValue(variable.percentageValue || "");
                setPercentageLow(variable.percentageLow || "");
                setPercentageHigh(variable.percentageHigh || "");
                setCurrentEditingVariable(variable);
                setFunctionDialogOpen(true);
            }
        }
    };

    const handleNameLabelClick = () => {
        if (highlightedVariable && highlightedVariable.source === 'aggregated') {
            const variable = aggregatedVariables.find(v => v.id === highlightedVariable.id);
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
                    .filter(v => v.id !== currentEditingVariable.id)
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
                prev.map(v => v.id === currentEditingVariable.id ? updatedVar : v)
            );

            setFunctionDialogOpen(false);
            setCurrentEditingVariable(null);
        }
    };

    const applyNameLabel = () => {
        if (currentEditingVariable) {
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
                prev.map(v => v.id === currentEditingVariable.id ? updatedVar : v)
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

        await updateBulkCells(bulkUpdates);
        setStatisticProgress(false);
        closeModal();
    };

    return (
        <>
            <DialogContent className="max-w-[650px] p-0">
                <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                    <DialogTitle className="text-[22px] font-semibold">Aggregate Data</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow overflow-hidden">
                    <div className="border-b border-[#E6E6E6] flex-shrink-0">
                        <TabsList className="bg-[#F7F7F7] rounded-none h-9 p-0">
                            <TabsTrigger
                                value="variables"
                                className={`px-4 h-8 rounded-none text-sm ${activeTab === 'variables' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                            >
                                Variables
                            </TabsTrigger>
                            <TabsTrigger
                                value="save"
                                className={`px-4 h-8 rounded-none text-sm ${activeTab === 'save' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                            >
                                Save
                            </TabsTrigger>
                            <TabsTrigger
                                value="options"
                                className={`px-4 h-8 rounded-none text-sm ${activeTab === 'options' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
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
                        />
                    </TabsContent>

                    <TabsContent value="save" className="p-6 overflow-y-auto flex-grow">
                        <SaveTab
                            saveOption={saveOption}
                            setSaveOption={setSaveOption}
                            datasetName={datasetName}
                            setDatasetName={setDatasetName}
                            filePath={filePath}
                            setFilePath={setFilePath}
                        />
                    </TabsContent>

                    <TabsContent value="options" className="p-6 overflow-y-auto flex-grow">
                        <OptionsTab
                            isAlreadySorted={isAlreadySorted}
                            setIsAlreadySorted={setIsAlreadySorted}
                            sortBeforeAggregating={sortBeforeAggregating}
                            setSortBeforeAggregating={setSortBeforeAggregating}
                        />
                    </TabsContent>
                </Tabs>

                <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                    <div className="flex justify-end space-x-3">
                        <Button
                            className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                            onClick={handleConfirm}
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

export default AggregateData;