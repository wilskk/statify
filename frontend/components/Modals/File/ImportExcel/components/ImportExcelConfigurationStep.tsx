"use client";

import React, { useState, FC, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import * as XLSX from "xlsx"; // Still needed for XLSX.utils.encode_col if used for fallback headers
import { HotTable, HotTableClass } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import { registerAllModules } from 'handsontable/registry';
import { InfoIcon, RefreshCw, ArrowLeft, FileSpreadsheet, HelpCircle, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ImportExcelConfigurationStepProps, ParseSheetOptions } from "../types";
import {
    parseExcelWorkbook,
    getSheetNamesFromWorkbook,
    parseSheetForPreview,
    processSheetForImport,
    generateVariablesFromData
} from "../utils/utils";

// Register Handsontable modules
registerAllModules();

export const ImportExcelConfigurationStep: FC<ImportExcelConfigurationStepProps> = ({
    onClose,
    onBack,
    fileName,
    fileContent,
}) => {
    const { setData, resetData } = useDataStore();
    const { resetVariables, addVariable } = useVariableStore();

    const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<string>("");
    
    const [range, setRange] = useState<string>("");
    const [parsedPreviewData, setParsedPreviewData] = useState<any[][]>([]);
    const [previewColumnHeaders, setPreviewColumnHeaders] = useState<string[] | false>(false);
    
    const [firstLineContains, setFirstLineContains] = useState<boolean>(true);
    const [readHiddenRowsCols, setReadHiddenRowsCols] = useState<boolean>(false);
    const [readEmptyCellsAs, setReadEmptyCellsAs] = useState<"empty" | "missing">("empty");

    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const hotTableRef = useRef<HotTableClass | null>(null);

    useEffect(() => {
        if (!fileContent) {
            setError("No file content available to parse.");
            setIsLoadingPreview(false);
            return;
        }
        setIsLoadingPreview(true);
        setError(null);
        const wb = parseExcelWorkbook(fileContent);
        if (wb) {
            setWorkbook(wb);
            const names = getSheetNamesFromWorkbook(wb);
            setSheetNames(names);
            if (names.length > 0) {
                setSelectedSheet(names[0]);
            } else {
                setError("No worksheets found in the Excel file.");
            }
        } else {
            setError("Could not read the Excel file. It might be corrupted or an unsupported format.");
        }
        setIsLoadingPreview(false);
    }, [fileContent]);

    const currentParseOptions = useCallback((): ParseSheetOptions => ({
        range,
        firstLineContains,
        readHiddenRowsCols,
        readEmptyCellsAs,
        // sheetRef: workbook && selectedSheet ? workbook.Sheets[selectedSheet]?.[ '!ref'] : undefined
    }), [range, firstLineContains, readHiddenRowsCols, readEmptyCellsAs]);

    const updatePreview = useCallback(() => {
        if (!workbook || !selectedSheet) {
            setParsedPreviewData([]);
            setPreviewColumnHeaders(false);
            setIsLoadingPreview(false);
            return;
        }
        setIsLoadingPreview(true);
        setError(null);

        const options = currentParseOptions();
        const result = parseSheetForPreview(workbook, selectedSheet, options);

        if (result.error) {
            setError(result.error);
            setParsedPreviewData([]);
            setPreviewColumnHeaders(false);
        } else {
            setParsedPreviewData(result.data);
            setPreviewColumnHeaders(result.headers);
        }
        setIsLoadingPreview(false);
    }, [workbook, selectedSheet, currentParseOptions]);

    useEffect(() => {
        updatePreview();
    }, [updatePreview]);

    const handleImport = async () => {
        if (!workbook || !selectedSheet) {
            setError("No data to import. Check sheet selection and options.");
            return;
        }
        if (parsedPreviewData.length === 0 && !previewColumnHeaders) {
             setError("No data parsed for preview. Cannot import empty sheet or invalid configuration.");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            await resetData();
            await resetVariables();

            const options = currentParseOptions();
            const importResult = processSheetForImport(workbook, selectedSheet, options);

            if (importResult.error) {
                setError(importResult.error);
                setIsProcessing(false);
                return;
            }
            
            const { processedFullData, actualHeaders } = importResult;

            if (processedFullData.length === 0 && actualHeaders.length === 0) {
                 setError("The sheet appears to be empty or no data was found with the current settings.");
                 setIsProcessing(false);
                 return;
            }

            const variables = generateVariablesFromData(processedFullData, actualHeaders, readEmptyCellsAs);
            for (const newVar of variables) {
                await addVariable(newVar);
            }

            await setData(processedFullData);
            onClose();
        } catch (e: any) {
            console.error("Error processing Excel import: ", e);
            setError(`Import failed: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setRange("");
        setFirstLineContains(true);
        setReadHiddenRowsCols(false);
        setReadEmptyCellsAs("empty");
        if (sheetNames.length > 0) {
             setSelectedSheet(sheetNames[0]);
        } else {
            setSelectedSheet(""); // Should not happen if workbook loaded correctly
        }
        setError(null);
        // updatePreview will be called by useEffect due to state changes
    };

    // Determine column headers for HotTable
    // If previewColumnHeaders is false (e.g. not firstLineContains and no data), use default A, B, C...
    // If it's an empty array (firstLineContains but header row is empty), use default A, B, C...
    const hotTableColHeaders = 
        previewColumnHeaders === false || (Array.isArray(previewColumnHeaders) && previewColumnHeaders.length === 0 && parsedPreviewData[0]?.length > 0)
        ? (parsedPreviewData[0]?.length > 0 ? Array.from({length: parsedPreviewData[0].length}, (_,i)=> XLSX.utils.encode_col(i)) : true) 
        : previewColumnHeaders;
        
    return (
        <div className="flex flex-col h-full"> 
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                <div className="flex items-center flex-1 min-w-0">
                    <Button variant="ghost" size="icon" onClick={onBack} className="mr-3 -ml-2 h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={18} />
                    </Button>
                    <FileSpreadsheet size={20} className="mr-2.5 text-primary flex-shrink-0 relative top-[-1px]" />
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold truncate text-popover-foreground" title={`Configure Import: ${fileName}`}>
                            Configure: {fileName}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            Review and configure options for your Excel file.
                        </p>
                    </div>
                </div>
                <div className="w-8"></div> 
            </div>

            <div className="p-6 flex-grow overflow-y-auto space-y-6">
                <div className="space-y-3 p-4 bg-muted/30 border border-border rounded-md">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-3 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                            <Label htmlFor="worksheet-select" className="text-xs font-medium text-muted-foreground">Worksheet</Label>
                            <Select value={selectedSheet} onValueChange={setSelectedSheet} disabled={isLoadingPreview || isProcessing || sheetNames.length === 0}>
                                <SelectTrigger id="worksheet-select" className="w-full mt-1 h-9">
                                    <SelectValue placeholder={sheetNames.length === 0 ? "No sheets found" : "Select a sheet"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sheetNames.map(name => (
                                        <SelectItem key={name} value={name}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="range-input" className="text-xs font-medium text-muted-foreground">Read range (optional)</Label>
                                <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <InfoIcon size={13} className="text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs z-50">
                                            <p>E.g., A1, A1:G10. If blank, reads entire used range. You can also specify sheet: MySheet!A1:C5</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Input 
                                id="range-input" 
                                value={range} 
                                onChange={(e) => setRange(e.target.value)} 
                                placeholder="e.g., A1:G10 or MySheet!A1:C5"
                                className="w-full mt-1 h-9 text-sm"
                                disabled={isLoadingPreview || isProcessing || !selectedSheet}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="space-y-4">
                            <Label className="text-xs font-medium text-muted-foreground">Options</Label>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="firstLineContainsExcelConfig" checked={firstLineContains} onCheckedChange={(checked) => setFirstLineContains(Boolean(checked))} disabled={isLoadingPreview || isProcessing || !selectedSheet}/>
                                    <Label htmlFor="firstLineContainsExcelConfig" className="text-sm font-normal cursor-pointer select-none">First row as variable names</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="readHiddenRowsColsConfig" checked={readHiddenRowsCols} onCheckedChange={(checked) => setReadHiddenRowsCols(Boolean(checked))} disabled={isLoadingPreview || isProcessing || !selectedSheet}/>
                                    <Label htmlFor="readHiddenRowsColsConfig" className="text-sm font-normal cursor-pointer select-none">Read hidden rows & columns</Label>
                                </div>
                                <div>
                                    <Label htmlFor="empty-cells-select" className="text-xs font-medium text-muted-foreground">Read empty cells as</Label>
                                    <Select value={readEmptyCellsAs} onValueChange={(val) => setReadEmptyCellsAs(val as "empty" | "missing")} disabled={isLoadingPreview || isProcessing || !selectedSheet}>
                                        <SelectTrigger id="empty-cells-select" className="w-full mt-1 h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="empty">Empty string (treat as valid)</SelectItem>
                                            <SelectItem value="missing">System missing (SYSMIS)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <Button variant="outline" size="sm" onClick={updatePreview} disabled={isLoadingPreview || isProcessing || !selectedSheet} className="w-full mt-3 h-8">
                                <RefreshCw size={14} className={`mr-1.5 ${isLoadingPreview ? 'animate-spin' : ''}`} />
                                Refresh Preview
                            </Button>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">Data Preview (max 100 rows shown)</Label>
                            <div className="border border-border rounded-md bg-background hot-container-excel relative min-h-[220px] max-h-[220px] overflow-auto" style={{zIndex: 0}}>
                                {(isLoadingPreview && !isProcessing) ? (
                                    <div className="absolute inset-0 flex items-center justify-center h-full text-muted-foreground bg-background/80 z-10">
                                        <RefreshCw size={18} className="animate-spin mr-2" /> Loading preview...
                                    </div>
                                ) : null}
                                {(!isLoadingPreview && error && (!parsedPreviewData || parsedPreviewData.length === 0)) ? (
                                     <div className="flex flex-col items-center justify-center h-full text-destructive p-4 text-center">
                                        <InfoIcon size={20} className="mb-2" /> 
                                        <span className="font-medium">Preview Error</span>
                                        <span className="text-xs max-w-sm mx-auto">{error}</span>
                                    </div>
                                ) : (!isLoadingPreview && (!parsedPreviewData || parsedPreviewData.length === 0) && !error) ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                                        <InfoIcon size={20} className="mb-2" /> 
                                        { !selectedSheet ? "Please select a worksheet to see a preview." : "No data to preview. Try adjusting options or check the selected range/sheet."}
                                    </div>
                                ) : (parsedPreviewData && parsedPreviewData.length > 0) ? (
                                    <HotTable
                                        ref={hotTableRef}
                                        data={parsedPreviewData}
                                        colHeaders={hotTableColHeaders}
                                        rowHeaders={true}
                                        width="100%"
                                        height="220px"
                                        manualColumnResize={true}
                                        manualRowResize={true}
                                        columnSorting={false}
                                        filters={false}
                                        dropdownMenu={false}
                                        comments={false}
                                        licenseKey="non-commercial-and-evaluation"
                                        className="htMiddle htCenter text-sm htNoEmpty"
                                        readOnly
                                    />
                                ) : null }
                            </div>
                            {error && parsedPreviewData && parsedPreviewData.length > 0 && <p className="text-xs text-destructive mt-1.5">Error while previewing: {error}</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                    <HelpCircle size={18} className="mr-1" />
                </div>
                <div>
                    <Button variant="outline" onClick={onBack} disabled={isProcessing} className="mr-2">
                        Back
                    </Button>
                    <Button variant="outline" onClick={handleReset} disabled={isProcessing} className="mr-2">
                        Reset
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={isProcessing || !!error || (parsedPreviewData.length === 0 && !previewColumnHeaders) || !selectedSheet || isLoadingPreview}
                        {...(isProcessing ? { loading: true } : {})}
                    >
                        {isProcessing && <Loader2 className="mr-2 animate-spin" size={16} />}
                        Import Data
                    </Button>
                </div>
            </div>
        </div>
    );
}; 