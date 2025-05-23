"use client";

import React, { FC } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import ExportExcelModalDisplay from "./ExportExcelModal"; // Renamed to avoid conflict with default export name
import { useExportExcelModalLogic } from "./useExportExcelModalLogic";
import { ExportExcelModalContainerProps } from "./ExportExcelModal.types";

const ExportExcelModalContainer: FC<ExportExcelModalContainerProps> = ({ 
    onClose, 
    containerType = "dialog" 
}) => {
    const {
        exportOptions,
        isExporting,
        handleChange,
        handleFilenameChange,
        handleExport,
    } = useExportExcelModalLogic({ onClose });

    const modalContent = (
        <ExportExcelModalDisplay // Using the renamed import
            onClose={onClose}
            exportOptions={exportOptions}
            isExporting={isExporting}
            // Props for UI component should match ExportExcelUIProps if defined
            // Assuming direct pass-through for now, or map to specific onHandleChange etc.
            onHandleChange={handleChange} 
            onHandleFilenameChange={handleFilenameChange}
            onHandleExport={handleExport}
        />
    );

    if (containerType === "sidebar") {
        return (
            <div className="flex flex-col h-full bg-background text-foreground">
                {modalContent}
            </div>
        );
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}> 
            <DialogContent className="sm:max-w-md p-0 flex flex-col max-h-[90vh] bg-background text-foreground">
                <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
                    <DialogTitle className="text-lg font-semibold">Export Data to Excel</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-1">
                        Configure options and save your dataset to Excel (.xlsx, .xls).
                    </DialogDescription>
                </DialogHeader>
                {modalContent}
            </DialogContent>
        </Dialog>
    );
};

export default ExportExcelModalContainer; 