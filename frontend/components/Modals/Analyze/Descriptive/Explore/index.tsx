"use client";
import React, { useState, FC, useMemo } from "react";
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
import { BaseModalProps } from "@/types/modalTypes";
import { HelpCircle } from "lucide-react";
import { AnimatePresence } from "framer-motion";

// Tour guide
import { useTourGuide, TabType, TabControlProps } from "./hooks/useTourGuide";
import { TourPopup } from "@/components/Common/TourComponents";

// State Management Hooks
import { useVariableManagement } from "./hooks/useVariableManagement";
import { useStatisticsSettings } from "./hooks/useStatisticsSettings";
import { usePlotsSettings } from "./hooks/usePlotsSettings";
import { useExploreAnalysis } from "./hooks/useExploreAnalysis";

// Child Components
import VariablesTab from "./VariablesTab";
import StatisticsTab from "./StatisticsTab";
import PlotsTab from "./PlotsTab";

// Main content component that's agnostic of container type
const ExploreContent: FC<BaseModalProps> = ({ onClose, containerType = "dialog" }) => {
    const [activeTab, setActiveTab] = useState<TabType>("variables");

    // State Hooks
    const variableManager = useVariableManagement();
    const statisticsSettings = useStatisticsSettings();
    const plotsSettings = usePlotsSettings();

    // Analysis Hook
    const analysisParams = {
        dependentVariables: variableManager.dependentVariables,
        factorVariables: variableManager.factorVariables,
        labelVariable: variableManager.labelVariable,
        ...statisticsSettings,
        ...plotsSettings,
    };
    const { runAnalysis, isCalculating, error } = useExploreAnalysis(analysisParams, onClose);

    // Tour guide setup
    const tabControl = useMemo((): TabControlProps => ({
        setActiveTab,
        currentActiveTab: activeTab,
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

    const handleExplore = async () => {
        // Validation is now inside the hook, but we can keep a client-side check
        if (variableManager.dependentVariables.length === 0) {
            // The hook will set its own error, but this provides immediate feedback
            // by switching the tab.
            setActiveTab("variables");
        }
        await runAnalysis();
    };
    
    const handleReset = () => {
        variableManager.resetVariableSelections();
        statisticsSettings.resetStatisticsSettings();
        plotsSettings.resetPlotsSettings();
        // error state is managed by analysis hook, might need a resetter there too
        setActiveTab("variables");
    };

    const displayError = useMemo(() => {
        if (error) return error;
        if (variableManager.dependentVariables.length === 0 && isCalculating) {
             return "Please select at least one dependent variable.";
        }
        return null;
    }, [error, isCalculating, variableManager.dependentVariables]);

    return (
        <>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-border flex-shrink-0">
                    <TabsList>
                        <TabsTrigger value="variables" id="explore-variables-tab-trigger">Variables</TabsTrigger>
                        <TabsTrigger value="statistics" id="explore-statistics-tab-trigger">Statistics</TabsTrigger>
                        <TabsTrigger value="plots" id="explore-plots-tab-trigger">Plots</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <VariablesTab
                        {...variableManager}
                        errorMsg={displayError}
                        containerType={containerType}
                        tourActive={tourActive}
                        currentStep={currentStep}
                        tourSteps={tourSteps}
                    />
                </TabsContent>

                <TabsContent value="statistics" className="p-6 overflow-y-auto flex-grow">
                    <StatisticsTab
                        {...statisticsSettings}
                        containerType={containerType}
                        tourActive={tourActive}
                        currentStep={currentStep}
                        tourSteps={tourSteps}
                    />
                </TabsContent>

                <TabsContent value="plots" className="p-6 overflow-y-auto flex-grow">
                    <PlotsTab
                        {...plotsSettings}
                        factorVariablesCount={variableManager.factorVariables.length}
                        containerType={containerType}
                        tourActive={tourActive}
                        currentStep={currentStep}
                        tourSteps={tourSteps}
                    />
                </TabsContent>
            </Tabs>

            {displayError && (
                <div className="px-6 py-2 text-sm text-destructive bg-destructive/10 border-t border-destructive/20">
                    {displayError}
                </div>
            )}

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                    <Button variant="ghost" size="icon" onClick={startTour} className="h-8 w-8">
                        <HelpCircle size={18} />
                    </Button>
                </div>
                <div>
                    <Button variant="outline" className="mr-2" onClick={handleReset} disabled={isCalculating}>
                        Reset
                    </Button>
                    <Button variant="outline" className="mr-2" onClick={onClose} disabled={isCalculating}>
                        Cancel
                    </Button>
                    <Button onClick={handleExplore} disabled={isCalculating || variableManager.dependentVariables.length === 0}>
                        {isCalculating ? "Processing..." : "OK"}
                    </Button>
                </div>
            </div>
            <AnimatePresence>
                {tourActive && currentTargetElement && (
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
        </>
    );
};

// Main component that handles different container types
const Explore: FC<BaseModalProps> = ({ onClose, containerType = "dialog", ...props }) => {
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <ExploreContent onClose={onClose} containerType={containerType} {...props} />
                </div>
            </div>
        );
    }

    return (
        <DialogContent className="max-w-3xl p-0 bg-popover text-popover-foreground border border-border shadow-md rounded-md flex flex-col max-h-[90vh]">
            <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                <DialogTitle className="text-xl font-semibold">Explore</DialogTitle>
            </DialogHeader>

            <div className="flex-grow flex flex-col overflow-hidden">
                <ExploreContent onClose={onClose} containerType={containerType} {...props} />
            </div>
        </DialogContent>
    );
};

export default Explore;