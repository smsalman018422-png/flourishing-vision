import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { PublicPackage } from "./packages.types";


export type { PublicPackage };

export const getPublicPackages = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data, error } = await supabaseAdmin
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
