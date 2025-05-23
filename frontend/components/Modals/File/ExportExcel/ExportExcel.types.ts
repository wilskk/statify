// frontend/components/Modals/File/export/ExportExcelModal/ExportExcelModal.types.ts
import { Variable } from "@/types/Variable";
import { DataRow } from "@/types/Data";
import { Meta } from "@/stores/useMetaStore";
import { ContainerType } from "@/types/ui";

// Options for the core Excel generation utility
export interface ExcelUtilOptions {
    includeHeaders: boolean;
    includeVariablePropertiesSheet: boolean;
    includeMetadataSheet: boolean;
    includeDataLabels: boolean;
    applyHeaderStyling: boolean;
}

// State and options managed by the custom hook
export interface ExportExcelLogicState {
    filename: string;
    format: "xlsx" | "xls" | "csv" | "ods"; // 'csv' might be disabled in UI but type allows
    includeHeaders: boolean;
    includeVariableProperties: boolean; // Corresponds to includeVariablePropertiesSheet in util
    includeMetadataSheet: boolean;
    includeDataLabels: boolean;
    applyHeaderStyling: boolean;
}

export interface UseExportExcelLogicProps {
    onClose: () => void;
}

// Props for the presentational component (ExportExcelModal.tsx)
export interface ExportExcelModalComponentProps extends UseExportExcelLogicProps {
    exportOptions: ExportExcelLogicState;
    isExporting: boolean;
    onhandleChange: (field: keyof ExportExcelLogicState, value: string | boolean) => void;
    onHandleFilenameChange: (value: string) => void;
    onHandleExport: () => void;
    // containerType?: ContainerType; // This prop might not be needed directly by the presentational component if handled by container
}

// Props for the container component (ExportExcelModalContainer.tsx)
export interface ExportExcelModalContainerProps {
    onClose: () => void;
    containerType?: ContainerType;
} 