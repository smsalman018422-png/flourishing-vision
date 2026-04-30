import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function withDirectDb<T>(run: (sql: any) => Promise<T>) {
  const databaseUrl = process.env.SUPABASE_DB_URL;
  if (!databaseUrl) throw new Error("Database connection is not configured");

  const { default: postgres } = await import("postgres");
  const sql = postgres(databaseUrl, { max: 1, idle_timeout: 1, connect_timeout: 10, prepare: false });
  try {
    return await run(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export const Route = createFileRoute("/api/admin-check")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return json({ ok: false, error: "Missing auth token" }, 401);
        }

        const token = authHeader.replace("Bearer ", "").trim();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !userData.user) {
          return json({ ok: false, error: userError?.message ?? "Invalid auth token" }, 401);
        }

        try {
          const roleRows = await withDirectDb((sql) =>
            sql`select role from public.user_roles where user_id = ${userData.user.id} and role = 'admin'::public.app_role limit 1`,
          );
          if (!roleRows.length) return json({ ok: false, error: "You are not authorized as admin" }, 403);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Database error";
          return json({ ok: false, error: "Database error: " + message }, 500);
        }

        return json({ ok: true });
      },
    },
  },
});