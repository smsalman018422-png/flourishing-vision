import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type AdminAuthResult =
  | { ok: true; userId: string; supabase: ReturnType<typeof createAdminUserClient> }
  | { ok: false; status: number; error: string };

function getPublicSupabaseEnv() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    const missing = [!url ? "SUPABASE_URL" : null, !key ? "SUPABASE_PUBLISHABLE_KEY" : null].filter(Boolean);
    throw new Error(`Missing backend environment variable(s): ${missing.join(", ")}`);
  }

  return { url, key };
}

function createAdminUserClient(token: string) {
  const { url, key } = getPublicSupabaseEnv();
  return createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function requireAdmin(request: Request): Promise<AdminAuthResult> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return { ok: false, status: 401, error: "Missing auth token" };

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const supabase = createAdminUserClient(token);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return { ok: false, status: 401, error: userError?.message ?? "Invalid auth token" };
    }

    const { data: isAdmin, error: rpcError } = await (supabase as any).rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });

    if (!rpcError) {
      return isAdmin === true
        ? { ok: true, userId: userData.user.id, supabase }
        : { ok: false, status: 403, error: "You are not authorized as admin" };
    }

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .in("role", ["admin", "super_admin"])
      .limit(1);

    if (rolesError) return { ok: false, status: 500, error: rolesError.message };
    if (!roles?.length) return { ok: false, status: 403, error: "You are not authorized as admin" };

    return { ok: true, userId: userData.user.id, supabase };
  } catch (error) {
    return { ok: false, status: 500, error: error instanceof Error ? error.message : "Admin check failed" };
  }
}