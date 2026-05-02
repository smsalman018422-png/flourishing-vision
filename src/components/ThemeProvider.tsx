import { createContext, useContext, useEffect, useState } from "react";
import { applyTheme, getTheme, setTheme as persistTheme, type Theme } from "@/lib/theme";

type Ctx = { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void };

const ThemeContext = createContext<Ctx>({
  theme: "dark",
  toggle: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const initial = getTheme();
    setThemeState(initial);
    applyTheme(initial);

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<Theme>).detail;
      if (detail === "dark" || detail === "light") setThemeState(detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "letusgrow-theme") {
        const next = getTheme();
        setThemeState(next);
        applyTheme(next);
      }
    };
    window.addEventListener("letusgrow:theme", onChange as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("letusgrow:theme", onChange as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    persistTheme(t);
  };
  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
