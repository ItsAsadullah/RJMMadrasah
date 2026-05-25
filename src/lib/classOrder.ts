/**
 * Bengali class name ordering utility
 * শ্রেণির ক্রম নির্ধারণ — ছোট থেকে বড়
 *
 * KEY FIX: Both the search keys and the input are normalized to NFC + ya-nukta
 * precomposition before comparison, preventing Unicode mismatch issues.
 */

/**
 * Normalize a Bengali string for robust comparison:
 *  - lowercase
 *  - Unicode NFC normalization
 *  - Normalize decomposed ya+nukta (য + ়) → precomposed yya (য়)
 */
function normBn(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFC")
    .replace(/\u09AF\u09BC/g, "\u09DF"); // য + ় → য়
}

/**
 * Ordered pairs: [search-keyword, sort-order].
 * FIRST MATCH WINS — put LONGER / MORE-SPECIFIC keys BEFORE shorter ones.
 */
const ENTRIES: [string, number][] = [
  // ── Hifz division (specific before generic) ────────────────────────────────
  ["হিফজুল কুরআন আম",  20],
  ["হিফজুল কুরআন খাস", 21],
  ["হিফজ আম",           20],
  ["হিফজ খাস",          21],

  // ── Higher madrasa levels ──────────────────────────────────────────────────
  ["দাওরায়ে হাদীস",     17],
  ["দাওরায়ে হাদিস",     17],
  ["ইফতেদায়ী",          14],
  ["ইবতেদায়ী",          14],
  ["মুতাওয়াসিতাহ",     15],
  ["মুতাওয়াস্সিতাহ",   15],
  ["সানাবিয়্যাহ",      16],
  ["সানাবিয়া",         16],
  ["দাওরা",             17],

  // ── Pre-primary ────────────────────────────────────────────────────────────
  ["নার্সারি",   0],
  ["শিশু",       0],
  ["কে.জি",      1],
  ["কেজি",       1],

  // ── Standard grades (word form) ────────────────────────────────────────────
  ["প্রথম",     2],
  ["দ্বিতীয়",  3],
  ["তৃতীয়",    4],
  ["চতুর্থ",    5],
  ["পঞ্চম",     6],
  ["ষষ্ঠ",      7],
  ["সপ্তম",     8],
  ["অষ্টম",     9],
  ["নবম",      10],
  ["দশম",      11],
  ["একাদশ",    12],
  ["দ্বাদশ",   13],

  // ── Short Bengali-numeral ordinals ─────────────────────────────────────────
  ["১ম",    2],
  ["২য়",   3],
  ["৩য়",   4],
  ["৪র্থ",  5],
  ["৫ম",    6],
  ["৬ষ্ঠ",  7],
  ["৭ম",    8],
  ["৮ম",    9],
  ["৯ম",   10],
  ["১০ম",  11],
  ["১১শ",  12],
  ["১২শ",  13],

  // ── Hifz generic — AFTER specific "হিফজ আম / খাস" ────────────────────────
  ["আম",   20],
  ["খাস",  21],
];

/** Pre-normalized keys so we only pay normalization cost once. */
const NORMALIZED_ENTRIES: [string, number][] = ENTRIES.map(([k, v]) => [normBn(k), v]);

/**
 * Returns the sort-order index for a given class name.
 * Lower index = appears first (small class → big class).
 */
export function getClassOrder(name: string): number {
  if (!name) return 999;

  const lower = normBn(name);

  for (const [key, val] of NORMALIZED_ENTRIES) {
    if (lower.includes(key)) return val;
  }

  // Fallback: extract Bengali or ASCII numerals and treat as a class number
  const bnToAscii: Record<string, string> = {
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
  };
  const numStr = name
    .replace(/[^০-৯0-9]/g, "")
    .split("")
    .map((c) => bnToAscii[c] ?? c)
    .join("");
  if (numStr) {
    const n = parseInt(numStr, 10);
    return isNaN(n) ? 998 : n + 100;
  }

  return 999;
}

/**
 * Sort an array of class-name strings in ascending order.
 * শিশু → প্রথম → দ্বিতীয় → তৃতীয় → ...
 */
export function sortClassNames(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const diff = getClassOrder(a) - getClassOrder(b);
    if (diff !== 0) return diff;
    return a.localeCompare(b, "bn");
  });
}
