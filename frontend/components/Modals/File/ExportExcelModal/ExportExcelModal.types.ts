import { DataRow } from "@/types/Data";
import { Variable } from "@/types/Variable";
// import { Meta } from "@/types/Meta"; // Meta type might not exist or be at a different path
import { ContainerType } from '@/types/ui';

// Props for the main container component
export interface ExportExcelModalContainerProps {
    onClose: () => void;
    containerType?: ContainerType;
    // Hook options can be included here if ExportExcelModalContainer needs to pass them
    // initialFilename?: string;
    // ... other hook options
}

// Options for the excel generation utility
export interface ExcelUtilOptions {
    includeHeaders: boolean;
    includeVariablePropertiesSheet: boolean;
    includeMetadataSheet: boolean;
    includeDataLabels: boolean;
    applyHeaderStyling: boolean;
}

// State managed by the logic hook
export interface ExportExcelLogicState {
    filename: string;
    format: "xlsx" | "xls" | "csv" | "txt"; // Example formats, adjust as needed
    includeHeaders: boolean;
    includeVariableProperties: boolean;
    includeMetadataSheet: boolean;
    includeDataLabels: boolean;
    applyHeaderStyling: boolean;
}

// Props for the logic hook itself
export interface UseExportExcelLogicProps {
    onClose: () => void;
    // Potentially allow passing initial options to the hook
    // initialOptions?: Partial<ExportExcelLogicState>; 
}

// Output of the logic hook
export interface UseExportExcelModalLogicOutput {
    exportOptions: ExportExcelLogicState;
    isExporting: boolean;
    handleChange: (field: keyof ExportExcelLogicState, value: string | boolean) => void;
    handleFilenameChange: (value: string) => void;
    handleExport: () => Promise<void>;
}

// Props for the UI component (ExportExcelModal.tsx)
export interface ExportExcelModalProps extends UseExportExcelModalLogicOutput {
    onClose: () => void; // Already in UseExportExcelModalLogicOutput via UseExportExcelLogicProps but can be explicit
    // Any other props specific to the UI shell itself
    // Example: title?: string;
}

// Props for the main UI component (ExportExcelModal.tsx if it's different from the modal shell)
// This would be the component that useExportExcelModalLogic passes its state and handlers to.
export interface ExportExcelUIProps extends UseExportExcelModalLogicOutput {
    // containerType: ContainerType; // If the UI shell needs to know this
    onHandleChange: (field: keyof ExportExcelLogicState, value: string | boolean) => void; // Specific for the UI form elements
    onHandleFilenameChange: (value: string) => void; // Specific for the UI form elements
    onHandleExport: () => Promise<void>; // Specific for the UI form elements
    onClose: () => void; // For cancel button
} 