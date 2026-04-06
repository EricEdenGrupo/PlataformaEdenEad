import { createContext, ReactNode, useContext, useMemo, useState } from "react";

type AppSearchContextValue = {
  query: string;
  setQuery: (next: string) => void;
  clear: () => void;
};

const AppSearchContext = createContext<AppSearchContextValue | null>(null);

export function AppSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");

  const value = useMemo<AppSearchContextValue>(
    () => ({
      query,
      setQuery,
      clear: () => setQuery(""),
    }),
    [query],
  );

  return <AppSearchContext.Provider value={value}>{children}</AppSearchContext.Provider>;
}

export function useAppSearch() {
  const ctx = useContext(AppSearchContext);
  if (!ctx) {
    throw new Error("useAppSearch must be used within <AppSearchProvider />");
  }
  return ctx;
}

