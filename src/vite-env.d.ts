/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  /** Legacy JWT anon key (eyJ...) */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Nova chave publicável (sb_publishable_...) — alternativa ao anon */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  /** URL base do bucket S3 (sem pasta), ex: https://bucket.s3.us-east-1.amazonaws.com */
  readonly VITE_S3_BUCKET_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
