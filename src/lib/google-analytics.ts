import { supabase } from "@/integrations/supabase/client";

interface GAConfig {
  measurementId: string;
  enabled: boolean;
  debugMode: boolean;
}

let gaConfig: GAConfig | null = null;
let gaInitialized = false;
let configPromise: Promise<GAConfig> | null = null;

const KEYS = ["ga_measurement_id", "ga_enabled", "ga_debug_mode"];

function readVal(v: unknown): string | boolean | null {
  if (v && typeof v === "object" && "v" in (v as any)) return (v as any).v ?? null;
  if (v && typeof v === "object" && "value" in (v as any)) return (v as any).value ?? null;
  return v as any;
}

export async function getGAConfig(): Promise<GAConfig> {
  if (gaConfig) return gaConfig;
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

      gaConfig = {
        measurementId: settings.ga_measurement_id || "",
        enabled: settings.ga_enabled === true || settings.ga_enabled === "true",
        debugMode: settings.ga_debug_mode === true || settings.ga_debug_mode === "true",
      };
      return gaConfig;
    } catch (err) {
      console.error("Failed to load GA config:", err);
      gaConfig = { measurementId: "", enabled: false, debugMode: false };
      return gaConfig;
    } finally {
      configPromise = null;
    }
  })();

  return configPromise;
}

export function resetGAConfig() {
  gaConfig = null;
  gaInitialized = false;
}

