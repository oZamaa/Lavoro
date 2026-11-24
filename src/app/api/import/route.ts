import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { handle, readJson } from "@/lib/http";
import { parseImportContent, runImport } from "@/lib/transfer";
import { importRequestSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** POST /api/import — body: { format, mode: "append" | "replace", content }. All or nothing. */
export function POST(req: Request) {
  return handle(async () => {
    const { format, mode, content } = importRequestSchema.parse(await readJson(req));
    const parsed = parseImportContent(format, content);
    return NextResponse.json(runImport(getDb(), parsed, mode));
  });
}
