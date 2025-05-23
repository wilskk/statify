"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
// Button might not be directly used here but DialogContent or children might imply its need by shadcn/ui
// import { Button } from "@/components/ui/button"; 
import { FolderOpen } from "lucide-react";
import { OpenSavFileUIProps } from "./OpenSavFile.types";
import { OpenSavFileStep } from "./OpenSavFileStep";

export const OpenSavFileUI: React.FC<OpenSavFileUIProps> = ({
    // Logic props
    file,
    isLoading,
    error,
    isMobile,
    isPortrait,
    handleFileChange,
    clearError,
    handleSubmit,
    handleModalClose,
    // Container props
    containerType,
}) => {

    const dialogTitle = "Open Data File";
    const dialogDescription = "Select a SPSS statistics file (.sav) to load into the application.";

    const content = (
        <OpenSavFileStep
            selectedFile={file}
            onFileChange={handleFileChange}
            onSubmit={handleSubmit}
            onCancel={handleModalClose} 
            isLoading={isLoading}
            error={error}
            clearError={clearError}
            isMobile={isMobile}
            isPortrait={isPortrait}
        />
    );

    if (containerType === "sidebar") {
        // The OpenSavFileContainer now provides the themed (bg-background, text-foreground, h-full) wrapper.
        // This component just needs to render its content (the steps).
        // The OpenSavFileStep itself has padding and flex-grow as needed.
        return content; 
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && handleModalClose()}>
            <DialogContent 
                className={`p-0 bg-popover border-border rounded-lg shadow-xl overflow-hidden flex flex-col ${isMobile && isPortrait ? 'h-screen max-h-screen w-screen max-w-full rounded-none' : 'max-h-[80vh] w-[90vw] sm:max-w-lg md:max-w-xl'}`}
                onInteractOutside={(e) => { if (isLoading) e.preventDefault();}} 
            >
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <div className="flex items-center">
                        <FolderOpen size={20} className="mr-2.5 text-primary flex-shrink-0 relative top-[-1px]" />
                        <div className="flex-grow overflow-hidden">
                            <DialogTitle className="text-xl font-semibold text-popover-foreground">
                                {dialogTitle}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-0.5 truncate">
                                {dialogDescription}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto flex flex-col">
                    {content}
                </div>
            </DialogContent>
        </Dialog>
    );
}; 