// components/Modals/File/ImportExcel.tsx
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
import { AlertCircle, FileSpreadsheet, Loader2 } from "lucide-react";

interface ImportExcelProps {
    onClose: () => void;
}

const ImportExcel: FC<ImportExcelProps> = ({ onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { closeModal, openModal } = useModal();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0] || null;
        setError(null);
        setFile(selected);
    };

    const handleSubmit = () => {
        if (!file) {
            setError("Please select an Excel file");
            return;
        }

        setIsLoading(true);
        const reader = new FileReader();

        reader.onload = () => {
            try {
                const content = reader.result as string;
                closeModal();
                openModal(ModalType.ReadExcelFile, { fileName: file.name, fileContent: content });
            } catch (error) {
                setError("Failed to read file. Please try again.");
                setIsLoading(false);
            }
        };

        reader.onerror = () => {
            setError("Failed to read file. Please try again.");
            setIsLoading(false);
        };

        reader.readAsBinaryString(file);
    };

    return (
        <DialogContent className="max-w-md bg-white border border-[#E6E6E6] rounded">
            <DialogHeader className="mb-6">
                <DialogTitle className="text-[22px] font-semibold">Import Excel</DialogTitle>
                <DialogDescription className="text-[#444444] mt-2">
                    Select an Excel file to import for statistical analysis.
                </DialogDescription>
            </DialogHeader>

            <div className="mb-6">
                <div
                    className={`border-2 border-dashed rounded p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                        error ? "border-black bg-[#E6E6E6]" : "border-[#CCCCCC] hover:border-black"
                    }`}
                    onClick={() => document.getElementById("excel-file-input")?.click()}
                >
                    <FileSpreadsheet size={24} className="mb-4" />
                    <p className="text-center font-medium mb-1">
                        {file ? file.name : "Click to select an Excel file"}
                    </p>
                    <p className="text-[14px] text-[#888888]">
                        {file ? `${(file.size / 1024).toFixed(2)} KB` : "or drag and drop here"}
                    </p>
                    <input
                        id="excel-file-input"
                        type="file"
                        accept=".xls,.xlsx"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 mt-2 text-[14px]">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            <DialogFooter className="gap-3">
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="text-black bg-[#F7F7F7] hover:bg-[#E6E6E6] border-[#CCCCCC] min-w-[80px]"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !file}
                    className="bg-black text-white hover:bg-[#444444] min-w-[80px]"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Import
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default ImportExcel;