/*
  * Aplikasi Express
  * - Keamanan: helmet, CORS, parsing JSON
  * - (Opsional) Rate limit global pada prefix /api
  * - Health check dan rute /api/sav
  */
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { ALLOWED_ORIGINS, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_ENABLED } from './config/constants';
import { savRouter } from './routes/savRoutes';

const app = express();

app.use(helmet());
app.use(cors({
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
}));
app.use(express.json());

// Rate limit global (berdasarkan X-User-Id atau alamat IP)
if (RATE_LIMIT_ENABLED) {
    const apiLimiter = rateLimit({
        windowMs: RATE_LIMIT_WINDOW_MS,
        max: RATE_LIMIT_MAX,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req: express.Request) => {
            // Utamakan header X-User-Id; jika tidak ada gunakan IP. Wajib mengembalikan string.
            const userIdHeader = req.headers['x-user-id'];
            const id = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;
            return String(id ?? req.ip);
        }
    });
    app.use('/api', apiLimiter);
}

// Health check sederhana
app.get('/', (req: express.Request, res) => {
    res.status(200).send('Backend is running!');
});

app.use('/api/sav', savRouter);

export { app };