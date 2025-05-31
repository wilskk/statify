"use client";

import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileUp, Loader2 } from "lucide-react";
import { useMobile } from "@/hooks/useMobile";

interface ImportCsvSelectionProps { // Renamed interface
    onClose: () => void;
    onFileSelect: (file: File) => void;
    onContinue: () => void;
    isLoading: boolean;
    error: string | null;
    selectedFile: File | null;
}

export const ImportCsvSelection: FC<ImportCsvSelectionProps> = ({ // Renamed component
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
            <div className="p-6 flex-grow overflow-y-auto">
                <div
                    className={`border-2 border-dashed rounded p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${isMobile && isPortrait ? 'p-4' : 'p-8'} ${
                        error ? "border-destructive bg-destructive/10" : "border-input hover:border-primary"
                    }`}
                    onClick={() => document.getElementById("csv-file-input-content")?.click()}
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
                        id="csv-file-input-content"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-destructive">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            <div className={`px-6 py-4 border-t border-border bg-muted flex-shrink-0 flex justify-end space-x-2 ${isMobile && isPortrait ? 'flex-col space-x-0 space-y-2' : 'space-x-2'}`}>
                <Button
                    variant="outline"
                    onClick={onClose}
                    className={`min-w-[80px] h-9 ${isMobile && isPortrait ? 'w-full' : ''}`}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button
                    onClick={onContinue}
                    disabled={isLoading || !selectedFile}
                    className={`min-w-[80px] h-9 ${isMobile && isPortrait ? 'w-full' : ''}`}
                >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Continue
                </Button>
            </div>
        </>
    );
}; 