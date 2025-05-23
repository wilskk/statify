import { ContainerType } from "@/types/ui";

export type ImportExcelStage = "select" | "configure";

export interface ImportExcelContainerProps {
    isOpen: boolean;
    onClose: () => void;
    containerType?: ContainerType;
}

export interface UseImportExcelLogicProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface UseImportExcelLogicOutput {
    file: File | null;
    binaryFileContent: string | null; 
    fileName: string;
    isLoading: boolean;
    error: string | null;
    stage: ImportExcelStage;
    isMobile: boolean;
    isPortrait: boolean;
    handleFileSelect: (selectedFile: File) => void;
    handleContinueToConfigure: () => void;
    handleBackToSelect: () => void;
    handleModalClose: () => void;
    // Exposing setters for flexibility during refactor, can be removed if not used by UI component
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    setFileName: React.Dispatch<React.SetStateAction<string>>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    setStage: React.Dispatch<React.SetStateAction<ImportExcelStage>>;
}

// Props for the main presentational component ImportExcelUI
export interface ImportExcelUIProps extends UseImportExcelLogicOutput {
    containerType: ContainerType;
}

// Props for the first step (file selection)
export interface ImportExcelSelectionStepProps {
    onClose: () => void; 
    onFileSelect: (file: File) => void;
    onContinue: () => void;
    isLoading: boolean;
    error: string | null;
    selectedFile: File | null;
    isMobile: boolean;
    isPortrait: boolean;
}

// Props for the second step (configuration and preview)
export interface ImportExcelConfigurationStepProps {
    onClose: () => void; 
    onBack: () => void;
    fileName: string;
    fileContent: string; // Binary string content
} 