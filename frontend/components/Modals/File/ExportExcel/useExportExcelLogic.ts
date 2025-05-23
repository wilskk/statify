import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useMetaStore } from "@/stores/useMetaStore";
import * as XLSX from 'xlsx';
import { generateExcelWorkbook } from "./utils/excelExporter";
import { ExcelUtilOptions, ExportExcelLogicState, UseExportExcelLogicProps } from "./ExportExcel.types";
import { DEFAULT_FILENAME } from "./ExportExcel.constants";

export const useExportExcelModalLogic = ({ onClose }: UseExportExcelLogicProps) => {
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

    const handleExport = async () => {
        if (!data || data.length === 0) {
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
                const optionsForUtil: ExcelUtilOptions = {
                    includeHeaders: exportOptions.includeHeaders,
                    includeVariablePropertiesSheet: exportOptions.includeVariableProperties,
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

                onClose();

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

    return {
        exportOptions,
        isExporting,
        handleChange,
        handleFilenameChange,
        handleExport,
    };
}; 