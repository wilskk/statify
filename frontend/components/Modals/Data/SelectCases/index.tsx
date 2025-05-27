"use client";

import React, { FC, useState, useEffect } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Dialog,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useModalStore, ModalType } from "@/stores/useModalStore";
import { Variable } from "@/types/Variable";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    CornerDownRight,
    AlertCircle,
    Info
} from "lucide-react";

import SelectCasesIfCondition from "./SelectCasesIfCondition";
import SelectCasesRandomSample from "./SelectCasesRandomSample";
import SelectCasesRange from "./SelectCasesRange";

interface SelectCasesProps {
    onClose: () => void;
}

const SelectCases: FC<SelectCasesProps> = ({ onClose }) => {
    const { closeModal, openModal } = useModalStore();
    const { variables, addVariable, updateVariable } = useVariableStore();
    const { data, updateBulkCells } = useDataStore();

    const [storeVariables, setStoreVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available'} | null>(null);
    const [selectOption, setSelectOption] = useState<string>("all");
    const [filterVariable, setFilterVariable] = useState<Variable | null>(null);
    const [outputOption, setOutputOption] = useState<string>("filter");
    const [newDatasetName, setNewDatasetName] = useState<string>("");
    const [currentStatus, setCurrentStatus] = useState<string>("Do not filter cases");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);
    const [ifConditionDialogOpen, setIfConditionDialogOpen] = useState<boolean>(false);
    const [randomSampleDialogOpen, setRandomSampleDialogOpen] = useState<boolean>(false);
    const [rangeDialogOpen, setRangeDialogOpen] = useState<boolean>(false);
    const [conditionExpression, setConditionExpression] = useState<string>("");
    const [randomSampleConfig, setRandomSampleConfig] = useState<any>(null);
    const [rangeConfig, setRangeConfig] = useState<any>(null);

    useEffect(() => {
        setStoreVariables(variables.filter(v => v.name !== ""));
    }, [variables]);

    const handleVariableSelect = (columnIndex: number, source: 'available') => {
        if (highlightedVariable?.id === columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: columnIndex.toString(), source });
        }
    };

    const handleVariableDoubleClick = (columnIndex: number, source: 'available') => {
        if (source === 'available') {
            const variable = storeVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                setFilterVariable(variable);
                setSelectOption("variable");
            }
        }
    };

    const handleTransferClick = () => {
        if (highlightedVariable && highlightedVariable.source === 'available') {
            const columnIndex = parseInt(highlightedVariable.id);
            const variable = storeVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                setFilterVariable(variable);
                setSelectOption("variable");
                setHighlightedVariable(null);
            }
        }
    };

    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        }
    };

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    const handleIfButtonClick = () => {
        setIfConditionDialogOpen(true);
    };

    const handleSampleButtonClick = () => {
        setRandomSampleDialogOpen(true);
    };

    const handleRangeButtonClick = () => {
        setRangeDialogOpen(true);
    };

    const handleIfConditionContinue = (condition: string) => {
        setConditionExpression(condition);
        setIfConditionDialogOpen(false);
        if (condition.trim()) {
            setCurrentStatus(`Condition: ${condition}`);
        }
    };

    const handleRandomSampleContinue = (result: any) => {
        setRandomSampleConfig(result);
        setRandomSampleDialogOpen(false);

        if (result.sampleType === "approximate" && result.percentage) {
            setCurrentStatus(`Random sample: Approximately ${result.percentage}% of all cases`);
        } else if (result.sampleType === "exact" && result.exactCount) {
            setCurrentStatus(`Random sample: Exactly ${result.exactCount} cases from the first ${result.fromFirstCount || "all"} cases`);
        }
    };

    const handleRangeContinue = (result: any) => {
        setRangeConfig(result);
        setRangeDialogOpen(false);

        if (result.firstCase || result.lastCase) {
            setCurrentStatus(`Range: Cases from ${result.firstCase || "start"} to ${result.lastCase || "end"}`);
        }
    };

    const applyRandomSampleFilter = async () => {
        if (!randomSampleConfig) return false;

        const totalCases = data.length;
        if (totalCases === 0) return false;

        let selectedIndices: number[] = [];

        if (randomSampleConfig.sampleType === "approximate" && randomSampleConfig.percentage) {
            const sampleSize = Math.round((randomSampleConfig.percentage / 100) * totalCases);
            const indices = Array.from({ length: totalCases }, (_, i) => i);

            for (let i = 0; i < sampleSize && indices.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * indices.length);
                selectedIndices.push(indices[randomIndex]);
                indices.splice(randomIndex, 1);
            }
        } else if (randomSampleConfig.sampleType === "exact" && randomSampleConfig.exactCount) {
            const maxIndex = randomSampleConfig.fromFirstCount
                ? Math.min(randomSampleConfig.fromFirstCount, totalCases)
                : totalCases;

            const indices = Array.from({ length: maxIndex }, (_, i) => i);
            const sampleSize = Math.min(randomSampleConfig.exactCount, maxIndex);

            for (let i = 0; i < sampleSize && indices.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * indices.length);
                selectedIndices.push(indices[randomIndex]);
                indices.splice(randomIndex, 1);
            }
        }

        if (selectedIndices.length === 0) return false;

        await createFilterVariable(selectedIndices);
        return true;
    };

    const applyRangeFilter = async () => {
        if (!rangeConfig) return false;

        const totalCases = data.length;
        if (totalCases === 0) return false;

        const firstCase = rangeConfig.firstCase ? parseInt(rangeConfig.firstCase) - 1 : 0;
        const lastCase = rangeConfig.lastCase ? parseInt(rangeConfig.lastCase) - 1 : totalCases - 1;

        if (firstCase < 0 || lastCase >= totalCases || firstCase > lastCase) {
            setErrorMessage("Invalid case range specified.");
            setErrorDialogOpen(true);
            return false;
        }

        const selectedIndices = Array.from(
            { length: lastCase - firstCase + 1 },
            (_, i) => firstCase + i
        );

        await createFilterVariable(selectedIndices);
        return true;
    };

    const applyVariableFilter = async () => {
        if (!filterVariable) return false;

        const totalCases = data.length;
        if (totalCases === 0) return false;

        const selectedIndices: number[] = [];

        for (let i = 0; i < totalCases; i++) {
            if (filterVariable.columnIndex < data[i].length) {
                const value = data[i][filterVariable.columnIndex];
                if (value !== 0 && value !== "" && value !== null && value !== undefined) {
                    selectedIndices.push(i);
                }
            }
        }

        if (selectedIndices.length === 0) return false;

        await createFilterVariable(selectedIndices);
        return true;
    };

    const createFilterVariable = async (selectedIndices: number[]) => {
        const filterValues = data.map((_, index) =>
            selectedIndices.includes(index) ? 1 : 0
        );

        const existingFilterVar = variables.find(v => v.name === "filter_$");
        const updates = filterValues.map((value, row) => ({
            row,
            col: existingFilterVar?.columnIndex || variables.length,
            value
        }));

        if (existingFilterVar) {
            await updateBulkCells(updates);
        } else {
            const newVarIndex = variables.length;
            await addVariable({
                name: "filter_$",
                type: "NUMERIC",
                width: 8,
                decimals: 0,
                label: "Filter Variable",
                measure: "nominal",
                role: "input",
                columnIndex: newVarIndex,
                values: [
                    { variableName: "filter_$", value: 0, label: "Not Selected" },
                    { variableName: "filter_$", value: 1, label: "Selected" }
                ],
            });

            await updateBulkCells(updates);
        }
    };

    const applyConditionFilter = async () => {
        if (!conditionExpression) return false;

        const totalCases = data.length;
        if (totalCases === 0) return false;

        const selectedIndices: number[] = [];

        try {
            for (let i = 0; i < totalCases; i++) {
                const row = data[i];
                let conditionMet = false;

                // Process simple conditions like "varName > value"
                const parts = conditionExpression.split(/\s*(>|<|>=|<=|==|!=)\s*/);
                if (parts.length === 3) {
                    const [varName, operator, valueStr] = parts;
                    const variable = storeVariables.find(v => v.name === varName);

                    if (variable) {
                        const colIndex = variable.columnIndex;
                        if (colIndex < row.length) {
                            const rowValue = row[colIndex];
                            const compareValue = Number(valueStr);

                            switch (operator) {
                                case '>':
                                    conditionMet = Number(rowValue) > compareValue;
                                    break;
                                case '<':
                                    conditionMet = Number(rowValue) < compareValue;
                                    break;
                                case '>=':
                                    conditionMet = Number(rowValue) >= compareValue;
                                    break;
                                case '<=':
                                    conditionMet = Number(rowValue) <= compareValue;
                                    break;
                                case '==':
                                    conditionMet = rowValue == compareValue;
                                    break;
                                case '!=':
                                    conditionMet = rowValue != compareValue;
                                    break;
                            }
                        }
                    }
                }

                if (conditionMet) {
                    selectedIndices.push(i);
                }
            }

            if (selectedIndices.length === 0) return false;

            await createFilterVariable(selectedIndices);
            return true;
        } catch (error) {
            console.error("Error evaluating condition:", error);
            setErrorMessage("Error evaluating condition expression. Please check syntax.");
            setErrorDialogOpen(true);
            return false;
        }
    };

    const handleConfirm = async () => {
        if (selectOption === "variable" && !filterVariable) {
            setErrorMessage("Please select a filter variable.");
            setErrorDialogOpen(true);
            return;
        }

        if (outputOption === "copy" && !newDatasetName.trim()) {
            setErrorMessage("Please enter a dataset name.");
            setErrorDialogOpen(true);
            return;
        }

        let success = false;

        if (selectOption === "all") {
            const filterValues = data.map(() => 1);
            const updates = filterValues.map((value, row) => ({
                row,
                col: variables.length,
                value
            }));

            await addVariable({
                name: "filter_$",
                type: "NUMERIC",
                width: 8,
                decimals: 0,
                label: "Filter Variable",
                measure: "nominal",
                role: "input",
                columnIndex: variables.length,
                values: [
                    { variableName: "filter_$", value: 1, label: "Selected" }
                ],
            });

            await updateBulkCells(updates);
            success = true;
        } else if (selectOption === "condition") {
            success = await applyConditionFilter();
        } else if (selectOption === "random") {
            success = await applyRandomSampleFilter();
        } else if (selectOption === "time") {
            success = await applyRangeFilter();
        } else if (selectOption === "variable") {
            success = await applyVariableFilter();
        }

        if (success) {
            if (outputOption === "delete") {
                // Actually delete unselected cases
                const filterVarIndex = variables.find(v => v.name === "filter_$")?.columnIndex;

                if (filterVarIndex !== undefined) {
                    // Find rows with filter_$ value of 0 (unselected)
                    const rowsToDelete: number[] = [];

                    for (let i = 0; i < data.length; i++) {
                        if (filterVarIndex < data[i].length && data[i][filterVarIndex] === 0) {
                            rowsToDelete.push(i);
                        }
                    }

                    // Delete rows from highest index to lowest to avoid index shifting problems
                    if (rowsToDelete.length > 0) {
                        // Sort in descending order
                        rowsToDelete.sort((a, b) => b - a);

                        // Delete rows one by one
                        for (const rowIndex of rowsToDelete) {
                            await useDataStore.getState().deleteRow(rowIndex);
                        }
                    }

                    setCurrentStatus(`Deleted ${rowsToDelete.length} unselected cases`);
                } else {
                    setCurrentStatus("Unselected cases will be deleted");
                }
            } else if (outputOption === "copy") {
                setCurrentStatus(`Selected cases will be copied to new dataset: ${newDatasetName}`);
                // Implement copy dataset logic here if needed
            } else {
                setCurrentStatus("Filter applied: Unselected cases will be filtered out");
            }
        } else {
            setErrorMessage("No cases were selected by the specified criteria.");
            setErrorDialogOpen(true);
            return;
        }

        closeModal();
    };

    const handleReset = () => {
        setSelectOption("all");
        setFilterVariable(null);
        setOutputOption("filter");
        setNewDatasetName("");
        setCurrentStatus("Do not filter cases");
        setConditionExpression("");
        setRandomSampleConfig(null);
        setRangeConfig(null);
    };

    const handleHelp = () => {
        console.log("Help requested");
    };

    const handlePaste = () => {
        console.log("Paste syntax requested");
    };

    return (
        <>
            <DialogContent className="max-w-[650px] p-3 bg-popover border border-border">
                <DialogHeader className="p-0 mb-2">
                    <DialogTitle className="text-popover-foreground">Select Cases</DialogTitle>
                </DialogHeader>
                <Separator className="my-0" />

                <div className="grid grid-cols-9 gap-4 py-2">
                    <div className="col-span-3">
                        <Label className="text-xs font-semibold mb-1 text-popover-foreground">Variables:</Label>
                        <div className="border border-border p-2 rounded-md h-[420px] overflow-y-auto overflow-x-hidden bg-card">
                            <div className="space-y-1">
                                {storeVariables.map((variable) => (
                                    <TooltipProvider key={variable.columnIndex}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={`flex items-center p-1 cursor-pointer border rounded-md ${highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === 'available' ? "bg-primary border-primary text-primary-foreground" : "border-border hover:bg-accent text-card-foreground"}`}
                                                    onClick={() => handleVariableSelect(variable.columnIndex, 'available')}
                                                    onDoubleClick={() => handleVariableDoubleClick(variable.columnIndex, 'available')}
                                                >
                                                    <div className="flex items-center w-full">
                                                        {getVariableIcon(variable)}
                                                        <span className="text-xs truncate">{getDisplayName(variable)}</span>
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                                <p className="text-xs">{getDisplayName(variable)}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="col-span-6">
                        <div className="border border-border rounded-md p-3 mb-3 bg-card">
                            <div className="text-sm font-medium mb-2 text-card-foreground">Select</div>

                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-card-foreground">
                                    <input
                                        type="radio"
                                        name="selectCasesOption"
                                        className="accent-primary"
                                        checked={selectOption === "all"}
                                        onChange={() => setSelectOption("all")}
                                    />
                                    <span>All cases</span>
                                </label>

                                <div className="flex items-center space-x-2">
                                    <label className="flex items-center space-x-2 text-card-foreground flex-grow">
                                        <input
                                            type="radio"
                                            name="selectCasesOption"
                                            className="accent-primary"
                                            checked={selectOption === "condition"}
                                            onChange={() => setSelectOption("condition")}
                                        />
                                        <span>If condition is satisfied</span>
                                    </label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-7"
                                        onClick={handleIfButtonClick}
                                        disabled={selectOption !== "condition"}
                                    >
                                        If...
                                    </Button>
                                </div>
                                {selectOption === "condition" && conditionExpression && (
                                    <p className="text-xs ml-6 text-muted-foreground">
                                        Condition: <span className="font-semibold text-primary">{conditionExpression}</span>
                                    </p>
                                )}

                                <div className="flex items-center space-x-2">
                                    <label className="flex items-center space-x-2 text-card-foreground flex-grow">
                                        <input
                                            type="radio"
                                            name="selectCasesOption"
                                            className="accent-primary"
                                            checked={selectOption === "random"}
                                            onChange={() => setSelectOption("random")}
                                        />
                                        <span>Random sample of cases</span>
                                    </label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-7"
                                        onClick={handleSampleButtonClick}
                                        disabled={selectOption !== "random"}
                                    >
                                        Sample...
                                    </Button>
                                </div>
                                {selectOption === "random" && randomSampleConfig && (
                                    <p className="text-xs ml-6 text-muted-foreground">
                                        Sample: {randomSampleConfig.sampleType === "approximate" ? `Approx. ${randomSampleConfig.percentage}%` : `Exactly ${randomSampleConfig.exactCount} from first ${randomSampleConfig.fromFirstCount || 'all'}`}
                                    </p>
                                )}

                                <div className="flex items-center space-x-2">
                                    <label className="flex items-center space-x-2 text-card-foreground flex-grow">
                                        <input
                                            type="radio"
                                            name="selectCasesOption"
                                            className="accent-primary"
                                            checked={selectOption === "time"}
                                            onChange={() => setSelectOption("time")}
                                        />
                                        <span>Based on time or case range</span>
                                    </label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-7"
                                        onClick={handleRangeButtonClick}
                                        disabled={selectOption !== "time"}
                                    >
                                        Range...
                                    </Button>
                                </div>
                                {selectOption === "time" && rangeConfig && (
                                    <p className="text-xs ml-6 text-muted-foreground">
                                        Range: {rangeConfig.firstCase || 'Start'} to {rangeConfig.lastCase || 'End'}
                                    </p>
                                )}

                                <label className="flex items-center space-x-2 text-card-foreground">
                                    <input
                                        type="radio"
                                        name="selectCasesOption"
                                        className="accent-primary"
                                        checked={selectOption === "variable"}
                                        onChange={() => setSelectOption("variable")}
                                    />
                                    <span>Use filter variable:</span>
                                    <span className={`font-semibold truncate ${filterVariable ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {filterVariable ? getDisplayName(filterVariable) : "(None selected)"}
                                    </span>
                                </label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7 ml-6 w-24 flex items-center justify-center"
                                    onClick={handleTransferClick}
                                    disabled={selectOption !== "variable" || !highlightedVariable}
                                >
                                    <CornerDownRight size={14} className="mr-1" /> Transfer
                                </Button>
                            </div>
                        </div>

                        <div className="border border-border rounded-md p-3 bg-card">
                            <div className="text-sm font-medium mb-2 text-card-foreground">Output</div>
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-card-foreground">
                                    <input
                                        type="radio"
                                        name="outputOption"
                                        className="accent-primary"
                                        value="filter"
                                        checked={outputOption === "filter"}
                                        onChange={() => setOutputOption("filter")}
                                    />
                                    <span>Filter out unselected cases</span>
                                </label>
                                <label className="flex items-center space-x-2 text-card-foreground">
                                    <input
                                        type="radio"
                                        name="outputOption"
                                        className="accent-primary"
                                        value="copy"
                                        checked={outputOption === "copy"}
                                        onChange={() => setOutputOption("copy")}
                                    />
                                    <span>Copy selected cases to a new dataset</span>
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Dataset name"
                                    className="h-8 text-sm mt-1 ml-6"
                                    value={newDatasetName}
                                    onChange={(e) => setNewDatasetName(e.target.value)}
                                    disabled={outputOption !== "copy"}
                                />
                                <label className="flex items-center space-x-2 text-card-foreground">
                                    <input
                                        type="radio"
                                        name="outputOption"
                                        className="accent-primary"
                                        value="delete"
                                        checked={outputOption === "delete"}
                                        onChange={() => setOutputOption("delete")}
                                    />
                                    <span>Delete unselected cases</span>
                                </label>
                            </div>
                        </div>

                        <p className="text-xs mt-3 text-muted-foreground">
                            Current Status: <span className="font-semibold text-popover-foreground">{currentStatus}</span>
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex justify-between items-center p-3 border-t border-border bg-muted">
                    <div className="flex items-center">
                        <Button variant="link" size="sm" className="text-xs p-0 h-auto text-muted-foreground hover:text-foreground" onClick={handleHelp}>
                            <Info size={14} className="mr-1"/> Help
                        </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={handlePaste}>Paste</Button>
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleReset}>Reset</Button>
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={onClose}>Cancel</Button>
                        <Button size="sm" className="text-xs h-7" onClick={handleConfirm}>OK</Button>
                    </div>
                </DialogFooter>
            </DialogContent>

            {/* Error Dialog */}
            <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-popover border-border">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Error</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-start space-x-3 py-4">
                        <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-popover-foreground">
                            {errorMessage}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setErrorDialogOpen(false)}>OK</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Sub-dialogs for If, Random Sample, Range */}
            {ifConditionDialogOpen && (
                <Dialog open={ifConditionDialogOpen} onOpenChange={setIfConditionDialogOpen}>
                    <SelectCasesIfCondition
                        variables={storeVariables}
                        onClose={() => setIfConditionDialogOpen(false)}
                        onContinue={handleIfConditionContinue}
                        initialExpression={conditionExpression}
                    />
                </Dialog>
            )}

            {randomSampleDialogOpen && (
                <Dialog open={randomSampleDialogOpen} onOpenChange={setRandomSampleDialogOpen}>
                    <SelectCasesRandomSample
                        onClose={() => setRandomSampleDialogOpen(false)}
                        onContinue={handleRandomSampleContinue}
                        initialConfig={randomSampleConfig}
                    />
                </Dialog>
            )}

            {rangeDialogOpen && (
                <Dialog open={rangeDialogOpen} onOpenChange={setRangeDialogOpen}>
                    <SelectCasesRange
                        onClose={() => setRangeDialogOpen(false)}
                        onContinue={handleRangeContinue}
                        initialConfig={rangeConfig}
                    />
                </Dialog>
            )}
        </>
    );
};

export default SelectCases;