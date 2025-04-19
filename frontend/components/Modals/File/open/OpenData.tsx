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
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileText, X, AlertCircle } from "lucide-react";

interface OpenDataProps {
    onClose: () => void;
}

// Helper function to map SPSS format types to our interface types
const mapSPSSTypeToInterface = (formatType: string): string => {
    const typeMap: { [key: string]: string } = {
        "F": "NUMERIC",
        "COMMA": "COMMA",
        "E": "SCIENTIFIC",
        "DATE": "DATE",
        "ADATE": "ADATE",
        "EDATE": "EDATE",
        "SDATE": "SDATE",
        "JDATE": "JDATE",
        "QYR": "QYR",
        "MOYR": "MOYR",
        "WKYR": "WKYR",
        "DATETIME": "DATETIME",
        "TIME": "TIME",
        "DTIME": "DTIME",
        "WKDAY": "WKDAY",
        "MONTH": "MONTH",
        "DOLLAR": "DOLLAR",
        "A": "STRING",
        "CCA": "CCA",
        "CCB": "CCB",
        "CCC": "CCC",
        "CCD": "CCD",
        "CCE": "CCE"
    };

    return typeMap[formatType] || "NUMERIC";
};

const OpenData: FC<OpenDataProps> = ({ onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [meta, setMeta] = useState<any>(null);
    const [rows, setRows] = useState<any[]>([]);

    const { closeModal } = useModal();
    const { overwriteVariables, resetVariables } = useVariableStore();
    const { setDataAndSync, resetData } = useDataStore();
    const { setMeta: setProjectMeta } = useMetaStore();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0] || null;
        setFile(selected);
        setError(null); // Clear error when a new file is selected
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

                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'; // Get backend URL
                const response = await fetch(`${backendUrl}/api/sav/upload`, { // Use full URL
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error("Failed to process file");
                }

                const result = await response.json();
                console.log("Metadata:", result.meta);
                console.log("Data rows:", result.rows);

                setMeta(result.meta);
                setRows(result.rows);

                const numCases = result.meta.header.n_cases;
                const numVars = result.meta.header.n_vars;
                const sysvars = result.meta.sysvars;

                const variables = sysvars.map((varInfo: any, colIndex: number) => {
                    const variableName = varInfo.name || `VAR${colIndex + 1}`;
                    const formatType = varInfo.printFormat.typestr;
                    const isString = formatType === "A" || varInfo.type === 1;

                    const valueLabelsObj = result.meta.valueLabels?.find(
                        (vl: any) => vl.appliesToNames.includes(variableName)
                    );

                    const valueLabels = valueLabelsObj ?
                        valueLabelsObj.entries.map((entry: any) => ({
                            id: undefined,
                            variableName,
                            value: entry.val,
                            label: entry.label
                        })) : [];

                    return {
                        columnIndex: colIndex,
                        name: variableName,
                        type: mapSPSSTypeToInterface(formatType),
                        width: varInfo.printFormat.width,
                        decimals: varInfo.printFormat.nbdec,
                        label: varInfo.label || "",
                        values: valueLabels,
                        missing: varInfo.missing ? [varInfo.missing] : [],
                        columns: 200,
                        align: isString ? "left" : "right",
                        measure: isString ? "nominal" : "scale",
                        role: "input"
                    };
                });

                const dataMatrix = Array(numCases).fill(0).map((_, rowIndex) => {
                    const rowData = result.rows[rowIndex] || {};
                    return Array(numVars).fill(0).map((_, colIndex) => {
                        const colName = sysvars[colIndex]?.name;
                        return rowData[colName] !== undefined ? rowData[colName] : "";
                    });
                });

                await overwriteVariables(variables);
                await setDataAndSync(dataMatrix);
                // Set project meta to navigate to data view
                await setProjectMeta({ name: file.name, location: file.name, created: new Date() });
                closeModal();
            } catch (error) {
                console.error("Error uploading or processing file:", error);
                setError("Error uploading or processing file");
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
                        error ? "border-black bg-[#E6E6E6]" : "border-[#CCCCCC] hover:border-black"
                    }`}
                    onClick={() => document.getElementById("file-upload")?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    <Upload size={24} className="mb-4" />
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
                    <div className="flex items-center gap-2 mt-2 text-[14px] text-black">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {file && !error && (
                    <div className="flex items-center gap-2 mt-2 text-[14px] text-[#888888] italic">
                        <FileText size={16} />
                        <span>Ready to upload {file.name}</span>
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
                    className="bg-black text-white hover:bg-[#444444] min-w-[80px] flex items-center gap-2"
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