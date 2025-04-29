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
import OptionsTab from "./OptionsTab";

interface ChiSquareModalProps {
    onClose: () => void;
}

const Index: FC<ChiSquareModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState("variables");
    const [listVariables, setListVariables] = useState<Variable[]>([]);
    const [testVariables, setTestVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available' | 'selected'} | null>(null);
    const [expectedRange, setExpectedRange] = useState({
        getFromData: true,
        useSpecificRange: false
    });
    const [rangeValue, setRangeValue] = useState({
        lowerValue: null as number | null,
        upperValue: null as number | null
    });
    const [expectedValue, setExpectedValue] = useState({
        allCategoriesEqual: true,
        values: false,
        inputValue: null as number | null
    });
    const [expectedValueList, setExpectedValueList] = useState<string[]>([]);
    const [highlightedExpectedValue, setHighlightedExpectedValue] = useState<string | null>(null);
    const [displayStatistics, setDisplayStatistics] = useState({
        descriptive: false,
        quartiles: false,
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

    const handleAddExpectedValue = () => {
        if (expectedValue.inputValue !== null && expectedValue.inputValue !== 0) {
            const stringValue = expectedValue.inputValue.toString();
            setExpectedValueList(prev => [...prev, stringValue]);
            setExpectedValue(prev => ({ ...prev, inputValue: null }));
        }
    };
    
    const handleRemoveExpectedValue = () => {
        if (highlightedExpectedValue !== null || (expectedValue.inputValue !== null && expectedValue.inputValue !== 0)) {
            setExpectedValueList(prev => prev.filter(value => value !== highlightedExpectedValue));
            setHighlightedExpectedValue(null);
        }
    };

    const handleChangeExpectedValue = () => {
        if (highlightedExpectedValue !== null && expectedValue.inputValue !== null) {
            const stringValue = expectedValue.inputValue.toString();
            setExpectedValueList(prev => prev.map(value => 
                value === highlightedExpectedValue ? stringValue : value
            ));
            setHighlightedExpectedValue(null);
            setExpectedValue(prev => ({ ...prev, inputValue: null }));
        }
    };

    const handleReset = () => {
        setListVariables(variables.filter(v => v.name !== ""));
        setTestVariables([]);
        setHighlightedVariable(null);
        setExpectedRange({
            getFromData: true,
            useSpecificRange: false
        });
        setRangeValue({
            lowerValue: null,
            upperValue: null
        });
        setExpectedValue({
            allCategoriesEqual: true,
            values: false,
            inputValue: null
        });
        setExpectedValueList([]);
        setDisplayStatistics({
            descriptive: false,
            quartiles: false,
        });
        setErrorMsg(null);
    };

    const handleRunTest = async () => {
        if (testVariables.length === 0) {
            setErrorMsg("Please select at least one variable.");
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
            const worker = new Worker("/workers/ChiSquare/index.js",  { type: 'module' });

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
                        if (expectedRange.useSpecificRange) {
                            logParts.push(`{CHISQUARE=${variableNames.join(" ")} (${rangeValue.lowerValue},${rangeValue.upperValue})}`);
                        } else {
                            logParts.push(`{CHISQUARE=${variableNames.join(" ")}}`);
                        }

                        if (expectedValue.allCategoriesEqual) {
                            logParts.push(`{EXPECTED=EQUAL}`);
                        } else {
                            logParts.push(`{EXPECTED=${expectedValueList.join(" ")}}`);
                        }

                        if (displayStatistics.descriptive && displayStatistics.quartiles) {
                            logParts.push(`{STATISTICS DESCRIPTIVES QUARTILES}`);
                        } else if (displayStatistics.descriptive) {
                            logParts.push(`{STATISTICS DESCRIPTIVES}`);
                        } else if (displayStatistics.quartiles) {
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

                        if (wData.descriptives) {
                            await addStatistic(analyticId, {
                                title: "Descriptive Statistics",
                                output_data: wData.descriptives,
                                components: "Descriptive Statistics",
                                description: ""
                            });
                        }

                        if (wData.frequencies) {
                            if (wData.frequencies.length === 1) {
                                await addStatistic(analyticId, {
                                    title: "Frequencies",
                                    output_data: wData.frequencies[0],
                                    components: "Chi-Square Test",
                                    description: ""
                                });
                            } else {
                                for (let i = 0; i < wData.frequencies.length; i++) {
                                    await addStatistic(analyticId, {
                                        title: `Frequencies ${variableNames[i]}`,
                                        output_data: wData.frequencies[i],
                                        components: "Chi-Square Test",
                                        description: ""
                                    });
                                }
                            }
                        }

                        if (wData.chiSquare) {
                            await addStatistic(analyticId, {
                                title: "Chi-Square Test",
                                output_data: wData.chiSquare,
                                components: "Chi-Square Test",
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
                variableData: variableData,
                expectedRange: expectedRange,
                rangeValue: rangeValue,
                expectedValue: expectedValue,
                expectedValueList: expectedValueList,
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
                <DialogTitle className="text-[22px] font-semibold">Chi-square Test</DialogTitle>
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
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        expectedRange={expectedRange}
                        setExpectedRange={setExpectedRange}
                        rangeValue={rangeValue}
                        setRangeValue={setRangeValue}
                        expectedValue={expectedValue}
                        setExpectedValue={setExpectedValue}
                        expectedValueList={expectedValueList}
                        setExpectedValueList={setExpectedValueList}
                        highlightedExpectedValue={highlightedExpectedValue}
                        setHighlightedExpectedValue={setHighlightedExpectedValue}
                        handleSelectedVariable={handleSelectedVariable}
                        handleDeselectVariable={handleDeselectVariable}
                        handleAddExpectedValue={handleAddExpectedValue}
                        handleRemoveExpectedValue={handleRemoveExpectedValue}
                        handleChangeExpectedValue={handleChangeExpectedValue}
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
                            testVariables.length === 0
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