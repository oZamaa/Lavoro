import { describe, expect, it } from "vitest";
import { guardFormula, parseCsv, toCsv, unguardFormula } from "@/lib/csv";

const BOM = String.fromCharCode(0xfeff);

describe("csv", () => {
  it("round-trips quotes, delimiters, newlines and accents", () => {
    const rows = [
      ["a", "b", "c"],
      ['say "hi"', "x,y", "ligne1\nligne2"],
      ["é à ü", "", "fin"],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });

  it("writes a BOM and CRLF line endings", () => {
    const out = toCsv([["a"], ["b"]]);
    expect(out.startsWith(`${BOM}`)).toBe(true);
    expect(out).toBe(`${BOM}a\r\nb\r\n`);
  });

  it("detects ; and tab delimiters, ignores blank lines and handles CR/LF/CRLF", () => {
    expect(parseCsv("a;b\r\n1;2\r\n\r\n3;4")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
    expect(parseCsv("a\tb\n1\t2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
    expect(parseCsv("a,b\r1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("keeps empty trailing cells and treats a quote inside a word as literal", () => {
    expect(parseCsv("a,b,c\n1,,\n5'6,x\"y,z")).toEqual([
      ["a", "b", "c"],
      ["1", "", ""],
      ["5'6", 'x"y', "z"],
    ]);
  });

  it("throws on an unclosed quote", () => {
    expect(() => parseCsv('a,b\n"oops,1')).toThrow();
  });

  it("guards and unguards spreadsheet formulas", () => {
    expect(guardFormula("=1+1")).toBe("'=1+1");
    expect(guardFormula("+33 1")).toBe("'+33 1");
    expect(guardFormula("normal")).toBe("normal");
    expect(unguardFormula("'=1+1")).toBe("=1+1");
    expect(unguardFormula("'normal")).toBe("'normal");
    expect(unguardFormula(guardFormula("-5"))).toBe("-5");
  });
});
