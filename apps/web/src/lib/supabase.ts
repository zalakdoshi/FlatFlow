import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ompqsnpvybzgjikwhzjs.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabasePublishableKey &&
  supabasePublishableKey !== 'replace_with_publishable_key' &&
  !supabasePublishableKey.includes('replace_with')
);

// Fallback dummy key to prevent runtime initialization crashes when key is not yet pasted
const effectiveKey = isSupabaseConfigured ? supabasePublishableKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key';

export const supabase = createClient(supabaseUrl, effectiveKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
