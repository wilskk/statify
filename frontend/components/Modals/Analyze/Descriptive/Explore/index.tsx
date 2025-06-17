"use client";
import React, { useState, useEffect, FC } from "react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import type { Variable } from "@/types/Variable";
import { BaseModalProps } from "@/types/modalTypes";

// Import the Tab components
import VariablesTab from "./VariablesTab";
import StatisticsTab from "./StatisticsTab";
import PlotsTab from "./PlotsTab";

// Main content component that's agnostic of container type
const ExploreContent: FC<BaseModalProps> = ({ onClose, containerType = "dialog" }) => {
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [dependentVariables, setDependentVariables] = useState<Variable[]>([]);
    const [factorVariables, setFactorVariables] = useState<Variable[]>([]);
    const [labelVariable, setLabelVariable] = useState<Variable | null>(null);
    const [highlightedVariable, setHighlightedVariable] = useState<{tempId: string, source: 'available' | 'dependent' | 'factor' | 'label'} | null>(null);
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
        const validVars = variables.filter(v => v.name !== "").map(v => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}`
        }));
        const dependentTempIds = new Set(dependentVariables.map(v => v.tempId));
        const factorTempIds = new Set(factorVariables.map(v => v.tempId));
        const labelTempId = labelVariable?.tempId;

        const finalAvailable = validVars.filter(v =>
            v.tempId &&
            !dependentTempIds.has(v.tempId) &&
            !factorTempIds.has(v.tempId) &&
            (!labelTempId || v.tempId !== labelTempId)
        );
        setAvailableVariables(finalAvailable);
    }, [variables, dependentVariables, factorVariables, labelVariable]);

    const moveToDependentVariables = (variable: Variable, targetIndex?: number) => {
        if (!variable.tempId) {
             console.error("Cannot move variable without tempId:", variable);
             return;
        }
        setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setDependentVariables(prev => {
            if (prev.some(v => v.tempId === variable.tempId)) {
                return prev; // Avoid duplicates
            }
            const newList = [...prev];
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
                newList.splice(targetIndex, 0, variable);
            } else {
                newList.push(variable);
            }
            return newList;
        });
        setHighlightedVariable(null); // Clear highlight after move
    };

    const moveToFactorVariables = (variable: Variable, targetIndex?: number) => {
         if (!variable.tempId) {
             console.error("Cannot move variable without tempId:", variable);
             return;
         }
         setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
         setFactorVariables(prev => {
             if (prev.some(v => v.tempId === variable.tempId)) {
                 return prev; // Avoid duplicates
             }
             const newList = [...prev];
             if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
                 newList.splice(targetIndex, 0, variable);
             } else {
                 newList.push(variable);
             }
             return newList;
         });
         setHighlightedVariable(null); // Clear highlight after move
    };

    const moveToLabelVariable = (variable: Variable) => {
        if (!variable.tempId) {
            console.error("Cannot move variable without tempId:", variable);
            return;
        }
        // Move current label back to available if it exists
        if (labelVariable && labelVariable.tempId) {
            setAvailableVariables(prev => {
                 if (!prev.some(v => v.tempId === labelVariable.tempId)) { // Avoid duplicates
                     const newList = [...prev, labelVariable];
                     newList.sort((a, b) => a.columnIndex - b.columnIndex); // Keep available sorted
                     return newList;
                 }
                 return prev;
            });
        }

        setLabelVariable(variable);
        setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setHighlightedVariable(null); // Clear highlight after move
    };

    const moveToAvailableVariables = (variable: Variable, source: 'dependent' | 'factor' | 'label', targetIndex?: number) => {
        if (!variable.tempId) {
            console.error("Cannot move variable without tempId:", variable);
            return;
        }
        // Remove from the source list
        if (source === 'dependent') {
            setDependentVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (source === 'factor') {
            setFactorVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (source === 'label') {
            setLabelVariable(null);
        }

        // Add to available list if not already there
        setAvailableVariables(prev => {
             if (prev.some(v => v.tempId === variable.tempId)) {
                 return prev; // Avoid duplicates
             }
            const newList = [...prev];
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newList.length) {
                 newList.splice(targetIndex, 0, variable);
            } else {
                 newList.push(variable);
            }
            newList.sort((a, b) => a.columnIndex - b.columnIndex); // Keep available sorted
            return newList;
        });
        setHighlightedVariable(null); // Clear highlight after move
    };

    const reorderVariables = (source: 'available' | 'dependent' | 'factor', reorderedList: Variable[]) => {
        // Reordering 'label' is not applicable as it's a single item
        if (source === 'available') {
            setAvailableVariables([...reorderedList]);
        } else if (source === 'dependent') {
            setDependentVariables([...reorderedList]);
        } else if (source === 'factor') {
            setFactorVariables([...reorderedList]);
        }
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
        setAvailableVariables(variables.filter(v => v.name !== "" && v.tempId).sort((a, b) => a.columnIndex - b.columnIndex));
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

    const handleHelp = () => {
        console.log("Help action triggered");
        // TODO: Implement help logic if needed
    };

    return (
        <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow overflow-hidden">
                <div className="border-b border-border flex-shrink-0">
                    <TabsList>
                        <TabsTrigger value="variables">Variables</TabsTrigger>
                        <TabsTrigger value="statistics">Statistics</TabsTrigger>
                        <TabsTrigger value="plots">Plots</TabsTrigger>
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
                        containerType={containerType}
                    />
                </TabsContent>

                <TabsContent value="statistics" className="p-6 overflow-y-auto flex-grow">
                    <StatisticsTab
                        confidenceInterval={confidenceInterval}
                        setConfidenceInterval={setConfidenceInterval}
                        showDescriptives={showDescriptives}
                        setShowDescriptives={setShowDescriptives}
                        showMEstimators={showMEstimators}
                        setShowMEstimators={setShowMEstimators}
                        showOutliers={showOutliers}
                        setShowOutliers={setShowOutliers}
                        showPercentiles={showPercentiles}
                        setShowPercentiles={setShowPercentiles}
                        containerType={containerType}
                    />
                </TabsContent>

                <TabsContent value="plots" className="p-6 overflow-y-auto flex-grow">
                    <PlotsTab
                        boxplotOption={boxplotOption}
                        setBoxplotOption={setBoxplotOption}
                        showStemAndLeaf={showStemAndLeaf}
                        setShowStemAndLeaf={setShowStemAndLeaf}
                        showHistogram={showHistogram}
                        setShowHistogram={setShowHistogram}
                        showNormalityPlots={showNormalityPlots}
                        setShowNormalityPlots={setShowNormalityPlots}
                        containerType={containerType}
                    />
                </TabsContent>
            </Tabs>

            {errorMsg && (
                <div className="px-6 py-2 text-sm text-destructive bg-destructive/10 border-t border-destructive/20">
                    {errorMsg}
                </div>
            )}

            <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0">
                <div className="flex justify-end space-x-3">
                    <Button
                        onClick={handleExplore}
                        disabled={isCalculating}
                    >
                        {isCalculating ? "Processing..." : "OK"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={isCalculating}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isCalculating}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleHelp}
                        disabled={isCalculating}
                    >
                        Help
                    </Button>
                </div>
            </div>
        </>
    );
};

// Main component that handles different container types
const Explore: FC<BaseModalProps> = ({ onClose, containerType = "dialog", ...props }) => {
    // If sidebar mode, use a div container
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <ExploreContent onClose={onClose} containerType={containerType} {...props} />
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent
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