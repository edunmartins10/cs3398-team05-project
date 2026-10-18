import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

// 1. Global Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // Allows Vite dev server
app.use(express.json()); // Automatically parses JSON request bodies
app.use(cookieParser()); // Automatically parses cookies into req.cookies

// 2. Sample Route Handlers
app.get('/api/auth/me', (req, res) => {
  // Access cookies via req.cookies
  // Send JSON via res.json()
  res.json({ profile: null });
});

app.post('/api/auth/login', async (req, res) => {
  // Access parsed JSON body directly via req.body
  const { identifier, password } = req.body;
  
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Set cookies easily
  res.cookie('bitewise_session', 'your_token_here', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 14 * 24 * 60 * 60 * 1000
  });

  return res.json({ profile: { username: identifier } });
});

app.listen(port, () => {
  console.log(`Express server listening on http://localhost:${port}`);
});