import { useState, useTransition } from "react";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useToast } from "@/hooks/use-toast";
import { generateCsvContent, CsvExportOptions } from "../utils/exportCsvUtils"; // Adjusted path
import { useModal } from "@/hooks/useModal";
import { UseExportCsvOptions } from "../types"; // Import from new types.ts

const initialState = {
    filename: "dataset_export",
    delimiter: ",",
    includeHeaders: true,
    includeVariableProperties: false,
    quoteStrings: false,
    encoding: "utf-8", 
};

export const useExportCsv = (options?: UseExportCsvOptions) => {
    const { closeModal } = useModal();
    const { toast } = useToast();
    const { data } = useDataStore();
    const { variables } = useVariableStore();
    const [isExporting, startExportTransition] = useTransition();

    const [exportOptions, setExportOptions] = useState<Omit<CsvExportOptions, 'delimiter'> & { filename: string, delimiter: string, encoding: string }>(() => ({
        filename: options?.initialFilename || "statify-export",
        delimiter: options?.initialDelimiter || ",",
        includeHeaders: options?.initialIncludeHeaders === undefined ? true : options.initialIncludeHeaders,
        includeVariableProperties: options?.initialIncludeVariableProperties === undefined ? false : options.initialIncludeVariableProperties,
        quoteStrings: options?.initialQuoteStrings === undefined ? true : options.initialQuoteStrings,
        encoding: options?.initialEncoding || "UTF-8"
    }));

    const handleChange = (field: keyof typeof exportOptions, value: string | boolean) => {
        setExportOptions(prev => ({ ...prev, [field]: value }));
    };

    const handleFilenameChange = (value: string) => {
        const sanitized = value.replace(/[\/:*?"<>|]/g, '');
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
                const csvOptions: CsvExportOptions = {
                    delimiter: exportOptions.delimiter === '\\t' ? '\t' : exportOptions.delimiter,
                    includeHeaders: exportOptions.includeHeaders,
                    includeVariableProperties: exportOptions.includeVariableProperties,
                    quoteStrings: exportOptions.quoteStrings,
                };

                const csvContent = generateCsvContent(data, variables, csvOptions);

                const blob = new Blob([csvContent], {
                    type: `text/csv;charset=${exportOptions.encoding}`
                });

                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                const finalFilename = `${exportOptions.filename.trim()}.csv`;
                link.download = finalFilename;
                document.body.appendChild(link);
                link.click();

                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                toast({
                    title: "Export Successful",
                    description: `Data successfully exported to ${finalFilename}`,
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

    return {
        exportOptions,
        isExporting,
        handleChange,
        handleFilenameChange,
        handleExport,
    };
}; 