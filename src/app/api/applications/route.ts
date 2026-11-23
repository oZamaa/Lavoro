import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { createApplication, listApplications } from "@/lib/applications";
import { handle, readJson } from "@/lib/http";
import { createApplicationSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(() => NextResponse.json(listApplications(getDb())));
}

export function POST(req: Request) {
  return handle(async () => {
    const input = createApplicationSchema.parse(await readJson(req));
    return NextResponse.json(createApplication(getDb(), input), { status: 201 });
  });
}
