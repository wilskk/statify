"use client";

import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, InfoIcon, HelpCircle } from "lucide-react";
import { UseExportCsvOptions, useExportCsv } from "./useExportCsv";

interface ExportCsvProps extends UseExportCsvOptions {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

const ExportCsv: FC<ExportCsvProps> = ({ 
    onClose,
    containerType,
    ...hookOptions 
}) => {
    const {
        exportOptions,
        isExporting,
        handleChange,
        handleFilenameChange,
        handleExport,
    } = useExportCsv(hookOptions);

    console.log("[ExportCsv UI] Rendering with containerType:", containerType);

    return (
        <div className="flex flex-col h-full">
            <TooltipProvider delayDuration={200}>
                <div className="mb-6 space-y-5 px-6 pt-6 flex-grow overflow-y-auto">
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

            <div className="mt-auto flex-shrink-0">
                <div className="flex items-center py-3 text-xs text-muted-foreground border-t border-border mt-4 px-6">
                    <InfoIcon size={14} className="mr-2 flex-shrink-0" />
                    <span>CSV is a common format for data exchange. Ensure compatibility with the target application.</span>
                </div>
    
                <div className={`px-6 py-4 border-t border-border mt-2 flex justify-end gap-3`}>
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
                        {isExporting ? "Exporting..." : "Export"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ExportCsv; 