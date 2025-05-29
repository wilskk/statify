"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileSpreadsheet, Loader2 } from "lucide-react";
import { ImportExcelSelectionStepProps } from "./ImportExcel.types"; // Adjusted import path

export const ImportExcelSelectionStep: React.FC<ImportExcelSelectionStepProps> = ({
    onClose,
    onFileSelect,
    onContinue,
    isLoading,
    error,
    selectedFile,
    isMobile,
    isPortrait
}) => {

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0] || null;
        if (selected) {
            onFileSelect(selected);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel') {
                onFileSelect(file);
            }
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-border flex items-center flex-shrink-0">
                <FileSpreadsheet size={18} className="mr-2.5 flex-shrink-0 text-primary" />
                <div className="flex-grow overflow-hidden">
                    <h3 className="font-semibold text-lg text-popover-foreground">
                        Import Excel File
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Select an Excel file (.xls, .xlsx) to import data.
                    </p>
                </div>
            </div>

            <div className="p-6 flex-grow overflow-y-auto">
                <div
                    className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${isMobile && isPortrait ? 'p-6' : 'p-8'} ${
                        error ? "border-destructive bg-destructive/5 hover:border-destructive/60" : "border-input hover:border-primary/80 bg-background hover:bg-muted/50"
                    }`}
                    onClick={() => document.getElementById("excel-file-input-content-step")?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <FileSpreadsheet size={isMobile ? 28 : 32} className={`mb-3 text-muted-foreground ${error ? 'text-destructive/80' : ''}`} />
                    <p className={`text-center font-medium mb-1 ${isMobile ? 'text-sm' : 'text-base'} text-popover-foreground`}>
                        {selectedFile ? selectedFile.name : "Click to select an Excel file"}
                    </p>
                    <p className={`text-xs text-muted-foreground ${error ? 'text-destructive/70' : ''}`}>
                        {selectedFile
                            ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                            : "or drag and drop here (.xls, .xlsx)"}
                    </p>
                    <input
                        id="excel-file-input-content-step"
                        type="file"
                        accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-destructive">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            <div className={`px-6 py-4 border-t border-border bg-muted flex-shrink-0 flex ${isMobile && isPortrait ? 'flex-col space-y-2' : 'justify-end space-x-2'}`}>
                <Button
                    variant="outline"
                    onClick={onClose}
                    className={`min-w-[90px] h-9 ${isMobile && isPortrait ? 'w-full' : ''}`}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button
                    onClick={onContinue}
                    disabled={isLoading || !selectedFile}
                    className={`min-w-[90px] h-9 ${isMobile && isPortrait ? 'w-full' : ''}`}
                >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Continue
                </Button>
            </div>
        </div>
    );
}; 