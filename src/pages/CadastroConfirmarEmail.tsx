import { useEffect, useMemo } from "react";
import { Mail } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { cdnPublicAsset } from "@/lib/cdn";

type LocationState = { email?: string };

export default function CadastroConfirmarEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthorized } = useAuth();
  const email = ((location.state as LocationState | null)?.email ?? "").trim();

  const backgroundStyle = useMemo(
    () => ({ backgroundImage: `url(${cdnPublicAsset("assets/background.png")})` }),
    [],
  );

  useEffect(() => {
    if (user && isAuthorized) {
      navigate("/cursos", { replace: true });
    }
  }, [user, isAuthorized, navigate]);

  if (!email) {
    return <Navigate to="/cadastro" replace />;
  }

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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
            <Mail className="h-7 w-7 text-white/90" aria-hidden />
          </div>
          <CardTitle className="text-2xl text-center pt-2">Cadastro criado com sucesso</CardTitle>
          <CardDescription className="text-center text-white/80">
            Enviamos um link de confirmação para{" "}
            <span className="font-medium text-white break-all">{email}</span>. Abra a mensagem e confirme seu email
            para ativar a conta. Se não encontrar, verifique a pasta de spam.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button type="button" className="w-full" onClick={() => navigate("/login", { replace: true })}>
            Ir para o login
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-white/90 hover:text-white hover:bg-white/10"
            onClick={() => navigate("/cadastro", { replace: true })}
          >
            Voltar ao cadastro
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
