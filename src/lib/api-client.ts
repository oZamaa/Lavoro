export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

type ErrorBody = { error?: string; issues?: { path: string; message: string }[] };

/** Small JSON fetch wrapper used by client components. Throws ApiError on non-2xx. */
export async function api<T>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: init?.method ?? "GET",
      headers: init?.body === undefined ? undefined : { "content-type": "application/json" },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Impossible de joindre le serveur", 0);
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    let body: ErrorBody = {};
    try {
      body = (await res.json()) as ErrorBody;
    } catch {
      /* non-JSON error body */
    }
    const fieldErrors: Record<string, string> = {};
    for (const issue of body.issues ?? []) {
      if (issue.path && !(issue.path in fieldErrors)) fieldErrors[issue.path] = issue.message;
    }
    throw new ApiError(body.error ?? "Erreur inattendue", res.status, fieldErrors);
  }
  return (await res.json()) as T;
}
