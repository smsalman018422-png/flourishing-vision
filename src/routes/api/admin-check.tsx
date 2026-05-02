import { createFileRoute } from "@tanstack/react-router";

const STAFF_ROLES = ["super_admin", "admin", "manager", "editor"] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

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
          const { data: rows, error: rolesError } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", userData.user.id);

          if (rolesError) {
            return json({ ok: false, error: "Database error: " + rolesError.message }, 500);
          }

          const allRoles = (rows ?? []).map((r) => r.role as string);
          const roles = allRoles.filter((r): r is StaffRole =>
            (STAFF_ROLES as readonly string[]).includes(r),
          );
          if (roles.length > 0) {
            return json({ ok: true, roles });
          }

          const legacyClient = supabaseAdmin as unknown as {
            from: (table: string) => {
              select: (columns: string) => {
                or: (filters: string) => { maybeSingle: () => Promise<{ data: unknown; error: { code?: string; message?: string } | null }> };
              };
            };
          };
          const { data: legacyCheck, error: legacyError } = await legacyClient
            .from("admin_users")
            .select("id")
            .or(`id.eq.${userData.user.id},email.eq.${userData.user.email ?? ""}`)
            .maybeSingle();

          const legacyMissing = legacyError?.code === "42P01" || legacyError?.code === "PGRST205";
          if (legacyError && !legacyMissing) {
            return json({ ok: false, error: "Database error: " + legacyError.message }, 500);
          }

          if (legacyCheck) {
            await supabaseAdmin
              .from("user_roles")
              .upsert({ user_id: userData.user.id, role: "super_admin" }, { onConflict: "user_id,role" });
            return json({ ok: true, roles: ["super_admin"] });
          }

          return json({ ok: false, error: "You are not authorized as admin" }, 403);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Database error";
          return json({ ok: false, error: "Database error: " + message }, 500);
        }
      },
    },
  },
});
