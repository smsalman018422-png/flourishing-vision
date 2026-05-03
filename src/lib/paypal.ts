import { supabase } from "@/integrations/supabase/client";

export type PayPalConfig = {
  clientId: string;
  mode: "sandbox" | "live";
  businessEmail: string;
};

export async function getPayPalSettings(): Promise<PayPalConfig> {
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["paypal_client_id", "paypal_mode", "paypal_business_email"]);

  const map: Record<string, string> = {};
  (data ?? []).forEach((row: { key: string; value: unknown }) => {
    const v = row.value as { v?: string; value?: string } | null;
    map[row.key] = v?.v ?? v?.value ?? "";
  });

  return {
    clientId: map.paypal_client_id || "",
    mode: (map.paypal_mode === "live" ? "live" : "sandbox") as "sandbox" | "live",
    businessEmail: map.paypal_business_email || "",
  };
}

let loadingPromise: Promise<void> | null = null;
let loadedClientId: string | null = null;

export function loadPayPalScript(clientId: string): Promise<void> {
  if (loadedClientId === clientId && (window as unknown as { paypal?: unknown }).paypal) {
    return Promise.resolve();
  }
  if (loadingPromise && loadedClientId === clientId) return loadingPromise;

  // reset
  const existing = document.getElementById("paypal-sdk");
  if (existing) existing.remove();
  loadedClientId = clientId;

  loadingPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.id = "paypal-sdk";
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loadingPromise = null;
      loadedClientId = null;
      reject(new Error("PayPal SDK failed to load"));
    };
    document.body.appendChild(s);
  });
  return loadingPromise;
}
