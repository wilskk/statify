// Re-export all file modal components for easier imports
import { ModalType } from "@/hooks/useModal";

// Common components
// export { default as FileModalTemplate } from './FileModalTemplate';

// Import/Export modals
export * from './ImportCsv';
export * from './ImportExcel';
export * from './ExportCsv';
export * from './ExportExcel';

// File operation modals
export * from './OpenSavFile';
export * from './Print';

// Helper function to check file type
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