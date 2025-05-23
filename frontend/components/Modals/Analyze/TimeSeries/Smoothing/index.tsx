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
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { Variable } from "@/types/Variable";
import { useOptionHook } from "./hook/optionHook";
import { useTimeHook } from "./hook/timeHook";
import { useAnalyzeHook } from "./hook/analyzeHook";
import VariablesTab from "./VariablesTab";
import OptionTab from "./OptionTab";
import TimeTab from "./TimeTab";

interface SmoothingProps {
    onClose: () => void;
}

const Smoothing: FC<SmoothingProps> = ({ onClose }) => {
    const { variables } = useVariableStore();
    const { data } = useDataStore();
    
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{columnIndex: number, source: 'available' | 'selected'} | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState("variables");
    const [saveAsVariable, setSaveAsVariable] = useState(false);

    const {
        selectedMethod,
        parameters,
        methods,
        inputParameters,
        handleSelectedMethod,
        resetOptions,
    } = useOptionHook();

    const {
        periods,
        selectedPeriod,
        initialType,
        handleSelectedPeriod,
        resetTime,
        inputPeriods,
    } = useTimeHook();

    const { errorMsg: analysisError, isCalculating, handleAnalyzes } = useAnalyzeHook(
        selectedMethod,
        parameters,
        selectedPeriod,
        selectedVariables,
        data,
        saveAsVariable,
        onClose
    );
    const combinedError = errorMsg || analysisError;

    useEffect(() => {
            setAvailableVariables(variables.filter(v => v.name !== ""));
    }, [variables]);

    const moveToSelectedVariables = (variable: Variable, targetIndex?: number) => {
        if (selectedVariables.length > 0) {
            setErrorMsg("Hanya boleh memilih satu variabel saja.");
            return;
        }
        setErrorMsg(null); // clear error kalau sukses
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

    const handleReset = () => {
        resetOptions();
        resetTime();
        setSaveAsVariable(false);
        reorderVariables('available', variables.filter(v => v.name !== ""));
        setSelectedVariables([]);
    }

    return (
        <DialogContent className="max-w-[600px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Smoothing</DialogTitle>
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
                            value="option"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'option' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Option
                        </TabsTrigger>
                        <TabsTrigger
                            value="time"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'time' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            time
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
                        saveAsVariable={saveAsVariable}
                        setSaveAsVariable={setSaveAsVariable}
                    />
                </TabsContent>

                <TabsContent value="option" className="p-6 overflow-y-auto flex-grow">
                    <OptionTab
                        methods={methods}
                        selectedMethod={selectedMethod}
                        inputParameters={inputParameters}
                        handleSelectedMethod={handleSelectedMethod}
                    />
                </TabsContent>

                <TabsContent value="time" className="p-6 overflow-y-auto flex-grow">
                    <TimeTab
                        periods={periods}
                        selectedPeriod={selectedPeriod}
                        initialType={initialType}
                        handleSelectedPeriod={handleSelectedPeriod}
                        inputPeriods={inputPeriods}
                    />
                </TabsContent>

            </Tabs>

            {combinedError && <div className="px-6 py-2 text-red-600 text-center">{combinedError}</div>}

            <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                        onClick={handleAnalyzes}
                        disabled={isCalculating}
                    >
                        {isCalculating ? "Processing..." : "OK"}
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        disabled={isCalculating}
                        onClick={handleReset}
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
export default Smoothing;