import express from 'express';
import cors from 'cors';
import savRoutes from './routes/savRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: ['https://statify-dev.student.stis.ac.id', 'http://statify-dev.student.stis.ac.id', 'http://localhost:3001', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
}));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).send('Backend is running!');
});

app.use('/api/sav', savRoutes);

app.listen(PORT, () => {
    console.log(`Server berjalan pada http://localhost:${PORT}`);
});