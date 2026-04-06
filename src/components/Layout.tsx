import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AppSearchProvider } from "@/contexts/AppSearchContext";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingSegmentationModal } from "@/components/OnboardingSegmentationModal";
import { useKyc } from "@/hooks/learning/useKyc";
import { useUsuario } from "@/hooks/useUsuario";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: kyc, isLoading: kycLoading } = useKyc();
  const { data: usuario, isLoading: profileLoading } = useUsuario();

  const initials = (() => {
    const meta = user?.user_metadata as { nome?: string } | undefined;
    const n = typeof meta?.nome === "string" ? meta.nome.trim() : "";
    if (n) {
      const parts = n.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return parts[0]?.slice(0, 2).toUpperCase() || "?";
    }
    const e = user?.email?.trim();
    if (e) return e.slice(0, 2).toUpperCase();
    return "?";
  })();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    toast({
      title: "Desconectado com sucesso",
      description: "Até logo!",
    });
  };

  const handleComingSoon = () =>
    toast({
      title: "Em breve",
      description: "Estamos preparando essa área.",
    });

  return (
    <AppSearchProvider>
      <div className="min-h-screen w-full bg-background">
      <OnboardingSegmentationModal
        kyc={kyc}
        isLoading={kycLoading}
        onboardingDone={usuario?.onboarding_done}
        profileLoading={profileLoading}
      />
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 md:px-6">
          <Link to="/cursos" className="flex items-center gap-2 shrink-0">
            <img
              src="/eden-logo.png"
              alt="Éden Educação"
              className="h-9 w-auto select-none"
              draggable={false}
            />
            <span className="sr-only">Éden Educação</span>
          </Link>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              onClick={handleComingSoon}
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
                  <ChevronDown className="h-5 w-5 rotate-90" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="p-0">
                <div className="px-4 py-3 grid gap-1">
                  <Button variant="ghost" className="justify-start" onClick={() => navigate("/cursos")}>
                    Cursos
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => navigate("/perfil")}>
                    Settings
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 px-2 gap-2">
                  <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start leading-none">
                    <span className="text-sm font-medium">
                      {typeof (user?.user_metadata as { nome?: string } | undefined)?.nome === "string"
                        ? ((user?.user_metadata as { nome?: string }).nome ?? "Conta")
                        : "Conta"}
                    </span>
                    <span className="text-xs text-muted-foreground">{user?.email ?? ""}</span>
                  </div>
                  <ChevronDown className="hidden lg:block h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate("/perfil")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/perfil")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Desconectar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="w-full">{children}</main>
      </div>
    </AppSearchProvider>
  );
};

export default Layout;
