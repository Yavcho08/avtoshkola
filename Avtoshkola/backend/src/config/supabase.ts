import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing required env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.'
  );
}

// Service-role client — bypasses Row Level Security.
// NEVER expose this key to the frontend; use it only inside this Express backend.
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      // Disable automatic token refresh and session persistence —
      // the backend is stateless; each request carries its own JWT.
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
