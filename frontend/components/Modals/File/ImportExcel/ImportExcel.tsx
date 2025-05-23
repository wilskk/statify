"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import { ImportExcelUIProps } from "./ImportExcel.types";
import { ImportExcelSelectionStep } from "./ImportExcelSelectionStep";
import { ImportExcelConfigurationStep } from "./ImportExcelConfigurationStep";

export const ImportExcelUI: React.FC<ImportExcelUIProps> = ({
    // Logic props
    file,
    binaryFileContent,
    fileName,
    isLoading,
    error,
    stage,
    isMobile,
    isPortrait,
    handleFileSelect,
    handleContinueToConfigure,
    handleBackToSelect,
    handleModalClose,
    // Container props
    containerType,
}) => {

    const renderContent = () => {
        if (stage === "select") {
            return (
                <ImportExcelSelectionStep
                    onClose={handleModalClose}
                    onFileSelect={handleFileSelect}
                    onContinue={handleContinueToConfigure}
                    isLoading={isLoading}
                    error={error}
                    selectedFile={file}
                    isMobile={isMobile}
                    isPortrait={isPortrait}
                />
            );
        }
        if (stage === "configure" && binaryFileContent) {
            return (
                <ImportExcelConfigurationStep
                    onClose={handleModalClose}
                    onBack={handleBackToSelect}
                    fileName={fileName}
                    fileContent={binaryFileContent}
                />
            );
        }
        // Fallback or loading state for configuration if binaryFileContent is not yet available
        // but stage is 'configure'. This could happen if there's a slight delay.
        return <div className="p-6 flex-grow flex items-center justify-center">Loading configuration...</div>;
    };

    const dialogTitle = stage === "select" ? "Import Excel File" : "Configure Excel Import";
    const dialogDescription = stage === "select"
        ? "Select an Excel file (.xls, .xlsx) to import data."
        : `Review and configure options for "${fileName || 'your file'}".`;

    if (containerType === "sidebar") {
        return (
            <div className={`h-full flex flex-col bg-popover text-popover-foreground border-l border-border ${isMobile ? 'w-full' : 'w-[480px] md:w-[520px] lg:w-[560px]'}`}>
                <div className="px-6 py-4 border-b border-border flex items-center flex-shrink-0">
                    {stage === 'configure' && (
                         <Button variant="ghost" size="icon" onClick={handleBackToSelect} className="mr-2 -ml-2 h-8 w-8">
                            <ArrowLeft size={18} />
                        </Button>
                    )}
                    <div className="flex-grow overflow-hidden">
                        <h3 className="font-semibold text-lg text-popover-foreground flex items-center">
                           <FileSpreadsheet size={18} className="mr-2.5 flex-shrink-0 text-primary" />
                           {dialogTitle}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{dialogDescription}</p>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto flex flex-col">
                    {renderContent()}
                </div>
            </div>
        );
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && handleModalClose()}>
            <DialogContent
                className={`p-0 bg-popover border-border rounded-lg shadow-xl overflow-hidden flex flex-col ${isMobile && isPortrait ? 'h-screen max-h-screen w-screen max-w-full rounded-none' : 'max-h-[90vh] w-[95vw] sm:w-[640px] md:w-[768px] lg:w-[860px] xl:w-[920px]'}`}
                onInteractOutside={(e) => {
                    if (isLoading) e.preventDefault(); // Prevent closing if loading
                }}
            >
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <div className="flex items-center">
                        {stage === 'configure' && (
                            <Button variant="ghost" size="icon" onClick={handleBackToSelect} className="mr-3 -ml-2 h-8 w-8 text-muted-foreground hover:text-foreground">
                                <ArrowLeft size={18} />
                            </Button>
                        )}
                         <FileSpreadsheet size={20} className="mr-2.5 text-primary flex-shrink-0 relative top-[-1px]" />
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
                    {renderContent()}
                </div>
            </DialogContent>
        </Dialog>
    );
}; 