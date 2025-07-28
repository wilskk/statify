// index.tsx
"use client";
import React, { useState, useEffect, FC, useMemo } from "react";
import { saveFormData, clearFormData, getFormData } from "@/hooks/useIndexedDB";
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
import { HelpCircle } from "lucide-react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useResultStore } from "@/stores/useResultStore";
import { BaseModalProps } from "@/types/modalTypes";
import { 
    CrosstabsAnalysisParams,
    VariableHighlight, 
} from "./types";
import { useTourGuide, TabType, TabControlProps } from "./hooks/useTourGuide";
import { useCrosstabsAnalysis } from "./hooks/useCrosstabsAnalysis";
import { TourPopup, ActiveElementHighlight } from "@/components/Common/TourComponents";
import { AnimatePresence } from "framer-motion";

// Import tab components
import VariablesTab from "./VariablesTab";
import CellsTab from "./CellsTab";

// Types
import type { Variable } from "@/types/Variable";

// Main content component that's agnostic of container type
const CrosstabsContent: FC<BaseModalProps> = ({ onClose, containerType = "dialog" }) => {
    const [activeTab, setActiveTab] = useState<TabType>("variables");
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [rowVariables, setRowVariables] = useState<Variable[]>([]);
    const [columnVariables, setColumnVariables] = useState<Variable[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<VariableHighlight>(null);
    
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

    // State for all options, structured as needed by the analysis hook
    const [options, setOptions] = useState<CrosstabsAnalysisParams['options']>({
        cells: {
            observed: true,
            expected: false,
            row: false,
            column: false,
            total: false,
            hideSmallCounts: false,
            hideSmallCountsThreshold: 5,
        },
        residuals: {
            unstandardized: false,
            standardized: false,
            adjustedStandardized: false,
        },
        nonintegerWeights: 'noAdjustment',
    });
    
    const { variables } = useVariableStore();

    // Load saved Crosstabs data when variables are available
    useEffect(() => {
        (async () => {
            if (!variables || variables.length === 0) return;
            const saved = await getFormData("Crosstabs");
            if (!saved) return;

            const validVars = variables.filter(v => v.name !== "");

            const savedRow: Variable[] = Array.isArray(saved.rowVariables) ? saved.rowVariables : [];
            const savedCol: Variable[] = Array.isArray(saved.columnVariables) ? saved.columnVariables : [];

            setRowVariables(savedRow);
            setColumnVariables(savedCol);

            const selectedIds = new Set([...savedRow, ...savedCol].map(v => v.id));
            const avail = validVars.filter(v => v.id !== undefined && !selectedIds.has(v.id));
            setAvailableVariables(avail);

            if (saved.options) {
                setOptions(saved.options);
            }

            setHighlightedVariable(null);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variables]);

    // Analysis Hook
    const { runAnalysis, isCalculating, error } = useCrosstabsAnalysis(
        { rowVariables, columnVariables, options }, 
        onClose
    );

    // Sync available, row, and column variable lists whenever the underlying dataset changes
    // (e.g., the user deletes or renames variables in the Data Editor).
    // Any variables that are no longer present in the global `variables` array will be
    // removed from the Row/Column selections to keep the UI in sync.
    useEffect(() => {
        const validVars = variables.filter(v => v.name !== "");

        // Filter existing selections so that they only contain currently valid variables
        const filteredRow = rowVariables.filter(rv => validVars.some(v => v.id === rv.id));
        const filteredColumn = columnVariables.filter(cv => validVars.some(v => v.id === cv.id));

        // Update state if pruning actually removed something (avoid unnecessary rerenders)
        if (filteredRow.length !== rowVariables.length) {
            setRowVariables(filteredRow);
        }
        if (filteredColumn.length !== columnVariables.length) {
            setColumnVariables(filteredColumn);
        }

        // Anything not in the current Row / Column lists is available
        const selectedIds = new Set([...filteredRow, ...filteredColumn].map(v => v.id));
        const newAvailable = validVars.filter(v => v.id !== undefined && !selectedIds.has(v.id));
        setAvailableVariables(newAvailable);
    }, [variables, rowVariables, columnVariables]);

    const resetAllStates = () => {
        setActiveTab("variables");
        const validVars = variables.filter(v => v.name !== "");
        setAvailableVariables(validVars);
        setRowVariables([]);
        setColumnVariables([]);
        setHighlightedVariable(null);
        setOptions({
            cells: {
                observed: true,
                expected: false,
                row: false,
                column: false,
                total: false,
                hideSmallCounts: false,
                hideSmallCountsThreshold: 5,
            },
            residuals: {
                unstandardized: false,
                standardized: false,
                adjustedStandardized: false,
            },
            nonintegerWeights: 'noAdjustment',
        });

        // Clear persisted data
        clearFormData("Crosstabs").catch(console.error);
    };

    // Persist Crosstabs state whenever variables or options change
    useEffect(() => {
        const stateToSave = {
            rowVariables,
            columnVariables,
            options,
        };

        const hasSelections = rowVariables.length > 0 || columnVariables.length > 0;

        if (hasSelections) {
            saveFormData("Crosstabs", stateToSave).catch(console.error);
        } else {
            clearFormData("Crosstabs").catch(console.error);
        }
    }, [rowVariables, columnVariables, options]);

    // Variable list management functions
    const moveToRowVariables = (variable: Variable) => {
        setRowVariables(prev => [...prev, variable]);
        setAvailableVariables(prev => prev.filter(v => v.id !== variable.id));
        setHighlightedVariable(null);
    };

    const moveToColumnVariables = (variable: Variable) => {
        setColumnVariables(prev => [...prev, variable]);
        setAvailableVariables(prev => prev.filter(v => v.id !== variable.id));
        setHighlightedVariable(null);
    };

    const moveToAvailableVariables = (variable: Variable, source: 'row' | 'column') => {
        setAvailableVariables(prev => [...prev, variable]);
        if (source === 'row') setRowVariables(prev => prev.filter(v => v.id !== variable.id));
        else if (source === 'column') setColumnVariables(prev => prev.filter(v => v.id !== variable.id));
        setHighlightedVariable(null);
    };

    const reorderVariables = (source: 'available' | 'row' | 'column', variables: Variable[]) => {
        if (source === 'available') setAvailableVariables([...variables]);
        else if (source === 'row') setRowVariables([...variables]);
        else if (source === 'column') setColumnVariables([...variables]);
    };

    return (
        <>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="flex-grow flex flex-col overflow-hidden">
                <div className="border-b border-border flex-shrink-0">
                    <TabsList>
                        <TabsTrigger value="variables" id="crosstabs-variables-tab-trigger">Variables</TabsTrigger>
                        <TabsTrigger value="cells" id="crosstabs-cells-tab-trigger">Cells</TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-grow overflow-y-auto">
                    <TabsContent value="variables">
                        <VariablesTab
                            availableVariables={availableVariables}
                            rowVariables={rowVariables}
                            columnVariables={columnVariables}
                            moveToRowVariables={moveToRowVariables}
                            moveToColumnVariables={moveToColumnVariables}
                            moveToAvailableVariables={moveToAvailableVariables}
                            reorderVariables={reorderVariables}
                            highlightedVariable={highlightedVariable}
                            setHighlightedVariable={setHighlightedVariable}
                            containerType={containerType}
                            tourActive={tourActive}
                            currentStep={currentStep}
                            tourSteps={tourSteps}
                        />
                    </TabsContent>
                    <TabsContent value="cells">
                        <CellsTab
                            options={options}
                            setOptions={setOptions}
                            rowVariables={rowVariables}
                            columnVariables={columnVariables}
                            containerType={containerType}
                            tourActive={tourActive}
                            currentStep={currentStep}
                            tourSteps={tourSteps}
                        />
                    </TabsContent>
                </div>
            </Tabs>

            {error && <div className="px-6 py-2 text-destructive text-sm whitespace-pre-wrap">{error}</div>}

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                    <Button variant="ghost" size="icon" onClick={startTour} className="h-8 w-8" aria-label="help">
                        <HelpCircle size={18} />
                    </Button>
                </div>
                <div>
                    <Button
                        variant="outline"
                        className="mr-2"
                        onClick={resetAllStates}
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
                        id="crosstabs-ok-button"
                        onClick={runAnalysis}
                        disabled={isCalculating}
                    >
                        {isCalculating ? "Calculating..." : "OK"}
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
const Crosstabs: FC<BaseModalProps> = ({ onClose, containerType = "dialog", ...props }) => {
    // If sidebar mode, use a div container
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <CrosstabsContent onClose={onClose} containerType={containerType} {...props} />
                </div>
            </div>
        );
    }

    // For dialog mode, use DialogContent
    return (
        <DialogContent className="max-w-4xl h-[calc(100vh-8rem)] flex flex-col p-0 bg-popover text-popover-foreground">
            <DialogHeader className="px-6 py-4 border-b border-border">
                <DialogTitle className="text-xl">Crosstabs</DialogTitle>
            </DialogHeader>

            <div className="flex-grow flex flex-col overflow-hidden">
                <CrosstabsContent onClose={onClose} containerType={containerType} {...props} />
            </div>
        </DialogContent>
    );
};

export default Crosstabs;