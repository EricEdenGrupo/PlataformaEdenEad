/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  /** Legacy JWT anon key (eyJ...) */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Nova chave publicável (sb_publishable_...) — alternativa ao anon */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  readonly VITE_MAUTIC_FORM_ACTION?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
