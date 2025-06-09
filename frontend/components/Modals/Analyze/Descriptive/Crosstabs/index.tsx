// index.tsx
"use client";
import React, { useState, useEffect, FC, useMemo } from "react";
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
import { InfoIcon, HelpCircle } from "lucide-react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useResultStore } from "@/stores/useResultStore";
import { BaseModalProps } from "@/types/modalTypes";
import { 
    VariableHighlight, 
    NonintegerWeightsType 
} from "./types";
import { useTourGuide, TabType, TabControlProps, TourStep } from "./hooks/useTourGuide";
import { TourPopup, ActiveElementHighlight } from "@/components/Common/TourComponents";
import { AnimatePresence } from "framer-motion";

// Import tab components
import VariablesTab from "./VariablesTab";
import StatisticsTab from "./StatisticsTab";
import CellsTab from "./CellsTab";

// Types
import type { Variable } from "@/types/Variable";

// Main content component that's agnostic of container type
const CrosstabsContent: FC<BaseModalProps> = ({ onClose, containerType = "dialog" }) => {
    const [activeTab, setActiveTab] = useState<TabType>("variables");
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [rowVariables, setRowVariables] = useState<Variable[]>([]);
    const [columnVariables, setColumnVariables] = useState<Variable[]>([]);
    const [layerVariablesMap, setLayerVariablesMap] = useState<Record<number, Variable[]>>({ 1: [] });
    const [currentLayerIndex, setCurrentLayerIndex] = useState(1);
    const [totalLayers, setTotalLayers] = useState(1);
    const [highlightedVariable, setHighlightedVariable] = useState<VariableHighlight>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Tour guide state
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

    // Variables tab state
    const [displayClusteredBarCharts, setDisplayClusteredBarCharts] = useState(false);
    const [suppressTables, setSuppressTables] = useState(false);
    const [displayLayerVariables, setDisplayLayerVariables] = useState(true);

    // Statistics state
    const [chiSquare, setChiSquare] = useState(false);
    const [correlations, setCorrelations] = useState(false);
    const [phiAndCramersV, setPhiAndCramersV] = useState(false);
    const [gamma, setGamma] = useState(false);
    const [kendallTauB, setKendallTauB] = useState(false);
    const [kendallTauC, setKendallTauC] = useState(false);
    const [risk, setRisk] = useState(false);

    // Cells state
    const [observedCounts, setObservedCounts] = useState(true);
    const [expectedCounts, setExpectedCounts] = useState(false);
    const [hideSmallCounts, setHideSmallCounts] = useState(false);
    const [smallCountThreshold, setSmallCountThreshold] = useState("5");
    const [rowPercentages, setRowPercentages] = useState(false);
    const [columnPercentages, setColumnPercentages] = useState(false);
    const [totalPercentages, setTotalPercentages] = useState(false);
    const [compareColumnProportions, setCompareColumnProportions] = useState(false);
    const [adjustPValues, setAdjustPValues] = useState(false);
    const [unstandardizedResiduals, setUnstandardizedResiduals] = useState(false);
    const [standardizedResiduals, setStandardizedResiduals] = useState(false);
    const [adjustedStandardizedResiduals, setAdjustedStandardizedResiduals] = useState(false);
    const [nonintegerWeights, setNonintegerWeights] = useState<NonintegerWeightsType>('roundCell');
    
    const variables = useVariableStore.getState().variables;
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    // Initialize available variables on component mount
    useEffect(() => {
        const validVars = variables.filter(v => v.name !== "").map(v => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}`
        }));
        setAvailableVariables(validVars);
    }, [variables]);

    const resetAllStates = () => {
        setActiveTab("variables");
        const validVars = variables.filter(v => v.name !== "").map(v => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}`
        }));
        setAvailableVariables(validVars);
        setRowVariables([]);
        setColumnVariables([]);
        setLayerVariablesMap({ 1: [] });
        setCurrentLayerIndex(1);
        setTotalLayers(1);
        setHighlightedVariable(null);
        setErrorMsg(null);

        // Variables tab state
        setDisplayClusteredBarCharts(false);
        setSuppressTables(false);
        setDisplayLayerVariables(true);

        // Statistics state
        setChiSquare(false);
        setCorrelations(false);
        setPhiAndCramersV(false);
        setGamma(false);
        setKendallTauB(false);
        setKendallTauC(false);
        setRisk(false);

        // Cells state
        setObservedCounts(true);
        setExpectedCounts(false);
        setHideSmallCounts(false);
        setSmallCountThreshold("5");
        setRowPercentages(false);
        setColumnPercentages(false);
        setTotalPercentages(false);
        setCompareColumnProportions(false);
        setAdjustPValues(false);
        setUnstandardizedResiduals(false);
        setStandardizedResiduals(false);
        setAdjustedStandardizedResiduals(false);
        setNonintegerWeights('roundCell');
    };

    // Helper function to ensure layer consistency
    const reorganizeLayers = () => {
        const newLayerMap: Record<number, Variable[]> = {};
        let newIndex = 1;

        // Collect non-empty layers and reindex them
        for (let i = 1; i <= totalLayers; i++) {
            const layerVars = layerVariablesMap[i] || [];
            if (layerVars.length > 0) {
                newLayerMap[newIndex] = layerVars;
                newIndex++;
            }
        }

        // Ensure at least layer 1 exists
        if (Object.keys(newLayerMap).length === 0) {
            newLayerMap[1] = [];
        }

        // Update layer states
        setLayerVariablesMap(newLayerMap);
        setTotalLayers(Math.max(1, Object.keys(newLayerMap).length));

        // Adjust current layer if needed
        if (currentLayerIndex > Object.keys(newLayerMap).length) {
            setCurrentLayerIndex(Math.max(1, Object.keys(newLayerMap).length));
        }
    };

    // Variable list management functions
    const moveToRowVariables = (variable: Variable) => {
        setRowVariables(prev => [...prev, variable]);
        setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setHighlightedVariable(null);
    };

    const moveToColumnVariables = (variable: Variable) => {
        setColumnVariables(prev => [...prev, variable]);
        setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setHighlightedVariable(null);
    };

    const moveToLayerVariables = (variable: Variable) => {
        // Add variable to current layer
        setLayerVariablesMap(prev => {
            const newMap = { ...prev };
            newMap[currentLayerIndex] = [...(newMap[currentLayerIndex] || []), variable];
            return newMap;
        });

        setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setHighlightedVariable(null);
    };

    const moveToAvailableVariables = (variable: Variable, source: 'row' | 'column' | 'layer') => {
        setAvailableVariables(prev => [...prev, variable]);

        if (source === 'row') {
            setRowVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (source === 'column') {
            setColumnVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (source === 'layer') {
            // Remove from current layer
            setLayerVariablesMap(prev => {
                const newMap = { ...prev };
                newMap[currentLayerIndex] = (newMap[currentLayerIndex] || [])
                    .filter(v => v.tempId !== variable.tempId);
                return newMap;
            });

            // Cleanup empty layers
            setTimeout(reorganizeLayers, 0);
        }

        setHighlightedVariable(null);
    };

    // Enhanced function to reorder variables in any list
    const reorderVariables = (source: 'available' | 'row' | 'column' | 'layer', variables: Variable[]) => {
        if (source === 'available') {
            setAvailableVariables([...variables]);
        } else if (source === 'row') {
            setRowVariables([...variables]);
        } else if (source === 'column') {
            setColumnVariables([...variables]);
        } else if (source === 'layer') {
            setLayerVariablesMap(prev => ({
                ...prev,
                [currentLayerIndex]: [...variables]
            }));
        }
    };

    // Set current layer with validation
    const handleSetCurrentLayerIndex = (index: number) => {
        // Ensure the index is within valid range
        if (index >= 1 && index <= totalLayers) {
            setCurrentLayerIndex(index);
        }
    };

    // Set total layers with validation
    const handleSetTotalLayers = (count: number) => {
        setTotalLayers(Math.max(1, count));
    };

    const handleAnalyze = async () => {
        if (rowVariables.length === 0) {
            setErrorMsg("Please select at least one row variable.");
            return;
        }

        if (columnVariables.length === 0) {
            setErrorMsg("Please select at least one column variable.");
            return;
        }

        setErrorMsg(null);
        setIsCalculating(true);

        try {
            // Flatten layer variables for analytics
            const allLayerVariables = Object.values(layerVariablesMap).flat();

            // Placeholder for actual crosstabs analysis
            // Simulate analysis with a timeout
            setTimeout(() => {
                // In a real implementation, this is where you'd process results
                const logMsg = `CROSSTABS VARIABLES=${rowVariables.map(v => v.name).join(", ")} BY ${columnVariables.map(v => v.name).join(", ")}`;

                addLog({ log: logMsg }).then(logId => {
                    addAnalytic(logId, {
                        title: "Crosstabs",
                        note: ""
                    }).then(analyticId => {
                        // Add sample statistics (would be actual results in a real implementation)
                        addStatistic(analyticId, {
                            title: "Crosstabulation",
                            output_data: JSON.stringify({
                                type: "crosstabs",
                                rowVariables: rowVariables.map(v => v.name),
                                columnVariables: columnVariables.map(v => v.name),
                                layerVariables: allLayerVariables.map(v => v.name),
                                layerStructure: layerVariablesMap,
                                options: {
                                    displayClusteredBarCharts,
                                    suppressTables,
                                    displayLayerVariables,
                                    statistics: {
                                        chiSquare,
                                        correlations,
                                        nominal: {
                                            phiAndCramersV,
                                        },
                                        ordinal: {
                                            gamma,
                                            kendallTauB,
                                            kendallTauC
                                        },
                                        other: {
                                            risk,
                                        }
                                    },
                                    cells: {
                                        counts: {
                                            observed: observedCounts,
                                            expected: expectedCounts,
                                            hideSmallCounts,
                                            smallCountThreshold
                                        },
                                        percentages: {
                                            row: rowPercentages,
                                            column: columnPercentages,
                                            total: totalPercentages
                                        },
                                        zTest: {
                                            compareColumnProportions,
                                            adjustPValues
                                        },
                                        residuals: {
                                            unstandardized: unstandardizedResiduals,
                                            standardized: standardizedResiduals,
                                            adjustedStandardized: adjustedStandardizedResiduals
                                        },
                                        nonintegerWeights
                                    },
                                }
                            }),
                            components: "Cross Tabulation",
                            description: ""
                        }).then(() => {
                            setIsCalculating(false);
                            onClose();
                        });
                    });
                });
            }, 1500);

        } catch (ex) {
            console.error(ex);
            setErrorMsg("Something went wrong.");
            setIsCalculating(false);
        }
    };

    return (
        <>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="flex-grow flex flex-col overflow-hidden">
                <div className="border-b border-border flex-shrink-0">
                    <TabsList>
                        <TabsTrigger value="variables" id="crosstabs-variables-tab-trigger">Variables</TabsTrigger>
                        <TabsTrigger value="statistics" id="crosstabs-statistics-tab-trigger">Statistics</TabsTrigger>
                        <TabsTrigger value="cells" id="crosstabs-cells-tab-trigger">Cells</TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-grow overflow-y-auto">
                    <TabsContent value="variables">
                        <VariablesTab
                            availableVariables={availableVariables}
                            rowVariables={rowVariables}
                            columnVariables={columnVariables}
                            layerVariablesMap={layerVariablesMap}
                            currentLayerIndex={currentLayerIndex}
                            totalLayers={totalLayers}
                            moveToRowVariables={moveToRowVariables}
                            moveToColumnVariables={moveToColumnVariables}
                            moveToLayerVariables={moveToLayerVariables}
                            moveToAvailableVariables={moveToAvailableVariables}
                            reorderVariables={reorderVariables}
                            setCurrentLayerIndex={handleSetCurrentLayerIndex}
                            setTotalLayers={handleSetTotalLayers}
                            highlightedVariable={highlightedVariable}
                            setHighlightedVariable={setHighlightedVariable}
                            displayClusteredBarCharts={displayClusteredBarCharts}
                            setDisplayClusteredBarCharts={setDisplayClusteredBarCharts}
                            suppressTables={suppressTables}
                            setSuppressTables={setSuppressTables}
                            displayLayerVariables={displayLayerVariables}
                            setDisplayLayerVariables={setDisplayLayerVariables}
                            containerType={containerType}
                            tourActive={tourActive}
                            currentStep={currentStep}
                            tourSteps={tourSteps}
                        />
                    </TabsContent>
                    <TabsContent value="statistics">
                        <StatisticsTab
                            chiSquare={chiSquare} setChiSquare={setChiSquare}
                            correlations={correlations} setCorrelations={setCorrelations}
                            phiAndCramersV={phiAndCramersV} setPhiAndCramersV={setPhiAndCramersV}
                            gamma={gamma} setGamma={setGamma}
                            kendallTauB={kendallTauB} setKendallTauB={setKendallTauB}
                            kendallTauC={kendallTauC} setKendallTauC={setKendallTauC}
                            risk={risk} setRisk={setRisk}
                            containerType={containerType}
                            tourActive={tourActive}
                            currentStep={currentStep}
                            tourSteps={tourSteps}
                        />
                    </TabsContent>
                    <TabsContent value="cells">
                        <CellsTab
                            observedCounts={observedCounts} setObservedCounts={setObservedCounts}
                            expectedCounts={expectedCounts} setExpectedCounts={setExpectedCounts}
                            hideSmallCounts={hideSmallCounts} setHideSmallCounts={setHideSmallCounts}
                            smallCountThreshold={smallCountThreshold} setSmallCountThreshold={setSmallCountThreshold}
                            rowPercentages={rowPercentages} setRowPercentages={setRowPercentages}
                            columnPercentages={columnPercentages} setColumnPercentages={setColumnPercentages}
                            totalPercentages={totalPercentages} setTotalPercentages={setTotalPercentages}
                            compareColumnProportions={compareColumnProportions} setCompareColumnProportions={setCompareColumnProportions}
                            adjustPValues={adjustPValues} setAdjustPValues={setAdjustPValues}
                            unstandardizedResiduals={unstandardizedResiduals} setUnstandardizedResiduals={setUnstandardizedResiduals}
                            standardizedResiduals={standardizedResiduals} setStandardizedResiduals={setStandardizedResiduals}
                            adjustedStandardizedResiduals={adjustedStandardizedResiduals} setAdjustedStandardizedResiduals={setAdjustedStandardizedResiduals}
                            nonintegerWeights={nonintegerWeights} setNonintegerWeights={setNonintegerWeights}
                            containerType={containerType}
                            tourActive={tourActive}
                            currentStep={currentStep}
                            tourSteps={tourSteps}
                        />
                    </TabsContent>
                </div>
            </Tabs>

            {errorMsg && <div className="px-6 py-2 text-destructive">{errorMsg}</div>}

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                {/* Left: Help icon */}
                <div className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                    <Button variant="ghost" size="icon" onClick={startTour} className="h-8 w-8">
                        <HelpCircle size={18} />
                    </Button>
                </div>
                {/* Right: Buttons */}
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
                        onClick={handleAnalyze}
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