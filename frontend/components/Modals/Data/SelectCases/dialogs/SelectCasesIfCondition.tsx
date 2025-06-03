"use client";

import React, { FC, useState, useRef, useEffect } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Variable } from "@/types/Variable";
import {
    Search,
    HelpCircle,
    Trash2,
    ArrowLeft
} from "lucide-react";
import { getVariableIcon, getDisplayName } from "../utils/variableUtils";

interface SelectCasesIfConditionProps {
    variables: Variable[];
    onClose: () => void;
    onContinue: (condition: string) => void;
    initialExpression?: string;
}

const SelectCasesIfCondition: FC<SelectCasesIfConditionProps> = ({
    variables,
    onClose,
    onContinue,
    initialExpression
}) => {
    const [condition, setCondition] = useState<string>(initialExpression || "");
    const [validationError, setValidationError] = useState<string | null>(null);
    const [selectedFunctionGroup, setSelectedFunctionGroup] = useState<string>("All");
    const [functionSearch, setFunctionSearch] = useState<string>("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [selectedVariable, setSelectedVariable] = useState<string | null>(null);
    
    // Focus the textarea when component mounts
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    // Insert text at current cursor position
    const insertAtCursor = (text: string) => {
        if (!textareaRef.current) return;
        
        const textarea = textareaRef.current;
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        
        // Get text before and after cursor
        const textBefore = condition.substring(0, startPos);
        const textAfter = condition.substring(endPos);
        
        // Update state with new text
        const newCondition = textBefore + text + textAfter;
        setCondition(newCondition);
        
        // Set cursor position after inserted text
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newCursorPos = startPos + text.length;
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    const handleVariableClick = (variable: Variable) => {
        // Toggle selection
        if (selectedVariable === variable.name) {
            setSelectedVariable(null);
        } else {
            setSelectedVariable(variable.name);
        }
    };
    
    const handleVariableDoubleClick = (variable: Variable) => {
        // Insert variable name on double click
        insertAtCursor(variable.name + " ");
    };

    const handleOperatorClick = (operator: string) => {
        insertAtCursor(" " + operator + " ");
    };

    const handleFunctionClick = (functionName: string) => {
        insertAtCursor(functionName + "()");
        
        // Position cursor inside parentheses
        setTimeout(() => {
            if (textareaRef.current) {
                const currentPos = textareaRef.current.selectionStart;
                textareaRef.current.setSelectionRange(currentPos - 1, currentPos - 1);
            }
        }, 0);
    };

    const handleClearExpression = () => {
        setCondition("");
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        }, 0);
    };
    
    const handleBackspace = () => {
        if (!textareaRef.current) return;
        
        const textarea = textareaRef.current;
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        
        if (startPos === endPos) {
            // No selection, delete character before cursor
            if (startPos > 0) {
                const textBefore = condition.substring(0, startPos - 1);
                const textAfter = condition.substring(endPos);
                setCondition(textBefore + textAfter);
                
                // Set cursor position
                setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.focus();
                        textareaRef.current.setSelectionRange(startPos - 1, startPos - 1);
                    }
                }, 0);
            }
        } else {
            // Selection exists, delete selected text
            const textBefore = condition.substring(0, startPos);
            const textAfter = condition.substring(endPos);
            setCondition(textBefore + textAfter);
            
            // Set cursor position
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(startPos, startPos);
                }
            }, 0);
        }
    };

    // Simplified function groups
    const functionGroups = [
        "All",
        "Math",
        "Text",
        "Statistical"
    ];

    // Extended list of functions to match examples section height
    const allFunctions = [
        // Math functions
        "ABS(x)", 
        "SQRT(x)",
        "ROUND(x)",
        "INT(x)",
        "MAX(x, y, ...)",
        "MIN(x, y, ...)",
        "SUM(x, y, ...)",
        "POW(x, y)",
        "EXP(x)",
        "LOG(x)",
        "LOG10(x)",
        "MOD(x, y)",
        
        // Text functions
        "CONCAT(str1, str2)",
        "LENGTH(text)",
        "LOWER(text)",
        "UPPER(text)",
        "TRIM(text)",
        "LEFT(text, n)",
        "RIGHT(text, n)",
        "SUBSTRING(text, start, end)",
        
        // Statistical functions
        "MEAN(x, y, ...)",
        "MEDIAN(x, y, ...)",
        "SD(x, y, ...)",
        "COUNT(x, y, ...)",
        "MISSING(var)",
        "VARIANCE(x, y, ...)",
        "STDEV(x, y, ...)",
        "PERCENTILE(values, k)",
        "QUARTILE(values, quart)"
    ];

    // Filter functions based on selected group and search
    const getFilteredFunctions = () => {
        let filtered = [...allFunctions];
        
        // Filter by group
        if (selectedFunctionGroup !== "All") {
            const groupMap: Record<string, string[]> = {
                "Math": ["ABS", "SQRT", "ROUND", "INT", "MAX", "MIN", "SUM"],
                "Text": ["CONCAT", "LENGTH", "LOWER", "UPPER", "TRIM"],
                "Statistical": ["MEAN", "MEDIAN", "SD", "COUNT", "MISSING"]
            };
            
            const prefixes = groupMap[selectedFunctionGroup] || [];
            filtered = filtered.filter(func => {
                const funcName = func.split("(")[0];
                return prefixes.some(prefix => funcName === prefix);
            });
        }
        
        // Filter by search
        if (functionSearch) {
            const searchLower = functionSearch.toLowerCase();
            filtered = filtered.filter(func => 
                func.toLowerCase().includes(searchLower)
            );
        }
        
        return filtered;
    };

    const filteredFunctions = getFilteredFunctions();
    
    // Comparison operators for easy access
    const comparisonOperators = [
        { label: "=", value: "==" },
        { label: "≠", value: "!=" },
        { label: ">", value: ">" },
        { label: "<", value: "<" },
        { label: "≥", value: ">=" },
        { label: "≤", value: "<=" },
    ];

    // Logical operators for easy access
    const logicalOperators = [
        { label: "AND", value: "&" },
        { label: "OR", value: "|" },
        { label: "NOT", value: "~" },
    ];

    const handleContinue = () => {
        // Validate condition
        if (!condition.trim()) {
            setValidationError("Condition cannot be empty");
            return;
        }
        
        // Basic syntax validation for parentheses
        const openParentheses = (condition.match(/\(/g) || []).length;
        const closeParentheses = (condition.match(/\)/g) || []).length;
        if (openParentheses !== closeParentheses) {
            setValidationError("Unbalanced parentheses in condition");
            return;
        }
        
        // Check for existence of at least one variable in the condition
        const variableExists = variables.some(v => 
            new RegExp(`\\b${v.name}\\b`, 'g').test(condition)
        );
        
        if (!variableExists) {
            setValidationError("Condition must contain at least one variable");
            return;
        }
        
        setValidationError(null);
        onContinue(condition);
    };

    return (
        <DialogContent
            className="
                max-w-full sm:max-w-[800px] w-full p-0 bg-popover border border-border
                max-h-[100dvh] overflow-y-auto
                sm:rounded-lg
            "
            style={{ maxHeight: "100dvh" }}
        >
            <div className="px-2 sm:px-4 py-2">
                <DialogHeader className="p-0">
                    <DialogTitle className="text-sm sm:text-base font-semibold text-popover-foreground flex items-center">
                        <span>Select Cases: If Condition</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                                        <HelpCircle size={16} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p className="text-xs">Create a logical expression to filter cases.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </DialogTitle>
                </DialogHeader>
            </div>
            <Separator />
            <div className="p-2 sm:p-3 md:p-4">
                <div className="
                    flex flex-col gap-2 md:grid md:grid-cols-12 md:gap-4
                ">
                    {/* Left Column - Variables List */}
                    <div className="md:col-span-3">
                        <Label className="text-xs font-medium block mb-1">Variables:</Label>
                        <div className="border border-border rounded-md min-h-[100px] max-h-[160px] sm:max-h-[180px] bg-card overflow-hidden">
                            <ScrollArea className="h-full w-full">
                                <div className="p-1">
                                    {variables.map((variable) => (
                                        <div
                                            key={variable.columnIndex}
                                            className={`
                                                flex items-center p-1.5 border rounded-md cursor-pointer mb-1
                                                hover:bg-accent text-xs sm:text-sm
                                                ${selectedVariable === variable.name ? "bg-primary/5 border-primary/40" : "border-border"}
                                            `}
                                            onClick={() => handleVariableClick(variable)}
                                            onDoubleClick={() => handleVariableDoubleClick(variable)}
                                        >
                                            <div className="flex items-center w-full">
                                                {getVariableIcon(variable)}
                                                <span className="truncate">{variable.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    {/* Middle Column - Expression Builder */}
                    <div className="md:col-span-5 mt-2 md:mt-0">
                        <div className="flex flex-col">
                            {/* Expression Input */}
                            <div className="mb-2">
                                <div className="flex justify-between items-center mb-1">
                                    <Label className="text-xs font-medium">Expression:</Label>
                                    <div className="flex gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6" 
                                            onClick={handleBackspace}
                                        >
                                            <ArrowLeft size={14} />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6" 
                                            onClick={handleClearExpression}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                                <Textarea
                                    ref={textareaRef}
                                    value={condition}
                                    onChange={(e) => setCondition(e.target.value)}
                                    className="min-h-[60px] text-xs sm:text-sm p-2 bg-muted font-mono resize-none"
                                    placeholder="Enter condition expression..."
                                    spellCheck={false}
                                    style={{ lineHeight: 1.5 }}
                                />
                            </div>

                            {/* Operator Buttons */}
                            <div className="mb-2">
                                <div className="grid grid-cols-7 gap-1">
                                    {comparisonOperators.map((op, idx) => (
                                        <Button
                                            key={idx}
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-xs bg-card hover:bg-accent px-1"
                                            onClick={() => handleOperatorClick(op.value)}
                                        >
                                            {op.label}
                                        </Button>
                                    ))}
                                    {logicalOperators.map((op, idx) => (
                                        <Button
                                            key={idx}
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-xs bg-card hover:bg-accent px-1"
                                            onClick={() => handleOperatorClick(op.value)}
                                        >
                                            {op.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Calculator Buttons */}
                            <div className="mb-2">
                                <div className="grid grid-cols-7 gap-1">
                                    {[
                                        { label: "7", value: "7" }, { label: "8", value: "8" }, { label: "9", value: "9" },
                                        { label: "+", value: "+" }, { label: "-", value: "-" }, { label: "(", value: "(" },
                                        { label: ")", value: ")" },
                                        { label: "4", value: "4" }, { label: "5", value: "5" }, { label: "6", value: "6" },
                                        { label: "*", value: "*" }, { label: "/", value: "/" }, { label: "\"", value: "\"" },
                                        { label: "'", value: "'" },
                                        { label: "1", value: "1" }, { label: "2", value: "2" }, { label: "3", value: "3" },
                                        { label: "0", value: "0" }, { label: ".", value: "." }, { label: ":", value: ":" },
                                        { label: "Space", value: " " }
                                    ].map((btn, idx) => (
                                        <Button
                                            key={idx}
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-xs bg-card hover:bg-accent px-1"
                                            onClick={() => insertAtCursor(btn.value)}
                                        >
                                            {btn.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Common Expression Examples */}
                            <div className="border border-border rounded-md p-2 bg-muted">
                                <Label className="text-xs font-medium block mb-1">Examples:</Label>
                                <div className="space-y-1 overflow-y-auto h-[52px]">
                                    <Button variant="ghost" size="sm" className="h-6 text-xs justify-start px-2 font-mono w-full" 
                                            onClick={() => setCondition("age > 25")}>
                                        age {">"} 25
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 text-xs justify-start px-2 font-mono w-full"
                                            onClick={() => setCondition("income >= 50000 & education > 12")}>
                                        income {">="} 50000 & education {">"} 12
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 text-xs justify-start px-2 font-mono w-full"
                                            onClick={() => setCondition("gender == \"F\" | gender == \"f\"")}>
                                        gender == "F" | gender == "f"
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Function Groups */}
                    <div className="md:col-span-4 mt-2 md:mt-0">
                        <div className="flex flex-col">
                            <div className="mb-2">
                                <Label className="text-xs font-medium block mb-1">Function group:</Label>
                                <Select
                                    value={selectedFunctionGroup}
                                    onValueChange={setSelectedFunctionGroup}
                                >
                                    <SelectTrigger className="h-7 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {functionGroups.map((group) => (
                                            <SelectItem key={group} value={group} className="text-xs">
                                                {group}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="mb-2">
                                <Label className="text-xs font-medium block mb-1">Search functions:</Label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-1.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={functionSearch}
                                        onChange={(e) => setFunctionSearch(e.target.value)}
                                        className="pl-7 h-7 text-xs"
                                        placeholder="Search for functions..."
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-medium block mb-1">Functions:</Label>
                                <div className="border border-border rounded-md min-h-[100px] max-h-[160px] sm:max-h-[180px] bg-card">
                                    <ScrollArea className="h-full w-full">
                                        <div className="p-1">
                                            {filteredFunctions.length > 0 ? (
                                                <div className="space-y-1">
                                                    {filteredFunctions.map((func, idx) => (
                                                        <Button
                                                            key={idx}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 text-xs justify-start px-2 font-mono w-full hover:bg-accent"
                                                            onClick={() => handleFunctionClick(func.split("(")[0])}
                                                        >
                                                            {func}
                                                        </Button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-2 text-xs text-muted-foreground text-center">
                                                    No functions match your search
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Separator />
            <DialogFooter className="p-2 sm:p-3">
                {validationError && (
                    <div className="w-full mb-2">
                        <p className="text-xs text-destructive">{validationError}</p>
                    </div>
                )}
                <Button variant="outline" className="h-8 px-4 text-xs sm:text-sm mr-2" onClick={onClose}>Cancel</Button>
                <Button className="h-8 px-4 text-xs sm:text-sm bg-primary hover:bg-primary/90" onClick={handleContinue}>Continue</Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default SelectCasesIfCondition;