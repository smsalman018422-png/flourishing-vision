import { supabase } from "@/integrations/supabase/client";

export type LoadResult<T> = { data: T[]; error: string | null };

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
