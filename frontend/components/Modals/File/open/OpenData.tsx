// statify/components/modal/OpenData.tsx
"use client";

import React, { useState, FC } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ModalType, useModal } from "@/hooks/useModal";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useMetaStore } from "@/stores/useMetaStore";
import { Variable, VariableType, ValueLabel, MissingValuesSpec, MissingRange, spssDateTypes } from "@/types/Variable";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileText, X, AlertCircle } from "lucide-react";
import { spssSecondsToDateString } from "@/lib/spssDateConverter";

interface OpenDataProps {
    onClose: () => void;
}

const mapSPSSTypeToInterface = (formatType: string): VariableType => {
    const typeMap: { [key: string]: VariableType } = {
        "F": "NUMERIC", "COMMA": "COMMA", "E": "SCIENTIFIC", "DATE": "DATE",
        "ADATE": "ADATE", "EDATE": "EDATE", "SDATE": "SDATE", "JDATE": "JDATE",
        "QYR": "QYR", "MOYR": "MOYR", "WKYR": "WKYR", "DATETIME": "DATETIME",
        "TIME": "TIME", "DTIME": "DTIME", "WKDAY": "WKDAY", "MONTH": "MONTH",
        "DOLLAR": "DOLLAR", "A": "STRING", "CCA": "CCA", "CCB": "CCB",
        "CCC": "CCC", "CCD": "CCD", "CCE": "CCE"
    };
    return typeMap[formatType] || "NUMERIC";
};

