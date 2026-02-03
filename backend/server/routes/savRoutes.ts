<<<<<<< HEAD
=======
/*
 * Rute SAV
 * - POST /upload: unggah file .sav dan baca isinya
 * - POST /create: buat file .sav dari payload JSON
 * - GET  /: health untuk ruang lingkup /api/sav
 */
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
import { Router } from 'express';

import { uploadSavFile, createSavFile } from '../controllers/savController';

const router = Router();

<<<<<<< HEAD
router.post('/upload', uploadSavFile);
router.post('/create', createSavFile);
=======
// Unggah dan proses file .sav
router.post('/upload', uploadSavFile);
// Buat file .sav dari data
router.post('/create', createSavFile);
// Health sederhana
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
router.get('/', (req, res) => {
    res.status(200).send('OK');
});
export { router as savRouter };