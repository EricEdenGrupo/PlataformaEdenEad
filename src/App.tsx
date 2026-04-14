import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "./pages/Login";
import Cadastro from "@/pages/Cadastro";
import CadastroConfirmarEmail from "@/pages/CadastroConfirmarEmail";
import EsqueciSenha from "@/pages/EsqueciSenha";
import RedefinirSenha from "@/pages/RedefinirSenha";
import Cursos from "./pages/Cursos";
import Course from "./pages/Course";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const RootRedirect = () => {
  const location = useLocation();
  const hashParams = new URLSearchParams(location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(location.search);
  const isPasswordRecovery =
    hashParams.get("type") === "recovery" || searchParams.get("type") === "recovery";

  if (isPasswordRecovery) {
    return (
      <Navigate
        to={{
          pathname: "/redefinir-senha",
          search: location.search,
          hash: location.hash,
        }}
        replace
      />
    );
  }

  return <Navigate to="/cursos" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/cadastro/confirmar-email" element={<CadastroConfirmarEmail />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/" element={<RootRedirect />} />
            <Route
              path="/cursos"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Cursos />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cursos/:courseId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Course />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Perfil />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
