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
  "packages",
]);

const TABLE_COLUMNS: Record<string, readonly string[]> = {
  team_members: ["name", "role", "category", "bio", "photo_url", "linkedin_url", "skills", "is_founder", "is_visible", "sort_order"],
  portfolio: [
    "project_title",
    "client_name",
    "category",
    "service_type",
    "slug",
    "cover_image_url",
    "before_image_url",
    "after_image_url",
    "gallery_images",
    "challenge",
    "solution",
    "results",
    "roi_pct",
    "growth_pct",
    "revenue_label",
    "testimonial_quote",
    "testimonial_author",
    "testimonial_role",
    "is_visible",
    "is_featured",
    "sort_order",
  ],
  services: [
    "title",
    "slug",
    "short_description",
    "long_description",
    "icon_name",
    "features",
    "packages",
    "process",
    "starts_at_price",
    "service_type",
    "order_index",
    "is_visible",
  ],
  testimonials: ["author_name", "author_role", "company", "quote", "rating", "photo_url", "video_url", "video_thumbnail_url", "sort_order"],
  blog_posts: [
    "slug",
    "title",
    "excerpt",
    "content",
    "cover_image_url",
    "author_name",
    "author_role",
    "author_avatar_url",
    "category",
    "read_time_minutes",
    "is_featured",
    "published",
    "published_at",
  ],
  contact_submissions: ["status"],
  newsletter_subscribers: ["email"],
  site_settings: ["key", "value"],
  user_roles: ["user_id", "role"],
  packages: [
    "category",
    "name",
    "slug",
    "price_monthly",
    "price_yearly",
    "tagline",
    "description",
    "icon_name",
    "features",
    "best_for",
    "is_popular",
    "is_premium",
    "is_visible",
    "order_index",
    "cta_text",
    "cta_link",
  ],
};

const ARRAY_COLUMNS = new Set(["gallery_images", "skills"]);
const JSON_COLUMNS = new Set(["packages", "process", "value", "features"]);

type AdminWriteRequest = {
  table?: string;
  op?: "insert" | "update" | "delete" | "upsert";
  values?: Record<string, unknown> | Record<string, unknown>[];
  match?: { column: string; value: unknown }[];
  onConflict?: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function assertAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return { ok: false as const, status: 401, error: "Missing auth token" };

  const token = authHeader.replace("Bearer ", "").trim();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return { ok: false as const, status: 401, error: userError?.message ?? "Invalid auth token" };
  }

  const { data: roles, error: rolesError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .limit(1);

  if (rolesError) return { ok: false as const, status: 500, error: rolesError.message };
  if (!roles || roles.length === 0) return { ok: false as const, status: 403, error: "Not authorized" };
  return { ok: true as const, userId: userData.user.id };
}

function cleanValue(column: string, value: unknown) {
  if (value === undefined) return undefined;
  if (ARRAY_COLUMNS.has(column)) return Array.isArray(value) ? value : [];
  if (JSON_COLUMNS.has(column)) return value ?? null;
  return value;
}

function cleanRow(table: string, row: Record<string, unknown>) {
  const allowed = TABLE_COLUMNS[table] ?? [];
  const cleaned: Record<string, unknown> = {};
  for (const column of allowed) {
    const value = cleanValue(column, row[column]);
    if (value !== undefined) cleaned[column] = value;
  }
  return cleaned;
}

function cleanRows(table: string, values: AdminWriteRequest["values"]) {
  const rawRows = Array.isArray(values) ? values : values ? [values] : [];
  const rows = rawRows.map((row) => cleanRow(table, row)).filter((row) => Object.keys(row).length > 0);
  if (!rows.length) throw new Error("No valid values were provided");
  return rows;
}

function validateMatches(table: string, match: AdminWriteRequest["match"]) {
  if (!match?.length) throw new Error("A match condition is required");
  const allowed = new Set(["id", ...(TABLE_COLUMNS[table] ?? [])]);
  for (const item of match) {
    if (!allowed.has(item.column)) throw new Error(`Unsupported match column: ${item.column}`);
  }
  return match;
}

export const Route = createFileRoute("/api/admin-write")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const admin = await assertAdmin(request);
        if (!admin.ok) return json({ ok: false, error: admin.error }, admin.status);

        const body = (await request.json().catch(() => null)) as AdminWriteRequest | null;
        const table = body?.table;
        const op = body?.op;
        if (!table || !ALLOWED_TABLES.has(table)) return json({ ok: false, error: "Unsupported table" }, 400);
        if (!op || !["insert", "update", "delete", "upsert"].includes(op)) {
          return json({ ok: false, error: "Unsupported op" }, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        try {
          if (op === "insert") {
            const rows = cleanRows(table, body!.values);
            const { data, error } = await supabaseAdmin.from(table as any).insert(rows as any).select();
            if (error) return json({ ok: false, error: error.message, code: error.code }, 500);
            return json({ ok: true, data: data ?? [] });
          }

          if (op === "upsert") {
            const rows = cleanRows(table, body!.values);
            const onConflict = body!.onConflict || "id";
            const { data, error } = await supabaseAdmin
              .from(table as any)
              .upsert(rows as any, { onConflict })
              .select();
            if (error) return json({ ok: false, error: error.message, code: error.code }, 500);
            return json({ ok: true, data: data ?? [] });
          }

          if (op === "update") {
            const [row] = cleanRows(table, body!.values);
            const matches = validateMatches(table, body!.match);
            let q = supabaseAdmin.from(table as any).update(row as any);
            for (const m of matches) q = q.eq(m.column, m.value as any);
            const { data, error } = await q.select();
            if (error) return json({ ok: false, error: error.message, code: error.code }, 500);
            return json({ ok: true, data: data ?? [] });
          }

          // delete
          const matches = validateMatches(table, body!.match);
          let q = supabaseAdmin.from(table as any).delete();
          for (const m of matches) q = q.eq(m.column, m.value as any);
          const { data, error } = await q.select();
          if (error) return json({ ok: false, error: error.message, code: error.code }, 500);
          return json({ ok: true, data: data ?? [] });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Database write failed";
          return json({ ok: false, error: message }, 500);
        }
      },
    },
  },
});
