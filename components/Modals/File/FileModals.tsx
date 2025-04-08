// components/Modals/File/FileModals.tsx
import React from "react";
import { ModalType } from "@/hooks/useModal";
import ImportCSVModal from "@/components/Modals/File/import/csv";
import ImportExcelModal from "@/components/Modals/File/import/excel";
import OpenData from "@/components/Modals/File/open/OpenData";
// import OpenOutput from "@/components/Modals/File/Open/OpenOutput";
import PrintModal from "@/components/Modals/File/print/Print";
// import PrintPreviewModal from "@/components/Modals/File/Print/PrintPreview";
import ExportCSV from "@/components/Modals/File/export/ExportCSV";
import ExportExcel from "@/components/Modals/File/export/ExportExcel";
// import ExitModal from "@/components/Modals/File/Exit";

export const modalStyles = {
    // Containers
    dialogContent: "bg-white p-0 shadow-[0px_4px_12px_rgba(0,0,0,0.08)]",
    dialogHeader: "bg-[#F7F7F7] px-6 py-5 border-b border-[#E6E6E6] h-16",
    dialogBody: "px-6 py-6",
    dialogFooter: "bg-[#F7F7F7] px-6 py-5 border-t border-[#E6E6E6] h-16",

    // Typography
    dialogTitle: "text-lg font-semibold text-black",
    dialogDescription: "text-sm text-[#888888]",

    // Buttons
    primaryButton: "bg-black text-white hover:opacity-90 h-8",
    secondaryButton: "border-[#CCCCCC] text-black hover:bg-[#F7F7F7] h-8",

    // Form elements
    formGroup: "space-y-2 mb-6",
    label: "text-[#444444] text-xs font-medium",
    input: "h-10 border-[#CCCCCC] focus:border-black"
};

interface FileModalsProps {
    modalType: ModalType;
    onClose: () => void;
    props?: any;
}

export const FileModals: React.FC<FileModalsProps> = ({ modalType, onClose, props }) => {
    switch (modalType) {
        case ModalType.ImportCSV:
            return <ImportCSVModal onClose={onClose} {...props} />;
        case ModalType.ImportExcel:
            return <ImportExcelModal onClose={onClose} {...props} />;
        case ModalType.OpenData:
            return <OpenData onClose={onClose} {...props} />;
        // case ModalType.OpenOutput:
        //     return <OpenOutput onClose={onClose} {...props} />;
        // case ModalType.PrintPreview:
        //     return <PrintPreviewModal onClose={onClose} {...props} />;
        case ModalType.Print:
            return <PrintModal onClose={onClose} {...props} />;
        case ModalType.ExportCSV:
            return <ExportCSV onClose={onClose} {...props} />;
        case ModalType.ExportExcel:
            return <ExportExcel onClose={onClose} {...props} />;
        // case ModalType.Exit:
        //     return <ExitModal onClose={onClose} {...props} />;
        default:
            return null;
    }
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