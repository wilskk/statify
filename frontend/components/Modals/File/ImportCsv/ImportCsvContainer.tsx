"use client";

import React, { FC } from "react";
import ImportCsv from "./ImportCsv"; // Presentation component
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ContainerType } from "@/types/ui";

interface ImportCsvContainerProps {
    onClose: () => void;
    containerType?: ContainerType;
    // Any additional props to pass to ImportCsv if needed from a higher level
}

const ImportCsvContainer: FC<ImportCsvContainerProps> = ({ 
    onClose,
    containerType = "dialog",
    // ...otherProps 
}) => {

    // If sidebar mode, use a div container
    if (containerType === "sidebar") {
        return (
            <div className="flex flex-col h-full bg-background text-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <ImportCsv 
                        onClose={onClose} 
                        containerType={containerType} 
                        // {...otherProps} 
                    />
                </div>
            </div>
        );
    }

    // For dialog mode, use Dialog and DialogContent
    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 flex flex-col max-h-[90vh] bg-background text-foreground overflow-hidden">
                <ImportCsv 
                    onClose={onClose} 
                    containerType={containerType} 
                    // {...otherProps} 
                />
            </DialogContent>
        </Dialog>
    );
};

export default ImportCsvContainer; 