import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { PublicPackage } from "./packages.types";

export type { PublicPackage };

export const getPublicPackages = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.error("[getPublicPackages] missing Supabase env");
      return [] as PublicPackage[];
    }
    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("packages")
      .select(
        "id, category, name, slug, price_monthly, price_yearly, tagline, description, icon_name, features, best_for, is_popular, is_premium, is_visible, order_index, cta_text, cta_link",
      )
      .eq("is_visible", true)
      .order("category", { ascending: true })
      .order("order_index", { ascending: true })
      .limit(200);
    if (error) {
      console.error("[getPublicPackages] query error:", error.message);
      return [] as PublicPackage[];
    }
    return (data ?? []) as PublicPackage[];
  } catch (err) {
    console.error("[getPublicPackages] fatal:", err instanceof Error ? err.message : err);
    return [] as PublicPackage[];
  }
});
