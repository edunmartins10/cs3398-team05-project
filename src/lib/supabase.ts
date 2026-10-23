import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getUserProfile() {
  const { data: { user }, error: authError } =
    await supabase.auth.getUser();

  if (authError) throw authError;

  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, home_zip, phone_number')
    .eq('id', user.id)
    .single();

  if (error) throw error;

  return data;
}