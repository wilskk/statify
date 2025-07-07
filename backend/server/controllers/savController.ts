// savController.ts - Versi dengan perbaikan
import { Request, Response } from 'express';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { saveToFile, VariableType, VariableAlignment, VariableMeasure } from 'sav-writer';
import * as savService from '../services/savService'; // Import the service

interface FormidableFile {
    filepath?: string;
    path?: string;
    [key: string]: any;
}

/**
 * Transforms a single variable object from the client-side request
 * into the format required by the 'sav-writer' library.
 * @param variable The variable object from the request body.
 * @returns A transformed variable object.
 */
const transformVariable = (variable: any) => {
    let type: number;
    if (variable.type === "STRING") {
        type = VariableType.String;
    } else if (["DATE", "ADATE", "EDATE", "SDATE", "JDATE", "QYR", "MOYR", "WKYR", "WKDAY", "MONTH"].includes(variable.type)) {
        type = VariableType.Date;
    } else if (["DATETIME", "TIME", "DTIME"].includes(variable.type)) {
        type = VariableType.DateTime;
    } else {
        type = VariableType.Numeric;
    }

    let alignment: number;
    switch (variable.alignment?.toLowerCase()) {
        case "left":
            alignment = VariableAlignment.Left;
            break;
        case "center":
        case "centre":
            alignment = VariableAlignment.Centre;
            break;
        default:
            alignment = VariableAlignment.Right;
    }

    let measure: number;
    switch (variable.measure?.toLowerCase()) {
        case "nominal":
            measure = VariableMeasure.Nominal;
            break;
        case "ordinal":
            measure = VariableMeasure.Ordinal;
            break;
        default:
            measure = VariableMeasure.Continuous;
    }

    const valueLabels = Array.isArray(variable.valueLabels) ?
        variable.valueLabels.map((vl: any) => {
            let value: string | number;
            const label = vl.label === null || vl.label === undefined ? "" : String(vl.label);

            if (type === VariableType.String) {
                value = vl.value === null || vl.value === undefined ? "" : String(vl.value);
            } else {
                const numValue = Number(vl.value);
                value = isNaN(numValue) ? 0 : numValue;
            }
            return { value, label };
        }) : [];

    return {
        name: String(variable.name),
        label: String(variable.label || ""),
        type,
        width: Number(variable.width),
        decimal: Number(variable.decimal || 0),
        alignment,
        measure,
        columns: Math.max(1, Math.floor(Number(variable.columns || 8) / 20)),
        valueLabels
    };
};

/**
 * Transforms a single data record (row) based on the definitions
 * of the transformed variables. It handles type coercion for dates and numbers.
 * @param record A single row of data.
 * @param transformedVariables The array of fully transformed variable definitions.
 * @returns A processed data record.
 */
const transformRecord = (record: any, transformedVariables: any[]) => {
    const result: Record<string, any> = {};

    for (const varName of Object.keys(record)) {
        const variable = transformedVariables.find((v: any) => v.name === varName);
        if (!variable) continue;

        const rawValue = record[varName];

        if (rawValue === null || rawValue === undefined || rawValue === "") {
            result[varName] = null;
            continue;
        }

        if (variable.type === VariableType.String) {
            result[varName] = String(rawValue || '');
        } else if (variable.type === VariableType.Date) {
            if (typeof rawValue === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(rawValue)) {
                const [day, month, year] = rawValue.split('-').map(Number);
                const dateObject = new Date(Date.UTC(year, month - 1, day));
                result[varName] = !isNaN(dateObject.getTime()) ? dateObject : null;
            } else {
                result[varName] = null;
            }
        } else { // Numeric types
            const numValue = Number(rawValue);
            result[varName] = !isNaN(numValue) ? numValue : null;
        }
    }
    return result;
};

