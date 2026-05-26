import { createContext, useContext, useEffect } from "react";

interface ThemeContextType {
  theme: "dark" | "light";
  switchable: boolean;
  toggleTheme?: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "dark", switchable: false });

export function ThemeProvider({ children }: { children: React.ReactNode; defaultTheme?: string; switchable?: boolean }) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "dark", switchable: false }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
