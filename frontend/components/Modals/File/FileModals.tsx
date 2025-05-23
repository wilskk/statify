// components/Modals/File/FileModals.tsx
import React from "react";
import { ModalType } from "@/hooks/useModal";
import { ContainerType } from "@/types/ui";
import { ImportCsv as ImportCsvModal } from "@/components/Modals/File/ImportCsv";
import { ImportExcelModal } from "@/components/Modals/File/ImportExcel";
import { OpenSavFileModal } from "@/components/Modals/File/OpenSavFile";
// import OpenOutput from "@/components/Modals/File/Open/OpenOutput";
import { PrintModal } from "@/components/Modals/File/Print";
// import PrintPreviewModal from "@/components/Modals/File/Print/PrintPreview";
import { ExportCsv as ExportCSVModal } from "@/components/Modals/File/ExportCsv";
import { ExportExcelModal } from "@/components/Modals/File/ExportExcelModal";
// import ExitModal from "@/components/Modals/File/Exit";

export const modalStyles = {
    // Containers
    dialogContent: "bg-popover p-0 shadow-[0px_4px_12px_rgba(0,0,0,0.08)]",
    dialogHeader: "bg-muted px-6 py-5 border-b border-border h-16",
    dialogBody: "px-6 py-6",
    dialogFooter: "bg-muted px-6 py-5 border-t border-border h-16",

    // Typography
    dialogTitle: "text-lg font-semibold text-popover-foreground",
    dialogDescription: "text-sm text-muted-foreground",

    // Buttons
    primaryButton: "bg-primary text-primary-foreground hover:opacity-90 h-8",
    secondaryButton: "border-border text-secondary-foreground hover:bg-accent h-8",

    // Form elements
    formGroup: "space-y-2 mb-6",
    label: "text-foreground text-xs font-medium",
    input: "h-10 border-input focus:border-ring"
};

interface FileModalsProps {
    modalType: ModalType;
    onClose: () => void;
    props?: any;
    containerType?: ContainerType;
}

export const FileModals: React.FC<FileModalsProps> = ({ 
    modalType, 
    onClose, 
    props,
    containerType = "dialog" 
}) => {
    // Render the appropriate component based on modalType and containerType
    const renderComponent = () => {
        switch (modalType) {
            case ModalType.ImportCSV:
                return <ImportCsvModal onClose={onClose} containerType={containerType} {...props} />;
            case ModalType.ImportExcel:
                return <ImportExcelModal onClose={onClose} containerType={containerType} {...props} />;
            case ModalType.OpenData:
                return <OpenSavFileModal onClose={onClose} containerType={containerType} {...props} />;
            // case ModalType.OpenOutput:
            //     return <OpenOutput onClose={onClose} containerType={containerType} {...props} />;
            // case ModalType.PrintPreview:
            //     return <PrintPreviewModal onClose={onClose} containerType={containerType} {...props} />;
            case ModalType.Print:
                return <PrintModal onClose={onClose} containerType={containerType} {...props} />;
            case ModalType.ExportCSV:
                return <ExportCSVModal onClose={onClose} containerType={containerType} {...props} />;
            case ModalType.ExportExcel:
                return <ExportExcelModal onClose={onClose} containerType={containerType} {...props} />;
            // case ModalType.Exit:
            //     return <ExitModal onClose={onClose} containerType={containerType} {...props} />;
            default:
                return null;
        }
    };

    // If sidebar mode, just return the component
    if (containerType === "sidebar") {
        return renderComponent();
    }

    // For dialog mode, just return the component as is
    // Each individual modal will handle its own dialog wrapping
    return renderComponent();
};

// utils/modalCategories.ts
export const isFileModal = (type: ModalType): boolean => {
    return [
        ModalType.ImportCSV,
        ModalType.ReadCSVFile,
        ModalType.ImportExcel,
        ModalType.ReadExcelFile,
        ModalType.OpenData,
        ModalType.OpenOutput,
        ModalType.PrintPreview,
        ModalType.Print,
        ModalType.ExportCSV,
        ModalType.ExportExcel,
        ModalType.Exit
    ].includes(type);
};