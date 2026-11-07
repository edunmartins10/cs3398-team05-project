import { Router } from 'express';
import { SUPABASE_URL, supabase, userDatabase } from '../services/supabase.js';

const router = Router();

router.get('/signup-policy', async (req, res) => {
  let data;
  let error;
  try {
    ({ data, error } = await supabase.rpc('get_signup_policy'));
  } catch (requestError) {
    console.error('Could not retrieve signup policy from Supabase:', requestError);
    return res.status(502).json({ error: 'Could not load signup requirements. Please try again.' });
  }
  if (error || !data) {
    console.error('Could not retrieve signup policy from Supabase:', error);
    return res.status(502).json({ error: 'Could not load signup requirements. Please try again.' });
  }

  return res.json({ policy: data });
});

router.post('/signup-policy/username-availability', async (req, res) => {
  const username = req.body?.username;
  if (typeof username !== 'string') {
    return res.status(400).json({ error: 'A username is required.' });
  }

  let data;
  let error;
  try {
    ({ data, error } = await supabase.rpc('check_signup_username_available', {
      candidate: username,
    }));
  } catch (requestError) {
    console.error('Could not check username availability with Supabase:', requestError);
    return res.status(502).json({ error: 'Could not check username availability. Please try again.' });
  }
  if (error) {
    console.error('Could not check username availability with Supabase:', error);
    return res.status(502).json({ error: 'Could not check username availability. Please try again.' });
  }
  return res.json({ available: data === true });
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
  let profileData;
  try {
    const result = await userDatabase(accessToken)
      .from('profiles')
      .select('username, home_zip, phone_number')
      .eq('id', user.id)
      .maybeSingle();
    if (result.error) {
      console.error('Could not retrieve the Supabase profile:', result.error);
      return res.status(502).json({ error: 'Could not retrieve account profile.' });
    }
    profileData = result.data;
  } catch (requestError) {
    console.error('Could not retrieve the Supabase profile:', requestError);
    return res.status(502).json({ error: 'Could not retrieve account profile.' });
  }
  return res.json({
    profile: {
      username: profileData?.username || metadata.username || user.email || '',
      email: user.email || '',
      zipCode: profileData?.home_zip || metadata.home_zip || metadata.zipCode || '',
      latitude: metadata.latitude ?? null,
      longitude: metadata.longitude ?? null,
      phone: profileData?.phone_number || metadata.phone || '',
      textUpdates: metadata.textUpdates === true,
      limitRecommendations: metadata.limitRecommendations !== false,
      radiusMiles: metadata.radiusMiles || '5',
      recommendationPreferences: metadata.recommendationPreferences || null,
      notifications: metadata.notifications || null,
      createdAt: user.created_at || null,
      lastSignInAt: user.last_sign_in_at || null,
      emailConfirmedAt: user.email_confirmed_at || null,
      linkedProviders: (user.identities || []).map((identity) => identity.provider),
    },
  });
});

router.post('/register', async (req, res) => {
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
          bitewise_signup: true,
          username: req.body?.username,
          zipCode: req.body?.zipCode,
          home_zip: req.body?.zipCode,
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
    return res.status(201).json({
      ok: true,
      authenticated: false,
      message: 'Please verify your email using the confirmation link sent to your inbox before logging in. Check your spam folder if you do not see it.',
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