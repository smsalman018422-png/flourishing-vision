import { supabase } from "@/integrations/supabase/client";

type AnyTable = Parameters<typeof supabase.from>[0];

export type LoadResult<T> = { data: T[]; error: string | null };

/**
 * Loads a list with one automatic retry on transient PostgREST schema-cache errors
 * (PGRST002 / messages mentioning "schema cache"). Returns a friendly error string
 * instead of throwing — caller decides how to render it.
 */
export async function loadList<T>(
  table: AnyTable,
  build: (q: ReturnType<typeof supabase.from>) => any,
): Promise<LoadResult<T>> {
  const run = () => build(supabase.from(table));
  let { data, error } = await run();

  const isTransient = (e: any) =>
    e && (e.code === "PGRST002" || /schema cache|schema/i.test(e.message ?? ""));

  if (error && isTransient(error)) {
    await new Promise((r) => setTimeout(r, 1500));
    const retry = await run();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error(`[admin] supabase error on ${String(table)}:`, error);
    return { data: [], error: error.message ?? "Failed to load data" };
  }
  return { data: (data ?? []) as T[], error: null };
}
