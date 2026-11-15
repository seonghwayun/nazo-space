import { test } from "node:test";
import assert from "node:assert/strict";
import { addRecentSearch, parseRecentSearches, removeRecentSearch, RECENT_SEARCHES_MAX } from "./recent-searches.ts";

test("newest first without duplicates, capped", () => {
  let list: string[] = [];
  list = addRecentSearch(list, "謎");
  list = addRecentSearch(list, " つまみ ");
  list = addRecentSearch(list, "謎");
  assert.deepEqual(list, ["謎", "つまみ"]);
  assert.deepEqual(addRecentSearch(["Mystery"], "mystery"), ["mystery"]);
  assert.deepEqual(addRecentSearch(list, "   "), list);
  for (let i = 0; i < 20; i++) list = addRecentSearch(list, `q${i}`);
  assert.equal(list.length, RECENT_SEARCHES_MAX);
  assert.equal(list[0], "q19");
  assert.deepEqual(removeRecentSearch(["a", "b"], "a"), ["b"]);
});

test("bad stored values become an empty list", () => {
  assert.deepEqual(parseRecentSearches(null), []);
  assert.deepEqual(parseRecentSearches("{oops"), []);
  assert.deepEqual(parseRecentSearches('{"a":1}'), []);
  assert.deepEqual(parseRecentSearches('["a",2,"b"]'), ["a", "b"]);
});
