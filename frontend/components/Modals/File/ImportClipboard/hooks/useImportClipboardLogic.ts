import { useState, useCallback } from "react";
import { useMobile } from "@/hooks/useMobile";
import type { 
    ImportClipboardStage, 
    UseImportClipboardLogicProps, 
    UseImportClipboardLogicOutput 
} from "../types"; // Updated path

export const useImportClipboardLogic = ({
    onClose,
}: UseImportClipboardLogicProps): UseImportClipboardLogicOutput => {
    const [pastedText, setPastedText] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<string[][]>([]);
    const [isLoading, _setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [stage, setStage] = useState<ImportClipboardStage>("paste");

    const { isMobile, isPortrait } = useMobile();

    const handleTextPaste = useCallback((text: string) => {
        setPastedText(text);
        setError(null);

        if (text.trim()) {
            const rows = text.split(/\r?\n/);
            try {
                const parsedRows = rows
                    .filter(row => row.trim() !== '')
                    .map(row => row.split('\t'));
                setParsedData(parsedRows);
            } catch {
                setError("Failed to parse pasted text. Please check the format.");
                setParsedData([]);
            }
        } else {
            setParsedData([]);
        }
    }, []);

    const handleContinueToConfigure = useCallback(() => {
        if (!pastedText || pastedText.trim() === '') {
            setError("Please paste some data first.");
            return;
        }

        if (parsedData.length === 0) {
            setError("No valid data could be parsed from the pasted text.");
            return;
        }
        setStage("configure");
    }, [pastedText, parsedData]);

    const handleBackToPaste = useCallback(() => {
        setStage("paste");
    }, []);

    const handleModalClose = useCallback(() => {
        onClose();
    }, [onClose]);

    return {
        pastedText,
        parsedData,
        isLoading,
        error,
        stage,
        isMobile,
        isPortrait,
        handleTextPaste,
        handleContinueToConfigure,
        handleBackToPaste,
        handleModalClose,
    };
};