"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useModalStore, ModalType } from "@/stores/useModalStore";
import { Button } from '@/components/ui/button';
import { File, Database, Loader2 } from 'lucide-react';
import { useDataStore, DataRow } from '@/stores/useDataStore';
import { useMetaStore } from '@/stores/useMetaStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { Variable, ValueLabel, MissingValuesSpec, MissingRange } from '@/types/Variable';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const exampleFiles = {
    sav: [
        { name: 'sleep.sav', path: '/exampleData/sleep.sav' },
        { name: 'DummyData.sav', path: '/exampleData/DummyData.sav' },
        { name: 'Teach.sav', path: '/exampleData/Teach.sav' },
        { name: 'titanic.sav', path: '/exampleData/titanic.sav' },
        { name: 'well_being.sav', path: '/exampleData/well_being.sav' },
        { name: 'health_control.sav', path: '/exampleData/health_control.sav' },
        { name: 'anxiety.sav', path: '/exampleData/anxiety.sav' },
    ]
};

// Helper function to map SPSS format types to our interface types
const mapSPSSTypeToInterface = (formatType: string): string => {
    const typeMap: { [key: string]: string } = {
        "F": "NUMERIC", "COMMA": "COMMA", "E": "SCIENTIFIC", "DATE": "DATE",
        "ADATE": "ADATE", "EDATE": "EDATE", "SDATE": "SDATE", "JDATE": "JDATE",
        "QYR": "QYR", "MOYR": "MOYR", "WKYR": "WKYR", "DATETIME": "DATETIME",
        "TIME": "TIME", "DTIME": "DTIME", "WKDAY": "WKDAY", "MONTH": "MONTH",
        "DOLLAR": "DOLLAR", "A": "STRING", "CCA": "CCA", "CCB": "CCB",
        "CCC": "CCC", "CCD": "CCD", "CCE": "CCE"
    };
    return typeMap[formatType] || "NUMERIC";
};

// Helper function to convert SAV missing info to MissingValuesSpec
const convertSavMissingToSpec = (savMissing: any): MissingValuesSpec | null => {
    if (savMissing === null || savMissing === undefined) {
        return null;
    }

    // Case 1: Already an array (assume discrete)
    if (Array.isArray(savMissing)) {
        return savMissing.length > 0 ? { discrete: savMissing } : null;
    }

    // Case 2: Object that looks like a range {min?, max?}
    if (typeof savMissing === 'object' && (savMissing.hasOwnProperty('min') || savMissing.hasOwnProperty('max'))) {
        const range: MissingRange = {};
        if (savMissing.min !== undefined && typeof savMissing.min === 'number') {
            range.min = savMissing.min;
        }
        if (savMissing.max !== undefined && typeof savMissing.max === 'number') {
            range.max = savMissing.max;
        }
        // Only return range if at least one bound is valid
        return range.min !== undefined || range.max !== undefined ? { range } : null;
    }

    // Case 3: Single discrete value (string or number)
    if (typeof savMissing === 'string' || typeof savMissing === 'number') {
        return { discrete: [savMissing] };
    }

    // Fallback: Unknown format, treat as no missing values
    console.warn("Unknown SAV missing value format:", savMissing);
    return null;
};

