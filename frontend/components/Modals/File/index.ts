// Types
import { ModalType } from "@/types/modalTypes";

// Registry exports
export { 
    FILE_MODAL_COMPONENTS,
    FILE_MODAL_CONTAINER_PREFERENCES,
    getFileModalComponent
} from './FileRegistry';

// Re-export modal components - these are imported directly in FileRegistry
// but we export them here for backward compatibility and convenience
export * from '@/components/Modals/File/ImportCsv';
export * from '@/components/Modals/File/ImportExcel';
export * from '@/components/Modals/File/ExportCsv';
export * from '@/components/Modals/File/ExportExcel';
export * from '@/components/Modals/File/OpenSavFile';
export * from '@/components/Modals/File/Print';

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