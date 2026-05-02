export type Theme = "dark" | "light";

const KEY = "letusgrow-theme";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
}

export function setTheme(theme: Theme) {
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    // ignore
  }
  applyTheme(theme);
  try {
    window.dispatchEvent(new CustomEvent("letusgrow:theme", { detail: theme }));
  } catch {
    // ignore
  }
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('letusgrow-theme');if(t!=='light')t='dark';var r=document.documentElement;r.classList.remove('dark','light');r.classList.add(t);}catch(e){document.documentElement.classList.add('dark');}})();`;
