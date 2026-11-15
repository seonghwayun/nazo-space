import { test } from "node:test";
import assert from "node:assert/strict";
import { imageSelectionError } from "./nazo-validation.ts";

test("imageSelectionError requires a file in upload mode when there is no existing image", () => {
  assert.equal(
    imageSelectionError({ useFileUpload: true, hasFile: false, imageUrl: "" }),
    "이미지 파일을 선택하세요."
  );
});

test("imageSelectionError allows upload mode with a file, or keeping an existing image URL", () => {
  assert.equal(imageSelectionError({ useFileUpload: true, hasFile: true, imageUrl: "" }), null);
  assert.equal(
    imageSelectionError({ useFileUpload: true, hasFile: false, imageUrl: "https://x/y.webp" }),
    null
  );
  assert.equal(imageSelectionError({ useFileUpload: false, hasFile: false, imageUrl: "" }), null);
});
