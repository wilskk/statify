"use client";

import React, { FC, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Variable } from "@/types/Variable";
import { Shapes, Ruler, BarChartHorizontal, HelpCircle } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TourPopup } from "@/components/Common/TourComponents";

import { useTourGuide, TabControlProps } from './hooks/useTourGuide';
import { useUnusualCases } from "./hooks/useUnusualCases";
import { baseTourSteps } from './tourConfig';
import { IdentifyUnusualCasesProps, TabType, VariablesTabProps, OptionsTabProps, OutputTabProps, SaveTabProps, MissingValuesTabProps } from "./types";

import VariablesTab from "./VariablesTab";
import OptionsTab from "./OptionsTab";
import OutputTab from "./OutputTab";
import SaveTab from "./SaveTab";
import MissingValuesTab from "./MissingValuesTab";

const getVariableIcon = (variable: Variable) => {
    switch (variable.measure) {
        case "scale": return <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        case "nominal": return <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        case "ordinal": return <BarChartHorizontal size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        default: return variable.type === "STRING"
            ? <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
            : <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
    }
};

const getDisplayName = (variable: Variable): string => {
    return variable.label ? `${variable.label} [${variable.name}]` : variable.name;
};

const UnusualCasesContent: FC<IdentifyUnusualCasesProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    const [activeTab, setActiveTab] = useState<TabType>("variables");
    const hookProps = useUnusualCases({ onClose });

    const tabControl = useMemo((): TabControlProps => ({
        setActiveTab: (newTab) => setActiveTab(newTab as TabType),
        currentActiveTab: activeTab,
    }), [activeTab]);

    const { 
        tourActive, currentStep, tourSteps, currentTargetElement, 
        startTour, nextStep, prevStep, endTour 
    } = useTourGuide(baseTourSteps, containerType, tabControl);

    const variablesTabProps: VariablesTabProps = { ...hookProps, getVariableIcon, getDisplayName, tourActive, currentStep, tourSteps };
    const optionsTabProps: OptionsTabProps = { ...hookProps, tourActive, currentStep, tourSteps };
    const outputTabProps: OutputTabProps = { ...hookProps, tourActive, currentStep, tourSteps };
    const saveTabProps: SaveTabProps = { ...hookProps, tourActive, currentStep, tourSteps };
    const missingValuesTabProps: MissingValuesTabProps = { ...hookProps, tourActive, currentStep, tourSteps };

    return (
        <>
            <div className={`flex flex-col ${containerType === "sidebar" ? "h-full" : "max-h-[85vh]"} overflow-hidden`}>
                {containerType === "dialog" && (
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle className="text-xl font-semibold">Identify Unusual Cases</DialogTitle>
                    </DialogHeader>
                )}

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="flex-grow flex flex-col">
                    <div className="border-b">
                        <TabsList className="bg-muted rounded-none h-9 p-0">
                            <TabsTrigger id="variables-tab-trigger" value="variables" className="px-3 h-8 rounded-none text-xs">Variables</TabsTrigger>
                            <TabsTrigger id="options-tab-trigger" value="options" className="px-3 h-8 rounded-none text-xs">Options</TabsTrigger>
                            <TabsTrigger id="output-tab-trigger" value="output" className="px-3 h-8 rounded-none text-xs">Output</TabsTrigger>
                            <TabsTrigger id="save-tab-trigger" value="save" className="px-3 h-8 rounded-none text-xs">Save</TabsTrigger>
                            <TabsTrigger id="missing-tab-trigger" value="missing" className="px-3 h-8 rounded-none text-xs">Missing Values</TabsTrigger>
                        </TabsList>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto">
                        <TabsContent value="variables" className="p-4"><VariablesTab {...variablesTabProps} /></TabsContent>
                        <TabsContent value="options" className="p-4"><OptionsTab {...optionsTabProps} /></TabsContent>
                        <TabsContent value="output" className="p-4"><OutputTab {...outputTabProps} /></TabsContent>
                        <TabsContent value="save" className="p-4"><SaveTab {...saveTabProps} /></TabsContent>
                        <TabsContent value="missing" className="p-4"><MissingValuesTab {...missingValuesTabProps} /></TabsContent>
                    </div>
                </Tabs>

                <DialogFooter className="px-6 py-3 border-t flex items-center justify-between bg-secondary flex-shrink-0">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={startTour} className="text-muted-foreground hover:text-foreground">
                                    <HelpCircle size={18} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Start Guided Tour</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <div>
                        <Button variant="outline" className="mr-2" onClick={hookProps.handleReset}>Reset</Button>
                        <Button variant="outline" className="mr-2" onClick={onClose}>Cancel</Button>
                        <Button onClick={hookProps.handleConfirm}>OK</Button>
                    </div>
                </DialogFooter>
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

const IdentifyUnusualCases: FC<IdentifyUnusualCasesProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <UnusualCasesContent onClose={onClose} containerType={containerType} />
                </div>
            </div>
        );
    }

    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-4xl w-full p-0 flex flex-col">
                <UnusualCasesContent onClose={onClose} containerType={containerType} />
            </DialogContent>
        </Dialog>
    );
};

export default IdentifyUnusualCases;