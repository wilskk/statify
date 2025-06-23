"use client";

import React, { FC, useState, useCallback, useEffect, useMemo } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useVariableSelection } from "./hooks/useVariableSelection";
import { useStatisticsSettings } from "./hooks/useStatisticsSettings";
import { useDescriptivesAnalysis } from "./hooks/useDescriptivesAnalysis";
import { BaseModalProps } from "@/types/modalTypes";
import { useTourGuide } from "./hooks/useTourGuide";
import { TourPopup, ActiveElementHighlight } from "@/components/Common/TourComponents";
import { AnimatePresence } from "framer-motion";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

import VariablesTab from "./components/VariablesTab";
import StatisticsTab from "./components/StatisticsTab";
import { TabControlProps } from "./hooks/useTourGuide";

// Komponen utama konten Descriptives yang agnostik terhadap container
const DescriptiveContent: FC<BaseModalProps> = ({ onClose, containerType = "dialog" }) => {
    const [activeTab, setActiveTab] = useState<"variables" | "statistics">("variables");
    
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
        displayStatistics,
        updateStatistic,
        displayOrder,
        setDisplayOrder,
        saveStandardized,
        setSaveStandardized,
        resetStatisticsSettings
    } = useStatisticsSettings();

    const { 
        isCalculating,
        error: errorMsg, 
        runAnalysis,
        cancelCalculation
    } = useDescriptivesAnalysis({
        selectedVariables,
        displayStatistics,
        saveStandardized,
        displayOrder,
        onClose
    });

    // Add tour hook
    const tabControl = useMemo((): TabControlProps => ({
        setActiveTab: (tab: 'variables' | 'statistics') => {
            setActiveTab(tab);
        },
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

    const handleReset = useCallback(() => {
        resetVariableSelection();
        resetStatisticsSettings();
        cancelCalculation();
    }, [resetVariableSelection, resetStatisticsSettings, cancelCalculation]);

    const handleTabChange = useCallback((value: string) => {
        if (value === 'variables' || value === 'statistics') {
            setActiveTab(value);
        }
    }, [setActiveTab]);

    useEffect(() => {
        return () => {
            cancelCalculation();
        };
    }, [cancelCalculation]);

    return (
        <>
            {/* Add tour popup */}
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
                    <TabsList>
                        <TabsTrigger value="variables">Variables</TabsTrigger>
                        <TabsTrigger 
                            id="descriptive-statistics-tab-trigger"
                            value="statistics"
                        >
                            Statistics
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
                        saveStandardized={saveStandardized}
                        setSaveStandardized={setSaveStandardized}
                        tourActive={tourActive}
                        currentStep={currentStep}
                        tourSteps={tourSteps}
                    />
                </TabsContent>

                <TabsContent value="statistics" className="p-6 overflow-y-auto flex-grow">
                    <StatisticsTab
                        displayStatistics={displayStatistics}
                        updateStatistic={updateStatistic}
                        displayOrder={displayOrder}
                        setDisplayOrder={setDisplayOrder}
                        tourActive={tourActive}
                        currentStep={currentStep}
                        tourSteps={tourSteps}
                    />
                </TabsContent>
            </Tabs>

            {errorMsg && <div className="px-6 py-2 text-destructive">{errorMsg}</div>}

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                {/* Left: Help/Tour button with tooltip */}
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
                
                {/* Right: Buttons */}
                <div>
                    <Button
                        variant="outline"
                        className="mr-2"
                        onClick={handleReset}
                        disabled={isCalculating}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="mr-2"
                        onClick={onClose}
                        disabled={isCalculating}
                    >
                        Cancel
                    </Button>
                    <Button
                        id="descriptive-ok-button"
                        onClick={runAnalysis}
                        disabled={isCalculating || selectedVariables.length === 0}
                    >
                        {isCalculating ? "Processing..." : "OK"}
                    </Button>
                </div>
            </div>
        </>
    );
};

// Komponen Descriptives yang menjadi titik masuk utama
const Descriptives: FC<BaseModalProps> = ({ onClose, containerType = "dialog", ...props }) => {
    // Render berdasarkan containerType
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <DescriptiveContent onClose={onClose} containerType={containerType} {...props} />
                </div>
            </div>
        );
    }

    // Default dialog view with proper Dialog components
    return (
        <DialogContent className="max-w-[600px] p-0 bg-popover text-popover-foreground border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Descriptives</DialogTitle>
            </DialogHeader>

            <div className="flex-grow flex flex-col overflow-hidden">
                <DescriptiveContent onClose={onClose} containerType={containerType} {...props} />
            </div>
        </DialogContent>
    );
}

export default Descriptives;
export { DescriptiveContent };