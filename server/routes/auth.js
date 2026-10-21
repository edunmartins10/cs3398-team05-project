import { Router } from 'express';

const router = Router();

router.get('/me', async (req, res) => {
  // Logic for GET /api/auth/me
});

router.post('/register', async (req, res) => {
  // Logic for POST /api/auth/register
});

router.post('/login', async (req, res) => {
  // Logic for POST /api/auth/login
});

router.post('/logout', async (req, res) => {
  // Clear cookie easily
  res.clearCookie('bitewise_session');
  res.json({ ok: true });
});

export default router;