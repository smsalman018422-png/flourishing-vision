import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { PublicPackage } from "./packages.types";

export type { PublicPackage };

function normalizeCategory(c: string | null | undefined): string {
  if (!c) return "social_media";
  return c.toLowerCase().replace(/\s+/g, "_").replace(/-+/g, "_");
}

type RawRow = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  monthly_price: number | null;
  yearly_price: number | null;
  price_monthly: number | null;
  price_yearly: number | null;
  features: unknown;
  bonus_features: unknown;
  best_for: string | null;
  cta_text: string | null;
  is_popular: boolean | null;
  is_visible: boolean | null;
  sort_order: number | null;
};

function mapRow(r: RawRow): PublicPackage {
  const monthly = Number(r.monthly_price ?? r.price_monthly ?? 0);
  const yearly = Number(r.yearly_price ?? r.price_yearly ?? 0);
  const features = Array.isArray(r.features) ? (r.features as unknown[]) : [];
  const bonusFeatures = Array.isArray(r.bonus_features) ? (r.bonus_features as unknown[]) : [];
  const merged = [
    ...features.map((t) => ({ text: typeof t === "string" ? t : String((t as { text?: unknown })?.text ?? ""), type: "feature" as const })),
    ...bonusFeatures.map((t) => ({ text: typeof t === "string" ? t : String((t as { text?: unknown })?.text ?? ""), type: "bonus" as const })),
  ].filter((f) => f.text);

  return {
    id: r.id,
    category: normalizeCategory(r.category),
    name: r.name,
    slug: r.slug,
    price_monthly: monthly,
    price_yearly: yearly,
    tagline: null,
    description: r.description,
    icon_name: "Sparkles",
    features: merged,
    best_for: r.best_for,
    is_popular: !!r.is_popular,
    is_premium: false,
    is_visible: r.is_visible !== false,
    order_index: r.sort_order ?? 0,
    cta_text: r.cta_text || "Get Started",
    cta_link: "/contact",
  };
}

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
      .from("membership_plans")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("[getPublicPackages] query error:", error.message);
      return [] as PublicPackage[];
    }
    return ((data ?? []) as unknown as RawRow[]).map(mapRow);
  } catch (err) {
    console.error("[getPublicPackages] fatal:", err instanceof Error ? err.message : err);
    return [] as PublicPackage[];
  }
});
