import { test } from "node:test";
import assert from "node:assert/strict";
import { isObjectIdHex, nazoImageKey, nazoIdFromImageKey, versionedImageUrl } from "./image-key.ts";

const ID = "6af92974a3aa9090bb1682fb";

test("one image key per nazo", () => {
  assert.equal(nazoImageKey(ID, "webp"), `nazo/${ID}.webp`);
  assert.equal(nazoImageKey(ID.toUpperCase(), "gif"), `nazo/${ID}.gif`);
  assert.equal(nazoIdFromImageKey(`nazo/${ID}.webp`), ID);
});

test("old uuid keys have no nazo id", () => {
  assert.equal(nazoIdFromImageKey("nazo/0b5c1f6e-1111-2222-3333-444455556666.webp"), null);
  assert.equal(nazoIdFromImageKey(`nazo/${ID}/x.webp`), null);
});

test("invalid ids and extensions are rejected", () => {
  assert.equal(isObjectIdHex("../etc"), false);
  assert.equal(isObjectIdHex(ID), true);
  assert.throws(() => nazoImageKey("../etc", "png"));
  assert.throws(() => nazoImageKey(ID, "png/../x"));
});

test("versioned URLs change with the version", () => {
  const url = `https://img.example.com/nazo/${ID}.webp`;
  assert.equal(versionedImageUrl(url, 1700000000000), `${url}?v=${(1700000000000).toString(36)}`);
  assert.notEqual(versionedImageUrl(url, 1), versionedImageUrl(url, 2));
});
