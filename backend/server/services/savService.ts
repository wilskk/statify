<<<<<<< HEAD
=======
/*
 * Service SAV
 * Membaca file .sav dan mengembalikan { meta, rows }.
 */
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
import fs from 'fs';
import { SavBufferReader } from 'sav-reader';

import type { SavResponse, SavMeta } from '../types/sav.types';

<<<<<<< HEAD
// Read SAV file and return { meta, rows }.
=======
// Baca file .sav dan kembalikan { meta, rows }
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
export const processUploadedSav = async (filePath: string): Promise<SavResponse> => {

    try {
        const fileData = fs.readFileSync(filePath);
        const sav: SavBufferReader = new SavBufferReader(fileData);
        await sav.open();

<<<<<<< HEAD
        // Casts preserve runtime behavior and satisfy lint rules.
        const meta: SavMeta = sav.meta as unknown as SavMeta;
        const rows: Record<string, unknown>[] = (await sav.readAllRows()) as unknown as Record<string, unknown>[];

        // Cleanup temp file
=======
        // Casting untuk menjaga perilaku runtime dan memenuhi aturan lint
        const meta: SavMeta = sav.meta as unknown as SavMeta;
        const rows: Record<string, unknown>[] = (await sav.readAllRows()) as unknown as Record<string, unknown>[];

        // Bersihkan file sementara upload
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
                console.error("Error deleting temporary upload file:", unlinkErr);
            }
        });


        return { meta, rows };
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? (error.stack || error.message) : String(error);
        console.error('Error processing SAV file in service:', errMsg);
<<<<<<< HEAD
        // Attempt cleanup even on error
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
                // Log secondary error
=======
        // Tetap coba hapus file sementara meski terjadi error
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
                // Catat error sekunder
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
                console.error("Error deleting temporary upload file after processing error:", unlinkErr);
            }
        });
        throw new Error('Error processing SAV file'); // Propagate error
    }
}; 