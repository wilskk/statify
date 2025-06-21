import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { DataRow } from "@/types/Data";
import { Variable } from "@/types/Variable";
import { Log } from "@/types/Result";
// Path to utils is one level up from services directory
import { CellDef, HAlignType, VAlignType, generateAutoTableDataFromString } from "../print.utils"; 

const PAGE_MARGIN = 14;
const PAGE_TOP_MARGIN = 10;
const SECTION_TITLE_FONT_SIZE = 14;
const TABLE_HEADER_FONT_SIZE = 8.5;
const TABLE_BODY_FONT_SIZE = 8;
const TEXT_FONT_SIZE = 8;
const LOG_ID_FONT_SIZE = 10;
const ANALYTIC_TITLE_FONT_SIZE = 12;
const SPACE_AFTER_TITLE = 7;
const SPACE_AFTER_SECTION = 10;
const SPACE_AFTER_TABLE = 10;
const SPACE_AFTER_LOG_TEXT = 3;

// Y-coordinate thresholds for page breaks, allowing for some content height
const Y_THRESHOLD_GENERAL = 250; 
const Y_THRESHOLD_RESULTS_LOG_TEXT = 280;
const Y_THRESHOLD_RESULTS_ANALYTIC_TITLE = 260;
const Y_THRESHOLD_RESULTS_TABLE_TITLE = 250;
const Y_THRESHOLD_RESULTS_LOG_ID = 270;

export function addDataGridView(
    doc: jsPDF,
    currentY: number,
    data: DataRow[],
    variables: Variable[],
    activeColumns: number[]
): number {
    let newY = currentY;
    if (activeColumns.length === 0 || data.length === 0) {
        return newY;
    }

    if (newY > Y_THRESHOLD_GENERAL) { 
        doc.addPage();
        newY = PAGE_TOP_MARGIN;
    }

    doc.setFontSize(SECTION_TITLE_FONT_SIZE);
    doc.text("Data View", PAGE_MARGIN, newY);
    newY += SPACE_AFTER_TITLE;
    doc.setFontSize(TEXT_FONT_SIZE);

    const dataTableColumns = activeColumns.map((colIdx) => {
        const variable = variables.find((v) => v.columnIndex === colIdx);
        return variable?.name || `Column ${colIdx + 1}`;
    });

    const dataTableBody = data.map((row) =>
        activeColumns.map((colIdx) => row[colIdx] ?? "")
    );

    autoTable(doc, {
        head: [dataTableColumns],
        body: dataTableBody,
        startY: newY,
        theme: "grid",
        styles: { fontSize: TABLE_BODY_FONT_SIZE, cellPadding: 1.5, overflow: 'linebreak' },
        headStyles: {
            fillColor: [220, 220, 220],
            textColor: [0, 0, 0],
            halign: "center" as HAlignType,
            valign: "middle" as VAlignType,
            fontSize: TABLE_HEADER_FONT_SIZE,
            fontStyle: 'bold'
        },
        margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
        tableWidth: doc.internal.pageSize.getWidth() - (PAGE_MARGIN * 2),
        didDrawPage: (data) => { newY = data.cursor?.y || PAGE_TOP_MARGIN; } 
    });
    newY = (doc as any).lastAutoTable.finalY + SPACE_AFTER_TABLE;
    return newY;
}

export function addVariableView(
    doc: jsPDF,
    currentY: number,
    variables: Variable[],
    activeColumns: number[]
): number {
    let newY = currentY;
    const variablesToPrint = variables.filter(v => activeColumns.includes(v.columnIndex));

    if (variablesToPrint.length === 0) {
        return newY;
    }

    if (newY > Y_THRESHOLD_GENERAL) { 
        doc.addPage();
        newY = PAGE_TOP_MARGIN;
    }

    doc.setFontSize(SECTION_TITLE_FONT_SIZE);
    doc.text("Variable View", PAGE_MARGIN, newY);
    newY += SPACE_AFTER_TITLE;
    doc.setFontSize(TEXT_FONT_SIZE);

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
        startY: newY,
        theme: "grid",
        styles: { fontSize: TABLE_BODY_FONT_SIZE, cellPadding: 1.5, overflow: 'linebreak' },
        headStyles: {
            fillColor: [220, 220, 220],
            textColor: [0,0,0],
            halign: "center" as HAlignType,
            valign: "middle" as VAlignType,
            fontSize: TABLE_HEADER_FONT_SIZE,
            fontStyle: 'bold'
        },
        margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
        tableWidth: doc.internal.pageSize.getWidth() - (PAGE_MARGIN * 2),
        didDrawPage: (data) => { newY = data.cursor?.y || PAGE_TOP_MARGIN; }
    });
    newY = (doc as any).lastAutoTable.finalY + SPACE_AFTER_TABLE;
    return newY;
}