export const uploadSavFile = (req: Request, res: Response) => {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            // Ensure temporary file is cleaned up if parsing fails and file exists
            const uploadedFileOnError = files.file as FormidableFile | FormidableFile[];
            if (uploadedFileOnError) {
                const filePathOnError = Array.isArray(uploadedFileOnError)
                    ? uploadedFileOnError[0]?.filepath || uploadedFileOnError[0]?.path
                    : uploadedFileOnError?.filepath || uploadedFileOnError?.path;
                if (filePathOnError && fs.existsSync(filePathOnError)) {
                    fs.unlink(filePathOnError, unlinkErr => {
                        if (unlinkErr) console.error("Error deleting temp file after parse error:", unlinkErr);
                    });
                }
            }
            res.status(500).send('Error parsing form');
            return;
        }

        const uploadedFile = files.file as FormidableFile | FormidableFile[];
        if (!uploadedFile) {
            res.status(400).send('No file uploaded');
            return;
        }

        const filePath = Array.isArray(uploadedFile)
            ? uploadedFile[0]?.filepath || uploadedFile[0]?.path
            : uploadedFile?.filepath || uploadedFile?.path;

        if (!filePath) {
            res.status(400).send('Invalid file path');
            return;
        }

        try {
            // Call the service function
            const { meta, rows } = await savService.processUploadedSav(filePath);
            res.json({ meta, rows });
        } catch (error) {
            // Error logging is now primarily handled in the service
            // The service already attempts cleanup, no need to repeat here
            res.status(500).send('Error processing SAV file');
        }
    });
};

export const createSavFile = (req: Request, res: Response) => {
    const { data, variables } = req.body;
    console.log('Received SAV writer request:', { data, variables });

    if (!data || !variables) {
        res.status(400).json({ error: "Parameter data dan variables wajib disediakan." });
        return;
    }

    try {
        const filteredVariables = variables.filter((variable: any) => {
            if (variable.type === "DATE") {
                return variable.width === 10;
            }
            if (variable.type === "DATETIME") {
                return variable.width === 20;
            }
            // Filter out unsupported date/time formats
            if (["ADATE", "EDATE", "SDATE", "JDATE", "QYR", "MOYR", "WKYR", "WKDAY", "MONTH", "TIME", "DTIME"].includes(variable.type)) {
                console.warn(`Variabel ${variable.name} dengan tipe ${variable.type} diabaikan: format tidak didukung.`);
                return false;
            }
            return true;
        });

        if (filteredVariables.length === 0) {
            res.status(400).json({
                error: "Tidak ada variabel yang valid untuk diproses setelah filtering."
            });
            return;
        }

        // Use the new helper functions
        const transformedVariables = filteredVariables.map(transformVariable);
        const transformedData = data.map((record: any) => transformRecord(record, transformedVariables));

        const outputDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const filePath = path.join(outputDir, `output-${Date.now()}.sav`);

        console.log('Transformed variables:', JSON.stringify(transformedVariables, null, 2));

        if (transformedVariables.length > 0) {
            const firstVar = transformedVariables[0];
            console.log('First variable:', {
                name: firstVar.name,
                type: firstVar.type,
                valueLabels: firstVar.valueLabels
            });

            if (firstVar.valueLabels && firstVar.valueLabels.length > 0) {
                console.log('First value label:', {
                    value: firstVar.valueLabels[0].value,
                    valueType: typeof firstVar.valueLabels[0].value,
                    label: firstVar.valueLabels[0].label,
                    labelType: typeof firstVar.valueLabels[0].label
                });
            }
        }

        saveToFile(filePath, transformedData, transformedVariables);

        res.download(filePath, "data.sav", (err) => {
            if (err) {
                console.error("Download error:", err);
                res.status(500).send("Terjadi kesalahan saat mengunduh file.");
                return;
            }

            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error("Error menghapus file sementara:", unlinkErr);
                }
            });
        });
    } catch (error: any) {
        console.error("Error creating SAV file:", error);

        if (error.message && error.message.includes("invalid variable name")) {
            res.status(400).json({
                error: "Nama variabel tidak valid. Nama variabel harus dimulai dengan huruf dan hanya berisi huruf, angka, atau garis bawah."
            });
            return;
        }

        const errorMessage = error.stack || error.message || String(error);
        res.status(500).json({
            error: "Gagal membuat file .sav",
            details: errorMessage,
            message: error.message
        });
    }
};

export const cleanupTempFiles = () => {
    const outputDir = path.join(__dirname, '../../temp');
    if (fs.existsSync(outputDir)) {
        const files = fs.readdirSync(outputDir);
        const now = Date.now();

        files.forEach(file => {
            const filePath = path.join(outputDir, file);
            const stats = fs.statSync(filePath);
            const fileAge = now - stats.mtimeMs;

            if (fileAge > 3600000) {
                fs.unlinkSync(filePath);
            }
        });
    }
};