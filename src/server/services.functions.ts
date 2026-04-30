import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PublicService = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  icon_name: string;
  features: string[];
  starts_at_price: number | null;
  order_index: number;
  is_visible: boolean;
};

export type ServiceDetail = PublicService & {
  long_description: string | null;
  process: { title: string; desc: string }[];
  packages: { name: string; price: number; features: string[] }[];
  service_type: string | null;
};

// Public list — SSR-loaded, no client waterfall.
export const getPublicServices = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("services")
    .select(
      "id, slug, title, short_description, icon_name, features, starts_at_price, order_index, is_visible",
    )
    .eq("is_visible", true)
    .order("order_index", { ascending: true })
    .limit(50);
  if (error) {
    console.error("[getPublicServices]", error.message);
    return [] as PublicService[];
  }
  return (data ?? []) as PublicService[];
});

// Light list for the contact form dropdown.
export const getServiceTitles = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("services")
    .select("id, title")
    .eq("is_visible", true)
    .order("order_index", { ascending: true });
  if (error) {
    console.error("[getServiceTitles]", error.message);
    return [] as { id: string; title: string }[];
  }
  return (data ?? []) as { id: string; title: string }[];
});

export const getServiceBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_visible", true)
      .maybeSingle();
    if (error) {
      console.error("[getServiceBySlug]", error.message);
      return null;
    }
    return (row ?? null) as ServiceDetail | null;
  });

export const getRelatedPortfolio = createServerFn({ method: "GET" })
  .inputValidator((d: { serviceType: string }) => d)
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("portfolio")
      .select("id, client_name, project_title, category, cover_image_url, roi_pct, slug")
      .eq("service_type", data.serviceType)
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .limit(3);
    if (error) {
      console.error("[getRelatedPortfolio]", error.message);
      return [];
    }
    return rows ?? [];
  });
