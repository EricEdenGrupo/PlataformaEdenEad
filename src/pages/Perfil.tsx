import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, MapPin, Phone, Lock, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUsuario } from "@/hooks/useUsuario";
import { useUpdateUsuario } from "@/hooks/useUpdateUsuario";
import { useUsuarioEndereco } from "@/hooks/useUsuarioEndereco";
import { useUpsertUsuarioEndereco } from "@/hooks/useUpsertUsuarioEndereco";
import { supabase } from "@/integrations/supabase/client";

const perfilSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter no mínimo 2 caracteres").max(80, "Nome deve ter no máximo 80 caracteres"),
  sobrenome: z.string().trim().min(2, "Sobrenome deve ter no mínimo 2 caracteres").max(80, "Sobrenome deve ter no máximo 80 caracteres"),
  telefone: z.string().trim().max(20, "Telefone deve ter no máximo 20 caracteres").optional().or(z.literal("")),
});

type PerfilFormValues = z.infer<typeof perfilSchema>;

const onlyDigits = (value: string) => value.replace(/\D+/g, "");

const enderecoSchema = z.object({
  cep: z
    .string()
    .trim()
    .refine((v) => onlyDigits(v).length === 8, "Informe um CEP válido (8 dígitos)"),
  logradouro: z.string().trim().min(1, "Informe o logradouro").max(200),
  numero: z.string().trim().min(1, "Informe o número").max(20),
  complemento: z.string().trim().max(100).optional().or(z.literal("")),
  bairro: z.string().trim().min(1, "Informe o bairro").max(100),
  localidade: z.string().trim().min(1, "Informe a cidade").max(100),
  uf: z.string().trim().length(2, "UF inválida"),
});

type EnderecoFormValues = z.infer<typeof enderecoSchema>;

const senhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual"),
    novaSenha: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
    confirmarSenha: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((v) => v.novaSenha === v.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

type SenhaFormValues = z.infer<typeof senhaSchema>;

const Perfil = () => {
  const { toast } = useToast();
  const { data: usuario, isLoading } = useUsuario();
  const updateUsuario = useUpdateUsuario();
  const { data: endereco } = useUsuarioEndereco();
  const upsertEndereco = useUpsertUsuarioEndereco();
  const [buscandoCep, setBuscandoCep] = useState(false);

  const perfilForm = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nome: "",
      sobrenome: "",
      telefone: "",
    },
  });

  const senhaForm = useForm<SenhaFormValues>({
    resolver: zodResolver(senhaSchema),
    defaultValues: {
      senhaAtual: "",
      novaSenha: "",
      confirmarSenha: "",
    },
  });

  useEffect(() => {
    if (usuario) {
      perfilForm.reset({
        nome: usuario.nome || "",
        sobrenome: usuario.sobrenome || "",
        telefone: usuario.telefone || "",
      });
    }
  }, [usuario, perfilForm]);

  const enderecoForm = useForm<EnderecoFormValues>({
    resolver: zodResolver(enderecoSchema),
    defaultValues: {
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      localidade: "",
      uf: "",
    },
  });

  useEffect(() => {
    if (endereco) {
      enderecoForm.reset({
        cep: endereco.cep || "",
        logradouro: endereco.logradouro || "",
        numero: endereco.numero || "",
        complemento: endereco.complemento || "",
        bairro: endereco.bairro || "",
        localidade: endereco.localidade || "",
        uf: endereco.uf || "",
      });
    }
  }, [endereco, enderecoForm]);

  const cepValue = enderecoForm.watch("cep");
  const normalizedCep = useMemo(() => onlyDigits(cepValue || ""), [cepValue]);

  const buscarCep = async () => {
    const cepDigits = normalizedCep;
    if (cepDigits.length !== 8) {
      enderecoForm.setError("cep", { type: "validate", message: "Informe um CEP válido (8 dígitos)" });
      return;
    }

    setBuscandoCep(true);
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      if (!resp.ok) {
        throw new Error("CEP inválido");
      }
      const data = (await resp.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
        cep?: string;
      };

      if (data?.erro) {
        enderecoForm.setError("cep", { type: "validate", message: "CEP não encontrado" });
        return;
      }

      enderecoForm.setValue("logradouro", data.logradouro ?? "", { shouldValidate: true });
      enderecoForm.setValue("bairro", data.bairro ?? "", { shouldValidate: true });
      enderecoForm.setValue("localidade", data.localidade ?? "", { shouldValidate: true });
      enderecoForm.setValue("uf", data.uf ?? "", { shouldValidate: true });
      toast({ title: "CEP encontrado", description: "Endereço preenchido. Complete número/complemento." });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao consultar CEP";
      toast({ title: "Erro ao consultar CEP", description: message, variant: "destructive" });
    } finally {
      setBuscandoCep(false);
    }
  };

  const onSubmitEndereco = async (data: EnderecoFormValues) => {
    try {
      await upsertEndereco.mutateAsync({
        cep: normalizedCep,
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento || null,
        bairro: data.bairro,
        localidade: data.localidade,
        uf: data.uf.toUpperCase(),
      });
      toast({ title: "Sucesso", description: "Endereço salvo com sucesso!" });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao salvar endereço";
      toast({ title: "Erro", description: message, variant: "destructive" });
    }
  };

  const onSubmitPerfil = async (data: PerfilFormValues) => {
    try {
      await updateUsuario.mutateAsync({
        nome: data.nome,
        sobrenome: data.sobrenome,
        telefone: data.telefone || undefined,
      });
      toast({
        title: "Sucesso",
        description: "Dados atualizados com sucesso!",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar dados";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    }
  };

  const [savingSenha, setSavingSenha] = useState(false);

  const onSubmitSenha = async (data: SenhaFormValues) => {
    if (!usuario?.email) {
      toast({
        title: "Erro",
        description: "E-mail do usuário não encontrado.",
        variant: "destructive",
      });
      return;
    }
    setSavingSenha(true);
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: usuario.email,
        password: data.senhaAtual,
      });
      if (signErr) {
        throw new Error(signErr.message === "Invalid login credentials" ? "Senha atual incorreta" : signErr.message);
      }
      const { error: updErr } = await supabase.auth.updateUser({ password: data.novaSenha });
      if (updErr) throw new Error(updErr.message);
      senhaForm.reset();
      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso.",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao alterar senha";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSavingSenha(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas informações pessoais
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Dados Pessoais</CardTitle>
          </div>
          <CardDescription>
            Nome e sobrenome são armazenados separadamente (como no cadastro). O telefone fica no seu perfil para
            contato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...perfilForm}>
            <form onSubmit={perfilForm.handleSubmit(onSubmitPerfil)} className="space-y-4">
              <div className="rounded-md border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="break-all">
                    <span className="font-medium text-foreground">E-mail: </span>
                    {usuario?.email ?? "—"}
                  </span>
                </div>
                <p className="mt-1 text-xs">O e-mail vem da conta de acesso e não pode ser alterado aqui.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={perfilForm.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input {...field} className="pl-10" placeholder="Seu nome" autoComplete="given-name" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={perfilForm.control}
                  name="sobrenome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobrenome</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Seu sobrenome" autoComplete="family-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={perfilForm.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          className="pl-10"
                          placeholder="(00) 00000-0000"
                          type="tel"
                          autoComplete="tel"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={updateUsuario.isPending} className="w-full sm:w-auto">
                {updateUsuario.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle>Endereço</CardTitle>
          </div>
          <CardDescription>
            Endereço é guardado no seu perfil (rua e número são combinados internamente). Use a busca por CEP e complete
            o número e o complemento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...enderecoForm}>
            <form onSubmit={enderecoForm.handleSubmit(onSubmitEndereco)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <FormField
                  control={enderecoForm.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="00000000" inputMode="numeric" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="secondary" onClick={buscarCep} disabled={buscandoCep}>
                  {buscandoCep ? "Buscando..." : "Buscar CEP"}
                </Button>
              </div>

              <FormField
                control={enderecoForm.control}
                name="logradouro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logradouro (sem número)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Rua, avenida…"
                        readOnly
                        aria-readonly="true"
                        className="bg-muted/40"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={enderecoForm.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número (no endereço)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={enderecoForm.control}
                  name="complemento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Apartamento, bloco…" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={enderecoForm.control}
                name="bairro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Seu bairro"
                        readOnly
                        aria-readonly="true"
                        className="bg-muted/40"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={enderecoForm.control}
                  name="localidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Sua cidade"
                          readOnly
                          aria-readonly="true"
                          className="bg-muted/40"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={enderecoForm.control}
                  name="uf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="SP"
                          maxLength={2}
                          readOnly
                          aria-readonly="true"
                          className="bg-muted/40"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={upsertEndereco.isPending} className="w-full sm:w-auto">
                {upsertEndereco.isPending ? "Salvando..." : "Salvar Endereço"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle>Segurança</CardTitle>
          </div>
          <CardDescription>
            Altere sua senha de acesso. Será solicitada a senha atual para confirmar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...senhaForm}>
            <form onSubmit={senhaForm.handleSubmit(onSubmitSenha)} className="space-y-4">
              <FormField
                control={senhaForm.control}
                name="senhaAtual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha atual</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" autoComplete="current-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={senhaForm.control}
                name="novaSenha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova senha</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" autoComplete="new-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={senhaForm.control}
                name="confirmarSenha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar nova senha</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" autoComplete="new-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={savingSenha} className="w-full sm:w-auto">
                {savingSenha ? "Alterando..." : "Alterar senha"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Perfil;
