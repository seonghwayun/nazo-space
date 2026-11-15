// Pure helpers (no imports) so they can be unit-tested with `node --test`.

export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "nazo-theme";

export function parseThemePreference(value: unknown): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

export function resolveTheme(pref: ThemePreference, systemPrefersDark: boolean): "light" | "dark" {
  if (pref === "system") return systemPrefersDark ? "dark" : "light";
  return pref;
}

/**
 * Runs in <head> before the page paints, so a dark-mode user never sees a
 * flash of the light theme. Keep it in sync with `applyTheme` in hooks/use-theme.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var d=p==="dark"||(p!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;
