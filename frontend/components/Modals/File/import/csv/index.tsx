"use client";

import React, { useState } from "react";
import { DialogContent } from "@/components/ui/dialog";
import ImportCSV from "./ImportCSV";
import ReadCSV from "./ReadCSV";

interface ImportCSVModalProps {
    onClose: () => void;
    props?: any;
}

const ImportCSVModal: React.FC<ImportCSVModalProps> = ({ onClose, props }) => {
    const [file, setFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stage, setStage] = useState<"select" | "configure">("select");

    // Function to handle file selection
    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setError(null);
    };

    // Function to handle continuing to the read stage
    const handleContinue = () => {
        if (!file) {
            setError("Please select a CSV file");
            return;
        }

        setIsLoading(true);
        const reader = new FileReader();

        reader.onload = () => {
            try {
                setFileContent(reader.result as string);
                setStage("configure");
                setIsLoading(false);
            } catch (error) {
                setError("Failed to read file. Please try again.");
                setIsLoading(false);
            }
        };

        reader.onerror = () => {
            setError("Failed to read file. Please try again.");
            setIsLoading(false);
        };

        reader.readAsText(file);
    };

    // Reset the file selection state
    const handleBack = () => {
        setStage("select");
        // Keep the file selected but reset the content
        setFileContent(null);
    };

    return (
        <DialogContent className="p-0 bg-popover border-border rounded overflow-hidden">
            {stage === "select" ? (
                <ImportCSV
                    onClose={onClose}
                    onFileSelect={handleFileSelect}
                    onContinue={handleContinue}
                    isLoading={isLoading}
                    error={error}
                    selectedFile={file}
                />
            ) : (
                <ReadCSV
                    onClose={onClose}
                    onBack={handleBack}
                    fileName={fileName}
                    fileContent={fileContent || ""}
                />
            )}
        </DialogContent>
    );
};

export default ImportCSVModal;