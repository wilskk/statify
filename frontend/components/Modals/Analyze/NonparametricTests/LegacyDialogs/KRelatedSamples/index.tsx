"use client";
import React, { useState, useEffect, FC } from "react";
import { Button } from "@/components/ui/button";
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
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useResultStore } from "@/stores/useResultStore";
import type { Variable } from "@/types/Variable";

import VariablesTab from "./VariablesTab";
import StatisticsTab from "./StatisticsTab";

interface KRelatedSamplesModalProps {
    onClose: () => void;
}

const Index: FC<KRelatedSamplesModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState("variables");
    const [listVariables, setListVariables] = useState<Variable[]>([]);
    const [testVariables, setTestVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available' | 'selected'} | null>(null);
    const [testType, setTestType] = useState({
        friedman: true,
        kendallsW: false,
        cochransQ: false
    });

    const [displayStatistics, setDisplayStatistics] = useState({
        descriptive: false,
        quartile: false,
    });

    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const variables = useVariableStore.getState().variables;
    const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

    // Initialize available variables on component mount
    useEffect(() => {
        const validVars = variables.filter(v => v.name !== "");
        setListVariables(validVars);
    }, [variables]);

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

    const handleReset = () => {
        setListVariables(variables.filter(v => v.name !== ""));
        setTestVariables([]);
        setHighlightedVariable(null);
        setTestType({
            friedman: true,
            kendallsW: false,
            cochransQ: false
        });
        setDisplayStatistics({
            descriptive: false,
            quartile: false,
        });
        setErrorMsg(null);
    };

    const handleRunTest = async () => {
        if (testVariables.length < 2) {
            setErrorMsg("Please select at least two variable.");
            return;
        }
        setErrorMsg(null);
        setIsCalculating(true);
    
        try {
            // 1. Prepare variable data using useDataStore's getVariableData
            const variableDataPromises = [];
            for (const varDef of testVariables) {
                variableDataPromises.push(useDataStore.getState().getVariableData(varDef));
            }
            const variableData = await Promise.all(variableDataPromises);

            // 2. Create worker and set up handlers
            const worker = new Worker("/workers/KRelatedSamples/index.js",  { type: 'module' });

            // Set a timeout to prevent worker hanging
            const timeoutId = setTimeout(() => {
                worker.terminate();
                setErrorMsg("Analysis timed out. Please try again with fewer variables.");
                setIsCalculating(false);
            }, 60000); // 60 second timeout

            worker.onmessage = async (e) => {
                clearTimeout(timeoutId);
                const wData = e.data;

                if (wData.success) {
                    try {
                        // Save results to database
                        const variableNames = testVariables.map(v => v.name);
                        let logParts = ['NPAR TESTS'];

                        // Only add tests that are enabled
                        if (wData.testType.friedman) {
                            logParts.push(`{FRIEDMAN=${variableNames.join(" ")}}`);
                        }

                        if (wData.testType.kendallsW) {
                            logParts.push(`{KENDALL=${variableNames.join(" ")}}`);
                        }

                        if (wData.testType.cochransQ) {
                            logParts.push(`{COCHRAN=${variableNames.join(" ")}}`);
                        }

                        if (wData.displayStatistics.descriptive && wData.displayStatistics.quartile) {
                            logParts.push(`{STATISTICS DESCRIPTIVES QUARTILES}`);
                        } else if (wData.displayStatistics.descriptive) {
                            logParts.push(`{STATISTICS DESCRIPTIVES}`);
                        } else if (wData.displayStatistics.quartile) {
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

                        if (wData.displayStatistics.descriptive || wData.displayStatistics.quartile) {
                            await addStatistic(analyticId, {
                                title: "Descriptive Statistics",
                                output_data: wData.descriptives,
                                components: "Descriptive Statistics",
                                description: ""
                            });
                        }

                        if (wData.testType.friedman) {
                            await addStatistic(analyticId, {
                                title: "Ranks",
                                output_data: wData.ranks,
                                components: "Friedman Test",
                                description: ""
                            });

                            await addStatistic(analyticId, {
                                title: "Test Statistics",
                                output_data: wData.friedmanTest,
                                components: "Friedman Test",
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

            // 3. Send data to worker - using the new format with variableData
            worker.postMessage({
                variableData:variableData,
                testType:testType,
                displayStatistics:displayStatistics
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
                <DialogTitle className="text-[22px] font-semibold">Tests for Several Related Samples</DialogTitle>
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
                            value="statistics"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'statistics' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Statistics
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <VariablesTab
                        listVariables={listVariables}
                        testVariables={testVariables}
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        testType={testType}
                        setTestType={setTestType}
                        handleSelectedVariable={handleSelectedVariable}
                        handleDeselectVariable={handleDeselectVariable}
                    />
                </TabsContent>

                <TabsContent value="statistics" className="p-6 overflow-y-auto flex-grow">
                    <StatisticsTab
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
                            (
                                testType.friedman === false &&
                                testType.kendallsW === false &&
                                testType.cochransQ === false
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
        </DialogContent>
    );
};

export default Index;