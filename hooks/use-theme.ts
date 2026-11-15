"use client";

import * as React from "react";
import { parseThemePreference, resolveTheme, THEME_STORAGE_KEY, type ThemePreference } from "@/lib/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function applyTheme(pref: ThemePreference) {
  const dark = resolveTheme(pref, window.matchMedia(DARK_QUERY).matches) === "dark";
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

function readPreference(): ThemePreference {
  try {
    return parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

/** Light / dark / follow-the-OS preference, saved in this browser. */
export function useTheme() {
  const [preference, setPreferenceState] = React.useState<ThemePreference>("system");

  React.useEffect(() => {
    setPreferenceState(readPreference());
  }, []);

  // While following the OS, switch along with it.
  React.useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = React.useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    try {
      if (pref === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch {
      // Storage blocked (private mode): the choice still applies until reload.
    }
    applyTheme(pref);
  }, []);

  return { preference, setPreference };
}
