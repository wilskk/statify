"use client";

import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FileUp, Loader2, X, FileText } from "lucide-react";
import { useMobile } from "@/hooks/useMobile";

interface ImportCsvSelectionProps { // Renamed interface
    onClose: () => void;
    onFileSelect: (file: File | null) => void;
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
            }        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-border flex items-center flex-shrink-0">
                <FileText size={18} className="mr-2.5 flex-shrink-0 text-primary" />
                <div className="flex-grow overflow-hidden">
                    <h3 className="font-semibold text-lg text-popover-foreground">
                        Import CSV File
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Select a CSV file (.csv) to import data.
                    </p>
                </div>
            </div>

            <div className="p-6 flex-grow flex flex-col">
                <div
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors flex-grow mb-4 
                        ${ isMobile && isPortrait ? 'min-h-[150px]' : 'min-h-[200px]'}
                        ${ error ? "border-destructive bg-destructive/5 hover:border-destructive/60" : "border-input hover:border-primary/80 hover:bg-muted/50"
                    }`}
                    onClick={() => document.getElementById("csv-file-input-content")?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <FileText size={isMobile ? 28 : 32} className={`mb-3 text-muted-foreground ${error ? 'text-destructive/80' : ''}`} />
                    <p className={`text-center font-medium mb-1 ${isMobile ? 'text-sm' : 'text-base'} text-foreground`}>
                        Click to select a CSV file
                    </p>
                    <p className={`text-xs text-muted-foreground ${error ? 'text-destructive/70' : ''}`}>
                        {selectedFile
                            ? `${(selectedFile.size / 1024).toFixed(1)} KB`
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

                {selectedFile && !error && ( 
                    <div className="mb-4 p-3 bg-muted/50 border border-border rounded-md flex items-center justify-between">
                        <div className="flex items-center overflow-hidden">
                            <FileText size={20} className="mr-2.5 text-primary flex-shrink-0" />
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
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted mt-auto flex justify-end space-x-2">
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="min-w-[90px] h-9"
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button
                    onClick={onContinue}
                    disabled={isLoading || !selectedFile}
                    className="min-w-[90px] h-9"
                >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Continue
                </Button>
            </div>
        </div>
    );
}; 