import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ensureIdentityProfile } from "@/lib/identity/ensureProfile";

export interface Usuario {
  id: string;
  email: string;
  nome: string | null;
  telefone: string | null;
  sobrenome: string | null;
  /** Sincronizado com `identity.profiles.onboarding_done` (true após salvar onboarding). */
  onboarding_done: boolean;
  data_nascimento: string | null;
  area_trabalho: string | null;
  cargo: string | null;
  status: "ativo" | "desativado";
  created_at: string;
  updated_at: string;
}

export const useUsuario = () => {
  return useQuery({
    queryKey: ["usuario"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      await ensureIdentityProfile(user);

      const { data, error } = await (supabase as any)
        .schema("identity")
        .from("profiles")
        .select("id,email,first_name,last_name,phone,onboarding_done,created_at,updated_at,deleted_at")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Perfil não encontrado após sincronizar");

      return {
        id: data.id,
        email: data.email,
        nome: data.first_name,
        sobrenome: data.last_name,
        telefone: data.phone,
        onboarding_done: data.onboarding_done === true,
        data_nascimento: null,
        area_trabalho: null,
        cargo: null,
        status: data.deleted_at ? "desativado" : "ativo",
        created_at: data.created_at,
        updated_at: data.updated_at,
      } as Usuario;
    },
  });
};
