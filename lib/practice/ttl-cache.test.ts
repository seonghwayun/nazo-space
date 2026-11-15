import { test } from "node:test";
import assert from "node:assert/strict";
import { createTtlCache } from "./ttl-cache.ts";

test("a null result is not cached, so a later import shows up at once", async () => {
  let words: string[] | null = null;
  let calls = 0;
  const get = createTtlCache(async () => (calls++, words), 60_000, () => 0);
  assert.equal(await get(), null);
  words = ["時間"];
  assert.deepEqual(await get(), ["時間"]);
  assert.equal(calls, 2);
});

test("a value is reused until the TTL passes", async () => {
  let now = 0;
  let calls = 0;
  const get = createTtlCache(async () => ++calls, 1000, () => now);
  assert.equal(await get(), 1);
  now = 999;
  assert.equal(await get(), 1);
  now = 1000;
  assert.equal(await get(), 2);
});

test("concurrent callers share one load", async () => {
  let calls = 0;
  const get = createTtlCache(async () => ++calls, 1000, () => 0);
  const [a, b] = await Promise.all([get(), get()]);
  assert.equal(a, 1);
  assert.equal(b, 1);
  assert.equal(calls, 1);
});

test("a failed load is not cached", async () => {
  let fail = true;
  const get = createTtlCache(async () => {
    if (fail) throw new Error("db down");
    return 1;
  }, 1000, () => 0);
  await assert.rejects(get());
  fail = false;
  assert.equal(await get(), 1);
});
