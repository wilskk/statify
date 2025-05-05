import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CornerDownLeft, CornerDownRight, Ruler, Shapes, BarChartHorizontal, InfoIcon, ArrowUp, ArrowDown, MoveHorizontal } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Variable } from "@/types/Variable";

interface VariablesTabProps {
    listVariables: Variable[];
    testVariables1: Variable[];
    testVariables2: Variable[];
    highlightedVariable: { id: string, source: 'available' | 'selected1' | 'selected2', rowIndex?: number } | null;
    setHighlightedVariable: React.Dispatch<React.SetStateAction<{ id: string, source: 'available' | 'selected1' | 'selected2', rowIndex?: number } | null>>;
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
    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-[#888888] mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
        }
    };

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    const handleVariableSelect = (variable: Variable, source: 'available' | 'selected1' | 'selected2', rowIndex?: number) => {
        // Untuk variabel dari list tersedia, gunakan logika lama
        if (source === 'available') {
            if (highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === source) {
                setHighlightedVariable(null);
            } else {
                setHighlightedVariable({ id: variable.columnIndex.toString(), source });
                setSelectedPair(null);
            }
        } 
        // Untuk variabel dari table, tambahkan indeks baris
        else {
            if (highlightedVariable?.id === variable.columnIndex.toString() && 
                highlightedVariable.source === source && 
                highlightedVariable.rowIndex === rowIndex) {
                setHighlightedVariable(null);
            } else {
                setHighlightedVariable({ 
                    id: variable.columnIndex.toString(), 
                    source,
                    rowIndex // Tambahkan rowIndex ke state
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

    const handleMoveButton = () => {
        if (highlightedVariable) {
            if (highlightedVariable.source === 'available') {
                const variable = listVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
                if (variable) {
                    // Auto-determine which list needs a variable
                    if (testVariables1.length <= testVariables2.length) {
                        handleSelectedVariable(variable, 'list1');
                    } else {
                        handleSelectedVariable(variable, 'list2');
                    }
                }
            } else if (highlightedVariable.source === 'selected1' && highlightedVariable.rowIndex !== undefined) {
                const variable = testVariables1[highlightedVariable.rowIndex];
                if (variable) {
                    // Hanya deselect variabel pada baris spesifik - handleDeselectVariable akan menangani kasus khusus
                    handleDeselectVariable(variable, 'list1', highlightedVariable.rowIndex);
                }
            } else if (highlightedVariable.source === 'selected2' && highlightedVariable.rowIndex !== undefined) {
                const variable = testVariables2[highlightedVariable.rowIndex];
                if (variable) {
                    // Hanya deselect variabel pada baris spesifik - handleDeselectVariable akan menangani kasus khusus
                    handleDeselectVariable(variable, 'list2', highlightedVariable.rowIndex);
                }
            }
        }
    };

    const handlePairClick = (index: number) => {
        setSelectedPair(selectedPair === index ? null : index);
        setHighlightedVariable(null);
    };

    const renderVariableList = (variables: Variable[], source: 'available' | 'selected1' | 'selected2', height: string) => (
        <div className="border border-[#E6E6E6] p-2 rounded-md overflow-y-auto overflow-x-hidden" style={{ height }}>
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
                                    onClick={() => handleVariableSelect(variable, source)}
                                    onDoubleClick={() => handleVariableDoubleClick(variable, source)}
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
    );

    return (
        <div className="grid grid-cols-12 gap-2">
            {/* List Variables */}
            <div className="col-span-4" style={{height: "340px"}}>
                <div className="text-sm mb-2 font-medium">List Variables:</div>
                {renderVariableList(listVariables, 'available', '288px')}
                <div className="text-xs mt-2 text-[#888888] flex items-center">
                    <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                    <span>Double-click to move variables between lists.</span>
                </div>
            </div>

            {/* Move Buttons */}
            <div className="col-span-1 flex flex-col items-center justify-center">
                <Button
                    variant="outline"
                    size="sm"
                    className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                    onClick={handleMoveButton}
                    disabled={!highlightedVariable}
                >
                    {highlightedVariable?.source === 'available' ?
                        <CornerDownRight size={16} /> :
                        <CornerDownLeft size={16} />
                    }
                </Button>
            </div>

            {/* Test Pairs Table */}
            <div className="col-span-6" style={{height: "340px"}}>
                <div className="text-sm mb-2 font-medium">Paired Variables:</div>
                <div className="mb-2 border border-[#E6E6E6] rounded-md overflow-auto" style={{height: "288px"}}>
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
                                    <TableCell colSpan={3} className="text-center text-[#888888]">
                                        No variables selected for testing
                                    </TableCell>
                                </TableRow>
                            ) : (
                                Array.from({ length: Math.max(testVariables1.length, testVariables2.length) }).map((_, index) => (
                                    <TableRow 
                                        key={index}
                                        className={selectedPair === index && !highlightedVariable ? "" : ""}
                                    >
                                        <TableCell 
                                            className={`text-center cursor-pointer ${
                                                selectedPair === index && !highlightedVariable 
                                                ? "bg-[#E6E6E6] hover:bg-[#E6E6E6]" 
                                                : "hover:bg-[#F7F7F7]"
                                            }`}
                                            onClick={() => {
                                                handlePairClick(index);
                                                setHighlightedVariable(null);
                                            }}
                                        >
                                            {index + 1}
                                        </TableCell>
                                        <TableCell 
                                            className={`cursor-pointer ${
                                                highlightedVariable?.source === 'selected1' && 
                                                testVariables1[index] && 
                                                highlightedVariable.id === testVariables1[index].columnIndex.toString() &&
                                                highlightedVariable.rowIndex === index
                                                    ? "bg-[#E6E6E6] border-[#888888] hover:bg-[#E6E6E6]" 
                                                    : selectedPair === index && !highlightedVariable
                                                        ? "bg-[#E6E6E6] hover:bg-[#E6E6E6]"
                                                        : "hover:bg-[#F7F7F7]"
                                            }`}
                                            onClick={() => {
                                                setSelectedPair(null);
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
                                                    <span className="text-xs">{getDisplayName(testVariables1[index])}</span>
                                                </div>
                                            ) : ""}
                                        </TableCell>
                                        <TableCell 
                                            className={`cursor-pointer ${
                                                highlightedVariable?.source === 'selected2' && 
                                                testVariables2[index] && 
                                                highlightedVariable.id === testVariables2[index].columnIndex.toString() &&
                                                highlightedVariable.rowIndex === index
                                                    ? "bg-[#E6E6E6] border-[#888888] hover:bg-[#E6E6E6]" 
                                                    : selectedPair === index && !highlightedVariable
                                                        ? "bg-[#E6E6E6] hover:bg-[#E6E6E6]"
                                                        : "hover:bg-[#F7F7F7]"
                                            }`}
                                            onClick={() => {
                                                setSelectedPair(null);
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
                                                    <span className="text-xs">{getDisplayName(testVariables2[index])}</span>
                                                </div>
                                            ) : ""}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center">
                    <Checkbox
                        id="estimate-effect-size"
                        checked={estimateEffectSize}
                        onCheckedChange={(checked) => setEstimateEffectSize(!!checked)}
                        className="mr-2 border-[#CCCCCC]"
                        disabled
                    />
                    <Label htmlFor="estimate-effect-size">Estimate effect sizes</Label>
                </div>
            </div>

            {/* Pair Manipulation Buttons */}
            <div className="col-span-1 flex flex-col items-center justify-start gap-4 pt-8">
                <Button
                    variant="outline"
                    size="sm"
                    className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                    onClick={() => selectedPair !== null && handleMoveUpPair(selectedPair)}
                    disabled={selectedPair === null || selectedPair === 0}
                >
                    <ArrowUp size={16} />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                    onClick={() => selectedPair !== null && handleMoveDownPair(selectedPair)}
                    disabled={selectedPair === null || selectedPair === Math.max(testVariables1.length, testVariables2.length) - 1}
                >
                    <ArrowDown size={16} />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                    onClick={() => selectedPair !== null && handleMoveVariableBetweenLists(selectedPair)}
                    disabled={selectedPair === null}
                >
                    <MoveHorizontal size={16} />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] text-red-500 hover:text-red-700"
                    onClick={() => selectedPair !== null && handleRemovePair(selectedPair)}
                    disabled={selectedPair === null}
                >
                    ✕
                </Button>
            </div>

            {/* Calculate standardizer using */}
            <div className="col-span-12 mt-4">
                <div className="text-sm font-medium mb-2">Calculate standardizer using</div>
                <div className="border p-4 rounded-md flex flex-col gap-4">
                    <div className="flex items-center">
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
                            disabled={!estimateEffectSize}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="standardDeviation"
                                    id="standard-deviation-option"
                                    className="mr-2"
                                />
                                <Label htmlFor="standard-deviation-option" className={`${!estimateEffectSize ? 'opacity-50' : ''}`}>Standard deviation of the difference</Label>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="correctedStandardDeviation"
                                    id="corrected-standard-deviation-option"
                                    className="mr-2"
                                />
                                <Label htmlFor="corrected-standard-deviation-option" className={`${!estimateEffectSize ? 'opacity-50' : ''}`}>Corrected standard deviation of the difference</Label>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="averageOfVariances"
                                    id="average-of-variances-option"
                                    className="mr-2"
                                />
                                <Label htmlFor="average-of-variances-option" className={`${!estimateEffectSize ? 'opacity-50' : ''}`}>Average of variances</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariablesTab;