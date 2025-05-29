"use client";
import React, { useState, FC, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    DialogContent,
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
import { BaseModalProps } from "@/types/modalTypes";

import VariablesTab from "./VariablesTab";
import StatisticsTab from "./StatisticsTab";
import ChartsTab from "./ChartsTab";

// Simple hook for managing the frequency tables option
const useFrequencyTablesOption = (initialValue = true) => {
    const [showFrequencyTables, setShowFrequencyTables] = useState(initialValue);
    return { showFrequencyTables, setShowFrequencyTables };
};

// Main content component that's agnostic of container type
const FrequenciesContent: FC<BaseModalProps> = ({ onClose, containerType = "dialog", ...props }) => {
    const [activeTab, setActiveTab] = useState<string>("variables");
    const { showFrequencyTables, setShowFrequencyTables } = useFrequencyTablesOption(true);

    // Use the variable selection hook
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

    // Use the statistics settings hook
    const statisticsSettings = useStatisticsSettings();
    
    // Use the charts settings hook
    const chartsSettings = useChartsSettings();

    // Use the frequencies analysis hook
    const {
        isLoading,
        errorMsg,
        runAnalysis,
        cancelAnalysis
    } = useFrequenciesAnalysis({
        selectedVariables,
        showFrequencyTables,
        showStatistics: statisticsSettings.showStatistics,
        statisticsOptions: statisticsSettings.getCurrentStatisticsOptions(),
        showCharts: chartsSettings.showCharts,
        chartOptions: chartsSettings.getCurrentChartOptions(),
        onClose
    });

    const handleTabChange = useCallback((value: string) => {
        setActiveTab(value);
    }, []);

    const handleReset = useCallback(() => {
        resetVariableSelection();
        statisticsSettings.resetStatisticsSettings();
        chartsSettings.resetChartsSettings();
        setShowFrequencyTables(true);
        cancelAnalysis();
    }, [
        resetVariableSelection,
        statisticsSettings.resetStatisticsSettings,
        chartsSettings.resetChartsSettings,
        setShowFrequencyTables,
        cancelAnalysis
    ]);

    useEffect(() => {
        return () => {
            cancelAnalysis();
        };
    }, [cancelAnalysis]);

    return (
        <>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-grow flex flex-col overflow-hidden">
                <div className="border-b border-border flex-shrink-0">
                    <TabsList>
                        <TabsTrigger value="variables">Variables</TabsTrigger>
                        <TabsTrigger value="statistics">Statistics</TabsTrigger>
                        <TabsTrigger value="charts">Charts</TabsTrigger>
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
                        showStatistics={statisticsSettings.showStatistics}
                        setShowStatistics={statisticsSettings.setShowStatistics}
                        quartilesChecked={statisticsSettings.quartilesChecked}
                        setQuartilesChecked={statisticsSettings.setQuartilesChecked}
                        cutPointsChecked={statisticsSettings.cutPointsChecked}
                        setCutPointsChecked={statisticsSettings.setCutPointsChecked}
                        cutPointsValue={statisticsSettings.cutPointsValue}
                        setCutPointsValue={statisticsSettings.setCutPointsValue}
                        enablePercentiles={statisticsSettings.enablePercentiles}
                        setEnablePercentiles={statisticsSettings.setEnablePercentiles}
                        percentileValues={statisticsSettings.percentileValues}
                        setPercentileValues={statisticsSettings.setPercentileValues}
                        currentPercentileInput={statisticsSettings.currentPercentileInput}
                        setCurrentPercentileInput={statisticsSettings.setCurrentPercentileInput}
                        selectedPercentileItem={statisticsSettings.selectedPercentileItem}
                        setSelectedPercentileItem={statisticsSettings.setSelectedPercentileItem}
                        meanChecked={statisticsSettings.meanChecked}
                        setMeanChecked={statisticsSettings.setMeanChecked}
                        medianChecked={statisticsSettings.medianChecked}
                        setMedianChecked={statisticsSettings.setMedianChecked}
                        modeChecked={statisticsSettings.modeChecked}
                        setModeChecked={statisticsSettings.setModeChecked}
                        sumChecked={statisticsSettings.sumChecked}
                        setSumChecked={statisticsSettings.setSumChecked}
                        stdDevChecked={statisticsSettings.stdDevChecked}
                        setStdDevChecked={statisticsSettings.setStdDevChecked}
                        varianceChecked={statisticsSettings.varianceChecked}
                        setVarianceChecked={statisticsSettings.setVarianceChecked}
                        rangeChecked={statisticsSettings.rangeChecked}
                        setRangeChecked={statisticsSettings.setRangeChecked}
                        minChecked={statisticsSettings.minChecked}
                        setMinChecked={statisticsSettings.setMinChecked}
                        maxChecked={statisticsSettings.maxChecked}
                        setMaxChecked={statisticsSettings.setMaxChecked}
                        seMeanChecked={statisticsSettings.seMeanChecked}
                        setSeMeanChecked={statisticsSettings.setSeMeanChecked}
                        skewnessChecked={statisticsSettings.skewnessChecked}
                        setSkewnessChecked={statisticsSettings.setSkewnessChecked}
                        kurtosisChecked={statisticsSettings.kurtosisChecked}
                        setKurtosisChecked={statisticsSettings.setKurtosisChecked}
                        containerType={containerType}
                    />
                </TabsContent>

                <TabsContent value="charts" className="p-6 overflow-y-auto flex-grow">
                    <ChartsTab
                        showCharts={chartsSettings.showCharts}
                        setShowCharts={chartsSettings.setShowCharts}
                        chartType={chartsSettings.chartType}
                        setChartType={chartsSettings.setChartType}
                        chartValues={chartsSettings.chartValues}
                        setChartValues={chartsSettings.setChartValues}
                        showNormalCurve={chartsSettings.showNormalCurve}
                        setShowNormalCurve={chartsSettings.setShowNormalCurve}
                        containerType={containerType}
                    />
                </TabsContent>
            </Tabs>

            {errorMsg && <div className="px-6 py-2 text-destructive">{errorMsg}</div>}

            <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        onClick={runAnalysis}
                        disabled={isLoading}
                    >
                        {isLoading ? "Processing..." : "OK"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={isLoading}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        disabled={isLoading}
                    >
                        Help
                    </Button>
                </div>
            </div>
        </>
    );
};

// Main component that handles different container types
const Frequencies: FC<BaseModalProps> = ({ onClose, containerType = "dialog", ...props }) => {
    // If sidebar mode, use a div container
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <FrequenciesContent onClose={onClose} containerType={containerType} {...props} />
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent
    return (
        <DialogContent className="max-w-[600px] p-0 bg-popover text-popover-foreground border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Frequencies</DialogTitle>
            </DialogHeader>

            <div className="flex-grow flex flex-col overflow-hidden">
                <FrequenciesContent onClose={onClose} containerType={containerType} {...props} />
            </div>
        </DialogContent>
    );
};

export default Frequencies;