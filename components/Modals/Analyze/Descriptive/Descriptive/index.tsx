"use client";

import React, { FC, useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/stores/useModalStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { Variable } from "@/types/Variable";

import VariablesTab from "./VariablesTab";
import StatisticsTab from "./StatisticsTab";
import DisplayTab from "./DisplayTab";

interface DescriptivesProps {
    onClose: () => void;
}

const Descriptives: FC<DescriptivesProps> = ({ onClose }) => {
    const { closeModal } = useModalStore();
    const { variables } = useVariableStore();
    const { data } = useDataStore();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    const [storeVariables, setStoreVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available' | 'selected'} | null>(null);

    // Tab state
    const [activeTab, setActiveTab] = useState("variables");

    // Options settings
    const [saveStandardized, setSaveStandardized] = useState(false);
    const [displayStatistics, setDisplayStatistics] = useState({
        mean: true,
        stdDev: true,
        minimum: true,
        maximum: true,
        variance: false,
        range: false,
        sum: false,
        median: false,
        skewness: false,
        kurtosis: false,
        standardError: false
    });

    // Display settings
    const [displayOrder, setDisplayOrder] = useState("analysis");
    const [variableListFormat, setVariableListFormat] = useState("name");

    useEffect(() => {
        setStoreVariables(variables.filter(v => v.name !== ""));
    }, [variables]);

    const moveToSelectedVariables = (variable: Variable) => {
        setSelectedVariables(prev => [...prev, variable]);
        setStoreVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const moveFromSelectedVariables = (variable: Variable) => {
        setStoreVariables(prev => [...prev, variable]);
        setSelectedVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const handleTransferClick = () => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === "available") {
            const columnIndex = parseInt(highlightedVariable.id);
            const variable = storeVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveToSelectedVariables(variable);
            }
        } else if (highlightedVariable.source === "selected") {
            const columnIndex = parseInt(highlightedVariable.id);
            const variable = selectedVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveFromSelectedVariables(variable);
            }
        }
    };

    const handleConfirm = async () => {
        if (selectedVariables.length === 0) {
            alert("Please select at least one variable.");
            return;
        }

        try {
            // Logic for performing descriptive analysis would go here

            // Create a log entry
            const logEntry = {
                log: `Descriptives Analysis: ${new Date().toLocaleString()}`
            };

            const logId = await addLog(logEntry);

            // Create an analytic entry
            const analyticEntry = {
                title: "Descriptives",
                note: `Analysis performed with ${selectedVariables.length} variables.`
            };

            const analyticId = await addAnalytic(logId, analyticEntry);

            // Save results - implementation would depend on actual analysis

            // Close the modal
            closeModal();
        } catch (error) {
            console.error("Error performing descriptives analysis:", error);
            alert("An error occurred while performing the analysis. Please try again.");
        }
    };

    return (
        <DialogContent className="max-w-[600px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Descriptives</DialogTitle>
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
                            value="display"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'display' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Display
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <VariablesTab
                        storeVariables={storeVariables}
                        selectedVariables={selectedVariables}
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        moveToSelectedVariables={moveToSelectedVariables}
                        moveFromSelectedVariables={moveFromSelectedVariables}
                        handleTransferClick={handleTransferClick}
                        saveStandardized={saveStandardized}
                        setSaveStandardized={setSaveStandardized}
                    />
                </TabsContent>

                <TabsContent value="statistics" className="p-6 overflow-y-auto flex-grow">
                    <StatisticsTab
                        displayStatistics={displayStatistics}
                        setDisplayStatistics={setDisplayStatistics}
                    />
                </TabsContent>

                <TabsContent value="display" className="p-6 overflow-y-auto flex-grow">
                    <DisplayTab
                        displayOrder={displayOrder}
                        setDisplayOrder={setDisplayOrder}
                        variableListFormat={variableListFormat}
                        setVariableListFormat={setVariableListFormat}
                    />
                </TabsContent>
            </Tabs>

            <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                        onClick={handleConfirm}
                    >
                        OK
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                    >
                        Paste
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                    >
                        Help
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
};

export default Descriptives;