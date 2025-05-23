"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Printer } from "lucide-react";
import { PrintUIProps } from "./Print.types";
import { PrintOptions } from "./PrintOptions";

export const PrintUI: React.FC<PrintUIProps> = ({
    // Logic props
    fileName,
    setFileName,
    selectedOptions,
    setSelectedOptions,
    paperSize,
    setPaperSize,
    isGenerating,
    isMobile,
    isPortrait,
    handlePrint,
    handleModalClose,
    // Container props
    containerType,
}) => {

    const dialogTitle = "Print to PDF";
    const dialogDescription = "Configure options and select content to include in the PDF export.";

    const content = (
        <PrintOptions
            fileName={fileName}
            onFileNameChange={setFileName}
            selectedOptions={selectedOptions}
            onOptionChange={(option) => setSelectedOptions(prev => ({...prev, [option]: !prev[option]}))}
            paperSize={paperSize}
            onPaperSizeChange={setPaperSize}
            onPrint={handlePrint}
            onCancel={handleModalClose} 
            isGenerating={isGenerating}
            isMobile={isMobile}
            isPortrait={isPortrait}
        />
    );

    if (containerType === "sidebar") {
        return (
            <div className={`h-full flex flex-col bg-popover text-popover-foreground border-l border-border ${isMobile ? 'w-full' : 'w-[420px] md:w-[450px] lg:w-[480px]'}`}>
                 <div className="px-6 py-4 border-b border-border flex items-center flex-shrink-0">
                    <Printer size={18} className="mr-2.5 flex-shrink-0 text-primary" />
                    <div className="flex-grow overflow-hidden">
                        <h3 className="font-semibold text-lg text-popover-foreground">{dialogTitle}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[calc(100%-30px)]">{dialogDescription}</p>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto flex flex-col">
                    {content}
                </div>
            </div>
        );
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && handleModalClose()}>
            <DialogContent 
                className={`p-0 bg-popover border-border rounded-lg shadow-xl overflow-hidden flex flex-col ${isMobile && isPortrait ? 'h-screen max-h-screen w-screen max-w-full rounded-none' : 'max-h-[90vh] w-[95vw] sm:max-w-lg md:max-w-xl'}`}
                onInteractOutside={(e) => { if (isGenerating) e.preventDefault();}}
            >
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <div className="flex items-center">
                        <Printer size={20} className="mr-2.5 text-primary flex-shrink-0 relative top-[-1px]" />
                        <div className="flex-grow overflow-hidden">
                            <DialogTitle className="text-xl font-semibold text-popover-foreground">
                                {dialogTitle}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
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