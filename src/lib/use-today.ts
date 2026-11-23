"use client";

import { useSyncExternalStore } from "react";
import { localToday } from "@/lib/followup";

const subscribe = () => () => {};

/** Local date (YYYY-MM-DD) on the client, `null` during SSR (avoids hydration mismatches). */
export function useToday(): string | null {
  return useSyncExternalStore(subscribe, localToday, () => null);
}
