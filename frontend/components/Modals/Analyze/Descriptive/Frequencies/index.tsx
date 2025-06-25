"use client";
import React, { FC, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
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
import { HelpCircle } from "lucide-react";
import { BaseModalProps } from "@/types/modalTypes";
import { useTourGuide, TabControlProps } from "./hooks/useTourGuide";
import { TourPopup } from "@/components/Common/TourComponents";
import { AnimatePresence } from "framer-motion";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
    useVariableSelection,
    useStatisticsSettings,
    useChartsSettings,
    useDisplaySettings,
    useFrequenciesAnalysis
} from './hooks';

import VariablesTab from "./VariablesTab";
import StatisticsTab from "./StatisticsTab";
import ChartsTab from "./ChartsTab";

const FrequenciesContent: FC<BaseModalProps> = ({
    onClose,
    containerType = "dialog",
}) => {
    // State management via custom hooks
    const [activeTab, setActiveTab] = React.useState<'variables' | 'statistics' | 'charts'>("variables");
    
    const variableSelection = useVariableSelection();
    const statisticsSettings = useStatisticsSettings();
    const chartsSettings = useChartsSettings();
    const displaySettings = useDisplaySettings();

    // Tour guide setup
    const tabControl = useMemo((): TabControlProps => ({
        setActiveTab,
        currentActiveTab: activeTab
    }), [activeTab]);

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

    // Analysis hook
    const { isLoading, errorMsg, runAnalysis, cancelAnalysis } = useFrequenciesAnalysis({
        selectedVariables: variableSelection.selectedVariables,
        showFrequencyTables: displaySettings.showFrequencyTables,
        showStatistics: statisticsSettings.showStatistics,
        showCharts: chartsSettings.showCharts,
        statisticsOptions: statisticsSettings.getCurrentStatisticsOptions(),
        chartOptions: chartsSettings.getCurrentChartOptions(),
        onClose
    });

    // Reset all settings
    const handleReset = useCallback(() => {
        variableSelection.resetVariableSelection();
        statisticsSettings.resetStatisticsSettings();
        chartsSettings.resetChartsSettings();
        displaySettings.resetDisplaySettings();
        if (cancelAnalysis) {
            cancelAnalysis();
        }
    }, [variableSelection, statisticsSettings, chartsSettings, displaySettings, cancelAnalysis]);

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

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'variables' | 'statistics' | 'charts')} className="w-full flex flex-col flex-grow overflow-hidden">
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
                        variableSelection={variableSelection}
                        displaySettings={displaySettings}
                        containerType={containerType}
                        tourActive={tourActive}
                        currentStep={currentStep}
                        tourSteps={tourSteps}
                    />
                </TabsContent>

                <TabsContent value="statistics" className="p-6 overflow-y-auto flex-grow">
                    <StatisticsTab
                        settings={statisticsSettings}
                        containerType={containerType}
                        tourActive={tourActive}
                        currentStep={currentStep}
                        tourSteps={tourSteps}
                    />
                </TabsContent>

                <TabsContent value="charts" className="p-6 overflow-y-auto flex-grow">
                    {activeTab === "charts" && (
                        <ChartsTab
                            settings={chartsSettings}
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
                        disabled={isLoading || variableSelection.selectedVariables.length === 0}
                    >
                        {isLoading ? "Calculating..." : "OK"}
                    </Button>
                </div>
            </div>
        </>
    );
};

const Frequencies: FC<BaseModalProps> = ({ onClose, containerType = "dialog", ...props }) => {
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <FrequenciesContent onClose={onClose} containerType={containerType} {...props} />
                </div>
            </div>
        );
    }

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