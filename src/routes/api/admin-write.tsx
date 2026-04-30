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

const TABLE_COLUMNS: Record<string, readonly string[]> = {
  team_members: ["name", "role", "bio", "photo_url", "linkedin_url", "twitter_url", "sort_order", "is_visible"],
  portfolio: [
    "title",
    "slug",
    "client_name",
    "category",
    "description",
    "challenge",
    "solution",
    "results",
    "cover_image_url",
    "gallery_urls",
    "metrics",
    "year",
    "is_featured",
    "is_published",
    "sort_order",
  ],
  services: [
    "title",
    "slug",
    "short_description",
    "description",
    "icon_name",
    "image_url",
    "features",
    "price_from",
    "order_index",
    "is_visible",
  ],
  testimonials: ["client_name", "client_role", "client_company", "quote", "photo_url", "rating", "sort_order", "is_visible"],
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
};

const ARRAY_COLUMNS = new Set(["gallery_urls", "features"]);
const JSON_COLUMNS = new Set(["metrics", "value"]);

const TRANSIENT_PATTERN = /schema cache|database client|retrying|timeout|network|terminating connection|connection terminated/i;

type AdminWriteRequest = {
  table?: string;
  op?: "insert" | "update" | "delete" | "upsert";
  values?: Record<string, unknown> | Record<string, unknown>[];
  match?: { column: string; value: unknown }[];
  onConflict?: string;
};

const isTransient = (error: { code?: string; message?: string } | null | undefined) =>
  !!error &&
  (error.code === "PGRST002" ||
    error.code === "503" ||
    error.code === "40001" ||
    error.code === "40P01" ||
    TRANSIENT_PATTERN.test(error.message ?? ""));

const normalizeError = (error: unknown) => ({
  code: typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "") : undefined,
  message: error instanceof Error ? error.message : "Database write failed",
});

async function withRetries<T extends { error: { code?: string; message?: string } | null }>(
  run: () => PromiseLike<T> | Promise<T> | T,
) {
  let last: T | null = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    last = await run();
    if (!last.error || !isTransient(last.error)) return last;
    await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
  }
  return last!;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function withDirectDb<T>(run: (sql: any) => Promise<T>) {
  const databaseUrl = process.env.SUPABASE_DB_URL;
  if (!databaseUrl) throw new Error("Database connection is not configured");

  const { default: postgres } = await import("postgres");
  const sql = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 1,
    connect_timeout: 10,
    prepare: false,
  });

  try {
    return await run(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function assertAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return { ok: false as const, status: 401, error: "Missing auth token" };

  const token = authHeader.replace("Bearer ", "").trim();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return { ok: false as const, status: 401, error: userError?.message ?? "Invalid auth token" };
  }

  const { data: roleRows, error: roleError } = await withRetries(async () => {
    try {
      const rows = await withDirectDb((sql) =>
        sql`select role from public.user_roles where user_id = ${userData.user.id} and role = 'admin'::public.app_role limit 1`,
      );
      return { data: rows as unknown[], error: null };
    } catch (error) {
      return { data: null, error: normalizeError(error) };
    }
  });

  if (roleError) return { ok: false as const, status: 500, error: roleError.message };
  if (!roleRows?.length) return { ok: false as const, status: 403, error: "Not authorized" };
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

function parseConflict(table: string, onConflict?: string) {
  const allowed = new Set(["id", ...(TABLE_COLUMNS[table] ?? [])]);
  const columns = (onConflict || "id")
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);
  if (!columns.length || columns.some((column) => !allowed.has(column))) throw new Error("Unsupported conflict column");
  return columns;
}

function buildWhere(sql: any, table: string, match: AdminWriteRequest["match"]) {
  const conditions = validateMatches(table, match);
  return conditions.reduce(
    (fragment, item, index) =>
      index === 0
        ? sql`where ${sql(item.column)} = ${item.value}`
        : sql`${fragment} and ${sql(item.column)} = ${item.value}`,
    sql``,
  );
}

async function runDirectWrite(body: AdminWriteRequest) {
  const table = body.table!;
  const op = body.op!;

  return withDirectDb(async (sql) => {
    if (op === "insert") {
      const rows = cleanRows(table, body.values);
      const columns = Object.keys(rows[0]);
      return sql`insert into public.${sql(table)} ${sql(rows, columns)} returning *`;
    }

    if (op === "upsert") {
      const rows = cleanRows(table, body.values);
      const columns = Object.keys(rows[0]);
      const conflictColumns = parseConflict(table, body.onConflict);
      return sql`
        insert into public.${sql(table)} ${sql(rows, columns)}
        on conflict (${sql(conflictColumns)}) do update set ${sql(rows[0], columns)}
        returning *
      `;
    }

    if (op === "update") {
      const [row] = cleanRows(table, body.values);
      const columns = Object.keys(row);
      const where = buildWhere(sql, table, body.match);
      return sql`update public.${sql(table)} set ${sql(row, columns)} ${where} returning *`;
    }

    const where = buildWhere(sql, table, body.match);
    return sql`delete from public.${sql(table)} ${where} returning *`;
  });
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

        const { data, error } = await withRetries<{ data: unknown[] | null; error: { code?: string; message?: string } | null }>(
          async () => {
            try {
              const rows = await runDirectWrite(body);
              return { data: rows as unknown[], error: null };
            } catch (error) {
              return { data: null, error: normalizeError(error) };
            }
          },
        );

        if (error) return json({ ok: false, error: error.message, code: error.code }, 500);
        return json({ ok: true, data: data ?? [] });
      },
    },
  },
});
