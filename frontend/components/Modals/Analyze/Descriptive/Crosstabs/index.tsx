// index.tsx
"use client";
import React, { useState, useEffect, FC } from "react";
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
import { InfoIcon } from "lucide-react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useResultStore } from "@/stores/useResultStore";

// Import tab components
import VariablesTab from "./VariablesTab";
import ExactTestsTab from "./ExactTestsTab";
import StatisticsTab from "./StatisticsTab";
import CellsTab from "./CellsTab";

// Types
import type { Variable } from "@/types/Variable";

interface CrosstabsModalProps {
    onClose: () => void;
}

const CrosstabsModal: FC<CrosstabsModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState("variables");
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [rowVariables, setRowVariables] = useState<Variable[]>([]);
    const [columnVariables, setColumnVariables] = useState<Variable[]>([]);
    const [layerVariablesMap, setLayerVariablesMap] = useState<Record<number, Variable[]>>({ 1: [] });
    const [currentLayerIndex, setCurrentLayerIndex] = useState(1);
    const [totalLayers, setTotalLayers] = useState(1);
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available' | 'row' | 'column' | 'layer'} | null>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Variables tab state
    const [displayClusteredBarCharts, setDisplayClusteredBarCharts] = useState(false);
    const [suppressTables, setSuppressTables] = useState(false);
    const [displayLayerVariables, setDisplayLayerVariables] = useState(true);

    // Exact Tests state
    const [exactTestMethod, setExactTestMethod] = useState<'asymptotic' | 'monteCarlo' | 'exact'>('asymptotic');
    const [confidenceLevel, setConfidenceLevel] = useState("99");
    const [monteCarloSamples, setMonteCarloSamples] = useState("10000");
    const [timeLimit, setTimeLimit] = useState("5");
    const [useTimeLimit, setUseTimeLimit] = useState(true);

    // Statistics state
    const [chiSquare, setChiSquare] = useState(false);
    const [correlations, setCorrelations] = useState(false);
    const [contingencyCoefficient, setContingencyCoefficient] = useState(false);
    const [phiAndCramersV, setPhiAndCramersV] = useState(false);
    const [lambda, setLambda] = useState(false);
    const [uncertaintyCoefficient, setUncertaintyCoefficient] = useState(false);
    const [gamma, setGamma] = useState(false);
    const [somersD, setSomersD] = useState(false);
    const [kendallTauB, setKendallTauB] = useState(false);
    const [kendallTauC, setKendallTauC] = useState(false);
    const [eta, setEta] = useState(false);
    const [kappa, setKappa] = useState(false);
    const [risk, setRisk] = useState(false);
    const [mcNemar, setMcNemar] = useState(false);
    const [cochranMantelHaenszel, setCochranMantelHaenszel] = useState(false);
    const [commonOddsRatio, setCommonOddsRatio] = useState("1");

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
    const [nonintegerWeights, setNonintegerWeights] = useState<'roundCell' | 'roundCase' | 'truncateCell' | 'truncateCase' | 'noAdjustment'>('roundCell');

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
                                    exact: {
                                        method: exactTestMethod,
                                        confidenceLevel,
                                        monteCarloSamples,
                                        timeLimit: useTimeLimit ? timeLimit : null
                                    },
                                    statistics: {
                                        chiSquare,
                                        correlations,
                                        nominal: {
                                            contingencyCoefficient,
                                            phiAndCramersV,
                                            lambda,
                                            uncertaintyCoefficient
                                        },
                                        ordinal: {
                                            gamma,
                                            somersD,
                                            kendallTauB,
                                            kendallTauC
                                        },
                                        other: {
                                            eta,
                                            kappa,
                                            risk,
                                            mcNemar,
                                            cochranMantelHaenszel,
                                            commonOddsRatio
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
                                    format: {}
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
        <DialogContent className="max-w-[650px] p-0 bg-white border border-[#E6E6E6] shadow-md rounded-md flex flex-col max-h-[85vh]">
            <DialogHeader className="px-6 py-4 border-b border-[#E6E6E6] flex-shrink-0">
                <DialogTitle className="text-[22px] font-semibold">Crosstabs</DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-[#E6E6E6] flex-shrink-0">
                    <TabsList className="bg-[#F7F7F7] rounded-none h-9 p-0">
                        <TabsTrigger
                            value="variables"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'variables' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Variables
                        </TabsTrigger>
                        <TabsTrigger
                            value="exact"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'exact' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Exact Tests
                        </TabsTrigger>
                        <TabsTrigger
                            value="statistics"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'statistics' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Statistics
                        </TabsTrigger>
                        <TabsTrigger
                            value="cells"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'cells' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Cells
                        </TabsTrigger>

                    </TabsList>
                </div>

                <TabsContent value="variables" className="overflow-y-auto flex-grow">
                    <VariablesTab
                        availableVariables={availableVariables}
                        rowVariables={rowVariables}
                        columnVariables={columnVariables}
                        layerVariablesMap={layerVariablesMap}
                        currentLayerIndex={currentLayerIndex}
                        totalLayers={totalLayers}
                        highlightedVariable={highlightedVariable}
                        displayClusteredBarCharts={displayClusteredBarCharts}
                        suppressTables={suppressTables}
                        displayLayerVariables={displayLayerVariables}
                        setHighlightedVariable={setHighlightedVariable}
                        setCurrentLayerIndex={handleSetCurrentLayerIndex}
                        setTotalLayers={handleSetTotalLayers}
                        moveToRowVariables={moveToRowVariables}
                        moveToColumnVariables={moveToColumnVariables}
                        moveToLayerVariables={moveToLayerVariables}
                        moveToAvailableVariables={moveToAvailableVariables}
                        reorderVariables={reorderVariables}
                        setDisplayClusteredBarCharts={setDisplayClusteredBarCharts}
                        setSuppressTables={setSuppressTables}
                        setDisplayLayerVariables={setDisplayLayerVariables}
                    />
                </TabsContent>

                <TabsContent value="exact" className="overflow-y-auto flex-grow">
                    <ExactTestsTab
                        exactTestMethod={exactTestMethod}
                        confidenceLevel={confidenceLevel}
                        monteCarloSamples={monteCarloSamples}
                        timeLimit={timeLimit}
                        useTimeLimit={useTimeLimit}
                        setExactTestMethod={setExactTestMethod}
                        setConfidenceLevel={setConfidenceLevel}
                        setMonteCarloSamples={setMonteCarloSamples}
                        setTimeLimit={setTimeLimit}
                        setUseTimeLimit={setUseTimeLimit}
                    />
                </TabsContent>

                <TabsContent value="statistics" className="overflow-y-auto flex-grow">
                    <StatisticsTab
                        chiSquare={chiSquare}
                        correlations={correlations}
                        contingencyCoefficient={contingencyCoefficient}
                        phiAndCramersV={phiAndCramersV}
                        lambda={lambda}
                        uncertaintyCoefficient={uncertaintyCoefficient}
                        gamma={gamma}
                        somersD={somersD}
                        kendallTauB={kendallTauB}
                        kendallTauC={kendallTauC}
                        eta={eta}
                        kappa={kappa}
                        risk={risk}
                        mcNemar={mcNemar}
                        cochranMantelHaenszel={cochranMantelHaenszel}
                        commonOddsRatio={commonOddsRatio}
                        setChiSquare={setChiSquare}
                        setCorrelations={setCorrelations}
                        setContingencyCoefficient={setContingencyCoefficient}
                        setPhiAndCramersV={setPhiAndCramersV}
                        setLambda={setLambda}
                        setUncertaintyCoefficient={setUncertaintyCoefficient}
                        setGamma={setGamma}
                        setSomersD={setSomersD}
                        setKendallTauB={setKendallTauB}
                        setKendallTauC={setKendallTauC}
                        setEta={setEta}
                        setKappa={setKappa}
                        setRisk={setRisk}
                        setMcNemar={setMcNemar}
                        setCochranMantelHaenszel={setCochranMantelHaenszel}
                        setCommonOddsRatio={setCommonOddsRatio}
                    />
                </TabsContent>

                <TabsContent value="cells" className="overflow-y-auto flex-grow">
                    <CellsTab
                        observedCounts={observedCounts}
                        expectedCounts={expectedCounts}
                        hideSmallCounts={hideSmallCounts}
                        smallCountThreshold={smallCountThreshold}
                        rowPercentages={rowPercentages}
                        columnPercentages={columnPercentages}
                        totalPercentages={totalPercentages}
                        compareColumnProportions={compareColumnProportions}
                        adjustPValues={adjustPValues}
                        unstandardizedResiduals={unstandardizedResiduals}
                        standardizedResiduals={standardizedResiduals}
                        adjustedStandardizedResiduals={adjustedStandardizedResiduals}
                        nonintegerWeights={nonintegerWeights}
                        setObservedCounts={setObservedCounts}
                        setExpectedCounts={setExpectedCounts}
                        setHideSmallCounts={setHideSmallCounts}
                        setSmallCountThreshold={setSmallCountThreshold}
                        setRowPercentages={setRowPercentages}
                        setColumnPercentages={setColumnPercentages}
                        setTotalPercentages={setTotalPercentages}
                        setCompareColumnProportions={setCompareColumnProportions}
                        setAdjustPValues={setAdjustPValues}
                        setUnstandardizedResiduals={setUnstandardizedResiduals}
                        setStandardizedResiduals={setStandardizedResiduals}
                        setAdjustedStandardizedResiduals={setAdjustedStandardizedResiduals}
                        setNonintegerWeights={setNonintegerWeights}
                    />
                </TabsContent>


            </Tabs>

            {errorMsg && (
                <div className="px-6 py-2 flex items-center text-red-600">
                    <InfoIcon size={16} className="mr-2 flex-shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                        onClick={handleAnalyze}
                        disabled={isCalculating}
                    >
                        {isCalculating ? "Calculating..." : "OK"}
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                    >
                        Paste
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4"
                    >
                        Help
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
};

export default CrosstabsModal;