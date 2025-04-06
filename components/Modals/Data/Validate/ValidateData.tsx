"use client";

import React, { FC, useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useVariableStore } from "@/stores/useVariableStore";
import { useMetaStore } from "@/stores/useMetaStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import DefineValidationRules from "./DefineValidationRules";
import { cn } from "@/lib/utils";

interface ValidateDataProps {
    isOpen: boolean;
    onClose: () => void;
}

interface VariablesTabState {
    analysisVariables: string[];
    caseIdentifierVariables: string[];
}

interface BasicChecksTabState {
    flagVariables: boolean;
    maxMissingPercentage: number;
    maxSingleCategoryPercentage: number;
    maxCategoriesWithCountOfOnePercentage: number;
    minCoefficientOfVariation: number;
    minStandardDeviation: number;
    flagIncompleteIDs: boolean;
    flagDuplicateIDs: boolean;
    flagEmptyCases: boolean;
    emptyCasesScope: "all" | "analysis";
}

interface OutputTabState {
    listViolationsByCase: boolean;
    minViolationsForInclusion: number;
    maxCasesInReport: number;
    summarizeViolationsByVariable: boolean;
    summarizeViolationsByRule: boolean;
    displayDescriptiveStatistics: boolean;
    moveCasesWithViolationsToTop: boolean;
}

interface SaveTabState {
    saveEmptyCaseIndicator: boolean;
    saveDuplicateIDGroup: boolean;
    saveIncompleteIDIndicator: boolean;
    saveValidationRuleViolations: boolean;
    replaceExistingSummaryVariables: boolean;
    saveIndicatorVariables: boolean;
}

