import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { joinStreetFromForm } from "@/lib/identity/address";

export type UpsertUsuarioEnderecoInput = {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  localidade?: string | null;
  uf?: string | null;
};

export function useUpsertUsuarioEndereco() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertUsuarioEnderecoInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const street = joinStreetFromForm(input.logradouro ?? "", input.numero ?? "");

      const { error } = await (supabase as any)
        .schema("identity")
        .from("profiles")
        .update({
          zip_code: input.cep ?? null,
          street: street || null,
          complement: input.complemento ?? null,
          neighborhood: input.bairro ?? null,
          city: input.localidade ?? null,
          state: input.uf ?? null,
        })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuario_endereco"] });
      queryClient.invalidateQueries({ queryKey: ["usuario"] });
    },
  });
}

