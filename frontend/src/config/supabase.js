import { createClient } from '@supabase/supabase-js';

const readEnvValue = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';
const isPlaceholderValue = (value) => (
  !value
  || value === 'your_supabase_anon_key'
  || value.includes('your-project-ref.supabase.co')
);

const rawUrl = readEnvValue(import.meta.env.VITE_SUPABASE_URL);
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = readEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const missingSupabaseKeys = [
  isPlaceholderValue(supabaseUrl) && 'VITE_SUPABASE_URL',
  isPlaceholderValue(supabaseAnonKey) && 'VITE_SUPABASE_ANON_KEY'
].filter(Boolean);

export const isSupabaseConfigured = missingSupabaseKeys.length === 0;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;
