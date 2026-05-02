import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const STAFF_ROLES = ["super_admin", "admin", "manager", "editor"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

const jsonError = (error: string, status: number) => ({ ok: false as const, status, error });

function backendEnv() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !publishableKey) {
    const missing = [
      ...(!url ? ["SUPABASE_URL"] : []),
      ...(!publishableKey ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    return { ok: false as const, error: `Missing backend environment variable(s): ${missing.join(", ")}` };
  }

  return { ok: true as const, url, publishableKey, serviceRoleKey };
}

function createSupabaseClient(url: string, key: string, token?: string) {
  return createClient<Database>(url, key, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export async function assertStaffAccess(request: Request, allowedRoles: readonly StaffRole[] = STAFF_ROLES) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return jsonError("Missing auth token", 401);

  const env = backendEnv();
  if (!env.ok) return jsonError(env.error, 500);

  const token = authHeader.replace("Bearer ", "").trim();
  const authClient = createSupabaseClient(env.url, env.publishableKey, token);
  const supabase = env.serviceRoleKey
    ? createSupabaseClient(env.url, env.serviceRoleKey)
    : authClient;

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) {
    return jsonError(userError?.message ?? "Invalid auth token", 401);
  }

  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .in("role", [...allowedRoles]);

  if (roleError) return jsonError(roleError.message, 500);

  const roles = (roleRows ?? [])
    .map((row) => row.role as string)
    .filter((role): role is StaffRole => (allowedRoles as readonly string[]).includes(role));

  if (roles.length > 0) return { ok: true as const, supabase, userId: userData.user.id, roles };

  const { data: hasLegacyAccess, error: legacyError } = await (authClient as any).rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });

  if (legacyError) return jsonError(legacyError.message, 500);
  if (hasLegacyAccess) return { ok: true as const, supabase, userId: userData.user.id, roles: ["admin"] as StaffRole[] };

  return jsonError("Not authorized", 403);
}
