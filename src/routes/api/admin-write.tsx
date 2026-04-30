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
    /schema cache|database client|retrying|timeout|network/i.test(error.message ?? ""));

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

async function assertAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return { ok: false as const, status: 401, error: "Missing auth token" };

  const token = authHeader.replace("Bearer ", "").trim();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return { ok: false as const, status: 401, error: userError?.message ?? "Invalid auth token" };
  }

  const { data: roleRow, error: roleError } = await withRetries(async () =>
    supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle(),
  );

  if (roleError) return { ok: false as const, status: 500, error: roleError.message };
  if (!roleRow) return { ok: false as const, status: 403, error: "Not authorized" };
  return { ok: true as const, supabaseAdmin };
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
        if (!op || !["insert", "update", "delete", "upsert"].includes(op))
          return json({ ok: false, error: "Unsupported op" }, 400);

        const run = () => {
          const t = (admin.supabaseAdmin as any).from(table);
          if (op === "insert") return t.insert(body!.values ?? {}).select();
          if (op === "upsert")
            return t.upsert(body!.values ?? {}, body!.onConflict ? { onConflict: body!.onConflict } : undefined).select();
          if (op === "update") {
            let q = t.update(body!.values ?? {});
            for (const m of body!.match ?? []) q = q.eq(m.column, m.value);
            return q.select();
          }
          // delete
          let q = t.delete();
          for (const m of body!.match ?? []) q = q.eq(m.column, m.value);
          return q.select();
        };

        const { data, error } = await withRetries<{ data: unknown[] | null; error: { code?: string; message?: string } | null }>(
          async () => run(),
        );
        if (error) return json({ ok: false, error: error.message, code: error.code }, 500);
        return json({ ok: true, data: data ?? [] });
      },
    },
  },
});
