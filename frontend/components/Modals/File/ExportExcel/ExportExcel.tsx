"use client";

import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, InfoIcon, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExportExcelModalComponentProps, ExportExcelLogicState } from "./ExportExcel.types";
import { EXCEL_FORMATS, EXCEL_OPTIONS_CONFIG } from "./ExportExcel.constants";

const ExportExcelModal: FC<ExportExcelModalComponentProps> = ({ 
    onClose,
    exportOptions,
    isExporting,
    onhandleChange,
    onHandleFilenameChange,
    onHandleExport
}) => {
    return (
        <>
            <div className="p-6 overflow-y-auto flex-grow">
                <TooltipProvider delayDuration={200}>
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="filename" className="text-xs font-medium text-muted-foreground">File Name</Label>
                            <Input
                                id="filename"
                                value={exportOptions.filename}
                                onChange={(e) => onHandleFilenameChange(e.target.value)}
                                className="w-full h-9"
                                placeholder="Enter file name"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="format" className="text-xs font-medium text-muted-foreground">Format</Label>
                            <Select
                                value={exportOptions.format}
                                onValueChange={(value) => onhandleChange("format", value as ExportExcelLogicState['format'])}
                            >
                                <SelectTrigger id="format" className="w-full h-9">
                                    <SelectValue placeholder="Select format" />
                                </SelectTrigger>
                                <SelectContent>
                                    {EXCEL_FORMATS.map(format => (
                                        <SelectItem key={format.value} value={format.value} disabled={format.disabled}>
                                            {format.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3 pt-2">
                            <Label className="text-xs font-medium text-muted-foreground">Options (for Excel/ODS)</Label>
                            {EXCEL_OPTIONS_CONFIG.map(option => (
                                <div key={option.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={option.id}
                                        checked={Boolean(exportOptions[option.id as keyof ExportExcelLogicState])}
                                        onCheckedChange={(checked) => onhandleChange(option.id as keyof ExportExcelLogicState, Boolean(checked))}
                                    />
                                    <Label htmlFor={option.id} className="text-sm font-normal cursor-pointer flex items-center">
                                        {option.label}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <HelpCircle className="h-3.5 w-3.5 ml-1.5 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p>{option.tooltip}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </TooltipProvider>

                <div className="flex items-center py-3 text-xs text-muted-foreground border-t border-border mt-6">
                    <InfoIcon size={14} className="mr-2 flex-shrink-0" />
                    <span>XLSX is recommended for modern Excel. Use Export CSV for advanced CSV options.</span>
                </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0 flex justify-end space-x-2">
                <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isExporting}
                    className="min-w-[80px] h-9"
                >
                    Cancel
                </Button>
                <Button
                    onClick={onHandleExport}
                    disabled={isExporting || !exportOptions.filename.trim()}
                    className="min-w-[100px] h-9"
                >
                    {isExporting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {isExporting ? "Exporting..." : "Export"}
                </Button>
            </div>
        </>
    );
};

export default ExportExcelModal; 