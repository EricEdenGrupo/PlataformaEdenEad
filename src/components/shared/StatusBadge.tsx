import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export const StatusBadge = ({ status, variant }: StatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
      ativo: { label: "Ativo", variant: "success" },
      ativa: { label: "Ativa", variant: "success" },
      inativo: { label: "Inativo", variant: "secondary" },
      "em analise": { label: "Em Análise", variant: "warning" },
      pendente: { label: "Pendente", variant: "warning" },
      aprovado: { label: "Aprovado", variant: "success" },
      rejeitado: { label: "Rejeitado", variant: "destructive" },
      inadimplente: { label: "Inadimplente", variant: "destructive" },
      expirado: { label: "Expirado", variant: "secondary" },
      completado: { label: "Completado", variant: "success" },
      "em_andamento": { label: "Em Andamento", variant: "outline" },
    };

    return statusMap[status] || { label: status, variant: "secondary" };
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={variant || config.variant as any}>
      {config.label}
    </Badge>
  );
};
