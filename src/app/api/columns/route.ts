import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { createColumn, listColumns } from "@/lib/columns";
import { handle, readJson } from "@/lib/http";
import { createColumnSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(() => NextResponse.json(listColumns(getDb())));
}

export function POST(req: Request) {
  return handle(async () => {
    const input = createColumnSchema.parse(await readJson(req));
    return NextResponse.json(createColumn(getDb(), input), { status: 201 });
  });
}
