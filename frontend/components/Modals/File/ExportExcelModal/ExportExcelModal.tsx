"use client";

import React, { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, InfoIcon } from 'lucide-react';
import { ExportExcelUIProps, ExportExcelLogicState } from './ExportExcelModal.types'; // Ensure this path is correct

const ExportExcelModal: FC<ExportExcelUIProps> = ({
    onClose,
    exportOptions,
    isExporting,
    onHandleChange, // Changed from handleChange
    onHandleFilenameChange, // Changed from handleFilenameChange
    onHandleExport, // Changed from handleExport
}) => {
    return (
        <>
            <div className="p-6 space-y-5 flex-grow overflow-y-auto">
                {/* File Name */}
                <div className="space-y-1.5">
                    <Label htmlFor="excel-filename">File Name</Label>
                    <Input
                        id="excel-filename"
                        value={exportOptions.filename}
                        onChange={(e) => onHandleFilenameChange(e.target.value)}
                        placeholder="Enter file name (e.g., excel_export)"
                        disabled={isExporting}
                    />
                </div>

                {/* Format */}
                <div className="space-y-1.5">
                    <Label htmlFor="excel-format">Format</Label>
                    <Select
                        value={exportOptions.format}
                        onValueChange={(value) => onHandleChange("format", value as ExportExcelLogicState['format'])}
                        disabled={isExporting}
                    >
                        <SelectTrigger id="excel-format">
                            <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="xlsx">Excel Workbook (*.xlsx)</SelectItem>
                            <SelectItem value="xls">Excel 97-2003 Workbook (*.xls)</SelectItem>
                            {/* Add other formats if supported by logic, e.g., CSV, TXT */}
                        </SelectContent>
                    </Select>
                </div>

                {/* Options */}
                <div className="space-y-3 pt-2">
                    <Label className="font-medium">Options</Label>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="excel-includeHeaders"
                            checked={exportOptions.includeHeaders}
                            onCheckedChange={(checked) => onHandleChange("includeHeaders", !!checked)}
                            disabled={isExporting}
                        />
                        <Label htmlFor="excel-includeHeaders" className="font-normal cursor-pointer">
                            Include variable names as header row
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="excel-includeVarProps"
                            checked={exportOptions.includeVariableProperties}
                            onCheckedChange={(checked) => onHandleChange("includeVariableProperties", !!checked)}
                            disabled={isExporting}
                        />
                        <Label htmlFor="excel-includeVarProps" className="font-normal cursor-pointer">
                            Include variable properties sheet
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="excel-includeMetaSheet"
                            checked={exportOptions.includeMetadataSheet}
                            onCheckedChange={(checked) => onHandleChange("includeMetadataSheet", !!checked)}
                            disabled={isExporting}
                        />
                        <Label htmlFor="excel-includeMetaSheet" className="font-normal cursor-pointer">
                            Include metadata sheet (if available)
                        </Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox
                            id="excel-applyHeaderStyling"
                            checked={exportOptions.applyHeaderStyling}
                            onCheckedChange={(checked) => onHandleChange("applyHeaderStyling", !!checked)}
                            disabled={isExporting}
                        />
                        <Label htmlFor="excel-applyHeaderStyling" className="font-normal cursor-pointer">
                            Apply basic header styling
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="excel-includeDataLabels"
                            checked={exportOptions.includeDataLabels}
                            onCheckedChange={(checked) => onHandleChange("includeDataLabels", !!checked)}
                            disabled={isExporting}
                        />
                        <Label htmlFor="excel-includeDataLabels" className="font-normal cursor-pointer">
                            Represent missing data with SYSMIS text (otherwise blank)
                        </Label>
                    </div>
                </div>

                {/* Info Note */}
                <div className="flex items-start text-xs text-muted-foreground pt-2">
                    <InfoIcon size={16} className="mr-2 flex-shrink-0 relative top-0.5" />
                    <span>
                        Ensure data and variable definitions are finalized before exporting.
                        Large datasets may take a moment to process.
                    </span>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t bg-muted flex justify-end gap-3 flex-shrink-0">
                <Button variant="outline" onClick={onClose} disabled={isExporting}>
                    Cancel
                </Button>
                <Button onClick={onHandleExport} disabled={isExporting}>
                    {isExporting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {isExporting ? "Exporting..." : "Export"}
                </Button>
            </div>
        </>
    );
};

export default ExportExcelModal; 