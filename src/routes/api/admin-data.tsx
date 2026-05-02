import { createFileRoute } from "@tanstack/react-router";
import { assertStaffAccess } from "@/lib/admin-api-auth.server";

const ALLOWED_TABLES = new Set([
  "team_members",
  "portfolio",
  "services",
  "testimonials",
  "blog_posts",
  "contact_submissions",
  "newsletter_subscribers",
  "site_settings",
  "user_roles",
  "packages",
]);

type AdminDataRequest = {
  table?: string;
  select?: string;
  count?: "exact" | "planned" | "estimated";
  head?: boolean;
  filters?: { op: "eq" | "in" | "gte"; column: string; value: unknown }[];
  orders?: { column: string; ascending?: boolean; nullsFirst?: boolean }[];
  limit?: number;
};

const isTransient = (error: { code?: string; message?: string } | null | undefined) =>
  !!error &&
  (error.code === "PGRST002" ||
    error.code === "503" ||
    /schema cache|database client|retrying|timeout|network/i.test(error.message ?? ""));

async function withRetries<T extends { error: { code?: string; message?: string } | null }>(run: () => PromiseLike<T> | Promise<T> | T) {
  let last: T | null = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    last = await run();
    if (!last.error || !isTransient(last.error)) return last;
    await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
  }
  return last!;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const Route = createFileRoute("/api/admin-data")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const admin = await assertStaffAccess(request);
        if (!admin.ok) return json({ ok: false, error: admin.error }, admin.status);

        const body = (await request.json().catch(() => null)) as AdminDataRequest | null;
        const table = body?.table;
        if (!table || !ALLOWED_TABLES.has(table)) return json({ ok: false, error: "Unsupported table" }, 400);

        const buildQuery = () => {
          let query = (admin.supabase as any)
            .from(table)
            .select(body.select ?? "*", { count: body.count, head: body.head });

          for (const filter of body.filters ?? []) {
            if (filter.op === "eq") query = query.eq(filter.column, filter.value);
            if (filter.op === "in") query = query.in(filter.column, Array.isArray(filter.value) ? filter.value : []);
            if (filter.op === "gte") query = query.gte(filter.column, filter.value);
          }

          for (const order of body.orders ?? []) {
            query = query.order(order.column, { ascending: order.ascending ?? true, nullsFirst: order.nullsFirst });
          }

          if (typeof body.limit === "number") query = query.limit(Math.max(1, Math.min(body.limit, 1000)));
          return query;
        };

        const { data, count, error } = await withRetries<{ data: unknown[] | null; count: number | null; error: { code?: string; message?: string } | null }>(
          async () => buildQuery(),
        );
        if (error) return json({ ok: false, error: error.message, code: error.code }, 500);
        return json({ ok: true, data: data ?? [], count: count ?? null });
      },
    },
  },
});