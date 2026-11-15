import { test } from "node:test";
import assert from "node:assert/strict";
import { LAYOUT_HINT_SCRIPT, LAYOUT_HINTS, hintAttribute } from "./layout-hints.ts";

test("the head script copies stored hints onto <html>", () => {
  const attrs = new Set<string>();
  const run = (stored: Record<string, string>) => {
    attrs.clear();
    new Function("localStorage", "document", LAYOUT_HINT_SCRIPT)(
      { getItem: (k: string) => stored[k] ?? null },
      { documentElement: { setAttribute: (name: string) => attrs.add(name) } }
    );
    return [...attrs].sort();
  };
  assert.deepEqual(run({}), []);
  assert.deepEqual(run({ [LAYOUT_HINTS.signedIn]: "1" }), [hintAttribute(LAYOUT_HINTS.signedIn)]);
  assert.deepEqual(run({ [LAYOUT_HINTS.signedIn]: "1", [LAYOUT_HINTS.homeShelf]: "1" }), [
    "data-nazo-home-shelf",
    "data-nazo-signed-in",
  ]);
  assert.deepEqual(run({ [LAYOUT_HINTS.signedIn]: "0" }), []);
});
