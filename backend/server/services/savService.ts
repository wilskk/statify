import fs from 'fs';
import { SavBufferReader } from 'sav-reader';

/**
 * Processes an uploaded SAV file from its temporary path.
 * @param filePath The path to the uploaded SAV file.
 * @returns An object containing the metadata and rows read from the file.
 */
export const processUploadedSav = async (filePath: string): Promise<{ meta: any; rows: any[] }> => {
    try {
        const fileData = fs.readFileSync(filePath);
        const sav = new SavBufferReader(fileData);
        await sav.open();

        const meta = sav.meta;
        const rows = await sav.readAllRows();

        // Clean up the temporary file after processing
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
                console.error("Error deleting temporary upload file:", unlinkErr);
            }
        });


        return { meta, rows };
    } catch (error) {
        console.error('Error processing SAV file in service:', error);
        // Attempt to clean up the file even if processing failed
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
                // Log secondary error, but primary error is more important
                console.error("Error deleting temporary upload file after processing error:", unlinkErr);
            }
        });
        throw new Error('Error processing SAV file'); // Re-throw to be caught by controller
    }
}; 