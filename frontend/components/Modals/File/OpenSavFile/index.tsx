"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileText, X, AlertCircle, FolderOpen, HelpCircle } from "lucide-react";
import { useOpenSavFileLogic } from "./hooks/useOpenSavFileLogic";
import { OpenSavFileProps, OpenSavFileStepProps } from "./types";

// Step component
const OpenSavFileStep: React.FC<OpenSavFileStepProps> = ({
    onClose,
    onFileSelect,
    onSubmit,
    isLoading,
    error,
    selectedFile,
    isMobile,
    isPortrait,
    clearError
}) => {
    const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        onFileSelect(file);
        if(file && file.name.endsWith('.sav')) clearError(); 
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            onFileSelect(droppedFile);
            if(droppedFile && droppedFile.name.endsWith('.sav')) clearError();
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const handleRemoveFile = () => {
        onFileSelect(null);
        clearError();
    }

    return (
        <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-border flex items-center flex-shrink-0">
                <FolderOpen size={18} className="mr-2.5 flex-shrink-0 text-primary" />
                <div className="flex-grow overflow-hidden">
                    <h3 className="font-semibold text-lg text-popover-foreground">
                        Select .sav File
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Select an SPSS statistics file (.sav) to load into the application.
                    </p>
                </div>
            </div>
            <div className="p-6 flex-grow flex flex-col">
                <div
                    className={`
                        border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors flex-1 mb-4
                        ${isMobile && isPortrait ? 'min-h-[150px] p-6' : 'min-h-[200px] p-8'}
                        ${error && !selectedFile ? "border-destructive bg-destructive/5 hover:border-destructive/60" : "border-input hover:border-primary/80 hover:bg-muted/50"}
                    `}
                    style={{ width: "100%" }}
                    onClick={() => document.getElementById("sav-file-upload-step")?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    <Upload size={isMobile ? 28 : 32} className={`mb-3 text-muted-foreground ${error && !selectedFile ? 'text-destructive/80' : ''}`} />
                    <p className={`text-center font-medium mb-1 ${isMobile ? 'text-sm' : 'text-base'} text-popover-foreground`}>
                        {selectedFile ? selectedFile.name : "Click to select a .sav file"}
                    </p>
                    <p className={`text-xs text-muted-foreground ${error && !selectedFile ? 'text-destructive/70' : ''}`}>
                        {selectedFile
                            ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                            : "or drag and drop here (.sav)"}
                    </p>
                    <input
                        id="sav-file-upload-step"
                        name="sav-file-upload-step"
                        type="file"
                        accept=".sav"
                        onChange={handleFileSelectChange}
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
                        <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="text-muted-foreground hover:text-destructive h-7 w-7 flex-shrink-0">
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
            
            {/* Footer - menggunakan styling dari PrintOptions */}
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                {/* Kiri: Help icon */}
                <div className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                    <HelpCircle size={18} className="mr-1" />
                </div>
                {/* Kanan: tombol Cancel/Action */}
                <div>
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="mr-2">
                        Cancel
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={isLoading || !selectedFile}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? "Processing..." : "Open"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Main component following ImportExcelModal pattern
export const OpenSavFileModal: React.FC<OpenSavFileProps> = ({
    onClose,
    containerType,
}) => {
    const {
        file,
        isLoading,
        error,
        isMobile,
        isPortrait,
        handleFileChange,
        clearError,
        handleSubmit,
        handleModalClose,
    } = useOpenSavFileLogic({ onClose });

    return (
        <div className="flex-grow overflow-y-auto flex flex-col h-full">
            <OpenSavFileStep
                onClose={handleModalClose}
                onFileSelect={handleFileChange}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                error={error}
                selectedFile={file}
                isMobile={isMobile}
                isPortrait={isPortrait}
                clearError={clearError}
            />
        </div>
    );
};

// Export the component with both names for backward compatibility
export default OpenSavFileModal;