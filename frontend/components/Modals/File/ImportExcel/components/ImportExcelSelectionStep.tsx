"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FileSpreadsheet, Loader2, X, HelpCircle } from "lucide-react";
import { ImportExcelSelectionStepProps } from "../types";

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
    };    return (
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

            <div className="flex-1 p-6 flex flex-col overflow-hidden">
                <div
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors flex-1 mb-4 
                        ${ isMobile && isPortrait ? 'min-h-[150px]' : 'min-h-[200px]'}
                        ${ error ? "border-destructive bg-destructive/5 hover:border-destructive/60" : "border-input hover:border-primary/80 hover:bg-muted/50"
                    }`}
                    onClick={() => document.getElementById("excel-file-input-content-step")?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <FileSpreadsheet size={isMobile ? 28 : 32} className={`mb-3 text-muted-foreground ${error ? 'text-destructive/80' : ''}`} />
                    <p className={`text-center font-medium mb-1 ${isMobile ? 'text-sm' : 'text-base'} text-foreground`}>
                        Click to select an Excel file
                    </p>
                    <p className={`text-xs text-muted-foreground ${error ? 'text-destructive/70' : ''}`}>
                        {selectedFile
                            ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                            : "or drag and drop here"}
                    </p>
                    <input
                        id="excel-file-input-content-step"
                        type="file"
                        accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                {selectedFile && !error && ( 
                    <div className="mb-4 p-3 bg-muted/50 border border-border rounded-md flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center overflow-hidden">
                            <FileSpreadsheet size={20} className="mr-2.5 text-primary flex-shrink-0" />
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => onFileSelect(null)} className="text-muted-foreground hover:text-destructive h-7 w-7 flex-shrink-0">
                            <X size={16} />
                        </Button>
                    </div>
                )}

                {error && ( 
                    <Alert variant="destructive" className="mb-4 flex-shrink-0">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Footer - menggunakan styling dari PrintOptions */}
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                {/* Kiri: Help icon */}
                <div className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                    <HelpCircle size={18} className="mr-1" />
                </div>
                {/* Kanan: tombol Cancel/Continue */}
                <div>
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="mr-2">
                        Cancel
                    </Button>
                    <Button
                        onClick={onContinue}
                        disabled={isLoading || !selectedFile}
                        {...(isLoading ? { loading: true } : {})}
                    >
                        {isLoading && <Loader2 className="mr-2 animate-spin" size={16} />}
                        Continue
                    </Button>
                </div>
            </div>
        </div>
    );
}; 