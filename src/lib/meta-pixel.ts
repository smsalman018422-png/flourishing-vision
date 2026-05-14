import { supabase } from "@/integrations/supabase/client";

interface PixelConfig {
  pixelId: string;
  enabled: boolean;
  testMode: boolean;
  testCode: string;
}

let pixelConfig: PixelConfig | null = null;
let pixelInitialized = false;
let configPromise: Promise<PixelConfig> | null = null;

const KEYS = [
  "meta_pixel_id",
  "meta_pixel_enabled",
  "meta_pixel_test_mode",
  "meta_pixel_test_code",
  "meta_pixel_test_activated_at",
];

function readVal(v: unknown): string | boolean | null {
  if (v && typeof v === "object" && "v" in (v as any)) return (v as any).v ?? null;
  if (v && typeof v === "object" && "value" in (v as any)) return (v as any).value ?? null;
  return v as any;
}

export async function getPixelConfig(): Promise<PixelConfig> {
  if (pixelConfig) return pixelConfig;
  if (configPromise) return configPromise;

  configPromise = (async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", KEYS);

      const settings: Record<string, any> = {};
      data?.forEach((s: any) => {
        settings[s.key] = readVal(s.value);
      });

      let testMode =
        settings.meta_pixel_test_mode === true || settings.meta_pixel_test_mode === "true";
      const activatedAt = settings.meta_pixel_test_activated_at;
      if (testMode && activatedAt) {
        const t = new Date(activatedAt).getTime();
        if (!isNaN(t) && (Date.now() - t) / 36e5 >= 24) testMode = false;
      }

      pixelConfig = {
        pixelId: settings.meta_pixel_id || "",
        enabled:
          settings.meta_pixel_enabled === true || settings.meta_pixel_enabled === "true",
        testMode,
        testCode: settings.meta_pixel_test_code || "",
      };
      return pixelConfig;
    } catch (err) {
      console.error("Failed to load pixel config:", err);
      pixelConfig = { pixelId: "", enabled: false, testMode: false, testCode: "" };
      return pixelConfig;
    } finally {
      configPromise = null;
    }
  })();

  return configPromise;
}

export function resetPixelConfig() {
  pixelConfig = null;
  pixelInitialized = false;
}

export async function initMetaPixel() {
  if (typeof window === "undefined" || pixelInitialized) return;
  const config = await getPixelConfig();
  if (!config.enabled || !config.pixelId) return;

  if ((window as any).fbq) {
    pixelInitialized = true;
    return;
  }

  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */

  (window as any).fbq("init", config.pixelId);
  pixelInitialized = true;
  console.log(
    `[Meta Pixel] Initialized — ID: ${config.pixelId} | Test Mode: ${config.testMode}`,
  );

  try {
    const ns = document.createElement("noscript");
    ns.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${config.pixelId}&ev=PageView&noscript=1" />`;
    document.body.appendChild(ns);
  } catch {}

  trackPageView();
}

async function fireEvent(
  method: "track" | "trackCustom",
  eventName: string,
  params?: Record<string, any>,
) {
  if (typeof window === "undefined") return;
  const config = await getPixelConfig();
  if (!config.enabled || !config.pixelId) return;
  if (!(window as any).fbq) await initMetaPixel();
  if (!(window as any).fbq) return;

  const eventData = params || {};
  if (config.testMode && config.testCode) {
    (window as any).fbq(method, eventName, eventData, {
      eventID: `${eventName}_${Date.now()}`,
    });
    console.log(
      `[Meta Pixel TEST] ${eventName}`,
      eventData,
      `Test Code: ${config.testCode}`,
    );
  } else {
    (window as any).fbq(method, eventName, eventData);
  }

  if (import.meta.env.DEV || config.testMode) {
    console.log(`[Meta Pixel] ${method}: ${eventName}`, eventData);
  }
}

// Standard
export function trackPageView() {
  fireEvent("track", "PageView");
}
export function trackViewContent(p: {
  content_name: string;
  content_category?: string;
  content_type?: string;
  value?: number;
  currency?: string;
}) {
  fireEvent("track", "ViewContent", { ...p, currency: p.currency || "USD" });
}
export function trackInitiateCheckout(p: {
  content_name: string;
  value: number;
  currency?: string;
  num_items?: number;
}) {
  fireEvent("track", "InitiateCheckout", {
    ...p,
    currency: p.currency || "USD",
    num_items: p.num_items || 1,
  });
}
export function trackLead(p?: { content_name?: string; value?: number; currency?: string }) {
  fireEvent("track", "Lead", {
    content_name: p?.content_name || "Contact Form",
    value: p?.value || 0,
    currency: p?.currency || "USD",
  });
}
export function trackCompleteRegistration(p?: { content_name?: string; value?: number }) {
  fireEvent("track", "CompleteRegistration", {
    content_name: p?.content_name || "Client Signup",
    value: p?.value || 0,
    currency: "USD",
  });
}
export function trackPurchase(p: { content_name: string; value: number; currency?: string }) {
  fireEvent("track", "Purchase", {
    ...p,
    currency: p.currency || "USD",
    content_type: "service",
  });
}
export function trackSchedule(p?: { content_name?: string }) {
  fireEvent("track", "Schedule", { content_name: p?.content_name || "Strategy Call" });
}
export function trackContact(p?: { content_name?: string }) {
  fireEvent("track", "Contact", { content_name: p?.content_name || "WhatsApp" });
}
export function trackSearch(s: string) {
  fireEvent("track", "Search", { search_string: s });
}
export function trackAddToCart(p: { content_name: string; value: number; currency?: string }) {
  fireEvent("track", "AddToCart", { ...p, currency: p.currency || "USD" });
}

// Custom
export function trackCTAClick(ctaName: string, pageName: string) {
  fireEvent("trackCustom", "CTAClick", { cta_name: ctaName, page_name: pageName });
}
export function trackScrollDepth(depth: number, pageName: string) {
  fireEvent("trackCustom", "ScrollDepth", { depth_percentage: depth, page_name: pageName });
}
export function trackPageEngagement(pageName: string, timeSpentSeconds: number) {
  fireEvent("trackCustom", "PageEngagement", {
    page_name: pageName,
    time_spent: timeSpentSeconds,
  });
}
export function trackPackageView(packageName: string, price: number) {
  fireEvent("trackCustom", "PackageView", {
    package_name: packageName,
    price,
    currency: "USD",
  });
}
export function trackNewsletterSubscribe() {
  fireEvent("trackCustom", "NewsletterSubscribe", { content_name: "Newsletter" });
}
export function trackWhatsAppClick(pageName: string) {
  fireEvent("trackCustom", "WhatsAppClick", { page_name: pageName });
}
export function trackFormStart(formName: string) {
  fireEvent("trackCustom", "FormStart", { form_name: formName });
}
export function trackFormSubmit(formName: string) {
  fireEvent("trackCustom", "FormSubmit", { form_name: formName });
}
