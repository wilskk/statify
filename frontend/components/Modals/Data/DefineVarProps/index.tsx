"use client";

import React, { FC, useState } from "react";
import VariablesToScan from "./VariablesToScan";
import PropertiesEditor from "./PropertiesEditor";
import { Variable } from "@/types/Variable";

interface DefineVariablePropsProps {
    onClose: () => void;
    variables?: Variable[];
    caseLimit?: string;
    valueLimit?: string;
}

const DefineVariableProps: FC<DefineVariablePropsProps> = ({ onClose, variables, caseLimit, valueLimit }) => {
    // State to determine which component to render
    const [currentStep, setCurrentStep] = useState<"scan" | "editor">(variables ? "editor" : "scan");
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>(variables || []);
    const [limits, setLimits] = useState({
        caseLimit: caseLimit || "50",
        valueLimit: valueLimit || "200"
    });

    // Handler for when variables are selected for scanning
    const handleContinueToEditor = (vars: Variable[], caseLim: string | null, valLim: string | null) => {
        setSelectedVariables(vars);
        if (caseLim) setLimits(prev => ({ ...prev, caseLimit: caseLim }));
        if (valLim) setLimits(prev => ({ ...prev, valueLimit: valLim }));
        setCurrentStep("editor");
    };

    // Render the appropriate component based on the current step
    return (
        <>
            {currentStep === "scan" ? (
                <VariablesToScan
                    onClose={onClose}
                    onContinue={handleContinueToEditor}
                />
            ) : (
                <PropertiesEditor
                    onClose={onClose}
                    variables={selectedVariables}
                    caseLimit={limits.caseLimit}
                    valueLimit={limits.valueLimit}
                    onSave={() => onClose()}
                />
            )}
        </>
    );
};

export default DefineVariableProps;