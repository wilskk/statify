"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import { Variable } from "@/types/Variable";
import VariableTab from "./VariableTab";

// Main component
interface SetMeasurementLevelProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

const SetMeasurementLevel: React.FC<SetMeasurementLevelProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    const { variables, updateVariable } = useVariableStore();

    const [unknownVariables, setUnknownVariables] = useState<Variable[]>([]);
    const [nominalVariables, setNominalVariables] = useState<Variable[]>([]);
    const [ordinalVariables, setOrdinalVariables] = useState<Variable[]>([]);
    const [scaleVariables, setScaleVariables] = useState<Variable[]>([]);

    const [highlightedVariable, setHighlightedVariable] = useState<{
        id: string;
        source: string;
    } | null>(null);

    // Initialize lists from store
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

    // Handler for moving variables between lists
    const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
        // Remove from source list
        switch (fromListId) {
            case 'available':
                setUnknownVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
                break;
            case 'nominal':
                setNominalVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
                break;
            case 'ordinal':
                setOrdinalVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
                break;
            case 'scale':
                setScaleVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
                break;
        }

        // Add to target list (sorted by columnIndex)
        const sortedAdd = (list: Variable[]) => {
            const newList = [...list, variable];
            return newList.sort((a, b) => a.columnIndex - b.columnIndex);
        };

        switch (toListId) {
            case 'available':
                setUnknownVariables(prev => sortedAdd(prev));
                break;
            case 'nominal':
                setNominalVariables(prev => sortedAdd(prev));
                break;
            case 'ordinal':
                setOrdinalVariables(prev => sortedAdd(prev));
                break;
            case 'scale':
                setScaleVariables(prev => sortedAdd(prev));
                break;
        }

        // Clear highlight
        setHighlightedVariable(null);
    }, []);

    // Handler for reordering variables within a list
    const handleReorderVariable = useCallback((listId: string, reorderedVariables: Variable[]) => {
        switch (listId) {
            case 'available':
                setUnknownVariables(reorderedVariables);
                break;
            case 'nominal':
                setNominalVariables(reorderedVariables);
                break;
            case 'ordinal':
                setOrdinalVariables(reorderedVariables);
                break;
            case 'scale':
                setScaleVariables(reorderedVariables);
                break;
        }
    }, []);

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

    // Reverted: No Dialog, DialogContent, DialogHeader, or DialogTitle here.
    // It just renders VariableTab directly.
    return (
        <VariableTab
            onClose={onClose}
            unknownVariables={unknownVariables}
            nominalVariables={nominalVariables}
            ordinalVariables={ordinalVariables}
            scaleVariables={scaleVariables}
            highlightedVariable={highlightedVariable}
            setHighlightedVariable={setHighlightedVariable}
            handleMoveVariable={handleMoveVariable}
            handleReorderVariable={handleReorderVariable}
            handleSave={handleSave}
            handleReset={handleReset}
            containerType={containerType}
        />
    );
};

export default SetMeasurementLevel;