import { test } from "node:test";
import assert from "node:assert/strict";
import { parseThemePreference, resolveTheme, THEME_INIT_SCRIPT } from "./theme.ts";

test("unknown stored values fall back to system", () => {
  assert.equal(parseThemePreference("dark"), "dark");
  assert.equal(parseThemePreference("light"), "light");
  assert.equal(parseThemePreference(null), "system");
  assert.equal(parseThemePreference("purple"), "system");
});

test("system follows the OS setting, explicit choices win", () => {
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("system", false), "light");
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
});

test("the init script applies the stored theme", () => {
  const classes = new Set<string>();
  const root = {
    classList: { toggle: (c: string, on: boolean) => (on ? classes.add(c) : classes.delete(c)) },
    style: { colorScheme: "" },
  };
  const run = (stored: string | null, systemDark: boolean) => {
    classes.clear();
    new Function("localStorage", "window", "document", THEME_INIT_SCRIPT)(
      { getItem: () => stored },
      { matchMedia: () => ({ matches: systemDark }) },
      { documentElement: root }
    );
    return { dark: classes.has("dark"), scheme: root.style.colorScheme };
  };
  assert.deepEqual(run("dark", false), { dark: true, scheme: "dark" });
  assert.deepEqual(run("light", true), { dark: false, scheme: "light" });
  assert.deepEqual(run(null, true), { dark: true, scheme: "dark" });
  assert.deepEqual(run(null, false), { dark: false, scheme: "light" });
});
