"use client";
import React, { useState, useEffect, FC, useCallback } from "react";
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

const QQPlots: FC<QQPlotsModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState("variables");
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{tempId: string, source: 'available' | 'selected'} | null>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Distribution section state
    const [testDistribution, setTestDistribution] = useState<string>("Normal");
    const [degreesOfFreedom, setDegreesOfFreedom] = useState<string>("");
    const [estimateFromData, setEstimateFromData] = useState<boolean>(true);
    const [threshold, setThreshold] = useState<string>("1");
    const [shape, setShape] = useState<string>("1");

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
        const validVars = variables.filter(v => v.name !== "").map(v => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}`
        }));
        const currentSelectedIds = new Set(selectedVariables.map(v => v.columnIndex));
        setAvailableVariables(validVars.filter(v => !currentSelectedIds.has(v.columnIndex)).sort((a, b) => a.columnIndex - b.columnIndex));
    }, [variables, selectedVariables]);

    const moveToSelectedVariables = useCallback((variable: Variable, targetIndex?: number) => {
        setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setSelectedVariables(prev => {
            const newSelected = [...prev];
            if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= newSelected.length) {
                 newSelected.splice(targetIndex, 0, variable);
             } else {
                 newSelected.push(variable);
             }
            return newSelected;
        });
        setHighlightedVariable(null);
    }, []);

    const moveToAvailableVariables = useCallback((variable: Variable, targetIndex?: number) => {
        setSelectedVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setAvailableVariables(prev => {
             const newAvailable = [...prev];
            // Find original position to maintain order
            const originalIndex = variables.findIndex(v => v.columnIndex === variable.columnIndex);
            let insertPos = newAvailable.findIndex(v => variables.findIndex(av => av.columnIndex === v.columnIndex) > originalIndex);
            if (insertPos === -1) insertPos = newAvailable.length; // Append if it belongs at the end

             // Use targetIndex if provided for drop, otherwise calculated insertPos
             if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= newAvailable.length) {
                 newAvailable.splice(targetIndex, 0, variable);
             } else {
                 newAvailable.splice(insertPos, 0, variable);
             }
            // Sort available list based on original variable order
            return newAvailable.sort((a, b) =>
                variables.findIndex(v => v.columnIndex === a.columnIndex) -
                variables.findIndex(v => v.columnIndex === b.columnIndex)
            );
        });
        setHighlightedVariable(null);
    }, [variables]);

    const reorderVariables = useCallback((source: 'available' | 'selected', reorderedList: Variable[]) => {
        if (source === 'available') {
            setAvailableVariables(reorderedList);
        } else {
            setSelectedVariables(reorderedList);
        }
        setHighlightedVariable(null);
    }, []);

    const handleAnalyze = async () => {
        if (selectedVariables.length === 0) {
            setErrorMsg("Please select at least one variable.");
            setActiveTab("variables");
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
                                variables: selectedVariables.map(v => ({ name: v.name, columnIndex: v.columnIndex })),
                                options: {
                                    testDistribution,
                                    degreesOfFreedom,
                                    estimateFromData,
                                    threshold,
                                    shape,
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
                            description: `Q-Q Plot for ${variableNames}`
                        }).then(() => {
                            setIsCalculating(false);
                            onClose();
                        }).catch(err => {
                           console.error("Error adding statistic:", err);
                           setErrorMsg("Failed to save analysis results.");
                           setIsCalculating(false);
                        });
                    }).catch(err => {
                        console.error("Error adding analytic:", err);
                        setErrorMsg("Failed to create analysis entry.");
                        setIsCalculating(false);
                    });
                }).catch(err => {
                    console.error("Error adding log:", err);
                    setErrorMsg("Failed to log analysis action.");
                    setIsCalculating(false);
                });
            }, 500);

        } catch (ex) {
            console.error("Error in handleAnalyze:", ex);
            setErrorMsg("An unexpected error occurred during analysis setup.");
            setIsCalculating(false);
        }
    };

    const handleReset = () => {
        setActiveTab("variables");
        const allVars = variables.filter(v => v.name !== "");
        setAvailableVariables(allVars.sort((a, b) => a.columnIndex - b.columnIndex));
        setSelectedVariables([]);
        setHighlightedVariable(null);
        setTestDistribution("Normal");
        setDegreesOfFreedom("");
        setEstimateFromData(true);
        setThreshold("1");
        setShape("1");
        setNaturalLogTransform(false);
        setStandardizeValues(false);
        setDifference(false);
        setDifferenceValue("1");
        setSeasonallyDifference(false);
        setSeasonallyDifferenceValue("1");
        setCurrentPeriodicity("None");
        setProportionEstimation("Blom's");
        setRankAssignedToTies("Mean");
        setErrorMsg(null);
    };

    const handlePaste = () => {
        console.log("Paste action triggered - QQPlots");
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
                            className={`px-4 h-8 rounded-none text-sm data-[state=active]:bg-white data-[state=active]:border-t data-[state=active]:border-l data-[state=active]:border-r data-[state=active]:border-[#E6E6E6] data-[state=inactive]:bg-[#F7F7F7]`}
                        >
                            Variables
                        </TabsTrigger>
                        <TabsTrigger
                            value="options"
                            className={`px-4 h-8 rounded-none text-sm data-[state=active]:bg-white data-[state=active]:border-t data-[state=active]:border-l data-[state=active]:border-r data-[state=active]:border-[#E6E6E6] data-[state=inactive]:bg-[#F7F7F7]`}
                        >
                            Options
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow focus-visible:ring-0 focus-visible:ring-offset-0">
                    <VariablesTab
                        availableVariables={availableVariables}
                        selectedVariables={selectedVariables}
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        moveToSelectedVariables={moveToSelectedVariables}
                        moveToAvailableVariables={moveToAvailableVariables}
                        reorderVariables={reorderVariables}
                    />
                </TabsContent>

                <TabsContent value="options" className="p-6 overflow-y-auto flex-grow focus-visible:ring-0 focus-visible:ring-offset-0">
                    <OptionsTab
                        testDistribution={testDistribution}
                        setTestDistribution={setTestDistribution}
                        degreesOfFreedom={degreesOfFreedom}
                        setDegreesOfFreedom={setDegreesOfFreedom}
                        estimateFromData={estimateFromData}
                        setEstimateFromData={setEstimateFromData}
                        threshold={threshold}
                        setThreshold={setThreshold}
                        shape={shape}
                        setShape={setShape}
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

            {errorMsg && <div className="px-6 py-2 text-red-600 text-sm">{errorMsg}</div>}

            <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-black text-white hover:bg-[#444444] h-8 px-4 text-sm"
                        onClick={handleAnalyze}
                        disabled={isCalculating}
                    >
                        {isCalculating ? "Calculating..." : "OK"}
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4 text-sm"
                        onClick={handleReset}
                        disabled={isCalculating}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4 text-sm"
                        onClick={onClose}
                        disabled={isCalculating}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4 text-sm"
                        disabled={isCalculating}
                    >
                        Help
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
};

export default QQPlots;