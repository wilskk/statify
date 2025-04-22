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
import OptionsTab from "./OptionsTab";
import StatisticsTab from "./StatisticsTab";

interface RatioStatisticsProps {
    onClose: () => void;
}

const RatioStatistics: FC<RatioStatisticsProps> = ({ onClose }) => {
    const { closeModal } = useModalStore();
    const { variables } = useVariableStore();
    const { data } = useDataStore();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    // Tab state
    const [activeTab, setActiveTab] = useState("variables");

    // Variables tab state
    const [storeVariables, setStoreVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<string | null>(null);
    const [numeratorVariable, setNumeratorVariable] = useState<Variable | null>(null);
    const [denominatorVariable, setDenominatorVariable] = useState<Variable | null>(null);
    const [groupVariable, setGroupVariable] = useState<Variable | null>(null);

    // Options tab state
    const [sortByGroup, setSortByGroup] = useState(true);
    const [sortOrder, setSortOrder] = useState<"ascending" | "descending">("ascending");
    const [displayResults, setDisplayResults] = useState(true);
    const [saveToFile, setSaveToFile] = useState(false);
    const [filePath, setFilePath] = useState("");

    // Statistics tab state
    const [centralTendencyOptions, setCentralTendencyOptions] = useState({
        median: false,
        mean: false,
        weightedMean: false,
        confidenceIntervals: false
    });

    const [confidenceLevel, setConfidenceLevel] = useState("95");

    const [dispersionOptions, setDispersionOptions] = useState({
        aad: false,
        cov: true,
        prd: true,
        medianCenteredCOV: true,
        meanCenteredCOV: false,
        standardDeviation: false,
        range: false,
        minimum: false,
        maximum: false
    });

    useEffect(() => {
        const assignedIndexes = [
            numeratorVariable?.columnIndex,
            denominatorVariable?.columnIndex,
            groupVariable?.columnIndex
        ].filter(index => index !== undefined);

        const initialStoreVars = variables
            .filter(v => v.name !== "")
            .filter(v => !assignedIndexes.includes(v.columnIndex))
            .sort((a, b) => a.name.localeCompare(b.name));
        setStoreVariables(initialStoreVars);
    }, [variables, numeratorVariable, denominatorVariable, groupVariable]);

    const addVariableBackToStore = (variable: Variable | null) => {
        if (!variable) return;
        setStoreVariables(prev => [...prev, variable].sort((a, b) => a.name.localeCompare(b.name)));
    };

    const setAsNumerator = () => {
        if (!highlightedVariable) return;
        const variable = storeVariables.find(v => v.columnIndex.toString() === highlightedVariable);
        if (variable) {
            addVariableBackToStore(numeratorVariable);
            setNumeratorVariable(variable);
            setStoreVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
            setHighlightedVariable(null);
        }
    };

    const setAsDenominator = () => {
        if (!highlightedVariable) return;
        const variable = storeVariables.find(v => v.columnIndex.toString() === highlightedVariable);
        if (variable) {
            addVariableBackToStore(denominatorVariable);
            setDenominatorVariable(variable);
            setStoreVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
            setHighlightedVariable(null);
        }
    };

    const setAsGroupVariable = () => {
        if (!highlightedVariable) return;
        const variable = storeVariables.find(v => v.columnIndex.toString() === highlightedVariable);
        if (variable) {
            addVariableBackToStore(groupVariable);
            setGroupVariable(variable);
            setStoreVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
            setHighlightedVariable(null);
        }
    };

    const removeFromNumerator = () => {
        addVariableBackToStore(numeratorVariable);
        setNumeratorVariable(null);
    };

    const removeFromDenominator = () => {
        addVariableBackToStore(denominatorVariable);
        setDenominatorVariable(null);
    };

    const removeFromGroupVariable = () => {
        addVariableBackToStore(groupVariable);
        setGroupVariable(null);
    };

    const handleFileBrowse = () => {
        console.log("Browse for file");
    };

    const handleStatistics = () => {
        setActiveTab("statistics");
    };

    const handleConfirm = async () => {
        if (!numeratorVariable || !denominatorVariable) {
            alert("Please select both numerator and denominator variables.");
            return;
        }

        try {
            const logEntry = {
                log: `Ratio Statistics Analysis: ${new Date().toLocaleString()}`
            };

            const logId = await addLog(logEntry);

            const analyticEntry = {
                title: "Ratio Statistics",
                note: `Analysis performed with numerator: ${numeratorVariable.name}, denominator: ${denominatorVariable.name}${groupVariable ? `, grouped by: ${groupVariable.name}` : ''}.`
            };

            const analyticId = await addAnalytic(logId, analyticEntry);

            closeModal();
        } catch (error) {
            console.error("Error performing ratio statistics analysis:", error);
            alert("An error occurred while performing the analysis. Please try again.");
        }
    };

    const handleReset = () => {
        setNumeratorVariable(null);
        setDenominatorVariable(null);
        setGroupVariable(null);
        setStoreVariables(variables.filter(v => v.name !== "").sort((a, b) => a.name.localeCompare(b.name)));
        setHighlightedVariable(null);
        setSortByGroup(true);
        setSortOrder("ascending");
        setDisplayResults(true);
        setSaveToFile(false);
        setFilePath("");
        setCentralTendencyOptions({
            median: false,
            mean: false,
            weightedMean: false,
            confidenceIntervals: false
        });
        setConfidenceLevel("95");
        setDispersionOptions({
            aad: false,
            cov: true,
            prd: true,
            medianCenteredCOV: true,
            meanCenteredCOV: false,
            standardDeviation: false,
            range: false,
            minimum: false,
            maximum: false
        });
    };

    return (
        <DialogContent className="max-w-[600px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Ratio Statistics</DialogTitle>
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
                        <TabsTrigger
                            value="statistics"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'statistics' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Statistics
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="variables" className="overflow-y-auto flex-grow">
                    <VariablesTab
                        storeVariables={storeVariables}
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        numeratorVariable={numeratorVariable}
                        denominatorVariable={denominatorVariable}
                        groupVariable={groupVariable}
                        setAsNumerator={setAsNumerator}
                        setAsDenominator={setAsDenominator}
                        setAsGroupVariable={setAsGroupVariable}
                        removeFromNumerator={removeFromNumerator}
                        removeFromDenominator={removeFromDenominator}
                        removeFromGroupVariable={removeFromGroupVariable}
                    />
                </TabsContent>

                <TabsContent value="options" className="overflow-y-auto flex-grow">
                    <OptionsTab
                        groupVariable={groupVariable}
                        sortByGroup={sortByGroup}
                        setSortByGroup={setSortByGroup}
                        sortOrder={sortOrder}
                        setSortOrder={setSortOrder}
                        displayResults={displayResults}
                        setDisplayResults={setDisplayResults}
                        saveToFile={saveToFile}
                        setSaveToFile={setSaveToFile}
                        handleFileBrowse={handleFileBrowse}
                        handleStatistics={handleStatistics}
                    />
                </TabsContent>

                <TabsContent value="statistics" className="overflow-y-auto flex-grow">
                    <StatisticsTab
                        centralTendencyOptions={centralTendencyOptions}
                        setCentralTendencyOptions={setCentralTendencyOptions}
                        confidenceLevel={confidenceLevel}
                        setConfidenceLevel={setConfidenceLevel}
                        dispersionOptions={dispersionOptions}
                        setDispersionOptions={setDispersionOptions}
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
                        onClick={handleReset}
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

export default RatioStatistics;