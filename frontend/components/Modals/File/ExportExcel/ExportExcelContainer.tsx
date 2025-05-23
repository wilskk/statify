"use client";

import React, { FC } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import ExportExcelModal from "./ExportExcel"; 
import { useExportExcelModalLogic } from "./useExportExcelModalLogic";
import { ExportExcelModalContainerProps } from "./ExportExcel.types";

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
        <ExportExcelModal 
            onClose={onClose}
            exportOptions={exportOptions}
            isExporting={isExporting}
            onhandleChange={handleChange}
            onHandleFilenameChange={handleFilenameChange}
            onHandleExport={handleExport}
        />
    );

    if (containerType === "sidebar") {
        return (
            <div className="flex flex-col h-full bg-background text-foreground">
                {/* Optional: Add sidebar specific header here if different from dialog */}
                {/* <div className="px-6 py-4 border-b border-border flex-shrink-0"> */}
                {/*     <h2 className="text-xl font-semibold">Export Data to Excel</h2> */}
                {/*     <p className="text-muted-foreground text-sm mt-1">Configure and save.</p> */}
                {/* </div> */}
                {modalContent}
            </div>
        );
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}> 
            <DialogContent className="sm:max-w-md p-0 flex flex-col max-h-[90vh] bg-background text-foreground">
                <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
                    <DialogTitle className="text-lg font-semibold">Export Data</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-1">
                        Configure options and save your dataset to Excel or other formats.
                    </DialogDescription>
                </DialogHeader>
                {modalContent}
            </DialogContent>
        </Dialog>
    );
};

export default ExportExcelModalContainer; 