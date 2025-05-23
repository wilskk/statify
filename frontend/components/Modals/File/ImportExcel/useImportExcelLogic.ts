import { useState, useEffect, useCallback } from "react";
import { useMobile } from "@/hooks/useMobile";
import { ImportExcelStage, UseImportExcelLogicProps, UseImportExcelLogicOutput } from "./ImportExcel.types";

export const useImportExcelLogic = ({
    isOpen,
    onClose,
}: UseImportExcelLogicProps): UseImportExcelLogicOutput => {
    const [file, setFile] = useState<File | null>(null);
    const [binaryFileContent, setBinaryFileContent] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stage, setStage] = useState<ImportExcelStage>("select");

    const { isMobile, isPortrait } = useMobile();

    useEffect(() => {
        if (!isOpen) {
            setFile(null);
            setBinaryFileContent(null);
            setFileName("");
            setIsLoading(false);
            setError(null);
            setStage("select");
        }
    }, [isOpen]);

    const handleFileSelect = useCallback((selectedFile: File) => {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setError(null);
    }, []);

    const handleContinueToConfigure = useCallback(() => {
        if (!file) {
            setError("Please select an Excel file (.xls, .xlsx).");
            return;
        }
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            setError("Invalid file type. Please select an Excel file (.xls, .xlsx).");
            return;
        }

        setIsLoading(true);
        setError(null);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const binaryStr = e.target?.result as string;
                setBinaryFileContent(binaryStr);
                setStage("configure");
            } catch (err) {
                console.error("File reading error:", err);
                setError("Failed to read file content. The file might be corrupted.");
            } finally {
                setIsLoading(false);
            }
        };

        reader.onerror = () => {
            setError("Error reading file. Please ensure it's a valid Excel file and try again.");
            setIsLoading(false);
        };

        reader.readAsBinaryString(file);
    }, [file]);

    const handleBackToSelect = useCallback(() => {
        setStage("select");
        setBinaryFileContent(null); 
        setError(null);
    }, []);

    const handleModalClose = useCallback(() => {
        onClose();
    }, [onClose]);

    return {
        file,
        binaryFileContent,
        fileName,
        isLoading,
        error,
        stage,
        isMobile,
        isPortrait,
        handleFileSelect,
        handleContinueToConfigure,
        handleBackToSelect,
        handleModalClose,
        // Exposing setters for flexibility during refactor, can be removed if not used by UI component
        setFile,
        setFileName,
        setIsLoading,
        setError,
        setStage,
    };
}; 