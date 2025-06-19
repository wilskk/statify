"use client";

import React, { FC, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Dialog
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import type { Variable } from "@/types/Variable";
import { BaseModalProps } from "@/types/modalTypes";

import VariablesTab from "./VariablesTab";
import OptionsTab from "./OptionsTab";
import { 
    useVariableSelection,
    useKRelatedSamplesAnalysis
} from "./hooks";
import { HighlightedVariable } from "./types";

// Komponen konten yang digunakan baik untuk sidebar maupun dialog
const KRelatedSamplesContent: FC<BaseModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<"variables" | "options">("variables");

    const {
        availableVariables,
        testVariables,
        highlightedVariable,
        setHighlightedVariable,
        moveToTestVariable,
        moveToAvailableVariables,
        reorderVariables,
        resetVariableSelection
    } = useVariableSelection();
    
    const [testType, setTestType] = useState({
        friedman: true,
        kendallsW: false,
        cochransQ: false
    });

    const [displayStatistics, setDisplayStatistics] = useState({
        descriptive: false,
        quartile: false,
    });

    // Handle variable selection
    const handleVariableSelect = useCallback((variable: Variable, source: 'available' | 'selected') => {
        if (!variable) return;
        setHighlightedVariable(variable.columnIndex ? { tempId: variable.columnIndex.toString(), source } : null);
    }, [setHighlightedVariable]);

    // Handle variable movement between lists
    const handleVariableDoubleClick = useCallback((variable: Variable, source: 'available' | 'selected') => {
        if (!variable) return;

        // Different handling based on source
        switch (source) {
            case 'available':
                // Move from available to test variables
                moveToTestVariable(variable);
                break;
                
            case 'selected':
                // Move from test variables to available
                moveToAvailableVariables(variable, 'selected');
                break;
        }
    }, [moveToTestVariable, moveToAvailableVariables]);

    const { isLoading, errorMsg, runAnalysis, cancelAnalysis } = useKRelatedSamplesAnalysis({
        testVariables,
        testType,
        displayStatistics,
        onClose
    });

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (cancelAnalysis) {
                cancelAnalysis();
            }
        };
    }, [cancelAnalysis]);

    const handleTabChange = useCallback((value: string) => {
        if (value === 'variables' || value === 'options') {
            setActiveTab(value as "variables" | "options");
        }
    }, [setActiveTab]);

    const handleReset = () => {
        resetVariableSelection();
        setTestType({
            friedman: true,
            kendallsW: false,
            cochransQ: false
        });
        setDisplayStatistics({
            descriptive: false,
            quartile: false,
        });
    };

    return (
        <>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-[#E6E6E6] flex-shrink-0">
                    <TabsList className="bg-[#F7F7F7] rounded-none h-9 p-0">
                        <TabsTrigger
                            value="variables"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'variables' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Variables
                        </TabsTrigger>
                        <TabsTrigger
                            value="options"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'options' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Options
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <VariablesTab
                        availableVariables={availableVariables}
                        testVariables={testVariables}
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        testType={testType}
                        setTestType={setTestType}
                        handleVariableSelect={handleVariableSelect}
                        handleVariableDoubleClick={handleVariableDoubleClick}
                        moveToAvailableVariables={moveToAvailableVariables}
                        moveToTestVariable={moveToTestVariable}
                        reorderVariables={reorderVariables}
                        errorMsg={errorMsg}
                    />
                </TabsContent>

                <TabsContent value="options" className="p-6 overflow-y-auto flex-grow">
                    <OptionsTab
                        displayStatistics={displayStatistics}
                        setDisplayStatistics={setDisplayStatistics}
                    />
                </TabsContent>
            </Tabs>
            
            <div className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                        onClick={runAnalysis}
                        disabled={
                            isLoading ||
                            testVariables.length < 2 ||
                            (
                                testType.friedman === false &&
                                testType.kendallsW === false &&
                                testType.cochransQ === false
                            )
                        }
                    >
                        {isLoading ? "Calculating..." : "OK"}
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        onClick={handleReset}
                        disabled={isLoading}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </>
    );
};

// Main component that handles rendering based on containerType
const Index: FC<BaseModalProps> = ({ onClose, containerType = "dialog", ...props }) => {
    // If sidebar mode, use div container without header
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <KRelatedSamplesContent onClose={onClose} />
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent
    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-[800px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
                <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                    <DialogTitle className="text-[22px] font-semibold">Tests for Several Related Samples</DialogTitle>
                </DialogHeader>
                <div className="flex-grow flex flex-col overflow-hidden">
                    <KRelatedSamplesContent onClose={onClose} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default Index;