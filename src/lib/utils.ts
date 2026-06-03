export function parseMaybeJson(s: string): unknown[] {
  if (!s || s === "[]") return [];
  try { return JSON.parse(s) as unknown[]; } catch { return []; }
}
