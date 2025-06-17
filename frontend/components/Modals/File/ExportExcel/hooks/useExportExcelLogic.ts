import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useMetaStore } from "@/stores/useMetaStore";
import * as XLSX from 'xlsx';
import { generateExcelWorkbook } from "../utils/excelExporter";
import { ExcelUtilOptions, ExportExcelLogicState, UseExportExcelLogicProps } from "../types";
import { DEFAULT_FILENAME } from "../utils/constants";

export const useExportExcelLogic = ({ onClose }: UseExportExcelLogicProps) => {
    const { toast } = useToast();
    const { data } = useDataStore();
    const { variables } = useVariableStore();
    const { meta } = useMetaStore();
    const [isExporting, startExportTransition] = useTransition();

    const [exportOptions, setExportOptions] = useState<ExportExcelLogicState>(() => ({
        filename: meta?.name || DEFAULT_FILENAME,
        format: "xlsx",
        includeHeaders: true,
        includeVariableProperties: true,
        includeMetadataSheet: true,
        includeDataLabels: false,
        applyHeaderStyling: true
    }));

    const handleChange = (field: keyof ExportExcelLogicState, value: string | boolean) => {
        setExportOptions(prev => ({ ...prev, [field]: value }));
    };

    const handleFilenameChange = (value: string) => {
        const sanitized = value.replace(/[/\\:*?"<>|]/g, '');
        handleChange("filename", sanitized);
    };

    const handleExport = async (): Promise<void> => {
        if (!data.length || !variables.length) {
            toast({
                title: "No data to export",
                description: "There is no data available to export to Excel.",
                variant: "destructive"
            });
            return;
        }

        try {
            startExportTransition(async () => {
                // Map options to the format expected by the utility function
                const utilOptions: ExcelUtilOptions = {
                    includeHeaders: exportOptions.includeHeaders,
                    includeVariablePropertiesSheet: exportOptions.includeVariableProperties,
                    includeMetadataSheet: exportOptions.includeMetadataSheet,
                    includeDataLabels: exportOptions.includeDataLabels,
                    applyHeaderStyling: exportOptions.applyHeaderStyling
                };

                // Generate workbook from data
                const workbook = generateExcelWorkbook(data, variables, meta, utilOptions);

                // Generate safe filename
                const filename = `${exportOptions.filename || DEFAULT_FILENAME}.${exportOptions.format}`;

                // Create Excel file and trigger download
                XLSX.writeFile(workbook, filename);

                toast({
                    title: "Export Successful",
                    description: `Data successfully exported to ${filename}`,
                });

                onClose();
            });
        } catch (error) {
            console.error("Export error:", error);
            toast({
                title: "Export Failed",
                description: error instanceof Error ? error.message : "An unexpected error occurred during export.",
                variant: "destructive"
            });
        }
    };

    return {
        exportOptions,
        isExporting,
        handleChange,
        handleFilenameChange,
        handleExport
    };
}; 