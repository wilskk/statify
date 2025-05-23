import { ContainerType } from "@/types/ui";

export interface OpenSavFileContainerProps {
    isOpen: boolean;
    onClose: () => void;
    containerType?: ContainerType;
}

export interface UseOpenSavFileLogicProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface UseOpenSavFileLogicOutput {
    file: File | null;
    isLoading: boolean;
    error: string | null;
    isMobile: boolean;
    isPortrait: boolean;
    handleFileChange: (selectedFile: File | null) => void;
    clearError: () => void;
    handleSubmit: () => Promise<void>;
    handleModalClose: () => void; 
}

// Props for the main presentational component OpenSavFileUI
export interface OpenSavFileUIProps extends UseOpenSavFileLogicOutput {
    containerType: ContainerType;
}

// Props for the content/step component (OpenSavFileStep)
export interface OpenSavFileStepProps {
    selectedFile: File | null;
    onFileChange: (file: File | null) => void;
    onSubmit: () => Promise<void>;
    onCancel: () => void; // Corresponds to handleModalClose from the hook
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
    isMobile: boolean; // Passed down for responsive styling within the step
    isPortrait: boolean; // Passed down for responsive styling within the step
} 