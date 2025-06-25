"use client";

import React, { FC, useState, useEffect, useCallback, useMemo } from "react";
import {
    Dialog,
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
import { useModalStore } from "@/stores/useModalStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import { Variable } from "@/types/Variable";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    HelpCircle
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { TourPopup } from "@/components/Common/TourComponents";
import { useTourGuide, TabControlProps } from './hooks/useTourGuide';
import { IdentifyUnusualCasesProps, VariablesTabProps, SaveTabProps, OptionsTabProps, OutputTabProps, MissingValuesTabProps, TabType } from "./types";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Import tab components
import VariablesTab from "./VariablesTab";
import OptionsTab from "./OptionsTab";
import OutputTab from "./OutputTab";
import SaveTab from "./SaveTab";
import MissingValuesTab from "./MissingValuesTab";

// Content component separated from container logic
const UnusualCasesContent: FC<IdentifyUnusualCasesProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    const { closeModal } = useModalStore();
    const { variables, addVariable } = useVariableStore();
    const { data, updateCells, setData } = useDataStore();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    // --- Simplified State ---
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [analysisVariables, setAnalysisVariables] = useState<Variable[]>([]);
    const [caseIdentifierVariable, setCaseIdentifierVariable] = useState<Variable | null>(null);
    const [highlightedVariable, setHighlightedVariable] = useState<{tempId: string, source: 'available' | 'analysis' | 'identifier'} | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>("variables");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showUnusualCasesList, setShowUnusualCasesList] = useState(true);
    const [peerGroupNorms, setPeerGroupNorms] = useState(true);
    const [anomalyIndices, setAnomalyIndices] = useState(true);
    const [reasonOccurrence, setReasonOccurrence] = useState(true);
    const [caseProcessed, setCaseProcessed] = useState(true);
    const [saveAnomalyIndex, setSaveAnomalyIndex] = useState(false);
    const [anomalyIndexName, setAnomalyIndexName] = useState("AnomalyIndex");
    const [replaceExisting, setReplaceExisting] = useState(false);
    const [identificationCriteria, setIdentificationCriteria] = useState("percentage");
    const [percentageValue, setPercentageValue] = useState("5");
    const [fixedNumber, setFixedNumber] = useState("");
    const [useMinimumValue, setUseMinimumValue] = useState(true);
    const [cutoffValue, setCutoffValue] = useState("2");
    const [missingValuesOption, setMissingValuesOption] = useState("exclude");
    const [useProportionMissing, setUseProportionMissing] = useState(false);

    // --- Tour and Tab Control ---
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

    // --- Update Available Variables ---
    useEffect(() => {
        const validVars = variables.filter(v => v.name !== "").map((v, i) => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}_${i}`
        }));
        const analysisTempIds = new Set(analysisVariables.map(v => v.tempId));
        const identifierTempId = caseIdentifierVariable?.tempId;

        const finalAvailable = validVars.filter(v =>
            v.tempId &&
            !analysisTempIds.has(v.tempId) &&
            (!identifierTempId || v.tempId !== identifierTempId)
        ).sort((a, b) => a.columnIndex - b.columnIndex);
        setAvailableVariables(finalAvailable);
    }, [variables, analysisVariables, caseIdentifierVariable]);

    // --- Variable Movement Logic ---
    const moveToAnalysisVariables = useCallback((variable: Variable, targetIndex?: number) => {
        if (!variable.tempId) return;
        setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setAnalysisVariables(prev => {
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

    const moveToCaseIdentifierVariable = useCallback((variable: Variable) => {
        if (!variable.tempId) return;
        if (caseIdentifierVariable && caseIdentifierVariable.tempId) {
            setAvailableVariables(prev => {
                 if (!prev.some(v => v.tempId === caseIdentifierVariable.tempId)) {
                     const newList = [...prev, caseIdentifierVariable];
                     newList.sort((a, b) => a.columnIndex - b.columnIndex);
                     return newList;
                 }
                 return prev;
            });
        }
        setCaseIdentifierVariable(variable);
        setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setHighlightedVariable(null);
    }, [caseIdentifierVariable]);

    const moveToAvailableVariables = useCallback((variable: Variable, source: 'analysis' | 'identifier', targetIndex?: number) => {
        if (!variable.tempId) return;
        if (source === 'analysis') {
            setAnalysisVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (source === 'identifier') {
            setCaseIdentifierVariable(null);
        }

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

    const reorderVariables = useCallback((source: 'analysis', reorderedList: Variable[]) => {
         if (source === 'analysis') {
             setAnalysisVariables([...reorderedList]);
         }
    }, []);

     const getDisplayName = (variable: Variable): string => {
         if (variable.label) {
             return `${variable.label} [${variable.name}]`;
         }
         return variable.name;
     };

     const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        }
    };
    
    const handleReset = () => {
        setAnalysisVariables([]);
        setCaseIdentifierVariable(null);
        setActiveTab("variables");
        setErrorMsg(null);
        setSaveAnomalyIndex(false);
        setAnomalyIndexName("AnomalyIndex");
        setReplaceExisting(false);
        setIdentificationCriteria("percentage");
        setPercentageValue("5");
        setFixedNumber("");
        setUseMinimumValue(true);
        setCutoffValue("2");
        setMissingValuesOption("exclude");
        setUseProportionMissing(false);
        setShowUnusualCasesList(true);
        setPeerGroupNorms(true);
        setAnomalyIndices(true);
        setReasonOccurrence(true);
        setCaseProcessed(true);
    };

    const handleConfirm = async () => {
        // Placeholder for future logic
        console.log("Confirmed");
        onClose();
    };

    // --- Simplified Props for each tab ---
    const variablesTabProps: VariablesTabProps = { availableVariables, analysisVariables, caseIdentifierVariable, highlightedVariable, setHighlightedVariable, moveToAnalysisVariables, moveToCaseIdentifierVariable, moveToAvailableVariables, reorderVariables, errorMsg, getVariableIcon, getDisplayName, tourActive, currentStep, tourSteps };
    const optionsTabProps: OptionsTabProps = { identificationCriteria, setIdentificationCriteria, percentageValue, setPercentageValue, fixedNumber, setFixedNumber, useMinimumValue, setUseMinimumValue, cutoffValue, setCutoffValue, tourActive, currentStep, tourSteps };
    const outputTabProps: OutputTabProps = { showUnusualCasesList, setShowUnusualCasesList, peerGroupNorms, setPeerGroupNorms, anomalyIndices, setAnomalyIndices, reasonOccurrence, setReasonOccurrence, caseProcessed, setCaseProcessed, tourActive, currentStep, tourSteps };
    const saveTabProps: SaveTabProps = { saveAnomalyIndex, setSaveAnomalyIndex, anomalyIndexName, setAnomalyIndexName, replaceExisting, setReplaceExisting, tourActive, currentStep, tourSteps };
    const missingValuesTabProps: MissingValuesTabProps = { missingValuesOption, setMissingValuesOption, useProportionMissing, setUseProportionMissing, tourActive, currentStep, tourSteps };

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
                        <TabsContent value="variables" className="p-4">
                            <VariablesTab {...variablesTabProps} />
                        </TabsContent>
                        <TabsContent value="options" className="p-4">
                            <OptionsTab {...optionsTabProps} />
                        </TabsContent>
                        <TabsContent value="output" className="p-4">
                            <OutputTab {...outputTabProps} />
                        </TabsContent>
                        <TabsContent value="save" className="p-4">
                            <SaveTab {...saveTabProps} />
                        </TabsContent>
                        <TabsContent value="missing" className="p-4">
                            <MissingValuesTab {...missingValuesTabProps} />
                        </TabsContent>
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
                            <TooltipContent>
                                <p>Start Guided Tour</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <div>
                        <Button variant="outline" className="mr-2" onClick={handleReset}>Reset</Button>
                        <Button variant="outline" className="mr-2" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleConfirm}>OK</Button>
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