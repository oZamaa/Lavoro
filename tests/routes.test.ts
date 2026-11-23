import { beforeAll, describe, expect, it } from "vitest";

type Handler = (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

let applicationsRoute: { GET: Handler; POST: Handler };
let applicationRoute: { GET: Handler; PATCH: Handler; DELETE: Handler };
let moveRoute: { POST: Handler };
let columnsRoute: { GET: Handler; POST: Handler };
let columnRoute: { DELETE: Handler };

beforeAll(async () => {
  process.env.DATABASE_PATH = ":memory:";
  applicationsRoute = (await import("@/app/api/applications/route")) as never;
  applicationRoute = (await import("@/app/api/applications/[id]/route")) as never;
  moveRoute = (await import("@/app/api/applications/[id]/move/route")) as never;
  columnsRoute = (await import("@/app/api/columns/route")) as never;
  columnRoute = (await import("@/app/api/columns/[id]/route")) as never;
});

const json = (body: unknown) =>
  new Request("http://test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const noCtx = ctx("0");

describe("API routes", () => {
  it("lists the seeded columns", async () => {
    const res = await columnsRoute.GET(new Request("http://test"), noCtx);
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveLength(6);
  });

  it("creates, reads, patches, moves and deletes an application", async () => {
    const created = await applicationsRoute.POST(
      json({ company: "Alpha", title: "Dev", city: "Paris" }),
      noCtx,
    );
    expect(created.status).toBe(201);
    const app = (await created.json()) as { id: number; columnId: number };

    const read = await applicationRoute.GET(new Request("http://test"), ctx(String(app.id)));
    expect(((await read.json()) as { history: unknown[] }).history).toHaveLength(1);

    const patched = await applicationRoute.PATCH(json({ notes: "ok" }), ctx(String(app.id)));
    expect(((await patched.json()) as { notes: string }).notes).toBe("ok");

    const cols = (await (await columnsRoute.GET(new Request("http://test"), noCtx)).json()) as {
      id: number;
    }[];
    const target = cols[2];
    if (!target) throw new Error("missing column");
    const moved = await moveRoute.POST(json({ columnId: target.id }), ctx(String(app.id)));
    expect(((await moved.json()) as { columnId: number }).columnId).toBe(target.id);

    const del = await applicationRoute.DELETE(new Request("http://test"), ctx(String(app.id)));
    expect(del.status).toBe(204);
    const gone = await applicationRoute.GET(new Request("http://test"), ctx(String(app.id)));
    expect(gone.status).toBe(404);
  });

  it("returns 400 on invalid input, bad JSON and bad ids", async () => {
    const invalid = await applicationsRoute.POST(json({ company: "" }), noCtx);
    expect(invalid.status).toBe(400);
    expect(((await invalid.json()) as { issues: unknown[] }).issues.length).toBeGreaterThan(0);

    const badJson = await applicationsRoute.POST(
      new Request("http://test", { method: "POST", body: "{nope" }),
      noCtx,
    );
    expect(badJson.status).toBe(400);

    const badId = await applicationRoute.GET(new Request("http://test"), ctx("abc"));
    expect(badId.status).toBe(400);
  });

  it("returns 409 when deleting a non-empty column", async () => {
    const created = await applicationsRoute.POST(json({ company: "B", title: "Dev" }), noCtx);
    const app = (await created.json()) as { columnId: number };
    const res = await columnRoute.DELETE(new Request("http://test"), ctx(String(app.columnId)));
    expect(res.status).toBe(409);
  });
});
