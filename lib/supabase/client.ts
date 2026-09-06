import { createClient } from "@supabase/supabase-js";

// URL + clé "anon" : non secrètes par conception (la sécurité vient de la
// Row Level Security côté base de données, pas du secret de cette clé).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);
