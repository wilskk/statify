"use client";

import React, { FC } from "react";
import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, InfoIcon, HelpCircle } from "lucide-react";
import { UseExportCsvOptions, useExportCsv } from "./useExportCsv"; // Corrected import path

interface ExportCsvModalProps extends UseExportCsvOptions { // Changed to ExportCsvModalProps
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
    // Props from useExportCsv hook
    exportOptions: ReturnType<typeof useExportCsv>['exportOptions'];
    isExporting: ReturnType<typeof useExportCsv>['isExporting'];
    handleChange: ReturnType<typeof useExportCsv>['handleChange'];
    handleFilenameChange: ReturnType<typeof useExportCsv>['handleFilenameChange'];
    handleExport: ReturnType<typeof useExportCsv>['handleExport'];
}

const ExportCsv: FC<ExportCsvModalProps> = ({ 
    onClose,
    containerType = "dialog",
    exportOptions,
    isExporting,
    handleChange,
    handleFilenameChange,
    handleExport,
}) => {
    return (
        <>
            {containerType === "dialog" && (
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-[22px] font-semibold text-popover-foreground">Export Data to CSV</DialogTitle>
                    <DialogDescription className="text-muted-foreground mt-2">
                        Configure options and download your dataset as a Comma Separated Values (CSV) file.
                    </DialogDescription>
                </DialogHeader>
            )}
            {containerType === "sidebar" && (
                <div className="px-6 py-4 border-b border-border flex-shrink-0 mb-6">
                    <h2 className="text-xl font-semibold">Export Data to CSV</h2>
                    <p className="text-muted-foreground text-sm mt-2">
                        Configure options and download your dataset as a CSV file.
                    </p>
                </div>
            )}

            <TooltipProvider delayDuration={200}>
                <div className="mb-6 space-y-5 px-6">
                    <div className="space-y-2">
                        <Label htmlFor="filename" className="block text-sm font-medium text-popover-foreground">File Name</Label>
                        <Input
                            id="filename"
                            value={exportOptions.filename}
                            onChange={(e) => handleFilenameChange(e.target.value)}
                            className="w-full"
                            placeholder="Enter file name (e.g., dataset_export)"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="delimiter" className="block text-sm font-medium text-popover-foreground">Delimiter</Label>
                        <Select
                            value={exportOptions.delimiter}
                            onValueChange={(value) => handleChange("delimiter", value)}
                        >
                            <SelectTrigger id="delimiter" className="w-full">
                                <SelectValue placeholder="Select delimiter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value=",">Comma (,)</SelectItem>
                                <SelectItem value=";">Semicolon (;)</SelectItem>
                                <SelectItem value="\t">Tab (\t)</SelectItem>
                                <SelectItem value="|">Pipe (|)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="encoding" className="block text-sm font-medium text-popover-foreground">Encoding</Label>
                        <Select
                            value={exportOptions.encoding}
                            onValueChange={(value) => handleChange("encoding", value)}
                        >
                            <SelectTrigger id="encoding" className="w-full">
                                <SelectValue placeholder="Select encoding" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UTF-8">UTF-8 (Recommended)</SelectItem>
                                <SelectItem value="ISO-8859-1">ISO-8859-1 (Latin-1)</SelectItem>
                                <SelectItem value="windows-1252">Windows-1252</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3 pt-2">
                        <Label className="block text-sm font-medium mb-1 text-popover-foreground">Options</Label>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="includeHeaders"
                                checked={exportOptions.includeHeaders}
                                onCheckedChange={(checked) => handleChange("includeHeaders", Boolean(checked))}
                            />
                            <Label htmlFor="includeHeaders" className="text-sm font-normal cursor-pointer flex items-center text-popover-foreground">
                                Include variable names as header row
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Adds the variable names as the first row in the CSV file.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="includeVariableProperties"
                                checked={exportOptions.includeVariableProperties}
                                onCheckedChange={(checked) => handleChange("includeVariableProperties", Boolean(checked))}
                            />
                            <Label htmlFor="includeVariableProperties" className="text-sm font-normal cursor-pointer flex items-center text-popover-foreground">
                                Include variable properties (metadata)
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p>Adds variable details (type, label, measure, etc.) as commented lines (#) at the beginning of the file.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="quoteStrings"
                                checked={exportOptions.quoteStrings}
                                onCheckedChange={(checked) => handleChange("quoteStrings", Boolean(checked))}
                            />
                            <Label htmlFor="quoteStrings" className="text-sm font-normal cursor-pointer flex items-center text-popover-foreground">
                                Quote string values
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Always wrap text values in double quotes (""). If unchecked, quotes are only added if necessary (e.g., value contains delimiter or quotes).</p>
                                    </TooltipContent>
                                </Tooltip>
                            </Label>
                        </div>
                    </div>
                </div>
            </TooltipProvider>

            <div className="flex items-center py-3 text-xs text-muted-foreground border-t border-border mt-4 px-6">
                <InfoIcon size={14} className="mr-2 flex-shrink-0" />
                <span>CSV is a common format for data exchange. Ensure compatibility with the target application.</span>
            </div>

            <div className={`px-6 py-4 ${containerType === "sidebar" ? "border-t border-border" : ""} mt-2 flex justify-end gap-3`}>
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
                    disabled={isExporting}
                    className="min-w-[100px]"
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {isExporting ? "Exporting..." : "Export CSV"}
                </Button>
            </div>
        </>
    );
};

export default ExportCsv; // Renamed export 