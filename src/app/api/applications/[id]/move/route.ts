import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { moveApplication } from "@/lib/applications";
import { handle, parseId, readJson } from "@/lib/http";
import { moveApplicationSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const id = parseId((await params).id);
    const input = moveApplicationSchema.parse(await readJson(req));
    return NextResponse.json(moveApplication(getDb(), id, input));
  });
}
