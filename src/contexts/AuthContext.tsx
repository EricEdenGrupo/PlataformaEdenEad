import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureIdentityProfile } from "@/lib/identity/ensureProfile";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthorized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

/** EAD: usuário autorizado quando possui profile ativo (não soft-deletado). */
const isEadAuthorized = (profile: { id: string; deleted_at: string | null } | null | undefined) =>
  !!profile && profile.deleted_at == null;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuthorization = async (userId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id || user.id !== userId) {
        setIsAuthorized(false);
        return;
      }

      const profile = await ensureIdentityProfile(user);
      const authorized = isEadAuthorized(profile);
      setIsAuthorized(authorized);

      if (!authorized && userId) {
        await supabase.auth.signOut();
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (event === "TOKEN_REFRESHED" && !nextSession) {
        await supabase.auth.signOut({ scope: "local" });
        window.location.href = "/login";
        return;
      }

      if (event === "SIGNED_OUT" || (!nextSession && event !== "INITIAL_SESSION")) {
        setSession(null);
        setUser(null);
        setIsAuthorized(false);
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        setTimeout(() => checkAuthorization(nextSession.user.id), 0);
      } else {
        setIsAuthorized(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session: s }, error }) => {
      if (error) {
        console.error("Erro ao obter sessão:", error);
        await supabase.auth.signOut({ scope: "local" });
        setLoading(false);
        return;
      }

      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        checkAuthorization(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, isAuthorized }}>
      {children}
    </AuthContext.Provider>
  );
};
