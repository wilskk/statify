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

interface DefineValidationRulesProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SingleVariableRule {
    id: string;
    name: string;
    type: string;
    format?: string;
    validValuesType: string;
    minimum?: string;
    maximum?: string;
    allowNoninteger: boolean;
    allowUserMissing: boolean;
    allowSystemMissing: boolean;
    allowBlank: boolean;
}

interface CrossVariableRule {
    id: string;
    name: string;
    expression: string;
}

const DefineValidationRules: FC<DefineValidationRulesProps> = ({ isOpen, onClose }) => {
    const { variables } = useVariableStore();
    const { meta, setSingleVarRules, setCrossVarRules } = useMetaStore();

    const [activeTab, setActiveTab] = useState("single-variable");

    // Generate unique IDs for rules
    const generateId = (prefix: string, count: number) => `${prefix}_${Date.now()}_${count}`;

    // Initial rule definition
    const initialSingleRule: SingleVariableRule = {
        id: generateId('svr', 1),
        name: "SingleVarRule 1",
        type: "Numeric",
        validValuesType: "Within a range",
        minimum: "",
        maximum: "",
        allowNoninteger: true,
        allowUserMissing: true,
        allowSystemMissing: true,
        allowBlank: true
    };

    const initialCrossRule: CrossVariableRule = {
        id: generateId('cvr', 1),
        name: "CrossVarRule 1",
        expression: ""
    };

    const [singleVarRules, setSingleVarRuleState] = useState<SingleVariableRule[]>([initialSingleRule]);
    const [crossVarRules, setCrossVarRuleState] = useState<CrossVariableRule[]>([initialCrossRule]);

    const [selectedSingleRule, setSelectedSingleRule] = useState<string>(initialSingleRule.id);
    const [selectedCrossRule, setSelectedCrossRule] = useState<string>(initialCrossRule.id);

    const [currentSingleRule, setCurrentSingleRule] = useState<SingleVariableRule | null>(initialSingleRule);
    const [currentCrossRule, setCurrentCrossRule] = useState<CrossVariableRule | null>(initialCrossRule);

    const [expressionText, setExpressionText] = useState("");

    // Load rules from MetaStore on initial render
    useEffect(() => {
        if (meta.singleVarRules && meta.singleVarRules.length > 0) {
            setSingleVarRuleState(meta.singleVarRules);
            setSelectedSingleRule(meta.singleVarRules[0].id);
        }

        if (meta.crossVarRules && meta.crossVarRules.length > 0) {
            setCrossVarRuleState(meta.crossVarRules);
            setSelectedCrossRule(meta.crossVarRules[0].id);
            if (meta.crossVarRules[0].expression) {
                setExpressionText(meta.crossVarRules[0].expression);
            }
        }
    }, [isOpen, meta.singleVarRules, meta.crossVarRules]);

    // Update current rule when selection changes
    useEffect(() => {
        if (activeTab === "single-variable") {
            const rule = singleVarRules.find(r => r.id === selectedSingleRule);
            if (rule) {
                setCurrentSingleRule({ ...rule });
            }
        } else {
            const rule = crossVarRules.find(r => r.id === selectedCrossRule);
            if (rule) {
                setCurrentCrossRule({ ...rule });
                setExpressionText(rule.expression);
            }
        }
    }, [selectedSingleRule, selectedCrossRule, activeTab, singleVarRules, crossVarRules]);

    const handleSelectSingleRule = (id: string) => {
        setSelectedSingleRule(id);
    };

    const handleSelectCrossRule = (id: string) => {
        setSelectedCrossRule(id);
    };

    const handleNewSingleRule = () => {
        const newId = generateId('svr', singleVarRules.length + 1);
        const newRule: SingleVariableRule = {
            id: newId,
            name: `SingleVarRule ${singleVarRules.length + 1}`,
            type: "Numeric",
            validValuesType: "Within a range",
            minimum: "",
            maximum: "",
            allowNoninteger: true,
            allowUserMissing: true,
            allowSystemMissing: true,
            allowBlank: false
        };

        setSingleVarRuleState([...singleVarRules, newRule]);
        setSelectedSingleRule(newId);
    };

    const handleNewCrossRule = () => {
        const newId = generateId('cvr', crossVarRules.length + 1);
        const newRule: CrossVariableRule = {
            id: newId,
            name: `CrossVarRule ${crossVarRules.length + 1}`,
            expression: ""
        };

        setCrossVarRuleState([...crossVarRules, newRule]);
        setSelectedCrossRule(newId);
    };

    const handleDuplicateSingleRule = () => {
        if (!currentSingleRule) return;

        const newId = generateId('svr', singleVarRules.length + 1);
        const newRule: SingleVariableRule = {
            ...currentSingleRule,
            id: newId,
            name: `${currentSingleRule.name} (copy)`
        };

        setSingleVarRuleState([...singleVarRules, newRule]);
        setSelectedSingleRule(newId);
    };

    const handleDuplicateCrossRule = () => {
        if (!currentCrossRule) return;

        const newId = generateId('cvr', crossVarRules.length + 1);
        const newRule: CrossVariableRule = {
            ...currentCrossRule,
            id: newId,
            name: `${currentCrossRule.name} (copy)`
        };

        setCrossVarRuleState([...crossVarRules, newRule]);
        setSelectedCrossRule(newId);
    };

    const handleDeleteSingleRule = () => {
        if (singleVarRules.length <= 1) return;

        const filteredRules = singleVarRules.filter(r => r.id !== selectedSingleRule);
        setSingleVarRuleState(filteredRules);
        // Fix: Safely select a new rule after deletion
        if (filteredRules.length > 0) {
            setSelectedSingleRule(filteredRules[0].id);
        }
    };

    const handleDeleteCrossRule = () => {
        if (crossVarRules.length <= 1) return;

        const filteredRules = crossVarRules.filter(r => r.id !== selectedCrossRule);
        setCrossVarRuleState(filteredRules);
        // Fix: Safely select a new rule after deletion
        if (filteredRules.length > 0) {
            setSelectedCrossRule(filteredRules[0].id);
        }
    };

    const handleSingleRuleChange = (field: keyof SingleVariableRule, value: any) => {
        if (!currentSingleRule) return;

        const updatedRule = { ...currentSingleRule, [field]: value };
        setCurrentSingleRule(updatedRule);

        setSingleVarRuleState(prevRules =>
            prevRules.map(rule =>
                rule.id === selectedSingleRule ? updatedRule : rule
            )
        );
    };

    const handleCrossRuleChange = (field: keyof CrossVariableRule, value: any) => {
        if (!currentCrossRule) return;

        const updatedRule = { ...currentCrossRule, [field]: value };
        setCurrentCrossRule(updatedRule);

        setCrossVarRuleState(prevRules =>
            prevRules.map(rule =>
                rule.id === selectedCrossRule ? updatedRule : rule
            )
        );
    };

    const handleOperatorClick = (operator: string) => {
        const newText = expressionText + operator;
        setExpressionText(newText);
        if (currentCrossRule) {
            handleCrossRuleChange('expression', newText);
        }
    };

    const handleInsertVariable = (variableName: string) => {
        const newText = expressionText + variableName;
        setExpressionText(newText);
        if (currentCrossRule) {
            handleCrossRuleChange('expression', newText);
        }
    };

    const handleInsertFunction = (functionName: string) => {
        const newText = expressionText + `${functionName}()`;
        setExpressionText(newText);
        if (currentCrossRule) {
            handleCrossRuleChange('expression', newText);
        }
    };

    const handleConfirm = () => {
        // Save rules to MetaStore
        setSingleVarRules(singleVarRules);
        setCrossVarRules(crossVarRules);
        onClose();
    };

    const handleReset = () => {
        // Reset rules to initial state
        const resetSingleRule: SingleVariableRule = {
            id: generateId('svr', 1),
            name: "SingleVarRule 1",
            type: "Numeric",
            validValuesType: "Within a range",
            minimum: "",
            maximum: "",
            allowNoninteger: true,
            allowUserMissing: true,
            allowSystemMissing: true,
            allowBlank: true
        };

        const resetCrossRule: CrossVariableRule = {
            id: generateId('cvr', 1),
            name: "CrossVarRule 1",
            expression: ""
        };

        setSingleVarRuleState([resetSingleRule]);
        setCrossVarRuleState([resetCrossRule]);
        setSelectedSingleRule(resetSingleRule.id);
        setSelectedCrossRule(resetCrossRule.id);
        setExpressionText("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[750px] p-0 bg-white border border-[#E6E6E6] max-h-[90vh] overflow-hidden">
                <DialogHeader className="px-6 py-5 bg-[#F7F7F7] border-b border-[#E6E6E6]">
                    <DialogTitle className="text-base font-semibold text-[#000000]">Define Validation Rules</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                    <div className="border-b border-[#E6E6E6]">
                        <TabsList className="bg-transparent h-8 w-full rounded-none justify-start px-4">
                            <TabsTrigger
                                value="single-variable"
                                className={`px-3 h-7 text-xs rounded-t-md rounded-b-none border-x border-t ${
                                    activeTab === 'single-variable'
                                        ? 'bg-white border-[#E6E6E6] text-[#000000] font-medium'
                                        : 'bg-[#F7F7F7] border-transparent text-[#444444]'
                                } transition-colors`}
                            >
                                Single-Variable Rules
                            </TabsTrigger>
                            <TabsTrigger
                                value="cross-variable"
                                className={`px-3 h-7 text-xs rounded-t-md rounded-b-none border-x border-t ${
                                    activeTab === 'cross-variable'
                                        ? 'bg-white border-[#E6E6E6] text-[#000000] font-medium'
                                        : 'bg-[#F7F7F7] border-transparent text-[#444444]'
                                } transition-colors`}
                            >
                                Cross-Variable Rules
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 overflow-auto">
                        <TabsContent value="single-variable" className="p-3">
                            <div className="grid grid-cols-12 gap-3">
                                <div className="col-span-5">
                                    <div className="text-xs font-medium mb-1 text-[#000000]">Rules:</div>
                                    <div className="border border-[#E6E6E6] rounded overflow-hidden h-[180px]">
                                        <table className="w-full">
                                            <thead className="bg-[#F7F7F7]">
                                            <tr>
                                                <th className="text-left px-2 py-1 text-xs font-medium text-[#444444] border-b border-[#E6E6E6]">Name</th>
                                                <th className="text-left px-2 py-1 text-xs font-medium text-[#444444] border-b border-[#E6E6E6]">Type</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {singleVarRules.map((rule) => (
                                                <tr
                                                    key={rule.id}
                                                    className={`cursor-pointer hover:bg-[#F7F7F7] ${
                                                        selectedSingleRule === rule.id
                                                            ? 'bg-[#F7F7F7] border-l-2 border-l-[#000000]'
                                                            : 'border-l-2 border-l-transparent'
                                                    }`}
                                                    onClick={() => handleSelectSingleRule(rule.id)}
                                                >
                                                    <td className="px-2 py-1 text-xs border-b border-[#E6E6E6] text-[#000000]">{rule.name}</td>
                                                    <td className="px-2 py-1 text-xs border-b border-[#E6E6E6] text-[#444444]">{rule.type}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex space-x-1 mt-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-xs font-medium text-[#000000] border-[#CCCCCC] px-2"
                                            onClick={handleNewSingleRule}
                                        >
                                            New
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-xs font-medium text-[#000000] border-[#CCCCCC] px-2"
                                            onClick={handleDuplicateSingleRule}
                                        >
                                            Duplicate
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-xs font-medium text-[#000000] border-[#CCCCCC] px-2"
                                            onClick={handleDeleteSingleRule}
                                            disabled={singleVarRules.length <= 1}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>

                                <div className="col-span-7">
                                    <div className="border border-[#E6E6E6] rounded bg-white p-3">
                                        <div className="text-xs font-medium mb-2 text-[#000000]">Rule Definition</div>

                                        {currentSingleRule && (
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <Label htmlFor="ruleName" className="text-xs text-[#444444] mb-1 block">Name:</Label>
                                                        <Input
                                                            id="ruleName"
                                                            value={currentSingleRule.name}
                                                            onChange={(e) => handleSingleRuleChange('name', e.target.value)}
                                                            className="h-7 text-xs border-[#CCCCCC]"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="ruleType" className="text-xs text-[#444444] mb-1 block">Type:</Label>
                                                        <Select
                                                            value={currentSingleRule.type}
                                                            onValueChange={(value) => handleSingleRuleChange('type', value)}
                                                        >
                                                            <SelectTrigger className="h-7 text-xs bg-[#F7F7F7] border-[#CCCCCC]">
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white border-[#CCCCCC]">
                                                                <SelectItem value="Numeric">Numeric</SelectItem>
                                                                <SelectItem value="String">String</SelectItem>
                                                                <SelectItem value="Date">Date</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {currentSingleRule.type === "Date" && (
                                                    <div>
                                                        <Label htmlFor="ruleFormat" className="text-xs text-[#444444] mb-1 block">Format:</Label>
                                                        <Select
                                                            value={currentSingleRule.format || "mm/dd/yyyy"}
                                                            onValueChange={(value) => handleSingleRuleChange('format', value)}
                                                        >
                                                            <SelectTrigger className="h-7 text-xs bg-[#F7F7F7] border-[#CCCCCC]">
                                                                <SelectValue placeholder="Select format" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white border-[#CCCCCC]">
                                                                <SelectItem value="mm/dd/yyyy">mm/dd/yyyy</SelectItem>
                                                                <SelectItem value="dd/mm/yyyy">dd/mm/yyyy</SelectItem>
                                                                <SelectItem value="yyyy/mm/dd">yyyy/mm/dd</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}

                                                <Separator className="bg-[#E6E6E6] my-2" />

                                                <div>
                                                    <Label className="text-xs text-[#444444] mb-1 block">Valid Values:</Label>
                                                    <Select
                                                        value={currentSingleRule.validValuesType}
                                                        onValueChange={(value) => handleSingleRuleChange('validValuesType', value)}
                                                    >
                                                        <SelectTrigger className="h-7 text-xs bg-[#F7F7F7] border-[#CCCCCC]">
                                                            <SelectValue placeholder="Select validation type" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white border-[#CCCCCC]">
                                                            <SelectItem value="Within a range">Within a range</SelectItem>
                                                            <SelectItem value="Value list">Value list</SelectItem>
                                                            <SelectItem value="Custom expression">Custom expression</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    {currentSingleRule.validValuesType === "Within a range" && (
                                                        <div className="mt-2">
                                                            <div className="grid grid-cols-2 gap-2 mb-1">
                                                                <div>
                                                                    <Label htmlFor="ruleMinimum" className="text-xs text-[#444444] mb-1 block">Min:</Label>
                                                                    <Input
                                                                        id="ruleMinimum"
                                                                        value={currentSingleRule.minimum || ""}
                                                                        onChange={(e) => handleSingleRuleChange('minimum', e.target.value)}
                                                                        className="h-7 text-xs border-[#CCCCCC]"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <Label htmlFor="ruleMaximum" className="text-xs text-[#444444] mb-1 block">Max:</Label>
                                                                    <Input
                                                                        id="ruleMaximum"
                                                                        value={currentSingleRule.maximum || ""}
                                                                        onChange={(e) => handleSingleRuleChange('maximum', e.target.value)}
                                                                        className="h-7 text-xs border-[#CCCCCC]"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="text-xs text-[#888888] mb-2">
                                                                Specify min/max values. If neither is specified all values are considered valid.
                                                            </div>

                                                            {currentSingleRule.type === "Numeric" && (
                                                                <div className="flex items-center mb-2">
                                                                    <Checkbox
                                                                        id="allowNoninteger"
                                                                        checked={currentSingleRule.allowNoninteger}
                                                                        onCheckedChange={(checked) => handleSingleRuleChange('allowNoninteger', Boolean(checked))}
                                                                        className="mr-2 h-3 w-3 border-[#CCCCCC]"
                                                                    />
                                                                    <Label htmlFor="allowNoninteger" className="text-xs text-[#444444]">
                                                                        Allow noninteger values
                                                                    </Label>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <Separator className="bg-[#E6E6E6] my-2" />

                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="flex items-center">
                                                        <Checkbox
                                                            id="allowUserMissing"
                                                            checked={currentSingleRule.allowUserMissing}
                                                            onCheckedChange={(checked) => handleSingleRuleChange('allowUserMissing', Boolean(checked))}
                                                            className="mr-1 h-3 w-3 border-[#CCCCCC]"
                                                        />
                                                        <Label htmlFor="allowUserMissing" className="text-xs text-[#444444]">
                                                            User-missing
                                                        </Label>
                                                    </div>

                                                    <div className="flex items-center">
                                                        <Checkbox
                                                            id="allowSystemMissing"
                                                            checked={currentSingleRule.allowSystemMissing}
                                                            onCheckedChange={(checked) => handleSingleRuleChange('allowSystemMissing', Boolean(checked))}
                                                            className="mr-1 h-3 w-3 border-[#CCCCCC]"
                                                        />
                                                        <Label htmlFor="allowSystemMissing" className="text-xs text-[#444444]">
                                                            System-missing
                                                        </Label>
                                                    </div>

                                                    <div className="flex items-center">
                                                        <Checkbox
                                                            id="allowBlank"
                                                            checked={currentSingleRule.allowBlank}
                                                            onCheckedChange={(checked) => handleSingleRuleChange('allowBlank', Boolean(checked))}
                                                            className="mr-1 h-3 w-3 border-[#CCCCCC]"
                                                        />
                                                        <Label htmlFor="allowBlank" className="text-xs text-[#444444]">
                                                            Blank values
                                                        </Label>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="cross-variable" className="p-3">
                            <div className="grid grid-cols-12 gap-3">
                                <div className="col-span-5">
                                    <div className="text-xs font-medium mb-1 text-[#000000]">Rules:</div>
                                    <div className="border border-[#E6E6E6] rounded overflow-hidden h-[180px]">
                                        <table className="w-full">
                                            <thead className="bg-[#F7F7F7]">
                                            <tr>
                                                <th className="text-left px-2 py-1 text-xs font-medium text-[#444444] border-b border-[#E6E6E6]">Name</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {crossVarRules.map((rule) => (
                                                <tr
                                                    key={rule.id}
                                                    className={`cursor-pointer hover:bg-[#F7F7F7] ${
                                                        selectedCrossRule === rule.id
                                                            ? 'bg-[#F7F7F7] border-l-2 border-l-[#000000]'
                                                            : 'border-l-2 border-l-transparent'
                                                    }`}
                                                    onClick={() => handleSelectCrossRule(rule.id)}
                                                >
                                                    <td className="px-2 py-1 text-xs border-b border-[#E6E6E6] text-[#000000]">{rule.name}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex space-x-1 mt-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-xs font-medium text-[#000000] border-[#CCCCCC] px-2"
                                            onClick={handleNewCrossRule}
                                        >
                                            New
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-xs font-medium text-[#000000] border-[#CCCCCC] px-2"
                                            onClick={handleDuplicateCrossRule}
                                        >
                                            Duplicate
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-xs font-medium text-[#000000] border-[#CCCCCC] px-2"
                                            onClick={handleDeleteCrossRule}
                                            disabled={crossVarRules.length <= 1}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>

                                <div className="col-span-7">
                                    <div className="border border-[#E6E6E6] rounded bg-white p-3">
                                        <div className="text-xs font-medium mb-2 text-[#000000]">Rule Definition</div>

                                        {currentCrossRule && (
                                            <div className="space-y-2">
                                                <div>
                                                    <Label htmlFor="crossRuleName" className="text-xs text-[#444444] mb-1 block">Name:</Label>
                                                    <Input
                                                        id="crossRuleName"
                                                        value={currentCrossRule.name}
                                                        onChange={(e) => handleCrossRuleChange('name', e.target.value)}
                                                        className="h-7 text-xs border-[#CCCCCC]"
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor="logicalExpression" className="text-xs text-[#444444] mb-1 block">
                                                        Logical Expression (should evaluate to 1 for an invalid case):
                                                    </Label>
                                                    <div className="relative">
                                                        <textarea
                                                            id="logicalExpression"
                                                            value={expressionText}
                                                            onChange={(e) => {
                                                                setExpressionText(e.target.value);
                                                                handleCrossRuleChange('expression', e.target.value);
                                                            }}
                                                            className="w-full h-16 p-1 text-xs border border-[#CCCCCC] rounded resize-none"
                                                        />
                                                        <div className="absolute right-1 top-1 flex flex-col space-y-1">
                                                            <button className="text-[#444444] text-xs">▲</button>
                                                            <button className="text-[#444444] text-xs">▼</button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex space-x-1 overflow-x-auto">
                                                    {['+', '-', '*', '/', '**', '<', '>', '<=', '>=', '=', '<>'].map(op => (
                                                        <Button
                                                            key={op}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-6 min-w-[24px] text-xs font-medium text-[#000000] border-[#CCCCCC] px-1"
                                                            onClick={() => handleOperatorClick(op)}
                                                        >
                                                            {op}
                                                        </Button>
                                                    ))}

                                                    <div className="border-l border-[#E6E6E6] mx-1"></div>

                                                    {['&', '|', '~', '0'].map(op => (
                                                        <Button
                                                            key={op}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-6 min-w-[24px] text-xs font-medium text-[#000000] border-[#CCCCCC] px-1"
                                                            onClick={() => handleOperatorClick(op)}
                                                        >
                                                            {op}
                                                        </Button>
                                                    ))}
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <Label className="text-xs text-[#444444] mb-1 block">Variables:</Label>
                                                        <div className="border border-[#E6E6E6] rounded h-20 overflow-y-auto">
                                                            <ScrollArea className="h-full">
                                                                <div className="p-1">
                                                                    {variables.map((variable, index) => (
                                                                        <div
                                                                            key={index}
                                                                            className="px-1 py-0.5 text-xs cursor-pointer hover:bg-[#F7F7F7]"
                                                                            onClick={() => handleInsertVariable(variable.name)}
                                                                        >
                                                                            {variable.name}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </ScrollArea>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="mt-1 w-full h-6 text-xs font-medium text-[#000000] border-[#CCCCCC] px-2"
                                                        >
                                                            Insert
                                                        </Button>
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between">
                                                            <Label className="text-xs text-[#444444] mb-1 block">Functions:</Label>
                                                            <Select defaultValue="All">
                                                                <SelectTrigger className="h-5 text-xs bg-[#F7F7F7] border-[#CCCCCC] w-20">
                                                                    <SelectValue placeholder="Display" />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-white border-[#CCCCCC]">
                                                                    <SelectItem value="All">All</SelectItem>
                                                                    <SelectItem value="Math">Math</SelectItem>
                                                                    <SelectItem value="Statistical">Statistical</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="border border-[#E6E6E6] rounded h-20 overflow-y-auto">
                                                            <ScrollArea className="h-full">
                                                                <div className="p-1">
                                                                    {['Abs', 'Arsin', 'Artan', 'Cos', 'Exp', 'Ln', 'Rnd', 'Sin', 'Sqrt', 'Tan'].map((func, index) => (
                                                                        <div
                                                                            key={index}
                                                                            className="px-1 py-0.5 text-xs cursor-pointer hover:bg-[#F7F7F7]"
                                                                            onClick={() => handleInsertFunction(func)}
                                                                        >
                                                                            {func}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </ScrollArea>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="mt-1 w-full h-6 text-xs font-medium text-[#000000] border-[#CCCCCC] px-2"
                                                        >
                                                            Insert
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>

                <DialogFooter className="flex justify-end space-x-1 p-2 bg-[#F7F7F7] border-t border-[#E6E6E6]">
                    <Button
                        className="h-7 px-3 bg-[#000000] text-white hover:bg-[#444444] text-xs"
                        onClick={handleConfirm}
                    >
                        OK
                    </Button>
                    {/* <Button
                        variant="outline"
                        className="h-7 px-2 text-[#000000] border-[#CCCCCC] text-xs"
                    >
                        Paste
                    </Button> */}
                    <Button
                        variant="outline"
                        className="h-7 px-2 text-[#000000] border-[#CCCCCC] text-xs"
                        onClick={handleReset}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        className="h-7 px-2 text-[#000000] border-[#CCCCCC] text-xs"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        className="h-7 px-2 text-[#000000] border-[#CCCCCC] text-xs"
                    >
                        Help
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DefineValidationRules;