"use client";

import React, { useState, useEffect, FC } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InfoIcon, Shapes, Ruler, BarChartHorizontal, CornerDownRight, CornerDownLeft } from "lucide-react";
import { useVariableStore } from "@/stores/useVariableStore";
import { Variable } from "@/types/Variable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SetMeasurementLevelProps {
    onClose: () => void;
}

const SetMeasurementLevel: FC<SetMeasurementLevelProps> = ({ onClose }) => {
    const { variables, updateVariable } = useVariableStore();

    const [unknownVariables, setUnknownVariables] = useState<Variable[]>([]);
    const [nominalVariables, setNominalVariables] = useState<Variable[]>([]);
    const [ordinalVariables, setOrdinalVariables] = useState<Variable[]>([]);
    const [scaleVariables, setScaleVariables] = useState<Variable[]>([]);

    const [highlightedVariable, setHighlightedVariable] = useState<{
        id: string;
        source: "unknown" | "nominal" | "ordinal" | "scale";
    } | null>(null);

    useEffect(() => {
        const filtered = variables
            .filter(v => v.measure === "unknown")
            .sort((a, b) => a.columnIndex - b.columnIndex);

        setUnknownVariables(filtered);
        setNominalVariables([]);
        setOrdinalVariables([]);
        setScaleVariables([]);
        setHighlightedVariable(null);
    }, [variables]);

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

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

    const handleVariableSelect = (columnIndex: number, source: "unknown" | "nominal" | "ordinal" | "scale") => {
        const variableId = columnIndex.toString();

        if (
            highlightedVariable?.id === variableId &&
            highlightedVariable?.source === source
        ) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({
                id: variableId,
                source,
            });
        }
    };

    const handleVariableDoubleClick = (columnIndex: number, source: "unknown" | "nominal" | "ordinal" | "scale") => {
        const variableId = columnIndex.toString();
        setHighlightedVariable({ id: variableId, source });

        if (source === "unknown") {
            const variable = unknownVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                const targetSource = variable.type === "STRING" ? "nominal" : "scale";
                moveVariable(source, targetSource, variableId);
            }
        } else {
            moveVariable(source, "unknown", variableId);
        }
    };

    const moveVariable = (
        fromSource: "unknown" | "nominal" | "ordinal" | "scale",
        toSource: "unknown" | "nominal" | "ordinal" | "scale",
        variableId: string
    ) => {
        const sourceList = getSourceList(fromSource);
        if (!sourceList) return;

        const variableIndex = sourceList.findIndex(
            v => v.columnIndex.toString() === variableId
        );

        if (variableIndex === -1) return;

        const variable = { ...sourceList[variableIndex] };

        removeFromSource(fromSource, variableId);

        const updateList = (currentList: Variable[], variable: Variable) => {
            const newList = [...currentList, variable];
            return newList.sort((a, b) => a.columnIndex - b.columnIndex);
        };

        switch (toSource) {
            case "unknown":
                setUnknownVariables(prev => updateList(prev, variable));
                break;
            case "nominal":
                setNominalVariables(prev => updateList(prev, variable));
                break;
            case "ordinal":
                setOrdinalVariables(prev => updateList(prev, variable));
                break;
            case "scale":
                setScaleVariables(prev => updateList(prev, variable));
                break;
        }

        setHighlightedVariable(null);
    };

    const getSourceList = (source: "unknown" | "nominal" | "ordinal" | "scale"): Variable[] | null => {
        switch (source) {
            case "unknown":
                return unknownVariables;
            case "nominal":
                return nominalVariables;
            case "ordinal":
                return ordinalVariables;
            case "scale":
                return scaleVariables;
            default:
                return null;
        }
    };

    const removeFromSource = (source: "unknown" | "nominal" | "ordinal" | "scale", id: string) => {
        switch (source) {
            case "unknown":
                setUnknownVariables(prev => prev.filter(v => v.columnIndex.toString() !== id));
                break;
            case "nominal":
                setNominalVariables(prev => prev.filter(v => v.columnIndex.toString() !== id));
                break;
            case "ordinal":
                setOrdinalVariables(prev => prev.filter(v => v.columnIndex.toString() !== id));
                break;
            case "scale":
                setScaleVariables(prev => prev.filter(v => v.columnIndex.toString() !== id));
                break;
        }
    };

    const handleMove = (targetLevel: "nominal" | "ordinal" | "scale") => {
        if (!highlightedVariable) return;

        const { id, source } = highlightedVariable;

        if (source === "unknown") {
            moveVariable("unknown", targetLevel, id);
        } else if (source === targetLevel) {
            moveVariable(targetLevel, "unknown", id);
        } else {
            moveVariable(source, targetLevel, id);
        }
    };

    const handleSave = () => {
        nominalVariables.forEach(variable => {
            updateVariable(variable.columnIndex, "measure", "nominal");
        });

        ordinalVariables.forEach(variable => {
            updateVariable(variable.columnIndex, "measure", "ordinal");
        });

        scaleVariables.forEach(variable => {
            updateVariable(variable.columnIndex, "measure", "scale");
        });

        onClose();
    };

    const handleReset = () => {
        const allVariables = [
            ...nominalVariables,
            ...ordinalVariables,
            ...scaleVariables,
        ].sort((a, b) => a.columnIndex - b.columnIndex);

        setUnknownVariables([...unknownVariables, ...allVariables]);
        setNominalVariables([]);
        setOrdinalVariables([]);
        setScaleVariables([]);
        setHighlightedVariable(null);
    };

    const renderVariableList = (variables: Variable[], source: 'unknown' | 'nominal' | 'ordinal' | 'scale', containerClassName: string) => (
        <div className={`border border-[#E6E6E6] p-2 rounded-md overflow-y-auto overflow-x-hidden ${containerClassName}`}>
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
                                    onClick={() => handleVariableSelect(variable.columnIndex, source)}
                                    onDoubleClick={() => handleVariableDoubleClick(variable.columnIndex, source)}
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
                {variables.length === 0 && (
                    <div className="flex items-center justify-center p-2 text-xs text-[#888888]">
                        No variables
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <DialogContent className="max-w-[650px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Set Measurement Level</DialogTitle>
            </DialogHeader>

            <div className="p-6 overflow-y-auto flex-grow">
                <div className="flex items-center gap-2 py-2 mb-4 bg-[#F7F7F7] p-3 rounded border border-[#E6E6E6]">
                    <InfoIcon className="text-[#444444] h-4 w-4 flex-shrink-0" />
                    <p className="text-[#444444] text-xs">
                        This dialog only displays variables for which the measurement level is unknown.
                        Use Variable View in the Data Editor to change the measurement level for other variables.
                    </p>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-5 flex flex-col">
                        <div className="text-sm mb-2 font-medium">Variables with Unknown Measurement Level:</div>
                        {renderVariableList(unknownVariables, 'unknown', 'flex-grow min-h-[275px]')}
                    </div>

                    <div className="col-span-1 flex flex-col items-center justify-center">
                        <div className="flex flex-col space-y-24">
                            <Button
                                variant="outline"
                                size="sm"
                                className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                onClick={() => handleMove("nominal")}
                                disabled={!highlightedVariable}
                            >
                                {highlightedVariable?.source === 'nominal' ?
                                    <CornerDownLeft size={16} /> :
                                    <CornerDownRight size={16} />
                                }
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                onClick={() => handleMove("ordinal")}
                                disabled={!highlightedVariable}
                            >
                                {highlightedVariable?.source === 'ordinal' ?
                                    <CornerDownLeft size={16} /> :
                                    <CornerDownRight size={16} />
                                }
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                onClick={() => handleMove("scale")}
                                disabled={!highlightedVariable}
                            >
                                {highlightedVariable?.source === 'scale' ?
                                    <CornerDownLeft size={16} /> :
                                    <CornerDownRight size={16} />
                                }
                            </Button>
                        </div>
                    </div>

                    <div className="col-span-6 space-y-5 flex flex-col">
                        <div className="flex-1">
                            <div className="text-sm mb-2 font-medium">Nominal Variables:</div>
                            <div className="text-xs mb-1 text-[#888888]">Used for unranked categories (region, product type)</div>
                            {renderVariableList(nominalVariables, 'nominal', 'h-[73px]')}
                        </div>

                        <div className="flex-1">
                            <div className="text-sm mb-2 font-medium">Ordinal Variables:</div>
                            <div className="text-xs mb-1 text-[#888888]">Used for ranked categories (low, medium, high)</div>
                            {renderVariableList(ordinalVariables, 'ordinal', 'h-[73px]')}
                        </div>

                        <div className="flex-1">
                            <div className="text-sm mb-2 font-medium">Scale/Continuous Variables:</div>
                            <div className="text-xs mb-1 text-[#888888]">Used for numeric measurements (age, income)</div>
                            {renderVariableList(scaleVariables, 'scale', 'h-[73px]')}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center px-6 py-3 border-t border-[#E6E6E6] bg-[#F7F7F7] text-xs text-[#888888] flex-shrink-0">
                <InfoIcon size={14} className="mr-2 flex-shrink-0" />
                <span>Variables will retain their assigned measurement level for statistical analysis</span>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                        onClick={handleSave}
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

export default SetMeasurementLevel;