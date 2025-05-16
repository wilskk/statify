"use client";
import React, { useState, FC, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
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
import { 
    useVariableSelection,
    useStatisticsSettings,
    useChartsSettings,
    useFrequenciesAnalysis
} from "./hooks";
import type { FrequenciesAnalysisParams } from "./types";

import VariablesTab from "./VariablesTab";
import StatisticsTab from "./StatisticsTab";
import ChartsTab from "./ChartsTab";

// Simple hook for managing the frequency tables option
const useFrequencyTablesOption = (initialValue = true) => {
    const [showFrequencyTables, setShowFrequencyTables] = useState(initialValue);
    return { showFrequencyTables, setShowFrequencyTables };
};

interface FrequenciesModalProps {
    onClose: () => void;
}

const Frequencies: FC<FrequenciesModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState("variables");

    // Use the custom hooks for state management
    const {
        availableVariables,
        selectedVariables,
        highlightedVariable,
        setHighlightedVariable,
        moveToSelectedVariables,
        moveToAvailableVariables,
        reorderVariables,
        resetVariableSelection
    } = useVariableSelection();

    const {
        showFrequencyTables,
        setShowFrequencyTables
    } = useFrequencyTablesOption();

    const {
        showStatistics,
        setShowStatistics,
        quartilesChecked,
        setQuartilesChecked,
        cutPointsChecked,
        setCutPointsChecked,
        cutPointsValue,
        setCutPointsValue,
        enablePercentiles,
        setEnablePercentiles,
        percentileValues,
        setPercentileValues,
        currentPercentileInput,
        setCurrentPercentileInput,
        selectedPercentileItem,
        setSelectedPercentileItem,
        meanChecked,
        setMeanChecked,
        medianChecked,
        setMedianChecked,
        modeChecked,
        setModeChecked,
        sumChecked,
        setSumChecked,
        stdDevChecked,
        setStdDevChecked,
        varianceChecked,
        setVarianceChecked,
        rangeChecked,
        setRangeChecked,
        minChecked,
        setMinChecked,
        maxChecked,
        setMaxChecked,
        seMeanChecked,
        setSeMeanChecked,
        skewnessChecked,
        setSkewnessChecked,
        kurtosisChecked,
        setKurtosisChecked,
        getCurrentStatisticsOptions,
        resetStatisticsSettings
    } = useStatisticsSettings();

    const {
        showCharts,
        setShowCharts,
        chartType,
        setChartType,
        chartValues,
        setChartValues,
        showNormalCurve,
        setShowNormalCurve,
        getCurrentChartOptions,
        resetChartsSettings
    } = useChartsSettings();

    // Build the analysis parameters
    const analysisParams: FrequenciesAnalysisParams = {
        selectedVariables,
        showFrequencyTables,
        showStatistics,
        statisticsOptions: getCurrentStatisticsOptions(),
        showCharts,
        chartOptions: getCurrentChartOptions(),
        onClose
    };

    const { 
        isLoading, 
        errorMsg, 
        runAnalysis, 
        cancelAnalysis 
    } = useFrequenciesAnalysis(analysisParams);

    const handleReset = useCallback(() => {
        resetVariableSelection();
        resetStatisticsSettings();
        resetChartsSettings();
        setShowFrequencyTables(true);
    }, [resetVariableSelection, resetStatisticsSettings, resetChartsSettings, setShowFrequencyTables]);

    return (
        <DialogContent className="max-w-xl p-0 bg-card border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                <DialogTitle className="text-xl font-semibold">Frequencies</DialogTitle>
            </DialogHeader>

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
                        <TabsTrigger
                            value="charts"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'charts' ? 'bg-card border-t border-l border-r border-border' : ''}`}
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
                        />
                    )}
                </TabsContent>
            </Tabs>

            {errorMsg && <div className="px-6 py-2 text-destructive">{errorMsg}</div>}

            <DialogFooter className="px-6 py-4 border-t border-border bg-muted flex-shrink-0 rounded-b-md">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4"
                        onClick={runAnalysis}
                        disabled={isLoading || selectedVariables.length === 0}
                    >
                        {isLoading ? "Calculating..." : "OK"}
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 px-4"
                        onClick={handleReset}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 px-4"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 px-4"
                        disabled={isLoading}
                    >
                        Help
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
};

export default Frequencies;