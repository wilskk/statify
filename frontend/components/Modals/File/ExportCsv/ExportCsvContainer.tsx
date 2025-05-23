"use client";

import React, { FC } from "react";
import ExportCsv from "./ExportCsv"; // Corrected import name
import { useExportCsv, UseExportCsvOptions } from "./useExportCsv";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";

interface ExportCsvContainerProps extends UseExportCsvOptions { // Changed to ExportCsvContainerProps
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

const ExportCsvContainer: FC<ExportCsvContainerProps> = ({ 
    onClose,
    containerType = "dialog",
    ...hookOptions // Pass hook options directly
}) => {
    const hookValues = useExportCsv(hookOptions);

    // If sidebar mode, use a div container
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <ExportCsv 
                        onClose={onClose} 
                        containerType={containerType} 
                        {...hookValues} 
                    />
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent
    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-md bg-popover border-border rounded p-0">
                <ExportCsv 
                    onClose={onClose} 
                    containerType={containerType} 
                    {...hookValues} 
                />
            </DialogContent>
        </Dialog>
    );
};

export default ExportCsvContainer; 