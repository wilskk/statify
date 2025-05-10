"use client";

import React, { useState, FC, useEffect } from "react";
import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { Variable } from "@/types/Variable";
import * as XLSX from "xlsx";
import { HotTable } from "@handsontable/react";
import { FileIcon, InfoIcon, ExternalLinkIcon, ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ReadExcelProps {
    onClose: () => void;
    onBack: () => void;
    fileName: string;
    fileContent: string;
}

const ReadExcel: FC<ReadExcelProps> = ({ onClose, onBack, fileName, fileContent }) => {
    const { setDataAndSync, resetData } = useDataStore();
    const { resetVariables, addVariable, getVariableByColumnIndex, updateVariable, variables } = useVariableStore();

    // State
    const [removeLeading, setRemoveLeading] = useState<boolean>(false);
    const [removeTrailing, setRemoveTrailing] = useState<boolean>(false);
    const [ignoreHidden, setIgnoreHidden] = useState<boolean>(false);
    const [worksheet, setWorksheet] = useState<string | undefined>(undefined);
    const [range, setRange] = useState<string>("A1:D34");
    const [data, setData] = useState<any[]>([]);
    const [firstLineContains, setFirstLineContains] = useState<boolean>(false);
    const [workbook, setWorkbook] = useState<any>(null);
    const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleOk = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            await resetData();
            await resetVariables();

            const sheet = workbook.Sheets[worksheet!];
            const dataRange = range.split(":");

            const startCell = dataRange[0] || "A1";
            const endCell = dataRange[1] || "Z100";

            const sheetData = XLSX.utils.sheet_to_json(sheet, {
                range: `${startCell}:${endCell}`,
                header: 1,
                defval: "",
                blankrows: false,
                raw: true // Get raw values to ensure proper handling
            });

            let headerRow: string[] | undefined = undefined;
            let previewData: any[] = [];

            if (firstLineContains && sheetData.length > 0) {
                headerRow = sheetData.shift() as string[];
                previewData = sheetData;
            } else {
                previewData = sheetData;
            }

            const numCols = previewData.length > 0 ? Math.max(...previewData.map(row => row.length || 0), 0) : 0;

            // Ensure all rows have the same number of columns
            const normalizedData = previewData.map(row => {
                const normalizedRow = Array(numCols).fill("");
                for (let i = 0; i < row.length; i++) {
                    // Explicitly check for undefined/null to avoid issues with 0 values
                    normalizedRow[i] = row[i] !== undefined && row[i] !== null ? row[i] : "";
                }
                return normalizedRow;
            });

            // Process all data according to options (leading/trailing spaces)
            const processedData = normalizedData.map(row =>
                row.map(val => {
                    let processed = String(val !== undefined && val !== null ? val : "");
                    if (removeLeading) processed = processed.replace(/^\s+/, '');
                    if (removeTrailing) processed = processed.replace(/\s+$/, '');
                    return processed;
                })
            );

            // Create variables for each column
            for (let colIndex = 0; colIndex < numCols; colIndex++) {
                const colData = processedData.map(row => row[colIndex]);

                // Determine if the column is numeric (handle 0 values correctly)
                const isNumeric = colData.every(val => {
                    if (!val || val.toString().trim() === '') return true;
                    const num = parseFloat(val.toString());
                    return !isNaN(num) && isFinite(num);
                });

                const maxLength = isNumeric ? 8 : Math.max(
                    ...colData.map(val => String(val).length),
                    8
                );

                const variableName = firstLineContains && headerRow && headerRow[colIndex]
                    ? headerRow[colIndex] || `VAR${colIndex + 1}`
                    : `VAR${colIndex + 1}`;

                const variable: Variable = {
                    columnIndex: colIndex,
                    name: variableName,
                    type: isNumeric ? "NUMERIC" : "STRING",
                    width: isNumeric ? 8 : Math.min(maxLength, 200),
                    decimals: isNumeric ? 2 : 0,
                    label: "",
                    columns: 200,
                    align: isNumeric ? "right" : "left",
                    measure: "nominal",
                    role: "input",
                    values: [],
                    missing: null,
                };

                await addVariable(variable);
            }

            // Set all data at once instead of cell by cell
            await setDataAndSync(processedData);

            onClose();
        } catch (error) {
            console.error("Error processing Excel file:", error);
            setError("Failed to process Excel file. Please check the format and try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setFirstLineContains(false);
        setRemoveLeading(false);
        setRemoveTrailing(false);
        setIgnoreHidden(false);
        setError(null);

        if (workbook) {
            const sheetNames = workbook.SheetNames;
            setWorksheet(sheetNames[0]);
            const sheet = workbook.Sheets[sheetNames[0]];
            const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
            const rowCount = sheetData.length;
            const colCount = Array.isArray(sheetData[0]) ? sheetData[0].length : 0;
            setRange(`A1:${String.fromCharCode(65 + colCount - 1)}${rowCount}`);
            setData(sheetData.slice(0, 100).map((row: any[]) =>
                Array.isArray(row) ? row.slice(0, 50) : []
            ));
            setColumnHeaders([]);
        }
    };

    useEffect(() => {
        if (!fileContent) return;

        try {
            const wb = XLSX.read(fileContent, { type: "binary" });
            setWorkbook(wb);

            const sheetNames = wb.SheetNames;
            setWorksheet(sheetNames[0]);

            const sheet = wb.Sheets[sheetNames[0]];
            const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

            const rowCount = sheetData.length;
            const colCount = Array.isArray(sheetData[0]) ? sheetData[0].length : 0;
            setRange(`A1:${String.fromCharCode(65 + Math.min(colCount - 1, 25))}${rowCount}`);

            setData(sheetData.slice(0, 100).map((row: any[]) =>
                Array.isArray(row) ? row.slice(0, 50) : []
            ));
        } catch (error) {
            console.error("Error reading Excel file:", error);
            setError("Failed to read Excel file. The file might be corrupted or in an unsupported format.");
        }
    }, [fileContent]);

    const handleWorksheetChange = (newWorksheet: string) => {
        setWorksheet(newWorksheet);
        updatePreview(newWorksheet, range, firstLineContains);
    };

    const handleRangeChange = (newRange: string) => {
        setRange(newRange);
        updatePreview(worksheet, newRange, firstLineContains);
    };

    const handleFirstLineChange = (checked: boolean) => {
        setFirstLineContains(checked);
        updatePreview(worksheet, range, checked);
    };

    const updatePreview = (worksheet: string | undefined, range: string, firstLineContains: boolean) => {
        if (!worksheet || !workbook) return;

        try {
            const sheet = workbook.Sheets[worksheet];
            const sheetData = XLSX.utils.sheet_to_json(sheet, {
                range: range,
                header: 1,
                defval: "",
                blankrows: false,
                raw: true
            });

            let headerRow: string[] | undefined;
            if (firstLineContains && sheetData.length > 0) {
                headerRow = sheetData.shift() as string[];
                setColumnHeaders(headerRow || []);
            } else {
                setColumnHeaders([]);
            }

            setData(sheetData);
            setError(null);
        } catch (error) {
            console.error("Error updating preview:", error);
            setError("Invalid range specified. Please check your range format (e.g., A1:D10).");
        }
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
                    <DialogTitle className="text-lg font-medium text-popover-foreground">Read Excel File</DialogTitle>
                    <div className="flex items-center mt-1">
                        <FileIcon size={16} className="mr-2 text-muted-foreground" />
                        <span className="text-sm truncate max-w-xs text-muted-foreground">{fileName}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-6">
                {/* Left Column: Options */}
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="worksheet" className="text-sm font-medium text-popover-foreground">Worksheet:</Label>
                        <div className="relative mt-1">
                            <select
                                id="worksheet"
                                value={worksheet}
                                onChange={(e) => handleWorksheetChange(e.target.value)}
                                className="w-full appearance-none px-3 py-2 pr-8 text-sm rounded border border-input focus:border-ring focus:outline-none focus:ring-1 bg-background"
                                disabled={!workbook}
                            >
                                {workbook?.SheetNames.map((name: string) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                            {/* You might want to use a ChevronDownIcon here like in ReadCSV.tsx if preferred */}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="range" className="text-sm font-medium text-popover-foreground">Read a specific range of data:</Label>
                        <input
                            type="text"
                            id="range"
                            value={range}
                            onChange={(e) => handleRangeChange(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 text-sm rounded border border-input focus:border-ring focus:outline-none focus:ring-1"
                            placeholder="e.g., A1:D34"
                            disabled={!workbook}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            If not specified, all data from the selected worksheet will be read.
                        </p>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="firstLineExcel" checked={firstLineContains} onCheckedChange={(checked) => handleFirstLineChange(Boolean(checked))} />
                            <Label htmlFor="firstLineExcel" className="text-sm font-medium text-popover-foreground">First line contains variable names</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="removeLeadingExcel" checked={removeLeading} onCheckedChange={(checked) => setRemoveLeading(Boolean(checked))} />
                            <Label htmlFor="removeLeadingExcel" className="text-sm font-medium text-popover-foreground">Remove leading spaces from string values</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="removeTrailingExcel" checked={removeTrailing} onCheckedChange={(checked) => setRemoveTrailing(Boolean(checked))} />
                            <Label htmlFor="removeTrailingExcel" className="text-sm font-medium text-popover-foreground">Remove trailing spaces from string values</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="ignoreHiddenExcel" checked={ignoreHidden} onCheckedChange={(checked) => setIgnoreHidden(Boolean(checked))} />
                            <Label htmlFor="ignoreHiddenExcel" className="text-sm font-medium text-popover-foreground">Ignore hidden rows and columns</Label>
                            <InfoIcon size={14} className="text-muted-foreground cursor-help" title="This option is currently not implemented." />
                        </div>
                    </div>
                </div>

                {/* Right Column: Data Preview */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-popover-foreground">Data Preview (max 100 rows, 50 columns):</Label>
                    <div className="border border-border rounded overflow-hidden handsontable-container" style={{ height: '300px' }}>
                        {workbook && worksheet && (
                            <HotTable
                                data={data}
                                colHeaders={firstLineContains ? columnHeaders : true}
                                rowHeaders={true}
                                width="100%"
                                height="100%"
                                licenseKey="non-commercial-and-evaluation" // Ensure this is appropriate for your use case
                                readOnly
                                manualColumnResize
                                manualRowResize
                                className="htMiddle htCenter"
                            />
                        )}
                        {!workbook && <p className="p-4 text-sm text-muted-foreground">Select a file to see preview.</p>}
                    </div>
                </div>
            </div>

            {error && (
                <div className="px-6 pb-4 text-sm text-destructive">
                    {error}
                </div>
            )}

            <DialogFooter className="border-t border-border px-6 py-4 flex justify-between">
                <Button
                    variant="link"
                    onClick={handleReset}
                    className="text-primary hover:text-primary/90 px-0"
                    disabled={isProcessing || !workbook}
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
                    <Button onClick={handleOk} disabled={isProcessing || !workbook}>
                        OK
                    </Button>
                </div>
            </DialogFooter>
        </>
    );
};

export default ReadExcel;