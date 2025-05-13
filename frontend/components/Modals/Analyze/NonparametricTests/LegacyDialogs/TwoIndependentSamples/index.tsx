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

import VariablesTab from "./VariablesTab";
import OptionsTab from "./OptionsTab";

interface TwoIndependentSamplesModalProps {
    onClose: () => void;
}

const Index: FC<TwoIndependentSamplesModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState("variables");
    const [listVariables, setListVariables] = useState<Variable[]>([]);
    const [testVariables, setTestVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available' | 'selected' | 'grouping'} | null>(null);
    
    // Grouping variable handling (from original TwoIndependentSamplesTestModal)
    const [groupingVariable, setGroupingVariable] = useState<Variable | null>(null);
    const [showDefineGroupsModal, setShowDefineGroupsModal] = useState(false);
    const [group1, setGroup1] = useState<number | null>(null);
    const [group2, setGroup2] = useState<number | null>(null);
    const [tempGroup1, setTempGroup1] = useState<number | null>(group1);
    const [tempGroup2, setTempGroup2] = useState<number | null>(group2);
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

    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const variables = useVariableStore.getState().variables;
    const data = useDataStore.getState().data;
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
        }
    }, [showDefineGroupsModal, group1, group2]);

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

    // Group variable handlers from original TwoIndependentSamplesTestModal
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
            setHighlightedVariable(null);
        }
    };

    const handleReset = () => {
        setListVariables(variables.filter(v => v.name !== ""));
        setTestVariables([]);
        setGroupingVariable(null);
        setGroup1(null);
        setGroup2(null);
        setHighlightedVariable(null);
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
        setErrorMsg(null);
    };

    const handleRunTest = async () => {
        if (testVariables.length < 2) {
            setErrorMsg("Please select at least two variables.");
            return;
        }

        if (!groupingVariable) {
            setErrorMsg("Please select a grouping variable.");
            return;
        }

        if (!group1 || !group2) {
            setErrorMsg("Please define grouping variable range.");
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
            const worker = new Worker("/workers/TwoIndependentSamples/index.js", { type: 'module' });

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
                        let logParts = ['NPAR TESTS'];

                        // Only add tests that are enabled
                        if (wData.testType.mannWhitneyU) {
                            logParts.push(`{M-W=${variableNames.join(" ")} BY ${groupingVariable.name}(${group1} ${group2})}`);
                        }

                        if (wData.testType.mosesExtremeReactions) {
                            logParts.push(`{MOSES=${variableNames.join(" ")} BY ${groupingVariable.name}(${group1} ${group2})}`);
                        }

                        if (wData.testType.kolmogorovSmirnovZ) {
                            logParts.push(`{K-S=${variableNames.join(" ")} BY ${groupingVariable.name}(${group1} ${group2})}`);
                        }

                        if (wData.testType.waldWolfowitzRuns) {
                            logParts.push(`{W-W=${variableNames.join(" ")} BY ${groupingVariable.name}(${group1} ${group2})}`);
                        }

                        if (wData.displayStatistics.descriptive && wData.displayStatistics.quartiles) {
                            logParts.push(`{STATISTICS DESCRIPTIVES QUARTILES}`);
                        } else if (wData.displayStatistics.descriptive) {
                            logParts.push(`{STATISTICS DESCRIPTIVES}`);
                        } else if (wData.displayStatistics.quartiles) {
                            logParts.push(`{STATISTICS QUARTILES}`);
                        }

                        // Join all parts with spaces
                        let logMsg = logParts.join(' ');

                        // If no tests are selected, provide a default message
                        if (logParts.length === 1) {
                            logMsg = 'NPAR TESTS {No specific tests selected}';
                        }

                        const logId = await addLog({ log: logMsg });
                        const analyticId = await addAnalytic(logId, { title: "NPar Tests", note: "" });

                        if (wData.displayStatistics.descriptive || wData.displayStatistics.quartiles) {
                            await addStatistic(analyticId, {
                                title: "Descriptive Statistics",
                                output_data: wData.descriptives,
                                components: "Descriptive Statistics",
                                description: ""
                            });
                        }

                        if (wData.testType.mannWhitneyU) {
                            await addStatistic(analyticId, {
                                title: "Ranks",
                                output_data: wData.ranks,
                                components: "Mann-Whitney Test",
                                description: ""
                            });

                            await addStatistic(analyticId, {
                                title: "Test Statistics",
                                output_data: wData.mannWhitneyU,
                                components: "Mann-Whitney Test",
                                description: ""
                            });
                        }

                        if (wData.testType.mosesExtremeReactions) {
                            // await addStatistic(analyticId, {
                            //     title: "Test Statistics",
                            //     output_data: wData.mosesExtremeReactions,
                            //     components: "Moses Test",
                            //     description: ""
                            // });
                        }

                        if (wData.testType.kolmogorovSmirnovZ) {
                            await addStatistic(analyticId, {
                                title: "Frequencies",
                                output_data: wData.kolmogorovSmirnovZFrequencies,
                                components: "Two-Samples Kolmogorov-Smirnov Test",
                                description: ""
                            });

                            await addStatistic(analyticId, {
                                title: "Test Statistics",
                                output_data: wData.kolmogorovSmirnovZ,
                                components: "Two-Samples Kolmogorov-Smirnov Test",
                                description: ""
                            });
                        }

                        if (wData.testType.waldWolfowitzRuns) {
                            // await addStatistic(analyticId, {
                            //     title: "Test Statistics",
                            //     output_data: wData.waldWolfowitzRuns,
                            //     components: "Wald-Wolfowitz Test",
                            //     description: ""
                            // });
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
                group1:group1,
                group2: group2,
                testType: testType,
                displayStatistics: displayStatistics
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
                <DialogTitle className="text-[22px] font-semibold">Two-Independent-Samples Tests</DialogTitle>
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
                        listVariables={listVariables}
                        testVariables={testVariables}
                        groupingVariable={groupingVariable}
                        group1={group1}
                        group2={group2}
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        testType={testType}
                        setTestType={setTestType}
                        handleSelectedVariable={handleSelectedVariable}
                        handleDeselectVariable={handleDeselectVariable}
                        handleSelectGroupVariable={handleSelectGroupVariable}
                        handleDeselectGroupVariable={handleDeselectGroupVariable}
                        setShowDefineGroupsModal={setShowDefineGroupsModal}
                    />
                </TabsContent>

                <TabsContent value="options" className="p-6 overflow-y-auto flex-grow">
                    <OptionsTab
                        displayStatistics={displayStatistics}
                        setDisplayStatistics={setDisplayStatistics}
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
                            testVariables.length < 2 ||
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
                <Dialog open onOpenChange={() => setShowDefineGroupsModal(false)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Two Independent Samples: Define Groups</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <div className="grid grid-cols-4 gap-2 items-center mb-2">
                                <label className="text-sm text-right" htmlFor="group1">Group 1:</label>
                                <input
                                    id="group1"
                                    type="number"
                                    step="1"
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
                                    className="col-span-3 border border-[#CCCCCC] rounded p-2"
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-2 items-center">
                                <label className="text-sm text-right" htmlFor="group2">Group 2:</label>
                                <input
                                    id="group2"
                                    type="number"
                                    step="1"
                                    value={tempGroup2 !== null ? tempGroup2 : ""}
                                    onChange={(e) => {
                                        const value = e.target.value ? parseFloat(e.target.value) : null;
                                        setTempGroup2(value);
                                        
                                        // Validate for integer
                                        if (value !== null && !Number.isInteger(value)) {
                                            setGroupRangeError("Values must be integers");
                                        } else {
                                            setGroupRangeError(null);
                                        }
                                    }}
                                    className="col-span-3 border border-[#CCCCCC] rounded p-2"
                                />
                            </div>
                            {groupRangeError && (
                                <div className="mt-2 text-red-600 text-sm">{groupRangeError}</div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button 
                                className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                                onClick={() => {
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
                                    setShowDefineGroupsModal(false);
                                }}
                                disabled={tempGroup1 === null || tempGroup2 === null || tempGroup1 >= tempGroup2 || groupRangeError !== null}
                            >
                                Continue
                            </Button>
                            <Button 
                                variant="outline"
                                className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                                onClick={() => setShowDefineGroupsModal(false)}
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