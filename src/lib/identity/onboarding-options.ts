/**
 * Valores do enum `public.company_segment` / `public.company_size` (Postgres)
 * com rótulos em português (Brasil) para o formulário.
 */

export type CompanySegmentValue =
  | "Tecnologia"
  | "Instituição Financeira"
  | "Saúde"
  | "Educação"
  | "Varejo"
  | "Farmacia"
  | "Industria"
  | "Consultoria"
  | "Distribuidora"
  | "Governo"
  | "Outros";

export type CompanySizeValue = "micro" | "pequeno" | "medio" | "grande";

export const COMPANY_SEGMENT_OPTIONS: { value: CompanySegmentValue; label: string }[] = [
  { value: "Tecnologia", label: "Tecnologia" },
  { value: "Instituição Financeira", label: "Instituição financeira" },
  { value: "Saúde", label: "Saúde" },
  { value: "Educação", label: "Educação" },
  { value: "Varejo", label: "Varejo" },
  { value: "Farmacia", label: "Farmácia" },
  { value: "Industria", label: "Indústria" },
  { value: "Consultoria", label: "Consultoria" },
  { value: "Distribuidora", label: "Distribuidora" },
  { value: "Governo", label: "Governo" },
  { value: "Outros", label: "Outros" },
];

export const COMPANY_SIZE_OPTIONS: { value: CompanySizeValue; label: string }[] = [
  { value: "micro", label: "Micro (1 a 9 funcionários)" },
  { value: "pequeno", label: "Pequeno (10 a 49 funcionários)" },
  { value: "medio", label: "Médio (50 a 249 funcionários)" },
  { value: "grande", label: "Grande (250 a 999 funcionários)" },
];
