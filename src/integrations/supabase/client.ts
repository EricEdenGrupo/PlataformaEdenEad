import { createClient } from "@supabase/supabase-js";
import type { Database as LegacyDatabase } from "./types";
import type { LearningSchema } from "./learning-schema";

export type Database = LegacyDatabase & { learning: LearningSchema };

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").trim();

/** Chave pública: use `anon` (JWT) ou a nova publishable key (`sb_publishable_...`). */
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();

if (!SUPABASE_ANON_KEY) {
  const hint =
    "Defina VITE_SUPABASE_ANON_KEY (legacy) ou VITE_SUPABASE_PUBLISHABLE_KEY no .env. " +
    "Dashboard → Settings → API → anon public / publishable key. Reinicie o `npm run dev` após alterar.";
  if (import.meta.env.DEV) console.error(`[supabase] ${hint}`);
  throw new Error(`[supabase] ${hint}`);
}

if (!SUPABASE_URL) {
  const hint =
    "Defina VITE_SUPABASE_URL no .env. " +
    "Dashboard → Settings → API → Project URL. Reinicie o `npm run dev` após alterar.";
  if (import.meta.env.DEV) console.error(`[supabase] ${hint}`);
  throw new Error(`[supabase] ${hint}`);
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
