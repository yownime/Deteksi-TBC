import { createClient } from '@supabase/supabase-js';

// Support both standard names and Vercel/Supabase integration auto-generated names
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://placeholder-project.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "placeholder-anon-key";

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  "placeholder-service-key";

// Client-side client
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client (bypasses RLS)
export const getSupabaseAdminClient = () => {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      `Supabase belum dikonfigurasi! ` +
      `URL: ${url ? '✅' : '❌ KOSONG'}, ` +
      `Service Key: ${serviceKey ? '✅' : '❌ KOSONG'}. ` +
      `Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY (atau SUPABASE_SECRET_KEY) di env.`
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
