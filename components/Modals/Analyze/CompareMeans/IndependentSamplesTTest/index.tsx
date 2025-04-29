"use client";
import React, { useState, useEffect, FC } from "react";
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
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useResultStore } from "@/stores/useResultStore";
import type { Variable } from "@/types/Variable";
import {
    RadioGroup,
    RadioGroupItem
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

import VariablesTab from "./VariablesTab";

interface IndependentSamplesTTestModalProps {
    onClose: () => void;
}

const Index: FC<IndependentSamplesTTestModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState("variables");
    const [listVariables, setListVariables] = useState<Variable[]>([]);
    const [testVariables, setTestVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available' | 'selected' | 'grouping'} | null>(null);
    
    // Grouping variable handling (from original IndependentSamplesTTestModal)
    const [groupingVariable, setGroupingVariable] = useState<Variable | null>(null);
    const [showDefineGroupsModal, setShowDefineGroupsModal] = useState(false);
    const [defineGroups, setDefineGroups] = useState({
        useSpecifiedValues: true,
        cutPoint: false
    });
    const [tempDefineGroups, setTempDefineGroups] = useState(defineGroups);
    const [group1, setGroup1] = useState<number | null>(null);
    const [group2, setGroup2] = useState<number | null>(null);
    const [tempGroup1, setTempGroup1] = useState<number | null>(group1);
    const [tempGroup2, setTempGroup2] = useState<number | null>(group2);
    const [groupRangeError, setGroupRangeError] = useState<string | null>(null);
    const [cutPointValue, setCutPointValue] = useState<number | null>(null);
    const [tempCutPointValue, setTempCutPointValue] = useState<number | null>(cutPointValue);
    const [estimateEffectSize, setEstimateEffectSize] = useState<boolean>(false);

    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const variables = useVariableStore.getState().variables;
    const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

    // Initialize available variables on component mount
    useEffect(() => {
        const validVars = variables.filter(v => v.name !== "");
        setListVariables(validVars);
    }, [variables]);

    // Update temp group values when modal is shown
    useEffect(() => {
        if (showDefineGroupsModal) {
            setTempGroup1(group1);
            setTempGroup2(group2);
            setTempCutPointValue(cutPointValue);
            setTempDefineGroups(defineGroups);
        }
    }, [showDefineGroupsModal, group1, group2, cutPointValue, defineGroups]);

    const handleSelectedVariable = (variable: Variable) => {
        setTestVariables(prev => [...prev, variable]);
        setListVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const handleDeselectVariable = (variable: Variable) => {
        setListVariables((prev) => {
            const newList = [...prev, variable];
            return newList.sort((a, b) => {
                const indexA = variables.findIndex(v => v.columnIndex === a.columnIndex);
                const indexB = variables.findIndex(v => v.columnIndex === b.columnIndex);
                return indexA - indexB;
            });
        });
        setTestVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    // Group variable handlers from original IndependentSamplesTTestModal
    const handleSelectGroupVariable = (variable: Variable) => {
        if (groupingVariable) {
            // Return existing grouping variable to list variables
            setListVariables((prev) => {
                const newList = [...prev, groupingVariable];
                return newList.sort((a, b) => {
                    const indexA = variables.findIndex(v => v.columnIndex === a.columnIndex);
                    const indexB = variables.findIndex(v => v.columnIndex === b.columnIndex);
                    return indexA - indexB;
                });
            });
        }
        
        setGroupingVariable(variable);
        setListVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const handleDeselectGroupVariable = () => {
        if (groupingVariable) {
            setListVariables((prev) => {
                const newList = [...prev, groupingVariable];
                return newList.sort((a, b) => {
                    const indexA = variables.findIndex(v => v.columnIndex === a.columnIndex);
                    const indexB = variables.findIndex(v => v.columnIndex === b.columnIndex);
                    return indexA - indexB;
                });
            });
            setGroupingVariable(null);
            setGroup1(null);
            setGroup2(null);
            setCutPointValue(null);
            setHighlightedVariable(null);
        }
    };

    const handleReset = () => {
        setListVariables(variables.filter(v => v.name !== ""));
        setTestVariables([]);
        setGroupingVariable(null);
        setGroup1(null);
        setGroup2(null);
        setCutPointValue(null);
        setHighlightedVariable(null);
        setEstimateEffectSize(false);
        setErrorMsg(null);
    };

    const handleRunTest = async () => {
        if (testVariables.length < 1) {
            setErrorMsg("Please select at least one variable.");
            return;
        }

        if (!groupingVariable) {
            setErrorMsg("Please select a grouping variable.");
            return;
        }

        if ((defineGroups.useSpecifiedValues && (!group1 || !group2)) || (defineGroups.cutPoint && !cutPointValue)) {
            setErrorMsg("Please define grouping variable.");
            return;
        }

        setErrorMsg(null);
        setIsCalculating(true);
    
        try {
            // 1. Prepare test variable data
            const variableDataPromises = [];
            for (const varDef of testVariables) {
                variableDataPromises.push(useDataStore.getState().getVariableData(varDef));
            }
            const variableData = await Promise.all(variableDataPromises);

            // 2. Prepare grouping variable data
            const groupData = await useDataStore.getState().getVariableData(groupingVariable);

            // 3. Create worker and set up handlers
            const worker = new Worker("/workers/IndependentSamplesTTest/index.js", { type: 'module' });

            // Set a timeout to prevent worker hanging
            const timeoutId = setTimeout(() => {
                worker.terminate();
                setErrorMsg("Analysis timed out. Please try again with fewer variables.");
                setIsCalculating(false);
            }, 60000); // 60 second timeout

            console.log("variableData", JSON.stringify(variableData));
            console.log("groupData", JSON.stringify(groupData));

            worker.onmessage = async (e) => {
                clearTimeout(timeoutId);
                const wData = e.data;

                if (wData.success) {
                    try {
                        // Save results to database
                        const variableNames = testVariables.map(v => v.name);
                        let logParts = ["T-TEST"];

                        if (defineGroups.useSpecifiedValues) {
                            logParts.push(`GROUPS=${groupingVariable.name}(${group1} ${group2}) {${variableNames.join(" ")}}`);
                        } else {
                            logParts.push(`GROUPS=${groupingVariable.name}(${cutPointValue}) {${variableNames.join(" ")}}`);
                        }

                        // Only add tests that are enabled
                        if (estimateEffectSize) {
                            logParts.push(`{ES DISPLAY (TRUE)}`);
                        } else {
                            logParts.push(`{ES DISPLAY (FALSE)}`);
                        }

                        logParts.push(`{CRITERIA=0.95}`);

                        // Join all parts with spaces
                        let logMsg = logParts.join(' ');

                        const logId = await addLog({ log: logMsg });
                        const analyticId = await addAnalytic(logId, { title: "T-Test", note: "" });

                        if (wData.group) {
                            await addStatistic(analyticId, {
                                title: "Group Statistics",
                                output_data: wData.group,
                                components: "Group Statistics",
                                description: ""
                            });
                        }

                        if (wData.test) {
                            await addStatistic(analyticId, {
                                title: "Independent Samples Test",
                                output_data: wData.test,
                                components: "Independent Samples Test",
                                description: ""
                            });
                        }

                        setIsCalculating(false);
                        worker.terminate();
                        onClose();
                    } catch (err) {
                        console.error(err);
                        setErrorMsg(`Error saving results.`);
                        setIsCalculating(false);
                        worker.terminate();
                    }
                } else {
                    setErrorMsg(wData.error || "Worker returned an error.");
                    setIsCalculating(false);
                    worker.terminate();
                }
            };

            worker.onerror = (event) => {
                clearTimeout(timeoutId);
                console.error("Worker error:", event);
                setIsCalculating(false);
                setErrorMsg("Worker error occurred. Check console for details.");
                worker.terminate();
            };

            // 3. Send data to worker - using the new format with variableData and groupData
            worker.postMessage({
                variableData: variableData,
                groupData: groupData,
                defineGroups: defineGroups,
                group1: group1,
                group2: group2,
                cutPointValue: cutPointValue,
                estimateEffectSize: estimateEffectSize
            });
        
        } catch (ex) {
            console.error(ex);
            setErrorMsg("Something went wrong.");
            setIsCalculating(false);
        }
    };

    return (
        <DialogContent className="max-w-[800px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Independent-Samples T-Test</DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-[#E6E6E6] flex-shrink-0">
                    <TabsList className="bg-[#F7F7F7] rounded-none h-9 p-0">
                        <TabsTrigger
                            value="variables"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'variables' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Variables
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <VariablesTab
                        listVariables={listVariables}
                        testVariables={testVariables}
                        groupingVariable={groupingVariable}
                        defineGroups={defineGroups}
                        group1={group1}
                        group2={group2}
                        cutPointValue={cutPointValue}
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        estimateEffectSize={estimateEffectSize}
                        setEstimateEffectSize={setEstimateEffectSize}
                        handleSelectedVariable={handleSelectedVariable}
                        handleDeselectVariable={handleDeselectVariable}
                        handleSelectGroupVariable={handleSelectGroupVariable}
                        handleDeselectGroupVariable={handleDeselectGroupVariable}
                        setShowDefineGroupsModal={setShowDefineGroupsModal}
                    />
                </TabsContent>
            </Tabs>

            {errorMsg && <div className="px-6 py-2 text-red-600">{errorMsg}</div>}
            
            <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                        onClick={handleRunTest}
                        disabled={
                            isCalculating ||
                            testVariables.length < 1 ||
                            !groupingVariable ||
                            (defineGroups.useSpecifiedValues && (!group1 || !group2)) ||
                            (defineGroups.cutPoint && !cutPointValue)
                        }
                    >
                        {isCalculating ? "Calculating..." : "OK"}
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        onClick={handleReset}
                        disabled={isCalculating}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        onClick={onClose}
                        disabled={isCalculating}
                    >
                        Cancel
                    </Button>
                </div>
            </DialogFooter>

            {/* Define Groups Modal */}
            {showDefineGroupsModal && (
                <Dialog open onOpenChange={() => {
                    setShowDefineGroupsModal(false);
                    // Reset temp values to current values when closing
                    setTempGroup1(group1);
                    setTempGroup2(group2);
                    setTempCutPointValue(cutPointValue);
                    setTempDefineGroups(defineGroups);
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
                                <label className="col-span-2 text-sm justify-self-end" htmlFor="group1">Group 1:</label>
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
                                    className="col-span-7 border rounded w-full px-2 ml-2"
                                />
                                <label className="col-span-2 text-sm justify-self-end" htmlFor="group2">Group 2:</label>
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
                                    className="col-span-7 border rounded w-full px-2 ml-2"
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
                                    className="col-span-7 border rounded w-full px-2 ml-2"
                                />
                            </div>
                        </RadioGroup>
                        {groupRangeError && (
                            <div className="mt-2 text-red-600 text-sm">{groupRangeError}</div>
                        )}
                        <DialogFooter>
                            <Button 
                                className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                                onClick={() => {
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
                                    
                                    setDefineGroups(tempDefineGroups);
                                    setShowDefineGroupsModal(false);
                                }}
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
                                className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                                onClick={() => {
                                    setShowDefineGroupsModal(false);
                                    // Reset temp values to current values when canceling
                                    setTempGroup1(group1);
                                    setTempGroup2(group2);
                                    setTempCutPointValue(cutPointValue);
                                    setTempDefineGroups(defineGroups);
                                }}
                            >
                                Cancel
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </DialogContent>
    );
};

export default Index;