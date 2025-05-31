import { useState, useEffect, useCallback, useMemo } from "react";
import { useMobile } from "@/hooks/useMobile";
import { useDataStore } from "@/stores/useDataStore";
import { DataRow } from "@/types/Data";
import { useVariableStore } from "@/stores/useVariableStore";
import { useResultStore } from "@/stores/useResultStore";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { Variable } from "@/types/Variable";
import { Log } from "@/types/Result";
import { 
    UsePrintLogicProps, 
    UsePrintLogicOutput, 
    PaperSize, 
    SelectedOptions 
} from "./Print.types";
import { 
    generateAutoTableDataFromString, 
    CellDef, 
    HAlignType, 
    VAlignType 
} from "./utils/pdfTableHelpers";

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

    const handlePrint = useCallback(async (): Promise<void> => {
        if (isGenerating) return;
        setIsGenerating(true);

        try {
            const doc = new jsPDF({ format: paperSize }) as any; 
            let currentY = 10;

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

            if (selectedOptions.data && activeColumns.length > 0 && filteredData.length > 0) {
                doc.setFontSize(14);
                doc.text("Data View", 14, currentY);
                currentY += 7;
                doc.setFontSize(8);

                const dataTableColumns = activeColumns.map((colIdx) => {
                    const variable = availableVariables.find((v) => v.columnIndex === colIdx);
                    return variable?.name || `Column ${colIdx + 1}`;
                });

                const dataTableBody = filteredData.map((row) =>
                    activeColumns.map((colIdx) => row[colIdx] ?? "")
                );

                autoTable(doc, {
                    head: [dataTableColumns],
                    body: dataTableBody,
                    startY: currentY,
                    theme: "grid",
                    styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
                    headStyles: {
                        fillColor: [220, 220, 220],
                        textColor: [0, 0, 0],
                        halign: "center" as HAlignType,
                        valign: "middle" as VAlignType,
                        fontSize: 8.5,
                        fontStyle: 'bold'
                    },
                    margin: { left: 14, right: 14 },
                    tableWidth: doc.internal.pageSize.getWidth() - 28,
                    didDrawPage: (data: any) => { currentY = data.cursor.y; }
                });
                currentY = (doc as any).lastAutoTable.finalY + 10;
            }

            if (selectedOptions.variable && availableVariables.length > 0) {
                 const variablesToPrint = availableVariables.filter(v => activeColumns.includes(v.columnIndex));
                 if (variablesToPrint.length > 0) {
                    if (currentY > 260) { doc.addPage(); currentY = 10; }
                    doc.setFontSize(14);
                    doc.text("Variable View", 14, currentY);
                    currentY += 7;
                    doc.setFontSize(8);

                    const variableData = variablesToPrint.map((variable, idx) => [
                        idx + 1,
                        variable.name,
                        variable.type,
                        variable.label || "-",
                        variable.measure || "unknown",
                        variable.width || "-",
                        variable.columnIndex + 1
                    ]);

                    autoTable(doc, {
                        head: [["No", "Name", "Type", "Label", "Measure", "Width", "Column Index"]],
                        body: variableData,
                        startY: currentY,
                        theme: "grid",
                        styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
                        headStyles: {
                            fillColor: [220, 220, 220],
                            textColor: [0,0,0],
                            halign: "center" as HAlignType,
                            valign: "middle" as VAlignType,
                            fontSize: 8.5,
                            fontStyle: 'bold'
                        },
                        margin: { left: 14, right: 14 },
                        tableWidth: doc.internal.pageSize.getWidth() - 28,
                        didDrawPage: (data: any) => { currentY = data.cursor.y; }
                    });
                    currentY = (doc as any).lastAutoTable.finalY + 10;
                }
            }

            if (selectedOptions.result && logs.length > 0) {
                if (currentY > 250) { doc.addPage(); currentY = 10; }
                doc.setFontSize(14);
                doc.text("Output Viewer (Results)", 14, currentY);
                currentY += 7;

                for (const log of logs) {
                    if (currentY > 270) { doc.addPage(); currentY = 10; }
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'bold');
                    doc.text(`Analysis Log: ${log.id}`, 14, currentY);
                    doc.setFont(undefined, 'normal');
                    currentY += 5;
                    doc.setFontSize(8);
                    doc.text(log.log, 14, currentY, { maxWidth: doc.internal.pageSize.getWidth() - 28 });
                    currentY += (doc.splitTextToSize(log.log, doc.internal.pageSize.getWidth() - 28).length * 3.5) + 3;

                    if (log.analytics?.length) {
                        for (const analytic of log.analytics) {
                            if (currentY > 260) { doc.addPage(); currentY = 10; }
                            doc.setFontSize(12);
                            doc.setFont(undefined, 'bold');
                            doc.text(
                                analytic.title,
                                doc.internal.pageSize.getWidth() / 2,
                                currentY,
                                { align: "center" }
                            );
                            doc.setFont(undefined, 'normal');
                            currentY += 7;

                            if (analytic.statistics?.length) {
                                for (const stat of analytic.statistics) {
                                    const { tables } = generateAutoTableDataFromString(stat.output_data);

                                    for (const tbl of tables) {
                                        if (currentY > 250) { doc.addPage(); currentY = 10; }
                                        doc.setFontSize(10);
                                        doc.setFont(undefined, 'bold');
                                        doc.text(tbl.title, 14, currentY);
                                        doc.setFont(undefined, 'normal');
                                        currentY += 6;

                                        autoTable(doc, {
                                            head: tbl.head as CellDef[][],
                                            body: tbl.body as CellDef[][],
                                            startY: currentY,
                                            theme: "grid",
                                            styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
                                            headStyles: {
                                                fillColor: [220, 220, 220],
                                                textColor: [0,0,0],
                                                halign: "center" as HAlignType,
                                                valign: "middle" as VAlignType,
                                                fontSize: 8.5,
                                                fontStyle: 'bold'
                                            },
                                            margin: { left: 14, right: 14 },
                                            tableWidth: doc.internal.pageSize.getWidth() - 28,
                                            didDrawPage: (data: any) => { currentY = data.cursor.y; }
                                        });
                                        currentY = (doc as any).lastAutoTable.finalY + 10;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            doc.save(`${fileName.trim() || "statify_print_output"}.pdf`);
            onClose(); 
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsGenerating(false);
        }
    }, [fileName, selectedOptions, paperSize, availableData, availableVariables, logs, isGenerating, onClose]);
    
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
        handleModalClose
    };
}; 