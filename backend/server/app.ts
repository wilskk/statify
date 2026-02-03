<<<<<<< HEAD
=======
/*
  * Aplikasi Express
  * - Keamanan: helmet, CORS, parsing JSON
  * - (Opsional) Rate limit global pada prefix /api
  * - Health check dan rute /api/sav
  */
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
<<<<<<< HEAD
=======
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

import { ALLOWED_ORIGINS, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_ENABLED } from './config/constants';
import { savRouter } from './routes/savRoutes';

<<<<<<< HEAD

=======
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
const app = express();

app.use(helmet());
app.use(cors({
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
}));
app.use(express.json());

<<<<<<< HEAD
// Global rate limiting (keyed by X-User-Id or IP)
=======
const swaggerPath = path.resolve(__dirname, '../docs/openapi.yaml');
const swaggerDocument = YAML.load(swaggerPath);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rate limit global (berdasarkan X-User-Id atau alamat IP)
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
if (RATE_LIMIT_ENABLED) {
    const apiLimiter = rateLimit({
        windowMs: RATE_LIMIT_WINDOW_MS,
        max: RATE_LIMIT_MAX,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req: express.Request) => {
<<<<<<< HEAD
            // Prefer header X-User-Id; fallback to IP. Always return string.
=======
            // Utamakan header X-User-Id; jika tidak ada gunakan IP. Wajib mengembalikan string.
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
            const userIdHeader = req.headers['x-user-id'];
            const id = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;
            return String(id ?? req.ip);
        }
    });
    app.use('/api', apiLimiter);
}

<<<<<<< HEAD
// Health check
=======
// Health check sederhana
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
app.get('/', (req: express.Request, res) => {
    res.status(200).send('Backend is running!');
});

app.use('/api/sav', savRouter);

export { app };