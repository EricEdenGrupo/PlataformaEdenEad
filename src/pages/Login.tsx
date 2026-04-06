import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ensureIdentityProfile } from "@/lib/identity/ensureProfile";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(100),
});

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthorized } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [gifDurationMs, setGifDurationMs] = useState<number | null>(null);
  const didSubmitLoginRef = useRef(false);

  const backgroundStyle = useMemo(
    () => ({ backgroundImage: `url(${isTransitioning ? "/background.gif" : "/background.png"})` }),
    [isTransitioning],
  );

  useEffect(() => {
    let cancelled = false;

    const parseGifDurationMs = (bytes: Uint8Array) => {
      let i = 0;
      const read = () => bytes[i++];
      const readU16 = () => {
        const lo = read();
        const hi = read();
        return lo | (hi << 8);
      };

      // Header (GIF87a / GIF89a)
      if (
        bytes.length < 14 ||
        bytes[0] !== 0x47 ||
        bytes[1] !== 0x49 ||
        bytes[2] !== 0x46 ||
        bytes[3] !== 0x38 ||
        (bytes[4] !== 0x39 && bytes[4] !== 0x37) ||
        bytes[5] !== 0x61
      ) {
        return null;
      }
      i = 6;

      // Logical Screen Descriptor
      readU16(); // width
      readU16(); // height
      const packed = read();
      read(); // bg color index
      read(); // pixel aspect ratio
      const hasGct = (packed & 0x80) !== 0;
      const gctSize = 3 * (1 << ((packed & 0x07) + 1));
      if (hasGct) i += gctSize;

      let totalDelayCs = 0; // hundredths of a second

      const skipSubBlocks = () => {
        while (i < bytes.length) {
          const size = read();
          if (size === 0) break;
          i += size;
        }
      };

      while (i < bytes.length) {
        const b = read();
        if (b === 0x3b) break; // trailer

        if (b === 0x21) {
          const label = read();
          if (label === 0xf9) {
            const blockSize = read(); // usually 4
            if (blockSize !== 4) {
              i += blockSize;
              read(); // terminator
              continue;
            }
            read(); // packed fields
            const delayCs = readU16();
            totalDelayCs += delayCs;
            read(); // transparent color index
            read(); // terminator
            continue;
          }

          // application/comment/plain text extensions
          skipSubBlocks();
          continue;
        }

        if (b === 0x2c) {
          // Image Descriptor
          i += 8; // left/top/width/height
          const imgPacked = read();
          const hasLct = (imgPacked & 0x80) !== 0;
          const lctSize = 3 * (1 << ((imgPacked & 0x07) + 1));
          if (hasLct) i += lctSize;
          read(); // LZW min code size
          skipSubBlocks();
          continue;
        }

        // Unknown block; stop parsing
        break;
      }

      const ms = totalDelayCs * 10;
      return ms > 0 ? ms : null;
    };

    const loadGifDuration = async () => {
      try {
        const res = await fetch("/background.gif", { cache: "force-cache" });
        if (!res.ok) return;
        const buf = await res.arrayBuffer();
        const ms = parseGifDurationMs(new Uint8Array(buf));
        if (!cancelled) setGifDurationMs(ms);
      } catch {
        // ignore; we'll fallback to a sane delay
      }
    };

    loadGifDuration();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (didSubmitLoginRef.current) return;
    if (user && isAuthorized) {
      navigate("/cursos", { replace: true });
    }
  }, [user, isAuthorized, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    didSubmitLoginRef.current = true;
    setIsLoading(true);

    try {
      const validated = authSchema.parse({ email: loginEmail, password: loginPassword });

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Erro ao fazer login",
            description: "Email ou senha incorretos",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao fazer login",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      const profile = await ensureIdentityProfile(authData.user);

      if (!profile) {
        await supabase.auth.signOut();
        toast({
          title: "Erro ao verificar cadastro",
          description: "Não foi possível criar ou carregar seu perfil. Verifique se a migração do banco está aplicada e se o schema identity está exposto na API do Supabase.",
          variant: "destructive",
        });
        return;
      }

      if (profile.deleted_at) {
        await supabase.auth.signOut();
        toast({
          title: "Conta inativa",
          description: "Sua conta está desativada. Entre em contato com o suporte.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo à área de cursos.",
      });

      setIsTransitioning(true);
      const waitMs = gifDurationMs ?? 2500;
      await new Promise((r) => setTimeout(r, waitMs));
      navigate("/cursos", { replace: true });
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
              src="/eden-logo.png"
              alt="Éden Educação"
              className="h-10 w-auto select-none"
              draggable={false}
            />
            <span className="sr-only">Éden Educação</span>
          </div>
          <CardTitle className="text-2xl text-center">Bem-vindo</CardTitle>
          <CardDescription className="text-center text-white/80">
            Entre com seu e-mail e senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/90" htmlFor="login-email">
                Email
              </Label>
              <Input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                disabled={isLoading || isTransitioning}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/90" htmlFor="login-password">
                Senha
              </Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                disabled={isLoading || isTransitioning}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || isTransitioning}>
              {isTransitioning ? "Carregando..." : isLoading ? "Entrando..." : "Entrar"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-white/90 hover:text-white hover:bg-white/10"
              onClick={() => navigate("/cadastro")}
              disabled={isLoading || isTransitioning}
            >
              Cadastrar nova conta
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
