import express from 'express';
import cors from 'cors';
import savRoutes from './routes/savRoutes';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// Hard-coded daftar origin yang diizinkan karena tidak menggunakan .env
const allowedOrigins = ['https://statify-dev.student.stis.ac.id', 'http://statify-dev.student.stis.ac.id', 'http://localhost:3001', 'http://localhost:3000'];

app.use(helmet());
app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
}));
app.use(express.json());

// Rate limiting: max 100 requests per 15 menit per IP (atau per user jika header X-User-Id ada)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: import('express').Request) => {
        // Gunakan header 'X-User-Id' jika ada; bila tidak, pakai IP. String interpolation memastikan hasil selalu string.
        const userIdHeader = req.headers['x-user-id'];
        return `${Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader ?? req.ip}`;
    }
});

app.use('/api', apiLimiter);

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).send('Backend is running!');
});

app.use('/api/sav', savRoutes);

export default app; 