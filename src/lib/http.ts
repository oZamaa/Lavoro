import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new HttpError(404, `${what} introuvable`);

/** Parses a JSON request body; throws a 400 HttpError when invalid. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "Corps JSON invalide");
  }
}

/** Parses a numeric id from a URL segment. */
export function parseId(raw: string): number {
  if (!/^\d+$/.test(raw)) throw new HttpError(400, "Identifiant invalide");
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) throw new HttpError(400, "Identifiant invalide");
  return id;
}

/** Runs a route handler and maps known errors to JSON responses. */
export async function handle(fn: () => Promise<Response> | Response): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Données invalides",
          issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
        { status: 400 },
      );
    }
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
