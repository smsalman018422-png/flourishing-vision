import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  contact_whatsapp?: string;
  contact_email?: string;
  contact_phone?: string;
  [key: string]: string | undefined;
};

const coerce = (v: unknown): string | undefined => {
  if (v == null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  // jsonb may wrap a scalar
  if (typeof v === "object") {
    const anyV = v as Record<string, unknown>;
    if (typeof anyV.value === "string") return anyV.value;
  }
  return undefined;
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase.from("site_settings").select("key,value");
      if (error) throw error;
      const out: SiteSettings = {};
      for (const row of data || []) {
        out[row.key] = coerce((row as { value: unknown }).value);
      }
      return out;
    },
    staleTime: 60_000,
  });
}

/** Normalize Bangladesh-style phone numbers to international form (no +). */
export function normalizeWhatsAppNumber(raw?: string): string {
  if (!raw) return "";
  let n = raw.replace(/\D/g, "");
  if (!n) return "";
  // strip leading zeros, then prepend BD code if missing
  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("0")) n = "880" + n.replace(/^0+/, "");
  if (n.length <= 10) n = "880" + n; // local number without country code
  return n;
}

export function buildWhatsAppHref(raw?: string, message?: string): string | null {
  const num = normalizeWhatsAppNumber(raw);
  if (!num) return null;
  const q = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${num}${q}`;
}

export function buildMailHref(email?: string): string | null {
  if (!email) return null;
  return `mailto:${email}`;
}

export function buildTelHref(phone?: string): string | null {
  if (!phone) return null;
  return `tel:${phone.replace(/\s+/g, "")}`;
}
