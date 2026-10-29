import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://ompqsnpvybzgjikwhzjs.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  'placeholder-supabase-key';

export const supabaseServerClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function verifySupabaseToken(token: string): Promise<{
  id: string;
  email?: string;
  userMetadata?: Record<string, unknown>;
} | null> {
  try {
    const { data, error } = await supabaseServerClient.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    return {
      id: data.user.id,
      email: data.user.email,
      userMetadata: data.user.user_metadata,
    };
  } catch (err) {
    console.error('Failed to verify Supabase token:', err);
    return null;
  }
}
