import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oggrhcnritonacqfhdnx.supabase.co/';
const PUBLISHABLE_KEY = 'sb_publishable_G32hbUJ2qsDivoO7G5lbDw_G_tsOmuT';

const router = Router();
const supabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

router.get('/me', async (req, res) => {
  const accessToken = req.cookies?.bitewise_session;
  if (!accessToken) return res.json({ profile: null });

  let data;
  let error;
  try {
    ({ data, error } = await supabase.auth.getUser(accessToken));
  } catch (requestError) {
    console.error('Could not retrieve the Supabase user:', requestError);
    return res.status(502).json({ error: 'Could not retrieve account profile.' });
  }
  if (error) {
    if (error.status === 401) {
      res.clearCookie('bitewise_session');
      return res.json({ profile: null });
    }
    console.error('Could not retrieve the Supabase user:', error);
    return res.status(502).json({ error: 'Could not retrieve account profile.' });
  }

  const user = data.user;
  if (!user) return res.json({ profile: null });

  const metadata = user.user_metadata || {};
  return res.json({
    profile: {
      username: metadata.username || user.email || '',
      email: user.email || '',
      zipCode: metadata.zipCode || '',
      latitude: metadata.latitude ?? null,
      longitude: metadata.longitude ?? null,
      phone: metadata.phone || '',
      textUpdates: metadata.textUpdates === true,
      limitRecommendations: metadata.limitRecommendations !== false,
      radiusMiles: metadata.radiusMiles || '5',
    },
  });
});

router.post('/register', async (req, res) => {
  // Logic for POST /api/auth/register
});

router.post('/login', async (req, res) => {
  let data;
  let error;
  try {
    ({ data, error } = await supabase.auth.signInWithPassword({
      email: req.body?.email,
      password: req.body?.password,
    }));
  } catch (requestError) {
    console.error('Could not sign in with Supabase:', requestError);
    return res.status(502).json({ error: 'Login could not be completed. Please try again.' });
  }

  if (error) {
    if (error.code === 'email_not_confirmed') {
      return res.status(403).json({ error: 'Please verify your email before logging in.' });
    }
    if (error.status === 400 || error.status === 401) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    console.error('Could not sign in with Supabase:', error);
    return res.status(502).json({ error: 'Login could not be completed. Please try again.' });
  }

  const session = data?.session;
  if (!session?.access_token || !Number.isFinite(session.expires_in) || session.expires_in <= 0) {
    console.error('Supabase sign-in did not return a usable session.');
    return res.status(502).json({ error: 'Login could not be completed. Please try again.' });
  }

  res.cookie('bitewise_session', session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: session.expires_in * 1000,
  });
  return res.json({ ok: true });
});

router.post('/logout', async (req, res) => {
  // Clear cookie easily
  res.clearCookie('bitewise_session');
  res.json({ ok: true });
});

export default router;