export function addResultsView(
    doc: jsPDF,
    currentY: number,
    logs: Log[],
    generateAutoTableDataFromStringFn: typeof generateAutoTableDataFromString // Type remains the same
): number {
    let newY = currentY;

    if (logs.length === 0) {
        return newY;
    }

    if (newY > Y_THRESHOLD_GENERAL - 10) { // Slightly less for the main title
        doc.addPage();
        newY = PAGE_TOP_MARGIN;
    }
    doc.setFontSize(SECTION_TITLE_FONT_SIZE);
    doc.text("Output Viewer (Results)", PAGE_MARGIN, newY);
    newY += SPACE_AFTER_TITLE;

    for (const log of logs) {
        if (newY > Y_THRESHOLD_RESULTS_LOG_ID) { 
            doc.addPage(); 
            newY = PAGE_TOP_MARGIN; 
        }
        doc.setFontSize(LOG_ID_FONT_SIZE);
        doc.setFont(doc.getFont().fontName, 'bold');
        doc.text(`Analysis Log: ${log.id}`, PAGE_MARGIN, newY);
        doc.setFont(doc.getFont().fontName, 'normal');
        newY += 5; // Specific spacing after log ID
        doc.setFontSize(TEXT_FONT_SIZE);
        
        const logTextLines = doc.splitTextToSize(log.log, doc.internal.pageSize.getWidth() - (PAGE_MARGIN * 2));
        if (newY + (logTextLines.length * 3.5) > Y_THRESHOLD_RESULTS_LOG_TEXT) { 
            doc.addPage();
            newY = PAGE_TOP_MARGIN;
        }
        doc.text(log.log, PAGE_MARGIN, newY, { maxWidth: doc.internal.pageSize.getWidth() - (PAGE_MARGIN * 2) });
        newY += (logTextLines.length * 3.5) + SPACE_AFTER_LOG_TEXT;

        if (log.analytics?.length) {
            for (const analytic of log.analytics) {
                if (newY > Y_THRESHOLD_RESULTS_ANALYTIC_TITLE) { 
                    doc.addPage(); 
                    newY = PAGE_TOP_MARGIN; 
                }
                doc.setFontSize(ANALYTIC_TITLE_FONT_SIZE);
                doc.setFont(doc.getFont().fontName, 'bold');
                doc.text(
                    analytic.title,
                    doc.internal.pageSize.getWidth() / 2,
                    newY,
                    { align: "center" }
                );
                doc.setFont(doc.getFont().fontName, 'normal');
                newY += SPACE_AFTER_TITLE;

                if (analytic.statistics?.length) {
                    for (const stat of analytic.statistics) {
                        const { tables } = generateAutoTableDataFromStringFn(stat.output_data);

                        for (const tbl of tables) {
                            if (newY > Y_THRESHOLD_RESULTS_TABLE_TITLE) { 
                                doc.addPage(); 
                                newY = PAGE_TOP_MARGIN; 
                            }
                            doc.setFontSize(LOG_ID_FONT_SIZE); // Re-using LOG_ID_FONT_SIZE for table titles for consistency
                            doc.setFont(doc.getFont().fontName, 'bold');
                            doc.text(tbl.title, PAGE_MARGIN, newY);
                            doc.setFont(doc.getFont().fontName, 'normal');
                            newY += 6; // Specific spacing after table title

                            autoTable(doc, {
                                head: tbl.head as CellDef[][],
                                body: tbl.body as CellDef[][],
                                startY: newY,
                                theme: "grid",
                                styles: { fontSize: TABLE_BODY_FONT_SIZE, cellPadding: 1.5, overflow: 'linebreak' },
                                headStyles: {
                                    fillColor: [220, 220, 220],
                                    textColor: [0,0,0],
                                    halign: "center" as HAlignType,
                                    valign: "middle" as VAlignType,
                                    fontSize: TABLE_HEADER_FONT_SIZE,
                                    fontStyle: 'bold'
                                },
                                margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
                                tableWidth: doc.internal.pageSize.getWidth() - (PAGE_MARGIN * 2),
                                didDrawPage: (data) => { newY = data.cursor?.y || PAGE_TOP_MARGIN; }
                            });
                            newY = (doc as any).lastAutoTable.finalY + SPACE_AFTER_TABLE;
                        }
                    }
                }
            }
        }
    }
    return newY;
} 