import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import settingsRouter from './routes/settings.js';
import generateRouter from './routes/generate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3001;

const app = express();

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/settings', settingsRouter);
app.use('/api/generate-testcases', generateRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend in production
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Test Case Generator API running at http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health\n`);
});
