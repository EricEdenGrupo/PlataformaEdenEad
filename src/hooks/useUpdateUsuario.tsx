import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UpdateUsuarioData {
  nome?: string;
  sobrenome?: string;
  telefone?: string;
  data_nascimento?: string;
  area_trabalho?: string;
  cargo?: string;
}

export const useUpdateUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUsuarioData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const payload: Record<string, unknown> = {};
      if (data.nome !== undefined) payload.first_name = data.nome;
      if (data.sobrenome !== undefined) payload.last_name = data.sobrenome;
      if (data.telefone !== undefined) payload.phone = data.telefone;

      const { error } = await (supabase as any)
        .schema("identity")
        .from("profiles")
        .update(payload)
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuario"] });
    },
  });
};