export async function initGoogleAnalytics() {
  if (typeof window === "undefined" || gaInitialized) return;

  const config = await getGAConfig();
  if (!config.enabled || !config.measurementId) return;

  const w = window as any;

  // Default consent (denied unless user previously accepted)
  w.dataLayer = w.dataLayer || [];
  function gtag(...args: any[]) {
    w.dataLayer.push(args);
  }
  w.gtag = gtag;

  const consent = typeof localStorage !== "undefined" ? localStorage.getItem("cookie_consent") : null;
  gtag("consent", "default", {
    analytics_storage: consent === "granted" ? "granted" : "denied",
    ad_storage: consent === "granted" ? "granted" : "denied",
    ad_user_data: consent === "granted" ? "granted" : "denied",
    ad_personalization: consent === "granted" ? "granted" : "denied",
  });

  // Load gtag.js
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${config.measurementId}`;
  document.head.appendChild(script);

  gtag("js", new Date());
  gtag("config", config.measurementId, {
    debug_mode: config.debugMode,
    send_page_view: false,
    anonymize_ip: true,
  });

  gaInitialized = true;
  console.log(`[GA4] Initialized — ID: ${config.measurementId} | Debug: ${config.debugMode}`);

  trackPageView(window.location.pathname);
}

async function fireEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;
  const config = await getGAConfig();
  if (!config.enabled) return;
  const w = window as any;
  if (!w.gtag) return;

  w.gtag("event", eventName, params || {});
  if (config.debugMode || import.meta.env.DEV) {
    console.log(`[GA4 Event] ${eventName}`, params);
  }
}

export function trackPageView(path: string, title?: string) {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (!w.gtag) return;
  getGAConfig().then((config) => {
    if (!config.enabled || !config.measurementId) return;
    w.gtag("event", "page_view", {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
    });
    if (config.debugMode || import.meta.env.DEV) {
      console.log(`[GA4 PageView] ${path}`);
    }
  });
}

export function trackEngagement(engagementTimeMs: number) {
  fireEvent("user_engagement", { engagement_time_msec: engagementTimeMs });
}

// E-commerce
export function trackViewItem(item: {
  item_id: string;
  item_name: string;
  item_category: string;
  price: number;
  currency?: string;
}) {
  fireEvent("view_item", {
    currency: item.currency || "USD",
    value: item.price,
    items: [{ ...item, currency: item.currency || "USD", quantity: 1 }],
  });
}

export function trackViewItemList(listName: string, items: any[]) {
  fireEvent("view_item_list", {
    item_list_id: listName.toLowerCase().replace(/\s+/g, "_"),
    item_list_name: listName,
    items: items.map((item, i) => ({
      item_id: item.id || item.slug,
      item_name: item.name,
      item_category: item.category,
      price: item.price_monthly || item.price || 0,
      index: i + 1,
    })),
  });
}

export function trackAddToCart(item: {
  item_id: string;
  item_name: string;
  price: number;
  currency?: string;
}) {
  fireEvent("add_to_cart", {
    currency: item.currency || "USD",
    value: item.price,
    items: [{ ...item, quantity: 1 }],
  });
}

export function trackBeginCheckout(value: number, items: any[]) {
  fireEvent("begin_checkout", { currency: "USD", value, items });
}

export function trackPurchase(params: {
  transactionId: string;
  value: number;
  currency?: string;
  itemName: string;
  itemId?: string;
}) {
  fireEvent("purchase", {
    transaction_id: params.transactionId,
    value: params.value,
    currency: params.currency || "USD",
    items: [
      {
        item_id: params.itemId || params.itemName.toLowerCase().replace(/\s+/g, "_"),
        item_name: params.itemName,
        price: params.value,
        quantity: 1,
      },
    ],
  });
}

// Lead gen
export function trackGenerateLead(source: string, value?: number) {
  fireEvent("generate_lead", { currency: "USD", value: value || 0, source });
}
export function trackSignUp(method: string = "email") {
  fireEvent("sign_up", { method });
}
export function trackLogin(method: string = "email") {
  fireEvent("login", { method });
}

// Engagement
export function trackSearch(searchTerm: string) {
  fireEvent("search", { search_term: searchTerm });
}
export function trackShare(contentType: string, itemId: string, method: string) {
  fireEvent("share", { content_type: contentType, item_id: itemId, method });
}
export function trackSelectContent(contentType: string, itemId: string) {
  fireEvent("select_content", { content_type: contentType, item_id: itemId });
}
export function trackDownload(fileName: string, fileExt: string) {
  fireEvent("file_download", { file_name: fileName, file_extension: fileExt });
}
export function trackVideoPlay(videoTitle: string) {
  fireEvent("video_start", { video_title: videoTitle });
}

// Custom
export function trackCTAClick(ctaName: string, location: string) {
  fireEvent("cta_click", { cta_name: ctaName, cta_location: location });
}
export function trackScrollDepth(percent: number, pageName: string) {
  fireEvent("scroll", { percent_scrolled: percent, page_name: pageName });
}
export function trackFormStart(formName: string) {
  fireEvent("form_start", { form_name: formName });
}
export function trackFormSubmit(formName: string, success: boolean = true) {
  fireEvent("form_submit", { form_name: formName, success });
}
export function trackWhatsAppClick(location: string) {
  fireEvent("contact", { method: "whatsapp", location });
}
export function trackPhoneClick() {
  fireEvent("contact", { method: "phone" });
}
export function trackEmailClick() {
  fireEvent("contact", { method: "email" });
}
export function trackTrialStart(planName: string = "7-Day Free Trial") {
  fireEvent("start_trial", { plan_name: planName, trial_duration_days: 7 });
}
export function trackTrialConvert(planName: string, value: number) {
  fireEvent("trial_convert", { plan_name: planName, value, currency: "USD" });
}

export function setUserId(userId: string, userProperties?: Record<string, any>) {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (!w.gtag) return;
  w.gtag("set", { user_id: userId });
  if (userProperties) w.gtag("set", "user_properties", userProperties);
}

export function setCustomDimension(key: string, value: string) {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (!w.gtag) return;
  w.gtag("set", "user_properties", { [key]: value });
}

// Consent helpers
export function grantConsent() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("cookie_consent", "granted");
  } catch {}
  const w = window as any;
  if (w.gtag) {
    w.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
  }
}

export function denyConsent() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("cookie_consent", "denied");
  } catch {}
  const w = window as any;
  if (w.gtag) {
    w.gtag("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
    });
  }
}
