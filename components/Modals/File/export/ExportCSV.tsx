// components/Modals/File/export/ExportCSV.tsx
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useModal } from "@/hooks/useModal";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, InfoIcon } from "lucide-react";

interface ExportCSVProps {
    onClose: () => void;
}

const ExportCSV: FC<ExportCSVProps> = ({ onClose }) => {
    const { closeModal } = useModal();
    const { toast } = useToast();
    const { data } = useDataStore();
    const { variables } = useVariableStore();

    const [exportOptions, setExportOptions] = useState({
        filename: "statify-export",
        delimiter: ",",
        includeHeaders: true,
        includeVariableProperties: false,
        quoteStrings: true,
        encoding: "UTF-8"
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

            // Prepare headers if needed
            const headers = exportOptions.includeHeaders
                ? variables.map(v => v.name)
                : [];

            // Prepare CSV content
            let csvContent = "";

            // Add headers if requested
            if (exportOptions.includeHeaders && headers.length > 0) {
                csvContent += headers.join(exportOptions.delimiter) + "\n";
            }

            // Add variable properties if requested
            if (exportOptions.includeVariableProperties && variables?.length) {
                csvContent += variables.map(v => v.type).join(exportOptions.delimiter) + "\n";
            }

            // Add data rows
            data.forEach(row => {
                const formattedRow = row.map(cell => {
                    // If quoting strings is enabled and the cell is a string, wrap in quotes
                    if (exportOptions.quoteStrings && typeof cell === 'string') {
                        return `"${cell.replace(/"/g, '""')}"`;
                    }
                    return cell;
                });
                csvContent += formattedRow.join(exportOptions.delimiter) + "\n";
            });

            // Create blob and download
            const blob = new Blob([csvContent], {
                type: `text/csv;charset=${exportOptions.encoding}`
            });

            // Small delay to show loading state
            setTimeout(() => {
                // Create download link
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${exportOptions.filename}.csv`;
                link.click();

                // Clean up
                URL.revokeObjectURL(url);

                toast({
                    title: "Export Successful",
                    description: `Data successfully exported to ${exportOptions.filename}.csv`,
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
                <DialogTitle className="text-[22px] font-semibold">Export CSV</DialogTitle>
                <DialogDescription className="text-[#444444] mt-2">
                    Configure and download your data as a CSV file.
                </DialogDescription>
            </DialogHeader>

            <div className="mb-6 space-y-5">
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

                <div className="space-y-2">
                    <Label htmlFor="delimiter" className="block text-sm font-medium">Delimiter</Label>
                    <Select
                        value={exportOptions.delimiter}
                        onValueChange={(value) => handleChange("delimiter", value)}
                    >
                        <SelectTrigger id="delimiter" className="w-full border-gray-300 focus:border-black focus:ring-1 focus:ring-black">
                            <SelectValue placeholder="Select delimiter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=",">Comma (,)</SelectItem>
                            <SelectItem value=";">Semicolon (;)</SelectItem>
                            <SelectItem value="\t">Tab</SelectItem>
                            <SelectItem value="|">Pipe (|)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="encoding" className="block text-sm font-medium">Encoding</Label>
                    <Select
                        value={exportOptions.encoding}
                        onValueChange={(value) => handleChange("encoding", value)}
                    >
                        <SelectTrigger id="encoding" className="w-full border-gray-300 focus:border-black focus:ring-1 focus:ring-black">
                            <SelectValue placeholder="Select encoding" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="UTF-8">UTF-8</SelectItem>
                            <SelectItem value="ISO-8859-1">ISO-8859-1</SelectItem>
                            <SelectItem value="windows-1252">Windows-1252</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

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
                            id="quoteStrings"
                            checked={exportOptions.quoteStrings}
                            onCheckedChange={(checked) => handleChange("quoteStrings", Boolean(checked))}
                        />
                        <Label htmlFor="quoteStrings" className="text-sm font-normal cursor-pointer">
                            Quote string values
                        </Label>
                    </div>
                </div>
            </div>

            <div className="flex items-center py-3 text-xs text-gray-500">
                <InfoIcon size={14} className="mr-2 flex-shrink-0" />
                <span>CSV files are commonly used for data exchange between applications</span>
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
                            <FileText className="h-4 w-4 mr-2" />
                            <span>Export</span>
                        </>
                    )}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default ExportCSV;