"use client";

import React, { useState, FC, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { Variable } from "@/types/Variable";
import * as XLSX from "xlsx";
import { HotTable, HotTableClass } from "@handsontable/react"; // Removed HotColumn as it wasn't used directly
import "handsontable/dist/handsontable.full.min.css";
import { registerAllModules } from 'handsontable/registry';
import { InfoIcon, RefreshCw, ArrowLeft, FileSpreadsheet } from "lucide-react"; // Added ArrowLeft and FileSpreadsheet
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ImportExcelConfigurationStepProps } from "./ImportExcel.types"; // Adjusted import path

// Register Handsontable modules
registerAllModules();

export const ImportExcelConfigurationStep: FC<ImportExcelConfigurationStepProps> = ({
    onClose,
    onBack,
    fileName, // Only fileName and fileContent are needed from parent
    fileContent,
}) => {
    const { setData, resetData } = useDataStore();
    const { resetVariables, addVariable } = useVariableStore();

    const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<string>("");
    
    const [range, setRange] = useState<string>("");
    const [parsedData, setParsedData] = useState<any[][]>([]);
    // Changed columnHeaders to be string[] | false to better reflect its usage for HotTable
    const [columnHeaders, setColumnHeaders] = useState<string[] | false>(false);
    
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
        try {
            setIsLoadingPreview(true);
            setError(null);
            const wb = XLSX.read(fileContent, { type: "binary", cellStyles: false, sheetStubs: true });
            setWorkbook(wb);
            const names = wb.SheetNames;
            setSheetNames(names);
            if (names.length > 0) {
                setSelectedSheet(names[0]);
            } else {
                setError("No worksheets found in the Excel file.");
            }
        } catch (e) {
            console.error("Error reading workbook: ", e);
            setError("Could not read the Excel file. It might be corrupted or an unsupported format.");
        } finally {
            setIsLoadingPreview(false);
        }
    }, [fileContent]);

    const updatePreview = useCallback(() => {
        if (!workbook || !selectedSheet) {
            setParsedData([]);
            setColumnHeaders(false);
            setIsLoadingPreview(false);
            return;
        }
        setIsLoadingPreview(true);
        setError(null);
        try {
            const sheet = workbook.Sheets[selectedSheet];
            if (!sheet) {
                setError(`Worksheet "${selectedSheet}" not found.`);
                setParsedData([]);
                setColumnHeaders(false);
                setIsLoadingPreview(false);
                return;
            }

            let currentRange = range.trim();
            const ref = sheet["!ref"];
            
            if (!currentRange && ref) {
                currentRange = ref;
            } else if (!currentRange) {
                 currentRange = "A1";
            }

            const jsonDataOpts: XLSX.Sheet2JSONOpts = {
                raw: true, 
                defval: readEmptyCellsAs === 'empty' ? "" : undefined, 
                header: firstLineContains ? 1 : "A", 
                range: currentRange !== "A1" || (ref && currentRange !== ref) ? currentRange : undefined, 
                skipHidden: !readHiddenRowsCols, 
            };
            
            let dataToDisplay: any[][];
            let headers: string[] = [];

            if (firstLineContains) {
                const rawDataWithHeader = XLSX.utils.sheet_to_json(sheet, { ...jsonDataOpts, header: 1 });
                if (rawDataWithHeader.length > 0) {
                    headers = (rawDataWithHeader.shift() as any[]).map(val => String(val ?? ""));
                    dataToDisplay = rawDataWithHeader as any[][];
                } else {
                    dataToDisplay = [];
                }
                setColumnHeaders(headers);
            } else {
                dataToDisplay = XLSX.utils.sheet_to_json(sheet, { ...jsonDataOpts, header: 'A' }) as any[][];
                const numColsPreview = dataToDisplay.length > 0 ? dataToDisplay[0].length : 0;
                setColumnHeaders(Array.from({ length: numColsPreview }, (_, i) => XLSX.utils.encode_col(i)));
            }
            
            const currentHeaders = Array.isArray(columnHeaders) && columnHeaders.length > 0 ? columnHeaders : headers;
            const finalNumCols = currentHeaders.length > 0 
                ? currentHeaders.length 
                : (dataToDisplay.length > 0 ? dataToDisplay[0]?.length || 0 : 0);

            const normalizedData = dataToDisplay.map(row => {
                const newRow = Array(finalNumCols).fill(readEmptyCellsAs === 'empty' ? "" : null);
                for(let i=0; i < Math.min(row?.length || 0, finalNumCols); i++) {
                    const cellValue = row[i];
                    newRow[i] = (cellValue === undefined || cellValue === null) && readEmptyCellsAs === 'missing' ? null : (cellValue ?? "");
                }
                return newRow;
            });

            setParsedData(normalizedData.slice(0, 100)); // Display max 100 rows

        } catch (e) {
            console.error("Error updating preview: ", e);
            setError(`Error parsing sheet. Check range or file. (${(e as Error).message})`);
            setParsedData([]);
            setColumnHeaders(false);
        } finally {
            setIsLoadingPreview(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workbook, selectedSheet, range, firstLineContains, readHiddenRowsCols, readEmptyCellsAs]);

    useEffect(() => {
        updatePreview();
    }, [updatePreview]); // updatePreview is now a stable callback

    const handleOk = async () => {
        if (!workbook || !selectedSheet || parsedData.length === 0) {
            setError("No data to import. Check sheet selection and options.");
            return;
        }
        setIsProcessing(true);
        setError(null);

        try {
            await resetData();
            await resetVariables();

            // Re-parse with final settings to get full data, not just preview
            const sheet = workbook.Sheets[selectedSheet];
            let fullRange = range.trim();
            const sheetRef = sheet["!ref"];
            if (!fullRange && sheetRef) fullRange = sheetRef;
            else if (!fullRange) fullRange = "A1";

            const jsonDataOpts: XLSX.Sheet2JSONOpts = {
                raw: true,
                defval: readEmptyCellsAs === 'empty' ? "" : undefined,
                header: firstLineContains ? 1 : "A",
                range: fullRange !== "A1" || (sheetRef && fullRange !== sheetRef) ? fullRange : undefined,
                skipHidden: !readHiddenRowsCols,
            };

            let actualHeaders: string[];
            let fullDataForStore: any[][];

            if (firstLineContains) {
                const rawFullData = XLSX.utils.sheet_to_json(sheet, { ...jsonDataOpts, header: 1 }) as any[][];
                if (rawFullData.length > 0) {
                    actualHeaders = (rawFullData.shift() as any[]).map(val => String(val ?? ""));
                    fullDataForStore = rawFullData;
                } else {
                    actualHeaders = [];
                    fullDataForStore = [];
                }
            } else {
                fullDataForStore = XLSX.utils.sheet_to_json(sheet, { ...jsonDataOpts, header: 'A' }) as any[][];
                const numCols = fullDataForStore.length > 0 ? fullDataForStore[0].length : 0;
                actualHeaders = Array.from({ length: numCols }, (_, i) => XLSX.utils.encode_col(i));
            }

            const numFinalCols = actualHeaders.length;
            const processedFullData = fullDataForStore.map(row => {
                const newRow = Array(numFinalCols).fill(readEmptyCellsAs === 'empty' ? "" : "SYSMIS");
                for(let i=0; i < Math.min(row?.length || 0, numFinalCols); i++) {
                    const cellValue = row[i];
                    newRow[i] = (cellValue === undefined || cellValue === null) && readEmptyCellsAs === 'missing' ? "SYSMIS" : (cellValue ?? "");
                }
                return newRow;
            });


            for (let colIndex = 0; colIndex < actualHeaders.length; colIndex++) {
                const colData = processedFullData.map(row => row[colIndex]);
                const variableName = String(actualHeaders[colIndex] ?? "").trim() || `VAR${String(colIndex + 1).padStart(3, '0')}`;
                
                let isNumeric = true;
                let maxDecimalPlaces = 0;
                if (colData.length > 0) {
                    for (const val of colData) {
                        if (val === null || String(val).trim() === '' || String(val).toUpperCase() === "SYSMIS") continue;
                        const numVal = Number(val);
                        if (isNaN(numVal) || !isFinite(numVal)) {
                            isNumeric = false;
                            break;
                        }
                        const parts = String(val).split('.');
                        if (parts.length > 1) {
                            maxDecimalPlaces = Math.max(maxDecimalPlaces, parts[1].length);
                        }
                    }
                }
                if (colData.every(v => v === null || String(v).trim() === '' || String(v).toUpperCase() === "SYSMIS")) isNumeric = false; 


                const newVar: Variable = {
                    columnIndex: colIndex,
                    name: variableName,
                    type: isNumeric ? 'NUMERIC' : 'STRING',
                    width: isNumeric ? 8 : Math.min(32767, Math.max(8, ...colData.map(v => String(v ?? "").length), variableName.length)),
                    decimals: isNumeric ? Math.min(maxDecimalPlaces, 16) : 0,
                    label: '',
                    columns: 12, 
                    align: isNumeric ? 'right' : 'left',
                    measure: isNumeric ? 'scale' : 'nominal',
                    role: 'input',
                    values: [],
                    missing: null,
                };
                await addVariable(newVar);
            }

            await setData(processedFullData);
            onClose();
        } catch (e) {
            console.error("Error processing Excel import: ", e);
            setError(`Import failed: ${(e as Error).message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleResetOptions = () => {
        setRange("");
        setFirstLineContains(true);
        setReadHiddenRowsCols(false);
        setReadEmptyCellsAs("empty");
        if (sheetNames.length > 0 && workbook) {
             setSelectedSheet(sheetNames[0]);
        } else {
            setSelectedSheet("");
        }
        setError(null);
        // updatePreview will be called by the useEffect hook due to state changes
    };

    const hotTableColHeaders = columnHeaders === false 
        ? (parsedData[0]?.length > 0 ? Array.from({length: parsedData[0].length}, (_,i)=> XLSX.utils.encode_col(i)) : true) 
        : columnHeaders;

    return (
        <div className="flex flex-col h-full"> {/* Main wrapper */}
            {/* Internal Header for this configuration stage */}
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
                {/* Optional: Add a spacer or other controls on the right if needed */}
                 <div className="w-8"></div> {/* Spacer to balance the back button */}
            </div>

            {/* Main Content Area - existing structure */}
            <div className="flex-grow flex flex-col overflow-hidden">
                {/* Top section: Sheet selection and Range input */}
                <div className="px-6 pt-4 pb-3 space-y-3 border-b border-border flex-shrink-0 bg-muted/30">
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

                {/* Options Panel */}
                <div className="p-6 flex-grow flex flex-col md:flex-row gap-6 overflow-hidden">
                    <div className="w-full md:w-[300px] lg:w-[320px] xl:w-[350px] flex-shrink-0 space-y-4 overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                        <div className="space-y-3 pt-2">
                             <Label className="text-xs font-medium text-muted-foreground">Options</Label>
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

                    {/* Data Preview Panel */}
                    <div className="w-full md:flex-1 flex flex-col overflow-hidden">
                        <Label className="text-xs font-medium text-muted-foreground mb-1.5 flex-shrink-0">Data Preview (max 100 rows shown)</Label>
                        <div className="border border-border rounded-md overflow-auto flex-grow bg-background hot-container-excel relative min-h-[200px]">
                            {(isLoadingPreview && !isProcessing) ? (
                                <div className="absolute inset-0 flex items-center justify-center h-full text-muted-foreground bg-background/80 z-10">
                                    <RefreshCw size={18} className="animate-spin mr-2" /> Loading preview...
                                </div>
                            ) : null}
                            {(!isLoadingPreview && error && (!parsedData || parsedData.length === 0)) ? (
                                 <div className="flex flex-col items-center justify-center h-full text-destructive p-4 text-center">
                                    <InfoIcon size={20} className="mb-2" /> 
                                    <span className="font-medium">Preview Error</span>
                                    <span className="text-xs max-w-sm mx-auto">{error}</span>
                                </div>
                            ) : (!isLoadingPreview && (!parsedData || parsedData.length === 0) && !error) ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                                    <InfoIcon size={20} className="mb-2" /> 
                                    { !selectedSheet ? "Please select a worksheet to see a preview." : "No data to preview. Try adjusting options or check the selected range/sheet."}
                                </div>
                            ) : (parsedData && parsedData.length > 0) ? (
                                <HotTable
                                    ref={hotTableRef}
                                    data={parsedData}
                                    colHeaders={hotTableColHeaders}
                                    rowHeaders={true}
                                    width="100%"
                                    height="100%"
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
                        {error && parsedData && parsedData.length > 0 && <p className="text-xs text-destructive mt-1.5 flex-shrink-0">Error: {error}</p>}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0 flex justify-between items-center">
                    <div>
                        <Button
                            variant="link"
                            onClick={handleResetOptions}
                            className="text-sm px-0 h-auto text-primary hover:text-primary/90"
                            disabled={isProcessing || isLoadingPreview}
                        >
                            Reset Options
                        </Button>
                    </div>
                    <div className="flex space-x-2">
                        <Button variant="outline" onClick={onClose} disabled={isProcessing} className="h-9">Cancel</Button>
                        <Button 
                            onClick={handleOk} 
                            disabled={isProcessing || isLoadingPreview || !parsedData || parsedData.length === 0 || (!!error && !isLoadingPreview) }
                            className="h-9 min-w-[90px]"
                        >
                            {isProcessing ? <RefreshCw size={16} className="animate-spin mr-1.5" /> : null}
                            {isProcessing ? "Importing..." : "Import"}
                        </Button>
                    </div>
                </div>
            </div>
            <style jsx global>{`
                .hot-container-excel .handsontable .htCore td, 
                .hot-container-excel .handsontable .htCore th {
                    padding: 4px 6px !important;
                    font-size: 0.8rem !important;
                    line-height: 1.2 !important;
                }
                .hot-container-excel .handsontable .htDimmed {
                    color: hsl(var(--muted-foreground)) !important;
                }
                .hot-container-excel .handsontable .htNoEmpty tbody tr td:empty {
                    background-color: hsl(var(--background)) !important; 
                }
                .hot-container-excel .handsontable colgroup col {
                    min-width: 50px !important; 
                }
            `}</style>
        </div>
    );
}; 