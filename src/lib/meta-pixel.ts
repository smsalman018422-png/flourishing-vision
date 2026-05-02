// Meta Pixel (Facebook Pixel) helpers
const PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID as string | undefined) ?? "";
const DEBUG = !!import.meta.env.DEV;

export const META_PIXEL_ID = PIXEL_ID;

type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: unknown;
};

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

function debugLog(event: string, params?: unknown) {
  if (DEBUG) console.log("[Meta Pixel]", event, params ?? "");
}

export function initMetaPixel() {
  if (typeof window === "undefined" || !PIXEL_ID) return;
  if (window.fbq) return;

  /* eslint-disable */
  // Standard Facebook Pixel base snippet (typed-safe wrapper).
  (function (f: any, b: any, e: any, v: any) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e);
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */

  window.fbq?.("init", PIXEL_ID);
  window.fbq?.("track", "PageView");
  debugLog("init + PageView", { PIXEL_ID });
}

export function trackPageView() {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", "PageView");
  debugLog("PageView");
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.fbq) return;
  if (params) window.fbq("track", eventName, params);
  else window.fbq("track", eventName);
  debugLog(eventName, params);
}

export function trackCustomEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.fbq) return;
  if (params) window.fbq("trackCustom", eventName, params);
  else window.fbq("trackCustom", eventName);
  debugLog(`custom:${eventName}`, params);
}

// ============ Pre-built standard events ============

export function trackViewContent(params: {
  content_name: string;
  content_category: string;
  content_type: string;
  value?: number;
  currency?: string;
}) {
  trackEvent("ViewContent", { ...params, currency: params.currency || "USD" });
}

export function trackInitiateCheckout(params: {
  content_name: string;
  value: number;
  currency?: string;
  num_items?: number;
}) {
  trackEvent("InitiateCheckout", {
    ...params,
    currency: params.currency || "USD",
    num_items: params.num_items || 1,
  });
}

export function trackLead(params?: { content_name?: string; value?: number; currency?: string }) {
  trackEvent("Lead", {
    content_name: params?.content_name || "Contact Form",
    value: params?.value || 0,
    currency: params?.currency || "USD",
  });
}

export function trackCompleteRegistration(params?: {
  content_name?: string;
  value?: number;
  currency?: string;
}) {
  trackEvent("CompleteRegistration", {
    content_name: params?.content_name || "Client Signup",
    value: params?.value || 0,
    currency: params?.currency || "USD",
  });
}

export function trackPurchase(params: {
  content_name: string;
  value: number;
  currency?: string;
  content_type?: string;
}) {
  trackEvent("Purchase", {
    ...params,
    currency: params.currency || "USD",
    content_type: params.content_type || "service",
  });
}

export function trackSchedule(params?: { content_name?: string }) {
  trackEvent("Schedule", { content_name: params?.content_name || "Strategy Call" });
}

export function trackSearch(searchString: string) {
  trackEvent("Search", { search_string: searchString });
}

export function trackContact(params?: { content_name?: string }) {
  trackEvent("Contact", { content_name: params?.content_name || "WhatsApp" });
}

export function trackCustomPageEngagement(pageName: string, timeSpentSeconds: number) {
  trackCustomEvent("PageEngagement", { page_name: pageName, time_spent: timeSpentSeconds });
}

export function trackScrollDepth(depth: number, pageName: string) {
  trackCustomEvent("ScrollDepth", { depth_percentage: depth, page_name: pageName });
}

export function trackCTAClick(ctaName: string, pageName: string) {
  trackCustomEvent("CTAClick", { cta_name: ctaName, page_name: pageName });
}
