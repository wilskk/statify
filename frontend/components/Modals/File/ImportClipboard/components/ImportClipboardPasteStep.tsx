"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clipboard, Loader2, HelpCircle } from "lucide-react";
import { ImportClipboardPasteStepProps } from "../types"; // Updated path
import { Textarea } from "@/components/ui/textarea";
import { readTextFromClipboard } from "../services/services"; // Import the new service function

export const ImportClipboardPasteStep: React.FC<ImportClipboardPasteStepProps> = ({
    onClose,
    onTextPaste,
    onContinue,
    isLoading,
    error,
    pastedText,
    isMobile,
    isPortrait
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [clipboardApiError, setClipboardApiError] = useState<string | null>(null);

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const text = e.clipboardData.getData('text');
        if (text) {
            console.log("Text pasted via paste event:", text.length, "characters");
            onTextPaste(text);
            setClipboardApiError(null);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onTextPaste(e.target.value);
        if (e.target.value) {
            setClipboardApiError(null);
        }
    };

    const handlePasteButtonClick = async () => {
        try {
            console.log("Attempting to read clipboard via service...");
            const text = await readTextFromClipboard(); // Use the service function
            // No need to check for empty text here, as the service function already does that
            console.log("Successfully read from clipboard service:", text.length, "characters");
            onTextPaste(text);
            if (textareaRef.current) {
                textareaRef.current.value = text;
            }
            setClipboardApiError(null);
        } catch (err: any) {
            console.error("Failed to read clipboard using service:", err);
            setClipboardApiError(
                err.message || "Clipboard access denied or error. Please manually paste text (Ctrl+V / Cmd+V)."
            );
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-border flex items-center flex-shrink-0">
                <Clipboard size={18} className="mr-2.5 flex-shrink-0 text-primary" />
                <div className="flex-grow overflow-hidden">
                    <h3 className="font-semibold text-lg text-popover-foreground">
                        Import from Clipboard
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Paste tabular data from clipboard to import into Statify
                    </p>
                </div>
            </div>

            <div className="p-6 flex-grow flex flex-col">
                <div className="mb-4">
                    <Button 
                        variant="outline" 
                        onClick={handlePasteButtonClick} 
                        className="mb-3"
                        disabled={isLoading}
                    >
                        <Clipboard className="h-4 w-4 mr-2" />
                        Paste from Clipboard
                    </Button>
                    
                    {clipboardApiError && (
                        <div className="flex items-center gap-2 mb-3 text-sm text-amber-500 dark:text-amber-400">
                            <AlertCircle size={16} className="flex-shrink-0" />
                            <span>{clipboardApiError}</span>
                        </div>
                    )}
                </div>

                <div className="flex-grow relative min-h-[200px]">
                    <Textarea
                        ref={textareaRef}
                        className={`w-full h-full min-h-[200px] font-mono text-sm ${error ? 'border-destructive' : ''}`}
                        placeholder="Paste your tabular data here..."
                        onPaste={handlePaste}
                        onChange={handleChange}
                        disabled={isLoading}
                        value={pastedText || ''}
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-destructive">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                {/* Kiri: Help icon */}
                <div className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                    <HelpCircle size={18} className="mr-1" />
                </div>
                {/* Kanan: tombol Cancel/Continue */}
                <div>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onContinue}
                        disabled={isLoading || !pastedText || pastedText.trim() === ''}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continue
                    </Button>
                </div>
            </div>
        </div>
    );
}; 