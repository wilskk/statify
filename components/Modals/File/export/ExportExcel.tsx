// components/Modals/File/ExportExcel.tsx
"use client";

import React, { FC, useState } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useMetaStore } from "@/stores/useMetaStore";
import * as XLSX from 'xlsx';
import { Loader2, FileSpreadsheet } from "lucide-react";

interface ExportExcelProps {
    onClose: () => void;
}

const ExportExcel: FC<ExportExcelProps> = ({ onClose }) => {
    const { toast } = useToast();
    const { data } = useDataStore();
    const { variables } = useVariableStore();
    const { meta } = useMetaStore();

    // Fix: Ensure fileName is always a string by providing a default value
    const [fileName, setFileName] = useState<string>(meta?.name || "StatifyExport");
    const [exportFormat, setExportFormat] = useState("xlsx");
    const [includeHeaders, setIncludeHeaders] = useState(true);
    const [includeVariableProperties, setIncludeVariableProperties] = useState(false);
    const [includeDataLabels, setIncludeDataLabels] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

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
            if (includeHeaders && variables?.length) {
                exportData.push(variables.map(v => v.name));
            }

            // Add variable properties if requested
            if (includeVariableProperties && variables?.length) {
                exportData.push(variables.map(v => v.type));
                // Could add more rows for other properties like measure, width, etc.
            }

            // Add actual data
            exportData.push(...data);

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(exportData);

            // Apply some styling to headers
            if (includeHeaders && variables?.length) {
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

            // Add metadata sheet if needed
            if (meta && Object.keys(meta).length > 0) {
                const metaData = Object.entries(meta).map(([key, value]) => [key, value]);
                const metaWs = XLSX.utils.aoa_to_sheet([
                    ["Metadata Property", "Value"],
                    ...metaData
                ]);
                XLSX.utils.book_append_sheet(wb, metaWs, "Metadata");
            }

            // Generate file name with fallback to ensure it's always a string
            const safeFileName = fileName.trim() || "StatifyExport";

            // Generate file and trigger download
            setTimeout(() => {
                XLSX.writeFile(wb, `${safeFileName}.${exportFormat}`);

                toast({
                    title: "Export Successful",
                    description: `Data successfully exported to ${safeFileName}.${exportFormat}`,
                });

                setIsExporting(false);
                onClose();
            }, 600); // Small delay to show loading state

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
        <DialogContent className="sm:max-w-[480px] p-0 bg-white">
            <DialogHeader className="px-6 py-5 bg-[#F7F7F7] border-b border-[#E6E6E6]">
                <DialogTitle className="text-lg font-semibold text-black">Export to Excel</DialogTitle>
            </DialogHeader>

            <div className="px-6 py-6 space-y-6">
                {/* File Name */}
                <div className="space-y-2">
                    <Label htmlFor="fileName" className="text-sm font-medium text-[#444444]">File Name</Label>
                    <Input
                        id="fileName"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        className="h-10 border-[#CCCCCC] focus:border-black focus:ring-0"
                        placeholder="Enter file name"
                    />
                </div>

                {/* Export Format */}
                <div className="space-y-2">
                    <Label htmlFor="exportFormat" className="text-sm font-medium text-[#444444]">Format</Label>
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                        <SelectTrigger className="h-10 border-[#CCCCCC] focus:ring-0 focus:border-black">
                            <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                            <SelectItem value="xls">Excel 97-2003 (.xls)</SelectItem>
                            <SelectItem value="csv">CSV (.csv)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Export Options */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-[#444444]">Export Options</h3>

                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="includeHeaders"
                            checked={includeHeaders}
                            onCheckedChange={(checked) => setIncludeHeaders(checked as boolean)}
                            className="mt-0.5 border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                        />
                        <div className="space-y-1">
                            <Label htmlFor="includeHeaders" className="text-sm text-black">Include variable names as headers</Label>
                            <p className="text-xs text-[#888888]">Variable names will appear as column headers</p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="includeVariableProperties"
                            checked={includeVariableProperties}
                            onCheckedChange={(checked) => setIncludeVariableProperties(checked as boolean)}
                            className="mt-0.5 border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                        />
                        <div className="space-y-1">
                            <Label htmlFor="includeVariableProperties" className="text-sm text-black">Include variable properties</Label>
                            <p className="text-xs text-[#888888]">Data type and other metadata will be included</p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="includeDataLabels"
                            checked={includeDataLabels}
                            onCheckedChange={(checked) => setIncludeDataLabels(checked as boolean)}
                            className="mt-0.5 border-[#CCCCCC] data-[state=checked]:bg-black data-[state=checked]:border-black"
                        />
                        <div className="space-y-1">
                            <Label htmlFor="includeDataLabels" className="text-sm text-black">Include value labels</Label>
                            <p className="text-xs text-[#888888]">Export value labels instead of raw codes</p>
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter className="px-6 py-4 bg-[#F7F7F7] border-t border-[#E6E6E6] flex-row-reverse sm:space-x-0 sm:space-x-reverse">
                <Button
                    onClick={handleExport}
                    disabled={isExporting || !fileName.trim()}
                    className="h-8 px-4 text-sm bg-black text-white hover:bg-black/90 focus:ring-2 focus:ring-black focus:ring-offset-2"
                >
                    {isExporting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span>Exporting...</span>
                        </>
                    ) : (
                        <>
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            <span>Export</span>
                        </>
                    )}
                </Button>
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="h-8 px-4 mr-2 text-sm border border-[#CCCCCC] text-black hover:bg-[#F7F7F7]"
                >
                    Cancel
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default ExportExcel;