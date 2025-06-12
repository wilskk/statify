"use client";

import React, { FC, useState, useCallback, useEffect } from "react";
import {
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useVariableSelection } from "./hooks/useVariableSelection";
import { useTestSettings } from "./hooks/useTestSettings";
import { useOneSampleTTestAnalysis } from "./hooks/useOneSampleTTestAnalysis";
import { useDataFetching } from "./hooks/useDataFetching";
import { BaseModalProps } from "@/types/modalTypes";

import VariablesTab from "./VariablesTab";

// Komponen utama konten OneSampleTTest yang agnostik terhadap container
const OneSampleTTestContent: FC<BaseModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<"variables">("variables");
    
    const {
        availableVariables,
        selectedVariables,
        highlightedVariable,
        setHighlightedVariable,
        moveToSelectedVariables,
        moveToAvailableVariables,
        reorderVariables,
        resetVariableSelection
    } = useVariableSelection();

    const {
        testValue,
        setTestValue,
        estimateEffectSize,
        setEstimateEffectSize,
        resetTestSettings
    } = useTestSettings();

    const { 
        isLoading,
        errorMsg, 
        runAnalysis,
        cancelAnalysis
    } = useOneSampleTTestAnalysis({
        selectedVariables,
        testValue,
        estimateEffectSize,
        onClose
    });

    const handleReset = useCallback(() => {
        resetVariableSelection();
        resetTestSettings();
        cancelAnalysis();
    }, [resetVariableSelection, resetTestSettings, cancelAnalysis]);

    const handleTabChange = useCallback((value: string) => {
        if (value === 'variables') {
            setActiveTab(value);
        }
    }, [setActiveTab]);

    useEffect(() => {
        return () => {
            cancelAnalysis();
        };
    }, [cancelAnalysis]);

    return (
        <>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-border flex-shrink-0">
                    <TabsList>
                        <TabsTrigger value="variables">Variables</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <VariablesTab
                        availableVariables={availableVariables}
                        selectedVariables={selectedVariables}
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        moveToSelectedVariables={moveToSelectedVariables}
                        moveToAvailableVariables={moveToAvailableVariables}
                        reorderVariables={reorderVariables}
                        testValue={testValue}
                        setTestValue={setTestValue}
                        estimateEffectSize={estimateEffectSize}
                        setEstimateEffectSize={setEstimateEffectSize}
                    />
                </TabsContent>
            </Tabs>

            {errorMsg && <div className="px-6 py-2 text-destructive">{errorMsg}</div>}

            <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        onClick={runAnalysis}
                        disabled={isLoading}
                    >
                        {isLoading ? "Processing..." : "OK"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={isLoading}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        // onClick={onHelp} // Assuming an onHelp function exists or will be added
                        disabled={isLoading}
                    >
                        Help
                    </Button>
                </div>
            </div>
        </>
    );
};

// Komponen OneSampleTTest yang menjadi titik masuk utama
const OneSampleTTest: FC<BaseModalProps> = ({ onClose, containerType = "dialog", ...props }) => {
    // Render berdasarkan containerType
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <OneSampleTTestContent onClose={onClose} {...props} />
                </div>
            </div>
        );
    }

    // Default dialog view with proper Dialog components
    return (
        <DialogContent className="max-w-[600px] p-0 bg-popover text-popover-foreground border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">One-Sample T Test</DialogTitle>
            </DialogHeader>

            <div className="flex-grow flex flex-col overflow-hidden">
                <OneSampleTTestContent onClose={onClose} {...props} />
            </div>
        </DialogContent>
    );
}

export default OneSampleTTest;
export { OneSampleTTestContent };