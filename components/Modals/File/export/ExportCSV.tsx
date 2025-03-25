// components/Modals/File/export/ExportCSV.tsx
"use client";

import React, { useState } from "react";
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
import { modalStyles } from "@/components/Modals/File/FileModals";

interface ExportCSVProps {
    onClose: () => void;
}

const ExportCSV: React.FC<ExportCSVProps> = ({ onClose }) => {
    const { closeModal } = useModal();
    const { data } = useDataStore();
    const { variables } = useVariableStore();

    const [exportOptions, setExportOptions] = useState({
        filename: "statify-export.csv",
        delimiter: ",",
        includeHeaders: true,
        encoding: "UTF-8"
    });

    const handleChange = (field: string, value: string | boolean) => {
        setExportOptions(prev => ({ ...prev, [field]: value }));
    };

    const handleExport = () => {
        try {
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

            // Add data rows
            data.forEach(row => {
                csvContent += row.join(exportOptions.delimiter) + "\n";
            });

            // Create blob and download
            const blob = new Blob([csvContent], {
                type: `text/csv;charset=${exportOptions.encoding}`
            });

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = exportOptions.filename;
            link.click();

            // Clean up
            URL.revokeObjectURL(url);

            // Close modal
            closeModal();
        } catch (error) {
            console.error("Export error:", error);
        }
    };

    return (
        <DialogContent className={`sm:max-w-[480px] ${modalStyles.dialogContent}`}>
            <DialogHeader className={modalStyles.dialogHeader}>
                <DialogTitle className={modalStyles.dialogTitle}>Export CSV</DialogTitle>
                <DialogDescription className={modalStyles.dialogDescription}>
                    Configure and download your data as a CSV file.
                </DialogDescription>
            </DialogHeader>

            <div className={modalStyles.dialogBody}>
                <div className={modalStyles.formGroup}>
                    <Label htmlFor="filename" className={modalStyles.label}>Filename</Label>
                    <Input
                        id="filename"
                        value={exportOptions.filename}
                        onChange={(e) => handleChange("filename", e.target.value)}
                        className={modalStyles.input}
                    />
                </div>

                <div className={modalStyles.formGroup}>
                    <Label htmlFor="delimiter" className={modalStyles.label}>Delimiter</Label>
                    <Select
                        value={exportOptions.delimiter}
                        onValueChange={(value) => handleChange("delimiter", value)}
                    >
                        <SelectTrigger id="delimiter" className={modalStyles.input}>
                            <SelectValue placeholder="Select delimiter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=",">Comma (,)</SelectItem>
                            <SelectItem value=";">Semicolon (;)</SelectItem>
                            <SelectItem value="\t">Tab</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className={modalStyles.formGroup}>
                    <Label htmlFor="encoding" className={modalStyles.label}>Encoding</Label>
                    <Select
                        value={exportOptions.encoding}
                        onValueChange={(value) => handleChange("encoding", value)}
                    >
                        <SelectTrigger id="encoding" className={modalStyles.input}>
                            <SelectValue placeholder="Select encoding" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="UTF-8">UTF-8</SelectItem>
                            <SelectItem value="ISO-8859-1">ISO-8859-1</SelectItem>
                            <SelectItem value="windows-1252">Windows-1252</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="includeHeaders"
                        checked={exportOptions.includeHeaders}
                        onCheckedChange={(checked) =>
                            handleChange("includeHeaders", Boolean(checked))
                        }
                    />
                    <Label
                        htmlFor="includeHeaders"
                        className="text-sm font-normal text-black"
                    >
                        Include column headers
                    </Label>
                </div>
            </div>

            <DialogFooter className={modalStyles.dialogFooter}>
                <Button
                    variant="outline"
                    onClick={onClose}
                    className={modalStyles.secondaryButton}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleExport}
                    className={modalStyles.primaryButton}
                >
                    Export
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default ExportCSV;