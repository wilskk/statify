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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import {
    CornerDownRight,
    CornerDownLeft,
    Ruler,
    Shapes,
    BarChartHorizontal,
    InfoIcon
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";
import type { Variable } from "@/types/Variable";

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

    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-[#888888] mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-[#888888] mr-1 flex-shrink-0" />;
        }
    };

    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    const handleVariableSelect = (variable: Variable, source: 'available' | 'dependent' | 'factor' | 'label') => {
        if (highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: variable.columnIndex.toString(), source });
        }
    };

    const handleVariableDoubleClick = (variable: Variable, source: 'available' | 'dependent' | 'factor' | 'label') => {
        if (source === 'available') {
            moveToDependentVariables(variable);
        } else if (source === 'dependent') {
            moveToAvailableVariables(variable, 'dependent');
        } else if (source === 'factor') {
            moveToAvailableVariables(variable, 'factor');
        } else if (source === 'label') {
            moveToAvailableVariables(variable, 'label');
        }
    };

    const moveToDependentVariables = (variable: Variable) => {
        setDependentVariables(prev => [...prev, variable]);
        setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const moveToFactorVariables = (variable: Variable) => {
        setFactorVariables(prev => [...prev, variable]);
        setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const moveToLabelVariable = (variable: Variable) => {
        if (labelVariable) {
            setAvailableVariables(prev => [...prev, labelVariable]);
        }

        setLabelVariable(variable);
        setAvailableVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    const moveToAvailableVariables = (variable: Variable, source: 'dependent' | 'factor' | 'label') => {
        setAvailableVariables(prev => [...prev, variable]);

        if (source === 'dependent') {
            setDependentVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        } else if (source === 'factor') {
            setFactorVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        } else if (source === 'label') {
            setLabelVariable(null);
        }

        setHighlightedVariable(null);
    };

    const handleMoveVariable = (target: 'dependent' | 'factor' | 'label') => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === 'available') {
            const variable = availableVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
            if (variable) {
                if (target === 'dependent') {
                    moveToDependentVariables(variable);
                } else if (target === 'factor') {
                    moveToFactorVariables(variable);
                } else if (target === 'label') {
                    moveToLabelVariable(variable);
                }
            }
        } else if (highlightedVariable.source === 'dependent' && target === 'dependent') {
            const variable = dependentVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
            if (variable) {
                moveToAvailableVariables(variable, 'dependent');
            }
        } else if (highlightedVariable.source === 'factor' && target === 'factor') {
            const variable = factorVariables.find(v => v.columnIndex.toString() === highlightedVariable.id);
            if (variable) {
                moveToAvailableVariables(variable, 'factor');
            }
        } else if (highlightedVariable.source === 'label' && target === 'label') {
            if (labelVariable && labelVariable.columnIndex.toString() === highlightedVariable.id) {
                moveToAvailableVariables(labelVariable, 'label');
            }
        }
    };

    const renderVariableList = (variables: Variable[], source: 'available' | 'dependent' | 'factor' | 'label', height: string) => (
        <div className="border border-[#E6E6E6] p-2 rounded-md overflow-y-auto overflow-x-hidden bg-white" style={{ height }}>
            <div className="space-y-1">
                {variables.map((variable) => (
                    <TooltipProvider key={variable.columnIndex}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-[#F7F7F7] ${
                                        highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === source
                                            ? "bg-[#E6E6E6] border-[#888888]"
                                            : "border-[#CCCCCC]"
                                    }`}
                                    onClick={() => handleVariableSelect(variable, source)}
                                    onDoubleClick={() => handleVariableDoubleClick(variable, source)}
                                >
                                    <div className="flex items-center w-full">
                                        {getVariableIcon(variable)}
                                        <span className="text-xs truncate">{getDisplayName(variable)}</span>
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p className="text-xs">{getDisplayName(variable)}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>
        </div>
    );

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
                        <TabsTrigger
                            value="bootstrap"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'bootstrap' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Bootstrap
                        </TabsTrigger>
                        <TabsTrigger
                            value="display"
                            className={`px-4 h-8 rounded-none text-sm ${activeTab === 'display' ? 'bg-white border-t border-l border-r border-[#E6E6E6]' : ''}`}
                        >
                            Display
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="variables" className="p-6 overflow-y-auto flex-grow">
                    <div className="grid grid-cols-8 gap-6">
                        <div className="col-span-3">
                            <div className="text-sm mb-2 font-medium">Variables:</div>
                            {renderVariableList(availableVariables, 'available', '300px')}
                            <div className="text-xs mt-2 text-[#888888] flex items-center">
                                <InfoIcon size={14} className="mr-1 flex-shrink-0" />
                                <span>To change a variable&apos;s measurement level, right click on it in the Variables list.</span>
                            </div>
                        </div>

                        <div className="col-span-1 flex flex-col items-center justify-center">
                            <div className="flex flex-col space-y-32">
                                <div className="space-y-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                        onClick={() => handleMoveVariable('dependent')}
                                    >
                                        {highlightedVariable?.source === 'dependent' ?
                                            <CornerDownLeft size={16} /> :
                                            <CornerDownRight size={16} />
                                        }
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                        onClick={() => handleMoveVariable('factor')}
                                    >
                                        {highlightedVariable?.source === 'factor' ?
                                            <CornerDownLeft size={16} /> :
                                            <CornerDownRight size={16} />
                                        }
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="p-0 w-8 h-8 border-[#CCCCCC] hover:bg-[#F7F7F7] hover:border-[#888888]"
                                    onClick={() => handleMoveVariable('label')}
                                >
                                    {highlightedVariable?.source === 'label' ?
                                        <CornerDownLeft size={16} /> :
                                        <CornerDownRight size={16} />
                                    }
                                </Button>
                            </div>
                        </div>

                        <div className="col-span-4 space-y-6">
                            <div>
                                <div className="text-sm mb-2 font-medium">Dependent List:</div>
                                {renderVariableList(dependentVariables, 'dependent', '100px')}
                            </div>

                            <div>
                                <div className="text-sm mb-2 font-medium">Factor List:</div>
                                {renderVariableList(factorVariables, 'factor', '100px')}
                            </div>

                            <div>
                                <div className="text-sm mb-2 font-medium">Label Cases by:</div>
                                {labelVariable ? (
                                    renderVariableList([labelVariable], 'label', '40px')
                                ) : (
                                    <div className="border border-[#E6E6E6] p-2 rounded-md bg-white" style={{ height: '40px' }}>
                                        <div className="text-xs text-[#888888] italic p-1"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {errorMsg && <div className="text-red-600 text-sm mt-4">{errorMsg}</div>}
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

                <TabsContent value="bootstrap" className="p-6 overflow-y-auto flex-grow">
                    <div className="border border-[#E6E6E6] p-4 rounded-md">
                        <div className="text-sm font-medium mb-4">Bootstrap Options</div>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Label htmlFor="bootstrapSamples" className="text-sm w-36">Bootstrap Samples:</Label>
                                <input
                                    type="text"
                                    id="bootstrapSamples"
                                    value={bootstrapSamples}
                                    onChange={(e) => setBootstrapSamples(e.target.value)}
                                    className="border border-[#CCCCCC] p-1 text-sm rounded-md w-24"
                                />
                            </div>
                            <div className="flex items-center">
                                <Label htmlFor="confidenceLevel" className="text-sm w-36">Confidence Level:</Label>
                                <input
                                    type="text"
                                    id="confidenceLevel"
                                    value={confidenceLevel}
                                    onChange={(e) => setConfidenceLevel(e.target.value)}
                                    className="border border-[#CCCCCC] p-1 text-sm rounded-md w-24"
                                />
                                <span className="ml-1 text-sm">%</span>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="display" className="p-6 overflow-y-auto flex-grow">
                    <div className="border border-[#E6E6E6] p-4 rounded-md">
                        <div className="text-sm font-medium mb-4">Display Options</div>
                        <RadioGroup
                            value={displayOption}
                            onValueChange={(value) => setDisplayOption(value as 'both' | 'statistics' | 'plots')}
                            className="space-y-3"
                        >
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="both"
                                    id="both"
                                    className="mr-2 border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <Label htmlFor="both" className="text-sm cursor-pointer">Both statistics and plots</Label>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="statistics"
                                    id="statistics"
                                    className="mr-2 border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <Label htmlFor="statistics" className="text-sm cursor-pointer">Statistics only</Label>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem
                                    value="plots"
                                    id="plots"
                                    className="mr-2 border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                                />
                                <Label htmlFor="plots" className="text-sm cursor-pointer">Plots only</Label>
                            </div>
                        </RadioGroup>
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
