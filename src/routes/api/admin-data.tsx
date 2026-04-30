import { createFileRoute } from "@tanstack/react-router";

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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function assertAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return { ok: false as const, status: 401, error: "Missing auth token" };

  const token = authHeader.replace("Bearer ", "").trim();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return { ok: false as const, status: 401, error: userError?.message ?? "Invalid auth token" };
  }

  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) return { ok: false as const, status: 500, error: roleError.message };
  if (!roleRow) return { ok: false as const, status: 403, error: "Not authorized" };
  return { ok: true as const, supabaseAdmin };
}

export const Route = createFileRoute("/api/admin-data")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const admin = await assertAdmin(request);
        if (!admin.ok) return json({ ok: false, error: admin.error }, admin.status);

        const body = (await request.json().catch(() => null)) as AdminDataRequest | null;
        const table = body?.table;
        if (!table || !ALLOWED_TABLES.has(table)) return json({ ok: false, error: "Unsupported table" }, 400);

        let query = (admin.supabaseAdmin as any)
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

        const { data, count, error } = await query;
        if (error) return json({ ok: false, error: error.message, code: error.code }, 500);
        return json({ ok: true, data: data ?? [], count: count ?? null });
      },
    },
  },
});