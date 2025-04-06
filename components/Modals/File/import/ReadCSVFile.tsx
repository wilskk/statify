"use client";

import React, { useState, FC, useMemo } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { Variable } from "@/types/Variable";
import { FileIcon, InfoIcon, ChevronDownIcon } from "lucide-react";
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

interface ReadCSVFileProps {
    onClose: () => void;
    fileName: string;
    fileContent: string;
}

// Custom Select Component
const CustomSelect: FC<CustomSelectProps> = ({ label, value, onChange, options }) => (
    <div className="mb-4">
        <Label htmlFor={`select-${label}`} className="block text-sm font-medium mb-2">{label}:</Label>
        <div className="relative">
            <select
                id={`select-${label}`}
                value={value}
                onChange={onChange}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm rounded border border-gray-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black bg-white"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
        </div>
    </div>
);

const ReadCSVFile: FC<ReadCSVFileProps> = ({ onClose, fileName, fileContent }) => {
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

    // Parse preview lines with line numbers and formatting
    const previewContent = useMemo(() => {
        const lines = fileContent.split('\n').slice(0, 10);
        return lines.map((line, index) => (
            <div
                key={index}
                className={`flex ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
            >
                <div className="w-10 flex-shrink-0 text-right pr-2 text-gray-500 py-1 border-r border-gray-200">
                    {index + 1}
                </div>
                <div className="py-1 pl-3 whitespace-nowrap">
                    {line}
                </div>
            </div>
        ));
    }, [fileContent]);

    const handleOk = async () => {
        setIsProcessing(true);

        try {
            await resetData();
            await resetVariables();

            let delim = ',';
            if (delimiter === 'semicolon') delim = ';';
            else if (delimiter === 'tab') delim = '\t';

            let parsedRows = fileContent
                .split('\n')
                .filter((line) => line.trim().length > 0)
                .map(line => {
                    let processedLine = line;
                    if (removeLeading) processedLine = processedLine.replace(/^\s+/gm, '');
                    if (removeTrailing) processedLine = processedLine.replace(/\s+$/gm, '');
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
                    const num = parseFloat(val);
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
                    values: [],
                    missing: [],
                    columns: 200,
                    align: isNumeric ? 'right' : 'left',
                    measure: 'nominal',
                    role: 'input'
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

            parsedRows.forEach((row, rowIndex) => {
                row.forEach((value, colIndex) => {
                    updateCell(rowIndex, colIndex, value);
                });
            });

            onClose();
        } catch (error) {
            console.error("Error processing CSV file:", error);
            // Add error handling UI if needed
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
    };

    return (
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-md bg-white">
            <div className="border-b px-6 py-4">
                <DialogTitle className="text-lg font-medium">Read CSV File</DialogTitle>
                <div className="flex items-center mt-1">
                    <FileIcon size={16} className="mr-2 text-gray-600" />
                    <span className="text-sm truncate max-w-xs">{fileName}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 p-6">
                {/* Left column - CSV preview */}
                <div>
                    <div className="mb-5">
                        <h3 className="text-sm font-medium mb-2">Preview</h3>
                        <div className="border rounded h-48 bg-gray-50 font-mono text-xs overflow-hidden">
                            {/* Container with fixed line numbers and horizontally scrollable content */}
                            <div className="h-full overflow-x-auto">
                                {previewContent}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <CustomSelect
                            label="Delimiter"
                            value={delimiter}
                            onChange={(e) => setDelimiter(e.target.value as DelimiterOption)}
                            options={[
                                { value: "comma", label: "Comma (,)" },
                                { value: "semicolon", label: "Semicolon (;)" },
                                { value: "tab", label: "Tab (↹)" }
                            ]}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <CustomSelect
                                label="Decimal"
                                value={decimal}
                                onChange={(e) => setDecimal(e.target.value as DecimalOption)}
                                options={[
                                    { value: "period", label: "Period (.)" },
                                    { value: "comma", label: "Comma (,)" }
                                ]}
                            />

                            <CustomSelect
                                label="Text Qualifier"
                                value={textQualifier}
                                onChange={(e) => setTextQualifier(e.target.value as TextQualifierOption)}
                                options={[
                                    { value: "doubleQuote", label: "Double Quote (\")" },
                                    { value: "singleQuote", label: "Single Quote (')" },
                                    { value: "none", label: "None" }
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* Right column - Options */}
                <div>
                    <h3 className="text-sm font-medium mb-4">File Structure Options</h3>
                    <div className="space-y-4 mb-6">
                        <div className="flex items-center space-x-3">
                            <Checkbox
                                id="first-line"
                                checked={firstLineContains}
                                onCheckedChange={(checked) => setFirstLineContains(checked === true)}
                            />
                            <Label htmlFor="first-line" className="text-sm cursor-pointer">
                                First line contains variable names
                            </Label>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Checkbox
                                id="leading-spaces"
                                checked={removeLeading}
                                onCheckedChange={(checked) => setRemoveLeading(checked === true)}
                            />
                            <Label htmlFor="leading-spaces" className="text-sm cursor-pointer">
                                Remove leading spaces
                            </Label>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Checkbox
                                id="trailing-spaces"
                                checked={removeTrailing}
                                onCheckedChange={(checked) => setRemoveTrailing(checked === true)}
                            />
                            <Label htmlFor="trailing-spaces" className="text-sm cursor-pointer">
                                Remove trailing spaces
                            </Label>
                        </div>
                    </div>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center text-xs text-gray-500 cursor-help">
                                    <InfoIcon size={14} className="mr-2" />
                                    <span>Preview shows first 10 lines</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>The preview displays only the first 10 lines of your CSV file.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            <div className="flex items-center px-6 py-3 border-t bg-gray-50 text-xs text-gray-500">
                <InfoIcon size={14} className="mr-2 flex-shrink-0" />
                <span>CSV files should be properly formatted for accurate data import</span>
            </div>

            <DialogFooter className="p-4 flex justify-end gap-2 border-t">
                <Button
                    onClick={handleOk}
                    className="bg-black text-white hover:bg-gray-800"
                    disabled={isProcessing}
                >
                    {isProcessing ? "Processing..." : "OK"}
                </Button>
                <Button
                    variant="outline"
                    onClick={handleReset}
                    className="bg-white text-black border"
                    disabled={isProcessing}
                >
                    Reset
                </Button>
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="bg-white text-black border"
                    disabled={isProcessing}
                >
                    Cancel
                </Button>
                <Button
                    variant="outline"
                    onClick={() => alert("Help functionality not implemented")}
                    className="bg-white text-black border"
                    disabled={isProcessing}
                >
                    Help
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default ReadCSVFile;