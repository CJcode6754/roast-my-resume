import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl.startsWith('http')) {
  console.error(
    '⚠️ Supabase not configured!\n' +
    'Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env\n' +
    'Get them from: https://supabase.com → Project Settings → API'
  );
}

export const supabase = supabaseUrl.startsWith('http')
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
