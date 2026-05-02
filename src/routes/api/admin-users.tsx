import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const STAFF_ROLES = ["super_admin", "admin", "manager", "editor"] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function assertSuperAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return { ok: false as const, status: 401, error: "Missing auth token" };
  const token = authHeader.replace("Bearer ", "").trim();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) return { ok: false as const, status: 401, error: "Invalid auth token" };
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "super_admin")
    .limit(1);
  if (!roles || roles.length === 0) return { ok: false as const, status: 403, error: "Super admin only" };
  return { ok: true as const, userId: userData.user.id };
}

const createSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  full_name: z.string().trim().min(1).max(120),
  role: z.enum(["admin", "manager", "editor"]),
});

const updateRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(STAFF_ROLES),
});

const removeSchema = z.object({ user_id: z.string().uuid() });

export const Route = createFileRoute("/api/admin-users")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await assertSuperAdmin(request);
        if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: roleRows, error } = await supabaseAdmin
          .from("user_roles")
          .select("user_id, role, created_at")
          .in("role", STAFF_ROLES as unknown as string[]);
        if (error) return json({ ok: false, error: error.message }, 500);
        const userIds = Array.from(new Set((roleRows ?? []).map((r) => r.user_id)));
        const users: Array<{ id: string; email: string | null; last_sign_in_at: string | null }> = [];
        for (const uid of userIds) {
          const { data: u } = await supabaseAdmin.auth.admin.getUserById(uid);
          if (u?.user) users.push({ id: u.user.id, email: u.user.email ?? null, last_sign_in_at: u.user.last_sign_in_at ?? null });
        }
        const grouped = userIds.map((uid) => ({
          user_id: uid,
          email: users.find((u) => u.id === uid)?.email ?? null,
          last_sign_in_at: users.find((u) => u.id === uid)?.last_sign_in_at ?? null,
          roles: (roleRows ?? []).filter((r) => r.user_id === uid).map((r) => r.role),
        }));
        return json({ ok: true, users: grouped });
      },
      POST: async ({ request }) => {
        const auth = await assertSuperAdmin(request);
        if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);
        const body = await request.json().catch(() => null);
        const parsed = createSchema.safeParse(body);
        if (!parsed.success) return json({ ok: false, error: parsed.error.message }, 400);
        const { email, password, full_name, role } = parsed.data;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name },
        });
        if (createErr || !created.user) return json({ ok: false, error: createErr?.message ?? "Failed to create user" }, 500);
        const { error: roleErr } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: created.user.id, role });
        if (roleErr) return json({ ok: false, error: roleErr.message }, 500);
        return json({ ok: true, user_id: created.user.id });
      },
      PATCH: async ({ request }) => {
        const auth = await assertSuperAdmin(request);
        if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);
        const body = await request.json().catch(() => null);
        const parsed = updateRoleSchema.safeParse(body);
        if (!parsed.success) return json({ ok: false, error: parsed.error.message }, 400);
        const { user_id, role } = parsed.data;
        if (user_id === auth.userId && role !== "super_admin") {
          return json({ ok: false, error: "You cannot demote yourself" }, 400);
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", user_id)
          .in("role", STAFF_ROLES as unknown as string[]);
        const { error } = await supabaseAdmin.from("user_roles").insert({ user_id, role });
        if (error) return json({ ok: false, error: error.message }, 500);
        return json({ ok: true });
      },
      DELETE: async ({ request }) => {
        const auth = await assertSuperAdmin(request);
        if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);
        const body = await request.json().catch(() => null);
        const parsed = removeSchema.safeParse(body);
        if (!parsed.success) return json({ ok: false, error: parsed.error.message }, 400);
        if (parsed.data.user_id === auth.userId) {
          return json({ ok: false, error: "You cannot remove your own staff access" }, 400);
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", parsed.data.user_id)
          .in("role", STAFF_ROLES as unknown as string[]);
        if (error) return json({ ok: false, error: error.message }, 500);
        return json({ ok: true });
      },
    },
  },
});
