import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { deleteColumn, updateColumn } from "@/lib/columns";
import { handle, parseId, readJson } from "@/lib/http";
import { updateColumnSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export function PATCH(req: Request, { params }: Context) {
  return handle(async () => {
    const id = parseId((await params).id);
    const patch = updateColumnSchema.parse(await readJson(req));
    return NextResponse.json(updateColumn(getDb(), id, patch));
  });
}

export function DELETE(_req: Request, { params }: Context) {
  return handle(async () => {
    const id = parseId((await params).id);
    deleteColumn(getDb(), id);
    return new Response(null, { status: 204 });
  });
}
