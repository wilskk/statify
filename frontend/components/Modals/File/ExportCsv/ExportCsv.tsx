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
            <div className="p-6 space-y-5 flex-grow overflow-y-auto">
                {/* File Name */}
                <div className="space-y-1.5">
                    <Label htmlFor="csv-filename">File Name</Label>
                    <Input
                        id="csv-filename"
                        value={exportOptions.filename}
                        onChange={(e) => handleFilenameChange(e.target.value)}
                        placeholder="Enter file name (e.g., dataset_export)"
                        disabled={isExporting}
                    />
                </div>

                {/* Delimiter */}
                <div className="space-y-1.5">
                    <Label htmlFor="csv-delimiter">Delimiter</Label>
                    <Select
                        value={exportOptions.delimiter}
                        onValueChange={(value) => handleChange("delimiter", value)}
                        disabled={isExporting}
                    >
                        <SelectTrigger id="csv-delimiter">
                            <SelectValue placeholder="Select delimiter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=",">Comma (,)</SelectItem>
                            <SelectItem value=";">Semicolon (;)</SelectItem>
                            <SelectItem value="|">Pipe (|)</SelectItem>
                            <SelectItem value="\\t">Tab</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Include Headers */}
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="csv-includeHeaders"
                        checked={exportOptions.includeHeaders}
                        onCheckedChange={(checked) => handleChange("includeHeaders", !!checked)}
                        disabled={isExporting}
                    />
                    <Label htmlFor="csv-includeHeaders">Include variable names as header row</Label>
                </div>

                {/* Include Variable Properties */}
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="csv-includeVarProps"
                        checked={exportOptions.includeVariableProperties}
                        onCheckedChange={(checked) => handleChange("includeVariableProperties", !!checked)}
                        disabled={isExporting}
                    />
                    <Label htmlFor="csv-includeVarProps">Include variable properties as first row</Label>
                </div>

                {/* Quote Strings */}
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="csv-quoteStrings"
                        checked={exportOptions.quoteStrings}
                        onCheckedChange={(checked) => handleChange("quoteStrings", !!checked)}
                        disabled={isExporting}
                    />
                    <Label htmlFor="csv-quoteStrings">Quote all string values</Label>
                </div>

                {/* Encoding */}
                <div className="space-y-1.5">
                    <Label htmlFor="csv-encoding">Encoding</Label>
                    <Select
                        value={exportOptions.encoding}
                        onValueChange={(value) => handleChange("encoding", value)}
                        disabled={isExporting}
                    >
                        <SelectTrigger id="csv-encoding">
                            <SelectValue placeholder="Select encoding" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="utf-8">UTF-8</SelectItem>
                            <SelectItem value="utf-16le">UTF-16 LE</SelectItem>
                            <SelectItem value="windows-1252">Windows-1252</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0 flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={onClose} disabled={isExporting}>
                    Close
                </Button>
                <Button variant="default" onClick={handleExport} disabled={isExporting}>
                    {isExporting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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

export default ExportCsv;