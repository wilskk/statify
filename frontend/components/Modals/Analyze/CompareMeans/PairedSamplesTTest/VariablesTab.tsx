import React, { FC, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUp, ArrowDown, MoveHorizontal, InfoIcon, ChevronRight, ChevronLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Variable } from "@/types/Variable";
import { HighlightedVariableInfo } from "./types";

export interface VariablesTabProps {
    listVariables: Variable[];
    testVariables1: Variable[];
    testVariables2: Variable[];
    highlightedVariable: HighlightedVariableInfo | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<HighlightedVariableInfo | null>>;
    selectedPair: number | null;
    setSelectedPair: React.Dispatch<React.SetStateAction<number | null>>;
    estimateEffectSize: boolean;
    setEstimateEffectSize: React.Dispatch<React.SetStateAction<boolean>>;
    calculateStandardizer: {
        standardDeviation: boolean;
        correctedStandardDeviation: boolean;
        averageOfVariances: boolean;
    };
    setCalculateStandardizer: React.Dispatch<React.SetStateAction<{
        standardDeviation: boolean;
        correctedStandardDeviation: boolean;
        averageOfVariances: boolean;
    }>>;
    handleSelectedVariable: (variable: Variable, targetList: 'list1' | 'list2') => void;
    handleDeselectVariable: (variable: Variable, sourceList: 'list1' | 'list2', rowIndex?: number) => void;
    handleMoveVariableBetweenLists: (index: number) => void;
    handleMoveUpPair: (index: number) => void;
    handleMoveDownPair: (index: number) => void;
    handleRemovePair: (index: number) => void;
}

