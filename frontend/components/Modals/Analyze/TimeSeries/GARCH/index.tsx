"use client";

import type { FC } from "react";
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import type { Variable } from "@/types/Variable";
import { useTimeHook } from "@/components/Modals/Analyze/TimeSeries/TimeSeriesTimeHook";
import { useOptionHook } from "@/components/Modals/Analyze/TimeSeries/GARCH/hooks/optionHook";
import { useAnalyzeHook } from "@/components/Modals/Analyze/TimeSeries/GARCH/hooks/analyzeHook";
import VariablesTab from "@/components/Modals/Analyze/TimeSeries/GARCH/VariablesTab";
import TimeTab from "@/components/Modals/Analyze/TimeSeries/TimeSeriesTimeTab";
import OptionTab from "@/components/Modals/Analyze/TimeSeries/GARCH/OptionTab";
import { getFormData, saveFormData, clearFormData } from "@/hooks/useIndexedDB";
import type { DataRow } from "@/types/Data";
import { toast } from "sonner";

interface GARCHProps {
    onClose: () => void;
    containerType?: string;
}

const GARCH: FC<GARCHProps> = ({ onClose, containerType }) => {
    const { variables } = useVariableStore();
    const { data } = useDataStore();
        
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{columnIndex: number, source: 'available' | 'selected'} | null>(null);
    const [prevDataRef, setPrevDataRef] = useState<DataRow[] | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("variables");

    const {
        periods,
        selectedPeriod,
        handleSelectedPeriod,
        inputPeriods,
        resetTime,
    } = useTimeHook();

    const {
        pOrder,
        qOrder,
        modelType,
        handlePOrder,
        handleQOrder,
        handleModelType,
        resetOptions,
    } = useOptionHook();

    const { errorMsg: analysisError, isCalculating, handleAnalyzes } = useAnalyzeHook(
        selectedVariables,
        data,
        selectedPeriod,
        pOrder,
        qOrder,
        modelType,
        onClose
    );
    
    const combinedError = errorMsg || analysisError;

    useEffect(() => {
        if (combinedError) {
            toast.error(`Error: ${String(combinedError)}`);
        }
    }, [combinedError]);

    // Load saved state from IndexedDB
    useEffect(() => {
        const loadSavedState = async () => {
            try {
                const savedData = await getFormData("GARCH", "variables");
                const filteredVariables = variables.filter(v => v.name !== "");

                if (savedData?.prevDataRef) {
                    setPrevDataRef(savedData.prevDataRef);
                    if (JSON.stringify(savedData.prevDataRef) !== JSON.stringify(data)) {
                        await clearFormData("GARCH");
                        setAvailableVariables(filteredVariables);
                        setSelectedVariables([]);
                        return;
                    }
                }
                
                if (savedData?.selectedVariables && savedData?.selectedVariables.length > 0) {
                    setSelectedVariables(savedData.selectedVariables);
                    const remaining = filteredVariables.filter(
                        v => !savedData.selectedVariables.some((sv: Variable) => sv.columnIndex === v.columnIndex)
                    );
                    setAvailableVariables(remaining);
                } else {
                    setAvailableVariables(filteredVariables);
                    setSelectedVariables([]);
                }
            } catch (error) {
                console.error("Error loading saved state:", error);
                const filteredVariables = variables.filter(v => v.name !== "");
                setAvailableVariables(filteredVariables);
                setSelectedVariables([]);
            }
        };

        loadSavedState();
    }, [variables, data]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
    };

    const handleOk = () => {
        if (selectedVariables.length === 0) {
            toast.error("Please select at least one variable");
            return;
        }
        handleAnalyzes();
    };

    const handleReset = async () => {
        const filteredVariables = variables.filter(v => v.name !== "");
        setAvailableVariables(filteredVariables);
        setSelectedVariables([]);
        resetTime();
        resetOptions();
        await clearFormData("GARCH");
        toast.success("Form reset successfully");
    };

    return (
        <div className="h-full flex flex-col">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="variables">Variables</TabsTrigger>
                    <TabsTrigger value="time">Time</TabsTrigger>
                    <TabsTrigger value="options">Options</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-auto">
                    <TabsContent value="variables" className="h-full">
                        <VariablesTab
                            availableVariables={availableVariables}
                            selectedVariables={selectedVariables}
                            highlightedVariable={highlightedVariable}
                            setAvailableVariables={setAvailableVariables}
                            setSelectedVariables={setSelectedVariables}
                            setHighlightedVariable={setHighlightedVariable}
                            containerType={containerType}
                        />
                    </TabsContent>

                    <TabsContent value="time" className="h-full">
                        <TimeTab
                            periods={periods}
                            selectedPeriod={selectedPeriod}
                            handleSelectedPeriod={handleSelectedPeriod}
                            inputPeriods={inputPeriods}
                        />
                    </TabsContent>

                    <TabsContent value="options" className="h-full">
                        <OptionTab
                            pOrder={pOrder}
                            qOrder={qOrder}
                            modelType={modelType}
                            handlePOrder={handlePOrder}
                            handleQOrder={handleQOrder}
                            handleModelType={handleModelType}
                        />
                    </TabsContent>
                </div>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleReset}>
                    Reset
                </Button>
                <Button variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button onClick={handleOk} disabled={isCalculating || selectedVariables.length === 0}>
                    {isCalculating ? "Calculating..." : "OK"}
                </Button>
            </div>
        </div>
    );
};

export default GARCH;
