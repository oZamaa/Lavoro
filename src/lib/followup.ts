import { normalizeText } from "@/lib/text";

/**
 * Columns whose cards no longer need a follow-up (rejected / archived).
 * Detected by name because columns are user-renamable and carry no type.
 */
export function isClosedColumn(name: string): boolean {
  const n = normalizeText(name);
  return n.startsWith("refus") || n.startsWith("archiv");
}

/** A card must be followed up from its follow-up date (inclusive), unless its column is closed. */
export function isOverdue(
  followUpAt: string | null,
  today: string | null,
  columnName: string,
): boolean {
  return !!followUpAt && !!today && followUpAt <= today && !isClosedColumn(columnName);
}

/** Today's date in the user's local timezone, as YYYY-MM-DD. */
export function localToday(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
