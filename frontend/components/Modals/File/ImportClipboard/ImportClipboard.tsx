"use client";

import React from "react";
import { ImportClipboardProps } from "./types";
import { useImportClipboardLogic } from "./hooks/useImportClipboardLogic";
import { ImportClipboardPasteStep } from "./components/ImportClipboardPasteStep";
import { ImportClipboardConfigurationStep } from "./components/ImportClipboardConfigurationStep";

export const ImportClipboardModal: React.FC<ImportClipboardProps> = ({
    onClose,
    containerType,
}) => {
    const {
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
    } = useImportClipboardLogic({ onClose });

    const renderContent = () => {
        if (stage === "paste") {
            return (
                <ImportClipboardPasteStep
                    onClose={handleModalClose}
                    onTextPaste={handleTextPaste}
                    onContinue={handleContinueToConfigure}
                    isLoading={isLoading}
                    error={error}
                    pastedText={pastedText}
                    isMobile={isMobile}
                    isPortrait={isPortrait}
                />
            );
        }
        if (stage === "configure" && pastedText) {
            return (
                <ImportClipboardConfigurationStep
                    onClose={handleModalClose}
                    onBack={handleBackToPaste}
                    pastedText={pastedText}
                    parsedData={parsedData}
                />
            );
        }
        return <div className="p-6 flex-grow flex items-center justify-center">Loading configuration...</div>;
    };

    return (
        <div className="flex-grow overflow-y-auto flex flex-col h-full">
            {renderContent()}
        </div>
    );
};

// Export the component with both names for backward compatibility
export default ImportClipboardModal; 