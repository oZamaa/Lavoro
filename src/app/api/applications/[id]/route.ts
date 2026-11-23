import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { deleteApplication, getApplication, updateApplication } from "@/lib/applications";
import { handle, parseId, readJson } from "@/lib/http";
import { updateApplicationSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export function GET(_req: Request, { params }: Context) {
  return handle(async () => {
    const id = parseId((await params).id);
    return NextResponse.json(getApplication(getDb(), id));
  });
}

export function PATCH(req: Request, { params }: Context) {
  return handle(async () => {
    const id = parseId((await params).id);
    const patch = updateApplicationSchema.parse(await readJson(req));
    return NextResponse.json(updateApplication(getDb(), id, patch));
  });
}

export function DELETE(_req: Request, { params }: Context) {
  return handle(async () => {
    const id = parseId((await params).id);
    deleteApplication(getDb(), id);
    return new Response(null, { status: 204 });
  });
}
