// Pure helpers (no imports) so they can be unit-tested with `node --test`
// and used by scripts/import-mfy.mjs.
//
// Mystery for You (MFY) import: mfy-csv.csv has `제목,연,월,타입` rows and the
// MFY/ folder has one cover per row, named YYMMT.<ext>:
//   YY = year (20 → 2020), MM = month, T = type (1 설, 2 월, 3 화).

export type MfyType = "설" | "월" | "화";

export const MFY_TYPES: Record<MfyType, { digit: string; tag: string }> = {
  설: { digit: "1", tag: "Mystery for You 雪の謎" },
  월: { digit: "2", tag: "Mystery for You 月の謎" },
  화: { digit: "3", tag: "Mystery for You 花の謎" },
};

export interface MfyRow {
  /** 1-based line number in the CSV, for error messages. */
  line: number;
  title: string;
  year: number;
  month: number;
  type: MfyType;
}

export interface MfyParseResult {
  rows: MfyRow[];
  errors: string[];
}

/** Parses `제목,연,월,타입` CSV text (header row first). Titles may not contain commas. */
export function parseMfyCsv(text: string): MfyParseResult {
  const rows: MfyRow[] = [];
  const errors: string[] = [];
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = i + 1;
    if (i === 0 || !raw.trim()) return;
    const [title = "", year = "", month = "", type = "", ...rest] = raw.split(",").map((s) => s.trim());
    if (rest.some((s) => s)) {
      errors.push(`line ${line}: more columns than expected (a comma in the title?)`);
      return;
    }
    const y = Number(year);
    const m = Number(month);
    if (!title) errors.push(`line ${line}: empty title`);
    else if (!Number.isInteger(y) || y < 2000 || y > 2099) errors.push(`line ${line}: bad year "${year}"`);
    else if (!Number.isInteger(m) || m < 1 || m > 12) errors.push(`line ${line}: bad month "${month}"`);
    else if (!(type in MFY_TYPES)) errors.push(`line ${line}: bad type "${type}" (설/월/화)`);
    else rows.push({ line, title, year: y, month: m, type: type as MfyType });
  });
  return { rows, errors };
}

/** File name stem for a row: 2020-06 설 → "20061". */
export function mfyImageKey(row: Pick<MfyRow, "year" | "month" | "type">): string {
  return `${String(row.year).slice(2)}${String(row.month).padStart(2, "0")}${MFY_TYPES[row.type].digit}`;
}

/** Release order: year, month, then 설 → 월 → 화. */
export function compareMfyRows(a: MfyRow, b: MfyRow): number {
  return a.year - b.year || a.month - b.month || Number(MFY_TYPES[a.type].digit) - Number(MFY_TYPES[b.type].digit);
}
