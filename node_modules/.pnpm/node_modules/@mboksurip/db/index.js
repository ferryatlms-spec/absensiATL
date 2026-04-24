// packages/db/index.js
import { createClient } from '@supabase/supabase-js';

// Vite secara otomatis memetakan variabel VITE_ ke object ini
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL atau Key tidak ditemukan! Periksa file .env anda.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);