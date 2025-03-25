"use client";

import React, { FC, useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useModalStore } from "@/stores/useModalStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { Variable } from "@/types/Variable";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    CornerDownRight,
    CornerDownLeft
} from "lucide-react";

interface IdentifyUnusualCasesProps {
    onClose: () => void;
}

const IdentifyUnusualCases: FC<IdentifyUnusualCasesProps> = ({ onClose }) => {
    const { closeModal } = useModalStore();
    const { variables } = useVariableStore();

    // State for variables
    const [storeVariables, setStoreVariables] = useState<Variable[]>([]);
    const [analysisVariables, setAnalysisVariables] = useState<Variable[]>([]);
    const [caseIdentifierVariable, setCaseIdentifierVariable] = useState<Variable | null>(null);
    const [highlightedVariable, setHighlightedVariable] = useState<{id: string, source: 'available' | 'analysis'} | null>(null);

    // State for tabs
    const [activeTab, setActiveTab] = useState("variables");

    // Output tab state
    const [showUnusualCasesList, setShowUnusualCasesList] = useState(true);
    const [peerGroupNorms, setPeerGroupNorms] = useState(false);
    const [anomalyIndices, setAnomalyIndices] = useState(false);
    const [reasonOccurrence, setReasonOccurrence] = useState(false);
    const [caseProcessed, setCaseProcessed] = useState(false);

    // Save tab state
    const [saveAnomalyIndex, setSaveAnomalyIndex] = useState(false);
    const [anomalyIndexName, setAnomalyIndexName] = useState("AnomalyIndex");
    const [savePeerGroups, setSavePeerGroups] = useState(false);
    const [peerGroupsRootName, setPeerGroupsRootName] = useState("Peer");
    const [saveReasons, setSaveReasons] = useState(false);
    const [reasonsRootName, setReasonsRootName] = useState("Reason");
    const [replaceExisting, setReplaceExisting] = useState(false);
    const [exportFilePath, setExportFilePath] = useState("");

    // Missing Values tab state
    const [missingValuesOption, setMissingValuesOption] = useState("exclude");
    const [useProportionMissing, setUseProportionMissing] = useState(true);

    // Options tab state
    const [identificationCriteria, setIdentificationCriteria] = useState("percentage");
    const [percentageValue, setPercentageValue] = useState("5");
    const [fixedNumber, setFixedNumber] = useState("");
    const [useMinimumValue, setUseMinimumValue] = useState(true);
    const [cutoffValue, setCutoffValue] = useState("2");
    const [minPeerGroups, setMinPeerGroups] = useState("1");
    const [maxPeerGroups, setMaxPeerGroups] = useState("15");
    const [maxReasons, setMaxReasons] = useState("1");

    // Update available variables when store variables are loaded
    useEffect(() => {
        setStoreVariables(variables.filter(v => v.name !== ""));
    }, [variables]);

    // Handle variable selection
    const handleVariableSelect = (columnIndex: number, source: 'available' | 'analysis') => {
        if (highlightedVariable?.id === columnIndex.toString() && highlightedVariable.source === source) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: columnIndex.toString(), source });
        }
    };

    // Handle variable double click
    const handleVariableDoubleClick = (columnIndex: number, source: 'available' | 'analysis') => {
        if (source === "available") {
            const variable = storeVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveToAnalysisVariables(variable);
            }
        } else if (source === "analysis") {
            const variable = analysisVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveFromAnalysisVariables(variable);
            }
        }
    };

    // Move variable to analysis variables
    const moveToAnalysisVariables = (variable: Variable) => {
        setAnalysisVariables(prev => [...prev, variable]);
        setStoreVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    // Move variable from analysis variables
    const moveFromAnalysisVariables = (variable: Variable) => {
        setStoreVariables(prev => [...prev, variable]);
        setAnalysisVariables(prev => prev.filter(v => v.columnIndex !== variable.columnIndex));
        setHighlightedVariable(null);
    };

    // Handle top transfer button click
    const handleTopTransferClick = () => {
        if (!highlightedVariable) return;

        if (highlightedVariable.source === "available") {
            const columnIndex = parseInt(highlightedVariable.id);
            const variable = storeVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveToAnalysisVariables(variable);
            }
        } else if (highlightedVariable.source === "analysis") {
            const columnIndex = parseInt(highlightedVariable.id);
            const variable = analysisVariables.find(v => v.columnIndex === columnIndex);
            if (variable) {
                moveFromAnalysisVariables(variable);
            }
        }
    };

    // Handle bottom transfer button click (for case identifier)
    const handleBottomTransferClick = () => {
        if (!highlightedVariable || highlightedVariable.source !== "available") return;

        const columnIndex = parseInt(highlightedVariable.id);
        const variable = storeVariables.find(v => v.columnIndex === columnIndex);
        if (variable) {
            setCaseIdentifierVariable(variable);
        }
    };

    // Get variable icon based on measure
    const getVariableIcon = (variable: Variable) => {
        switch (variable.measure) {
            case "scale":
                return <Ruler size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            case "nominal":
                return <Shapes size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            case "ordinal":
                return <BarChartHorizontal size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
            default:
                return variable.type === "STRING"
                    ? <Shapes size={14} className="text-gray-600 mr-1 flex-shrink-0" />
                    : <Ruler size={14} className="text-gray-600 mr-1 flex-shrink-0" />;
        }
    };

    // Get display name for variable
    const getDisplayName = (variable: Variable): string => {
        if (variable.label) {
            return `${variable.label} [${variable.name}]`;
        }
        return variable.name;
    };

    // Handle confirm button click
    const handleConfirm = () => {
        // Add logic to process the settings and create unusual cases identification
        closeModal();
    };

    // Render variable list
    const renderVariableList = (variables: Variable[], source: 'available' | 'analysis', height: string) => (
        <div className="border p-2 rounded-md overflow-y-auto overflow-x-hidden" style={{ height }}>
            <div className="space-y-1">
                {variables.map((variable) => (
                    <TooltipProvider key={variable.columnIndex}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={`flex items-center p-1 cursor-pointer border rounded-md hover:bg-gray-100 ${
                                        highlightedVariable?.id === variable.columnIndex.toString() && highlightedVariable.source === source
                                            ? "bg-gray-200 border-gray-500"
                                            : "border-gray-300"
                                    }`}
                                    onClick={() => handleVariableSelect(variable.columnIndex, source)}
                                    onDoubleClick={() => handleVariableDoubleClick(variable.columnIndex, source)}
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

    return (
        <DialogContent className="max-w-[650px] p-0">
            <DialogHeader className="p-3 border-b">
                <DialogTitle>Identify Unusual Cases</DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b">
                    <TabsList className="bg-gray-100 rounded-none h-9 p-0">
                        <TabsTrigger
                            value="variables"
                            className={`px-4 h-8 rounded-none ${activeTab === 'variables' ? 'bg-white border-t border-l border-r border-gray-300' : ''}`}
                        >
                            Variables
                        </TabsTrigger>
                        <TabsTrigger
                            value="output"
                            className={`px-4 h-8 rounded-none ${activeTab === 'output' ? 'bg-white border-t border-l border-r border-gray-300' : ''}`}
                        >
                            Output
                        </TabsTrigger>
                        <TabsTrigger
                            value="save"
                            className={`px-4 h-8 rounded-none ${activeTab === 'save' ? 'bg-white border-t border-l border-r border-gray-300' : ''}`}
                        >
                            Save
                        </TabsTrigger>
                        <TabsTrigger
                            value="missingValues"
                            className={`px-4 h-8 rounded-none ${activeTab === 'missingValues' ? 'bg-white border-t border-l border-r border-gray-300' : ''}`}
                        >
                            Missing Values
                        </TabsTrigger>
                        <TabsTrigger
                            value="options"
                            className={`px-4 h-8 rounded-none ${activeTab === 'options' ? 'bg-white border-t border-l border-r border-gray-300' : ''}`}
                        >
                            Options
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Variables Tab Content */}
                <TabsContent value="variables" className="p-4">
                    <div className="grid grid-cols-8 gap-4">
                        <div className="col-span-3">
                            <div className="text-sm mb-1 font-medium">Variables:</div>
                            {renderVariableList(storeVariables, 'available', '300px')}
                            <div className="text-xs mt-2 text-gray-600">
                                To change a variable's measurement level, right click on it in the Variables list.
                            </div>
                        </div>

                        <div className="col-span-1 flex flex-col items-center justify-center">
                            <div className="flex flex-col space-y-32">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="p-0 w-8 h-8"
                                    onClick={handleTopTransferClick}
                                    disabled={!highlightedVariable}
                                >
                                    {highlightedVariable?.source === 'available' ?
                                        <CornerDownRight size={16} /> :
                                        <CornerDownLeft size={16} />
                                    }
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="p-0 w-8 h-8"
                                    onClick={handleBottomTransferClick}
                                    disabled={!highlightedVariable || highlightedVariable.source !== 'available'}
                                >
                                    <CornerDownRight size={16} />
                                </Button>
                            </div>
                        </div>

                        <div className="col-span-4 space-y-4">
                            <div>
                                <div className="text-sm mb-1 font-medium">Analysis Variables:</div>
                                {renderVariableList(analysisVariables, 'analysis', '150px')}
                            </div>

                            <div>
                                <div className="text-sm mb-1 font-medium">Case Identifier Variable:</div>
                                <Input
                                    className="h-8"
                                    value={caseIdentifierVariable?.name || ""}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Output Tab Content */}
                <TabsContent value="output" className="p-4">
                    <div className="flex items-center mb-3">
                        <Checkbox
                            id="unusualCasesList"
                            checked={showUnusualCasesList}
                            onCheckedChange={(checked) => setShowUnusualCasesList(!!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="unusualCasesList" className="text-sm">
                            List of unusual cases and reasons why they are considered unusual
                        </Label>
                    </div>

                    <div className="border rounded-md p-4">
                        <div className="text-sm font-medium mb-2">Summaries</div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center">
                                    <Checkbox
                                        id="peerGroupNorms"
                                        checked={peerGroupNorms}
                                        onCheckedChange={(checked) => setPeerGroupNorms(!!checked)}
                                        className="mr-2"
                                    />
                                    <Label htmlFor="peerGroupNorms" className="text-sm font-medium">
                                        Peer group norms
                                    </Label>
                                </div>
                                <p className="text-xs mt-1 ml-6 text-gray-600">
                                    Peer groups are groups of cases that have similar values for analysis variables. This option displays the
                                    distributions of analysis variables by peer group.
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center">
                                    <Checkbox
                                        id="anomalyIndices"
                                        checked={anomalyIndices}
                                        onCheckedChange={(checked) => setAnomalyIndices(!!checked)}
                                        className="mr-2"
                                    />
                                    <Label htmlFor="anomalyIndices" className="text-sm font-medium">
                                        Anomaly indices
                                    </Label>
                                </div>
                                <p className="text-xs mt-1 ml-6 text-gray-600">
                                    The anomaly index measures how unusual a case is with respect to its peer group. This option displays the
                                    distribution of anomaly index values among unusual cases.
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center">
                                    <Checkbox
                                        id="reasonOccurrence"
                                        checked={reasonOccurrence}
                                        onCheckedChange={(checked) => setReasonOccurrence(!!checked)}
                                        className="mr-2"
                                    />
                                    <Label htmlFor="reasonOccurrence" className="text-sm font-medium">
                                        Reason occurrence by analysis variable
                                    </Label>
                                </div>
                                <p className="text-xs mt-1 ml-6 text-gray-600">
                                    Reports how often each analysis variable was responsible for a case being considered unusual.
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center">
                                    <Checkbox
                                        id="caseProcessed"
                                        checked={caseProcessed}
                                        onCheckedChange={(checked) => setCaseProcessed(!!checked)}
                                        className="mr-2"
                                    />
                                    <Label htmlFor="caseProcessed" className="text-sm font-medium">
                                        Case processed
                                    </Label>
                                </div>
                                <p className="text-xs mt-1 ml-6 text-gray-600">
                                    Summarizes the distribution of cases included and excluded from the analysis.
                                </p>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Save Tab Content */}
                <TabsContent value="save" className="p-4">
                    <div className="border rounded-md p-4 mb-4">
                        <div className="text-sm font-medium mb-2">Save Variables</div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center">
                                        <Checkbox
                                            id="saveAnomalyIndex"
                                            checked={saveAnomalyIndex}
                                            onCheckedChange={(checked) => setSaveAnomalyIndex(!!checked)}
                                            className="mr-2"
                                        />
                                        <Label htmlFor="saveAnomalyIndex" className="text-sm font-medium">
                                            Anomaly index
                                        </Label>
                                    </div>
                                    <p className="text-xs mt-1 ml-6 text-gray-600">
                                        Measures the unusualness of each case with respect to its peer
                                    </p>
                                </div>

                                <div className="flex items-center">
                                    <Label htmlFor="anomalyIndexName" className="text-xs whitespace-nowrap mr-2">
                                        Name:
                                    </Label>
                                    <Input
                                        id="anomalyIndexName"
                                        value={anomalyIndexName}
                                        onChange={(e) => setAnomalyIndexName(e.target.value)}
                                        className="h-7 text-sm"
                                        disabled={!saveAnomalyIndex}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center">
                                        <Checkbox
                                            id="savePeerGroups"
                                            checked={savePeerGroups}
                                            onCheckedChange={(checked) => setSavePeerGroups(!!checked)}
                                            className="mr-2"
                                        />
                                        <Label htmlFor="savePeerGroups" className="text-sm font-medium">
                                            Peer groups
                                        </Label>
                                    </div>
                                    <p className="text-xs mt-1 ml-6 text-gray-600">
                                        Three variables are saved per peer group: ID, case count, and size
                                        as a percentage of cases in the analysis.
                                    </p>
                                </div>

                                <div className="flex items-center">
                                    <Label htmlFor="peerGroupsRootName" className="text-xs whitespace-nowrap mr-2">
                                        Root Name:
                                    </Label>
                                    <Input
                                        id="peerGroupsRootName"
                                        value={peerGroupsRootName}
                                        onChange={(e) => setPeerGroupsRootName(e.target.value)}
                                        className="h-7 text-sm"
                                        disabled={!savePeerGroups}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center">
                                        <Checkbox
                                            id="saveReasons"
                                            checked={saveReasons}
                                            onCheckedChange={(checked) => setSaveReasons(!!checked)}
                                            className="mr-2"
                                        />
                                        <Label htmlFor="saveReasons" className="text-sm font-medium">
                                            Reasons
                                        </Label>
                                    </div>
                                    <p className="text-xs mt-1 ml-6 text-gray-600">
                                        Four variables are saved per reason: name of reason variable,
                                        value of reason variable, peer group norm, and impact measure for
                                        the reason variable.
                                    </p>
                                </div>

                                <div className="flex items-center">
                                    <Label htmlFor="reasonsRootName" className="text-xs whitespace-nowrap mr-2">
                                        Root Name:
                                    </Label>
                                    <Input
                                        id="reasonsRootName"
                                        value={reasonsRootName}
                                        onChange={(e) => setReasonsRootName(e.target.value)}
                                        className="h-7 text-sm"
                                        disabled={!saveReasons}
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-2">
                                <div className="flex items-center">
                                    <Checkbox
                                        id="replaceExisting"
                                        checked={replaceExisting}
                                        onCheckedChange={(checked) => setReplaceExisting(!!checked)}
                                        className="mr-2"
                                    />
                                    <Label htmlFor="replaceExisting" className="text-sm">
                                        Replace existing variables that have the same name or root name
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-md p-4">
                        <div className="text-sm font-medium mb-2">Export Model File</div>
                        <div className="flex items-center">
                            <Label htmlFor="exportFile" className="text-xs whitespace-nowrap mr-2">
                                File:
                            </Label>
                            <Input
                                id="exportFile"
                                value={exportFilePath}
                                onChange={(e) => setExportFilePath(e.target.value)}
                                className="h-7 text-sm mr-2"
                            />
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                                Browse...
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Missing Values Tab Content */}
                <TabsContent value="missingValues" className="p-4">
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="excludeMissing"
                                name="missingValuesOption"
                                checked={missingValuesOption === "exclude"}
                                onChange={() => setMissingValuesOption("exclude")}
                                className="w-4 h-4 mr-2"
                            />
                            <Label htmlFor="excludeMissing" className="text-sm font-medium">
                                Exclude missing values from analysis
                            </Label>
                        </div>
                        <p className="text-xs ml-6 text-gray-600">
                            User- and system-missing values are excluded.
                        </p>

                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="includeMissing"
                                name="missingValuesOption"
                                checked={missingValuesOption === "include"}
                                onChange={() => setMissingValuesOption("include")}
                                className="w-4 h-4 mr-2"
                            />
                            <Label htmlFor="includeMissing" className="text-sm font-medium">
                                Include missing values in analysis
                            </Label>
                        </div>
                        <p className="text-xs ml-6 text-gray-600">
                            For scale variables, user- and system-missing values are replaced with the variable's grand mean. For categorical
                            variables, user- and system-missing values are combined and included in the analysis as a category.
                        </p>

                        <div className="flex items-center mt-4">
                            <Checkbox
                                id="useProportionMissing"
                                checked={useProportionMissing}
                                onCheckedChange={(checked) => setUseProportionMissing(!!checked)}
                                className="mr-2"
                            />
                            <Label htmlFor="useProportionMissing" className="text-sm">
                                Use proportion of missing values per case as analysis variable
                            </Label>
                        </div>
                    </div>
                </TabsContent>

                {/* Options Tab Content */}
                <TabsContent value="options" className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded-md p-4">
                            <div className="text-sm font-medium mb-2">Criteria for Identifying Unusual Cases</div>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            id="percentageCriteria"
                                            name="identificationCriteria"
                                            checked={identificationCriteria === "percentage"}
                                            onChange={() => setIdentificationCriteria("percentage")}
                                            className="w-4 h-4 mr-2"
                                        />
                                        <Label htmlFor="percentageCriteria" className="text-sm">
                                            Percentage of cases with highest anomaly index values
                                        </Label>
                                    </div>
                                    <div className="ml-6 mt-1">
                                        <div className="flex items-center">
                                            <Label htmlFor="percentageValue" className="text-xs mr-2">
                                                Percentage:
                                            </Label>
                                            <Input
                                                id="percentageValue"
                                                value={percentageValue}
                                                onChange={(e) => setPercentageValue(e.target.value)}
                                                className="h-7 text-sm w-24"
                                                disabled={identificationCriteria !== "percentage"}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            id="fixedNumberCriteria"
                                            name="identificationCriteria"
                                            checked={identificationCriteria === "fixed"}
                                            onChange={() => setIdentificationCriteria("fixed")}
                                            className="w-4 h-4 mr-2"
                                        />
                                        <Label htmlFor="fixedNumberCriteria" className="text-sm">
                                            Fixed number of cases with highest anomaly index values
                                        </Label>
                                    </div>
                                    <div className="ml-6 mt-1">
                                        <div className="flex items-center">
                                            <Label htmlFor="fixedNumber" className="text-xs mr-2">
                                                Number:
                                            </Label>
                                            <Input
                                                id="fixedNumber"
                                                value={fixedNumber}
                                                onChange={(e) => setFixedNumber(e.target.value)}
                                                className="h-7 text-sm w-24"
                                                disabled={identificationCriteria !== "fixed"}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center">
                                        <Checkbox
                                            id="useMinimumValue"
                                            checked={useMinimumValue}
                                            onCheckedChange={(checked) => setUseMinimumValue(!!checked)}
                                            className="mr-2"
                                        />
                                        <Label htmlFor="useMinimumValue" className="text-sm">
                                            Identify only cases whose anomaly index value meets or exceeds a minimum value
                                        </Label>
                                    </div>
                                    <div className="ml-6 mt-1">
                                        <div className="flex items-center">
                                            <Label htmlFor="cutoffValue" className="text-xs mr-2">
                                                Cutoff:
                                            </Label>
                                            <Input
                                                id="cutoffValue"
                                                value={cutoffValue}
                                                onChange={(e) => setCutoffValue(e.target.value)}
                                                className="h-7 text-sm w-24"
                                                disabled={!useMinimumValue}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border rounded-md p-4">
                            <div className="text-sm font-medium mb-2">Number of Peer Groups</div>

                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <Label htmlFor="minPeerGroups" className="text-xs mr-2 w-16">
                                        Minimum:
                                    </Label>
                                    <Input
                                        id="minPeerGroups"
                                        value={minPeerGroups}
                                        onChange={(e) => setMinPeerGroups(e.target.value)}
                                        className="h-7 text-sm w-24"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <Label htmlFor="maxPeerGroups" className="text-xs mr-2 w-16">
                                        Maximum:
                                    </Label>
                                    <Input
                                        id="maxPeerGroups"
                                        value={maxPeerGroups}
                                        onChange={(e) => setMaxPeerGroups(e.target.value)}
                                        className="h-7 text-sm w-24"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center">
                            <Label htmlFor="maxReasons" className="text-sm mr-2">
                                Maximum Number of Reasons:
                            </Label>
                            <Input
                                id="maxReasons"
                                value={maxReasons}
                                onChange={(e) => setMaxReasons(e.target.value)}
                                className="h-7 text-sm w-24"
                            />
                        </div>
                        <p className="text-xs mt-2 text-gray-600">
                            Specify the number of reasons reported in output and added to the active dataset if reason variables are saved. The value
                            is adjusted downward if it exceeds the number of analysis variables.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>

            <DialogFooter className="flex justify-center space-x-2 p-3 border-t">
                <Button
                    size="sm"
                    className="text-xs h-7"
                    onClick={handleConfirm}
                >
                    OK
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                >
                    Paste
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                >
                    Reset
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={onClose}
                >
                    Cancel
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                >
                    Help
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default IdentifyUnusualCases;