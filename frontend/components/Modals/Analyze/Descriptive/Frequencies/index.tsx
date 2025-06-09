"use client";
import React, { useState, useEffect, FC, useCallback, useMemo, useReducer, Dispatch, SetStateAction } from "react";
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
import { useTourGuide } from "./hooks/useTourGuide";
import { TourPopup, ActiveElementHighlight } from "@/components/Common/TourComponents";
import { AnimatePresence } from "framer-motion";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

import VariablesTab from "./VariablesTab";
import StatisticsTab from "./StatisticsTab";
import ChartsTab from "./ChartsTab";
import { TabControlProps } from "./hooks/useTourGuide";

// Extend the Props to include a forcedTab for tour use
interface FrequenciesContentProps extends BaseModalProps {
    forcedTab?: 'variables' | 'statistics' | 'charts';
}

// FrequenciesContent component to be reused in both dialog and sidebar containers
const FrequenciesContent: FC<FrequenciesContentProps> = ({ 
    onClose, 
    containerType = "dialog", 
    forcedTab 
}) => {
    // State management
    const [localActiveTab, setLocalActiveTab] = useState<'variables' | 'statistics' | 'charts'>("variables");
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<{tempId: string, source: 'available' | 'selected'} | null>(null);
    const [resetChartsCounter, setResetChartsCounter] = useState(0);
    
    // Display options
    const [showFrequencyTables, setShowFrequencyTables] = useState(true);
    const [showCharts, setShowCharts] = useState(false);
    const [showStatistics, setShowStatistics] = useState(true);
    
    // Chart options
    const [chartType, setChartType] = useState<"none" | "barCharts" | "pieCharts" | "histograms">("none");
    const [chartValues, setChartValues] = useState<"frequencies" | "percentages">("frequencies");
    const [showNormalCurve, setShowNormalCurve] = useState(false);
    
    // Statistics - percentile options
    const [quartilesChecked, setQuartilesChecked] = useState(false);
    const [cutPointsChecked, setCutPointsChecked] = useState(false);
    const [cutPointsValue, setCutPointsValue] = useState("10");
    const [enablePercentiles, setEnablePercentiles] = useState(false);
    const [percentileValues, setPercentileValues] = useState<string[]>([]);
    const [currentPercentileInput, setCurrentPercentileInput] = useState("");
    const [selectedPercentileItem, setSelectedPercentileItem] = useState<string | null>(null);
    
    // Statistics - central tendency options
    const [meanChecked, setMeanChecked] = useState(false);
    const [medianChecked, setMedianChecked] = useState(false);
    const [modeChecked, setModeChecked] = useState(false);
    const [sumChecked, setSumChecked] = useState(false);
    
    // Statistics - dispersion options
    const [stdDevChecked, setStdDevChecked] = useState(false);
    const [varianceChecked, setVarianceChecked] = useState(false);
    const [rangeChecked, setRangeChecked] = useState(false);
    const [minChecked, setMinChecked] = useState(false);
    const [maxChecked, setMaxChecked] = useState(false);
    const [seMeanChecked, setSeMeanChecked] = useState(false);
    
    // Statistics - distribution options
    const [skewnessChecked, setSkewnessChecked] = useState(false);
    const [kurtosisChecked, setKurtosisChecked] = useState(false);

    // Get variables from store
    const variables = useVariableStore(state => state.variables);

    // Computed activeTab value that respects forcedTab when present
    const activeTab = forcedTab || localActiveTab;
    
    // Update handler that only changes local state, not overriding forced value
    const handleTabChange = useCallback((value: string) => {
        setLocalActiveTab(value as 'variables' | 'statistics' | 'charts');
    }, []);
    
    // Tab control for tour
    const tabControl = useMemo((): TabControlProps => ({
        setActiveTab: (tab: 'variables' | 'statistics' | 'charts') => {
            setLocalActiveTab(tab);
        },
        currentActiveTab: activeTab as 'variables' | 'statistics' | 'charts'
    }), [activeTab]);
    
    // Use the enhanced tour hook with tab control
    const { 
        tourActive, 
        currentStep, 
        tourSteps, 
        currentTargetElement,
        startTour, 
        nextStep, 
        prevStep, 
        endTour 
    } = useTourGuide(containerType, tabControl);

    // Calculate statistics options based on current state
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

    // Calculate chart options based on current state
    const getCurrentChartOptions = useCallback((): ChartOptions | null => {
        if (!showCharts) return null;
        return {
            type: chartType === "none" ? null : chartType,
            values: chartValues,
            showNormalCurveOnHistogram: chartType === "histograms" ? showNormalCurve : false,
        };
    }, [showCharts, chartType, chartValues, showNormalCurve]);

    // Run the analysis
    const { isLoading, errorMsg, runAnalysis, cancelAnalysis } = useFrequenciesAnalysis({
        selectedVariables,
        showFrequencyTables,
        showStatistics,
        showCharts,
        statisticsOptions: getCurrentStatisticsOptions(),
        chartOptions: getCurrentChartOptions(),
        onClose
    });

    // Update available variables when variables or selected variables change
    useEffect(() => {
        const validVars = variables.filter(v => v.name !== "").map(v => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}`
        }));
        
        const selectedTempIds = new Set(selectedVariables.map(v => v.tempId));
        const finalAvailable = validVars.filter(v => v.tempId && !selectedTempIds.has(v.tempId));
        setAvailableVariables(finalAvailable);
    }, [variables, selectedVariables]);

    // Handle variable movement between lists
    const moveToSelectedVariables = useCallback((variable: Variable, targetIndex?: number) => {
        if (!variable.tempId) {
            console.error("Cannot move variable without tempId:", variable);
            return;
        }
        
        setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setSelectedVariables(prev => {
            if (prev.some(v => v.tempId === variable.tempId)) return prev;
            
            const newList = [...prev];
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variable);
            } else {
                newList.push(variable);
            }
            return newList;
        });
        
        setHighlightedVariable(null);
    }, []);

    const moveToAvailableVariables = useCallback((variable: Variable, targetIndex?: number) => {
        if (!variable.tempId) {
            console.error("Cannot move variable without tempId:", variable);
            return;
        }
        
        setSelectedVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setAvailableVariables(prev => {
            if (prev.some(v => v.tempId === variable.tempId)) return prev;
            
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
    }, []);

    // Handle variable list reordering
    const reorderVariables = useCallback((source: 'available' | 'selected', reorderedList: Variable[]) => {
        if (source === 'available') {
            setAvailableVariables([...reorderedList]);
        } else {
            setSelectedVariables([...reorderedList]);
        }
    }, []);

    // Reset all options and selections
    const handleReset = useCallback(() => {
        const allVars = [...availableVariables, ...selectedVariables].sort((a, b) => a.columnIndex - b.columnIndex);
        setAvailableVariables(allVars);
        setSelectedVariables([]);

        // Reset display options
        setShowFrequencyTables(true);
        setShowCharts(false);
        setShowStatistics(true);

        // Reset percentile options
        setQuartilesChecked(false);
        setCutPointsChecked(false);
        setCutPointsValue("10");
        setEnablePercentiles(false);
        setPercentileValues([]);
        setCurrentPercentileInput("");
        setSelectedPercentileItem(null);

        // Reset central tendency options
        setMeanChecked(false);
        setMedianChecked(false);
        setModeChecked(false);
        setSumChecked(false);

        // Reset dispersion options
        setStdDevChecked(false);
        setVarianceChecked(false);
        setRangeChecked(false);
        setMinChecked(false);
        setMaxChecked(false);
        setSeMeanChecked(false);

        // Reset distribution options
        setSkewnessChecked(false);
        setKurtosisChecked(false);
        
        // Reset chart options
        setChartType("none");
        setChartValues("frequencies");
        setShowNormalCurve(false);

        setResetChartsCounter(prev => prev + 1);

        if (cancelAnalysis) {
            cancelAnalysis();
        }
    }, [availableVariables, selectedVariables, cancelAnalysis]);

    // Cleanup when component unmounts
    useEffect(() => {
        return () => {
            if (cancelAnalysis) {
                cancelAnalysis();
            }
        };
    }, [cancelAnalysis]);

    // Create wrappers for set state functions to handle SetStateAction correctly
    const handleSetHighlightedVariable = useCallback((value: SetStateAction<{tempId: string, source: 'available' | 'selected'} | null>) => {
        if (typeof value === 'function') {
            setHighlightedVariable(current => value(current));
        } else {
            setHighlightedVariable(value);
        }
    }, []);

    const handleSetShowFrequencyTables = useCallback((value: SetStateAction<boolean>) => {
        if (typeof value === 'function') {
            setShowFrequencyTables(current => value(current));
        } else {
            setShowFrequencyTables(value);
        }
    }, []);

    const handleSetShowCharts = useCallback((value: SetStateAction<boolean>) => {
        if (typeof value === 'function') {
            setShowCharts(current => value(current));
        } else {
            setShowCharts(value);
        }
    }, []);

    const handleSetChartType = useCallback((value: SetStateAction<"none" | "barCharts" | "pieCharts" | "histograms">) => {
        if (typeof value === 'function') {
            setChartType(current => value(current));
        } else {
            setChartType(value);
        }
    }, []);

    const handleSetChartValues = useCallback((value: SetStateAction<"frequencies" | "percentages">) => {
        if (typeof value === 'function') {
            setChartValues(current => value(current));
        } else {
            setChartValues(value);
        }
    }, []);

    const handleSetShowNormalCurve = useCallback((value: SetStateAction<boolean>) => {
        if (typeof value === 'function') {
            setShowNormalCurve(current => value(current));
        } else {
            setShowNormalCurve(value);
        }
    }, []);

    return (
        <>
            {/* Tour popup */}
            <AnimatePresence>
                {tourActive && tourSteps.length > 0 && currentStep < tourSteps.length && (
                    <TourPopup
                        step={tourSteps[currentStep]}
                        currentStep={currentStep}
                        totalSteps={tourSteps.length}
                        onNext={nextStep}
                        onPrev={prevStep}
                        onClose={endTour}
                        targetElement={currentTargetElement}
                    />
                )}
            </AnimatePresence>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-border flex-shrink-0">
                    <TabsList className="bg-muted rounded-none h-9 p-0">
                        <TabsTrigger
                            value="variables"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'variables' ? 'bg-card border-t border-l border-r border-border' : ''}`}
                        >
                            Variables
                        </TabsTrigger>
                        <TabsTrigger
                            id="statistics-tab-trigger"
                            value="statistics"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'statistics' ? 'bg-card border-t border-l border-r border-border' : ''}`}
                        >
                            Statistics
                        </TabsTrigger>
                        <TabsTrigger
                            id="charts-tab-trigger"
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
                        setHighlightedVariable={handleSetHighlightedVariable}
                        moveToSelectedVariables={moveToSelectedVariables}
                        moveToAvailableVariables={moveToAvailableVariables}
                        reorderVariables={reorderVariables}
                        showFrequencyTables={showFrequencyTables}
                        setShowFrequencyTables={handleSetShowFrequencyTables}
                        containerType={containerType}
                        tourActive={tourActive}
                        currentStep={currentStep}
                        tourSteps={tourSteps}
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
                        tourActive={tourActive}
                        currentStep={currentStep}
                        tourSteps={tourSteps}
                    />
                </TabsContent>

                <TabsContent value="charts" className="p-6 overflow-y-auto flex-grow">
                    {activeTab === "charts" && (
                        <ChartsTab
                            showCharts={showCharts}
                            setShowCharts={handleSetShowCharts}
                            chartType={chartType}
                            setChartType={handleSetChartType}
                            chartValues={chartValues}
                            setChartValues={handleSetChartValues}
                            showNormalCurve={showNormalCurve}
                            setShowNormalCurve={handleSetShowNormalCurve}
                            containerType={containerType}
                            tourActive={tourActive}
                            currentStep={currentStep}
                            tourSteps={tourSteps}
                        />
                    )}
                </TabsContent>
            </Tabs>

            {errorMsg && <div className="px-6 py-2 text-destructive">{errorMsg}</div>}

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                {/* Tour button */}
                <div className="flex items-center text-muted-foreground">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={startTour}
                                    className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                                >
                                    <HelpCircle className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p className="text-xs">Start feature tour</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                
                {/* Action buttons */}
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
                        id="frequencies-ok-button"
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