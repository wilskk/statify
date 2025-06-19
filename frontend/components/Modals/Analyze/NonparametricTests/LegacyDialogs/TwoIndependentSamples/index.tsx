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
import { DefineGroupsDialog } from "./dialogs/DefineGroupsDialog";
import { 
    useVariableSelection,
    useTwoIndependentSamplesAnalysis
} from "./hooks";
import { HighlightedVariable } from "./types";

// Komponen konten yang digunakan baik untuk sidebar maupun dialog
const TwoIndependentSamplesContent: FC<BaseModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<"variables" | "options">("variables");

    const {
        availableVariables,
        testVariables,
        groupingVariable,
        highlightedVariable,
        setHighlightedVariable,
        moveToTestVariable,
        moveToGroupingVariable,
        moveToAvailableVariables,
        reorderVariables,
        resetVariableSelection
    } = useVariableSelection();

    const [showDefineGroupsModal, setShowDefineGroupsModal] = useState<boolean>(false);
    const [group1, setGroup1] = useState<number | null>(null);
    const [group2, setGroup2] = useState<number | null>(null);
    const [tempGroup1, setTempGroup1] = useState<number | null>(null);
    const [tempGroup2, setTempGroup2] = useState<number | null>(null);
    const [groupRangeError, setGroupRangeError] = useState<string | null>(null);
    
    const [testType, setTestType] = useState({
        mannWhitneyU: true,
        mosesExtremeReactions: false,
        kolmogorovSmirnovZ: false,
        waldWolfowitzRuns: false
    });

    const [displayStatistics, setDisplayStatistics] = useState({
        descriptive: false,
        quartiles: false,
    });

    // Initialize temp values when modal is shown
    useEffect(() => {
        if (showDefineGroupsModal) {
            setTempGroup1(group1);
            setTempGroup2(group2);
        }
    }, [showDefineGroupsModal, group1, group2]);

    // Handle variable selection
    const handleVariableSelect = useCallback((variable: Variable, source: 'available' | 'selected' | 'grouping') => {
        if (!variable) return;
        setHighlightedVariable(variable.columnIndex ? { tempId: variable.columnIndex.toString(), source } : null);
    }, [setHighlightedVariable]);

    // Handle variable movement between lists
    const handleVariableDoubleClick = useCallback((variable: Variable, source: 'available' | 'selected' | 'grouping') => {
        if (!variable) return;

        // Different handling based on source
        switch (source) {
            case 'available':
                // Determine if it should go to test variables or grouping variable
                if (!groupingVariable) {
                    // Ask user if they want to use it as a grouping variable
                    const useAsGrouping = window.confirm(`Use ${variable.name} as grouping variable?`);
                    if (useAsGrouping) {
                        moveToGroupingVariable(variable);
                    } else {
                        moveToTestVariable(variable);
                    }
                } else {
                    // Already have a grouping variable, so add to test variables
                    moveToTestVariable(variable);
                }
                break;
                
            case 'selected':
                // Move from test variables to available
                moveToAvailableVariables(variable, 'selected');
                break;
                
            case 'grouping':
                // Move from grouping to available
                if (groupingVariable && groupingVariable.columnIndex === variable.columnIndex) {
                    moveToAvailableVariables(variable, 'grouping');
                }
                break;
        }
    }, [groupingVariable, moveToTestVariable, moveToGroupingVariable, moveToAvailableVariables]);

    const { isLoading, errorMsg, runAnalysis, cancelAnalysis } = useTwoIndependentSamplesAnalysis({
        testVariables,
        groupingVariable,
        group1,
        group2,
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
            mannWhitneyU: true,
            mosesExtremeReactions: false,
            kolmogorovSmirnovZ: false,
            waldWolfowitzRuns: false
        });
        setDisplayStatistics({
            descriptive: false,
            quartiles: false,
        });
        setGroup1(null);
        setGroup2(null);
        setGroupRangeError(null);
    };

    // Apply changes from Define Groups dialog
    const applyDefineGroups = () => {
        if (tempGroup1 !== null && !Number.isInteger(tempGroup1)) {
            setGroupRangeError("Group 1 value must be an integer");
            return;
        }
        
        if (tempGroup2 !== null && !Number.isInteger(tempGroup2)) {
            setGroupRangeError("Group 2 value must be an integer");
            return;
        }
        
        // Ensure values are integers by rounding them
        const group1Value = tempGroup1 !== null ? Math.floor(tempGroup1) : null;
        const group2Value = tempGroup2 !== null ? Math.floor(tempGroup2) : null;
        
        setGroup1(group1Value);
        setGroup2(group2Value);
        setShowDefineGroupsModal(false);
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
                        groupingVariable={groupingVariable}
                        group1={group1}
                        group2={group2}
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        testType={testType}
                        setTestType={setTestType}
                        handleVariableSelect={handleVariableSelect}
                        handleVariableDoubleClick={handleVariableDoubleClick}
                        handleDefineGroupsClick={() => setShowDefineGroupsModal(true)}
                        moveToAvailableVariables={moveToAvailableVariables}
                        moveToTestVariable={moveToTestVariable}
                        moveToGroupingVariable={moveToGroupingVariable}
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
                            testVariables.length < 1 ||
                            !groupingVariable ||
                            !group1 ||
                            !group2 ||
                            (
                                testType.mannWhitneyU === false &&
                                testType.mosesExtremeReactions === false &&
                                testType.kolmogorovSmirnovZ === false &&
                                testType.waldWolfowitzRuns === false
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

            {/* Define Groups Dialog */}
            <DefineGroupsDialog
                open={showDefineGroupsModal}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowDefineGroupsModal(false);
                        // Reset temp values to current values when closing
                        setTempGroup1(group1);
                        setTempGroup2(group2);
                    }
                }}
                tempGroup1={tempGroup1}
                setTempGroup1={setTempGroup1}
                tempGroup2={tempGroup2}
                setTempGroup2={setTempGroup2}
                groupRangeError={groupRangeError}
                setGroupRangeError={setGroupRangeError}
                onApply={applyDefineGroups}
            />
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
                    <TwoIndependentSamplesContent onClose={onClose} />
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent
    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-[800px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
                <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                    <DialogTitle className="text-[22px] font-semibold">Two-Independent-Samples Tests</DialogTitle>
                </DialogHeader>
                <div className="flex-grow flex flex-col overflow-hidden">
                    <TwoIndependentSamplesContent onClose={onClose} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default Index;