export const ExampleDatasetModal = () => {
    const { modals, closeModal } = useModalStore();
    const { setDataAndSync, resetData } = useDataStore();
    const { setMeta: setProjectMeta, resetMeta: resetProjectMeta } = useMetaStore();
    const { overwriteVariables, resetVariables, setVariables } = useVariableStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentModal = modals[modals.length - 1];
    const isModalOpen = currentModal?.type === ModalType.ExampleDataset;

    const parseCSV = (content: string): Promise<DataRow[]> => {
        return new Promise((resolve, reject) => {
            Papa.parse(content, {
                header: false,
                skipEmptyLines: true,
                complete: (results: Papa.ParseResult<unknown>) => {
                    if (results.errors.length) {
                        const errorMsg = results.errors.map((err: Papa.ParseError) => err.message).join("; ");
                        reject(new Error(errorMsg));
                    } else {
                        const data = results.data as unknown[][];
                        if (data.length === 0) {
                            resolve([]);
                            return;
                        }
                        const sanitizedData = data.map(row => 
                            row.map(cell => (typeof cell === 'string' || typeof cell === 'number' ? cell : String(cell)))
                        );
                        const maxCols = Math.max(...sanitizedData.map(row => row.length));
                        const paddedData = sanitizedData.map(row => {
                            const newRow = [...row];
                            while (newRow.length < maxCols) {
                                newRow.push("");
                            }
                            return newRow;
                        });
                        resolve(paddedData as DataRow[]);
                    }
                },
                error: (error: Papa.ParseError) => {
                    reject(error);
                }
            } as Papa.ParseConfig<unknown>);
        });
    };

    const parseXLSX = (content: ArrayBuffer): Promise<DataRow[]> => {
        return new Promise((resolve, reject) => {
            try {
                const workbook = XLSX.read(content, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
                resolve(jsonData as DataRow[]);
            } catch (err: unknown) {
                reject(err instanceof Error ? err : new Error(String(err)));
            }
        });
    };

    const generateDefaultVariables = (numCols: number): Variable[] => {
        const variables: Variable[] = [];
        for (let i = 0; i < numCols; i++) {
            variables.push({
                columnIndex: i,
                name: `VAR${String(i + 1).padStart(3, '0')}`,
                type: "NUMERIC",
                width: 8,
                decimals: 2,
                label: "",
                values: [],
                missing: null,
                columns: 64,
                align: "right",
                measure: "unknown",
                role: "input"
            });
        }
        return variables;
    };

    const handleFileClick = async (filePath: string) => {
        setIsLoading(true);
        setError(null);
        const fileName = filePath.split('/').pop() || 'Untitled Project';
        const fileExtension = filePath.split('.').pop()?.toLowerCase();
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'; // Get backend URL

        try {
            console.log("Fetching example file from path:", filePath);
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error fetching file! status: ${response.status}`);
            }

            let parsedData: DataRow[] = [];
            let variables: Variable[] = [];
            let fileToUseForMeta: { name: string, path: string } = { name: fileName, path: filePath }; // Keep track of file info

            if (fileExtension === 'csv') {
                const csvContent = await response.text();
                parsedData = await parseCSV(csvContent);
                if (parsedData.length > 0) {
                    variables = generateDefaultVariables(parsedData[0].length);
                }
            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                const arrayBuffer = await response.arrayBuffer();
                parsedData = await parseXLSX(arrayBuffer);
                 if (parsedData.length > 0) {
                    variables = generateDefaultVariables(parsedData[0].length);
                }
            } else if (fileExtension === 'sav') {
                const savBlob = await response.blob();
                const formData = new FormData();
                formData.append('file', savBlob, fileName);

                // Reset state *before* API call for SAV, consistent with OpenData
                await resetData();
                await resetVariables();
                // No meta reset here, will be set later

                const parseResponse = await fetch(`${backendUrl}/sav/upload`, {
                    method: 'POST',
                    body: formData,
                });

                if (!parseResponse.ok) {
                    const errorText = await parseResponse.text();
                    throw new Error(`Backend error processing SAV: ${parseResponse.status} - ${errorText || 'Unknown error'}`);
                }

                const result = await parseResponse.json();
                if (!result.rows || !result.meta || !result.meta.sysvars) {
                    throw new Error('Invalid response structure from backend SAV upload endpoint.');
                }

                // --- Start: Logic copied and adapted from OpenData.tsx --- 
                const numCases = result.meta.header.n_cases;
                const numVars = result.meta.header.n_vars; // Use header n_vars
                const sysvars = result.meta.sysvars;

                variables = sysvars.map((varInfo: any, colIndex: number) => {
                    const variableName = varInfo.name || `VAR${colIndex + 1}`;
                    // Use optional chaining carefully, match OpenData
                    const formatType = varInfo.printFormat?.typestr; 
                    const isString = formatType === "A" || varInfo.type === 1;

                    const valueLabelsObj = result.meta.valueLabels?.find(
                        (vl: any) => vl.appliesToNames?.includes(variableName) // Use optional chaining
                    );

                    const valueLabels = valueLabelsObj ?
                        valueLabelsObj.entries.map((entry: any) => ({
                            id: undefined,
                            variableName,
                            value: entry.val,
                            label: entry.label
                        })) : [];

                    const missingSpec = convertSavMissingToSpec(varInfo.missing);

                    return {
                        columnIndex: colIndex,
                        name: variableName,
                        type: mapSPSSTypeToInterface(formatType), // Use helper function
                        width: varInfo.printFormat?.width, // Use optional chaining
                        decimals: varInfo.printFormat?.nbdec, // Use optional chaining
                        label: varInfo.label || "",
                        values: valueLabels,
                        missing: missingSpec, // Gunakan spec yang sudah dikonversi
                        columns: 200, // Match OpenData default
                        align: isString ? "left" : "right",
                        measure: isString ? "nominal" : "scale", // Match OpenData logic
                        role: "input"
                    };
                });

                parsedData = Array(numCases).fill(0).map((_, rowIndex) => {
                    const rowData = result.rows[rowIndex] || {};
                    // Ensure sysvars length is respected, match OpenData
                    return Array(numVars).fill(0).map((_, colIndex) => {
                        const colName = sysvars[colIndex]?.name; 
                        return rowData[colName] !== undefined ? rowData[colName] : "";
                    });
                });
                // --- End: Logic copied and adapted from OpenData.tsx --- 

            } else {
                throw new Error(`Unsupported file type: ${fileExtension}`);
            }

            // State updates outside the if/else block, after processing
            // Reset state just before setting new state (if not SAV)
            if (fileExtension !== 'sav') {
                await resetData();
                await resetVariables();
            }
            await resetProjectMeta(); // Reset meta for all types before setting new

            // Set project meta using the file info
            await setProjectMeta({ name: fileToUseForMeta.name, location: fileToUseForMeta.name, created: new Date() });

            // Set data and variables
            await setDataAndSync(parsedData);
            if (fileExtension === 'sav') {
                await overwriteVariables(variables); // Use overwrite for SAV
            } else {
                await setVariables(variables); // Use setVariables for others
            }

            closeModal();
            router.push('/dashboard/data');

        } catch (err: any) {
            console.error("Error loading example data:", err);
            const errorToSet = err instanceof Error ? err.message : String(err);
            setError(errorToSet || "Failed to load data.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        closeModal();
    }

    const renderFileList = (files: { name: string; path: string }[]) => (
        <ul className="space-y-2">
            {files.map((file) => (
                <li key={file.path}>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-left h-auto py-2 px-3"
                        onClick={() => handleFileClick(file.path)}
                        disabled={isLoading}
                    >
                        <File className="h-4 w-4 mr-2 flex-shrink-0 text-blue-600" />
                        <span className="truncate font-medium">{file.name}</span>
                    </Button>
                </li>
            ))}
        </ul>
    );

    return (
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[525px] bg-white text-black">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <Database className="h-5 w-5 mr-2 text-blue-700"/> Dataset Contoh
                    </DialogTitle>
                    <DialogDescription>
                        Pilih dataset contoh (.sav) untuk memulai analisis. Data akan dimuat ke dalam proyek baru.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-black" />
                        </div>
                    )}
                    {error && (
                        <p className="text-red-600 text-sm px-4 py-2 bg-red-100 rounded border border-red-300">{error}</p>
                    )}
                    <div>
                        <h4 className="font-semibold mb-3 text-base border-b pb-1">File SPSS (.sav)</h4>
                        {renderFileList(exampleFiles.sav)}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}; 