const ValidateData: FC<ValidateDataProps> = ({ isOpen, onClose }) => {
    const { variables } = useVariableStore();
    const { meta } = useMetaStore();

    // Active tab state
    const [activeTab, setActiveTab] = useState("variables");

    // Define Rules modal state
    const [isDefineRulesOpen, setIsDefineRulesOpen] = useState(false);
    const [defineRulesType, setDefineRulesType] = useState<"single" | "cross">("single");

    // Tab states
    const [variablesState, setVariablesState] = useState<VariablesTabState>({
        analysisVariables: [],
        caseIdentifierVariables: []
    });

    const [basicChecksState, setBasicChecksState] = useState<BasicChecksTabState>({
        flagVariables: true,
        maxMissingPercentage: 70,
        maxSingleCategoryPercentage: 95,
        maxCategoriesWithCountOfOnePercentage: 90,
        minCoefficientOfVariation: 0.001,
        minStandardDeviation: 0,
        flagIncompleteIDs: true,
        flagDuplicateIDs: true,
        flagEmptyCases: true,
        emptyCasesScope: "all"
    });

    const [outputState, setOutputState] = useState<OutputTabState>({
        listViolationsByCase: true,
        minViolationsForInclusion: 1,
        maxCasesInReport: 100,
        summarizeViolationsByVariable: true,
        summarizeViolationsByRule: false,
        displayDescriptiveStatistics: false,
        moveCasesWithViolationsToTop: false
    });

    const [saveState, setSaveState] = useState<SaveTabState>({
        saveEmptyCaseIndicator: false,
        saveDuplicateIDGroup: false,
        saveIncompleteIDIndicator: false,
        saveValidationRuleViolations: true,
        replaceExistingSummaryVariables: false,
        saveIndicatorVariables: false
    });

    // Scan state for Single-Variable Rules tab
    const [scanLimitEnabled, setScanLimitEnabled] = useState(true);
    const [scanLimit, setScanLimit] = useState(5000);
    const [scannedCases, setScannedCases] = useState(0);
    const [variableDisplay, setVariableDisplay] = useState<"all" | "numeric" | "string" | "date">("all");

    // Effect to perform initial scan on open
    useEffect(() => {
        if (isOpen) {
            // Simulate scanning data
            setScannedCases(Math.min(scanLimit, 10000));
        }
    }, [isOpen, scanLimit]);

    // Open define rules modal
    const handleOpenDefineRules = (type: "single" | "cross") => {
        setDefineRulesType(type);
        setIsDefineRulesOpen(true);
    };

    // Close define rules modal
    const handleCloseDefineRules = () => {
        setIsDefineRulesOpen(false);
    };

    // Handle variable selection
    const handleVariableSelect = (variable: string, type: "analysis" | "caseId") => {
        if (type === "analysis") {
            if (variablesState.analysisVariables.includes(variable)) {
                setVariablesState({
                    ...variablesState,
                    analysisVariables: variablesState.analysisVariables.filter(v => v !== variable)
                });
            } else {
                setVariablesState({
                    ...variablesState,
                    analysisVariables: [...variablesState.analysisVariables, variable]
                });
            }
        } else {
            if (variablesState.caseIdentifierVariables.includes(variable)) {
                setVariablesState({
                    ...variablesState,
                    caseIdentifierVariables: variablesState.caseIdentifierVariables.filter(v => v !== variable)
                });
            } else {
                setVariablesState({
                    ...variablesState,
                    caseIdentifierVariables: [...variablesState.caseIdentifierVariables, variable]
                });
            }
        }
    };

    // Handle OK button
    const handleConfirm = () => {
        // Save validation settings to store (could be implemented if needed)
        onClose();
    };

    // Handle rescan
    const handleRescan = () => {
        // Simulate scanning data
        setScannedCases(Math.min(scanLimit, 10000));
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-[800px] p-0 bg-[#F0F0F0] border max-h-[90vh] overflow-hidden">
                    <DialogHeader className="px-6 py-2 bg-[#F0F0F0] border-b border-[#CCCCCC]">
                        <DialogTitle className="text-base font-semibold">Validate Data</DialogTitle>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                        <div className="border-b border-[#CCCCCC] bg-[#F0F0F0]">
                            <TabsList className="bg-transparent h-8 w-full rounded-none justify-start">
                                {["Variables", "Basic Checks", "Single-Variable Rules", "Cross-Variable Rules", "Output", "Save"].map((tab) => (
                                    <TabsTrigger
                                        key={tab}
                                        value={tab.toLowerCase().replace(/-/g, "")}
                                        className={`px-3 h-7 text-xs rounded-t-md rounded-b-none border ${
                                            activeTab === tab.toLowerCase().replace(/-/g, "")
                                                ? 'bg-[#FFD980] border-[#999999] text-black font-medium'
                                                : activeTab === "variables" && tab === "Variables" ? 'bg-[#7CB9FF] border-[#999999] text-black'
                                                    : activeTab === "basicchecks" && tab === "Basic Checks" ? 'bg-[#7CB9FF] border-[#999999] text-black'
                                                        : activeTab === "singlevariablerules" && tab === "Single-Variable Rules" ? 'bg-[#7CB9FF] border-[#999999] text-black'
                                                            : activeTab === "crossvariablerules" && tab === "Cross-Variable Rules" ? 'bg-[#7CB9FF] border-[#999999] text-black'
                                                                : activeTab === "output" && tab === "Output" ? 'bg-[#7CB9FF] border-[#999999] text-black'
                                                                    : activeTab === "save" && tab === "Save" ? 'bg-[#7CB9FF] border-[#999999] text-black'
                                                                        : 'bg-[#D9D9D9] border-[#999999] text-[#333333]'
                                        } transition-colors`}
                                    >
                                        {tab}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 overflow-auto bg-[#F0F0F0]">
                            {/* Variables Tab */}
                            <TabsContent value="variables" className="p-4">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <div className="text-xs font-semibold mb-2 text-[#333333]">Variables:</div>
                                        <div className="border border-[#999999] bg-white h-[200px] overflow-auto">
                                            {variables.map((variable, index) => (
                                                <div
                                                    key={index}
                                                    className="p-1 text-xs border-b border-[#E6E6E6] hover:bg-[#E8F1FC] cursor-pointer flex items-center"
                                                    onClick={() => handleVariableSelect(variable.name, "analysis")}
                                                >
                                                    <div className="w-4 h-4 mr-1">
                                                        {variable.type === "NUMERIC" ? "🔢" : variable.type === "STRING" ? "📝" : "📅"}
                                                    </div>
                                                    <span>{variable.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <div className="text-xs font-semibold mb-2 text-[#333333]">Analysis Variables:</div>
                                            <div className="border border-[#999999] bg-[#E6E6E6] h-[100px] overflow-auto">
                                                {variablesState.analysisVariables.map((variable, index) => (
                                                    <div
                                                        key={index}
                                                        className="p-1 text-xs border-b border-[#CCCCCC] hover:bg-[#D9D9D9] cursor-pointer flex items-center"
                                                        onClick={() => handleVariableSelect(variable, "analysis")}
                                                    >
                                                        <div className="w-4 h-4 mr-1">
                                                            {variables.find(v => v.name === variable)?.type === "NUMERIC" ? "🔢" :
                                                                variables.find(v => v.name === variable)?.type === "STRING" ? "📝" : "📅"}
                                                        </div>
                                                        <span>{variable}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2 h-6 w-6 p-0 bg-[#7CB9FF] border-[#1A72C9] hover:bg-[#5A9FE2]"
                                            >
                                                ⟵
                                            </Button>
                                        </div>

                                        <div>
                                            <div className="text-xs font-semibold mb-2 text-[#333333]">Case Identifier Variables:</div>
                                            <div className="border border-[#999999] bg-[#FFFBD6] h-[100px] overflow-auto">
                                                {variablesState.caseIdentifierVariables.map((variable, index) => (
                                                    <div
                                                        key={index}
                                                        className="p-1 text-xs border-b border-[#CCCCCC] hover:bg-[#FFE285] cursor-pointer flex items-center"
                                                        onClick={() => handleVariableSelect(variable, "caseId")}
                                                    >
                                                        <div className="w-4 h-4 mr-1">
                                                            {variables.find(v => v.name === variable)?.type === "NUMERIC" ? "🔢" :
                                                                variables.find(v => v.name === variable)?.type === "STRING" ? "📝" : "📅"}
                                                        </div>
                                                        <span>{variable}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2 h-6 w-6 p-0 bg-[#7CB9FF] border-[#1A72C9] hover:bg-[#5A9FE2]"
                                            >
                                                ⟵
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Basic Checks Tab */}
                            <TabsContent value="basicchecks" className="p-4">
                                <div className="space-y-6">
                                    <div className="border border-[#999999] bg-white p-4 rounded-sm">
                                        <div className="text-xs font-semibold mb-4 text-[#333333]">Analysis Variables</div>

                                        <div className="flex items-center mb-4">
                                            <Checkbox
                                                id="flagVariables"
                                                checked={basicChecksState.flagVariables}
                                                onCheckedChange={(checked) => setBasicChecksState({...basicChecksState, flagVariables: Boolean(checked)})}
                                                className="mr-2 h-3.5 w-3.5"
                                            />
                                            <Label htmlFor="flagVariables" className="text-xs text-[#333333] font-medium">
                                                Flag variables that fail any of the following checks
                                            </Label>
                                        </div>

                                        <div className="grid grid-cols-[250px_80px_1fr] items-center mb-3">
                                            <Label htmlFor="maxMissingPercentage" className="text-xs text-[#333333]">
                                                Maximum percentage of missing values:
                                            </Label>
                                            <Input
                                                id="maxMissingPercentage"
                                                type="number"
                                                value={basicChecksState.maxMissingPercentage}
                                                onChange={(e) => setBasicChecksState({...basicChecksState, maxMissingPercentage: Number(e.target.value)})}
                                                className="h-6 text-xs border-[#999999] bg-white"
                                            />
                                            <span className="text-xs text-[#666666] ml-2">(Applies to all variables)</span>
                                        </div>

                                        <div className="grid grid-cols-[250px_80px_1fr] items-center mb-3">
                                            <Label htmlFor="maxSingleCategoryPercentage" className="text-xs text-[#333333]">
                                                Maximum percentage of cases in a single category:
                                            </Label>
                                            <Input
                                                id="maxSingleCategoryPercentage"
                                                type="number"
                                                value={basicChecksState.maxSingleCategoryPercentage}
                                                onChange={(e) => setBasicChecksState({...basicChecksState, maxSingleCategoryPercentage: Number(e.target.value)})}
                                                className="h-6 text-xs border-[#999999] bg-white"
                                            />
                                            <span className="text-xs text-[#666666] ml-2">(Applies to categorical variables only)</span>
                                        </div>

                                        <div className="grid grid-cols-[250px_80px_1fr] items-center mb-3">
                                            <Label htmlFor="maxCategoriesWithCountOfOnePercentage" className="text-xs text-[#333333]">
                                                Maximum percentage of categories with count of 1:
                                            </Label>
                                            <Input
                                                id="maxCategoriesWithCountOfOnePercentage"
                                                type="number"
                                                value={basicChecksState.maxCategoriesWithCountOfOnePercentage}
                                                onChange={(e) => setBasicChecksState({...basicChecksState, maxCategoriesWithCountOfOnePercentage: Number(e.target.value)})}
                                                className="h-6 text-xs border-[#999999] bg-white"
                                            />
                                            <span className="text-xs text-[#666666] ml-2">(Applies to categorical variables only)</span>
                                        </div>

                                        <div className="grid grid-cols-[250px_80px_1fr] items-center mb-3">
                                            <Label htmlFor="minCoefficientOfVariation" className="text-xs text-[#666666]">
                                                Minimum coefficient of variation:
                                            </Label>
                                            <Input
                                                id="minCoefficientOfVariation"
                                                type="number"
                                                value={basicChecksState.minCoefficientOfVariation}
                                                onChange={(e) => setBasicChecksState({...basicChecksState, minCoefficientOfVariation: Number(e.target.value)})}
                                                className="h-6 text-xs border-[#999999] bg-white"
                                            />
                                            <span className="text-xs text-[#666666] ml-2">(Applies to scale variables only)</span>
                                        </div>

                                        <div className="grid grid-cols-[250px_80px_1fr] items-center mb-3">
                                            <Label htmlFor="minStandardDeviation" className="text-xs text-[#666666]">
                                                Minimum standard deviation:
                                            </Label>
                                            <Input
                                                id="minStandardDeviation"
                                                type="number"
                                                value={basicChecksState.minStandardDeviation}
                                                onChange={(e) => setBasicChecksState({...basicChecksState, minStandardDeviation: Number(e.target.value)})}
                                                className="h-6 text-xs border-[#999999] bg-white"
                                            />
                                            <span className="text-xs text-[#666666] ml-2">(Applies to scale variables only)</span>
                                        </div>
                                    </div>

                                    <div className="border border-[#999999] bg-white p-4 rounded-sm">
                                        <div className="text-xs font-semibold mb-4 text-[#333333]">Case Identifiers</div>

                                        <div className="flex items-center mb-3">
                                            <Checkbox
                                                id="flagIncompleteIDs"
                                                checked={basicChecksState.flagIncompleteIDs}
                                                onCheckedChange={(checked) => setBasicChecksState({...basicChecksState, flagIncompleteIDs: Boolean(checked)})}
                                                className="mr-2 h-3.5 w-3.5"
                                            />
                                            <Label htmlFor="flagIncompleteIDs" className="text-xs text-[#333333]">
                                                Flag incomplete IDs
                                            </Label>
                                        </div>

                                        <div className="flex items-center mb-3">
                                            <Checkbox
                                                id="flagDuplicateIDs"
                                                checked={basicChecksState.flagDuplicateIDs}
                                                onCheckedChange={(checked) => setBasicChecksState({...basicChecksState, flagDuplicateIDs: Boolean(checked)})}
                                                className="mr-2 h-3.5 w-3.5"
                                            />
                                            <Label htmlFor="flagDuplicateIDs" className="text-xs text-[#333333]">
                                                Flag duplicate IDs
                                            </Label>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <Checkbox
                                            id="flagEmptyCases"
                                            checked={basicChecksState.flagEmptyCases}
                                            onCheckedChange={(checked) => setBasicChecksState({...basicChecksState, flagEmptyCases: Boolean(checked)})}
                                            className="mr-2 h-3.5 w-3.5"
                                        />
                                        <Label htmlFor="flagEmptyCases" className="text-xs text-[#333333] mr-4">
                                            Flag empty cases
                                        </Label>

                                        <Label className="text-xs text-[#333333] mr-2">Define Cases By:</Label>
                                        <Select
                                            value={basicChecksState.emptyCasesScope}
                                            onValueChange={(value: "all" | "analysis") => setBasicChecksState({...basicChecksState, emptyCasesScope: value})}
                                        >
                                            <SelectTrigger className="h-6 text-xs bg-[#F0F0F0] border-[#999999] w-64">
                                                <SelectValue placeholder="Select scope" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-[#999999]">
                                                <SelectItem value="all">All variables in dataset except ID variables</SelectItem>
                                                <SelectItem value="analysis">Analysis variables only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="text-xs text-[#666666] mt-2">
                                        A case is considered empty if all relevant variables are missing or blank.
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Single-Variable Rules Tab */}
                            <TabsContent value="singlevariablerules" className="p-4">
                                <div className="text-xs text-[#333333] mb-4">
                                    To apply rules to a variable, select the variable then check one or more rules.
                                </div>
                                <div className="text-xs text-[#333333] mb-4">
                                    The Analysis Variables list shows distributions of nonmissing values based on a scan of the data. The Rules list shows all rules
                                    that can be applied to selected variables.
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <div className="text-xs font-semibold mb-2 text-[#333333]">Analysis Variables:</div>
                                        <div className="border border-[#999999] bg-white overflow-hidden">
                                            <table className="w-full">
                                                <thead>
                                                <tr className="bg-[#E6E6E6]">
                                                    <th className="text-left px-2 py-1 text-xs font-medium text-[#333333] border-b border-[#999999]">Variable</th>
                                                    <th className="text-left px-2 py-1 text-xs font-medium text-[#333333] border-b border-[#999999]">Distribution</th>
                                                    <th className="text-left px-2 py-1 text-xs font-medium text-[#333333] border-b border-[#999999]">Minimum</th>
                                                    <th className="text-left px-2 py-1 text-xs font-medium text-[#333333] border-b border-[#999999]">Maximum</th>
                                                    <th className="text-left px-2 py-1 text-xs font-medium text-[#333333] border-b border-[#999999]">Rules</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {variablesState.analysisVariables.map((variable, index) => {
                                                    const varObj = variables.find(v => v.name === variable);
                                                    return (
                                                        <tr key={index} className="border-b border-[#CCCCCC] hover:bg-[#E8F1FC]">
                                                            <td className="px-2 py-1 text-xs">{variable}</td>
                                                            <td className="px-2 py-1 text-xs">
                                                                {/* Simple bars to represent distribution */}
                                                                <div className="flex h-3 w-20 space-x-px">
                                                                    <div className="bg-[#FFD980] h-full" style={{width: '25%'}}></div>
                                                                    <div className="bg-[#FFD980] h-full" style={{width: '40%'}}></div>
                                                                    <div className="bg-[#FFD980] h-full" style={{width: '20%'}}></div>
                                                                    <div className="bg-[#FFD980] h-full" style={{width: '15%'}}></div>
                                                                </div>
                                                            </td>
                                                            <td className="px-2 py-1 text-xs">
                                                                {varObj?.type === "NUMERIC" ? "0" : varObj?.type === "STRING" ? "A" : "2023-01-01"}
                                                            </td>
                                                            <td className="px-2 py-1 text-xs">
                                                                {varObj?.type === "NUMERIC" ? "100" : varObj?.type === "STRING" ? "Z" : "2023-12-31"}
                                                            </td>
                                                            <td className="px-2 py-1 text-xs">
                                                                {meta.singleVarRules?.filter(rule =>
                                                                    (rule.type === "Numeric" && varObj?.type === "NUMERIC") ||
                                                                    (rule.type === "String" && varObj?.type === "STRING") ||
                                                                    (rule.type === "Date" && varObj?.type === "DATE")
                                                                ).length || 0}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs font-semibold mb-2 text-[#333333]">Rules:</div>
                                        <div className="border border-[#999999] bg-white overflow-hidden h-[150px]">
                                            <table className="w-full">
                                                <thead>
                                                <tr className="bg-[#E6E6E6]">
                                                    <th className="text-left px-2 py-1 text-xs font-medium text-[#333333] border-b border-[#999999]">Apply</th>
                                                    <th className="text-left px-2 py-1 text-xs font-medium text-[#333333] border-b border-[#999999]">Name</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {meta.singleVarRules?.map((rule, index) => (
                                                    <tr key={rule.id} className="border-b border-[#CCCCCC] hover:bg-[#E8F1FC]">
                                                        <td className="px-2 py-1 text-xs">
                                                            <Checkbox className="h-3.5 w-3.5" />
                                                        </td>
                                                        <td className="px-2 py-1 text-xs">{rule.name}</td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between mt-6">
                                    <div className="flex items-center">
                                        <Label className="text-xs text-[#333333] mr-2">Display:</Label>
                                        <Select
                                            value={variableDisplay}
                                            onValueChange={(value: "all" | "numeric" | "string" | "date") => setVariableDisplay(value)}
                                        >
                                            <SelectTrigger className="h-6 text-xs bg-[#F0F0F0] border-[#999999] w-32">
                                                <SelectValue placeholder="Select display" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-[#999999]">
                                                <SelectItem value="all">All variables</SelectItem>
                                                <SelectItem value="numeric">Numeric</SelectItem>
                                                <SelectItem value="string">String</SelectItem>
                                                <SelectItem value="date">Date</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <div className="ml-8 text-xs text-[#333333]">
                                            Cases Scanned: {scannedCases}
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="bg-[#7CB9FF] border-[#1A72C9] hover:bg-[#5A9FE2] text-xs h-6 px-3"
                                        onClick={() => handleOpenDefineRules("single")}
                                    >
                                        Define Rules...
                                    </Button>
                                </div>

                                <div className="border border-[#999999] bg-white p-2 mt-4 rounded-sm">
                                    <div className="flex items-center mb-2">
                                        <Checkbox
                                            id="limitScan"
                                            checked={scanLimitEnabled}
                                            onCheckedChange={(checked) => setScanLimitEnabled(Boolean(checked))}
                                            className="mr-2 h-3.5 w-3.5"
                                        />
                                        <Label htmlFor="limitScan" className="text-xs text-[#333333] mr-2">
                                            Limit number of cases scanned
                                        </Label>
                                        <Label htmlFor="scanLimit" className="text-xs text-[#333333] mr-2">
                                            Cases:
                                        </Label>
                                        <Input
                                            id="scanLimit"
                                            type="number"
                                            value={scanLimit}
                                            onChange={(e) => setScanLimit(Number(e.target.value))}
                                            className="h-6 text-xs border-[#999999] bg-white w-20 mr-4"
                                            disabled={!scanLimitEnabled}
                                        />
                                        <Button
                                            variant="outline"
                                            className="bg-[#7CB9FF] border-[#1A72C9] hover:bg-[#5A9FE2] text-xs h-6 px-3"
                                            onClick={handleRescan}
                                        >
                                            Rescan
                                        </Button>
                                        <div className="ml-4 text-xs text-[#333333]">
                                            Limiting the number of cases scanned does not affect how many cases are validated.
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Cross-Variable Rules Tab */}
                            <TabsContent value="crossvariablerules" className="p-4">
                                <div className="mb-4">
                                    <div className="text-xs font-semibold mb-2 text-[#333333]">Rules:</div>
                                    <div className="border border-[#999999] bg-white overflow-hidden">
                                        <table className="w-full">
                                            <thead>
                                            <tr className="bg-[#E6E6E6]">
                                                <th className="text-left px-2 py-1 text-xs font-medium text-[#333333] border-b border-[#999999]">Apply</th>
                                                <th className="text-left px-2 py-1 text-xs font-medium text-[#333333] border-b border-[#999999]">Name</th>
                                                <th className="text-left px-2 py-1 text-xs font-medium text-[#333333] border-b border-[#999999]">Expression</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {meta.crossVarRules?.map((rule, index) => (
                                                <tr key={rule.id} className="border-b border-[#CCCCCC] hover:bg-[#E8F1FC]">
                                                    <td className="px-2 py-1 text-xs w-10">
                                                        <Checkbox className="h-3.5 w-3.5" defaultChecked={index === 0} />
                                                    </td>
                                                    <td className="px-2 py-1 text-xs w-40">{rule.name}</td>
                                                    <td className="px-2 py-1 text-xs">{rule.expression}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    className="bg-[#7CB9FF] border-[#1A72C9] hover:bg-[#5A9FE2] text-xs h-6 px-3 mt-2"
                                    onClick={() => handleOpenDefineRules("cross")}
                                >
                                    Define Rules...
                                </Button>
                            </TabsContent>

                            {/* Output Tab */}
                            <TabsContent value="output" className="p-4">
                                <div className="space-y-6">
                                    <div className="border border-[#999999] bg-white p-4 rounded-sm">
                                        <div className="text-xs font-semibold mb-2 text-[#333333]">Casewise Report</div>

                                        <div className="flex items-center mb-4">
                                            <Checkbox
                                                id="listViolationsByCase"
                                                checked={outputState.listViolationsByCase}
                                                onCheckedChange={(checked) => setOutputState({...outputState, listViolationsByCase: Boolean(checked)})}
                                                className="mr-2 h-3.5 w-3.5"
                                            />
                                            <Label htmlFor="listViolationsByCase" className="text-xs text-[#333333]">
                                                List validation rule violations by case
                                            </Label>
                                        </div>

                                        <div className="grid grid-cols-[250px_80px] items-center mb-3 ml-6">
                                            <Label htmlFor="minViolationsForInclusion" className="text-xs text-[#666666]">
                                                Minimum Number of Violations for a Case to be Included:
                                            </Label>
                                            <Input
                                                id="minViolationsForInclusion"
                                                type="number"
                                                value={outputState.minViolationsForInclusion}
                                                onChange={(e) => setOutputState({...outputState, minViolationsForInclusion: Number(e.target.value)})}
                                                className="h-6 text-xs border-[#999999] bg-white"
                                                disabled={!outputState.listViolationsByCase}
                                            />
                                        </div>

                                        <div className="grid grid-cols-[250px_80px] items-center mb-3 ml-6">
                                            <Label htmlFor="maxCasesInReport" className="text-xs text-[#666666]">
                                                Maximum Number of Cases in Report:
                                            </Label>
                                            <Input
                                                id="maxCasesInReport"
                                                type="number"
                                                value={outputState.maxCasesInReport}
                                                onChange={(e) => setOutputState({...outputState, maxCasesInReport: Number(e.target.value)})}
                                                className="h-6 text-xs border-[#999999] bg-white"
                                                disabled={!outputState.listViolationsByCase}
                                            />
                                        </div>
                                    </div>

                                    <div className="border border-[#999999] bg-white p-4 rounded-sm">
                                        <div className="text-xs font-semibold mb-2 text-[#333333]">Single-Variable Validation Rules</div>

                                        <div className="flex items-center mb-3">
                                            <Checkbox
                                                id="summarizeViolationsByVariable"
                                                checked={outputState.summarizeViolationsByVariable}
                                                onCheckedChange={(checked) => setOutputState({...outputState, summarizeViolationsByVariable: Boolean(checked)})}
                                                className="mr-2 h-3.5 w-3.5"
                                            />
                                            <Label htmlFor="summarizeViolationsByVariable" className="text-xs text-[#333333]">
                                                Summarize violations by analysis variable
                                            </Label>
                                        </div>

                                        <div className="flex items-center mb-3">
                                            <Checkbox
                                                id="summarizeViolationsByRule"
                                                checked={outputState.summarizeViolationsByRule}
                                                onCheckedChange={(checked) => setOutputState({...outputState, summarizeViolationsByRule: Boolean(checked)})}
                                                className="mr-2 h-3.5 w-3.5"
                                            />
                                            <Label htmlFor="summarizeViolationsByRule" className="text-xs text-[#333333]">
                                                Summarize violations by rule
                                            </Label>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <Checkbox
                                            id="displayDescriptiveStatistics"
                                            checked={outputState.displayDescriptiveStatistics}
                                            onCheckedChange={(checked) => setOutputState({...outputState, displayDescriptiveStatistics: Boolean(checked)})}
                                            className="mr-2 h-3.5 w-3.5"
                                        />
                                        <Label htmlFor="displayDescriptiveStatistics" className="text-xs text-[#333333]">
                                            Display descriptive statistics for analysis variables
                                        </Label>
                                    </div>

                                    <div className="flex items-center mt-3">
                                        <Checkbox
                                            id="moveCasesWithViolationsToTop"
                                            checked={outputState.moveCasesWithViolationsToTop}
                                            onCheckedChange={(checked) => setOutputState({...outputState, moveCasesWithViolationsToTop: Boolean(checked)})}
                                            className="mr-2 h-3.5 w-3.5"
                                        />
                                        <Label htmlFor="moveCasesWithViolationsToTop" className="text-xs text-[#333333]">
                                            Move cases with validation rule violations to the top of the active dataset
                                        </Label>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Save Tab */}
                            <TabsContent value="save" className="p-4">
                                <div className="space-y-6">
                                    <div>
                                        <div className="text-xs font-semibold mb-2 text-[#333333]">Summary Variables:</div>
                                        <div className="border border-[#999999] bg-white overflow-hidden">
                                            <table className="w-full">
                                                <thead>
                                                <tr className="bg-[#E6E6E6]">
                                                    <th className="text-left px-2 py-1 text-xs font-medium text-[#333333] border-b border-[#999999]">Description</th>
                                                    <th className="text-center px-2 py-1 text-xs font-medium text-[#333333] border-b border-[#999999]">Save</th>
                                                    <th className="text-left px-2 py-1 text-xs font-medium text-[#333333] border-b border-[#999999]">Name</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                <tr className="border-b border-[#CCCCCC]">
                                                    <td className="px-2 py-1 text-xs">Empty case indicator</td>
                                                    <td className="px-2 py-1 text-xs text-center">
                                                        <Checkbox
                                                            className="h-3.5 w-3.5"
                                                            checked={saveState.saveEmptyCaseIndicator}
                                                            onCheckedChange={(checked) => setSaveState({...saveState, saveEmptyCaseIndicator: Boolean(checked)})}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1 text-xs">EmptyCase</td>
                                                </tr>
                                                <tr className="border-b border-[#CCCCCC]">
                                                    <td className="px-2 py-1 text-xs">Duplicate ID Group</td>
                                                    <td className="px-2 py-1 text-xs text-center">
                                                        <Checkbox
                                                            className="h-3.5 w-3.5"
                                                            checked={saveState.saveDuplicateIDGroup}
                                                            onCheckedChange={(checked) => setSaveState({...saveState, saveDuplicateIDGroup: Boolean(checked)})}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1 text-xs">DuplicateIDGroup</td>
                                                </tr>
                                                <tr className="border-b border-[#CCCCCC]">
                                                    <td className="px-2 py-1 text-xs">Incomplete ID indicator</td>
                                                    <td className="px-2 py-1 text-xs text-center">
                                                        <Checkbox
                                                            className="h-3.5 w-3.5"
                                                            checked={saveState.saveIncompleteIDIndicator}
                                                            onCheckedChange={(checked) => setSaveState({...saveState, saveIncompleteIDIndicator: Boolean(checked)})}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1 text-xs">IncompleteID</td>
                                                </tr>
                                                <tr className="border-b border-[#CCCCCC]">
                                                    <td className="px-2 py-1 text-xs">Validation rule violations (total count)</td>
                                                    <td className="px-2 py-1 text-xs text-center">
                                                        <Checkbox
                                                            className="h-3.5 w-3.5"
                                                            checked={saveState.saveValidationRuleViolations}
                                                            onCheckedChange={(checked) => setSaveState({...saveState, saveValidationRuleViolations: Boolean(checked)})}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1 text-xs">ValidationRuleViolations</td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <Checkbox
                                            id="replaceExistingSummaryVariables"
                                            checked={saveState.replaceExistingSummaryVariables}
                                            onCheckedChange={(checked) => setSaveState({...saveState, replaceExistingSummaryVariables: Boolean(checked)})}
                                            className="mr-2 h-3.5 w-3.5"
                                        />
                                        <Label htmlFor="replaceExistingSummaryVariables" className="text-xs text-[#333333]">
                                            Replace existing summary variables
                                        </Label>
                                    </div>

                                    <div className="flex items-center">
                                        <Checkbox
                                            id="saveIndicatorVariables"
                                            checked={saveState.saveIndicatorVariables}
                                            onCheckedChange={(checked) => setSaveState({...saveState, saveIndicatorVariables: Boolean(checked)})}
                                            className="mr-2 h-3.5 w-3.5"
                                        />
                                        <Label htmlFor="saveIndicatorVariables" className="text-xs text-[#333333]">
                                            Save indicator variables that record all validation rule violations
                                        </Label>
                                    </div>

                                    <div className="text-xs text-[#666666] mt-2">
                                        The variables tell you whether a particular data value or combination of values violated a validation rule.
                                    </div>

                                    <div className="text-xs text-[#666666] mt-2">
                                        The variables may facilitate cleaning and investigation of your data. Depending on the number of rules that are applied, however,
                                        this option may add many variables to the active dataset.
                                    </div>

                                    <div className="text-xs text-[#333333] font-medium mt-4">
                                        Total number of variables that will be saved: {
                                        (saveState.saveEmptyCaseIndicator ? 1 : 0) +
                                        (saveState.saveDuplicateIDGroup ? 1 : 0) +
                                        (saveState.saveIncompleteIDIndicator ? 1 : 0) +
                                        (saveState.saveValidationRuleViolations ? 1 : 0)
                                    }
                                    </div>
                                </div>
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>

                    <DialogFooter className="flex justify-center space-x-2 p-2 bg-[#F0F0F0] border-t border-[#CCCCCC]">
                        <Button
                            className="h-7 px-6 bg-[#7CB9FF] text-black border border-[#1A72C9] hover:bg-[#5A9FE2] text-xs"
                            onClick={handleConfirm}
                        >
                            OK
                        </Button>
                        <Button
                            variant="outline"
                            className="h-7 px-6 bg-[#7CB9FF] text-black border border-[#1A72C9] hover:bg-[#5A9FE2] text-xs"
                        >
                            Paste
                        </Button>
                        <Button
                            variant="outline"
                            className="h-7 px-6 bg-[#7CB9FF] text-black border border-[#1A72C9] hover:bg-[#5A9FE2] text-xs"
                        >
                            Reset
                        </Button>
                        <Button
                            variant="outline"
                            className="h-7 px-6 bg-[#7CB9FF] text-black border border-[#1A72C9] hover:bg-[#5A9FE2] text-xs"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            className="h-7 px-6 bg-[#7CB9FF] text-black border border-[#1A72C9] hover:bg-[#5A9FE2] text-xs"
                        >
                            Help
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {isDefineRulesOpen && (
                <DefineValidationRules
                    isOpen={isDefineRulesOpen}
                    onClose={handleCloseDefineRules}
                />
            )}
        </>
    );
};

export default ValidateData;