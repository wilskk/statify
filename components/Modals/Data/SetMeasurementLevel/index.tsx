// components/modals/SetMeasurementLevel/index.tsx
"use client";

import React, { useState, useEffect } from "react";
import { StatifyModal } from "@/components/ui/statifyModal";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";
import { TransferControl } from "@/components/ui/transferControl";
import { VariableList } from "@/components/ui/variableList";
import { useVariableStore } from "@/stores/useVariableStore";
import { Variable } from "@/types/Variable";

interface SetMeasurementLevelProps {
    isOpen: boolean;
    onClose: () => void;
}

const SetMeasurementLevel: React.FC<SetMeasurementLevelProps> = ({
                                                                     isOpen,
                                                                     onClose,
                                                                 }) => {
    const { variables, updateVariable } = useVariableStore();

    // Variables lists for each measurement level
    const [unknownVariables, setUnknownVariables] = useState<Variable[]>([]);
    const [nominalVariables, setNominalVariables] = useState<Variable[]>([]);
    const [ordinalVariables, setOrdinalVariables] = useState<Variable[]>([]);
    const [scaleVariables, setScaleVariables] = useState<Variable[]>([]);

    // Track which variable is currently selected
    const [highlightedVariable, setHighlightedVariable] = useState<{
        id: string;
        source: string;
    } | null>(null);

    // Define our sources in order (for TransferControl)
    const sources = ["unknown", "nominal", "ordinal", "scale"];

    // Initialize variables on component mount
    useEffect(() => {
        if (isOpen) {
            const filtered = variables.filter(v => v.measure === "unknown");
            setUnknownVariables(filtered);

            // Reset destination categories
            setNominalVariables([]);
            setOrdinalVariables([]);
            setScaleVariables([]);
            setHighlightedVariable(null);
        }
    }, [isOpen, variables]);

    // Handle selection of a variable
    const handleVariableSelect = (columnIndex: number, source: string) => {
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

    // Handle double-click to move variables
    const handleVariableDoubleClick = (columnIndex: number, source: string) => {
        const variableId = columnIndex.toString();
        setHighlightedVariable({ id: variableId, source });

        // Find target source based on current source
        const sourceIndex = sources.indexOf(source);

        if (source === "unknown") {
            // Find appropriate default target for unknown variables
            const variable = unknownVariables.find(v => v.columnIndex === columnIndex);
            const targetSource = variable?.type === "STRING" ? "nominal" : "scale";
            moveVariable(source, targetSource, variableId);
        } else {
            // Move back to unknown
            moveVariable(source, "unknown", variableId);
        }
    };

    // Move variable between lists
    const moveVariable = (fromSource: string, toSource: string, variableId: string) => {
        const sourceList = getSourceList(fromSource);
        if (!sourceList) return;

        const variableIndex = sourceList.findIndex(
            v => v.columnIndex.toString() === variableId
        );

        if (variableIndex === -1) return;

        const variable = { ...sourceList[variableIndex] };

        // Remove from source list
        removeFromSource(fromSource, variableId);

        // Add to destination list
        switch (toSource) {
            case "unknown":
                setUnknownVariables([...unknownVariables, variable]);
                break;
            case "nominal":
                setNominalVariables([...nominalVariables, variable]);
                break;
            case "ordinal":
                setOrdinalVariables([...ordinalVariables, variable]);
                break;
            case "scale":
                setScaleVariables([...scaleVariables, variable]);
                break;
        }

        setHighlightedVariable(null);
    };

    // Get the source list based on source name
    const getSourceList = (source: string): Variable[] | null => {
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

    // Remove a variable from its source list
    const removeFromSource = (source: string, id: string) => {
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

    // Handle bidirectional transfer between lists
    const handleTransfer = (direction: "left" | "right") => {
        if (!highlightedVariable) return;

        const { id, source } = highlightedVariable;
        const sourceIndex = sources.indexOf(source);

        if (sourceIndex === -1) return;

        let targetSource: string;

        if (direction === "left") {
            if (sourceIndex > 0) {
                targetSource = sources[sourceIndex - 1];
                moveVariable(source, targetSource, id);
            }
        } else { // right
            if (sourceIndex < sources.length - 1) {
                targetSource = sources[sourceIndex + 1];
                moveVariable(source, targetSource, id);
            }
        }
    };

    // Handle save action
    const handleSave = () => {
        // Update all variables with their new measurement levels
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

    // Reset form
    const handleReset = () => {
        // Move all variables back to unknown list
        const allVariables = [
            ...nominalVariables,
            ...ordinalVariables,
            ...scaleVariables,
        ];

        setUnknownVariables([...unknownVariables, ...allVariables]);
        setNominalVariables([]);
        setOrdinalVariables([]);
        setScaleVariables([]);
        setHighlightedVariable(null);
    };

    // Custom footer buttons
    const footerButtons = (
        <>
            <Button
                className="bg-black text-white hover:opacity-90 h-8"
                onClick={handleSave}
            >
                OK
            </Button>
            <Button
                variant="outline"
                className="border-[#CCCCCC] text-black h-8"
            >
                Paste
            </Button>
            <Button
                variant="outline"
                className="border-[#CCCCCC] text-black h-8"
                onClick={handleReset}
            >
                Reset
            </Button>
            <Button
                variant="outline"
                className="border-[#CCCCCC] text-black h-8"
                onClick={onClose}
            >
                Cancel
            </Button>
            <Button
                variant="outline"
                className="border-[#CCCCCC] text-black h-8"
            >
                Help
            </Button>
        </>
    );

    return (
        <StatifyModal
            open={isOpen}
            onClose={onClose}
            title="Set Measurement Level for Unknown Variables"
            size="xl"
            footerButtons={footerButtons}
        >
            <div className="flex items-center gap-3 mb-4 bg-[#F7F7F7] p-3 rounded">
                <InfoIcon className="text-[#444444] h-5 w-5" />
                <p className="text-[#444444] text-sm">
                    This dialog only displays fields for which the measurement level is unknown.
                    Use Variable View in the Data Editor to change the measurement level for other fields.
                </p>
            </div>

            <div className="grid grid-cols-12 gap-4">
                {/* Left column - Unknown Variables */}
                <div className="col-span-5">
                    <VariableList
                        title="Fields with Unknown Measurement Level"
                        variables={unknownVariables}
                        highlightedVariable={highlightedVariable}
                        source="unknown"
                        height="300px"
                        onVariableSelect={handleVariableSelect}
                        onVariableDoubleClick={handleVariableDoubleClick}
                    />
                </div>

                {/* Transfer controls */}
                <div className="col-span-2 flex items-center justify-center">
                    <TransferControl
                        highlightedVariable={highlightedVariable}
                        onTransfer={handleTransfer}
                        orientation="horizontal"
                        sources={sources}
                    />
                </div>

                {/* Right column - Measurement levels */}
                <div className="col-span-5 space-y-4">
                    {/* Nominal */}
                    <div className="space-y-2">
                        <VariableList
                            title="Nominal"
                            variables={nominalVariables}
                            highlightedVariable={highlightedVariable}
                            source="nominal"
                            height="80px"
                            subtitle="Used for unranked categories (region, product type)"
                            onVariableSelect={handleVariableSelect}
                            onVariableDoubleClick={handleVariableDoubleClick}
                        />
                    </div>

                    {/* Ordinal */}
                    <div className="space-y-2">
                        <VariableList
                            title="Ordinal"
                            variables={ordinalVariables}
                            highlightedVariable={highlightedVariable}
                            source="ordinal"
                            height="80px"
                            subtitle="Used for ranked categories (low, medium, high)"
                            onVariableSelect={handleVariableSelect}
                            onVariableDoubleClick={handleVariableDoubleClick}
                        />
                    </div>

                    {/* Scale */}
                    <div className="space-y-2">
                        <VariableList
                            title="Scale/Continuous"
                            variables={scaleVariables}
                            highlightedVariable={highlightedVariable}
                            source="scale"
                            height="80px"
                            subtitle="Used for numeric measurements (age, income)"
                            onVariableSelect={handleVariableSelect}
                            onVariableDoubleClick={handleVariableDoubleClick}
                        />
                    </div>
                </div>
            </div>
        </StatifyModal>
    );
};

export default SetMeasurementLevel;