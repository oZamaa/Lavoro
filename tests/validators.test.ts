import { describe, expect, it } from "vitest";
import {
  createApplicationSchema,
  moveApplicationSchema,
  updateApplicationSchema,
  updateColumnSchema,
} from "@/lib/validators";

describe("createApplicationSchema", () => {
  it("requires company and title", () => {
    expect(createApplicationSchema.safeParse({}).success).toBe(false);
    expect(createApplicationSchema.safeParse({ company: " ", title: "Dev" }).success).toBe(false);
  });

  it("trims values and turns empty strings into null", () => {
    const parsed = createApplicationSchema.parse({
      company: "  Alpha ",
      title: "Dev",
      city: "  ",
      url: "",
      followUpAt: "",
    });
    expect(parsed.company).toBe("Alpha");
    expect(parsed.city).toBeNull();
    expect(parsed.url).toBeNull();
    expect(parsed.followUpAt).toBeNull();
  });

  it("rejects non-http urls, bad emails, bad dates and unknown remote values", () => {
    const base = { company: "A", title: "B" };
    expect(createApplicationSchema.safeParse({ ...base, url: "javascript:alert(1)" }).success).toBe(
      false,
    );
    expect(createApplicationSchema.safeParse({ ...base, url: "https://a.io/job" }).success).toBe(
      true,
    );
    expect(createApplicationSchema.safeParse({ ...base, contactEmail: "nope" }).success).toBe(
      false,
    );
    expect(createApplicationSchema.safeParse({ ...base, appliedAt: "2026-02-30" }).success).toBe(
      false,
    );
    expect(createApplicationSchema.safeParse({ ...base, appliedAt: "2026-02-20" }).success).toBe(
      true,
    );
    expect(createApplicationSchema.safeParse({ ...base, remote: "sometimes" }).success).toBe(false);
  });

  it("rejects unknown keys", () => {
    expect(createApplicationSchema.safeParse({ company: "A", title: "B", id: 3 }).success).toBe(
      false,
    );
  });
});

describe("other schemas", () => {
  it("update needs at least one field and forbids columnId", () => {
    expect(updateApplicationSchema.safeParse({}).success).toBe(false);
    expect(updateApplicationSchema.safeParse({ columnId: 2 }).success).toBe(false);
    expect(updateApplicationSchema.safeParse({ notes: "hello" }).success).toBe(true);
  });

  it("move validates ids and positions", () => {
    expect(moveApplicationSchema.safeParse({ columnId: 1, position: 0 }).success).toBe(true);
    expect(moveApplicationSchema.safeParse({ columnId: 0 }).success).toBe(false);
    expect(moveApplicationSchema.safeParse({ columnId: 1, position: -1 }).success).toBe(false);
  });

  it("column update needs a field", () => {
    expect(updateColumnSchema.safeParse({}).success).toBe(false);
    expect(updateColumnSchema.safeParse({ name: "Oui" }).success).toBe(true);
  });
});
