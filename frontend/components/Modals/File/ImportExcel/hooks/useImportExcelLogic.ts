import { useState, useEffect, useCallback } from "react";
import { useMobile } from "@/hooks/useMobile";
import { ImportExcelStage, UseImportExcelLogicProps, UseImportExcelLogicOutput, SheetData } from "../types";
import { useExcelWorker } from "./useExcelWorker";

export const useImportExcelLogic = ({
    onClose,
}: UseImportExcelLogicProps): UseImportExcelLogicOutput => {
    const [file, setFile] = useState<File | null>(null);
    const [parsedSheets, setParsedSheets] = useState<SheetData[] | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stage, setStage] = useState<ImportExcelStage>("select");

    const { isMobile, isPortrait } = useMobile();
    const { parse } = useExcelWorker();

    const handleFileSelect = useCallback((selectedFile: File | null) => {
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
            setError(null); // Clear previous errors on new file selection
        } else {
            setFile(null);
            setFileName("");
            // Optionally clear error if you want: setError(null);
        }
    }, []);

    const handleContinueToConfigure = useCallback(async () => {
        if (!file) {
            setError("Please select an Excel file (.xls, .xlsx).");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const sheets = await parse(file);
            setParsedSheets(sheets);
            setStage("configure");
        } catch (err: any) {
            console.error("File processing error:", err);
            setError(err.message || "Failed to read or process file.");
        } finally {
            setIsLoading(false);
        }
    }, [file, parse]);

    const handleBackToSelect = useCallback(() => {
        setStage("select");
        setParsedSheets(null);
        // Clear file to allow re-selection if needed, or keep it if user might go back and forth
        // setFile(null);
        // setFileName("");
        setError(null); // Clear errors when going back
    }, []);

    const handleModalClose = useCallback(() => {
        onClose();
        // Reset state if modal is closed completely
        setFile(null);
        setParsedSheets(null);
        setFileName("");
        setError(null);
        setStage("select");
    }, [onClose]);

    return {
        file,
        parsedSheets,
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
        // Exposing setters might not be needed if all logic is handled within the hook
        setFile, // Consider if these are truly needed by the UI directly
        setFileName,
        setIsLoading,
        setError,
        setStage,
        setParsedSheets,
    };
}; 