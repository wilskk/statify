"use client";

import React from "react";
import VariableTab from "./VariableTab";
import { SetMeasurementLevelProps } from "./types";
import { useSetMeasurementLevel } from "./hooks/useSetMeasurementLevel";

// Main component
// interface SetMeasurementLevelProps {
//     onClose: () => void;
//     containerType?: "dialog" | "sidebar";
// }

const SetMeasurementLevel: React.FC<SetMeasurementLevelProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    const {
        unknownVariables,
        nominalVariables,
        ordinalVariables,
        scaleVariables,
        highlightedVariable,
        setHighlightedVariable,
        handleMoveVariable,
        handleReorderVariable,
        handleSave,
        handleReset,
    } = useSetMeasurementLevel({ onClose });

    // All state, effects, and handlers (except those passed to VariableTab) are now in the hook.

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