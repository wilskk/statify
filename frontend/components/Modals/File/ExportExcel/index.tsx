"use client";

import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, InfoIcon, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExportExcelProps } from "./types";
import { EXCEL_FORMATS, EXCEL_OPTIONS_CONFIG } from "./utils/constants";
import { useExportExcelLogic } from "./hooks/useExportExcelLogic";

export const ExportExcel: FC<ExportExcelProps> = ({ 
    onClose,
    containerType
}) => {
    const {
        exportOptions,
        isExporting,
        handleChange,
        handleFilenameChange,
        handleExport,
    } = useExportExcelLogic({ onClose });

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 space-y-5 flex-grow overflow-y-auto">
                {/* File Name */}
                <div className="space-y-1.5">
                    <Label htmlFor="excel-filename">File Name</Label>
                    <Input
                        id="excel-filename"
                        value={exportOptions.filename}
                        onChange={(e) => handleFilenameChange(e.target.value)}
                        placeholder="Enter file name (e.g., excel_export)"
                        disabled={isExporting}
                    />
                </div>

                {/* Format */}
                <div className="space-y-1.5">
                    <Label htmlFor="excel-format">Format</Label>
                    <Select
                        value={exportOptions.format}
                        onValueChange={(value) => handleChange("format", value)}
                        disabled={isExporting}
                    >
                        <SelectTrigger id="excel-format">
                            <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                            {EXCEL_FORMATS.map((format) => (
                                <SelectItem key={format.value} value={format.value}>
                                    {format.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Options */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Options</Label>
                    <div className="grid gap-3 pl-1">
                        {EXCEL_OPTIONS_CONFIG.map((option) => (
                            <div key={option.id} className="flex items-start space-x-2">
                                <Checkbox
                                    id={option.id}
                                    checked={exportOptions[option.name as keyof typeof exportOptions] as boolean}
                                    onCheckedChange={(checked) => 
                                        handleChange(option.name as keyof typeof exportOptions, Boolean(checked))
                                    }
                                    disabled={isExporting}
                                    className="mt-0.5"
                                />
                                <div className="flex items-center">
                                    <Label 
                                        htmlFor={option.id} 
                                        className="font-normal cursor-pointer"
                                    >
                                        {option.label}
                                    </Label>
                                    {option.tooltip && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button className="ml-1.5 text-muted-foreground hover:text-foreground">
                                                        <HelpCircle size={14} />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="right" className="max-w-[280px] text-xs">
                                                    {option.tooltip}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                {/* Kiri: Help icon */}
                <div className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                    <HelpCircle size={18} className="mr-1" />
                </div>
                {/* Kanan: tombol Cancel/Export */}
                <div>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isExporting}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={isExporting || !exportOptions.filename.trim()}
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            "Export"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ExportExcel; 