const OpenData: FC<OpenDataProps> = ({ onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { closeModal } = useModal();
    const { overwriteVariables, resetVariables } = useVariableStore();
    const { setDataAndSync, resetData } = useDataStore();
    const { setMeta: setProjectMeta } = useMetaStore();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0] || null;
        setFile(selected);
        setError(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith('.sav')) {
                setFile(droppedFile);
                setError(null);
            } else {
                setError("Only .sav files are supported");
            }
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleSubmit = async () => {
        if (file) {
            const formData = new FormData();
            formData.append("file", file);

            setLoading(true);
            setError(null);

            try {
                await resetData();
                await resetVariables();

                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
                const response = await fetch(`${backendUrl}/api/sav/upload`, {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(errorData?.message || "Failed to process file on backend");
                }

                const result = await response.json();

                const metaHeader = result.meta?.header;
                const sysvars = result.meta?.sysvars;
                const valueLabelsData = result.meta?.valueLabels;
                const dataRowsRaw = result.rows;

                if (!metaHeader || !sysvars || !dataRowsRaw) {
                    throw new Error("Invalid response structure from backend");
                }

                const numCases = metaHeader.n_cases;
                const numVars = metaHeader.n_vars;

                // Proses metadata menjadi array 'variables'
                const variables: Variable[] = sysvars.map((varInfo: any, colIndex: number): Variable => {
                    const variableName = varInfo.name || `VAR${String(colIndex + 1).padStart(3, '0')}`;
                    const formatType = varInfo.printFormat?.typestr || (varInfo.type === 1 ? "A" : "F");
                    const isString = formatType === "A";

                    const valueLabelsObj = valueLabelsData?.find(
                        (vl: any) => vl.appliesToNames?.includes(variableName)
                    );
                    const values: ValueLabel[] = valueLabelsObj ?
                        valueLabelsObj.entries.map((entry: any): ValueLabel => ({
                            variableName,
                            value: entry.val,
                            label: entry.label
                        })) : [];

                    let missingValueSpec: MissingValuesSpec | null = null;
                    const rawMissing = varInfo.missing;

                    if (rawMissing !== null && rawMissing !== undefined) {
                        if (typeof rawMissing === 'object' && !Array.isArray(rawMissing) && (rawMissing.hasOwnProperty('min') || rawMissing.hasOwnProperty('max'))) {
                            const range: MissingRange = {};
                            if (rawMissing.min !== undefined && typeof rawMissing.min === 'number') {
                                range.min = rawMissing.min;
                            }
                            if (rawMissing.max !== undefined && typeof rawMissing.max === 'number') {
                                range.max = rawMissing.max;
                            }
                            if (range.min !== undefined || range.max !== undefined) {
                                missingValueSpec = { range };
                            }
                        } else if (Array.isArray(rawMissing)) {
                            const discreteValues = rawMissing.filter(v => typeof v === 'string' || typeof v === 'number');
                            if (discreteValues.length > 0) {
                                missingValueSpec = { discrete: discreteValues };
                            }
                        } else if (typeof rawMissing === 'string' || typeof rawMissing === 'number') {
                            missingValueSpec = { discrete: [rawMissing] };
                        } else {
                            console.warn("Unknown SAV missing value format in OpenData:", rawMissing);
                        }
                    }

                    return {
                        columnIndex: colIndex,
                        name: variableName,
                        type: mapSPSSTypeToInterface(formatType),
                        width: varInfo.printFormat?.width || (isString ? 8 : 8),
                        decimals: varInfo.printFormat?.nbdec ?? (isString ? 0 : 2),
                        label: varInfo.label || "",
                        values: values,
                        missing: missingValueSpec,
                        columns: 64,
                        align: isString ? "left" : "right",
                        measure: "unknown",
                        role: "input"
                    };
                });

                // Proses data menjadi 'dataMatrix'
                const dataMatrix = Array(numCases).fill(null).map((_, rowIndex) => {
                    const rowData = dataRowsRaw[rowIndex] || {};
                    return Array(numVars).fill("").map((_, colIndex) => {
                        const colName = sysvars[colIndex]?.name;
                        const rawDataValue = (colName && rowData[colName] !== undefined) ? rowData[colName] : "";
                        const variableInfo = sysvars[colIndex];

                        if (variableInfo) {
                            const formatType = variableInfo.printFormat?.typestr || (variableInfo.type === 1 ? "A" : "F");
                            const variableType = mapSPSSTypeToInterface(formatType);

                            if (spssDateTypes.has(variableType) && typeof rawDataValue === 'number') {
                                const convertedDate = spssSecondsToDateString(rawDataValue);
                                // Use converted date if valid, otherwise keep the original number
                                // (or consider converting to empty string if needed)
                                return convertedDate !== null ? convertedDate : rawDataValue;
                            }
                        }
                        // Return original value for non-dates, non-numbers, or if conversion failed
                        return rawDataValue;
                    });
                });

                // --- PENAMBAHAN CONSOLE LOG ---
                console.log("Processed Metadata (Variables):", variables);
                console.log("Processed Data (Matrix):", dataMatrix);
                // --- AKHIR PENAMBAHAN ---

                await overwriteVariables(variables);
                await setDataAndSync(dataMatrix);

                await setProjectMeta({
                    name: file.name,
                    location: "local",
                    created: metaHeader.created ? new Date(metaHeader.created) : new Date(),
                });

                closeModal();

            } catch (error: any) {
                console.error("Error uploading or processing file:", error);
                setError(error.message || "Error uploading or processing file");
            } finally {
                setLoading(false);
            }
        } else {
            setError("Please select a file");
        }
    };

    return (
        <DialogContent className="max-w-md bg-white border border-[#E6E6E6] rounded">
            <DialogHeader className="mb-6">
                <DialogTitle className="text-[22px] font-semibold">Open Data</DialogTitle>
                <DialogDescription className="text-[#444444] mt-2">
                    Select a SPSS .sav file to import for statistical analysis.
                </DialogDescription>
            </DialogHeader>

            <div className="mb-6">
                <div
                    className={`border-2 border-dashed rounded p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                        error ? "border-red-500 bg-red-50" : "border-[#CCCCCC] hover:border-black"
                    }`}
                    onClick={() => document.getElementById("file-upload")?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    <Upload size={24} className="mb-4 text-gray-500" />
                    <p className="text-center font-medium mb-1">
                        {file ? file.name : "Click to select a .sav file"}
                    </p>
                    <p className="text-[14px] text-[#888888]">
                        {file
                            ? `${(file.size / 1024).toFixed(2)} KB`
                            : "or drag and drop here"}
                    </p>
                    <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept=".sav"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={loading}
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 mt-2 text-[14px] text-red-600">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {file && !error && (
                    <div className="flex items-center gap-2 mt-2 text-[14px] text-green-700">
                        <FileText size={16} />
                        <span>Ready to upload: {file.name}</span>
                    </div>
                )}
            </div>

            <DialogFooter className="gap-3">
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="text-black bg-[#F7F7F7] hover:bg-[#E6E6E6] border-[#CCCCCC] min-w-[80px]"
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading || !file}
                    className="bg-black text-white hover:bg-[#444444] min-w-[80px] flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {loading ? "Processing..." : "Upload"}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default OpenData;