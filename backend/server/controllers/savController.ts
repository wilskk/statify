<<<<<<< HEAD
// Controller for SAV upload/create
=======
/*
 * Controller SAV
 * - Upload: terima file .sav, baca meta dan baris
 * - Create: terima payload JSON, tulis .sav ke direktori sementara
 * - Pembersihan: hapus file sementara lama
 */

>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
import type { Request, Response } from 'express';
import formidable from 'formidable';
import type { Part, File, Fields } from 'formidable';
import fs from 'fs';
import path from 'path';
import { saveToFile, VariableType, VariableAlignment, VariableMeasure } from 'sav-writer';
import { z } from 'zod';

<<<<<<< HEAD
import { MAX_UPLOAD_SIZE_MB, getTempDir } from '../config/constants';
import * as savService from '../services/savService'; // Import the service
import type { VariableInput, TransformedVariable } from '../types/sav.types';

 
// Zod schemas for input validation
=======
import { MAX_UPLOAD_SIZE_MB, getTempDir, DEBUG_SAV } from '../config/constants';
import * as savService from '../services/savService'; // Import the service
import type { VariableInput, TransformedVariable } from '../types/sav.types';

// Skema Zod untuk validasi input
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
const ValueLabelSchema = z.object({
    value: z.union([z.string(), z.number()]).nullable().optional(),
    label: z.string().nullable().optional(),
});

const VariableInputSchema = z.object({
    name: z.string(),
    label: z.string().optional().default(''),
    type: z.enum([
        'NUMERIC', 'STRING',
        'DATE', 'ADATE', 'EDATE', 'SDATE', 'JDATE', 'QYR', 'MOYR', 'WKYR', 'WKDAY', 'MONTH',
        'DATETIME', 'TIME', 'DTIME',
        'DOLLAR', 'DOT', 'COMMA', 'SCIENTIFIC', 'CUSTOM_CURRENCY', 'CCA', 'CCB', 'CCC', 'CCD', 'CCE'
    ]),
    width: z.coerce.number(),
    decimal: z.coerce.number().optional().default(0),
    alignment: z.enum(['left', 'centre', 'center', 'right']).optional(),
    measure: z.enum(['nominal', 'ordinal', 'continuous']).optional(),
    columns: z.coerce.number().optional(),
    valueLabels: z.array(ValueLabelSchema).optional(),
});

const CreateSavBodySchema = z.object({
    variables: z.array(VariableInputSchema).min(1),
    data: z.array(z.record(z.string(), z.unknown())).default([]),
});

<<<<<<< HEAD
// Normalize VariableInput to sav-writer format.
=======
// Normalisasi VariableInput ke format sav-writer
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
export const transformVariable = (variable: VariableInput): TransformedVariable => {
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
        variable.valueLabels.map((vl) => {
            let value: string | number;
            const label = vl.label === null || vl.label === undefined ? "" : String(vl.label);

            if (type === VariableType.String) {
                const v = vl.value;
                value = v === null || v === undefined ? "" : String(v);
            } else {
                const v = vl.value;
                const numValue = Number(v);
                value = isNaN(numValue) ? 0 : numValue;
            }
            return { value, label };
        }) : [];

    return {
        name: variable.name,
        label: variable.label ?? "",
        type,
        width: variable.width,
        decimal: variable.decimal ?? 0,
        alignment,
        measure,
        columns: Math.max(1, Math.floor(((variable.columns ?? 8) / 20))),
        valueLabels
    };
};

