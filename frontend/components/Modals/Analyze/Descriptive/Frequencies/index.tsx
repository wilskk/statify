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
import { useFrequenciesAnalysis } from "@/hooks/useFrequenciesAnalysis";
import type { StatisticsOptions } from "@/types/Analysis";

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

    const [resetChartsCounter, setResetChartsCounter] = useState(0);

    const [showFrequencyTables, setShowFrequencyTables] = useState(true);
    const [showCharts, setShowCharts] = useState(false);
    const [showStatistics, setShowStatistics] = useState(true);

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

    const { isCalculating, errorMsg, runAnalysis } = useFrequenciesAnalysis({
        selectedVariables,
        showFrequencyTables,
        showStatistics,
        showCharts,
        statisticsOptions: getCurrentStatisticsOptions(),
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
        setShowStatistics(true);
        setShowCharts(false);

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
        setKurtosisChecked(false);
        setSkewnessChecked(false);

        setResetChartsCounter(prev => prev + 1);

        setHighlightedVariable(null);

        setActiveTab("variables");
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
                    />
                </TabsContent>

                <TabsContent value="charts" className="p-6 overflow-y-auto flex-grow">
                    <ChartsTab
                        showCharts={showCharts}
                        setShowCharts={setShowCharts}
                        resetCounter={resetChartsCounter}
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
                        {isCalculating ? "Calculating..." : "OK"}
                    </Button>
                    {/* <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        disabled={isCalculating}
                    >
                        Paste
                    </Button> */}
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

export default Index;