import { Router } from 'express';
import { SUPABASE_URL, supabase } from '../services/supabase.js';

const router = Router();

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
      zipCode: metadata.home_zip || metadata.zipCode || '',
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
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const zipCode = typeof req.body?.zipCode === 'string' ? req.body.zipCode.trim() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const textUpdates = req.body?.textUpdates === true;

  let data;
  let error;
  try {
    ({ data, error } = await supabase.auth.signUp({
      email: req.body?.email,
      password: req.body?.password,
      options: {
        data: {
          username,
          zipCode,
          home_zip: zipCode,
          phone,
          textUpdates,
          limitRecommendations: true,
          radiusMiles: '5',
        },
      },
    }));
  } catch (requestError) {
    console.error('Could not register with Supabase:', requestError);
    const details = requestError?.message ? ` Details: ${requestError.message}` : '';
    return res.status(502).json({
      error: `Could not reach Supabase Auth. Check the server connection and try again.${details}`,
    });
  }

  if (error) {
    if (error.status >= 400 && error.status < 500) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Could not register with Supabase:', error);
    return res.status(502).json({
      error: error.message || 'Supabase Auth could not complete registration. Check the Supabase Auth logs and email settings.',
    });
  }

  const session = data?.session;
  if (!session?.access_token || !Number.isFinite(session.expires_in) || session.expires_in <= 0) {
    return res.status(409).json({
      error: 'Registration did not return a session. Check that email confirmation is disabled in Supabase and that this email is not already registered.',
    });
  }

  res.cookie('bitewise_session', session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: session.expires_in * 1000,
  });
  return res.status(201).json({ ok: true, authenticated: true });
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