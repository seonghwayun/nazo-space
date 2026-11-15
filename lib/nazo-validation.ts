// Pure helpers (no imports) so they can be unit-tested with `node --test`.

/** Same rule the old modal enforced: upload mode needs a file unless an image URL already exists. */
export function imageSelectionError(input: {
  useFileUpload: boolean;
  hasFile: boolean;
  imageUrl: string;
}): string | null {
  if (input.useFileUpload && !input.hasFile && !input.imageUrl) {
    return "이미지 파일을 선택하세요.";
  }
  return null;
}
