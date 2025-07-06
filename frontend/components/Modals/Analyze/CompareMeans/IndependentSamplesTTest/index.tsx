"use client";

import React, { FC, useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import type { Variable } from "@/types/Variable";
import { BaseModalProps } from "@/types/modalTypes";

import VariablesTab from "./components/VariablesTab";
import { DefineGroupsDialog } from "./dialogs/DefineGroupsDialog";
import { 
    useVariableSelection,
    useGroupSettings,
    useIndependentSamplesTTestAnalysis
} from "./hooks";
import { DefineGroupsOptions, HighlightedVariable } from "./types";

// Komponen konten yang digunakan baik untuk sidebar maupun dialog
const IndependentSamplesTTestContent: FC<BaseModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<"variables">("variables");

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
    const [cutPointValue, setCutPointValue] = useState<number | null>(null);
    const [defineGroups, setDefineGroups] = useState<DefineGroupsOptions>({
        useSpecifiedValues: true,
        cutPoint: false,
        group1: null,
        group2: null,
        cutPointValue: null
    });

    const [tempDefineGroups, setTempDefineGroups] = useState<DefineGroupsOptions>({
        useSpecifiedValues: true,
        cutPoint: false,
        group1: null,
        group2: null,
        cutPointValue: null
    });
    const [tempGroup1, setTempGroup1] = useState<number | null>(null);
    const [tempGroup2, setTempGroup2] = useState<number | null>(null);
    const [tempCutPointValue, setTempCutPointValue] = useState<number | null>(null);
    const [groupRangeError, setGroupRangeError] = useState<string | null>(null);
    
    const [estimateEffectSize, setEstimateEffectSize] = useState<boolean>(false);
    
    // Initialize temp values when modal is shown
    useEffect(() => {
        if (showDefineGroupsModal) {
            setTempGroup1(group1);
            setTempGroup2(group2);
            setTempCutPointValue(cutPointValue);
            setTempDefineGroups({
                ...defineGroups
            });
        }
    }, [showDefineGroupsModal, group1, group2, cutPointValue, defineGroups]);

    // Handle variable selection
    const handleVariableSelect = useCallback((variable: Variable, source: 'available' | 'selected' | 'grouping') => {
        if (!variable) return;
        setHighlightedVariable(variable.columnIndex ? { tempId: variable.columnIndex.toString(), source } : null);
    }, [setHighlightedVariable]);

    // Handle variable movement between lists
    const handleMoveVariable = useCallback((variable: Variable, source: 'available' | 'selected' | 'grouping', targetIndex?: number) => {
        if (!variable) return;

        // Different handling based on source
        switch (source) {
            case 'available':
                // Move from available to test variables
                moveToTestVariable(variable, targetIndex);
                break;
                
            case 'selected':
                // Move from test variables to available
                moveToAvailableVariables(variable, 'selected', targetIndex);
                break;
                
            case 'grouping':
                // Move from grouping to available
                if (groupingVariable && groupingVariable.id === variable.id) {
                    moveToAvailableVariables(variable, 'grouping', targetIndex);
                }
                break;
        }
    }, [groupingVariable, moveToTestVariable, moveToAvailableVariables]);

    const { isLoading, errorMsg, runAnalysis, cancelAnalysis } = useIndependentSamplesTTestAnalysis({
        testVariables,
        groupingVariable,
        defineGroups,
        group1,
        group2,
        cutPointValue,
        estimateEffectSize,
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
        if (value === 'variables') {
            setActiveTab(value);
        }
    }, [setActiveTab]);

    const handleReset = () => {
        resetVariableSelection();
        setEstimateEffectSize(false);
        setDefineGroups({
            useSpecifiedValues: true,
            cutPoint: false,
            group1: null,
            group2: null,
            cutPointValue: null
        });
        setGroup1(null);
        setGroup2(null);
        setCutPointValue(null);
        setGroupRangeError(null);
    };

    // Placeholder for Paste functionality
    const handlePaste = () => {
        console.log("Paste action triggered");
        // TODO: Implement paste logic if needed
    };

    // Placeholder for Help functionality
    const handleHelp = () => {
        console.log("Help action triggered");
        // TODO: Implement help logic if needed
    };

    // Apply changes from Define Groups dialog
    const applyDefineGroups = () => {
        if (tempDefineGroups.useSpecifiedValues) {
            if (tempGroup1 !== null && !Number.isInteger(tempGroup1)) {
                setGroupRangeError("Minimum value must be an integer");
                return;
            }
            
            if (tempGroup2 !== null && !Number.isInteger(tempGroup2)) {
                setGroupRangeError("Maximum value must be an integer");
                return;
            }
            
            // Ensure values are integers by rounding them
            const group1Value = tempGroup1 !== null ? Math.floor(tempGroup1) : null;
            const group2Value = tempGroup2 !== null ? Math.floor(tempGroup2) : null;
            
            setGroup1(group1Value);
            setGroup2(group2Value);
        } else {
            if (tempCutPointValue !== null && !Number.isInteger(tempCutPointValue)) {
                setGroupRangeError("Cut point must be an integer");
                return;
            }
            
            setCutPointValue(tempCutPointValue);
        }
        
        setDefineGroups({
            useSpecifiedValues: tempDefineGroups.useSpecifiedValues,
            cutPoint: tempDefineGroups.cutPoint,
            group1: tempGroup1,
            group2: tempGroup2,
            cutPointValue: tempCutPointValue
        });
        setShowDefineGroupsModal(false);
    };

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
                        testVariables={testVariables}
                        groupingVariable={groupingVariable}
                        defineGroups={defineGroups}
                        group1={group1}
                        group2={group2}
                        cutPointValue={cutPointValue}
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        estimateEffectSize={estimateEffectSize}
                        handleVariableSelect={handleVariableSelect}
                        handleVariableDoubleClick={handleMoveVariable}
                        handleDefineGroupsClick={() => setShowDefineGroupsModal(true)} 
                        moveToAvailableVariables={moveToAvailableVariables}
                        moveToTestVariable={moveToTestVariable}
                        moveToGroupingVariable={moveToGroupingVariable}
                        reorderVariables={reorderVariables}
                        errorMsg={errorMsg}
                    />
                </TabsContent>
            </Tabs>
            
            <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        onClick={runAnalysis}
                        disabled={
                            isLoading ||
                            testVariables.length < 1 ||
                            !groupingVariable ||
                            (defineGroups.useSpecifiedValues && (!group1 || !group2)) ||
                            (defineGroups.cutPoint && !cutPointValue)
                        }
                    >
                        {isLoading ? "Processing..." : "OK"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handlePaste}
                        disabled={isLoading}
                    >
                        Paste
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
                        onClick={handleHelp}
                        disabled={isLoading}
                    >
                        Help
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
                        setTempCutPointValue(cutPointValue);
                        setTempDefineGroups({
                            ...defineGroups
                        });
                    }
                }}
                tempDefineGroups={tempDefineGroups}
                setTempDefineGroups={setTempDefineGroups}
                tempGroup1={tempGroup1}
                setTempGroup1={setTempGroup1}
                tempGroup2={tempGroup2}
                setTempGroup2={setTempGroup2}
                tempCutPointValue={tempCutPointValue}
                setTempCutPointValue={setTempCutPointValue}
                groupRangeError={groupRangeError}
                setGroupRangeError={setGroupRangeError}
                onApply={applyDefineGroups}
            />
        </>
    );
};

// Komponen utama yang menangani rendering berdasarkan containerType
const Index: FC<BaseModalProps> = ({ onClose, containerType = "dialog", ...props }) => {
    // Jika sidebar mode, gunakan div container tanpa header
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <IndependentSamplesTTestContent onClose={onClose} />
                </div>
            </div>
        );
    }

    // Untuk mode dialog, gunakan Dialog dan DialogContent
    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-3xl p-0 bg-popover text-popover-foreground border border-border shadow-md rounded-md flex flex-col max-h-[90vh]">
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold">Independent-Samples T-Test</DialogTitle>
                </DialogHeader>
                <div className="flex-grow flex flex-col overflow-hidden">
                    <IndependentSamplesTTestContent onClose={onClose} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default Index;