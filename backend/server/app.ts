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
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import { ALLOWED_ORIGINS, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_ENABLED } from './config/constants';
import { savRouter } from './routes/savRoutes';

const app = express();

app.use(helmet());
app.use(cors({
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
}));
app.use(express.json());

const swaggerPath = path.resolve(__dirname, '../docs/openapi.yaml');
const swaggerDocument = YAML.load(swaggerPath);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
    const htmlResponse = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Statify Backend Status</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #0f172a;
            color: #e2e8f0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            overflow: hidden;
            perspective: 1000px;
        }
        .container {
            text-align: center;
            z-index: 10;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
            animation: textPulse 2s infinite alternate;
        }
        p {
            font-size: 1.2rem;
            color: #94a3b8;
        }
        .status-badge {
            display: inline-block;
            margin-top: 20px;
            padding: 8px 16px;
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
            border: 1px solid #10b981;
            border-radius: 50px;
            font-weight: bold;
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
            animation: glow 1.5s infinite alternate;
        }
        .cube-wrapper {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 300px;
            height: 300px;
            z-index: 1;
            opacity: 0.15;
            pointer-events: none;
        }
        .cube {
            width: 100%;
            height: 100%;
            position: relative;
            transform-style: preserve-3d;
            animation: rotate 15s infinite linear;
        }
        .face {
            position: absolute;
            width: 300px;
            height: 300px;
            background: rgba(56, 189, 248, 0.1);
            border: 2px solid rgba(56, 189, 248, 0.6);
            box-shadow: 0 0 30px rgba(56, 189, 248, 0.3) inset;
        }
        .front  { transform: translateZ(150px); }
        .back   { transform: rotateY(180deg) translateZ(150px); }
        .right  { transform: rotateY(90deg) translateZ(150px); }
        .left   { transform: rotateY(-90deg) translateZ(150px); }
        .top    { transform: rotateX(90deg) translateZ(150px); }
        .bottom { transform: rotateX(-90deg) translateZ(150px); }

        @keyframes rotate {
            0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
            100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg); }
        }
        @keyframes textPulse {
            0% { text-shadow: 0 0 10px rgba(56, 189, 248, 0.5); }
            100% { text-shadow: 0 0 30px rgba(56, 189, 248, 1), 0 0 50px rgba(56, 189, 248, 0.8); }
        }
        @keyframes glow {
            0% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.2); }
            100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.8); }
        }
        .highlight {
            color: #10b981;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-shadow: 0 0 15px rgba(16, 185, 129, 0.8);
            display: inline-block;
            animation: successPulse 1.5s infinite alternate;
        }
        @keyframes successPulse {
            0% { text-shadow: 0 0 5px rgba(16, 185, 129, 0.4); transform: scale(1); }
            100% { text-shadow: 0 0 25px rgba(16, 185, 129, 1); transform: scale(1.1); }
        }
    </style>
</head>
<body>
    <div class="cube-wrapper">
        <div class="cube">
            <div class="face front"></div>
            <div class="face back"></div>
            <div class="face right"></div>
            <div class="face left"></div>
            <div class="face top"></div>
            <div class="face bottom"></div>
        </div>
    </div>
    <div class="container">
        <h1>Statify API</h1>
        <p>The backend server is running <span class="highlight">successfully</span>.</p>
        <div class="status-badge">● System Online</div>
    </div>
</body>
</html>
    `;
    res.status(200).send(htmlResponse);
});

app.use('/api/sav', savRouter);

export { app };