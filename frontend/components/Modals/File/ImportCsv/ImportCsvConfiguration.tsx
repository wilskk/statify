"use client";

import React, { useState, FC, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { InfoIcon, ChevronDownIcon, ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from "@/components/ui/tooltip";
import { useImportCsvProcessor } from "./useImportCsvProcessor"; // Corrected import path
import { CSVProcessingOptions } from "./utils/importCsvUtils"; // Corrected import path

// Types (can be moved to a .types.ts file if they grow)
export type DelimiterOption = CSVProcessingOptions['delimiter']; // Use type from CSVProcessingOptions
export type DecimalOption = CSVProcessingOptions['decimal']; // Use type from CSVProcessingOptions
export type TextQualifierOption = CSVProcessingOptions['textQualifier']; // Use type from CSVProcessingOptions

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

interface ImportCsvConfigurationProps { // Renamed interface
    onClose: () => void;
    onBack: () => void;
    fileName: string;
    fileContent: string;
}

// Custom Select Component (could be a shared component if used elsewhere)
const CustomSelect: FC<CustomSelectProps> = ({ label, value, onChange, options }) => (
    <div className="mb-4">
        <Label htmlFor={`select-${label.toLowerCase().replace(/\s+/g, '-')}`} className="block text-xs font-medium mb-1.5 text-muted-foreground">{label}:</Label>
        <div className="relative">
            <select
                id={`select-${label.toLowerCase().replace(/\s+/g, '-')}`}
                value={value}
                onChange={onChange}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm rounded-md border border-input focus:border-ring focus:outline-none focus:ring-1 bg-background h-9"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDownIcon className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
    </div>
);

export const ImportCsvConfiguration: FC<ImportCsvConfigurationProps> = ({ // Renamed component
    onClose,
    onBack,
    fileName,
    fileContent,
}) => {
    const [firstLineContains, setFirstLineContains] = useState<boolean>(true);
    const [removeLeading, setRemoveLeading] = useState<boolean>(false);
    const [removeTrailing, setRemoveTrailing] = useState<boolean>(false);
    const [delimiter, setDelimiter] = useState<DelimiterOption>("comma");
    const [decimal, setDecimal] = useState<DecimalOption>("period");
    const [textQualifier, setTextQualifier] = useState<TextQualifierOption>("doubleQuote");
    // No need for isProcessing and error state here if useImportCsvProcessor handles it and ImportCsvContainer passes it down or handles submission.

    const { processCSV, isProcessing: hookIsProcessing } = useImportCsvProcessor(); // Destructure isProcessing from hook
    const [submissionError, setSubmissionError] = useState<string | null>(null); // Local error state for submission

    const previewContent = useMemo(() => {
        const lines = fileContent.split('\n').slice(0, 10);
        return lines.map((line, index) => (
            <div
                key={index}
                className={`flex text-xs ${index % 2 === 0 ? 'bg-muted/50' : 'bg-popover'}`}
            >
                <div className="w-8 flex-shrink-0 text-right pr-2 text-muted-foreground py-0.5 border-r border-border">
                    {index + 1}
                </div>
                <div className="py-0.5 pl-2 whitespace-pre truncate text-popover-foreground">
                    {line}
                </div>
            </div>
        ));
    }, [fileContent]);

    const handleOk = async () => {
        setSubmissionError(null);
        try {
            await processCSV({
                fileContent,
                options: {
                    firstLineContains,
                    removeLeading,
                    removeTrailing,
                    delimiter,
                    decimal,
                    textQualifier
                }
            });
            onClose(); // Close modal on success
        } catch (err: any) {
            console.error("Error processing CSV file:", err);
            setSubmissionError(err?.message || "Failed to process CSV. Check console for details.");
        }
    };

    const handleReset = () => {
        setFirstLineContains(true);
        setRemoveLeading(false);
        setRemoveTrailing(false);
        setDelimiter("comma");
        setDecimal("period");
        setTextQualifier("doubleQuote");
        setSubmissionError(null);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Internal Header for this configuration stage */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border flex-shrink-0">
                <div className="flex items-center flex-1 min-w-0">
                    <Button variant="ghost" size="sm" onClick={onBack} className="mr-2 -ml-2 h-8 w-8 p-0">
                        <ArrowLeft size={16} />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold truncate" title={`Configure Import: ${fileName}`}>
                            Configure Import: {fileName}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Adjust settings for how the CSV data should be read.
                        </p>
                    </div>
                </div>
                {/* Optional: Add a spacer or other controls on the right if needed */}
                 <div className="w-8"></div> {/* Spacer to balance the back button */}
            </div>

            {/* Main Content Area */}
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 p-6 flex-grow overflow-y-auto">
                <div className="space-y-4">
                    <div>
                        <Label className="block text-xs font-medium mb-1.5 text-muted-foreground">Preview (first 10 lines)</Label>
                        <div className="border border-border rounded-md overflow-hidden bg-background">
                            <div className="overflow-x-auto max-h-[180px] min-h-[90px] text-xs">
                                {previewContent.length > 0 ? previewContent : <p className="p-4 text-muted-foreground italic">No content to preview.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="firstLineContains" checked={firstLineContains} onCheckedChange={(checked) => setFirstLineContains(Boolean(checked))} />
                            <Label htmlFor="firstLineContains" className="text-sm font-normal cursor-pointer">First line contains variable names</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="removeLeadingSpaces" checked={removeLeading} onCheckedChange={(checked) => setRemoveLeading(Boolean(checked))} />
                            <Label htmlFor="removeLeadingSpaces" className="text-sm font-normal cursor-pointer">Remove leading spaces</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="removeTrailingSpaces" checked={removeTrailing} onCheckedChange={(checked) => setRemoveTrailing(Boolean(checked))} />
                            <Label htmlFor="removeTrailingSpaces" className="text-sm font-normal cursor-pointer">Remove trailing spaces</Label>
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <CustomSelect
                        label="Delimiter"
                        value={delimiter}
                        onChange={(e) => setDelimiter(e.target.value as DelimiterOption)}
                        options={[
                            { value: "comma", label: "Comma (,)" },
                            { value: "semicolon", label: "Semicolon (;)" },
                            { value: "tab", label: "Tab (\t)" },
                        ]}
                    />
                    <CustomSelect
                        label="Decimal Symbol for Numerics"
                        value={decimal}
                        onChange={(e) => setDecimal(e.target.value as DecimalOption)}
                        options={[
                            { value: "period", label: "Period (.)" },
                            { value: "comma", label: "Comma (,)" },
                        ]}
                    />
                    <div> 
                        <div className="flex items-center mb-1.5">
                            <Label htmlFor="textQualifierSelect" className="block text-xs font-medium text-muted-foreground">Text Qualifier:</Label>
                            <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <InfoIcon size={13} className="ml-1.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p>Character used to enclose string values, especially if they might contain the delimiter character.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="relative">
                            <select
                                id="textQualifierSelect"
                                value={textQualifier}
                                onChange={(e) => setTextQualifier(e.target.value as TextQualifierOption)}
                                className="w-full appearance-none px-3 py-2 pr-8 text-sm rounded-md border border-input focus:border-ring focus:outline-none focus:ring-1 bg-background h-9"
                            >
                                <option value="doubleQuote">Double Quote (")</option>
                                <option value="singleQuote">Single Quote (')</option>
                                <option value="none">None</option>
                            </select>
                            <ChevronDownIcon className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    {submissionError && ( // Changed from error to submissionError
                        <div className="text-sm text-destructive pt-3">
                            {submissionError} {/* Changed from error to submissionError */}
                        </div>
                    )}
                </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0 flex justify-between items-center">
                <Button
                    variant="link"
                    onClick={handleReset}
                    className="text-sm px-0 h-auto text-primary hover:text-primary/90"
                    disabled={hookIsProcessing} // Use hookIsProcessing
                >
                    Reset Options
                </Button>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={onBack} disabled={hookIsProcessing} className="h-9">Back</Button> {/* Changed onClose to onBack for cancel button in this stage */}
                    <Button onClick={handleOk} disabled={hookIsProcessing || !!submissionError} className="h-9">
                        {hookIsProcessing ? "Processing..." : "OK"} {/* Use hookIsProcessing */}
                    </Button>
                </div>
            </div>
        </div>
    );
}; 