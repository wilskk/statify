"use client";

import React, { FC } from "react";
import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileUp, Loader2 } from "lucide-react";
import { useMobile } from "@/hooks/useMobile";

interface ImportCSVProps {
    onClose: () => void;
    onFileSelect: (file: File) => void;
    onContinue: () => void;
    isLoading: boolean;
    error: string | null;
    selectedFile: File | null;
}

const ImportCSV: FC<ImportCSVProps> = ({
                                           onClose,
                                           onFileSelect,
                                           onContinue,
                                           isLoading,
                                           error,
                                           selectedFile
                                       }) => {
    const { isMobile, isPortrait } = useMobile();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0] || null;
        if (selected) {
            onFileSelect(selected);
        }
    };

    // Add drag and drop handling
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type === "text/csv" || file.name.endsWith('.csv')) {
                onFileSelect(file);
            }
        }
    };

    return (
        <>
            <DialogHeader className="mb-6 bg-muted px-6 py-5 border-b border-border">
                <DialogTitle className="text-[22px] font-semibold text-popover-foreground">Import CSV</DialogTitle>
                <DialogDescription className="text-muted-foreground mt-2">
                    Select a CSV file to import for statistical analysis.
                </DialogDescription>
            </DialogHeader>

            <div className="px-6 py-6">
                <div
                    className={`border-2 border-dashed rounded p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${isMobile && isPortrait ? 'p-4' : 'p-8'} ${
                        error ? "border-destructive bg-destructive/10" : "border-input hover:border-primary"
                    }`}
                    onClick={() => document.getElementById("csv-file-input")?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <FileUp size={24} className={`mb-4 text-muted-foreground ${isMobile && isPortrait ? 'mb-2' : 'mb-4'}`} />
                    <p className="text-center font-medium mb-1 text-popover-foreground">
                        {selectedFile ? selectedFile.name : "Click to select a CSV file"}
                    </p>
                    <p className={`text-[14px] text-muted-foreground ${isMobile && isPortrait ? 'text-[12px]' : 'text-[14px]'}`}>
                        {selectedFile
                            ? `${(selectedFile.size / 1024).toFixed(2)} KB`
                            : "or drag and drop here"}
                    </p>
                    <input
                        id="csv-file-input"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 mt-2 text-[14px] text-destructive">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            <DialogFooter className={`gap-3 bg-muted px-6 py-5 border-t border-border ${isMobile && isPortrait ? 'flex-col' : ''}`}>
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="min-w-[80px]"
                >
                    Cancel
                </Button>
                <Button
                    onClick={onContinue}
                    disabled={isLoading || !selectedFile}
                    className={`min-w-[80px] ${isMobile && isPortrait ? 'w-full' : ''}`}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Continue
                </Button>
            </DialogFooter>
        </>
    );
};

export default ImportCSV;