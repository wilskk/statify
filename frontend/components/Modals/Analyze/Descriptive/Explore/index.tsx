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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import type { Variable } from "@/types/Variable";

// Import the Tab components
import VariablesTab from "./VariablesTab";
import StatisticsTab from "./StatisticsTab";
import PlotsTab from "./PlotsTab";

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

    const [confidenceInterval, setConfidenceInterval] = useState<string>("95");
    const [showDescriptives, setShowDescriptives] = useState<boolean>(true);
    const [showMEstimators, setShowMEstimators] = useState<boolean>(false);
    const [showOutliers, setShowOutliers] = useState<boolean>(false);
    const [showPercentiles, setShowPercentiles] = useState<boolean>(false);

    const [boxplotOption, setBoxplotOption] = useState<string>("factorLevels");
    const [showStemAndLeaf, setShowStemAndLeaf] = useState<boolean>(true);
    const [showHistogram, setShowHistogram] = useState<boolean>(false);
    const [showNormalityPlots, setShowNormalityPlots] = useState<boolean>(false);

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
            setActiveTab("variables");
            return;
        }

        setErrorMsg(null);
        setIsCalculating(true);

        const exploreOptions = {
            dependent: dependentVariables.map(v => v.name),
            factors: factorVariables.map(v => v.name),
            label: labelVariable ? labelVariable.name : null,
            display: displayOption,
            confidenceInterval,
            showDescriptives,
            showMEstimators,
            showOutliers,
            showPercentiles,
            boxplotOption,
            showStemAndLeaf,
            showHistogram,
            showNormalityPlots,
        };

        console.log("Submitting Explore Options:", exploreOptions);

        try {
            setTimeout(() => {
                const dependentNames = dependentVariables.map(v => v.name).join(" ");
                const factorNames = factorVariables.map(v => v.name).join(" ");
                const labelName = labelVariable ? labelVariable.name : "";

                const logMsg = `EXPLORE VARIABLES=${dependentNames}${factorNames ? ` BY ${factorNames}` : ''}${labelName ? ` ID=${labelName}` : ""} /STATISTICS=DEFAULT /PLOT=DEFAULT`;

                addLog({ log: logMsg }).then(logId => {
                    addAnalytic(logId, {
                        title: "Explore Analysis",
                        note: `Explore analysis for ${dependentNames}`
                    }).then(analyticId => {
                        addStatistic(analyticId, {
                            title: "Explore Results",
                            output_data: JSON.stringify({
                                type: "explore",
                                options: exploreOptions
                            }),
                            components: "ExploreOutput",
                            description: `Descriptive statistics and plots for ${dependentNames}.`
                        }).then(() => {
                            setIsCalculating(false);
                            onClose();
                        }).catch(err => {
                            console.error("Error adding statistic:", err);
                            setErrorMsg("Failed to save results.");
                            setIsCalculating(false);
                        });
                    }).catch(err => {
                        console.error("Error adding analytic:", err);
                        setErrorMsg("Failed to create analysis entry.");
                        setIsCalculating(false);
                    });
                }).catch(err => {
                    console.error("Error adding log:", err);
                    setErrorMsg("Failed to log the operation.");
                    setIsCalculating(false);
                });
            }, 1500);

        } catch (ex) {
            console.error("Explore Error:", ex);
            setErrorMsg("An unexpected error occurred during the explore analysis.");
            setIsCalculating(false);
        }
    };

    const handleReset = () => {
        setDependentVariables([]);
        setFactorVariables([]);
        setLabelVariable(null);
        setAvailableVariables(variables.filter(v => v.name !== ""));
        setHighlightedVariable(null);
        setShowDescriptives(true);
        setConfidenceInterval("95");
        setShowMEstimators(false);
        setShowOutliers(false);
        setShowPercentiles(false);
        setBoxplotOption("factorLevels");
        setShowStemAndLeaf(true);
        setShowHistogram(false);
        setShowNormalityPlots(false);
        setErrorMsg(null);
        setActiveTab("variables");
    };

    // Placeholder for Paste functionality
    const handlePaste = () => {
        console.log("Paste action triggered");
        // TODO: Implement paste logic if needed
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
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

                    <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow focus-visible:ring-0 focus-visible:ring-offset-0">
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

                    <TabsContent value="statistics" className="p-6 overflow-y-auto flex-grow focus-visible:ring-0 focus-visible:ring-offset-0">
                        <StatisticsTab
                            showDescriptives={showDescriptives}
                            setShowDescriptives={setShowDescriptives}
                            confidenceInterval={confidenceInterval}
                            setConfidenceInterval={setConfidenceInterval}
                            showMEstimators={showMEstimators}
                            setShowMEstimators={setShowMEstimators}
                            showOutliers={showOutliers}
                            setShowOutliers={setShowOutliers}
                            showPercentiles={showPercentiles}
                            setShowPercentiles={setShowPercentiles}
                        />
                    </TabsContent>

                    <TabsContent value="plots" className="p-6 overflow-y-auto flex-grow focus-visible:ring-0 focus-visible:ring-offset-0">
                        <PlotsTab
                            boxplotOption={boxplotOption}
                            setBoxplotOption={setBoxplotOption}
                            showStemAndLeaf={showStemAndLeaf}
                            setShowStemAndLeaf={setShowStemAndLeaf}
                            showHistogram={showHistogram}
                            setShowHistogram={setShowHistogram}
                            showNormalityPlots={showNormalityPlots}
                            setShowNormalityPlots={setShowNormalityPlots}
                        />
                    </TabsContent>
                </Tabs>

                <DialogFooter className="px-6 py-4 border-t border-[#E6E6E6] bg-[#F7F7F7] flex-shrink-0">
                    <div className="flex justify-end space-x-3">
                        <Button
                            className="bg-black text-white hover:bg-[#444444] h-8 px-4 text-sm"
                            onClick={handleExplore}
                            disabled={isCalculating}
                        >
                            {isCalculating ? "Running..." : "OK"}
                        </Button>
                        <Button
                            variant="outline"
                            className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4 text-sm"
                            onClick={handlePaste}
                            disabled={isCalculating}
                        >
                            Paste
                        </Button>
                        <Button
                            variant="outline"
                            className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4 text-sm"
                            onClick={handleReset}
                            disabled={isCalculating}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="outline"
                            className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4 text-sm"
                            onClick={onClose}
                            disabled={isCalculating}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            className="border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888] h-8 px-4 text-sm"
                        >
                            Help
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ExploreModal;