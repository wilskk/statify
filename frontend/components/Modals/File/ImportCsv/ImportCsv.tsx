"use client";

import React, { useState, FC } from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ImportCsvSelection } from "./ImportCsvSelection"; 
import { ImportCsvConfiguration } from "./ImportCsvConfiguration";
import { ContainerType } from "@/types/ui";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useImportCsvFileReader } from "./useImportCsvFileReader";

interface ImportCsvProps { 
    onClose: () => void;
    containerType: ContainerType; // Made non-optional as container should always decide
}

const ImportCsv: FC<ImportCsvProps> = ({ 
    onClose,
    containerType, // No default here, should be explicitly passed
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [stage, setStage] = useState<"select" | "configure">("select");

    const {
        fileName,
        fileContent,
        error: fileReaderError,
        isLoading: isFileReaderLoading,
        readFile,
        resetFileState
    } = useImportCsvFileReader();

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
    };

    const handleContinueToConfigure = async () => {
        if (!file) return;
        await readFile(file);
        // Conditional stage change based on file content needs careful handling.
        // Assuming readFile updates fileContent, then we check it.
        // A more robust way might involve a callback or effect.
        if (fileContent || (await new Promise(resolve => setTimeout(resolve, 0)), fileContent)) {
             setStage("configure");
        }
    };

    const handleBackToSelect = () => {
        setStage("select");
        setFile(null);
        resetFileState();
    };

    const renderContent = () => {
        if (stage === "select") {
            return (
                <ImportCsvSelection
                    onClose={onClose}
                    onFileSelect={handleFileSelect}
                    onContinue={handleContinueToConfigure}
                    isLoading={isFileReaderLoading}
                    error={fileReaderError}
                    selectedFile={file}
                />
            );
        } else if (stage === "configure" && fileContent) {
            return (
                <ImportCsvConfiguration
                    onClose={onClose}
                    onBack={handleBackToSelect}
                    fileName={fileName}
                    fileContent={fileContent}
                />
            );
        }
        return null; 
    };

    // This structure is for the presentation component. 
    // The Dialog/Sidebar wrappers will be in the Container.
    return (
        <>
            {containerType === "dialog" && (
                <DialogHeader 
                    className={`px-6 pt-5 pb-3 border-b border-border flex-shrink-0 ${ 
                        stage === 'configure' ? 'flex flex-row items-center justify-between' : '' 
                    }`}
                >
                    {stage === 'configure' && (
                        <Button variant="ghost" size="sm" onClick={handleBackToSelect} className="mr-2 -ml-2 h-8 w-8 p-0">
                            <ArrowLeft size={16} />
                        </Button>
                    )}
                    <div className={`${stage === 'configure' ? 'flex-1 min-w-0' : ''}`}>
                        <DialogTitle className={`text-lg font-semibold ${stage === 'configure' ? 'truncate' : ''}`}>
                            {stage === "select" ? "Import CSV File" : `Configure Import: ${fileName}`}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-1">
                            {stage === "select"
                                ? "Select a CSV file to import for analysis."
                                : "Adjust settings for how the CSV data should be read."}
                        </DialogDescription>
                    </div>
                    {stage === 'configure' && <div className="w-8"></div>} {/* Spacer */}
                </DialogHeader>
            )}
            <div className="flex-grow flex flex-col overflow-hidden p-6">
                {renderContent()}
            </div>
        </>
    );
};

export default ImportCsv; 