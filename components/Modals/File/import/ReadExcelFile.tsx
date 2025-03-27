"use client";

import React, { useState, FC, useEffect } from "react";
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
import * as XLSX from "xlsx";
import { HotTable } from "@handsontable/react";
import { FileIcon, InfoIcon, ExternalLinkIcon, XIcon } from "lucide-react";

interface ReadExcelFileProps {
    onClose: () => void;
    fileName: string;
    fileContent: string;
}

const ReadExcelFile: FC<ReadExcelFileProps> = ({ onClose, fileName, fileContent }) => {
    const { updateCell, resetData } = useDataStore();
    const { resetVariables } = useVariableStore();
    const [removeLeading, setRemoveLeading] = useState<boolean>(false);
    const [removeTrailing, setRemoveTrailing] = useState<boolean>(false);
    const [ignoreHidden, setIgnoreHidden] = useState<boolean>(false);
    const [worksheet, setWorksheet] = useState<string | undefined>(undefined);
    const [range, setRange] = useState<string>("A1:D34");
    const [data, setData] = useState<any[]>([]);
    const [firstLineContains, setFirstLineContains] = useState<boolean>(false);
    const [workbook, setWorkbook] = useState<any>(null);
    const [columnHeaders, setColumnHeaders] = useState<string[]>([]);

    const handleOk = async () => {
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
        });

        let headerRow: string[] | undefined = undefined;
        let previewData: any[] = [];

        if (firstLineContains) {
            headerRow = sheetData.shift() as string[];
            previewData = sheetData;
        } else {
            previewData = sheetData;
        }

        setData(previewData);

        const store = useVariableStore.getState();
        const { addVariable, getVariableByColumnIndex, updateVariable, variables } = store;

        const numCols = previewData[0]?.length || 0;

        for (let colIndex = 0; colIndex < numCols; colIndex++) {
            const colData = previewData.map((row) => row[colIndex] || "");
            const isNumeric = colData.every((val) => !isNaN(parseFloat(val)));

            const maxLength = isNumeric ? 8 : Math.max(...colData.map((val) => val.length));
            const variableName = firstLineContains && headerRow ? headerRow[colIndex] : `VAR${colIndex + 1}`;

            const variable: Variable = {
                columnIndex: colIndex,
                name: variableName,
                type: isNumeric ? "NUMERIC" : "STRING",
                width: isNumeric ? 8 : maxLength,
                decimals: isNumeric ? 2 : 0,
                label: "",
                values: [],
                missing: [],
                columns: 200,
                align: "right",
                measure: "nominal",
                role: "input",
            };

            const existingVariable = getVariableByColumnIndex(colIndex);
            if (existingVariable) {
                const rowIndex = variables.findIndex((v) => v.columnIndex === colIndex);
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

        previewData.forEach((row, rowIndex) => {
            row.forEach((value: string | number, colIndex: number) => {
                updateCell(rowIndex, colIndex, String(value));
            });
        });

        onClose();
    };

    const handleReset = () => {
        setFirstLineContains(false);
        setRemoveLeading(false);
        setRemoveTrailing(false);
        setIgnoreHidden(false);
        if (workbook) {
            const sheetNames = workbook.SheetNames;
            setWorksheet(sheetNames[0]);
            const sheet = workbook.Sheets[sheetNames[0]];
            const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
            const rowCount = sheetData.length;
            const colCount = Array.isArray(sheetData[0]) ? sheetData[0].length : 0;
            setRange(`A1:${String.fromCharCode(65 + colCount - 1)}${rowCount}`);
            setData(sheetData.slice(0, 100).map((row: any[]) => Array.isArray(row) ? row.slice(0, 50) : []));
        }
    };

    const handleCancel = () => {
        onClose();
    };

    const handleHelp = () => {
        // Help functionality
    };

    useEffect(() => {
        if (!fileContent) return;

        const wb = XLSX.read(fileContent, { type: "binary" });
        setWorkbook(wb);

        const sheetNames = wb.SheetNames;
        setWorksheet(sheetNames[0]);

        const sheet = wb.Sheets[sheetNames[0]];
        const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        const rowCount = sheetData.length;
        const colCount = Array.isArray(sheetData[0]) ? sheetData[0].length : 0;
        setRange(`A1:${String.fromCharCode(65 + colCount - 1)}${rowCount}`);

        setData(sheetData.slice(0, 100).map((row: any[]) => Array.isArray(row) ? row.slice(0, 50) : []));
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

        const sheet = workbook.Sheets[worksheet];
        const sheetData = XLSX.utils.sheet_to_json(sheet, {
            range: range,
            header: 1,
            defval: "",
        });

        let headerRow: string[] | undefined;
        if (firstLineContains) {
            headerRow = sheetData.shift() as string[];
        }

        const previewData = firstLineContains ? sheetData : sheetData;

        setData(previewData);

        if (firstLineContains) {
            setColumnHeaders(headerRow || []);
        }
    };

    return (
        <DialogContent className="sm:max-w-2xl p-0 border-0 rounded-md bg-white">
            <div className="border-b">
                <div className="p-4">
                    <DialogTitle className="text-lg font-medium">Read Excel File</DialogTitle>
                    <DialogDescription className="text-sm text-gray-500 mt-1">
                        Configure import settings and preview Excel data
                    </DialogDescription>
                </div>
            </div>

            <div className="p-4 border-b">
                <div className="flex items-center mb-4">
                    <FileIcon size={18} className="mr-2 text-gray-600" />
                    <span className="text-sm font-medium">{fileName}</span>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    {/* Left column - Selection options */}
                    <div>
                        <h3 className="text-sm font-medium mb-3">Worksheet Selection</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm mb-1">Worksheet:</label>
                                <select
                                    value={worksheet}
                                    onChange={(e) => handleWorksheetChange(e.target.value)}
                                    className="w-full px-3 py-2 border rounded"
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
                                    className="w-full px-3 py-2 border rounded"
                                    placeholder="e.g. A1:Z100"
                                />
                            </div>
                        </div>

                        <h3 className="text-sm font-medium mt-6 mb-3">Import Options</h3>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={firstLineContains}
                                    onChange={(e) => handleFirstLineChange(e.target.checked)}
                                    className="mr-2 h-4 w-4"
                                />
                                <span className="text-sm">Read variable names from first row</span>
                            </label>

                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={ignoreHidden}
                                    onChange={(e) => setIgnoreHidden(e.target.checked)}
                                    className="mr-2 h-4 w-4"
                                />
                                <span className="text-sm">Ignore hidden rows and columns</span>
                            </label>

                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={removeLeading}
                                    onChange={(e) => setRemoveLeading(e.target.checked)}
                                    className="mr-2 h-4 w-4"
                                />
                                <span className="text-sm">Remove leading spaces from string values</span>
                            </label>

                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={removeTrailing}
                                    onChange={(e) => setRemoveTrailing(e.target.checked)}
                                    className="mr-2 h-4 w-4"
                                />
                                <span className="text-sm">Remove trailing spaces from string values</span>
                            </label>
                        </div>
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
            </div>

            <div className="flex items-center p-2 border-b bg-gray-50 text-xs text-gray-500">
                <InfoIcon size={14} className="mr-1" />
                <span>Preview displays first 100 rows and 50 columns of the selected range</span>
            </div>

            <DialogFooter className="p-4 flex justify-end gap-2">
                <Button
                    onClick={handleOk}
                    className="bg-black text-white hover:bg-gray-800 h-9 px-4"
                >
                    OK
                </Button>
                <Button
                    variant="outline"
                    onClick={handleReset}
                    className="bg-white text-black border h-9 px-4"
                >
                    Reset
                </Button>
                <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="bg-white text-black border h-9 px-4"
                >
                    Cancel
                </Button>
                <Button
                    variant="outline"
                    onClick={handleHelp}
                    className="bg-white text-black border h-9 px-4"
                >
                    Help
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default ReadExcelFile;