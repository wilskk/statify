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
            <div className="border-b px-6 py-4 flex items-center">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="mr-2 -ml-2 text-gray-500 hover:text-black"
                >
                    <ArrowLeft size={16} />
                </Button>
                <div>
                    <DialogTitle className="text-lg font-medium">Read Excel File</DialogTitle>
                    <div className="flex items-center mt-1">
                        <FileIcon size={16} className="mr-2 text-gray-600" />
                        <span className="text-sm truncate max-w-xs">{fileName}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 p-6">
                {/* Left column - Selection options */}
                <div>
                    <h3 className="text-sm font-medium mb-3">Worksheet Selection</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm mb-1">Worksheet:</label>
                            <select
                                value={worksheet}
                                onChange={(e) => handleWorksheetChange(e.target.value)}
                                className="w-full px-3 py-2 border rounded text-sm"
                            >
                                {workbook && workbook.SheetNames.map((sheetName: string, index: number) => (
                                    <option key={index} value={sheetName}>{sheetName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Cell Range:</label>
                            <input
                                type="text"
                                value={range}
                                onChange={(e) => handleRangeChange(e.target.value)}
                                className="w-full px-3 py-2 border rounded text-sm"
                                placeholder="e.g. A1:Z100"
                            />
                        </div>
                    </div>

                    <h3 className="text-sm font-medium mt-6 mb-3">Import Options</h3>
                    <div className="space-y-3">
                        <div className="flex items-start space-x-2">
                            <Checkbox
                                id="first-line"
                                checked={firstLineContains}
                                onCheckedChange={(checked) => handleFirstLineChange(checked === true)}
                            />
                            <Label htmlFor="first-line" className="text-sm cursor-pointer">
                                Read variable names from first row
                            </Label>
                        </div>

                        <div className="flex items-start space-x-2">
                            <Checkbox
                                id="ignore-hidden"
                                checked={ignoreHidden}
                                onCheckedChange={(checked) => setIgnoreHidden(checked === true)}
                            />
                            <Label htmlFor="ignore-hidden" className="text-sm cursor-pointer">
                                Ignore hidden rows and columns
                            </Label>
                        </div>

                        <div className="flex items-start space-x-2">
                            <Checkbox
                                id="remove-leading"
                                checked={removeLeading}
                                onCheckedChange={(checked) => setRemoveLeading(checked === true)}
                            />
                            <Label htmlFor="remove-leading" className="text-sm cursor-pointer">
                                Remove leading spaces from string values
                            </Label>
                        </div>

                        <div className="flex items-start space-x-2">
                            <Checkbox
                                id="remove-trailing"
                                checked={removeTrailing}
                                onCheckedChange={(checked) => setRemoveTrailing(checked === true)}
                            />
                            <Label htmlFor="remove-trailing" className="text-sm cursor-pointer">
                                Remove trailing spaces from string values
                            </Label>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Right column - Data preview */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium">Data Preview</h3>
                        <ExternalLinkIcon size={14} className="text-gray-500" />
                    </div>

                    <div className="border rounded overflow-hidden h-64">
                        <HotTable
                            data={data}
                            colHeaders={columnHeaders.length > 0 ? columnHeaders : true}
                            rowHeaders={true}
                            width="100%"
                            height="100%"
                            licenseKey="non-commercial-and-evaluation"
                            className="excel-preview"
                            readOnly={true}
                            manualColumnResize={true}
                            contextMenu={false}
                            disableVisualSelection={true}
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center p-2 border-t bg-gray-50 text-xs text-gray-500">
                <InfoIcon size={14} className="mr-1" />
                <span>Preview displays first 100 rows and 50 columns of the selected range</span>
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
        </>
    );
};

export default ReadExcel;