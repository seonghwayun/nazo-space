import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeRegex, mergeExactFirst } from "./search-utils.ts";

test("escapeRegex makes regex metacharacters literal", () => {
  for (const name of ["Riddle (JP)", "C++", "a.b*c?", "[x]{1}|^$\\"]) {
    const re = new RegExp(`^${escapeRegex(name)}$`, "i");
    assert.equal(re.test(name), true, name);
  }
  assert.equal(new RegExp(escapeRegex("a.c")).test("abc"), false);
});

test("mergeExactFirst puts the exact match first without duplicating it", () => {
  const results = [
    { _id: "1", name: "Kai Studio" },
    { _id: "2", name: "Kai" },
  ];
  assert.deepEqual(
    mergeExactFirst({ _id: "2", name: "Kai" }, results).map((r) => r._id),
    ["2", "1"]
  );
});

test("mergeExactFirst adds an exact match that the capped results missed", () => {
  assert.deepEqual(
    mergeExactFirst({ _id: "9", name: "Kai" }, [{ _id: "1", name: "Kai Studio" }]).map((r) => r._id),
    ["9", "1"]
  );
  assert.deepEqual(mergeExactFirst(null, [{ _id: "1", name: "x" }]).map((r) => r._id), ["1"]);
});
