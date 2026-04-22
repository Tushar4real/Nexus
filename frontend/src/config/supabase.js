import { createClient } from '@supabase/supabase-js';

const runtimeEnv = typeof window !== 'undefined' ? window.__NEXUS_ENV__ || {} : {};
const rawUrl = runtimeEnv.VITE_SUPABASE_URL?.trim() || import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = runtimeEnv.VITE_SUPABASE_ANON_KEY?.trim() || import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

export const missingSupabaseKeys = [
  !supabaseUrl && 'VITE_SUPABASE_URL',
  !supabaseAnonKey && 'VITE_SUPABASE_ANON_KEY'
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
