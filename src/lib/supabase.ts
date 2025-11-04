import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  created_at: string;
  name: string;
  role: string;
  avatar_url: string | null;
}

export interface Waifu {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  role: string;
  image_url: string;
}
