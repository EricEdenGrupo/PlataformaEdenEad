import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CompanySegmentValue, CompanySizeValue } from "@/lib/identity/onboarding-options";

/** Resposta alinhada a `identity.onboarding_answers`. */
export type OnboardingAnswers = {
  profile_id: string;
  company_segment: CompanySegmentValue | null;
  company_size: CompanySizeValue | null;
  job_title: string | null;
  created_at: string;
  updated_at: string;
};

/** @deprecated use OnboardingAnswers */
export type KycRow = OnboardingAnswers;

export function useKyc() {
  return useQuery({
    queryKey: ["learning", "kyc"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await (supabase as any)
        .schema("identity")
        .from("onboarding_answers")
        .select("profile_id, company_segment, company_size, job_title, created_at, updated_at")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[useKyc] Falha ao buscar identity.onboarding_answers:", error);
        return null as OnboardingAnswers | null;
      }
      if (!data) return null;
      return {
        profile_id: data.profile_id,
        company_segment: data.company_segment,
        company_size: data.company_size,
        job_title: data.job_title,
        created_at: data.created_at,
        updated_at: data.updated_at,
      } as OnboardingAnswers;
    },
  });
}
