import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { splitStreetForForm } from "@/lib/identity/address";

export type UsuarioEndereco = {
  user_id: string;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  localidade: string | null;
  uf: string | null;
  created_at: string;
  updated_at: string;
};

export function useUsuarioEndereco() {
  return useQuery({
    queryKey: ["usuario_endereco"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await (supabase as any)
        .schema("identity")
        .from("profiles")
        .select("id, zip_code, street, complement, neighborhood, city, state, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      const { logradouro, numero } = splitStreetForForm(data.street);
      return {
        user_id: data.id,
        cep: data.zip_code,
        logradouro,
        numero,
        complemento: data.complement,
        bairro: data.neighborhood,
        localidade: data.city,
        uf: data.state,
        created_at: data.created_at,
        updated_at: data.updated_at,
      } as UsuarioEndereco;
    },
  });
}

