// components/Modals/File/export/ExportExcel.tsx
"use client";

import React, { FC, useState, useTransition } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useModal } from "@/hooks/useModal";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useMetaStore } from "@/stores/useMetaStore";
import * as XLSX from 'xlsx';
import { generateExcelWorkbook, ExcelExportOptions } from "./excelUtils";
import { Loader2, FileSpreadsheet, InfoIcon, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface ExportExcelProps {
    onClose: () => void;
}

type ComponentState = Omit<ExcelExportOptions, 'includeVariablePropertiesSheet'> & {
    filename: string;
    format: "xlsx" | "xls" | "csv" | "ods";
    includeVariableProperties: boolean; // Renamed for UI clarity
};

const ExportExcel: FC<ExportExcelProps> = ({ onClose }) => {
    const { toast } = useToast();
    const { closeModal } = useModal();
    const { data } = useDataStore();
    const { variables } = useVariableStore();
    const { meta } = useMetaStore();
    const [isExporting, startExportTransition] = useTransition();

    const [exportOptions, setExportOptions] = useState<ComponentState>({
        filename: meta?.name || "statify-export",
        format: "xlsx",
        includeHeaders: true,
        includeVariableProperties: true, // Default based on previous code structure
        includeMetadataSheet: true,
        includeDataLabels: false,
        applyHeaderStyling: true
    });

    const handleChange = (field: keyof ComponentState, value: string | boolean) => {
        setExportOptions(prev => ({ ...prev, [field]: value }));
    };

    const handleFilenameChange = (value: string) => {
        const sanitized = value.replace(/[\\/:*?"<>|]/g, '');
        handleChange("filename", sanitized);
    };

    const handleExport = async () => {
        if (!data) {
            toast({
                title: "Export Failed",
                description: "No data available to export.",
                variant: "destructive",
            });
            return;
        }
        if (!exportOptions.filename.trim()) {
            toast({
                title: "Export Failed",
                description: "Please enter a valid file name.",
                variant: "destructive",
            });
            return;
        }

        startExportTransition(async () => {
            try {
                const optionsForUtil: ExcelExportOptions = {
                    includeHeaders: exportOptions.includeHeaders,
                    includeVariablePropertiesSheet: exportOptions.includeVariableProperties, // Map UI name to util name
                    includeMetadataSheet: exportOptions.includeMetadataSheet,
                    includeDataLabels: exportOptions.includeDataLabels,
                    applyHeaderStyling: exportOptions.applyHeaderStyling,
                };

                const wb = generateExcelWorkbook(data, variables, meta, optionsForUtil);

                const safeFileName = exportOptions.filename.trim();
                const fileExtension = exportOptions.format;
                const fullFileName = `${safeFileName}.${fileExtension}`;

                XLSX.writeFile(wb, fullFileName, { bookType: fileExtension as XLSX.BookType });

                toast({
                    title: "Export Successful",
                    description: `Data successfully exported to ${fullFileName}`,
                });

                closeModal();

            } catch (error) {
                console.error("Export error:", error);
                let description = "An error occurred during export. Please try again.";
                if (error instanceof Error) {
                    description = `Export failed: ${error.message}`;
                }
                toast({
                    title: "Export Failed",
                    description: description,
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <DialogContent className="max-w-md bg-popover border-border rounded">
            <DialogHeader className="mb-6">
                <DialogTitle className="text-[22px] font-semibold text-popover-foreground">Export Data to Excel/Other</DialogTitle>
                <DialogDescription className="text-muted-foreground mt-2">
                    Configure options and download your dataset.
                </DialogDescription>
            </DialogHeader>

            <TooltipProvider delayDuration={200}>
                <div className="mb-6 space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="filename" className="block text-sm font-medium text-popover-foreground">File Name</Label>
                        <Input
                            id="filename"
                            value={exportOptions.filename}
                            onChange={(e) => handleFilenameChange(e.target.value)}
                            className="w-full"
                            placeholder="Enter file name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="format" className="block text-sm font-medium text-popover-foreground">Format</Label>
                        <Select
                            value={exportOptions.format}
                            onValueChange={(value) => handleChange("format", value as ComponentState['format'])}
                        >
                            <SelectTrigger id="format" className="w-full">
                                <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                                <SelectItem value="xls">Excel 97-2003 (.xls)</SelectItem>
                                <SelectItem value="csv">CSV (.csv) - Use Export CSV for more options</SelectItem>
                                <SelectItem value="ods">OpenDocument Spreadsheet (.ods)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3 pt-2">
                        <Label className="block text-sm font-medium mb-1 text-popover-foreground">Options (for Excel/ODS)</Label>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="includeHeaders"
                                checked={exportOptions.includeHeaders}
                                onCheckedChange={(checked) => handleChange("includeHeaders", Boolean(checked))}
                            />
                            <Label htmlFor="includeHeaders" className="text-sm font-normal cursor-pointer flex items-center text-popover-foreground">
                                Include variable names as headers
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Adds variable names as the first row in the &apos;Data&apos; sheet.</p>
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
                                Include &apos;Variable Definitions&apos; sheet
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p>Adds a separate sheet detailing variable properties (type, label, measure, etc.).</p>
                                    </TooltipContent>
                                </Tooltip>
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="includeDataLabels"
                                checked={exportOptions.includeDataLabels}
                                onCheckedChange={(checked) => handleChange("includeDataLabels", Boolean(checked))}
                            />
                            <Label htmlFor="includeDataLabels" className="text-sm font-normal cursor-pointer flex items-center text-popover-foreground">
                                Apply value labels to data
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p>Replaces raw values with their defined labels (e.g., 1 becomes &apos;Yes&apos;) in the &apos;Data&apos; sheet. Affects data cells only.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="includeMetadataSheet"
                                checked={exportOptions.includeMetadataSheet}
                                onCheckedChange={(checked) => handleChange("includeMetadataSheet", Boolean(checked))}
                            />
                            <Label htmlFor="includeMetadataSheet" className="text-sm font-normal cursor-pointer flex items-center text-popover-foreground">
                                Include &apos;Metadata&apos; sheet
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p>Adds a separate sheet with project metadata (name, creation date, etc.).</p>
                                    </TooltipContent>
                                </Tooltip>
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="applyHeaderStyling"
                                checked={exportOptions.applyHeaderStyling}
                                onCheckedChange={(checked) => handleChange("applyHeaderStyling", Boolean(checked))}
                            />
                            <Label htmlFor="applyHeaderStyling" className="text-sm font-normal cursor-pointer flex items-center text-popover-foreground">
                                Apply basic header styling
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p>Applies bold font and a light background fill to header rows in the sheets.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </Label>
                        </div>
                    </div>
                </div>
            </TooltipProvider>

            <div className="flex items-center py-3 text-xs text-muted-foreground border-t border-border mt-4">
                <InfoIcon size={14} className="mr-2 flex-shrink-0" />
                <span>Select the appropriate format for your needs. XLSX is recommended for modern Excel.</span>
            </div>

            <DialogFooter className="gap-3 mt-2">
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
            </DialogFooter>
        </DialogContent>
    );
};

export default ExportExcel;