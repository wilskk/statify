<<<<<<< HEAD
=======
/*
 * Entrypoint server
 * Menjalankan aplikasi Express pada PORT yang dikonfigurasi.
 */
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
import { app } from './app';
import { PORT } from './config/constants';

app.listen(PORT, () => {
    console.warn(`Server berjalan pada http://localhost:${PORT}`);
});