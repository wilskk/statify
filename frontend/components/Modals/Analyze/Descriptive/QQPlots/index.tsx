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
import { useResultStore } from "@/stores/useResultStore";
import type { Variable } from "@/types/Variable";

import VariablesTab from "./VariablesTab";
import OptionsTab from "./OptionsTab";

interface QQPlotsModalProps {
    onClose: () => void;
}

const Index: FC<QQPlotsModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState("variables");
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available' | 'selected'} | null>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Distribution section state
    const [testDistribution, setTestDistribution] = useState<string>("Normal");
    const [degreesOfFreedom, setDegreesOfFreedom] = useState<string>("");
    const [estimateFromData, setEstimateFromData] = useState<boolean>(true);
    const [location, setLocation] = useState<string>("0");
    const [scale, setScale] = useState<string>("1");

    // Transform section state
    const [naturalLogTransform, setNaturalLogTransform] = useState<boolean>(false);
    const [standardizeValues, setStandardizeValues] = useState<boolean>(false);
    const [difference, setDifference] = useState<boolean>(false);
    const [differenceValue, setDifferenceValue] = useState<string>("1");
    const [seasonallyDifference, setSeasonallyDifference] = useState<boolean>(false);
    const [seasonallyDifferenceValue, setSeasonallyDifferenceValue] = useState<string>("1");
    const [currentPeriodicity, setCurrentPeriodicity] = useState<string>("None");

    // Estimation section state
    const [proportionEstimation, setProportionEstimation] = useState<string>("Blom's");
    const [rankAssignedToTies, setRankAssignedToTies] = useState<string>("Mean");

    const variables = useVariableStore.getState().variables;
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    // Initialize available variables on component mount
    useEffect(() => {
        const validVars = variables.filter(v => v.name !== "");
        setAvailableVariables(validVars);
    }, [variables]);

    const moveToSelectedVariables = (variable: Variable) => {
        setSelectedVariables(prev => [...prev, variable]);
        setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const moveToAvailableVariables = (variable: Variable) => {
        setAvailableVariables(prev => [...prev, variable]);
        setSelectedVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const handleAnalyze = async () => {
        if (selectedVariables.length === 0) {
            setErrorMsg("Please select at least one variable.");
            return;
        }

        setErrorMsg(null);
        setIsCalculating(true);

        try {
            setTimeout(() => {
                const variableNames = selectedVariables.map(v => v.name).join(" ");
                const logMsg = `Q-Q PLOTS VARIABLES=${variableNames} DIST=${testDistribution}`;

                addLog({ log: logMsg }).then(logId => {
                    addAnalytic(logId, {
                        title: "Q-Q Plots",
                        note: ""
                    }).then(analyticId => {
                        addStatistic(analyticId, {
                            title: "Quantile-Quantile Plot",
                            output_data: JSON.stringify({
                                type: "qqplot",
                                variables: selectedVariables.map(v => v.name),
                                options: {
                                    testDistribution,
                                    degreesOfFreedom,
                                    estimateFromData,
                                    location,
                                    scale,
                                    transform: {
                                        naturalLogTransform,
                                        standardizeValues,
                                        difference,
                                        differenceValue,
                                        seasonallyDifference,
                                        seasonallyDifferenceValue,
                                        currentPeriodicity
                                    },
                                    proportionEstimation,
                                    rankAssignedToTies
                                }
                            }),
                            components: "Q-Q Plot",
                            description: ""
                        }).then(() => {
                            setIsCalculating(false);
                            onClose();
                        });
                    });
                });
            }, 1500);

        } catch (ex) {
            console.error(ex);
            setErrorMsg("Something went wrong.");
            setIsCalculating(false);
        }
    };

    return (
        <DialogContent className="max-w-[650px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Q-Q Plots</DialogTitle>
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
                        availableVariables={availableVariables}
                        selectedVariables={selectedVariables}
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        moveToSelectedVariables={moveToSelectedVariables}
                        moveToAvailableVariables={moveToAvailableVariables}
                    />
                </TabsContent>

                <TabsContent value="options" className="p-6 overflow-y-auto flex-grow">
                    <OptionsTab
                        testDistribution={testDistribution}
                        setTestDistribution={setTestDistribution}
                        degreesOfFreedom={degreesOfFreedom}
                        setDegreesOfFreedom={setDegreesOfFreedom}
                        estimateFromData={estimateFromData}
                        setEstimateFromData={setEstimateFromData}
                        location={location}
                        setLocation={setLocation}
                        scale={scale}
                        setScale={setScale}
                        naturalLogTransform={naturalLogTransform}
                        setNaturalLogTransform={setNaturalLogTransform}
                        standardizeValues={standardizeValues}
                        setStandardizeValues={setStandardizeValues}
                        difference={difference}
                        setDifference={setDifference}
                        differenceValue={differenceValue}
                        setDifferenceValue={setDifferenceValue}
                        seasonallyDifference={seasonallyDifference}
                        setSeasonallyDifference={setSeasonallyDifference}
                        seasonallyDifferenceValue={seasonallyDifferenceValue}
                        setSeasonallyDifferenceValue={setSeasonallyDifferenceValue}
                        currentPeriodicity={currentPeriodicity}
                        proportionEstimation={proportionEstimation}
                        setProportionEstimation={setProportionEstimation}
                        rankAssignedToTies={rankAssignedToTies}
                        setRankAssignedToTies={setRankAssignedToTies}
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