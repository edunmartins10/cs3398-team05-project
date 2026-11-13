import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://oggrhcnritonacqfhdnx.supabase.co/';
const PUBLISHABLE_KEY = 'sb_publishable_G32hbUJ2qsDivoO7G5lbDw_G_tsOmuT';

const clientOptions = {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
};

export const supabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY, clientOptions);

export function userDatabase(accessToken) {
  return createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    ...clientOptions,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export async function authenticatedSupabaseSession(req, res, resource = 'order history') {
  const accessToken = req.cookies?.bitewise_session;
  if (!accessToken) {
    res.status(401).json({ error: `Log in to access your ${resource}.` });
    return null;
  }

  let data;
  let error;
  try {
    ({ data, error } = await supabase.auth.getUser(accessToken));
  } catch (requestError) {
    console.error('Could not retrieve the Supabase user:', requestError);
    res.status(502).json({ error: `Could not retrieve your ${resource}.` });
    return null;
  }
  if (error || !data.user) {
    res.clearCookie('bitewise_session');
    res.status(401).json({ error: `Log in to access your ${resource}.` });
    return null;
  }
  return { accessToken, user: data.user };
}
