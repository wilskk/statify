// components/Modals/File/export/ExportCSV.tsx
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useModal } from "@/hooks/useModal";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useToast } from "@/hooks/use-toast";
import { generateCsvContent, CsvExportOptions } from "./csvUtils"; // Import utilitas baru
import { FileText, Loader2, InfoIcon, HelpCircle } from "lucide-react";

interface ExportCSVProps {
    onClose: () => void;
}

const ExportCSV: FC<ExportCSVProps> = ({ onClose }) => {
    const { closeModal } = useModal();
    const { toast } = useToast();
    const { data } = useDataStore();
    const { variables } = useVariableStore();
    const [isExporting, startExportTransition] = useTransition(); // Gunakan useTransition untuk state pending

    const [exportOptions, setExportOptions] = useState<Omit<CsvExportOptions, 'delimiter'> & { filename: string, delimiter: string, encoding: string }>({
        filename: "statify-export",
        delimiter: ",",
        includeHeaders: true,
        includeVariableProperties: false,
        quoteStrings: true,
        encoding: "UTF-8"
    });

    const handleChange = (field: keyof typeof exportOptions, value: string | boolean) => {
        setExportOptions(prev => ({ ...prev, [field]: value }));
    };

    const handleExport = async () => {
        if (!data) { // Cek data saja, bisa jadi 0 baris tapi ada variabel
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

        startExportTransition(async () => { // Mulai transisi async
            try {
                // Siapkan opsi untuk utilitas
                const csvOptions: CsvExportOptions = {
                    delimiter: exportOptions.delimiter === '\\t' ? '\t' : exportOptions.delimiter, // Handle tab literal
                    includeHeaders: exportOptions.includeHeaders,
                    includeVariableProperties: exportOptions.includeVariableProperties,
                    quoteStrings: exportOptions.quoteStrings,
                };

                // Generate CSV content menggunakan utilitas
                const csvContent = generateCsvContent(data, variables, csvOptions);

                // Create blob and download
                const blob = new Blob([csvContent], {
                    type: `text/csv;charset=${exportOptions.encoding}`
                });

                // Create download link
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${exportOptions.filename.trim()}.csv`; // Trim filename
                document.body.appendChild(link); // Required for Firefox
                link.click();

                // Clean up
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                toast({
                    title: "Export Successful",
                    description: `Data successfully exported to ${exportOptions.filename.trim()}.csv`,
                });

                closeModal();

            } catch (error) {
                console.error("Export error:", error);
                toast({
                    title: "Export Failed",
                    description: "An error occurred during export. Please check console for details.",
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <DialogContent className="max-w-md bg-white border border-[#E6E6E6] rounded">
            <DialogHeader className="mb-6">
                <DialogTitle className="text-[22px] font-semibold">Export Data to CSV</DialogTitle>
                <DialogDescription className="text-[#444444] mt-2">
                    Configure options and download your dataset as a Comma Separated Values (CSV) file.
                </DialogDescription>
            </DialogHeader>

            <TooltipProvider delayDuration={200}>
                <div className="mb-6 space-y-5">
                    {/* File Name */}
                    <div className="space-y-2">
                        <Label htmlFor="filename" className="block text-sm font-medium">File Name</Label>
                        <Input
                            id="filename"
                            value={exportOptions.filename}
                            onChange={(e) => handleChange("filename", e.target.value)}
                            className="w-full border-gray-300 focus:border-black focus:ring-1 focus:ring-black"
                            placeholder="Enter file name (e.g., dataset_export)"
                        />
                    </div>

                    {/* Delimiter */}
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
                                <SelectItem value="\t">Tab (\t)</SelectItem>
                                <SelectItem value="|">Pipe (|)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Encoding */}
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
                                <SelectItem value="UTF-8">UTF-8 (Recommended)</SelectItem>
                                <SelectItem value="ISO-8859-1">ISO-8859-1 (Latin-1)</SelectItem>
                                <SelectItem value="windows-1252">Windows-1252</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Export Options Checkboxes */}
                    <div className="space-y-3 pt-2">
                        <Label className="block text-sm font-medium mb-1">Options</Label>

                        {/* Include Headers */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="includeHeaders"
                                checked={exportOptions.includeHeaders}
                                onCheckedChange={(checked) => handleChange("includeHeaders", Boolean(checked))}
                            />
                            <Label htmlFor="includeHeaders" className="text-sm font-normal cursor-pointer flex items-center">
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

                        {/* Include Variable Properties */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="includeVariableProperties"
                                checked={exportOptions.includeVariableProperties}
                                onCheckedChange={(checked) => handleChange("includeVariableProperties", Boolean(checked))}
                            />
                            <Label htmlFor="includeVariableProperties" className="text-sm font-normal cursor-pointer flex items-center">
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

                        {/* Quote Strings */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="quoteStrings"
                                checked={exportOptions.quoteStrings}
                                onCheckedChange={(checked) => handleChange("quoteStrings", Boolean(checked))}
                            />
                            <Label htmlFor="quoteStrings" className="text-sm font-normal cursor-pointer flex items-center">
                                Quote string values
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Always wrap text values in double quotes (&quot;&quot;). If unchecked, quotes are only added if necessary (e.g., value contains delimiter or quotes).</p>
                                    </TooltipContent>
                                </Tooltip>
                            </Label>
                        </div>
                    </div>
                </div>
            </TooltipProvider>

            {/* Info Footer */}
            <div className="flex items-center py-3 text-xs text-gray-500 border-t border-gray-200 mt-4">
                <InfoIcon size={14} className="mr-2 flex-shrink-0" />
                <span>CSV is a common format for data exchange. Ensure compatibility with the target application.</span>
            </div>

            {/* Dialog Actions */}
            <DialogFooter className="gap-3 mt-2">
                <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isExporting}
                    className="text-black bg-[#F7F7F7] hover:bg-[#E6E6E6] border-[#CCCCCC] min-w-[80px]"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleExport}
                    disabled={isExporting || !exportOptions.filename.trim()}
                    className="bg-black text-white hover:bg-[#444444] min-w-[110px]" // Wider button for loading state
                >
                    {isExporting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Exporting...</span>
                        </>
                    ) : (
                        <>
                            <FileText className="h-4 w-4 mr-2" />
                            <span>Export CSV</span>
                        </>
                    )}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default ExportCSV;