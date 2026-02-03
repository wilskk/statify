/*
 * Service SAV
 * Membaca file .sav dan mengembalikan { meta, rows }.
 */
import fs from 'fs';
import { SavBufferReader } from 'sav-reader';

import type { SavResponse, SavMeta } from '../types/sav.types';

// Baca file .sav dan kembalikan { meta, rows }
export const processUploadedSav = async (filePath: string): Promise<SavResponse> => {

    try {
        const fileData = fs.readFileSync(filePath);
        const sav: SavBufferReader = new SavBufferReader(fileData);
        await sav.open();

        // Casting untuk menjaga perilaku runtime dan memenuhi aturan lint
        const meta: SavMeta = sav.meta as unknown as SavMeta;
        const rows: Record<string, unknown>[] = (await sav.readAllRows()) as unknown as Record<string, unknown>[];

        // Bersihkan file sementara upload
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
                console.error("Error deleting temporary upload file:", unlinkErr);
            }
        });


        return { meta, rows };
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? (error.stack || error.message) : String(error);
        console.error('Error processing SAV file in service:', errMsg);
        // Tetap coba hapus file sementara meski terjadi error
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
                // Catat error sekunder
                console.error("Error deleting temporary upload file after processing error:", unlinkErr);
            }
        });
        throw new Error('Error processing SAV file'); // Propagate error
    }
}; 