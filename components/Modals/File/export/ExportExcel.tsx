// components/Modals/File/export/ExportExcel.tsx
"use client";

import React, { FC, useState } from "react";
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
import { Loader2, FileSpreadsheet, InfoIcon } from "lucide-react";

interface ExportExcelProps {
    onClose: () => void;
}

const ExportExcel: FC<ExportExcelProps> = ({ onClose }) => {
    const { toast } = useToast();
    const { closeModal } = useModal();
    const { data } = useDataStore();
    const { variables } = useVariableStore();
    const { meta } = useMetaStore();

    const [exportOptions, setExportOptions] = useState({
        filename: meta?.name || "statify-export",
        format: "xlsx",
        includeHeaders: true,
        includeVariableProperties: false,
        includeMetadata: true,
        includeDataLabels: false,
        applyHeaderStyling: true
    });
    const [isExporting, setIsExporting] = useState(false);

    const handleChange = (field: string, value: string | boolean) => {
        setExportOptions(prev => ({ ...prev, [field]: value }));
    };

    const handleExport = async () => {
        if (!data || data.length === 0) {
            toast({
                title: "Export Failed",
                description: "No data available to export.",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsExporting(true);

            // Prepare data for export
            const exportData = [];

            // Add headers if requested
            if (exportOptions.includeHeaders && variables?.length) {
                exportData.push(variables.map(v => v.name));
            }

            // Add variable properties if requested
            if (exportOptions.includeVariableProperties && variables?.length) {
                exportData.push(variables.map(v => v.type));
                // Could add more rows for other properties like measure, width, etc.
            }

            // Add actual data
            exportData.push(...data);

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(exportData);

            // Apply styling to headers if requested
            if (exportOptions.applyHeaderStyling && exportOptions.includeHeaders && variables?.length) {
                const headerRange = XLSX.utils.decode_range(ws['!ref'] || "");
                for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
                    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
                    if (!ws[cellRef]) continue;

                    ws[cellRef].s = {
                        font: { bold: true },
                        fill: { fgColor: { rgb: "F7F7F7" } }
                    };
                }
            }

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, "Data");

            // Add metadata sheet if requested
            if (exportOptions.includeMetadata && meta && Object.keys(meta).length > 0) {
                const metaData = Object.entries(meta).map(([key, value]) => [key, value]);
                const metaWs = XLSX.utils.aoa_to_sheet([
                    ["Metadata Property", "Value"],
                    ...metaData
                ]);

                // Apply styling to metadata header
                if (exportOptions.applyHeaderStyling) {
                    const headerRange = XLSX.utils.decode_range(metaWs['!ref'] || "");
                    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
                        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
                        if (!metaWs[cellRef]) continue;

                        metaWs[cellRef].s = {
                            font: { bold: true },
                            fill: { fgColor: { rgb: "F7F7F7" } }
                        };
                    }
                }

                XLSX.utils.book_append_sheet(wb, metaWs, "Metadata");
            }

            // Generate file name with fallback
            const safeFileName = exportOptions.filename.trim() || "statify-export";

            // Generate file and trigger download with a small delay to show loading state
            setTimeout(() => {
                XLSX.writeFile(wb, `${safeFileName}.${exportOptions.format}`);

                toast({
                    title: "Export Successful",
                    description: `Data successfully exported to ${safeFileName}.${exportOptions.format}`,
                });

                setIsExporting(false);
                closeModal();
            }, 600);

        } catch (error) {
            console.error("Export error:", error);
            toast({
                title: "Export Failed",
                description: "An error occurred during export. Please try again.",
                variant: "destructive",
            });
            setIsExporting(false);
        }
    };

    return (
        <DialogContent className="max-w-md bg-white border border-[#E6E6E6] rounded">
            <DialogHeader className="mb-6">
                <DialogTitle className="text-[22px] font-semibold">Export to Excel</DialogTitle>
                <DialogDescription className="text-[#444444] mt-2">
                    Configure and download your data as an Excel file.
                </DialogDescription>
            </DialogHeader>

            <div className="mb-6 space-y-5">
                {/* File Name */}
                <div className="space-y-2">
                    <Label htmlFor="filename" className="block text-sm font-medium">File Name</Label>
                    <Input
                        id="filename"
                        value={exportOptions.filename}
                        onChange={(e) => handleChange("filename", e.target.value)}
                        className="w-full border-gray-300 focus:border-black focus:ring-1 focus:ring-black"
                        placeholder="Enter file name"
                    />
                </div>

                {/* Export Format */}
                <div className="space-y-2">
                    <Label htmlFor="format" className="block text-sm font-medium">Format</Label>
                    <Select
                        value={exportOptions.format}
                        onValueChange={(value) => handleChange("format", value)}
                    >
                        <SelectTrigger id="format" className="w-full border-gray-300 focus:border-black focus:ring-1 focus:ring-black">
                            <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                            <SelectItem value="xls">Excel 97-2003 (.xls)</SelectItem>
                            <SelectItem value="csv">CSV (.csv)</SelectItem>
                            <SelectItem value="ods">OpenDocument (.ods)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Export Options */}
                <div className="space-y-3">
                    <Label className="block text-sm font-medium">Export Options</Label>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="includeHeaders"
                            checked={exportOptions.includeHeaders}
                            onCheckedChange={(checked) => handleChange("includeHeaders", Boolean(checked))}
                        />
                        <Label htmlFor="includeHeaders" className="text-sm font-normal cursor-pointer">
                            Include variable names as headers
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="includeVariableProperties"
                            checked={exportOptions.includeVariableProperties}
                            onCheckedChange={(checked) => handleChange("includeVariableProperties", Boolean(checked))}
                        />
                        <Label htmlFor="includeVariableProperties" className="text-sm font-normal cursor-pointer">
                            Include variable properties
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="includeDataLabels"
                            checked={exportOptions.includeDataLabels}
                            onCheckedChange={(checked) => handleChange("includeDataLabels", Boolean(checked))}
                        />
                        <Label htmlFor="includeDataLabels" className="text-sm font-normal cursor-pointer">
                            Include value labels
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="includeMetadata"
                            checked={exportOptions.includeMetadata}
                            onCheckedChange={(checked) => handleChange("includeMetadata", Boolean(checked))}
                        />
                        <Label htmlFor="includeMetadata" className="text-sm font-normal cursor-pointer">
                            Include metadata sheet
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="applyHeaderStyling"
                            checked={exportOptions.applyHeaderStyling}
                            onCheckedChange={(checked) => handleChange("applyHeaderStyling", Boolean(checked))}
                        />
                        <Label htmlFor="applyHeaderStyling" className="text-sm font-normal cursor-pointer">
                            Apply header styling
                        </Label>
                    </div>
                </div>
            </div>

            <div className="flex items-center py-3 text-xs text-gray-500">
                <InfoIcon size={14} className="mr-2 flex-shrink-0" />
                <span>Excel files support multiple sheets and formatting options</span>
            </div>

            <DialogFooter className="gap-3">
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="text-black bg-[#F7F7F7] hover:bg-[#E6E6E6] border-[#CCCCCC] min-w-[80px]"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleExport}
                    disabled={isExporting || !exportOptions.filename.trim()}
                    className="bg-black text-white hover:bg-[#444444] min-w-[80px]"
                >
                    {isExporting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Exporting...</span>
                        </>
                    ) : (
                        <>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            <span>Export</span>
                        </>
                    )}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default ExportExcel;