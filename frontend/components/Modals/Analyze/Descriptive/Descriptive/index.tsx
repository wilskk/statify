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
import { Variable } from "@/types/Variable";
import { useDescriptivesAnalysis } from "@/hooks/useDescriptivesAnalysis";

import VariablesTab from "./VariablesTab";
import StatisticsTab from "./StatisticsTab";


interface DescriptivesProps {
    onClose: () => void;
}

const Descriptives: FC<DescriptivesProps> = ({ onClose }) => {
    const { variables } = useVariableStore();

    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{columnIndex: number, source: 'available' | 'selected'} | null>(null);

    const [activeTab, setActiveTab] = useState("variables");
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

    const [displayOrder, setDisplayOrder] = useState("variableList");

    const { isCalculating, errorMsg, runAnalysis } = useDescriptivesAnalysis({
        selectedVariables,
        displayStatistics,
        saveStandardized,
        onClose
    });

    useEffect(() => {
        setAvailableVariables(variables.filter(v => v.name !== ""));
    }, [variables]);

    const moveToSelectedVariables = (variable: Variable, targetIndex?: number) => {
        setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setSelectedVariables(prev => {
            if (prev.some(v => v.columnIndex === variable.columnIndex)) {
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
        setSelectedVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setAvailableVariables(prev => {
            if (prev.some(v => v.columnIndex === variable.columnIndex)) {
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

    const reorderVariables = (source: 'available' | 'selected', variablesToReorder: Variable[]) => {
        if (source === 'available') {
            setAvailableVariables([...variablesToReorder]);
        } else {
            setSelectedVariables([...variablesToReorder]);
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
                        saveStandardized={saveStandardized}
                        setSaveStandardized={setSaveStandardized}
                    />
                </TabsContent>

                <TabsContent value="statistics" className="p-6 overflow-y-auto flex-grow">
                    <StatisticsTab
                        displayStatistics={displayStatistics}
                        setDisplayStatistics={setDisplayStatistics}
                        displayOrder={displayOrder}
                        setDisplayOrder={setDisplayOrder}
                    />
                </TabsContent>


            </Tabs>

            {errorMsg && <div className="px-6 py-2 text-red-600">{errorMsg}</div>}

            <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                        onClick={runAnalysis}
                        disabled={isCalculating}
                    >
                        {isCalculating ? "Processing..." : "OK"}
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

export default Descriptives;