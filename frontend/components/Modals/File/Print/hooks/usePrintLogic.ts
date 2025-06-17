import { useState, useEffect, useCallback, useMemo } from "react";
import { useMobile } from "@/hooks/useMobile";
import { useDataStore } from "@/stores/useDataStore";
import { DataRow } from "@/types/Data";
import { useVariableStore } from "@/stores/useVariableStore";
import { useResultStore } from "@/stores/useResultStore";
import { jsPDF } from "jspdf";
// autoTable is not directly used here anymore, but jsPDF instance is extended by it.
// import { autoTable } from "jspdf-autotable"; 
import { Variable } from "@/types/Variable";
import { Log } from "@/types/Result";
import {
    UsePrintLogicProps,
    UsePrintLogicOutput,
    PaperSize,
    SelectedOptions
} from "../types"; // sebelumnya "../types/types"
import { generateAutoTableDataFromString } from "../utils"; // Only this is needed from main utils
import {
    addDataGridView,
    addVariableView,
    addResultsView
} from "../services/pdfPrintService"; // Updated import path to services

export const usePrintLogic = ({
    onClose,
}: UsePrintLogicProps): UsePrintLogicOutput => {
    const [fileName, setFileName] = useState<string>("");
    const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
        data: true,
        variable: true,
        result: true,
    });
    const [paperSize, setPaperSize] = useState<PaperSize>("a4");
    const [isGenerating, setIsGenerating] = useState(false);

    const { isMobile, isPortrait } = useMobile();

    const dataStore = useDataStore();
    const variableStore = useVariableStore();
    const resultStore = useResultStore();
    
    const availableData: DataRow[] = useMemo(() => dataStore.data || [], [dataStore.data]);
    const availableVariables: Variable[] = useMemo(() => variableStore.variables || [], [variableStore.variables]);
    const logs: Log[] = useMemo(() => resultStore.logs || [], [resultStore.logs]);

    const resetOptions = useCallback(() => {
        setFileName("");
        setSelectedOptions({
            data: true,
            variable: true,
            result: true,
        });
        setPaperSize("a4");
    }, []);

    const handlePrint = useCallback(async (): Promise<void> => {
        if (isGenerating) return;
        setIsGenerating(true);

        try {
            const doc = new jsPDF({ format: paperSize }) as any; 
            let currentY = 10;

            // Determine active columns and filtered data once
            const namedVariables = availableVariables.filter(
                (v: Variable) => String(v.name || "").trim() !== ""
            );
            const activeColumns = namedVariables
                .filter((v: Variable) =>
                    availableData.some((row: DataRow) =>
                        String(row[v.columnIndex] ?? "").trim() !== ""
                    )
                )
                .map((v: Variable) => v.columnIndex)
                .sort((a: number, b: number) => a - b);

            const filteredData = availableData.filter((row: DataRow) =>
                activeColumns.some((col) =>
                    String(row[col] ?? "").trim() !== ""
                )
            );

            if (selectedOptions.data) {
                currentY = addDataGridView(doc, currentY, filteredData, availableVariables, activeColumns);
            }

            if (selectedOptions.variable) {
                currentY = addVariableView(doc, currentY, availableVariables, activeColumns);
            }

            if (selectedOptions.result) {
                currentY = addResultsView(doc, currentY, logs, generateAutoTableDataFromString);
            }

            // Ensure at least one section was added before saving, or save a blank PDF if that's desired.
            // For now, it saves even if empty.
            doc.save(`${fileName.trim() || "statify_print_output"}.pdf`);
            onClose(); 
        } catch (error) {
            console.error("Error generating PDF:", error);
            // Optionally, display a user-facing error message here
        } finally {
            setIsGenerating(false);
        }
    }, [
        fileName, 
        selectedOptions, 
        paperSize, 
        availableData, 
        availableVariables, 
        logs, 
        isGenerating, 
        onClose
        // generateAutoTableDataFromString is stable, no need to list as dependency if imported correctly
    ]);
    
    const handleModalClose = useCallback(() => {
        onClose();
    }, [onClose]);

    return {
        fileName,
        setFileName,
        selectedOptions,
        setSelectedOptions,
        paperSize,
        setPaperSize,
        isGenerating,
        isMobile,
        isPortrait,
        handlePrint,
        handleModalClose,
        resetOptions
    };
};