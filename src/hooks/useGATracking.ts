import { useEffect, useRef } from "react";
import { trackPageView, trackScrollDepth, trackEngagement } from "@/lib/google-analytics";

export function useGAPageTracking(pathname: string) {
  useEffect(() => {
    trackPageView(pathname, typeof document !== "undefined" ? document.title : undefined);
  }, [pathname]);
}

export function useGAScrollTracking(pageName: string) {
  const tracked = useRef<Set<number>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      [25, 50, 75, 90, 100].forEach((depth) => {
        if (scrollPercent >= depth && !tracked.current.has(depth)) {
          tracked.current.add(depth);
          trackScrollDepth(depth, pageName);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pageName]);
}

export function useGAEngagementTracking() {
  const visibleTime = useRef(0);
  const lastVisibleStart = useRef(Date.now());

  useEffect(() => {
    lastVisibleStart.current = Date.now();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        visibleTime.current += Date.now() - lastVisibleStart.current;
      } else {
        lastVisibleStart.current = Date.now();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (!document.hidden) {
        visibleTime.current += Date.now() - lastVisibleStart.current;
      }
      if (visibleTime.current >= 10000) {
        trackEngagement(visibleTime.current);
      }
    };
  }, []);
}
