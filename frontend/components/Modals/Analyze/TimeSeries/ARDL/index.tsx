"use client";

import type { FC } from "react";
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import type { Variable } from "@/types/Variable";
import { useTimeHook } from "@/components/Modals/Analyze/TimeSeries/TimeSeriesTimeHook";
import { useOptionHook } from "@/components/Modals/Analyze/TimeSeries/ARDL/hooks/optionHook";
import { useAnalyzeHook } from "@/components/Modals/Analyze/TimeSeries/ARDL/hooks/analyzeHook";
import VariablesTab from "@/components/Modals/Analyze/TimeSeries/ARDL/VariablesTab";
import TimeTab from "@/components/Modals/Analyze/TimeSeries/TimeSeriesTimeTab";
import OptionTab from "@/components/Modals/Analyze/TimeSeries/ARDL/OptionTab";
import { getFormData, clearFormData } from "@/hooks/useIndexedDB";
import type { DataRow } from "@/types/Data";
import { toast } from "sonner";

interface ARDLProps {
    onClose: () => void;
    containerType?: string;
}

const ARDL: FC<ARDLProps> = ({ onClose, containerType }) => {
    const { variables } = useVariableStore();
    const { data } = useDataStore();
        
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [dependentVariable, setDependentVariable] = useState<Variable[]>([]);
    const [independentVariables, setIndependentVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{columnIndex: number, source: string} | null>(null);
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
        qOrders,
        handlePOrder,
        handleQOrders,
        resetOptions,
    } = useOptionHook();

    const { errorMsg: analysisError, isCalculating, handleAnalyzes } = useAnalyzeHook(
        dependentVariable,
        independentVariables,
        data,
        selectedPeriod,
        pOrder,
        qOrders,
        onClose
    );
    
    const combinedError = errorMsg || analysisError;

    useEffect(() => {
        if (combinedError) {
            toast.error(`Error: ${String(combinedError)}`);
        }
    }, [combinedError]);

    useEffect(() => {
        const loadSavedState = async () => {
            try {
                const savedData = await getFormData("ARDL", "variables");
                const filteredVariables = variables.filter(v => v.name !== "");

                if (savedData?.prevDataRef) {
                    setPrevDataRef(savedData.prevDataRef);
                    if (JSON.stringify(savedData.prevDataRef) !== JSON.stringify(data)) {
                        await clearFormData("ARDL");
                        setAvailableVariables(filteredVariables);
                        setDependentVariable([]);
                        setIndependentVariables([]);
                        return;
                    }
                }
                
                if (savedData?.dependentVariable) {
                    setDependentVariable(savedData.dependentVariable);
                }
                if (savedData?.independentVariables) {
                    setIndependentVariables(savedData.independentVariables);
                }
                
                const selectedVars = [...(savedData?.dependentVariable || []), ...(savedData?.independentVariables || [])];
                const remaining = filteredVariables.filter(
                    v => !selectedVars.some((sv: Variable) => sv.columnIndex === v.columnIndex)
                );
                setAvailableVariables(remaining);
            } catch (error) {
                console.error("Error loading saved state:", error);
                const filteredVariables = variables.filter(v => v.name !== "");
                setAvailableVariables(filteredVariables);
                setDependentVariable([]);
                setIndependentVariables([]);
            }
        };

        loadSavedState();
    }, [variables, data]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
    };

    const handleOk = () => {
        if (dependentVariable.length === 0 || independentVariables.length === 0) {
            toast.error("Please select at least one dependent and one independent variable");
            return;
        }
        handleAnalyzes();
    };

    const handleReset = async () => {
        const filteredVariables = variables.filter(v => v.name !== "");
        setAvailableVariables(filteredVariables);
        setDependentVariable([]);
        setIndependentVariables([]);
        resetTime();
        resetOptions();
        await clearFormData("ARDL");
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
                            dependentVariable={dependentVariable}
                            independentVariables={independentVariables}
                            highlightedVariable={highlightedVariable}
                            setAvailableVariables={setAvailableVariables}
                            setDependentVariable={setDependentVariable}
                            setIndependentVariables={setIndependentVariables}
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
                            qOrders={qOrders}
                            independentVariables={independentVariables}
                            handlePOrder={handlePOrder}
                            handleQOrders={handleQOrders}
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
                <Button 
                    onClick={handleOk} 
                    disabled={isCalculating || dependentVariable.length === 0 || independentVariables.length === 0}
                >
                    {isCalculating ? "Calculating..." : "OK"}
                </Button>
            </div>
        </div>
    );
};

export default ARDL;
