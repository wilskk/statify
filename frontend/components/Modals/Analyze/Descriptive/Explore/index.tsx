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
import { Label } from "@/components/ui/label";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import type { Variable } from "@/types/Variable";

// Import the VariablesTab component
import VariablesTab from "./VariablesTab";

interface ExploreModalProps {
    onClose: () => void;
}

const ExploreModal: FC<ExploreModalProps> = ({ onClose }) => {
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [dependentVariables, setDependentVariables] = useState<Variable[]>([]);
    const [factorVariables, setFactorVariables] = useState<Variable[]>([]);
    const [labelVariable, setLabelVariable] = useState<Variable | null>(null);
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available' | 'dependent' | 'factor' | 'label'} | null>(null);
    const [displayOption, setDisplayOption] = useState<'both' | 'statistics' | 'plots'>('both');
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("variables");

    const [showDescriptives, setShowDescriptives] = useState(true);
    const [showMeasuresOfCentralTendency, setShowMeasuresOfCentralTendency] = useState(true);
    const [showDispersion, setShowDispersion] = useState(true);
    const [showOutliers, setShowOutliers] = useState(false);
    const [showPercentiles, setShowPercentiles] = useState(false);

    const [showHistograms, setShowHistograms] = useState(true);
    const [showBoxplots, setShowBoxplots] = useState(true);
    const [showScatterplots, setShowScatterplots] = useState(false);
    const [showNormalProbabilityPlots, setShowNormalProbabilityPlots] = useState(false);

    const [bootstrapSamples, setBootstrapSamples] = useState("1000");
    const [confidenceLevel, setConfidenceLevel] = useState("95");

    const variables = useVariableStore.getState().variables;
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    useEffect(() => {
        const validVars = variables.filter(v => v.name !== "");
        setAvailableVariables(validVars);
    }, [variables]);

    const moveToDependentVariables = (variable: Variable, targetIndex?: number) => {
        setDependentVariables(prev => {
            const updated = [...prev];
            if (targetIndex !== undefined) {
                updated.splice(targetIndex, 0, variable);
            } else {
                updated.push(variable);
            }
            return updated;
        });
        setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
    };

    const moveToFactorVariables = (variable: Variable, targetIndex?: number) => {
        setFactorVariables(prev => {
            const updated = [...prev];
            if (targetIndex !== undefined) {
                updated.splice(targetIndex, 0, variable);
            } else {
                updated.push(variable);
            }
            return updated;
        });
        setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
    };

    const moveToLabelVariable = (variable: Variable) => {
        if (labelVariable) {
            setAvailableVariables(prev => [...prev, labelVariable]);
        }

        setLabelVariable(variable);
        setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
    };

    const moveToAvailableVariables = (variable: Variable, source: 'dependent' | 'factor' | 'label', targetIndex?: number) => {
        setAvailableVariables(prev => {
            const updated = [...prev];
            if (targetIndex !== undefined) {
                updated.splice(targetIndex, 0, variable);
            } else {
                updated.push(variable);
            }
            return updated;
        });

        if (source === 'dependent') {
            setDependentVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        } else if (source === 'factor') {
            setFactorVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        } else if (source === 'label') {
            setLabelVariable(null);
        }
    };

    const reorderVariables = (source: 'available' | 'dependent' | 'factor' | 'label', variables: Variable[]) => {
        if (source === 'available') {
            setAvailableVariables(variables);
        } else if (source === 'dependent') {
            setDependentVariables(variables);
        } else if (source === 'factor') {
            setFactorVariables(variables);
        } // Label variable list cannot be reordered as it only holds one item
    };

    const handleExplore = async () => {
        if (dependentVariables.length === 0) {
            setErrorMsg("Please select at least one dependent variable.");
            return;
        }

        setErrorMsg(null);
        setIsCalculating(true);

        try {
            setTimeout(() => {
                const dependentNames = dependentVariables.map(v => v.name).join(" ");
                const factorNames = factorVariables.map(v => v.name).join(" ");
                const labelName = labelVariable ? labelVariable.name : "";

                const logMsg = `EXPLORE VARIABLES=${dependentNames} BY ${factorNames} ${labelName ? `ID=${labelName}` : ""}`;

                addLog({ log: logMsg }).then(logId => {
                    addAnalytic(logId, {
                        title: "Explore",
                        note: ""
                    }).then(analyticId => {
                        addStatistic(analyticId, {
                            title: "Descriptive Statistics",
                            output_data: JSON.stringify({
                                type: "explore",
                                dependent: dependentVariables.map(v => v.name),
                                factors: factorVariables.map(v => v.name),
                                label: labelVariable ? labelVariable.name : null,
                                display: displayOption
                            }),
                            components: "Explore Analysis",
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
                <DialogTitle className="text-[22px] font-semibold">Explore</DialogTitle>
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
                            value="statistics"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'statistics' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Statistics
                        </TabsTrigger>
                        <TabsTrigger
                            value="plots"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'plots' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Plots
                        </TabsTrigger>

                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <VariablesTab
                        availableVariables={availableVariables}
                        dependentVariables={dependentVariables}
                        factorVariables={factorVariables}
                        labelVariable={labelVariable}
                        highlightedVariable={highlightedVariable}
                        setHighlightedVariable={setHighlightedVariable}
                        moveToDependentVariables={moveToDependentVariables}
                        moveToFactorVariables={moveToFactorVariables}
                        moveToLabelVariable={moveToLabelVariable}
                        moveToAvailableVariables={moveToAvailableVariables}
                        reorderVariables={reorderVariables}
                        errorMsg={errorMsg}
                    />
                </TabsContent>

                <TabsContent value="statistics" className="p-6 overflow-y-auto flex-grow">
                    <div className="border border-[#E6E6E6] p-4 rounded-md">
                        <div className="text-sm font-medium mb-4">Descriptive Statistics</div>
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="descStats"
                                    checked={showDescriptives}
                                    onChange={(e) => setShowDescriptives(e.target.checked)}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="descStats" className="text-sm">Descriptives</Label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="centralTendency"
                                    checked={showMeasuresOfCentralTendency}
                                    onChange={(e) => setShowMeasuresOfCentralTendency(e.target.checked)}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="centralTendency" className="text-sm">Measures of Central Tendency</Label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="dispersion"
                                    checked={showDispersion}
                                    onChange={(e) => setShowDispersion(e.target.checked)}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="dispersion" className="text-sm">Dispersion</Label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="outliers"
                                    checked={showOutliers}
                                    onChange={(e) => setShowOutliers(e.target.checked)}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="outliers" className="text-sm">Outliers</Label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="percentiles"
                                    checked={showPercentiles}
                                    onChange={(e) => setShowPercentiles(e.target.checked)}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="percentiles" className="text-sm">Percentiles</Label>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="plots" className="p-6 overflow-y-auto flex-grow">
                    <div className="border border-[#E6E6E6] p-4 rounded-md">
                        <div className="text-sm font-medium mb-4">Plot Types</div>
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="histograms"
                                    checked={showHistograms}
                                    onChange={(e) => setShowHistograms(e.target.checked)}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="histograms" className="text-sm">Histograms</Label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="boxplots"
                                    checked={showBoxplots}
                                    onChange={(e) => setShowBoxplots(e.target.checked)}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="boxplots" className="text-sm">Boxplots</Label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="scatterplots"
                                    checked={showScatterplots}
                                    onChange={(e) => setShowScatterplots(e.target.checked)}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="scatterplots" className="text-sm">Scatterplots</Label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="normalPlots"
                                    checked={showNormalProbabilityPlots}
                                    onChange={(e) => setShowNormalProbabilityPlots(e.target.checked)}
                                    className="mr-2 border-[#CCCCCC]"
                                />
                                <Label htmlFor="normalPlots" className="text-sm">Normal Probability Plots</Label>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        className="bg-black text-white hover:bg-[#444444] h-8 px-4"
                        onClick={handleExplore}
                        disabled={isCalculating}
                    >
                        {isCalculating ? "Processing..." : "OK"}
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

export default ExploreModal;