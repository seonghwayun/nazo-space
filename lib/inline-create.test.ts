import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldOfferCreate, createTagByName, createCreatorByName } from "./inline-create.ts";

test("shouldOfferCreate is false for an empty or blank query", () => {
  assert.equal(shouldOfferCreate("", []), false);
  assert.equal(shouldOfferCreate("  ", []), false);
});

test("shouldOfferCreate is true when nothing matches", () => {
  assert.equal(shouldOfferCreate("New", []), true);
  assert.equal(shouldOfferCreate("Ridd", [{ name: "Riddle" }]), true);
});

test("shouldOfferCreate treats a trimmed, case-insensitive exact match as existing", () => {
  assert.equal(shouldOfferCreate("riddle ", [{ name: "Riddle" }]), false);
});

type Call = { url: string; init?: RequestInit };

function fakeFetch(responses: Array<{ status: number; body: unknown }>) {
  const calls: Call[] = [];
  const impl = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const next = responses.shift();
    if (!next) throw new Error("unexpected fetch");
    return new Response(JSON.stringify(next.body), { status: next.status });
  }) as unknown as typeof fetch;
  return { calls, impl };
}

test("createTagByName returns the created tag", async () => {
  const { impl } = fakeFetch([{ status: 201, body: { _id: "t1", name: "Puzzle" } }]);
  assert.deepEqual(await createTagByName("Puzzle", impl), { _id: "t1", name: "Puzzle" });
});

test("createTagByName attaches the existing tag on 409", async () => {
  const { calls, impl } = fakeFetch([
    { status: 409, body: { error: "Tag already exists" } },
    {
      status: 200,
      body: { results: [{ _id: "t0", name: "Puzzle Hunt" }, { _id: "t2", name: "puzzle" }] },
    },
  ]);
  assert.deepEqual(await createTagByName(" Puzzle ", impl), { _id: "t2", name: "puzzle" });
  assert.equal(calls[0].init?.body, JSON.stringify({ name: "Puzzle" }));
});

test("createTagByName rejects on a server error", async () => {
  const { impl } = fakeFetch([{ status: 500, body: { error: "boom" } }]);
  await assert.rejects(createTagByName("Puzzle", impl));
});

test("createCreatorByName returns the created creator", async () => {
  const { impl } = fakeFetch([{ status: 201, body: { _id: "c1", name: "SCRAP" } }]);
  assert.deepEqual(await createCreatorByName("SCRAP", impl), { _id: "c1", name: "SCRAP" });
});

test("createCreatorByName rejects when unauthorized", async () => {
  const { impl } = fakeFetch([{ status: 401, body: { error: "Unauthorized" } }]);
  await assert.rejects(createCreatorByName("SCRAP", impl));
});

test("shouldOfferCreate is false while the query is shorter than the search minimum", () => {
  assert.equal(shouldOfferCreate("Q", [], { minLength: 2, resultsFor: "Q" }), false);
  assert.equal(shouldOfferCreate("Qu", [], { minLength: 2, resultsFor: "Qu" }), true);
});

test("shouldOfferCreate is false when the results belong to a different query", () => {
  assert.equal(shouldOfferCreate("Riddle", [{ name: "Ring" }], { resultsFor: "Ri" }), false);
  assert.equal(shouldOfferCreate("Riddle ", [{ name: "Ring" }], { resultsFor: "Riddle" }), true);
});
