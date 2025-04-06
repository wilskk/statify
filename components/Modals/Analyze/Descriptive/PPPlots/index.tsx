"use client";
import React, { useState, useEffect, FC } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CornerDownRight,
    CornerDownLeft,
    Ruler,
    Shapes,
    BarChartHorizontal,
    InfoIcon
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import type { Variable } from "@/types/Variable";

interface PPPlotsModalProps {
    onClose: () => void;
}

const PPPlotsModal: FC<PPPlotsModalProps> = ({ onClose }) => {
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available' | 'selected'} | null>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [testDistribution, setTestDistribution] = useState<string>("Normal");
    const [degreesOfFreedom, setDegreesOfFreedom] = useState<string>("");

    const [estimateFromData, setEstimateFromData] = useState<boolean>(true);
    const [location, setLocation] = useState<string>("0");
    const [scale, setScale] = useState<string>("1");

    const [naturalLogTransform, setNaturalLogTransform] = useState<boolean>(false);
    const [standardizeValues, setStandardizeValues] = useState<boolean>(false);
    const [difference, setDifference] = useState<boolean>(false);
    const [differenceValue, setDifferenceValue] = useState<string>("1");
    const [seasonallyDifference, setSeasonallyDifference] = useState<boolean>(false);
    const [seasonallyDifferenceValue, setSeasonallyDifferenceValue] = useState<string>("1");
    const [currentPeriodicity, setCurrentPeriodicity] = useState<string>("None");

    const [proportionEstimation, setProportionEstimation] = useState<string>("Blom's");

    const [rankAssignedToTies, setRankAssignedToTies] = useState<string>("Mean");

    const variables = useVariableStore.getState().variables;
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    useEffect(() => {
        const validVars = variables.filter(v => v.name !== "");
        setAvailableVariables(validVars);
    }, [variables]);

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

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    const handleVariableSelect = (variable: Variable, source: 'available' | 'selected') => {
        if (highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: variable.columnIndex.toString(), source });
        }
    };

    const handleVariableDoubleClick = (variable: Variable, source: 'available' | 'selected') => {
        if (source === 'available') {
            moveToSelectedVariables(variable);
        } else if (source === 'selected') {
            moveToAvailableVariables(variable);
        }
    };

    const moveToSelectedVariables = (variable: Variable) => {
        setSelectedVariables(prev => [...prev, variable]);
        setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const moveToAvailableVariables = (variable: Variable) => {
        setAvailableVariables(prev => [...prev, variable]);
        setSelectedVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const handleMoveVariable = () => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'available') {
            const variable = availableVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
            if (variable) {
                moveToSelectedVariables(variable);
            }
        } else if (highlightedVariable.source === 'selected') {
            const variable = selectedVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
            if (variable) {
                moveToAvailableVariables(variable);
            }
        }
    };

    const renderVariableList = (variables: Variable[], source: 'available' | 'selected', height: string) => (
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

    const handleAnalyze = async () => {
        if (selectedVariables.length === 0) {
            setErrorMsg("Please select at least one variable.");
            return;
        }

        setErrorMsg(null);
        setIsCalculating(true);

        try {
            setTimeout(() => {
                const variableNames = selectedVariables.map(v => v.name).join(" ");
                const logMsg = `P-P PLOTS VARIABLES=${variableNames} DIST=${testDistribution}`;

                addLog({ log: logMsg }).then(logId => {
                    addAnalytic(logId, {
                        title: "P-P Plots",
                        note: ""
                    }).then(analyticId => {
                        addStatistic(analyticId, {
                            title: "Probability-Probability Plot",
                            output_data: JSON.stringify({
                                type: "ppplot",
                                variables: selectedVariables.map(v => v.name),
                                options: {
                                    testDistribution,
                                    degreesOfFreedom,
                                    estimateFromData,
                                    location,
                                    scale,
                                    transform: {
                                        naturalLogTransform,
                                        standardizeValues,
                                        difference,
                                        differenceValue,
                                        seasonallyDifference,
                                        seasonallyDifferenceValue,
                                        currentPeriodicity
                                    },
                                    proportionEstimation,
                                    rankAssignedToTies
                                }
                            }),
                            components: "P-P Plot",
                            description: ""
                        }).then(() => {
                            setIsCalculating(false);
                            onClose();
                        });
                    });
                });
            }, 1500);

        } catch (ex) {
            console.error(ex);
            setErrorMsg("Something went wrong.");
            setIsCalculating(false);
        }
    };

    return (
        <DialogContent className="max-w-[650px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">P-P Plots</DialogTitle>
            </DialogHeader>

            <div className="p-6 overflow-y-auto flex-grow">
                <div className="grid grid-cols-9 gap-6">
                    <div className="col-span-3">
                        <div className="text-sm mb-2 font-medium">Variables:</div>
                        {renderVariableList(availableVariables, 'available', '300px')}
                        <div className="text-xs mt-2 text-[#888888] flex items-center">
                            <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                            <span>To change a variable&apos;s measurement level, right click on it in the Variables list.</span>
                        </div>
                    </div>

                    <div className="col-span-3 space-y-6">
                        <div>
                            <div className="text-sm mb-2 font-medium">Selected Variables:</div>
                            <div className="flex mb-4">
                                <div className="mr-2 flex flex-col space-y-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                        onClick={handleMoveVariable}
                                        disabled={!highlightedVariable || (highlightedVariable.source !== 'available' && highlightedVariable.source !== 'selected')}
                                    >
                                        {highlightedVariable?.source === 'selected' ?
                                            <CornerDownLeft size={16} /> :
                                            <CornerDownRight size={16} />
                                        }
                                    </Button>
                                </div>
                                <div className="flex-grow">
                                    {renderVariableList(selectedVariables, 'selected', '180px')}
                                </div>
                            </div>
                        </div>

                        <div className="border border-[#E6E6E6] rounded-md p-4">
                            <div className="text-sm font-medium mb-3">Transform</div>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <Checkbox
                                        id="naturalLogTransform"
                                        checked={naturalLogTransform}
                                        onCheckedChange={(checked) => setNaturalLogTransform(!!checked)}
                                        className="mr-2 border-[#CCCCCC]"
                                    />
                                    <Label htmlFor="naturalLogTransform" className="text-sm cursor-pointer">
                                        Natural log transform
                                    </Label>
                                </div>
                                <div className="flex items-center">
                                    <Checkbox
                                        id="standardizeValues"
                                        checked={standardizeValues}
                                        onCheckedChange={(checked) => setStandardizeValues(!!checked)}
                                        className="mr-2 border-[#CCCCCC]"
                                    />
                                    <Label htmlFor="standardizeValues" className="text-sm cursor-pointer">
                                        Standardize values
                                    </Label>
                                </div>
                                <div className="flex items-center">
                                    <Checkbox
                                        id="difference"
                                        checked={difference}
                                        onCheckedChange={(checked) => setDifference(!!checked)}
                                        className="mr-2 border-[#CCCCCC]"
                                    />
                                    <Label htmlFor="difference" className="text-sm cursor-pointer mr-2">
                                        Difference:
                                    </Label>
                                    <Input
                                        value={differenceValue}
                                        onChange={(e) => setDifferenceValue(e.target.value)}
                                        className="h-8 text-sm w-16 border-[#CCCCCC] focus:border-black focus:ring-black"
                                        disabled={!difference}
                                    />
                                </div>
                                <div className="flex items-center">
                                    <Checkbox
                                        id="seasonallyDifference"
                                        checked={seasonallyDifference}
                                        onCheckedChange={(checked) => setSeasonallyDifference(!!checked)}
                                        className="mr-2 border-[#CCCCCC]"
                                        disabled={true}
                                    />
                                    <Label htmlFor="seasonallyDifference" className="text-sm cursor-pointer text-gray-400 mr-2">
                                        Seasonally difference:
                                    </Label>
                                    <Input
                                        value={seasonallyDifferenceValue}
                                        onChange={(e) => setSeasonallyDifferenceValue(e.target.value)}
                                        className="h-8 text-sm w-16 border-[#CCCCCC] focus:border-black focus:ring-black bg-gray-100"
                                        disabled={true}
                                    />
                                </div>
                                <div className="pt-2">
                                    <Label className="text-sm mr-2">
                                        Current Periodicity:
                                    </Label>
                                    <span className="text-sm">None</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-3 space-y-6">
                        <div className="border border-[#E6E6E6] rounded-md p-4">
                            <div className="text-sm font-medium mb-3">Test Distribution</div>
                            <div className="space-y-3">
                                <Select
                                    value={testDistribution}
                                    onValueChange={setTestDistribution}
                                >
                                    <SelectTrigger className="h-8 text-sm border-[#CCCCCC] focus:border-black focus:ring-black">
                                        <SelectValue placeholder="Select a distribution" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Normal">Normal</SelectItem>
                                        <SelectItem value="Uniform">Uniform</SelectItem>
                                        <SelectItem value="Exponential">Exponential</SelectItem>
                                        <SelectItem value="t">Student&apos;s t</SelectItem>
                                        <SelectItem value="Chi-square">Chi-square</SelectItem>
                                        <SelectItem value="F">F</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center mt-2">
                                    <Label htmlFor="degreesOfFreedom" className="text-sm mr-2">
                                        df:
                                    </Label>
                                    <Input
                                        id="degreesOfFreedom"
                                        value={degreesOfFreedom}
                                        onChange={(e) => setDegreesOfFreedom(e.target.value)}
                                        className="h-8 text-sm w-16 border-[#CCCCCC] focus:border-black focus:ring-black"
                                        disabled={testDistribution !== "t" && testDistribution !== "Chi-square" && testDistribution !== "F"}
                                    />
                                </div>
                            </div>
                            <div className="mt-4 border-t border-[#E6E6E6] pt-3">
                                <div className="text-sm font-medium mb-3">Distribution Parameters</div>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <Checkbox
                                            id="estimateFromData"
                                            checked={estimateFromData}
                                            onCheckedChange={(checked) => setEstimateFromData(!!checked)}
                                            className="mr-2 border-[#CCCCCC]"
                                        />
                                        <Label htmlFor="estimateFromData" className="text-sm cursor-pointer">
                                            Estimate from data
                                        </Label>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm">
                                            Location:
                                        </Label>
                                        <Input
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="h-8 text-sm w-16 border-[#CCCCCC] focus:border-black focus:ring-black"
                                            disabled={estimateFromData}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm">
                                            Scale:
                                        </Label>
                                        <Input
                                            value={scale}
                                            onChange={(e) => setScale(e.target.value)}
                                            className="h-8 text-sm w-16 border-[#CCCCCC] focus:border-black focus:ring-black"
                                            disabled={estimateFromData}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border border-[#E6E6E6] rounded-md p-4">
                            <div className="text-sm font-medium mb-3">Proportion Estimation Formula</div>
                            <RadioGroup
                                value={proportionEstimation}
                                onValueChange={setProportionEstimation}
                                className="space-y-2"
                            >
                                <div className="flex space-x-4">
                                    <div className="flex items-center">
                                        <RadioGroupItem
                                            value="Blom's"
                                            id="bloms"
                                            className="mr-2 border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                        />
                                        <Label htmlFor="bloms" className="text-sm cursor-pointer">
                                            Blom&apos;s
                                        </Label>
                                    </div>
                                    <div className="flex items-center">
                                        <RadioGroupItem
                                            value="Rankit"
                                            id="rankit"
                                            className="mr-2 border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                        />
                                        <Label htmlFor="rankit" className="text-sm cursor-pointer">
                                            Rankit
                                        </Label>
                                    </div>
                                </div>
                                <div className="flex space-x-4">
                                    <div className="flex items-center">
                                        <RadioGroupItem
                                            value="Tukey's"
                                            id="tukeys"
                                            className="mr-2 border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                        />
                                        <Label htmlFor="tukeys" className="text-sm cursor-pointer">
                                            Tukey&apos;s
                                        </Label>
                                    </div>
                                    <div className="flex items-center">
                                        <RadioGroupItem
                                            value="Van der Waerden's"
                                            id="vanderwaerdens"
                                            className="mr-2 border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                        />
                                        <Label htmlFor="vanderwaerdens" className="text-sm cursor-pointer">
                                            Van der Waerden&apos;s
                                        </Label>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="border border-[#E6E6E6] rounded-md p-4">
                            <div className="text-sm font-medium mb-3">Rank Assigned to Ties</div>
                            <RadioGroup
                                value={rankAssignedToTies}
                                onValueChange={setRankAssignedToTies}
                                className="space-y-2"
                            >
                                <div className="flex space-x-4">
                                    <div className="flex items-center">
                                        <RadioGroupItem
                                            value="Mean"
                                            id="mean"
                                            className="mr-2 border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                        />
                                        <Label htmlFor="mean" className="text-sm cursor-pointer">
                                            Mean
                                        </Label>
                                    </div>
                                    <div className="flex items-center">
                                        <RadioGroupItem
                                            value="High"
                                            id="high"
                                            className="mr-2 border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                        />
                                        <Label htmlFor="high" className="text-sm cursor-pointer">
                                            High
                                        </Label>
                                    </div>
                                </div>
                                <div className="flex space-x-4">
                                    <div className="flex items-center">
                                        <RadioGroupItem
                                            value="Low"
                                            id="low"
                                            className="mr-2 border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                        />
                                        <Label htmlFor="low" className="text-sm cursor-pointer">
                                            Low
                                        </Label>
                                    </div>
                                    <div className="flex items-center">
                                        <RadioGroupItem
                                            value="Break ties arbitrarily"
                                            id="breaktiesarbitrarily"
                                            className="mr-2 border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                        />
                                        <Label htmlFor="breaktiesarbitrarily" className="text-sm cursor-pointer">
                                            Break ties arbitrarily
                                        </Label>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                </div>

                {errorMsg && <div className="text-red-600 text-sm mt-4">{errorMsg}</div>}
            </div>

            <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                        onClick={handleAnalyze}
                        disabled={isCalculating}
                    >
                        {isCalculating ? "Calculating..." : "OK"}
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

export default PPPlotsModal;