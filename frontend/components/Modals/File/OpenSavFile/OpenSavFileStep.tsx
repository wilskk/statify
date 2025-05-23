"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileText, X, AlertCircle } from "lucide-react";
import { OpenSavFileStepProps } from "./OpenSavFile.types"; // Adjusted import path

export const OpenSavFileStep: React.FC<OpenSavFileStepProps> = ({
    selectedFile,
    onFileChange,
    onSubmit,
    onCancel,
    isLoading,
    error,
    clearError,
    isMobile,
    isPortrait
}) => {

    const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        onFileChange(file);
        // Error state is managed by the hook, so clearError might be redundant if onFileChange in hook handles it
        if(file && file.name.endsWith('.sav')) clearError(); 
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            onFileChange(droppedFile); // The hook will validate and set error if needed
             if(droppedFile && droppedFile.name.endsWith('.sav')) clearError();
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const handleRemoveFile = () => {
        onFileChange(null);
        clearError(); // Clear errors when file is removed
    }

    return (
        <>
            <div className="p-6 flex-grow flex flex-col">
                <div
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors flex-grow mb-4 
                        ${ isMobile && isPortrait ? 'min-h-[150px]' : 'min-h-[200px]'}
                        ${ error && !selectedFile ? "border-destructive bg-destructive/5 hover:border-destructive/60" : "border-input hover:border-primary/80 hover:bg-muted/50"
                    }`}
                    onClick={() => document.getElementById("sav-file-upload-step")?.click()} // Ensure unique ID
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    <Upload size={isMobile ? 28: 32} className={`mb-3 text-muted-foreground ${error && !selectedFile ? 'text-destructive/80' : ''}`} />
                    <p className={`text-center font-medium mb-1 ${isMobile ? 'text-sm' : 'text-base'} text-foreground`}>
                        {selectedFile ? selectedFile.name : "Click to select a .sav file"}
                    </p>
                    <p className={`text-xs text-muted-foreground ${error && !selectedFile ? 'text-destructive/70' : ''}`}>
                        {selectedFile
                            ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                            : "or drag and drop here"}
                    </p>
                    <input
                        id="sav-file-upload-step" // Ensure unique ID
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
            
            <div className={`px-6 py-4 border-t border-border bg-muted flex-shrink-0 flex ${isMobile && isPortrait ? 'flex-col space-y-2' : 'justify-end space-x-2'}`}>
                <Button
                    variant="outline"
                    onClick={onCancel} // This will call handleModalClose from the hook
                    className={`min-w-[90px] h-9 ${isMobile && isPortrait ? 'w-full' : ''}`}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button
                    onClick={onSubmit} // This will call handleSubmit from the hook
                    disabled={isLoading || !selectedFile}
                    className={`min-w-[90px] h-9 ${isMobile && isPortrait ? 'w-full' : ''}`}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Processing..." : "Open"}
                </Button>
            </div>
        </>
    );
}; 