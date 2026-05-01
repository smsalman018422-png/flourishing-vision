import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PublicPackage = {
  id: string;
  category: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  tagline: string | null;
  description: string | null;
  icon_name: string;
  features: unknown;
  best_for: string | null;
  is_popular: boolean;
  is_premium: boolean;
  is_visible: boolean;
  order_index: number;
  cta_text: string;
  cta_link: string;
};

export const getPublicPackages = createServerFn({ method: "GET" }).handler(async () => {
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
    console.error("[getPublicPackages]", error.message);
    return [] as PublicPackage[];
  }
  return (data ?? []) as PublicPackage[];
});
