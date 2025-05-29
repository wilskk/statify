"use client";

import React from "react";
// Dialog komponen tidak lagi diimpor di sini
// import { Printer } from "lucide-react"; // Tidak digunakan secara langsung di sini lagi
import { PrintProps } from "./Print.types"; // Menggunakan PrintProps yang baru
import { usePrintLogic } from "./usePrintLogic"; // Mengimpor hook
import { PrintOptions } from "./PrintOptions";

// Renamed to PrintModal for consistency with other modals
export const PrintModal: React.FC<PrintProps> = ({
    onClose,
    containerType,
}) => {
    // Using hook to get state and handlers
    const {
        fileName,
        setFileName,
        selectedOptions,
        setSelectedOptions,
        paperSize,
        setPaperSize,
        isGenerating,
        isMobile,
        isPortrait,
        handlePrint,
        handleModalClose,
    } = usePrintLogic({ onClose });

    return (
        <div className="flex-grow overflow-y-auto flex flex-col h-full">
            <PrintOptions
                fileName={fileName}
                onFileNameChange={setFileName}
                selectedOptions={selectedOptions}
                onOptionChange={(option) => setSelectedOptions(prev => ({...prev, [option]: !prev[option]}))}
                paperSize={paperSize}
                onPaperSizeChange={setPaperSize}
                onPrint={handlePrint}
                onCancel={handleModalClose} 
                isGenerating={isGenerating}
                isMobile={isMobile}
                isPortrait={isPortrait}
            />
        </div>
    );
};

// Export the component with both names for backward compatibility
export default PrintModal; 