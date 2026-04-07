import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cdnPublicAsset } from "@/lib/cdn";

const onlyDigits = (value: string) => value.replace(/\D+/g, "");

/** Celular BR: (DD) 9XXXX-XXXX — mantém a máscara enquanto digita (até 11 dígitos). */
const maskBrazilianMobile = (raw: string) => {
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length === 0) return "";
  let out = `(${d.slice(0, 2)}`;
  if (d.length <= 2) return out;
  const rest = d.slice(2);
  out += ") ";
  if (rest.length <= 5) return out + rest;
  return `${out}${rest.slice(0, 5)}-${rest.slice(5)}`;
};

const isBrazilianMobile = (raw: string) => {
  const d = onlyDigits(raw);
  // Expect DDD (2) + 9 + 8 digits = 11 digits, e.g. 11999998888
  if (d.length !== 11) return false;
  if (d[2] !== "9") return false;
  return true;
};

const parseISODate = (value: string) => {
  // input type="date" provides YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const dt = new Date(`${value}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const cadastroSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe seu nome").max(80),
    sobrenome: z.string().trim().min(2, "Informe seu sobrenome").max(80),
    telefone: z
      .string()
      .trim()
      .refine((v) => isBrazilianMobile(v), "Informe um celular válido (com DDD)"),
    dataNascimento: z
      .string()
      .trim()
      .refine((v) => !!parseISODate(v), "Informe uma data válida")
      .refine((v) => {
        const dt = parseISODate(v);
        if (!dt) return false;
        const min = new Date("1900-01-01T00:00:00");
        const now = new Date();
        return dt >= min && dt <= now;
      }, "Informe uma data de nascimento válida"),
    email: z.string().email("Email inválido").max(255),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(100),
    confirmPassword: z.string().min(6).max(100),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

export default function Cadastro() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthorized } = useAuth();

  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const backgroundStyle = useMemo(
    () => ({ backgroundImage: `url(${cdnPublicAsset("background.png")})` }),
    [],
  );

  useEffect(() => {
    if (user && isAuthorized) {
      navigate("/cursos", { replace: true });
    }
  }, [user, isAuthorized, navigate]);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = cadastroSchema.parse({
        nome,
        sobrenome,
        telefone,
        dataNascimento,
        email,
        password,
        confirmPassword,
      });

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          data: {
            given_name: validated.nome,
            family_name: validated.sobrenome,
            phone: onlyDigits(validated.telefone),
          },
        },
      });

      if (error) {
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const newUser = signUpData.user;
      const session = signUpData.session;
      const pendingEmailConfirm = !session;

      if (!newUser || pendingEmailConfirm) {
        navigate("/cadastro/confirmar-email", {
          replace: true,
          state: { email: validated.email },
        });
        return;
      }

      const { error: profileError } = await (supabase as any)
        .schema("identity")
        .from("profiles")
        .upsert(
        {
          id: newUser.id,
          email: validated.email,
          first_name: validated.nome,
          last_name: validated.sobrenome,
          phone: onlyDigits(validated.telefone),
          country: "BR",
        },
        { onConflict: "id" },
        );

      if (profileError) {
        await supabase.auth.signOut();
        toast({
          title: "Erro ao finalizar cadastro",
          description: "Não foi possível ativar seu acesso. Entre em contato com o suporte.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Você já pode entrar com seu email e senha.",
      });
      navigate("/login", { replace: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: err.errors[0]?.message ?? "Dados inválidos",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Erro inesperado",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
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
          <CardTitle className="text-2xl text-center">Criar conta</CardTitle>
          <CardDescription className="text-center text-white/80">
            Nome e sobrenome são guardados separadamente no seu perfil. Na primeira visita à área de cursos, pediremos
            segmento da empresa, porte e cargo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCadastro} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/90" htmlFor="cadastro-nome">
                Nome
              </Label>
              <Input
                id="cadastro-nome"
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="given-name"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/90" htmlFor="cadastro-sobrenome">
                Sobrenome
              </Label>
              <Input
                id="cadastro-sobrenome"
                type="text"
                placeholder="Seu sobrenome"
                value={sobrenome}
                onChange={(e) => setSobrenome(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="family-name"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/90" htmlFor="cadastro-telefone">
                Celular
              </Label>
              <Input
                id="cadastro-telefone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(maskBrazilianMobile(e.target.value))}
                required
                disabled={isLoading}
                autoComplete="tel"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/90" htmlFor="cadastro-nascimento">
                Data de nascimento
              </Label>
              <Input
                id="cadastro-nascimento"
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="bday"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/90" htmlFor="cadastro-email">
                Email
              </Label>
              <Input
                id="cadastro-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/90" htmlFor="cadastro-password">
                Senha
              </Label>
              <Input
                id="cadastro-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/90" htmlFor="cadastro-confirm">
                Confirmar senha
              </Label>
              <Input
                id="cadastro-confirm"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar conta"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-white/90 hover:text-white hover:bg-white/10"
              onClick={() => navigate("/login")}
              disabled={isLoading}
            >
              Já tenho conta
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