const VariablesTab: FC<VariablesTabProps> = ({
    listVariables,
    testVariables1,
    testVariables2,
    highlightedVariable,
    setHighlightedVariable,
    selectedPair,
    setSelectedPair,
    estimateEffectSize,
    setEstimateEffectSize,
    calculateStandardizer,
    setCalculateStandardizer,
    handleSelectedVariable,
    handleDeselectVariable,
    handleMoveVariableBetweenLists,
    handleMoveUpPair,
    handleMoveDownPair,
    handleRemovePair,
}) => {
    // Filter availableVariables to include only NUMERIC types
    const filteredListVariables = useMemo(() => {
        return listVariables.filter(variable => variable.type === 'NUMERIC');
    }, [listVariables]);

    const getVariableIcon = (variable: Variable) => {
        const measureClass = variable.measure || "scale";
        return (
            <span className={`inline-block w-3 h-3 mr-1 rounded-full ${
                measureClass === "scale" ? "bg-blue-500" : 
                measureClass === "nominal" ? "bg-green-500" : 
                measureClass === "ordinal" ? "bg-orange-500" : "bg-gray-500"
            }`} />
        );
    };

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    const handleVariableSelect = (variable: Variable, source: 'available' | 'selected1' | 'selected2', rowIndex?: number) => {
        if (source === 'available') {
            if (highlightedVariable && highlightedVariable.tempId === variable.tempId && highlightedVariable.source === source) {
                setHighlightedVariable(null);
            } else {
                setHighlightedVariable({ 
                    tempId: variable.tempId || '',  // Ensure tempId is never undefined
                    source 
                });
                setSelectedPair(null);
            }
        } else {
            if (highlightedVariable && 
                highlightedVariable.tempId === variable.tempId && 
                highlightedVariable.source === source && 
                highlightedVariable.rowIndex === rowIndex) {
                setHighlightedVariable(null);
            } else {
                setHighlightedVariable({ 
                    tempId: variable.tempId || '',  // Ensure tempId is never undefined
                    source,
                    rowIndex
                });
                setSelectedPair(null);
            }
        }
    };

    const handleVariableDoubleClick = (variable: Variable, source: 'available' | 'selected1' | 'selected2', rowIndex?: number) => {
        if (source === 'available') {
            // Auto-determine which list needs a variable
            if (testVariables1.length <= testVariables2.length) {
                handleSelectedVariable(variable, 'list1');
            } else {
                handleSelectedVariable(variable, 'list2');
            }
        } else if (source === 'selected1' && rowIndex !== undefined) {
            handleDeselectVariable(variable, 'list1', rowIndex);
        } else if (source === 'selected2' && rowIndex !== undefined) {
            handleDeselectVariable(variable, 'list2', rowIndex);
        }
    };

    const handleMoveButton = (direction: 'toRight' | 'toLeft') => {
        if (highlightedVariable) {
            if (highlightedVariable.source === 'available' && direction === 'toRight') {
                const variable = filteredListVariables.find(v => v.tempId === highlightedVariable.tempId);
                if (variable) {
                    // Auto-determine which list needs a variable
                    if (testVariables1.length <= testVariables2.length) {
                        handleSelectedVariable(variable, 'list1');
                    } else {
                        handleSelectedVariable(variable, 'list2');
                    }
                }
            } else if (highlightedVariable.source === 'selected1' && direction === 'toLeft' && highlightedVariable.rowIndex !== undefined) {
                const variable = testVariables1[highlightedVariable.rowIndex];
                if (variable) {
                    handleDeselectVariable(variable, 'list1', highlightedVariable.rowIndex);
                }
            } else if (highlightedVariable.source === 'selected2' && direction === 'toLeft' && highlightedVariable.rowIndex !== undefined) {
                const variable = testVariables2[highlightedVariable.rowIndex];
                if (variable) {
                    handleDeselectVariable(variable, 'list2', highlightedVariable.rowIndex);
                }
            }
        }
    };

    const handlePairClick = (index: number) => {
        setSelectedPair(selectedPair === index ? null : index);
        setHighlightedVariable(null);
    };

    return (
        <div className="grid grid-cols-12 gap-4">
            {/* Left Column: Available Variables */}
            <div className="col-span-4">
                <div className="flex flex-col h-full">
                    <div className="text-sm font-medium mb-2">Available Variables:</div>
                    <div className="flex-grow border rounded-md overflow-auto h-[340px]">
                        <div className="p-2 space-y-1">
                            {filteredListVariables.map((variable) => (
                                <TooltipProvider key={variable.tempId}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`flex items-center p-1 rounded-md cursor-pointer hover:bg-gray-100 ${
                                                    highlightedVariable && highlightedVariable.tempId === variable.tempId && 
                                                    highlightedVariable.source === 'available' 
                                                        ? 'bg-gray-200' 
                                                        : ''
                                                }`}
                                                onClick={() => handleVariableSelect(variable, 'available')}
                                                onDoubleClick={() => handleVariableDoubleClick(variable, 'available')}
                                            >
                                                {getVariableIcon(variable)}
                                                <span className="text-sm truncate">{getDisplayName(variable)}</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            <p>{getDisplayName(variable)}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                            {filteredListVariables.length === 0 && (
                                <div className="p-2 text-sm text-gray-500 italic">No numeric variables available</div>
                            )}
                        </div>
                    </div>
                    <div className="text-xs mt-2 text-gray-500 flex items-center">
                        <InfoIcon size={14} className="mr-1" />
                        <span>Double-click to add variables to pairs</span>
                    </div>
                </div>
            </div>

            {/* Middle: Move Controls */}
            <div className="col-span-1 flex flex-col items-center justify-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMoveButton('toRight')}
                    disabled={!highlightedVariable || highlightedVariable.source !== 'available'}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMoveButton('toLeft')}
                    disabled={!highlightedVariable || highlightedVariable.source === 'available'}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
            </div>

            {/* Right Column: Paired Variables */}
            <div className="col-span-6">
                <div className="flex flex-col h-full">
                    <div className="text-sm font-medium mb-2">Paired Variables:</div>
                    <div className="flex-grow border rounded-md overflow-auto h-[340px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12 text-center">Pair</TableHead>
                                    <TableHead>Variable 1</TableHead>
                                    <TableHead>Variable 2</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {testVariables1.length === 0 && testVariables2.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-gray-500 py-4">
                                            No variables selected for testing
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    Array.from({ length: Math.max(testVariables1.length, testVariables2.length) }).map((_, index) => (
                                        <TableRow 
                                            key={index}
                                            className={selectedPair === index ? "bg-gray-100" : ""}
                                        >
                                            <TableCell 
                                                className="text-center cursor-pointer hover:bg-gray-100"
                                                onClick={() => handlePairClick(index)}
                                            >
                                                {index + 1}
                                            </TableCell>
                                            <TableCell 
                                                className={`cursor-pointer ${
                                                    highlightedVariable && highlightedVariable.source === 'selected1' && 
                                                    testVariables1[index] && 
                                                    highlightedVariable.tempId === testVariables1[index].tempId &&
                                                    highlightedVariable.rowIndex === index
                                                        ? "bg-gray-200" 
                                                        : "hover:bg-gray-100"
                                                }`}
                                                onClick={() => {
                                                    if (testVariables1[index]) {
                                                        handleVariableSelect(testVariables1[index], 'selected1', index);
                                                    }
                                                }}
                                                onDoubleClick={() => {
                                                    if (testVariables1[index]) {
                                                        handleVariableDoubleClick(testVariables1[index], 'selected1', index);
                                                    }
                                                }}
                                            >
                                                {testVariables1[index] ? (
                                                    <div className="flex items-center">
                                                        {getVariableIcon(testVariables1[index])}
                                                        <span className="text-sm">{getDisplayName(testVariables1[index])}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">Empty</span>
                                                )}
                                            </TableCell>
                                            <TableCell 
                                                className={`cursor-pointer ${
                                                    highlightedVariable && highlightedVariable.source === 'selected2' && 
                                                    testVariables2[index] && 
                                                    highlightedVariable.tempId === testVariables2[index].tempId &&
                                                    highlightedVariable.rowIndex === index
                                                        ? "bg-gray-200" 
                                                        : "hover:bg-gray-100"
                                                }`}
                                                onClick={() => {
                                                    if (testVariables2[index]) {
                                                        handleVariableSelect(testVariables2[index], 'selected2', index);
                                                    }
                                                }}
                                                onDoubleClick={() => {
                                                    if (testVariables2[index]) {
                                                        handleVariableDoubleClick(testVariables2[index], 'selected2', index);
                                                    }
                                                }}
                                            >
                                                {testVariables2[index] ? (
                                                    <div className="flex items-center">
                                                        {getVariableIcon(testVariables2[index])}
                                                        <span className="text-sm">{getDisplayName(testVariables2[index])}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">Empty</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Far Right: Pair Control Buttons */}
            <div className="col-span-1 flex flex-col items-center justify-start gap-2 pt-10">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => selectedPair !== null && handleMoveUpPair(selectedPair)}
                    disabled={selectedPair === null || selectedPair === 0}
                >
                    <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => selectedPair !== null && handleMoveDownPair(selectedPair)}
                    disabled={selectedPair === null || selectedPair === Math.max(testVariables1.length, testVariables2.length) - 1}
                >
                    <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => selectedPair !== null && handleMoveVariableBetweenLists(selectedPair)}
                    disabled={selectedPair === null}
                >
                    <MoveHorizontal className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={() => selectedPair !== null && handleRemovePair(selectedPair)}
                    disabled={selectedPair === null}
                >
                    ✕
                </Button>
            </div>

            {/* Options Section */}
            <div className="col-span-12 mt-4">
                <div className="flex flex-col gap-4 border rounded-md p-4">
                    {/* Effect Size Option */}
                    <div className="flex items-center mb-2">
                        <Checkbox
                            id="estimate-effect-size"
                            checked={estimateEffectSize}
                            onCheckedChange={(checked) => setEstimateEffectSize(!!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="estimate-effect-size">Estimate effect sizes</Label>
                    </div>

                    {/* Standardizer Options */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Calculate standardizer using:</Label>
                        <RadioGroup
                            value={
                                calculateStandardizer.standardDeviation ? "standardDeviation" :
                                calculateStandardizer.correctedStandardDeviation ? "correctedStandardDeviation" :
                                calculateStandardizer.averageOfVariances ? "averageOfVariances" : ""
                            }
                            onValueChange={(value) => {
                                setCalculateStandardizer({
                                    standardDeviation: value === "standardDeviation",
                                    correctedStandardDeviation: value === "correctedStandardDeviation",
                                    averageOfVariances: value === "averageOfVariances"
                                });
                            }}
                            className="space-y-2"
                        >
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="standardDeviation"
                                    id="standard-deviation-option"
                                    className="mr-2"
                                />
                                <Label htmlFor="standard-deviation-option">Standard deviation of the difference</Label>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="correctedStandardDeviation"
                                    id="corrected-standard-deviation-option"
                                    className="mr-2"
                                />
                                <Label htmlFor="corrected-standard-deviation-option">Corrected standard deviation of the difference</Label>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="averageOfVariances"
                                    id="average-of-variances-option"
                                    className="mr-2"
                                />
                                <Label htmlFor="average-of-variances-option">Average of variances</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;