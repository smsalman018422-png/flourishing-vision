import { supabase } from "@/integrations/supabase/client";

export type LoadResult<T> = { data: T[]; error: string | null };

/**
 * Loads a list with one automatic retry on transient PostgREST schema-cache errors
 * (PGRST002 / messages mentioning "schema cache"). Returns a friendly error string
 * instead of throwing — caller decides how to render it.
 *
 * The table name is typed as a string here (rather than a Database literal union)
 * to keep this helper generic across all admin pages without fighting the
 * Supabase generated overloads. Type safety for the row type is provided by
 * the caller via the generic parameter.
 */
export async function loadList<T>(
  table: string,
  build: (q: any) => any,
): Promise<LoadResult<T>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const run = () => build((supabase as any).from(table));
  let { data, error } = await run();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isTransient = (e: any) =>
    e && (e.code === "PGRST002" || /schema cache|schema/i.test(e.message ?? ""));

  if (error && isTransient(error)) {
    await new Promise((r) => setTimeout(r, 1500));
    const retry = await run();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error(`[admin] supabase error on ${table}:`, error);
    return { data: [], error: error.message ?? "Failed to load data" };
  }
  return { data: (data ?? []) as T[], error: null };
}
