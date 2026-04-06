import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUpsertKyc } from "@/hooks/learning/useUpsertKyc";
import type { OnboardingAnswers } from "@/hooks/learning/useKyc";
import {
  COMPANY_SEGMENT_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  type CompanySegmentValue,
  type CompanySizeValue,
} from "@/lib/identity/onboarding-options";

const SEGMENT_VALUES = COMPANY_SEGMENT_OPTIONS.map(
  (o) => o.value,
) as [CompanySegmentValue, ...CompanySegmentValue[]];
const SIZE_VALUES = COMPANY_SIZE_OPTIONS.map((o) => o.value) as [CompanySizeValue, ...CompanySizeValue[]];

const schema = z.object({
  company_segment: z.enum(SEGMENT_VALUES, { message: "Selecione o segmento da empresa" }),
  company_size: z.enum(SIZE_VALUES, { message: "Selecione o porte da empresa" }),
  job_title: z
    .string()
    .trim()
    .min(2, "Descreva seu cargo ou função (mínimo 2 caracteres)")
    .max(120, "Cargo ou função muito longo"),
});

type Props = {
  kyc: OnboardingAnswers | null | undefined;
  isLoading: boolean;
  /** Vindo de `identity.profiles.onboarding_done`; se true, onboarding já concluído no banco. */
  onboardingDone: boolean | undefined;
  profileLoading: boolean;
};

export function OnboardingSegmentationModal({
  kyc,
  isLoading,
  onboardingDone,
  profileLoading,
}: Props) {
  const { toast } = useToast();
  const upsertKyc = useUpsertKyc();

  const needsOnboarding = useMemo(() => {
    if (isLoading || profileLoading) return false;
    if (onboardingDone === true) return false;
    if (kyc === undefined) return false;
    if (kyc === null) return true;
    return (
      !kyc.company_segment ||
      !kyc.company_size ||
      !String(kyc.job_title ?? "").trim()
    );
  }, [kyc, isLoading, profileLoading, onboardingDone]);

  const [open, setOpen] = useState(false);
  const [companySegment, setCompanySegment] = useState<CompanySegmentValue | "">("");
  const [companySize, setCompanySize] = useState<CompanySizeValue | "">("");
  const [jobTitle, setJobTitle] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!needsOnboarding) {
      setOpen(false);
      return;
    }

    setCompanySegment((kyc?.company_segment as CompanySegmentValue) || "");
    setCompanySize((kyc?.company_size as CompanySizeValue) || "");
    setJobTitle(kyc?.job_title ?? "");
    setOpen(true);
  }, [kyc, isLoading, needsOnboarding]);

  const onSave = async () => {
    const parsed = schema.safeParse({
      company_segment: companySegment,
      company_size: companySize,
      job_title: jobTitle,
    });
    if (!parsed.success) {
      toast({
        title: "Complete as informações",
        description: parsed.error.errors[0]?.message ?? "Dados inválidos",
        variant: "destructive",
      });
      return;
    }

    try {
      await upsertKyc.mutateAsync(parsed.data);
      toast({
        title: "Obrigado!",
        description: "Suas respostas foram salvas.",
      });
      setOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && needsOnboarding) return;
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        onEscapeKeyDown={(e) => {
          if (needsOnboarding) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (needsOnboarding) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Queremos te conhecer melhor</DialogTitle>
          <DialogDescription>
            Informe o segmento e o porte da sua empresa e seu cargo ou função. Isso ajuda a adequar conteúdos ao seu
            contexto.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="company_segment">Segmento da empresa</Label>
            <select
              id="company_segment"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={companySegment}
              onChange={(e) => setCompanySegment(e.target.value as CompanySegmentValue)}
              disabled={upsertKyc.isPending}
            >
              <option value="" disabled>
                Selecione…
              </option>
              {COMPANY_SEGMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="company_size">Porte da empresa (número de colaboradores)</Label>
            <select
              id="company_size"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value as CompanySizeValue)}
              disabled={upsertKyc.isPending}
            >
              <option value="" disabled>
                Selecione…
              </option>
              {COMPANY_SIZE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="job_title">Cargo ou função</Label>
            <Input
              id="job_title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Ex.: Gerente de operações, Analista de compras…"
              disabled={upsertKyc.isPending}
              autoComplete="organization-title"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onSave} disabled={upsertKyc.isPending}>
            {upsertKyc.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
