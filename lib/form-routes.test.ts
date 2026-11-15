import { test } from "node:test";
import assert from "node:assert/strict";
import { isFullScreenFormRoute, goBackOr } from "./form-routes.ts";

test("isFullScreenFormRoute matches every form route", () => {
  for (const path of [
    "/nazo/abc/review",
    "/nazo/abc/edit",
    "/creator/abc/edit",
    "/admin/nazo/new",
    "/admin/creator/new",
    "/admin/tag/new",
  ]) {
    assert.equal(isFullScreenFormRoute(path), true, path);
  }
});

test("isFullScreenFormRoute ignores non-form routes", () => {
  for (const path of ["/", "/admin", "/nazo/abc", "/creator/abc", "/search", null]) {
    assert.equal(isFullScreenFormRoute(path), false, String(path));
  }
});

function fakeRouter() {
  const calls = { back: 0, replace: [] as string[] };
  return {
    calls,
    router: {
      back: () => {
        calls.back++;
      },
      replace: (href: string) => {
        calls.replace.push(href);
      },
    },
  };
}

test("goBackOr goes back when there is history", () => {
  const { calls, router } = fakeRouter();
  goBackOr(router, "/admin", 3);
  assert.equal(calls.back, 1);
  assert.deepEqual(calls.replace, []);
});

test("goBackOr replaces with the fallback when there is no history", () => {
  const { calls, router } = fakeRouter();
  goBackOr(router, "/admin", 1);
  assert.equal(calls.back, 0);
  assert.deepEqual(calls.replace, ["/admin"]);
});
