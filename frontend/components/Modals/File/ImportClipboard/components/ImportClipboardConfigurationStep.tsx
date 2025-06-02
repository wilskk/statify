"use client";

import React, { useState, FC, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, RefreshCw, HelpCircle, Clipboard, Table } from "lucide-react";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { ImportClipboardConfigurationStepProps, ClipboardProcessingOptions } from "../types";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import { registerAllModules } from 'handsontable/registry';
import { useImportClipboardProcessor } from "..";

// Register Handsontable modules
registerAllModules();

// Define the specific types for Handsontable settings
type StretchH = 'all' | 'none' | 'last';

const PREVIEW_ROW_LIMIT = 100;
const PREVIEW_COL_LIMIT = 25;

export const ImportClipboardConfigurationStep: FC<ImportClipboardConfigurationStepProps> = ({
    onClose,
    onBack,
    pastedText,
    parsedData,
}) => {
    const hotTableRef = useRef<any>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
    const [previewData, setPreviewData] = useState<string[][]>(parsedData);
    const [textQualifierOption, setTextQualifierOption] = useState<string>('"');
    const [originalRowCount, setOriginalRowCount] = useState(0);
    const [originalColCount, setOriginalColCount] = useState(0);

    const [options, setOptions] = useState<ClipboardProcessingOptions>({
        delimiter: "tab",
        firstRowAsHeader: false,
        trimWhitespace: true,
        skipEmptyRows: true,
        detectDataTypes: true,
    });

    const [customDelimiter, setCustomDelimiter] = useState<string>("");
    const [hotSettings, setHotSettings] = useState({
        stretchH: 'all' as StretchH, 
        autoWrapRow: true,
        autoWrapCol: false,
        manualColumnResize: true,
        manualRowResize: true,
    });

    const { excelStyleTextToColumns, processClipboardData } = useImportClipboardProcessor();

    const getDelimiterCharacter = useCallback((): string => {
        switch (options.delimiter) {
            case "tab": return "\t";
            case "comma": return ",";
            case "semicolon": return ";";
            case "space": return " ";
            case "custom": return customDelimiter || "\t";
            default: return "\t";
        }
    }, [options.delimiter, customDelimiter]);

    // Update preview when options change
    useEffect(() => {
        const updatePreview = async () => {
            if (!pastedText) {
                setPreviewData([]);
                return;
            }
            setIsPreviewLoading(true);
            setError(null);
            try {
                let result;
                const currentDelimiter = getDelimiterCharacter();
                result = excelStyleTextToColumns(pastedText, {
                    delimiterType: 'delimited',
                    delimiter: currentDelimiter,
                    textQualifier: textQualifierOption === "NO_QUALIFIER" ? "" : textQualifierOption,
                    treatConsecutiveDelimitersAsOne: options.skipEmptyRows,
                    trimWhitespace: options.trimWhitespace,
                    detectDataTypes: options.detectDataTypes,
                    hasHeaderRow: options.firstRowAsHeader
                });
                setPreviewData(result);
            } catch (err: any) {
                console.error("Error updating preview:", err);
                setError(err?.message || "Failed to update preview");
                setPreviewData([]);
            } finally {
                setIsPreviewLoading(false);
            }
        };
        
        if (pastedText) {
            updatePreview();
        }

    }, [options, customDelimiter, pastedText, excelStyleTextToColumns, textQualifierOption, getDelimiterCharacter, options.firstRowAsHeader]);

    // Prepare data for Handsontable
    const { dataForTable, columnHeaders, columnsSetting } = useMemo(() => {
        if (!previewData || previewData.length === 0) {
            setOriginalRowCount(0);
            setOriginalColCount(0);
            return { dataForTable: [], columnHeaders: [], columnsSetting: [] };
        }

        let fullHeaders: string[];
        let fullData: string[][];

        if (options.firstRowAsHeader) {
            if (previewData.length > 1) {
                fullHeaders = previewData[0];
                fullData = previewData.slice(1);
            } else { 
                fullHeaders = previewData[0].map((_, i) => `Column ${i + 1}`);
                fullData = previewData; 
            }
        } else {
            if (previewData.length > 0 && previewData[0]) {
                fullHeaders = previewData[0].map((_, i) => `Column ${i + 1}`);
            } else {
                fullHeaders = []; 
            }
            fullData = previewData;
        }
        
        setOriginalRowCount(fullData.length);
        setOriginalColCount(fullHeaders.length);

        const slicedHeaders = fullHeaders.slice(0, PREVIEW_COL_LIMIT);
        const slicedData = fullData.slice(0, PREVIEW_ROW_LIMIT).map(row => row.slice(0, PREVIEW_COL_LIMIT));
        const slicedColumnsSetting = slicedHeaders.map((_, index) => ({ data: index }));

        return { 
            dataForTable: slicedData, 
            columnHeaders: slicedHeaders, 
            columnsSetting: slicedColumnsSetting 
        };
    }, [previewData, options.firstRowAsHeader]);

    console.log("[ImportClipboardConfigurationStep] Rendering with:");
    console.log("  options.firstRowAsHeader:", options.firstRowAsHeader);
    console.log("  previewData:", JSON.stringify(previewData));
    console.log("  columnHeaders:", JSON.stringify(columnHeaders));
    console.log("  dataForTable:", JSON.stringify(dataForTable));
    console.log("  columnsSetting:", JSON.stringify(columnsSetting));

    // Handle option changes
    const handleOptionChange = (key: keyof ClipboardProcessingOptions, value: any) => {
        setOptions((prevOptions: ClipboardProcessingOptions) => ({
            ...prevOptions,
            [key]: value
        }));
    };

    // Handle import with the chosen parser
    const handleImport = async () => {
        if (isProcessing) return;
        
        setIsProcessing(true);
        setError(null);
        
        try {
            // Always use Excel-style parser logic for processing
            const dataToProcess = excelStyleTextToColumns(pastedText, {
                delimiterType: 'delimited',
                delimiter: getDelimiterCharacter(),
                textQualifier: textQualifierOption === "NO_QUALIFIER" ? "" : textQualifierOption,
                treatConsecutiveDelimitersAsOne: options.skipEmptyRows,
                trimWhitespace: options.trimWhitespace,
                detectDataTypes: options.detectDataTypes,
                hasHeaderRow: options.firstRowAsHeader
            });
                
            await processClipboardData(pastedText, {
                ...options,
                customDelimiter: options.delimiter === "custom" ? customDelimiter : undefined,
                excelProcessedData: dataToProcess
            });
            onClose();
        } catch (err: any) {
            setError(err?.message || "Failed to import data");
            console.error("Import error:", err);
        } finally {
            setIsProcessing(false);
        }
    };

    // Button click handler to toggle stretchH setting
    const toggleStretchH = () => {
        if (hotTableRef.current?.hotInstance) {
            const newStretchH: StretchH = hotSettings.stretchH === 'all' ? 'none' : 'all';
            hotTableRef.current.hotInstance.updateSettings({
                stretchH: newStretchH
            });
            setHotSettings(prev => ({
                ...prev,
                stretchH: newStretchH
            }));
        }
    };

    const isPreviewTruncated = originalRowCount > PREVIEW_ROW_LIMIT || originalColCount > PREVIEW_COL_LIMIT;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                <div className="flex items-center flex-1 min-w-0">
                    <Button variant="ghost" size="icon" onClick={onBack} className="mr-3 -ml-2 h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={18} />
                    </Button>
                    <Clipboard size={20} className="mr-2.5 text-primary flex-shrink-0 relative top-[-1px]" />
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold truncate text-popover-foreground">
                            Configure Clipboard Import
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            Configure how the pasted data should be processed (Excel-style parser)
                        </p>
                    </div>
                </div>
                <div className="w-8"></div>
            </div>

            {/* Main Content Area */}
            <div className="p-6 flex-grow flex flex-col md:flex-row gap-6">
                {/* Options Panel */}
                <div className="w-full md:w-[300px] lg:w-[320px] xl:w-[350px] flex-shrink-0 space-y-4 overflow-y-auto pr-2 pb-4">
                    <div className="space-y-3">
                        <Label className="text-xs font-medium text-muted-foreground">Delimiter</Label>
                        <Select
                            value={options.delimiter}
                            onValueChange={(value) => handleOptionChange("delimiter", value)}
                            disabled={isProcessing}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select delimiter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tab">Tab</SelectItem>
                                <SelectItem value="comma">Comma (,)</SelectItem>
                                <SelectItem value="semicolon">Semicolon (;)</SelectItem>
                                <SelectItem value="space">Space</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>

                        {options.delimiter === "custom" && (
                            <div className="pt-2">
                                <Label htmlFor="custom-delimiter" className="text-xs font-medium text-muted-foreground">
                                    Custom Delimiter
                                </Label>
                                <Input
                                    id="custom-delimiter"
                                    value={customDelimiter}
                                    onChange={(e) => setCustomDelimiter(e.target.value)}
                                    placeholder="Enter custom delimiter"
                                    className="mt-1"
                                    disabled={isProcessing}
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 pt-2">
                        <Label className="text-xs font-medium text-muted-foreground">Text Qualifier</Label>
                        <Select
                            value={textQualifierOption}
                            onValueChange={setTextQualifierOption}
                            disabled={isProcessing}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select text qualifier" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='"'>Double Quote (")</SelectItem>
                                <SelectItem value="'">Single Quote (')</SelectItem>
                                <SelectItem value="NO_QUALIFIER">None</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3 pt-2">
                        <Label className="text-xs font-medium text-muted-foreground">Options</Label>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="firstRowAsHeader"
                                checked={options.firstRowAsHeader}
                                onCheckedChange={(checked) => handleOptionChange("firstRowAsHeader", Boolean(checked))}
                                disabled={isProcessing}
                            />
                            <Label htmlFor="firstRowAsHeader" className="text-sm font-normal cursor-pointer flex items-center">
                                First row as headers
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Use the first row as variable names
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="trimWhitespace"
                                checked={options.trimWhitespace}
                                onCheckedChange={(checked) => handleOptionChange("trimWhitespace", Boolean(checked))}
                                disabled={isProcessing}
                            />
                            <Label htmlFor="trimWhitespace" className="text-sm font-normal cursor-pointer flex items-center">
                                Trim whitespace
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Remove leading and trailing whitespace from cells
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="skipEmptyRows"
                                checked={options.skipEmptyRows}
                                onCheckedChange={(checked) => handleOptionChange("skipEmptyRows", Boolean(checked))}
                                disabled={isProcessing}
                            />
                            <Label htmlFor="skipEmptyRows" className="text-sm font-normal cursor-pointer flex items-center">
                                Skip empty rows
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Ignore rows with no data
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="detectDataTypes"
                                checked={options.detectDataTypes}
                                onCheckedChange={(checked) => handleOptionChange("detectDataTypes", Boolean(checked))}
                                disabled={isProcessing}
                            />
                            <Label htmlFor="detectDataTypes" className="text-sm font-normal cursor-pointer flex items-center">
                                Detect data types
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Automatically detect numeric values
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Label>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setOptions({
                                delimiter: "tab",
                                firstRowAsHeader: true,
                                trimWhitespace: true,
                                skipEmptyRows: true,
                                detectDataTypes: true,
                            });
                            setTextQualifierOption('"');
                        }}
                        disabled={isProcessing || isPreviewLoading}
                        className="w-full mt-3"
                    >
                        Reset Options
                    </Button>
                </div>

                {/* Data Preview Panel */}
                <div className="w-full md:flex-1 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Data Preview</Label>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={toggleStretchH}
                            >
                                <Table size={14} className="mr-1" />
                                {hotSettings.stretchH === 'all' ? 'Auto-width' : 'Fixed-width'}
                            </Button>
                        </div>
                    </div>
                    <div className="border border-border rounded-md overflow-auto flex-grow bg-background hot-container relative min-h-[200px]">
                        {isPreviewLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center h-full text-muted-foreground bg-background/80 z-10">
                                <RefreshCw size={18} className="animate-spin mr-2" /> Loading preview...
                            </div>
                        ) : previewData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                                <span>No data to preview. Try adjusting delimiter options.</span>
                            </div>
                        ) : (
                            <HotTable
                                key={options.firstRowAsHeader ? 'headers-on' : 'headers-off'}
                                ref={hotTableRef}
                                data={dataForTable}
                                colHeaders={columnHeaders}
                                columns={columnsSetting}
                                rowHeaders={true}
                                width="100%"
                                height="100%"
                                licenseKey="non-commercial-and-evaluation"
                                readOnly={true}
                                manualColumnResize={true}
                                manualRowResize={true}
                                stretchH={hotSettings.stretchH}
                                autoWrapRow={hotSettings.autoWrapRow}
                                autoWrapCol={hotSettings.autoWrapCol}
                                className={'excel-parser'}
                                afterGetColHeader={(col, TH) => {
                                    if (options.firstRowAsHeader) {
                                        TH.classList.add('header-row');
                                    } else {
                                        TH.classList.remove('header-row');
                                    }
                                }}
                            />
                        )}
                    </div>
                    {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
                    <div className="text-xs text-muted-foreground mt-1.5">
                        {dataForTable.length > 0 && (
                            <span>
                                {isPreviewTruncated 
                                    ? `Showing first ${dataForTable.length} of ${originalRowCount} rows × ${columnHeaders.length} of ${originalColCount} columns` 
                                    : `${originalRowCount} rows × ${originalColCount} columns`}
                                {' (using Excel-style parser)'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0 flex justify-between items-center">
                <Button
                    variant="outline"
                    onClick={onBack}
                    disabled={isProcessing}
                    className="h-9"
                >
                    Back
                </Button>
                <Button
                    onClick={handleImport}
                    disabled={isProcessing || isPreviewLoading || previewData.length === 0}
                    className="h-9 min-w-[90px]"
                >
                    {isProcessing && <RefreshCw size={16} className="animate-spin mr-1.5" />}
                    {isProcessing ? "Importing..." : "Import"}
                </Button>
            </div>
        </div>
    );
}; 