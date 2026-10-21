import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRouter from './routes/auth.js';

const app = express();
const port = process.env.PORT || 3001;

// 1. Global Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); 
app.use(express.json()); // Automatically parses JSON request bodies
app.use(cookieParser()); // Automatically parses cookies into req.cookies

app.use('/api/auth', authRouter);

app.listen(port, () => {
  console.log(`Express server listening on http://localhost:${port}`);
});
