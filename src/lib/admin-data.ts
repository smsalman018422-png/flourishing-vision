import { supabase } from "@/integrations/supabase/client";

export type LoadResult<T> = { data: T[]; error: string | null };
type AdminFilter = { op: "eq" | "in" | "gte"; column: string; value: unknown };
type AdminOrder = { column: string; ascending?: boolean; nullsFirst?: boolean };
type CacheEntry<T> = { data: T; timestamp: number };

const CACHE_TTL = 5 * 60 * 1000;
const cache: Record<string, CacheEntry<unknown>> = {};

export async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>, ttl = CACHE_TTL): Promise<T> {
  const cached = cache[key] as CacheEntry<T> | undefined;
  if (cached && Date.now() - cached.timestamp < ttl) return cached.data;
  const data = await fetcher();
  cache[key] = { data, timestamp: Date.now() };
  return data;
}

export function setAdminCache<T>(key: string, data: T) {
  cache[key] = { data, timestamp: Date.now() };
}

export function invalidateAdminCache(key?: string) {
  if (key) delete cache[key];
  else Object.keys(cache).forEach((k) => delete cache[k]);
}

export type AdminDataQuery = {
  table: string;
  select?: string;
  count?: "exact" | "planned" | "estimated";
  head?: boolean;
  filters?: AdminFilter[];
  orders?: AdminOrder[];
  limit?: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isTransient = (e: any) =>
  e &&
  (e.code === "PGRST002" ||
    e.code === "503" ||
    /schema cache|schema|fetch|network|timeout/i.test(e.message ?? ""));

/**
 * Loads a list with up to 3 retries on transient PostgREST errors
 * (PGRST002 schema-cache 503s, network blips). Uses exponential backoff so the
 * first user-visible request is the one that succeeds — preventing the
 * preview's "Database client error. Retrying the connection" toast from
 * flashing on cold starts.
 */
export async function loadList<T>(
  table: string,
  build: (q: any) => any, // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<LoadResult<T>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const run = () => build((supabase as any).from(table));

  let lastError: { message?: string; code?: string } | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await run();
    if (!error) return { data: (data ?? []) as T[], error: null };
    lastError = error;
    if (!isTransient(error)) break;
    await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
  }

  console.error(`[admin] supabase error on ${table}:`, lastError);
  return { data: [], error: lastError?.message ?? "Failed to load data" };
}

export async function adminData<T>(query: AdminDataQuery): Promise<LoadResult<T> & { count: number | null }> {
  const cacheKey = `admin:${JSON.stringify(query)}`;
  return fetchWithCache(cacheKey, async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return { data: [], count: null, error: "Your session expired. Please sign in again." };

  const res = await fetch("/api/admin-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(query),
  });
  const body = (await res.json().catch(() => null)) as { data?: T[]; count?: number | null; error?: string } | null;
  if (!res.ok || body?.error) return { data: [], count: null, error: body?.error ?? "Failed to load data" };
  return { data: body?.data ?? [], count: body?.count ?? null, error: null };
  });
}

export type AdminWriteRequest = {
  table: string;
  op: "insert" | "update" | "delete" | "upsert";
  values?: Record<string, unknown> | Record<string, unknown>[];
  match?: { column: string; value: unknown }[];
  onConflict?: string;
};

export async function adminWrite<T = unknown>(
  req: AdminWriteRequest,
): Promise<{ data: T[]; error: string | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return { data: [], error: "Your session expired. Please sign in again." };

  const res = await fetch("/api/admin-write", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(req),
  });
  const body = (await res.json().catch(() => null)) as { data?: T[]; error?: string } | null;
  if (!res.ok || body?.error) return { data: [], error: body?.error ?? "Failed to save" };
  return { data: body?.data ?? [], error: null };
}