<<<<<<< HEAD
// Coerce record values by transformed variable types (strings, dates, numbers).
=======
// Konversi nilai record sesuai tipe variabel tertransformasi (string, tanggal, angka)
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
export const transformRecord = (
    record: Record<string, unknown>,
    transformedVariables: TransformedVariable[]
): Record<string, string | number | Date | null> => {
    const result: Record<string, string | number | Date | null> = {};

    for (const varName of Object.keys(record)) {
        const variable = transformedVariables.find((v) => v.name === varName);
        if (!variable) {
            continue;
        }

        const rawValue = record[varName];

        if (rawValue === null || rawValue === undefined || rawValue === "") {
            result[varName] = null;
            continue;
        }

        if (variable.type === VariableType.String) {
            const s = String(rawValue ?? '');
            result[varName] = s.length === 0 ? null : s;
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

export const uploadSavFile = (req: Request, res: Response): void => {
    const form = formidable({
        multiples: false,
<<<<<<< HEAD
        // Limit file size (default 10 MB, configurable via env)
        maxFileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024,
        // Only accept .sav with allowed mimetypes (checked before writing to disk)
=======
        // Batas ukuran file (default 10 MB)
        maxFileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024,
        // Hanya menerima .sav dengan mimetype yang diizinkan (dicek sebelum menulis ke disk)
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        filter: (part: Part) => {
            const { originalFilename, mimetype } = part;
            if (!originalFilename) {
                return false;
            }
<<<<<<< HEAD
=======

>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
            const ext = path.extname(originalFilename).toLowerCase();
            const allowedMimes = ['application/octet-stream', 'application/x-spss-sav'];
            const mimeOk = !mimetype || allowedMimes.includes(mimetype);
            return ext === '.sav' && mimeOk;
        }
    });

    form.parse(req, (err: Error | null, fields: Fields, files: Record<string, File | File[] | undefined>) => {
        if (err) {
            console.error('Error parsing form:', err);
<<<<<<< HEAD
            // Ensure temporary file is cleaned up if parsing fails and file exists
=======
            // Pastikan file sementara dibersihkan jika parsing gagal dan file ada
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
            const uploadedFileOnError = files['file'];
            if (uploadedFileOnError) {
                const filePathOnError = Array.isArray(uploadedFileOnError)
                    ? uploadedFileOnError[0]?.filepath
                    : uploadedFileOnError?.filepath;
                if (filePathOnError && fs.existsSync(filePathOnError)) {
                    fs.unlink(filePathOnError, unlinkErr => {
                        if (unlinkErr) {
                            console.error("Error deleting temp file after parse error:", unlinkErr);
                        }
                    });
                }
            }
            res.status(500).send('Error parsing form');
            return;
        }

        const uploadedFile = files['file'];
        if (!uploadedFile) {
            res.status(400).send('No file uploaded');
            return;
        }

        const filePath = Array.isArray(uploadedFile)
            ? uploadedFile[0]?.filepath
            : uploadedFile?.filepath;

        if (!filePath) {
            res.status(400).send('Invalid file path');
            return;
        }

        void (async () => {
            try {
<<<<<<< HEAD
                // Delegate to service
                const { meta, rows } = await savService.processUploadedSav(filePath);
                res.json({ meta, rows });
            } catch {
                // Logged and cleaned up in service
=======
                // Delegasi ke service
                const { meta, rows } = await savService.processUploadedSav(filePath);
                res.json({ meta, rows });
            } catch {
                // Logging dan pembersihan dilakukan di service
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
                res.status(500).send('Error processing SAV file');
            }
        })();
    });
};

export const createSavFile = (req: Request, res: Response): void => {
    const parsed = CreateSavBodySchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Payload tidak valid', issues: parsed.error.issues });
        return;
    }
<<<<<<< HEAD
    const { data, variables } = parsed.data;
    const DEBUG_SAV = ['1','true','yes','on'].includes(String(process.env.DEBUG_SAV).toLowerCase());
=======

    const { data, variables } = parsed.data;
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    if (DEBUG_SAV) {
        console.warn('Received SAV writer request:', { data, variables });
    }

    try {
<<<<<<< HEAD
        const filteredVariables = variables.filter((variable) => {
=======
        const filteredVariables = variables.filter((variable: any) => {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
            if (variable.type === "DATE") {
                return Number(variable.width) === 10;
            }
            if (variable.type === "DATETIME") {
                return Number(variable.width) === 20;
            }
<<<<<<< HEAD
            // Filter out unsupported date/time formats
=======
            // Saring format tanggal/waktu yang belum didukung
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
            if (["ADATE", "EDATE", "SDATE", "JDATE", "QYR", "MOYR", "WKYR", "WKDAY", "MONTH", "TIME", "DTIME"].includes(variable.type)) {
                if (DEBUG_SAV) {
                    console.warn(`Variabel ${String(variable.name)} dengan tipe ${String(variable.type)} diabaikan: format tidak didukung.`);
                }
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

<<<<<<< HEAD
        // Transform inputs
        const transformedVariables: TransformedVariable[] = filteredVariables.map(transformVariable);
        const transformedData = data?.map((record) => transformRecord(record, transformedVariables)) ?? [];
=======
        // Transformasi input
        const transformedVariables: TransformedVariable[] = filteredVariables.map(transformVariable);
        const transformedData = data?.map((record: any) => transformRecord(record, transformedVariables)) ?? [];
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

        const outputDir = getTempDir();
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const filePath = path.join(outputDir, `output-${Date.now()}.sav`);

        if (DEBUG_SAV) {
            console.warn('Transformed variables:', JSON.stringify(transformedVariables, null, 2));
        }

        if (transformedVariables.length > 0) {
            const firstVar = transformedVariables[0];
            if (DEBUG_SAV) {
                console.warn('First variable:', {
                    name: firstVar.name,
                    type: firstVar.type,
                    valueLabels: firstVar.valueLabels
                });
            }

            if (firstVar.valueLabels && firstVar.valueLabels.length > 0) {
                if (DEBUG_SAV) {
                    console.warn('First value label:', {
                        value: firstVar.valueLabels[0].value,
<<<<<<< HEAD
                        valueType: typeof firstVar.valueLabels[0].value,
                        label: firstVar.valueLabels[0].label,
                        labelType: typeof firstVar.valueLabels[0].label
=======
                        label: firstVar.valueLabels[0].label
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
                    });
                }
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
    } catch (error: unknown) {
        console.error("Error creating SAV file:", error);

        if (error instanceof Error && error.message.includes("invalid variable name")) {
            res.status(400).json({
                error: "Nama variabel tidak valid. Nama variabel harus dimulai dengan huruf dan hanya berisi huruf, angka, atau garis bawah."
            });
            return;
        }

        const errorMessage = error instanceof Error ? (error.stack || error.message) : String(error);
        res.status(500).json({
            error: "Gagal membuat file .sav",
            details: errorMessage,
            message: error instanceof Error ? error.message : undefined
        });
    }
};

export const cleanupTempFiles = (): void => {
    const outputDir = getTempDir();
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