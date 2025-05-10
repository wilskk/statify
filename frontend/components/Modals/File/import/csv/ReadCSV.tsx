"use client";

import React, { useState, FC, useMemo } from "react";
import {
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { Variable } from "@/types/Variable";
import { FileIcon, InfoIcon, ChevronDownIcon, ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from "@/components/ui/tooltip";

// Types
type DelimiterOption = "comma" | "semicolon" | "tab";
type DecimalOption = "period" | "comma";
type TextQualifierOption = "doubleQuote" | "singleQuote" | "none";

interface SelectOption {
    value: string;
    label: string;
}

interface CustomSelectProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: SelectOption[];
}

interface ReadCSVProps {
    onClose: () => void;
    onBack: () => void;
    fileName: string;
    fileContent: string;
}

// Custom Select Component
const CustomSelect: FC<CustomSelectProps> = ({ label, value, onChange, options }) => (
    <div className="mb-4">
        <Label htmlFor={`select-${label}`} className="block text-sm font-medium mb-2 text-popover-foreground">{label}:</Label>
        <div className="relative">
            <select
                id={`select-${label}`}
                value={value}
                onChange={onChange}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm rounded border border-input focus:border-ring focus:outline-none focus:ring-1 bg-background"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
    </div>
);

const ReadCSV: FC<ReadCSVProps> = ({ onClose, onBack, fileName, fileContent }) => {
    // Get store functions
    const { updateCell, resetData } = useDataStore();
    const variableStore = useVariableStore();
    const { resetVariables, addVariable, getVariableByColumnIndex, updateVariable, variables } = variableStore;

    // State
    const [firstLineContains, setFirstLineContains] = useState<boolean>(false);
    const [removeLeading, setRemoveLeading] = useState<boolean>(false);
    const [removeTrailing, setRemoveTrailing] = useState<boolean>(false);
    const [delimiter, setDelimiter] = useState<DelimiterOption>("comma");
    const [decimal, setDecimal] = useState<DecimalOption>("period");
    const [textQualifier, setTextQualifier] = useState<TextQualifierOption>("doubleQuote");
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Parse preview lines with line numbers and formatting
    const previewContent = useMemo(() => {
        const lines = fileContent.split('\n').slice(0, 10);
        return lines.map((line, index) => (
            <div
                key={index}
                className={`flex ${index % 2 === 0 ? 'bg-muted' : 'bg-popover'}`}
            >
                <div className="w-10 flex-shrink-0 text-right pr-2 text-muted-foreground py-1 border-r border-border">
                    {index + 1}
                </div>
                <div className="py-1 pl-3 whitespace-pre text-popover-foreground">
                    {line}
                </div>
            </div>
        ));
    }, [fileContent]);

    const handleOk = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            await resetData();
            await resetVariables();

            let delim = ',';
            if (delimiter === 'semicolon') delim = ';';
            else if (delimiter === 'tab') delim = '\t';

            let textQual = '';
            if (textQualifier === 'doubleQuote') textQual = '"';
            else if (textQualifier === 'singleQuote') textQual = "'";

            let parsedRows = fileContent
                .split('\n')
                .filter((line) => line.trim().length > 0)
                .map(line => {
                    let processedLine = line;
                    if (removeLeading) processedLine = processedLine.replace(/^\s+/gm, '');
                    if (removeTrailing) processedLine = processedLine.replace(/\s+$/gm, '');

                    // Simple split by delimiter for preview
                    // In a more robust implementation, handle text qualifiers properly
                    return processedLine.split(delim);
                });

            let headerRow: string[] | undefined;
            if (firstLineContains && parsedRows.length > 0) {
                headerRow = parsedRows.shift();
            }

            const numCols = parsedRows.length > 0 ? parsedRows[0].length : 0;

            for (let colIndex = 0; colIndex < numCols; colIndex++) {
                const colData = parsedRows.map(row => row[colIndex] || '');

                const isNumeric = colData.every(val => {
                    if (!val.trim()) return true;
                    const decimalSeparator = decimal === 'period' ? '.' : ',';
                    const numStr = val.replace(new RegExp(`\\${decimalSeparator}`, 'g'), '.');
                    const num = parseFloat(numStr);
                    return !isNaN(num) && isFinite(num);
                });

                const maxLength = isNumeric ? 8 : Math.max(...colData.map(val => val.length), 0);

                const variableName = firstLineContains && headerRow
                    ? headerRow[colIndex]
                    : `VAR${colIndex + 1}`;

                const variable: Variable = {
                    columnIndex: colIndex,
                    name: variableName,
                    type: isNumeric ? 'NUMERIC' : 'STRING',
                    width: isNumeric ? 8 : maxLength,
                    decimals: isNumeric ? 2 : 0,
                    label: '',
                    columns: 200,
                    align: isNumeric ? 'right' : 'left',
                    measure: 'nominal',
                    role: 'input',
                    values: [],
                    missing: null
                };

                const existingVariable = getVariableByColumnIndex(colIndex);
                if (existingVariable) {
                    const rowIndex = variables.findIndex(v => v.columnIndex === colIndex);
                    if (rowIndex !== -1) {
                        const keys = Object.keys(variable) as (keyof Variable)[];
                        for (const field of keys) {
                            await updateVariable(rowIndex, field, variable[field]);
                        }
                    }
                } else {
                    await addVariable(variable);
                }
            }

            // Process and update cells with proper decimal handling
            parsedRows.forEach((row, rowIndex) => {
                row.forEach((value, colIndex) => {
                    const variable = getVariableByColumnIndex(colIndex);
                    if (variable && variable.type === 'NUMERIC' && decimal === 'comma') {
                        // Convert comma to period for numeric values
                        const processedValue = value.replace(',', '.');
                        updateCell(rowIndex, colIndex, processedValue);
                    } else {
                        updateCell(rowIndex, colIndex, value);
                    }
                });
            });

            onClose();
        } catch (error) {
            console.error("Error processing CSV file:", error);
            setError("Failed to process CSV file. Please check the format and try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setFirstLineContains(false);
        setRemoveLeading(false);
        setRemoveTrailing(false);
        setDelimiter("comma");
        setDecimal("period");
        setTextQualifier("doubleQuote");
        setError(null);
    };

    return (
        <>
            <div className="border-b border-border px-6 py-4 flex items-center">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="mr-2 -ml-2 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft size={16} />
                </Button>
                <div>
                    <DialogTitle className="text-lg font-medium text-popover-foreground">Read CSV File</DialogTitle>
                    <div className="flex items-center mt-1">
                        <FileIcon size={16} className="mr-2 text-muted-foreground" />
                        <span className="text-sm truncate max-w-xs text-muted-foreground">{fileName}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 p-6">
                {/* Left column - CSV preview */}
                <div>
                    <div className="mb-5">
                        <h3 className="text-sm font-medium mb-2 text-popover-foreground">Preview</h3>
                        <div className="mt-4 border border-border rounded overflow-hidden">
                            <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
                                {previewContent}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="firstLine" checked={firstLineContains} onCheckedChange={(checked) => setFirstLineContains(Boolean(checked))} />
                            <Label htmlFor="firstLine" className="text-sm font-medium text-popover-foreground">First line contains variable names</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="removeLeading" checked={removeLeading} onCheckedChange={(checked) => setRemoveLeading(Boolean(checked))} />
                            <Label htmlFor="removeLeading" className="text-sm font-medium text-popover-foreground">Remove leading spaces from string values</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="removeTrailing" checked={removeTrailing} onCheckedChange={(checked) => setRemoveTrailing(Boolean(checked))} />
                            <Label htmlFor="removeTrailing" className="text-sm font-medium text-popover-foreground">Remove trailing spaces from string values</Label>
                        </div>
                    </div>
                </div>

                {/* Right column - Configuration options */}
                <div>
                    <CustomSelect
                        label="Delimiter"
                        value={delimiter}
                        onChange={(e) => setDelimiter(e.target.value as DelimiterOption)}
                        options={[
                            { value: "comma", label: "Comma (,)" },
                            { value: "semicolon", label: "Semicolon (;)" },
                            { value: "tab", label: "Tab" },
                        ]}
                    />
                    <CustomSelect
                        label="Decimal Symbol"
                        value={decimal}
                        onChange={(e) => setDecimal(e.target.value as DecimalOption)}
                        options={[
                            { value: "period", label: "Period (.)" },
                            { value: "comma", label: "Comma (,)" },
                        ]}
                    />
                    <div className="mb-4">
                        <div className="flex items-center mb-2">
                            <Label htmlFor="textQualifier" className="block text-sm font-medium text-popover-foreground">Text Qualifier:</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <InfoIcon size={14} className="ml-2 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-tooltip text-tooltip-foreground">
                                        <p>Character used to enclose string values that may contain delimiters.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="relative">
                            <select
                                id="textQualifier"
                                value={textQualifier}
                                onChange={(e) => setTextQualifier(e.target.value as TextQualifierOption)}
                                className="w-full appearance-none px-3 py-2 pr-8 text-sm rounded border border-input focus:border-ring focus:outline-none focus:ring-1 bg-background"
                            >
                                <option value="doubleQuote">Double Quote (")</option>
                                <option value="singleQuote">Single Quote (')</option>
                                <option value="none">None</option>
                            </select>
                            <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-destructive mt-4">
                            {error}
                        </div>
                    )}
                </div>
            </div>

            <DialogFooter className="border-t border-border px-6 py-4 flex justify-between">
                <Button
                    variant="link"
                    onClick={handleReset}
                    className="text-primary hover:text-primary/90 px-0"
                    disabled={isProcessing}
                >
                    Reset to Default
                </Button>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isProcessing}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleOk} disabled={isProcessing}>
                        OK
                    </Button>
                </div>
            </DialogFooter>
        </>
    );
};

export default ReadCSV;