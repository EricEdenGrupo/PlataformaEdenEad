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

const emailSchema = z.object({
  email: z.string().email("Email inválido").max(255),
});

const EsqueciSenha = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
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
      const validated = emailSchema.parse({ email });
      const redirectTo = `${window.location.origin}/redefinir-senha`;

      const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
        redirectTo,
      });

      if (error) {
        toast({
          title: "Erro ao enviar recuperação",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email enviado",
        description: "Se o email existir, você receberá instruções para redefinir a senha.",
      });
      navigate("/login");
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
          <CardTitle className="text-2xl text-center">Recuperar senha</CardTitle>
          <CardDescription className="text-center text-white/80">
            Informe seu email para receber o link de redefinição
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/90" htmlFor="recovery-email">
                Email
              </Label>
              <Input
                id="recovery-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar link de recuperação"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-white/90 hover:text-white hover:bg-white/10"
              onClick={() => navigate("/login")}
              disabled={isLoading}
            >
              Voltar para login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EsqueciSenha;
