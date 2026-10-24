import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRouter from './routes/auth.js';
import ordersRouter from './routes/account/orders.js';

const app = express();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try { process.loadEnvFile(path.join(root, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const port = Number(process.env.API_PORT || process.env.PORT || 3001);

// 1. Global Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); 
app.use(express.json()); // Automatically parses JSON request bodies
app.use(cookieParser()); // Automatically parses cookies into req.cookies

app.use('/api/auth/orders', ordersRouter);
app.use('/api/auth', authRouter);
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(root, 'dist');
  app.use(express.static(dist));
  app.get(/.*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(port, () => {
  console.log(`Bitewise server listening on http://localhost:${port}`);
});
