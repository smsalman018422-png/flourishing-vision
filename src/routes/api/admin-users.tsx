import { createFileRoute } from "@tanstack/react-router";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const STAFF_ROLES = ["super_admin", "admin", "manager", "editor"] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function backendEnv() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, publishableKey, serviceRoleKey };
}

function makeClient(url: string, key: string, token?: string) {
  return createClient<Database>(url, key, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

type AuthOk = {
  ok: true;
  userId: string;
  authClient: SupabaseClient<Database>;
  adminClient: SupabaseClient<Database> | null;
};
type AuthErr = { ok: false; status: number; error: string };

async function assertSuperAdmin(request: Request, requireServiceRole = false): Promise<AuthOk | AuthErr> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return { ok: false, status: 401, error: "Missing auth token" };
  const token = authHeader.replace("Bearer ", "").trim();

  const env = backendEnv();
  if (!env.url || !env.publishableKey) {
    return { ok: false, status: 500, error: "Missing Supabase environment configuration" };
  }
  if (requireServiceRole && !env.serviceRoleKey) {
    return { ok: false, status: 500, error: "Missing SUPABASE_SERVICE_ROLE_KEY for this operation" };
  }

  const authClient = makeClient(env.url, env.publishableKey, token);
  const adminClient = env.serviceRoleKey ? makeClient(env.url, env.serviceRoleKey) : null;

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) return { ok: false, status: 401, error: "Invalid auth token" };

  // Check super_admin role using the user's own session (RLS now allows admins to view all)
  const checkClient = adminClient ?? authClient;
  const { data: roles, error: roleErr } = await checkClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "super_admin")
    .limit(1);
  if (roleErr) return { ok: false, status: 500, error: roleErr.message };
  if (!roles || roles.length === 0) return { ok: false, status: 403, error: "Super admin only" };

  return { ok: true, userId: userData.user.id, authClient, adminClient };
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

        const db = auth.adminClient ?? auth.authClient;
        const { data: roleRows, error } = await db
          .from("user_roles")
          .select("user_id, role, created_at")
          .in("role", [...STAFF_ROLES]);
        if (error) return json({ ok: false, error: error.message }, 500);

        const userIds = Array.from(new Set((roleRows ?? []).map((r) => r.user_id)));

        // Try to enrich with auth.users (requires service role); fall back to client_profiles
        const userInfo = new Map<string, { email: string | null; last_sign_in_at: string | null }>();
        if (auth.adminClient) {
          for (const uid of userIds) {
            const { data: u } = await auth.adminClient.auth.admin.getUserById(uid);
            if (u?.user) userInfo.set(uid, { email: u.user.email ?? null, last_sign_in_at: u.user.last_sign_in_at ?? null });
          }
        } else if (userIds.length > 0) {
          const { data: profiles } = await db
            .from("client_profiles")
            .select("id, email")
            .in("id", userIds);
          for (const p of profiles ?? []) {
            userInfo.set(p.id, { email: p.email ?? null, last_sign_in_at: null });
          }
        }

        const grouped = userIds.map((uid) => ({
          user_id: uid,
          email: userInfo.get(uid)?.email ?? null,
          last_sign_in_at: userInfo.get(uid)?.last_sign_in_at ?? null,
          roles: (roleRows ?? []).filter((r) => r.user_id === uid).map((r) => r.role),
        }));
        return json({ ok: true, users: grouped });
      },
      POST: async ({ request }) => {
        const auth = await assertSuperAdmin(request, true);
        if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);
        const body = await request.json().catch(() => null);
        const parsed = createSchema.safeParse(body);
        if (!parsed.success) return json({ ok: false, error: parsed.error.message }, 400);
        const { email, password, full_name, role } = parsed.data;
        const admin = auth.adminClient!;
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name },
        });
        if (createErr || !created.user) return json({ ok: false, error: createErr?.message ?? "Failed to create user" }, 500);
        const { error: roleErr } = await admin.from("user_roles").insert({ user_id: created.user.id, role });
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
        const db = auth.adminClient ?? auth.authClient;
        await db.from("user_roles").delete().eq("user_id", user_id).in("role", [...STAFF_ROLES]);
        const { error } = await db.from("user_roles").insert({ user_id, role });
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
        const db = auth.adminClient ?? auth.authClient;
        const { error } = await db
          .from("user_roles")
          .delete()
          .eq("user_id", parsed.data.user_id)
          .in("role", [...STAFF_ROLES]);
        if (error) return json({ ok: false, error: error.message }, 500);
        return json({ ok: true });
      },
    },
  },
});
