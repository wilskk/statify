"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clipboard, Loader2 } from "lucide-react";
import { ImportClipboardPasteStepProps } from "../types"; // Updated path
import { Textarea } from "@/components/ui/textarea";

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
            console.log("Attempting to read clipboard via Clipboard API...");
            const text = await navigator.clipboard.readText();
            if (text) {
                console.log("Successfully read from clipboard API:", text.length, "characters");
                onTextPaste(text);
                if (textareaRef.current) {
                    textareaRef.current.value = text;
                }
                setClipboardApiError(null);
            } else {
                console.warn("Clipboard API returned empty text");
                setClipboardApiError("Clipboard appears to be empty.");
            }
        } catch (err) {
            console.error("Failed to read clipboard:", err);
            
            // Show user-friendly error message
            setClipboardApiError(
                "Clipboard access denied. Please manually paste text using Ctrl+V (or Cmd+V on Mac)."
            );
            
            // Focus the textarea to encourage manual paste
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

            <div className={`px-6 py-4 border-t border-border bg-muted flex-shrink-0 flex ${isMobile && isPortrait ? 'flex-col space-y-2' : 'justify-end space-x-2'}`}>
                <Button
                    variant="outline"
                    onClick={onClose}
                    className={`min-w-[90px] h-9 ${isMobile && isPortrait ? 'w-full' : ''}`}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button
                    onClick={onContinue}
                    disabled={isLoading || !pastedText || pastedText.trim() === ''}
                    className={`min-w-[90px] h-9 ${isMobile && isPortrait ? 'w-full' : ''}`}
                >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Continue
                </Button>
            </div>
        </div>
    );
}; 