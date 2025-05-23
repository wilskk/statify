"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { PrintOptionsProps, PaperSize, SelectedOptions } from "./Print.types"; // Adjusted import path

export const PrintOptions: React.FC<PrintOptionsProps> = ({
    fileName,
    onFileNameChange,
    selectedOptions,
    onOptionChange,
    paperSize,
    onPaperSizeChange,
    onPrint,
    onCancel,
    isGenerating,
    isMobile,
    isPortrait
}) => {
    const isPrintDisabled = !Object.values(selectedOptions).some(Boolean) || isGenerating;

    return (
        <>
            <div className={`p-6 flex-grow overflow-y-auto ${isMobile ? 'space-y-5' : 'space-y-4'}`}>
                {/* Filename */}
                <div className={`${isMobile ? 'flex flex-col space-y-1.5' : 'grid grid-cols-4 items-center gap-4'}`}>
                    <Label htmlFor="print-filename" className={`${!isMobile ? 'text-right' : 'text-sm font-medium'}`}>
                        File Name
                    </Label>
                    <Input
                        id="print-filename"
                        value={fileName}
                        onChange={(e) => onFileNameChange(e.target.value)}
                        className={`${isMobile ? 'h-10' : 'col-span-3 h-9'}`}
                        placeholder="Enter file name (e.g., output_report)"
                        disabled={isGenerating}
                    />
                </div>

                {/* Content options */}
                <div className={`${isMobile ? 'flex flex-col space-y-1.5' : 'grid grid-cols-4 items-start gap-4'}`}>
                    <Label className={`${!isMobile ? 'text-right pt-1' : 'text-sm font-medium'}`}>Content to Print</Label>
                    <div className={`${isMobile ? 'space-y-2.5 pt-1' : 'col-span-3 space-y-2'}`}>
                        {(Object.keys(selectedOptions) as Array<keyof SelectedOptions>).map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`print-option-${option}`}
                                    checked={selectedOptions[option]}
                                    onCheckedChange={() => onOptionChange(option)}
                                    disabled={isGenerating}
                                />
                                <Label htmlFor={`print-option-${option}`} className="cursor-pointer font-normal text-sm">
                                    {option === 'data' ? 'Data View' :
                                     option === 'variable' ? 'Variable View' :
                                     'Output Viewer (Results)'}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Paper size */}
                <div className={`${isMobile ? 'flex flex-col space-y-1.5' : 'grid grid-cols-4 items-center gap-4'}`}>
                    <Label htmlFor="print-paperSize" className={`${!isMobile ? 'text-right' : 'text-sm font-medium'}`}>
                        Paper Size
                    </Label>
                    <Select
                        value={paperSize}
                        onValueChange={(value) => onPaperSizeChange(value as PaperSize)}
                        disabled={isGenerating}
                    >
                        <SelectTrigger id="print-paperSize" className={`${isMobile ? 'h-10' : 'col-span-3 h-9'}`}>
                            <SelectValue placeholder="Select paper size" />
                        </SelectTrigger>
                        <SelectContent>
                            {["a4", "a3", "letter", "legal"].map((size) => (
                                <SelectItem key={size} value={size}>
                                    {size.toUpperCase()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Actions footer */}
            <div className={`px-6 py-4 border-t border-border bg-muted flex-shrink-0 flex ${isMobile && isPortrait ? 'flex-col space-y-2' : 'justify-end space-x-2'}`}>
                <Button
                    variant="outline"
                    onClick={onCancel}
                    disabled={isGenerating}
                    className={`min-w-[90px] h-9 ${isMobile && isPortrait ? 'w-full' : ''}`}
                >
                    Cancel
                </Button>
                <Button
                    onClick={onPrint}
                    disabled={isPrintDisabled}
                    className={`min-w-[90px] h-9 ${isMobile && isPortrait ? 'w-full' : ''}`}
                >
                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isGenerating ? "Generating PDF..." : "Print to PDF"}
                </Button>
            </div>
        </>
    );
}; 