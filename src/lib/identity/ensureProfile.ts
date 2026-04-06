import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type IdentityProfileGate = {
  id: string;
  deleted_at: string | null;
};

/**
 * Garante uma linha em identity.profiles para o usuário autenticado.
 * Evita 406 do PostgREST (`.single()` com 0 linhas) quando o trigger handle_new_user não criou o perfil.
 */
export async function ensureIdentityProfile(user: User): Promise<IdentityProfileGate | null> {
  const client = supabase as any;

  const { data: existing, error: readErr } = await client
    .schema("identity")
    .from("profiles")
    .select("id, deleted_at")
    .eq("id", user.id)
    .maybeSingle();

  if (readErr) {
    console.error("[identity] profiles read:", readErr);
    return null;
  }
  if (existing) return existing as IdentityProfileGate;

  const email = user.email?.trim();
  if (!email) {
    console.error("[identity] sem email no User do Auth; não é possível criar profile.");
    return null;
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const str = (k: string) => (typeof meta[k] === "string" ? (meta[k] as string).trim() : "");

  let firstName = str("given_name") || str("full_name") || email.split("@")[0] || "Usuário";
  let lastName = str("family_name");

  firstName = firstName.slice(0, 80) || "Usuário";
  lastName = lastName.slice(0, 80);
  if (!lastName) lastName = "—";

  const { data: created, error: writeErr } = await client
    .schema("identity")
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        country: "BR",
      },
      { onConflict: "id" },
    )
    .select("id, deleted_at")
    .maybeSingle();

  if (writeErr) {
    console.error("[identity] profiles upsert:", writeErr);
    return null;
  }

  return (created ?? null) as IdentityProfileGate | null;
}
