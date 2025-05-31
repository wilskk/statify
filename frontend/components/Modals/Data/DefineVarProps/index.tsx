"use client";

import React, { FC, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import VariablesToScan from "./VariablesToScan";
import PropertiesEditor from "./PropertiesEditor";
import { Variable } from "@/types/Variable";

interface DefineVariablePropsProps {
    onClose: () => void;
    variables?: Variable[];
    caseLimit?: string;
    valueLimit?: string;
    containerType?: "dialog" | "sidebar";
}

// Main content component that's agnostic of container type
const DefineVariablePropsContent: FC<DefineVariablePropsProps> = ({ 
    onClose, 
    variables, 
    caseLimit, 
    valueLimit,
    containerType = "dialog"
}) => {
    // State to determine which component to render
    const [currentStep, setCurrentStep] = useState<"scan" | "editor">(variables ? "editor" : "scan");

    // Ensure all variables have tempId
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>(
        variables?.map(v => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}`
        })) || []
    );

    const [limits, setLimits] = useState({
        caseLimit: caseLimit || "50",
        valueLimit: valueLimit || "200"
    });

    // Handler for when variables are selected for scanning
    const handleContinueToEditor = (vars: Variable[], caseLim: string | null, valLim: string | null) => {
        // Ensure all variables have tempId before setting them
        const varsWithTempId = vars.map(v => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}`
        }));

        setSelectedVariables(varsWithTempId);
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
                    containerType={containerType}
                />
            ) : (
                <PropertiesEditor
                    onClose={onClose}
                    variables={selectedVariables}
                    caseLimit={limits.caseLimit}
                    valueLimit={limits.valueLimit}
                    onSave={() => onClose()}
                    containerType={containerType}
                />
            )}
        </>
    );
};

// Main component that handles different container types
const DefineVariableProps: FC<DefineVariablePropsProps> = ({ 
    onClose, 
    variables, 
    caseLimit, 
    valueLimit,
    containerType = "dialog" 
}) => {
    // If sidebar mode, use a div container without header (header is provided by SidebarContainer)
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <DefineVariablePropsContent 
                        onClose={onClose} 
                        variables={variables} 
                        caseLimit={caseLimit} 
                        valueLimit={valueLimit}
                        containerType={containerType}
                    />
                </div>
            </div>
        );
    }

    // For dialog mode, the individual components will handle their own dialogs
    return (
        <DefineVariablePropsContent 
            onClose={onClose} 
            variables={variables} 
            caseLimit={caseLimit} 
            valueLimit={valueLimit}
            containerType={containerType}
        />
    );
};

export default DefineVariableProps;