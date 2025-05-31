"use client";

import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, InfoIcon, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExportExcelProps } from "./ExportExcel.types";
import { EXCEL_FORMATS, EXCEL_OPTIONS_CONFIG } from "./ExportExcel.constants";
import { useExportExcelLogic } from "./useExportExcelLogic";

const ExportExcel: FC<ExportExcelProps> = ({ 
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
            <div className="flex justify-end space-x-2 px-6 py-4 border-t border-border bg-muted flex-shrink-0">
                <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isExporting}
                    className="min-w-[80px]"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleExport}
                    disabled={isExporting || !exportOptions.filename.trim()}
                    className="min-w-[80px]"
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
    );
};

export default ExportExcel; 