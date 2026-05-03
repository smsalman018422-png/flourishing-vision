import { useEffect, useRef } from "react";
import {
  trackPageView,
  trackScrollDepth,
  trackPageEngagement,
} from "@/lib/meta-pixel";

export function usePageViewTracking() {
  useEffect(() => {
    trackPageView();
  }, []);
}

export function useScrollTracking(pageName: string) {
  const tracked = useRef<Set<number>>(new Set());
  useEffect(() => {
    const handle = () => {
      const top = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h <= 0) return;
      const pct = Math.round((top / h) * 100);
      [25, 50, 75, 90].forEach((d) => {
        if (pct >= d && !tracked.current.has(d)) {
          tracked.current.add(d);
          trackScrollDepth(d, pageName);
        }
      });
    };
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, [pageName]);
}

export function useTimeTracking(pageName: string) {
  const start = useRef(Date.now());
  useEffect(() => {
    start.current = Date.now();
    return () => {
      const t = Math.round((Date.now() - start.current) / 1000);
      if (t >= 10) trackPageEngagement(pageName, t);
    };
  }, [pageName]);
}
