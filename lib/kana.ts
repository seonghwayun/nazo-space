/**
 * Converts a search query into a Regex pattern string that matches both Hiragana and Katakana.
 * Example: "きみ" -> "[きキ][みミ]"
 */
export function toKanaPattern(query: string): string {
  if (!query) return "";

  return query
    .split("")
    .map((char) => {
      // Escape special regex characters first
      if (/[.*+?^${}()|[\]\\]/.test(char)) {
        return `\\${char}`;
      }

      const code = char.charCodeAt(0);

      // Hiragana to Katakana (0x3041-0x3096)
      if (code >= 0x3041 && code <= 0x3096) {
        const kata = String.fromCharCode(code + 0x60);
        return `[${char}${kata}]`;
      }

      // Katakana to Hiragana (0x30A1-0x30F6)
      if (code >= 0x30a1 && code <= 0x30f6) {
        const hira = String.fromCharCode(code - 0x60);
        return `[${hira}${char}]`;
      }

      // Keep other characters as is
      return char;
    })
    .join("");
}
