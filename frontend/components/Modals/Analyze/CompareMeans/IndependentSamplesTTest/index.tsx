"use client";

import React, { FC, useState, useCallback, useEffect } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Dialog
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { BaseModalProps } from "@/types/modalTypes";

import {
    useVariableSelection,
    useTestSettings,
    useModalSettings,
    useIndependentSamplesTTestAnalysis
} from "./hooks";

import VariablesTab from "./VariablesTab";

// Komponen utama konten IndependentSamplesTTest yang agnostik terhadap container
const IndependentSamplesTTestContent: FC<BaseModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<"variables">("variables");
    
    const {
        availableVariables,
        selectedVariables,
        groupingVariable,
        highlightedVariable,
        setHighlightedVariable,
        moveToSelectedVariables,
        moveToAvailableVariables,
        setGroupingVariable,
        reorderVariables,
        resetVariableSelection
    } = useVariableSelection();

    const {
        estimateEffectSize,
        setEstimateEffectSize,
        defineGroups,
        setDefineGroups,
        group1,
        setGroup1,
        group2,
        setGroup2,
        cutPointValue,
        setCutPointValue,
        resetTestSettings
    } = useTestSettings();

    const {
        showDefineGroupsModal,
        setShowDefineGroupsModal,
        tempDefineGroups,
        setTempDefineGroups,
        tempGroup1,
        setTempGroup1,
        tempGroup2,
        setTempGroup2,
        tempCutPointValue,
        setTempCutPointValue,
        groupRangeError,
        setGroupRangeError,
        resetModalSettings,
        applyGroupSettings
    } = useModalSettings(
        { groupingVariable },
        defineGroups,
        setDefineGroups,
        group1,
        setGroup1,
        group2,
        setGroup2,
        cutPointValue,
        setCutPointValue
    );

    const { 
        isLoading,
        errorMsg, 
        runAnalysis,
        cancelAnalysis
    } = useIndependentSamplesTTestAnalysis({
        selectedVariables,
        groupingVariable,
        defineGroups,
        group1,
        group2,
        cutPointValue,
        estimateEffectSize,
        onClose
    });

    const handleReset = useCallback(() => {
        resetVariableSelection();
        resetTestSettings();
        resetModalSettings();
        cancelAnalysis();
    }, [resetVariableSelection, resetTestSettings, resetModalSettings, cancelAnalysis]);

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
                        groupingVariable={groupingVariable}
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        moveToSelectedVariables={moveToSelectedVariables}
                        moveToAvailableVariables={moveToAvailableVariables}
                        setGroupingVariable={setGroupingVariable}
                        reorderVariables={reorderVariables}
                        estimateEffectSize={estimateEffectSize}
                        setEstimateEffectSize={setEstimateEffectSize}
                        defineGroups={defineGroups}
                        group1={group1}
                        group2={group2}
                        cutPointValue={cutPointValue}
                        setShowDefineGroupsModal={setShowDefineGroupsModal}
                    />
                </TabsContent>
            </Tabs>

            {errorMsg && <div className="px-6 py-2 text-destructive">{errorMsg}</div>}

            <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        onClick={runAnalysis}
                        disabled={
                            isLoading ||
                            selectedVariables.length < 1 ||
                            !groupingVariable ||
                            (defineGroups.useSpecifiedValues && (!group1 || !group2)) ||
                            (defineGroups.cutPoint && !cutPointValue)
                        }
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

            {/* Define Groups Modal */}
            {showDefineGroupsModal && (
                <Dialog open onOpenChange={() => {
                    setShowDefineGroupsModal(false);
                    resetModalSettings();
                }}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Define Groups</DialogTitle>
                        </DialogHeader>
                        <RadioGroup
                            value={tempDefineGroups.useSpecifiedValues ? "Use specified values" : "Cut point"}
                            onValueChange={(value) => setTempDefineGroups({
                                ...tempDefineGroups,
                                useSpecifiedValues: value === "Use specified values",
                                cutPoint: value === "Cut point"
                            })}
                        >
                            <div className="grid grid-cols-9 gap-2 items-center justify-items-center" style={{ gridTemplateColumns: "20px 62.836px auto auto auto auto auto auto auto" }}>
                                <RadioGroupItem id="use-specified-values" value="Use specified values"/>
                                <Label htmlFor="use-specified-values" className="text-sm col-span-8 justify-self-start">Use specified values</Label>
                                <label className={`col-span-2 text-sm justify-self-end ${!tempDefineGroups.useSpecifiedValues ? 'opacity-50' : ''}`} htmlFor="group1">Group 1:</label>
                                <input
                                    id="group1"
                                    type="number"
                                    step="1"
                                    disabled={tempDefineGroups.cutPoint}
                                    value={tempGroup1 !== null ? tempGroup1 : ""}
                                    onChange={(e) => {
                                        const value = e.target.value ? parseFloat(e.target.value) : null;
                                        setTempGroup1(value);
                                        
                                        // Validate for integer
                                        if (value !== null && !Number.isInteger(value)) {
                                            setGroupRangeError("Values must be integers");
                                        } else if (value !== null && tempGroup2 !== null && value >= tempGroup2) {
                                            setGroupRangeError("Minimum must be less than maximum");
                                        } else {
                                            setGroupRangeError(null);
                                        }
                                    }}
                                    className={`col-span-7 border rounded w-full px-2 ml-2 ${
                                        tempDefineGroups.cutPoint 
                                            ? 'text-muted-foreground' 
                                            : ''
                                    }`}
                                />
                                <label className={`col-span-2 text-sm justify-self-end ${!tempDefineGroups.useSpecifiedValues ? 'opacity-50' : ''}`} htmlFor="group2">Group 2:</label>
                                <input
                                    id="group2"
                                    type="number"
                                    step="2"
                                    disabled={tempDefineGroups.cutPoint}
                                    value={tempGroup2 !== null ? tempGroup2 : ""}
                                    onChange={(e) => {
                                        const value = e.target.value ? parseFloat(e.target.value) : null;
                                        setTempGroup2(value);
                                        
                                        // Validate for integer
                                        if (value !== null && !Number.isInteger(value)) {
                                            setGroupRangeError("Values must be integers");
                                        } else if (value !== null && tempGroup1 !== null && value <= tempGroup1) {
                                            setGroupRangeError("Maximum must be greater than minimum");
                                        } else {
                                            setGroupRangeError(null);
                                        }
                                    }}
                                    className={`col-span-7 border rounded w-full px-2 ml-2 ${
                                        tempDefineGroups.cutPoint 
                                            ? 'text-muted-foreground' 
                                            : ''
                                    }`}
                                />
                                <RadioGroupItem id="cut-point" value="Cut point" />
                                <Label htmlFor="cut-point" className="text-sm">Cut point:</Label>
                                <input
                                    id="cut-point"
                                    type="number"
                                    step="1"
                                    disabled={tempDefineGroups.useSpecifiedValues}
                                    value={tempCutPointValue !== null ? tempCutPointValue : ""}
                                    onChange={(e) => {
                                        const value = e.target.value ? parseFloat(e.target.value) : null;
                                        setTempCutPointValue(value);
                                        
                                        // Validate for integer
                                        if (value !== null && !Number.isInteger(value)) {
                                            setGroupRangeError("Value must be an integer");
                                        } else {
                                            setGroupRangeError(null);
                                        }
                                    }}
                                    className={`col-span-7 border rounded w-full px-2 ml-2 ${
                                        tempDefineGroups.useSpecifiedValues 
                                            ? 'text-muted-foreground' 
                                            : ''
                                    }`}
                                />
                            </div>
                        </RadioGroup>
                        {groupRangeError && (
                            <div className="mt-2 text-destructive text-sm">{groupRangeError}</div>
                        )}
                        <DialogFooter>
                            <Button 
                                onClick={applyGroupSettings}
                                disabled={
                                    (tempDefineGroups.useSpecifiedValues && (tempGroup1 === null || tempGroup2 === null || tempGroup1 >= tempGroup2)) ||
                                    (tempDefineGroups.cutPoint && tempCutPointValue === null) ||
                                    groupRangeError !== null
                                }
                            >
                                Continue
                            </Button>
                            <Button 
                                variant="outline"
                                onClick={() => {
                                    setShowDefineGroupsModal(false);
                                    resetModalSettings();
                                }}
                            >
                                Cancel
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};

// Komponen IndependentSamplesTTest yang menjadi titik masuk utama
const IndependentSamplesTTest: FC<BaseModalProps> = ({ onClose, containerType = "dialog", ...props }) => {
    // Render berdasarkan containerType
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <IndependentSamplesTTestContent onClose={onClose} {...props} />
                </div>
            </div>
        );
    }

    // Default dialog view with proper Dialog components
    return (
        <DialogContent className="max-w-[800px] p-0 bg-popover text-popover-foreground border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Independent-Samples T Test</DialogTitle>
            </DialogHeader>

            <div className="flex-grow flex flex-col overflow-hidden">
                <IndependentSamplesTTestContent onClose={onClose} {...props} />
            </div>
        </DialogContent>
    );
}

export default IndependentSamplesTTest;
export { IndependentSamplesTTestContent };