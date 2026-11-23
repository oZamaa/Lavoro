import { count } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { columns } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Liveness + DB check: opens the database (migrations + seed) and counts columns. */
export async function GET() {
  const row = getDb().select({ total: count() }).from(columns).get();
  return NextResponse.json({ status: "ok", columns: row?.total ?? 0 });
}
