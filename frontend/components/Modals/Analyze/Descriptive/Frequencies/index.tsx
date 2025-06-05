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
import type { Variable } from "@/types/Variable";
import { useFrequenciesAnalysis } from "./hooks/useFrequenciesAnalysis";
import type { StatisticsOptions } from "./types";
import type { ChartOptions } from "./types";
import { HelpCircle } from "lucide-react";
import { BaseModalProps } from "@/types/modalTypes";

import VariablesTab from "./VariablesTab";
import StatisticsTab from "./StatisticsTab";
import ChartsTab from "./ChartsTab";

// FrequenciesContent component to be reused in both dialog and sidebar containers
const FrequenciesContent: FC<BaseModalProps> = ({ onClose, containerType = "dialog" }) => {
    const [activeTab, setActiveTab] = useState("variables");
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{tempId: string, source: 'available' | 'selected'} | null>(null);

    const [resetChartsCounter, setResetChartsCounter] = useState(0);

    const [showFrequencyTables, setShowFrequencyTables] = useState(true);
    const [showCharts, setShowCharts] = useState(false);
    const [showStatistics, setShowStatistics] = useState(true);

    const [chartType, setChartType] = useState<"none" | "barCharts" | "pieCharts" | "histograms">("none");
    const [chartValues, setChartValues] = useState<"frequencies" | "percentages">("frequencies");
    const [showNormalCurve, setShowNormalCurve] = useState(false);

    const [quartilesChecked, setQuartilesChecked] = useState(false);
    const [cutPointsChecked, setCutPointsChecked] = useState(false);
    const [cutPointsValue, setCutPointsValue] = useState("10");
    const [enablePercentiles, setEnablePercentiles] = useState(false);
    const [percentileValues, setPercentileValues] = useState<string[]>([]);
    const [currentPercentileInput, setCurrentPercentileInput] = useState("");
    const [selectedPercentileItem, setSelectedPercentileItem] = useState<string | null>(null);

    const [meanChecked, setMeanChecked] = useState(false);
    const [medianChecked, setMedianChecked] = useState(false);
    const [modeChecked, setModeChecked] = useState(false);
    const [sumChecked, setSumChecked] = useState(false);

    const [stdDevChecked, setStdDevChecked] = useState(false);
    const [varianceChecked, setVarianceChecked] = useState(false);
    const [rangeChecked, setRangeChecked] = useState(false);
    const [minChecked, setMinChecked] = useState(false);
    const [maxChecked, setMaxChecked] = useState(false);
    const [seMeanChecked, setSeMeanChecked] = useState(false);

    const [skewnessChecked, setSkewnessChecked] = useState(false);
    const [kurtosisChecked, setKurtosisChecked] = useState(false);

    const variables = useVariableStore.getState().variables;

    const getCurrentStatisticsOptions = useCallback((): StatisticsOptions | null => {
        if (!showStatistics) return null;
        return {
            percentileValues: {
                quartiles: quartilesChecked,
                cutPoints: cutPointsChecked,
                cutPointsN: parseInt(cutPointsValue, 10) || 10,
                enablePercentiles: enablePercentiles,
                percentilesList: percentileValues,
            },
            centralTendency: {
                mean: meanChecked,
                median: medianChecked,
                mode: modeChecked,
                sum: sumChecked,
            },
            dispersion: {
                stddev: stdDevChecked,
                variance: varianceChecked,
                range: rangeChecked,
                minimum: minChecked,
                maximum: maxChecked,
                stdErrorMean: seMeanChecked,
            },
            distribution: {
                skewness: skewnessChecked,
                stdErrorSkewness: skewnessChecked,
                kurtosis: kurtosisChecked,
                stdErrorKurtosis: kurtosisChecked,
            },
        };
    }, [
        showStatistics,
        quartilesChecked, cutPointsChecked, cutPointsValue, enablePercentiles, percentileValues,
        meanChecked, medianChecked, modeChecked, sumChecked,
        stdDevChecked, varianceChecked, rangeChecked, minChecked, maxChecked, seMeanChecked,
        kurtosisChecked, skewnessChecked,
    ]);

    const getCurrentChartOptions = useCallback((): ChartOptions | null => {
        if (!showCharts) return null;
        return {
            type: chartType === "none" ? null : chartType,
            values: chartValues,
            showNormalCurveOnHistogram: chartType === "histograms" ? showNormalCurve : false,
        };
    }, [showCharts, chartType, chartValues, showNormalCurve]);

    const { isLoading, errorMsg, runAnalysis, cancelAnalysis } = useFrequenciesAnalysis({
        selectedVariables,
        showFrequencyTables,
        showStatistics,
        showCharts,
        statisticsOptions: getCurrentStatisticsOptions(),
        chartOptions: getCurrentChartOptions(),
        onClose
    });

    useEffect(() => {
        const validVars = variables.filter(v => v.name !== "").map(v => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}`
        }));
        const selectedTempIds = new Set(selectedVariables.map(v => v.tempId));
        const finalAvailable = validVars.filter(v => v.tempId && !selectedTempIds.has(v.tempId));
        setAvailableVariables(finalAvailable);
    }, [variables, selectedVariables]);

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

    const handleReset = () => {
        const allVars = [...availableVariables, ...selectedVariables].sort((a, b) => a.columnIndex - b.columnIndex);
        setAvailableVariables(allVars);
        setSelectedVariables([]);

        setShowFrequencyTables(true);
        setShowCharts(false);
        setShowStatistics(true);

        setQuartilesChecked(false);
        setCutPointsChecked(false);
        setCutPointsValue("10");
        setEnablePercentiles(false);
        setPercentileValues([]);
        setCurrentPercentileInput("");
        setSelectedPercentileItem(null);

        setMeanChecked(false);
        setMedianChecked(false);
        setModeChecked(false);
        setSumChecked(false);

        setStdDevChecked(false);
        setVarianceChecked(false);
        setRangeChecked(false);
        setMinChecked(false);
        setMaxChecked(false);
        setSeMeanChecked(false);

        setSkewnessChecked(false);
        setKurtosisChecked(false);
        
        setChartType("none");
        setChartValues("frequencies");
        setShowNormalCurve(false);

        setResetChartsCounter(prev => prev + 1);

        if (cancelAnalysis) {
            cancelAnalysis();
        }
    };

    useEffect(() => {
        return () => {
            if (cancelAnalysis) {
                cancelAnalysis();
            }
        };
    }, [cancelAnalysis]);

    return (
        <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-border flex-shrink-0">
                    <TabsList className="bg-muted rounded-none h-9 p-0">
                        <TabsTrigger
                            value="variables"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'variables' ? 'bg-card border-t border-l border-r border-border' : ''}`}
                        >
                            Variables
                        </TabsTrigger>
                        <TabsTrigger
                            value="statistics"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'statistics' ? 'bg-card border-t border-l border-r border-border' : ''}`}
                        >
                            Statistics
                        </TabsTrigger>
                        {/* <TabsTrigger
                            value="charts"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'charts' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Charts
                        </TabsTrigger> */}
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
                        containerType={containerType}
                    />
                </TabsContent>

                <TabsContent value="statistics" className="p-6 overflow-y-auto flex-grow">
                    <StatisticsTab
                        showStatistics={showStatistics}
                        setShowStatistics={setShowStatistics}
                        quartilesChecked={quartilesChecked}
                        setQuartilesChecked={setQuartilesChecked}
                        cutPointsChecked={cutPointsChecked}
                        setCutPointsChecked={setCutPointsChecked}
                        cutPointsValue={cutPointsValue}
                        setCutPointsValue={setCutPointsValue}
                        enablePercentiles={enablePercentiles}
                        setEnablePercentiles={setEnablePercentiles}
                        percentileValues={percentileValues}
                        setPercentileValues={setPercentileValues}
                        currentPercentileInput={currentPercentileInput}
                        setCurrentPercentileInput={setCurrentPercentileInput}
                        selectedPercentileItem={selectedPercentileItem}
                        setSelectedPercentileItem={setSelectedPercentileItem}
                        meanChecked={meanChecked}
                        setMeanChecked={setMeanChecked}
                        medianChecked={medianChecked}
                        setMedianChecked={setMedianChecked}
                        modeChecked={modeChecked}
                        setModeChecked={setModeChecked}
                        sumChecked={sumChecked}
                        setSumChecked={setSumChecked}
                        stdDevChecked={stdDevChecked}
                        setStdDevChecked={setStdDevChecked}
                        varianceChecked={varianceChecked}
                        setVarianceChecked={setVarianceChecked}
                        rangeChecked={rangeChecked}
                        setRangeChecked={setRangeChecked}
                        minChecked={minChecked}
                        setMinChecked={setMinChecked}
                        maxChecked={maxChecked}
                        setMaxChecked={setMaxChecked}
                        seMeanChecked={seMeanChecked}
                        setSeMeanChecked={setSeMeanChecked}
                        skewnessChecked={skewnessChecked}
                        setSkewnessChecked={setSkewnessChecked}
                        kurtosisChecked={kurtosisChecked}
                        setKurtosisChecked={setKurtosisChecked}
                        containerType={containerType}
                    />
                </TabsContent>

                <TabsContent value="charts" className="p-6 overflow-y-auto flex-grow">
                    {activeTab === "charts" && (
                        <ChartsTab
                            showCharts={showCharts}
                            setShowCharts={setShowCharts}
                            chartType={chartType}
                            setChartType={setChartType}
                            chartValues={chartValues}
                            setChartValues={setChartValues}
                            showNormalCurve={showNormalCurve}
                            setShowNormalCurve={setShowNormalCurve}
                            containerType={containerType}
                        />
                    )}
                </TabsContent>
            </Tabs>

            {errorMsg && <div className="px-6 py-2 text-destructive">{errorMsg}</div>}

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                {/* Left: Help icon */}
                <div className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                    <HelpCircle size={18} className="mr-1" />
                </div>
                {/* Right: Buttons */}
                <div>
                    <Button
                        variant="outline"
                        className="mr-2"
                        onClick={handleReset}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="mr-2"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={runAnalysis}
                        disabled={isLoading || selectedVariables.length === 0}
                    >
                        {isLoading ? "Calculating..." : "OK"}
                    </Button>
                </div>
            </div>
        </>
    );
};

// Main component that conditionally renders either dialog or sidebar version
const Frequencies: FC<BaseModalProps> = ({ onClose, containerType = "dialog", ...props }) => {
    // Render based on containerType
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <FrequenciesContent onClose={onClose} containerType={containerType} {...props} />
                </div>
            </div>
        );
    }

    // Default dialog view
    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-xl p-0 bg-card border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold">Frequencies</DialogTitle>
                </DialogHeader>
                <div className="flex-grow flex flex-col overflow-hidden">
                    <FrequenciesContent onClose={onClose} containerType={containerType} {...props} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default Frequencies;