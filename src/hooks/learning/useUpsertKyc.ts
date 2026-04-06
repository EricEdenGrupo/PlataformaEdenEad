import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CompanySegmentValue, CompanySizeValue } from "@/lib/identity/onboarding-options";

export type UpsertOnboardingAnswersInput = {
  company_segment: CompanySegmentValue;
  company_size: CompanySizeValue;
  job_title: string;
};

export function useUpsertKyc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertOnboardingAnswersInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await (supabase as any)
        .schema("identity")
        .from("onboarding_answers")
        .upsert(
          {
            profile_id: user.id,
            company_segment: input.company_segment,
            company_size: input.company_size,
            job_title: input.job_title.trim(),
          },
          { onConflict: "profile_id" },
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning", "kyc"] });
      queryClient.invalidateQueries({ queryKey: ["usuario"] });
    },
  });
}
