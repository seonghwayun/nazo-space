// Pure helpers (no imports) so they can be unit-tested with `node --test`.

/** Strip all whitespace (U+3000 included) and keep the first character. */
export function normalizeAnswer(input: string): string {
  const [first] = input.replace(/\s/g, "");
  return first ?? "";
}

export function isCorrect(input: string, answer: string): boolean {
  const normalized = normalizeAnswer(input);
  return normalized !== "" && normalized === answer;
}
