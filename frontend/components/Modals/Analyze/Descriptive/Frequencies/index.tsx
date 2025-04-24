"use client";
import React, { useState, useEffect, FC } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import type { Variable } from "@/types/Variable";

import VariablesTab from "./VariablesTab";
import StatisticsTab from "./StatisticsTab";
import ChartsTab from "./ChartsTab";

interface FrequenciesModalProps {
    onClose: () => void;
}

const Index: FC<FrequenciesModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState("variables");
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{tempId: string, source: 'available' | 'selected'} | null>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [showFrequencyTables, setShowFrequencyTables] = useState(true);
    const [showCharts, setShowCharts] = useState(false);
    const [showStatistics, setShowStatistics] = useState(true);

    const variables = useVariableStore.getState().variables;
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    useEffect(() => {
        // Filter out variables without a name (and ensure they have tempId)
        const validVars = variables.filter(v => v.name !== "" && v.tempId);
        // Ensure initial availableVariables don't include any already selected ones (by tempId)
        const selectedTempIds = new Set(selectedVariables.map(v => v.tempId));
        const finalAvailable = validVars.filter(v => v.tempId && !selectedTempIds.has(v.tempId)); // Added tempId check again for safety
        setAvailableVariables(finalAvailable);
    }, [variables, selectedVariables]); // Add selectedVariables dependency

    const moveToSelectedVariables = (variable: Variable, targetIndex?: number) => {
        if (!variable.tempId) {
            console.error("Cannot move variable without tempId:", variable);
            return;
        }
        setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setSelectedVariables(prev => {
            if (prev.some(v => v.tempId === variable.tempId)) {
                return prev;
            }
            const newList = [...prev];
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variable);
            } else {
                newList.push(variable);
            }
            return newList;
        });
        setHighlightedVariable(null);
    };

    const moveToAvailableVariables = (variable: Variable, targetIndex?: number) => {
        if (!variable.tempId) {
            console.error("Cannot move variable without tempId:", variable);
            return;
        }
        setSelectedVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setAvailableVariables(prev => {
            if (prev.some(v => v.tempId === variable.tempId)) {
                return prev;
            }
            const newList = [...prev];
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variable);
            } else {
                newList.push(variable);
            }
            newList.sort((a, b) => a.columnIndex - b.columnIndex);
            return newList;
        });
        setHighlightedVariable(null);
    };

    const reorderVariables = (source: 'available' | 'selected', reorderedList: Variable[]) => {
        if (source === 'available') {
            setAvailableVariables([...reorderedList]);
        } else {
            setSelectedVariables([...reorderedList]);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedVariables.length) {
            setErrorMsg("Please select at least one variable.");
            return;
        }
        setErrorMsg(null);
        setIsCalculating(true);

        try {
            const variableDataPromises = [];
            for (const varDef of selectedVariables) {
                variableDataPromises.push(useDataStore.getState().getVariableData(varDef));
            }
            const variableData = await Promise.all(variableDataPromises);

            const worker = new Worker("/workers/Frequencies/index.js");

            const timeoutId = setTimeout(() => {
                worker.terminate();
                setErrorMsg("Analysis timed out. Please try again with fewer variables.");
                setIsCalculating(false);
            }, 60000);

            worker.onmessage = async (e) => {
                clearTimeout(timeoutId);
                const wData = e.data;

                if (wData.success) {
                    try {
                        const variableNames = selectedVariables.map(v => v.name);
                        const logMsg = `FREQUENCIES VARIABLES=${variableNames.join(", ")}`;
                        const logId = await addLog({ log: logMsg });

                        const analyticId = await addAnalytic(logId, {
                            title: "Frequencies",
                            note: ""
                        });

                        if (wData.descriptive) {
                            await addStatistic(analyticId, {
                                title: "Statistics",
                                output_data: wData.descriptive,
                                components: "Descriptive Statistics",
                                description: ""
                            });
                        }

                        if (wData.frequencies) {
                            for (let i = 0; i < wData.frequencies.length; i++) {
                                await addStatistic(analyticId, {
                                    title: `${variableNames[i]}`,
                                    output_data: wData.frequencies[i],
                                    components: "Frequency Table",
                                    description: ""
                                });
                            }
                        }

                        setIsCalculating(false);
                        worker.terminate();
                        onClose();
                    } catch (err) {
                        console.error(err);
                        setErrorMsg("Error saving results.");
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

            worker.postMessage({
                action: "FULL_ANALYSIS",
                variableData: variableData
            });

        } catch (ex) {
            console.error(ex);
            setErrorMsg("Something went wrong.");
            setIsCalculating(false);
        }
    };

    return (
        <DialogContent className="max-w-[650px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Frequencies</DialogTitle>
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
                        <TabsTrigger
                            value="charts"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'charts' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Charts
                        </TabsTrigger>
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
                        showFrequencyTables={showFrequencyTables}
                        setShowFrequencyTables={setShowFrequencyTables}
                    />
                </TabsContent>

                <TabsContent value="statistics" className="p-6 overflow-y-auto flex-grow">
                    <StatisticsTab
                        showStatistics={showStatistics}
                        setShowStatistics={setShowStatistics}
                    />
                </TabsContent>

                <TabsContent value="charts" className="p-6 overflow-y-auto flex-grow">
                    <ChartsTab
                        showCharts={showCharts}
                        setShowCharts={setShowCharts}
                    />
                </TabsContent>
            </Tabs>

            {errorMsg && <div className="px-6 py-2 text-red-600">{errorMsg}</div>}

            <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                        onClick={handleAnalyze}
                        disabled={isCalculating}
                    >
                        {isCalculating ? "Calculating..." : "OK"}
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        disabled={isCalculating}
                    >
                        Paste
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
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
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        disabled={isCalculating}
                    >
                        Help
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
};

export default Index;