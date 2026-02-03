/*
 * Rute SAV
 * - POST /upload: unggah file .sav dan baca isinya
 * - POST /create: buat file .sav dari payload JSON
 * - GET  /: health untuk ruang lingkup /api/sav
 */
import { Router } from 'express';

import { uploadSavFile, createSavFile } from '../controllers/savController';

const router = Router();

// Unggah dan proses file .sav
router.post('/upload', uploadSavFile);
// Buat file .sav dari data
router.post('/create', createSavFile);
// Health sederhana
router.get('/', (req, res) => {
    res.status(200).send('OK');
});
export { router as savRouter };