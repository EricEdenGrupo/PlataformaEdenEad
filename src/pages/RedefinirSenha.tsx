import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cdnPublicAsset } from "@/lib/cdn";

const passwordSchema = z
  .object({
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(100),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

const RedefinirSenha = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const backgroundStyle = useMemo(
    () => ({
      backgroundImage: `url(${cdnPublicAsset("assets/background.png")})`,
    }),
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = passwordSchema.parse({ password, confirmPassword });
      const { error } = await supabase.auth.updateUser({ password: validated.password });

      if (error) {
        toast({
          title: "Erro ao redefinir senha",
          description: "Link inválido ou expirado. Solicite uma nova recuperação.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi redefinida com sucesso.",
      });
      navigate("/login", { replace: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={[
        "relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4",
        "bg-center bg-cover bg-no-repeat",
      ].join(" ")}
      style={backgroundStyle}
    >
      <div className="absolute inset-0 bg-black/35" />

      <Card className="relative z-10 w-full max-w-md border-white/20 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img
              src={cdnPublicAsset("assets/eden-logo-black.png")}
              alt="Éden Educação"
              className="h-10 w-auto select-none"
              draggable={false}
            />
            <span className="sr-only">Éden Educação</span>
          </div>
          <CardTitle className="text-2xl text-center">Redefinir senha</CardTitle>
          <CardDescription className="text-center text-white/80">
            Digite sua nova senha para finalizar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/90" htmlFor="new-password">
                Nova senha
              </Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/90" htmlFor="confirm-new-password">
                Confirmar senha
              </Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Atualizando..." : "Salvar nova senha"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-white/90 hover:text-white hover:bg-white/10"
              onClick={() => navigate("/esqueci-senha")}
              disabled={isLoading}
            >
              Solicitar novo link
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RedefinirSenha;
