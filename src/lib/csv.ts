/** Minimal RFC 4180 CSV helpers (no dependency). */

const BOM = String.fromCharCode(0xfeff);

function escapeCell(value: string, delimiter: string): string {
  if (
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r") ||
    value.includes(delimiter)
  ) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

/** Serializes rows as CSV: UTF-8 with BOM (so Excel reads accents), CRLF line endings. */
export function toCsv(rows: string[][], delimiter = ","): string {
  const body = rows.map((row) => row.map((c) => escapeCell(c, delimiter)).join(delimiter));
  return `${BOM}${body.join("\r\n")}\r\n`;
}

/** Picks `,` `;` or tab from the header line (Excel in French exports with `;`). */
function detectDelimiter(text: string): string {
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
  let inQuotes = false;
  for (const c of text) {
    if (c === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (c === "\n" || c === "\r")) break;
    else if (!inQuotes && c in counts) counts[c] = (counts[c] ?? 0) + 1;
  }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : ",";
}

/** Parses CSV text into rows of cells. Blank lines are skipped. Throws on an unclosed quote. */
export function parseCsv(input: string): string[][] {
  const text = input.startsWith(BOM) ? input.slice(1) : input;
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const endRow = () => {
    row.push(cell);
    rows.push(row);
    row = [];
    cell = "";
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else if (c === '"' && cell === "") {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(cell);
      cell = "";
    } else if (c === "\r") {
      if (text[i + 1] === "\n") i++;
      endRow();
    } else if (c === "\n") {
      endRow();
    } else {
      cell += c;
    }
  }
  if (inQuotes) throw new Error("Fichier CSV invalide : guillemet non fermé");
  if (cell !== "" || row.length > 0) endRow();

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

const FORMULA_START = /^[=+\-@\t\r]/;
const GUARDED = /^'[=+\-@\t\r]/;

/** Neutralises spreadsheet formulas (CSV injection) by prefixing an apostrophe. */
export const guardFormula = (value: string): string =>
  FORMULA_START.test(value) ? `'${value}` : value;

/** Reverses `guardFormula` on import. */
export const unguardFormula = (value: string): string =>
  GUARDED.test(value) ? value.slice(1) : value;
