import { getDb } from "@/db/client";
import { handle } from "@/lib/http";
import { buildExport, exportToCsv, exportToJson } from "@/lib/transfer";
import { exportQuerySchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** GET /api/export?format=json|csv — downloads a backup of all applications. */
export function GET(req: Request) {
  return handle(() => {
    const { format } = exportQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
    const bundle = buildExport(getDb());
    const isCsv = format === "csv";
    const date = bundle.exportedAt.slice(0, 10);

    return new Response(isCsv ? exportToCsv(bundle) : exportToJson(bundle), {
      headers: {
        "content-type": isCsv ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="jobtrack-${date}.${format}"`,
        "cache-control": "no-store",
      },
    });
  });
}
