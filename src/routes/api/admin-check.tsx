import { createFileRoute } from "@tanstack/react-router";

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

        const { data: roleRow, error: roleError } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleError) {
          return json({ ok: false, error: "Database error: " + roleError.message }, 500);
        }

        if (!roleRow) {
          return json({ ok: false, error: "You are not authorized as admin" }, 403);
        }

        return json({ ok: true });
      },
    },
  },
});